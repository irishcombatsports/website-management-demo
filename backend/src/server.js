require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const bcrypt = require('bcryptjs');

const authRoutes = require('./routes/auth');
const stripeRoutes = require('./routes/stripe');
const adminRoutes = require('./routes/admin');
const contactRoutes = require('./routes/contact');
const preorderRoutes = require('./routes/preorders');
const settingsRoutes = require('./routes/settings');
const waitingListRoutes = require('./routes/waitingList');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';
const HOST = process.env.HOST || (isProd ? '0.0.0.0' : '127.0.0.1');

const db = require('./db/database');

async function bootstrapAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;
  if (password.length < 8) {
    console.warn('ADMIN_PASSWORD must be at least 8 characters. Admin bootstrap skipped.');
    return;
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  const passwordHash = await bcrypt.hash(password, 12);
  if (existing) {
    db.prepare(`
      UPDATE users
      SET password_hash = ?, role = 'admin', updated_at = datetime('now')
      WHERE id = ?
    `).run(passwordHash, existing.id);
    console.log(`Admin account updated for ${email}`);
    return;
  }

  db.prepare(`
    INSERT INTO users (full_name, email, password_hash, role, waiver_signed)
    VALUES (?, ?, ?, 'admin', 1)
  `).run('Club Admin', email.toLowerCase().trim(), passwordHash);
  console.log(`Admin account created for ${email}`);
}

// Stripe webhook needs raw body - must be before express.json()
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

if (!isProd) {
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    cpurpleentials: true,
  }));
}

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/preorders', preorderRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/waiting-list', waitingListRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve built frontend in production
if (isProd) {
  const frontendDist = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

bootstrapAdmin()
  .catch(err => console.error('Admin bootstrap failed:', err))
  .finally(() => {
    app.listen(PORT, HOST, () => {
      console.log(`Training Club running on http://${HOST}:${PORT}`);
    });
  });

// ── Renewal reminder cron — runs daily at 9am ────────────────────────────
const { sendRenewalReminder } = require('./email');
const { createAdminNotification } = require('./notifications');
const { getMonthEndIso, isLastWeekOfMonth } = require('./billing');

cron.schedule('0 9 * * *', async () => {
  console.log('⏰ Running renewal reminder check...');
  try {
    const monthEnd = getMonthEndIso();

    // Monthly memberships always reset at month end, even if paid mid-month.
    db.prepare(`
      UPDATE memberships
      SET expires_at = ?
      WHERE status = 'active'
        AND type IN ('monthly', 'limited_monthly')
        AND (starts_at IS NULL OR datetime(starts_at) <= datetime(?))
        AND (expires_at IS NULL OR expires_at > ?)
    `).run(monthEnd, monthEnd, monthEnd);

    if (!isLastWeekOfMonth()) {
      console.log('   Not the last week of the month. No renewal reminders needed today.');
      return;
    }

    // Find active monthly memberships due to reset at month end, reminder not yet sent
    const expiring = db.prepare(`
      SELECT m.*, u.id as user_id, u.email, u.full_name
      FROM memberships m
      JOIN users u ON u.id = m.user_id
      WHERE m.status = 'active'
        AND m.type IN ('monthly', 'limited_monthly')
        AND m.reminder_sent = 0
        AND (m.starts_at IS NULL OR datetime(m.starts_at) <= datetime('now'))
        AND m.expires_at > datetime('now')
        AND m.expires_at <= ?
    `).all(monthEnd);

    for (const row of expiring) {
      createAdminNotification({
        type: 'renewal',
        title: 'Membership renewal due',
        body: `${row.full_name}'s monthly membership expires on ${new Date(row.expires_at).toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' })}.`,
        memberId: row.user_id,
      });

      try {
        await sendRenewalReminder({ email: row.email, full_name: row.full_name }, row);
        console.log(`OK Renewal reminder sent to ${row.email}`);
      } catch (err) {
        console.error(`❌ Failed to send renewal reminder to ${row.email}:`, err.message);
      }

      db.prepare('UPDATE memberships SET reminder_sent = 1 WHERE id = ?').run(row.id);
    }

    if (expiring.length === 0) console.log('   No reminders needed today.');
  } catch (err) {
    console.error('Renewal reminder cron error:', err);
  }
}, { timezone: 'Europe/Dublin' });
