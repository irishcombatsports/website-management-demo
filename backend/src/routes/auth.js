const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db/database');
const { authenticate } = require('../middleware/auth');
const { sendWelcome, sendWaiverConfirmation, sendPasswordReset } = require('../email');
const { createAdminNotification } = require('../notifications');

const router = express.Router();

const CHILD_WAIVER_VERSION = 'kids-waiver-v1';

function getChildForUser(childId, userId) {
  return db.prepare(`
    SELECT id, parent_user_id, first_name, last_name, date_of_birth, experience_level,
           preferred_classes, medical_notes, waiver_signed, waiver_signed_at,
           waiver_signed_by, waiver_version, created_at, updated_at
    FROM children
    WHERE id = ? AND parent_user_id = ?
  `).get(childId, userId);
}

// Register
router.post('/register', async (req, res) => {
  try {
    const acceptingMembers = db.prepare("SELECT value FROM app_settings WHERE key = 'accepting_members'").get()?.value !== 'false';
    if (!acceptingMembers) {
      return res.status(423).json({ error: 'The club is currently full. Please join the waiting list and we will contact you when a space opens.' });
    }

    const {
      full_name, email, password, phone, date_of_birth,
      experience_level, address,
      emergency_contact_name, emergency_contact_relationship, emergency_contact_phone,
      medical_notes
    } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const createUser = db.transaction((values) => {
      const promoteNext = db.prepare("SELECT value FROM app_settings WHERE key = 'promote_next_signup_admin'").get()?.value === 'true';
      const role = promoteNext ? 'admin' : 'member';
      const result = db.prepare(`
        INSERT INTO users (full_name, email, password_hash, phone, date_of_birth, experience_level,
          address, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, medical_notes, role)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(...values, role);

      if (promoteNext) {
        db.prepare(`
          INSERT INTO app_settings (key, value, updated_at)
          VALUES ('promote_next_signup_admin', 'false', datetime('now'))
          ON CONFLICT(key) DO UPDATE SET value = 'false', updated_at = datetime('now')
        `).run();
      }

      return db.prepare('SELECT id, full_name, email, role, is_coach, waiver_signed FROM users WHERE id = ?').get(result.lastInsertRowid);
    });

    const user = createUser([
      full_name.trim(),
      email.toLowerCase().trim(),
      password_hash,
      phone || null,
      date_of_birth || null,
      experience_level || 'beginner',
      address || null,
      emergency_contact_name || null,
      emergency_contact_relationship || null,
      emergency_contact_phone || null,
      medical_notes || null,
    ]);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Send welcome email (non-blocking)
    sendWelcome(user).catch(err => console.error('Welcome email failed:', err));
    createAdminNotification({
      type: 'new_signup',
      title: user.role === 'admin' ? 'New admin account created' : 'New member signed up',
      body: `${user.full_name} created an account${user.role === 'admin' ? ' and was promoted to admin automatically.' : '.'}`,
      memberId: user.id,
    });

    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password_hash, reset_token, reset_token_expires, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// Get current user
router.get('/me', authenticate, (req, res) => {
  const user = db.prepare(`
    SELECT u.id, u.full_name, u.email, u.phone, u.date_of_birth, u.experience_level,
           u.address, u.emergency_contact_name, u.emergency_contact_relationship,
           u.emergency_contact_phone, u.medical_notes, u.role, u.is_coach, u.waiver_signed,
           u.waiver_signed_at, u.created_at
    FROM users u WHERE u.id = ?
  `).get(req.user.id);

  if (!user) return res.status(404).json({ error: 'User not found' });

  const membership = db.prepare(`
    SELECT * FROM memberships
    WHERE user_id = ?
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
  `).get(req.user.id);

  res.json({ user, membership: membership || null });
});

// Child profiles for parent/guardian accounts
router.get('/children', authenticate, (req, res) => {
  const children = db.prepare(`
    SELECT id, first_name, last_name, date_of_birth, experience_level,
           preferred_classes, medical_notes, waiver_signed, waiver_signed_at,
           waiver_signed_by, waiver_version, created_at, updated_at
    FROM children
    WHERE parent_user_id = ?
    ORDER BY created_at DESC
  `).all(req.user.id);

  res.json({ children });
});

router.post('/children', authenticate, (req, res) => {
  const {
    first_name, last_name, date_of_birth, experience_level,
    preferred_classes, medical_notes,
  } = req.body;

  if (!first_name || !last_name) {
    return res.status(400).json({ error: 'Child first name and last name are required.' });
  }

  const result = db.prepare(`
    INSERT INTO children (
      parent_user_id, first_name, last_name, date_of_birth, experience_level,
      preferred_classes, medical_notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.user.id,
    first_name.trim(),
    last_name.trim(),
    date_of_birth || null,
    experience_level || 'beginner',
    preferred_classes || null,
    medical_notes || null
  );

  const child = getChildForUser(result.lastInsertRowid, req.user.id);
  const parent = db.prepare('SELECT id, full_name FROM users WHERE id = ?').get(req.user.id);
  createAdminNotification({
    type: 'child_profile',
    title: 'Child profile added',
    body: `${parent.full_name} added ${child.first_name} ${child.last_name}.`,
    memberId: parent.id,
  });

  res.status(201).json({ child });
});

router.put('/children/:id', authenticate, (req, res) => {
  const child = getChildForUser(req.params.id, req.user.id);
  if (!child) return res.status(404).json({ error: 'Child profile not found.' });

  const {
    first_name, last_name, date_of_birth, experience_level,
    preferred_classes, medical_notes,
  } = req.body;

  if (!first_name || !last_name) {
    return res.status(400).json({ error: 'Child first name and last name are required.' });
  }

  db.prepare(`
    UPDATE children
    SET first_name = ?, last_name = ?, date_of_birth = ?, experience_level = ?,
        preferred_classes = ?, medical_notes = ?, updated_at = datetime('now')
    WHERE id = ? AND parent_user_id = ?
  `).run(
    first_name.trim(),
    last_name.trim(),
    date_of_birth || null,
    experience_level || 'beginner',
    preferred_classes || null,
    medical_notes || null,
    req.params.id,
    req.user.id
  );

  res.json({ child: getChildForUser(req.params.id, req.user.id) });
});

router.post('/children/:id/waiver', authenticate, (req, res) => {
  const { agreed, guardian_name } = req.body;
  if (!agreed) return res.status(400).json({ error: 'You must agree to the child waiver.' });

  const child = getChildForUser(req.params.id, req.user.id);
  if (!child) return res.status(404).json({ error: 'Child profile not found.' });

  const parent = db.prepare('SELECT id, full_name, email FROM users WHERE id = ?').get(req.user.id);
  const signedBy = (guardian_name || parent.full_name).trim();

  db.prepare(`
    UPDATE children
    SET waiver_signed = 1,
        waiver_signed_at = ?,
        waiver_signed_by = ?,
        waiver_version = ?,
        updated_at = datetime('now')
    WHERE id = ? AND parent_user_id = ?
  `).run(new Date().toISOString(), signedBy, CHILD_WAIVER_VERSION, req.params.id, req.user.id);

  const updatedChild = getChildForUser(req.params.id, req.user.id);
  createAdminNotification({
    type: 'waiver_signed',
    title: 'Child waiver signed',
    body: `${signedBy} signed a guardian waiver for ${updatedChild.first_name} ${updatedChild.last_name}.`,
    memberId: parent.id,
  });

  res.json({ message: 'Child waiver signed successfully.', child: updatedChild });
});

// Forgot password
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const user = db.prepare('SELECT id, email, full_name FROM users WHERE email = ?').get(email.toLowerCase());

  // Always respond success to prevent email enumeration
  if (!user) return res.json({ message: 'If that email exists, a reset link has been sent.' });

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 3600000).toISOString(); // 1 hour

  db.prepare('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?')
    .run(token, expires, user.id);

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  sendPasswordReset(user, resetUrl).catch(err => console.error('Reset email failed:', err));

  res.json({ message: 'If that email exists, a reset link has been sent.' });
});

// Reset password
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token and password are required' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const user = db.prepare(
    'SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > ?'
  ).get(token, new Date().toISOString());

  if (!user) return res.status(400).json({ error: 'Invalid or expired reset link' });

  const password_hash = await bcrypt.hash(password, 12);
  db.prepare('UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?')
    .run(password_hash, user.id);

  res.json({ message: 'Password updated successfully' });
});

