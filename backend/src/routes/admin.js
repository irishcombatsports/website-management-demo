const express = require('express');
const db = require('../db/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { sendContactMessage } = require('../email');
const { createAdminNotification } = require('../notifications');
const { getMonthEndIso } = require('../billing');

const router = express.Router();

const CLASS_SCHEDULE = {
  1: 'Kids Fundamentals',
  2: 'Mixed Training / Fundamentals',
  3: 'Kids Fundamentals / Fundamentals',
  4: 'Circuits / Mixed Training',
  5: 'Mixed Training / Fundamentals',
};

function isRestrictedClass(className) {
  return /(restricted|advanced|sparring)/i.test(className || '');
}

function getIrelandClassDay(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-IE', {
    timeZone: 'Europe/Dublin',
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const value = (type) => parts.find(p => p.type === type)?.value;
  const weekdayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const weekday = weekdayMap[value('weekday')];
  const classDate = `${value('year')}-${value('month')}-${value('day')}`;

  return {
    classDate,
    classId: classDate,
    className: CLASS_SCHEDULE[weekday] || 'No scheduled class',
    hasClass: Boolean(CLASS_SCHEDULE[weekday]),
  };
}

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin);

// Get dashboard stats
router.get('/stats', (req, res) => {
  const totalMembers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'member'").get();
  const childProfiles = db.prepare("SELECT COUNT(*) as count FROM children").get();
  const waiverSigned = db.prepare("SELECT COUNT(*) as count FROM users WHERE waiver_signed = 1").get();
  const activeMonthly = db.prepare(
    "SELECT COUNT(*) as count FROM memberships WHERE type IN ('monthly', 'limited_monthly') AND status = 'active' AND (starts_at IS NULL OR datetime(starts_at) <= datetime('now')) AND (expires_at IS NULL OR expires_at > datetime('now'))"
  ).get();
  const inactiveMemberships = db.prepare(`
    SELECT COUNT(*) as count
    FROM users u
    WHERE u.role = 'member'
      AND COALESCE(u.is_coach, 0) = 0
      AND NOT EXISTS (
        SELECT 1 FROM memberships m
        WHERE m.user_id = u.id
          AND m.status = 'active'
          AND (m.starts_at IS NULL OR datetime(m.starts_at) <= datetime('now'))
          AND (m.expires_at IS NULL OR datetime(m.expires_at) > datetime('now'))
      )
  `).get();
  const recentSignups = db.prepare(
    "SELECT COUNT(*) as count FROM users WHERE created_at > datetime('now', '-30 days') AND role = 'member'"
  ).get();

  res.json({
    totalMembers: totalMembers.count,
    childProfiles: childProfiles.count,
    waiverSigned: waiverSigned.count,
    activeMonthly: activeMonthly.count,
    inactiveMemberships: inactiveMemberships.count,
    recentSignups: recentSignups.count,
  });
});

// Get all members
router.get('/members', (req, res) => {
  const members = db.prepare(`
    SELECT u.id, u.full_name, u.email, u.phone, u.experience_level,
           u.waiver_signed, u.waiver_signed_at, u.is_coach, u.created_at,
           m.type as membership_type, m.status as membership_status,
           m.starts_at, m.expires_at, m.amount_paid,
           (SELECT COUNT(*) FROM children c WHERE c.parent_user_id = u.id) as child_count,
           (SELECT COUNT(*) FROM children c WHERE c.parent_user_id = u.id AND c.waiver_signed = 0) as unsigned_child_waivers,
           (SELECT COUNT(*) FROM children c WHERE c.parent_user_id = u.id AND c.medical_notes IS NOT NULL AND TRIM(c.medical_notes) != '') as child_medical_notes_count
    FROM users u
    LEFT JOIN memberships m ON m.id = (
      SELECT id FROM memberships
      WHERE user_id = u.id
      ORDER BY
        CASE
          WHEN status = 'active'
            AND (starts_at IS NULL OR datetime(starts_at) <= datetime('now'))
            AND (expires_at IS NULL OR datetime(expires_at) > datetime('now')) THEN 0
          WHEN status = 'active'
            AND starts_at IS NOT NULL
            AND datetime(starts_at) > datetime('now') THEN 1
          ELSE 2
        END,
        created_at DESC
      LIMIT 1
    )
    WHERE u.role = 'member'
    ORDER BY u.created_at DESC
  `).all();

  res.json({ members });
});

// Get public join settings
router.get('/settings', (req, res) => {
  const acceptingMembers = db.prepare("SELECT value FROM app_settings WHERE key = 'accepting_members'").get()?.value !== 'false';
  res.json({ acceptingMembers });
});