// Sign waiver
router.post('/waiver', authenticate, (req, res) => {
  const { agreed } = req.body;
  if (!agreed) return res.status(400).json({ error: 'You must agree to the waiver' });

  db.prepare('UPDATE users SET waiver_signed = 1, waiver_signed_at = ? WHERE id = ?')
    .run(new Date().toISOString(), req.user.id);

  // Send waiver confirmation email (non-blocking)
  const waiverUser = db.prepare('SELECT id, full_name, email FROM users WHERE id = ?').get(req.user.id);
  sendWaiverConfirmation(waiverUser).catch(err => console.error('Waiver email failed:', err));
  createAdminNotification({
    type: 'waiver_signed',
    title: 'Waiver signed',
    body: `${waiverUser.full_name} signed the online waiver.`,
    memberId: waiverUser.id,
  });

  res.json({ message: 'Waiver signed successfully' });
});

// Update profile
router.put('/profile', authenticate, (req, res) => {
  const { full_name, phone, address, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, medical_notes } = req.body;

  db.prepare(`
    UPDATE users SET full_name = ?, phone = ?, address = ?,
      emergency_contact_name = ?, emergency_contact_relationship = ?,
      emergency_contact_phone = ?, medical_notes = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(full_name, phone, address, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, medical_notes, req.user.id);

  const updated = db.prepare('SELECT id, full_name, email, phone, address, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, medical_notes, role, is_coach, waiver_signed FROM users WHERE id = ?').get(req.user.id);
  res.json({ user: updated });
});

module.exports = router;