// Update public join settings
router.patch('/settings', (req, res) => {
  const acceptingMembers = req.body.acceptingMembers === true;
  db.prepare(`
    INSERT INTO app_settings (key, value, updated_at)
    VALUES ('accepting_members', ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `).run(acceptingMembers ? 'true' : 'false');

  createAdminNotification({
    type: 'settings',
    title: acceptingMembers ? 'Membership applications opened' : 'Waiting list enabled',
    body: acceptingMembers
      ? 'Public join buttons now point to member registration.'
      : 'Public join buttons now point to the waiting list.',
  });

  res.json({ acceptingMembers });
});

// Get waiting list entries
router.get('/waiting-list', (req, res) => {
  const entries = db.prepare(`
    SELECT id, name, email, phone, experience_level, preferred_classes, notes, status, created_at, updated_at
    FROM waiting_list
    WHERE status != 'removed'
    ORDER BY
      CASE status
        WHEN 'waiting' THEN 0
        WHEN 'contacted' THEN 1
        WHEN 'invited' THEN 2
        WHEN 'joined' THEN 3
        ELSE 4
      END,
      created_at DESC
  `).all();

  res.json({ entries });
});

// Update waiting list status
router.patch('/waiting-list/:id', (req, res) => {
  const { status } = req.body;
  if (!['waiting', 'contacted', 'invited', 'joined', 'removed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid waiting list status.' });
  }

  const entry = db.prepare('SELECT id, name FROM waiting_list WHERE id = ?').get(req.params.id);
  if (!entry) return res.status(404).json({ error: 'Waiting list entry not found.' });

  db.prepare('UPDATE waiting_list SET status = ?, updated_at = datetime(\'now\') WHERE id = ?')
    .run(status, req.params.id);

  res.json({ message: 'Waiting list updated.', status });
});

// Get all merch pre-orders
router.get('/pre-orders', (req, res) => {
  const preOrders = db.prepare(`
    SELECT id, product, name, email, phone, size, quantity, notes, status, created_at
    FROM merch_pre_orders
    ORDER BY created_at DESC
  `).all();

  res.json({ preOrders });
});

// Get single member
router.get('/members/:id', (req, res) => {
  const user = db.prepare(`
    SELECT id, full_name, email, phone, date_of_birth, experience_level,
           address, emergency_contact_name, emergency_contact_relationship,
           emergency_contact_phone, medical_notes, waiver_signed, waiver_signed_at, is_coach, created_at
    FROM users WHERE id = ? AND role = 'member'
  `).get(req.params.id);

  if (!user) return res.status(404).json({ error: 'Member not found' });

  const memberships = db.prepare(
    'SELECT * FROM memberships WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.params.id);

  const children = db.prepare(`
    SELECT id, first_name, last_name, date_of_birth, experience_level,
           preferred_classes, medical_notes, waiver_signed, waiver_signed_at,
           waiver_signed_by, waiver_version, created_at, updated_at
    FROM children
    WHERE parent_user_id = ?
    ORDER BY created_at DESC
  `).all(req.params.id);

  res.json({ user, memberships, children });
});

// Delete a member and all their data
router.delete('/members/:id', (req, res) => {
  const user = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'member'").get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Member not found' });

  db.prepare('DELETE FROM memberships WHERE user_id = ?').run(req.params.id);
  db.prepare('DELETE FROM password_resets WHERE user_id = ?').run(req.params.id);
  db.prepare('DELETE FROM admin_notifications WHERE member_id = ?').run(req.params.id);
  db.prepare('DELETE FROM attendance WHERE member_id = ?').run(req.params.id);
  db.prepare('DELETE FROM children WHERE parent_user_id = ?').run(req.params.id);
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);

  res.json({ message: 'Member deleted' });
});

// Update member status (e.g. manually activate/deactivate)
router.patch('/members/:id/membership', (req, res) => {
  const { status } = req.body;
  if (!['active', 'inactive', 'expired'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  db.prepare(`
    UPDATE memberships SET status = ? WHERE user_id = ? AND id = (
      SELECT id FROM memberships WHERE user_id = ? ORDER BY created_at DESC LIMIT 1
    )
  `).run(status, req.params.id, req.params.id);

  res.json({ message: 'Membership updated' });
});

// Record a cash/bank-transfer payment manually
router.post('/members/:id/manual-payment', (req, res) => {
  const { type, amount_paid, note } = req.body;
  if (!['monthly', 'limited_monthly', 'drop_in'].includes(type)) {
    return res.status(400).json({ error: 'Invalid payment type' });
  }

  const user = db.prepare("SELECT id, full_name FROM users WHERE id = ? AND role = 'member'").get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Member not found' });

  const starts = new Date().toISOString();
  const expires = ['monthly', 'limited_monthly'].includes(type)
    ? getMonthEndIso()
    : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const amount = Number.isFinite(Number(amount_paid))
    ? Math.round(Number(amount_paid) * 100)
    : (type === 'monthly' ? 8000 : type === 'limited_monthly' ? 6000 : 1000);

  const result = db.prepare(`
    INSERT INTO memberships (
      user_id, type, status, stripe_payment_intent_id, amount_paid, starts_at, expires_at, class_preference
    ) VALUES (?, ?, 'active', ?, ?, ?, ?, ?)
  `).run(
    user.id,
    type,
    `manual_${Date.now()}`,
    amount,
    starts,
    expires,
    note ? `Manual payment: ${note}` : 'Manual payment'
  );

  createAdminNotification({
    type: type === 'drop_in' ? 'drop_in' : 'monthly',
    title: type === 'drop_in' ? 'Manual drop-in payment recorded' : type === 'limited_monthly' ? 'Manual limited monthly payment recorded' : 'Manual monthly payment recorded',
    body: `${user.full_name} was marked as paid manually.`,
    memberId: user.id,
  });

  const membership = db.prepare('SELECT * FROM memberships WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ message: 'Manual payment recorded', membership });
});

// Mark or unmark a member as a coach account
router.patch('/members/:id/coach', (req, res) => {
  const isCoach = req.body.is_coach === true;
  const user = db.prepare("SELECT id, full_name FROM users WHERE id = ? AND role = 'member'").get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Member not found' });

  db.prepare('UPDATE users SET is_coach = ?, updated_at = datetime(\'now\') WHERE id = ?')
    .run(isCoach ? 1 : 0, user.id);

  createAdminNotification({
    type: 'coach_status',
    title: isCoach ? 'Coach status enabled' : 'Coach status removed',
    body: `${user.full_name} was ${isCoach ? 'marked' : 'unmarked'} as a coach.`,
    memberId: user.id,
  });

  res.json({ message: 'Coach status updated', is_coach: isCoach ? 1 : 0 });
});

// Mark a free trial as used
router.patch('/members/:id/free-trial-used', (req, res) => {
  const user = db.prepare("SELECT id, full_name FROM users WHERE id = ? AND role = 'member'").get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Member not found' });

  const trial = db.prepare(`
    SELECT id FROM memberships
    WHERE user_id = ? AND type = 'free_class' AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1
  `).get(user.id);

  if (!trial) {
    return res.status(404).json({ error: 'No active free trial found for this member.' });
  }

  db.prepare(`
    UPDATE memberships
    SET status = 'expired',
        expires_at = ?,
        class_preference = COALESCE(NULLIF(class_preference, ''), 'Free trial used')
    WHERE id = ?
  `).run(new Date().toISOString(), trial.id);

  createAdminNotification({
    type: 'free_class',
    title: 'Free trial marked as used',
    body: `${user.full_name}'s free trial was marked as used.`,
    memberId: user.id,
  });

  const membership = db.prepare('SELECT * FROM memberships WHERE id = ?').get(trial.id);
  res.json({ message: 'Free trial marked as used', membership });
});

// Get today's active members for class sign-in
router.get('/attendance/today', (req, res) => {
  const classDay = getIrelandClassDay();
  const members = db.prepare(`
    SELECT u.id, u.full_name, u.email, latest.type as membership_type, latest.status as membership_status,
           latest.expires_at, u.is_coach, a.id as attendance_id, a.signed_in_at
    FROM users u
    JOIN memberships latest ON latest.id = (
      SELECT m.id FROM memberships m
      WHERE m.user_id = u.id
        AND m.status = 'active'
        AND (m.starts_at IS NULL OR datetime(m.starts_at) <= datetime('now'))
        AND (m.expires_at IS NULL OR datetime(m.expires_at) > datetime('now'))
      ORDER BY m.created_at DESC
      LIMIT 1
    )
    LEFT JOIN attendance a ON a.member_id = u.id AND a.class_date = ?
    WHERE u.role = 'member'
      AND COALESCE(u.is_coach, 0) = 0
      AND NOT (? = 1 AND latest.type = 'limited_monthly')
    ORDER BY u.full_name COLLATE NOCASE ASC
  `).all(classDay.classDate, isRestrictedClass(classDay.className) ? 1 : 0);

  res.json({ classDay, members });
});

// Sign a member into today's class
router.post('/attendance/sign-in', (req, res) => {
  const { member_id } = req.body;
  const classDay = getIrelandClassDay();

  if (!classDay.hasClass) {
    return res.status(400).json({ error: 'There is no scheduled class today.' });
  }

  const member = db.prepare(`
    SELECT u.id, u.full_name, u.is_coach, latest.type as membership_type
    FROM users u
    JOIN memberships latest ON latest.id = (
      SELECT m.id FROM memberships m
      WHERE m.user_id = u.id
        AND m.status = 'active'
        AND (m.starts_at IS NULL OR datetime(m.starts_at) <= datetime('now'))
        AND (m.expires_at IS NULL OR datetime(m.expires_at) > datetime('now'))
      ORDER BY m.created_at DESC
      LIMIT 1
    )
    WHERE u.id = ? AND u.role = 'member'
      AND COALESCE(u.is_coach, 0) = 0
  `).get(member_id);

  if (!member) {
    return res.status(404).json({ error: 'Active member not found' });
  }

  const existing = db.prepare(
    'SELECT * FROM attendance WHERE member_id = ? AND class_date = ?'
  ).get(member.id, classDay.classDate);
  if (existing) {
    return res.status(409).json({ error: 'Member already signed in for this class.', attendance: existing });
  }

  if (member.membership_type === 'limited_monthly' && isRestrictedClass(classDay.className)) {
    return res.status(403).json({ error: 'This membership does not include restricted training classes.' });
  }

  if (member.membership_type === 'limited_monthly') {
    const weekStart = new Date(`${classDay.classDate}T00:00:00.000Z`);
    const day = weekStart.getUTCDay();
    const offset = day === 0 ? 6 : day - 1;
    weekStart.setUTCDate(weekStart.getUTCDate() - offset);
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 7);
    const usedThisWeek = db.prepare(`
      SELECT COUNT(*) as count
      FROM attendance
      WHERE member_id = ?
        AND class_date >= ?
        AND class_date < ?
    `).get(member.id, weekStart.toISOString().slice(0, 10), weekEnd.toISOString().slice(0, 10));

    if (usedThisWeek.count >= 2) {
      return res.status(403).json({ error: 'This member has already used their 2 classes this week.' });
    }
  }

  const signedInAt = new Date().toISOString();
  try {
    const result = db.prepare(`
      INSERT INTO attendance (
        member_id, member_name, class_id, class_date, class_name, signed_in_at, admin_id, admin_email
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      member.id,
      member.full_name,
      classDay.classId,
      classDay.classDate,
      classDay.className,
      signedInAt,
      req.user.id || null,
      req.user.email || null
    );

    const attendance = db.prepare('SELECT * FROM attendance WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ message: 'Attendance recorded', attendance });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      const duplicate = db.prepare(
        'SELECT * FROM attendance WHERE member_id = ? AND class_date = ?'
      ).get(member.id, classDay.classDate);
      return res.status(409).json({ error: 'Member already signed in for this class.', attendance: duplicate });
    }
    throw err;
  }
});

// View attendance history with optional filters
router.get('/attendance', (req, res) => {
  const { date, member, class: classFilter } = req.query;
  const where = [];
  const params = [];

  if (date) {
    where.push('class_date = ?');
    params.push(date);
  }
  if (member) {
    where.push('(member_name LIKE ? OR CAST(member_id AS TEXT) = ?)');
    params.push(`%${member}%`, member);
  }
  if (classFilter) {
    where.push('(class_name LIKE ? OR class_id = ?)');
    params.push(`%${classFilter}%`, classFilter);
  }

  const rows = db.prepare(`
    SELECT *
    FROM attendance
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY signed_in_at DESC
    LIMIT 200
  `).all(...params);

  res.json({ attendance: rows });
});

// Test email config
router.post('/test-email', async (req, res) => {
  try {
    await sendContactMessage({
      name: 'MB Admin Test',
      email: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      message: 'This is a test email from the admin panel to confirm your email settings are working correctly.',
    });
    res.json({ ok: true, message: `Test email sent to ${process.env.ADMIN_EMAIL || process.env.EMAIL_USER}! Check your inbox.` });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || String(err) });
  }
});

// Get admin notifications
router.get('/notifications', (req, res) => {
  const notifications = db.prepare(`
    SELECT n.*, u.full_name as member_name, u.email as member_email
    FROM admin_notifications n
    LEFT JOIN users u ON u.id = n.member_id
    ORDER BY n.created_at DESC
    LIMIT 100
  `).all();

  res.json({ notifications });
});

// Mark one notification as read
router.patch('/notifications/:id/read', (req, res) => {
  db.prepare('UPDATE admin_notifications SET read = 1 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Mark all notifications as read
router.patch('/notifications/read-all', (req, res) => {
  db.prepare('UPDATE admin_notifications SET read = 1 WHERE read = 0').run();
  res.json({ ok: true });
});

// Get contact messages
router.get('/contact-messages', (req, res) => {
  const messages = db.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC').all();
  res.json({ messages });
});

// Mark a contact message as read
router.patch('/contact-messages/:id/read', (req, res) => {
  db.prepare('UPDATE contact_messages SET read = 1 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
