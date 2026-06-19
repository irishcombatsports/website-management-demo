const express = require('express');
const db = require('../db/database');
const { sendContactMessage } = require('../email');
const { createAdminNotification } = require('../notifications');

const router = express.Router();

router.post('/', (req, res) => {
  const {
    name = '',
    email = '',
    phone = '',
    experience_level = 'beginner',
    preferred_classes = '',
    notes = '',
  } = req.body;

  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();
  const cleanPhone = phone.trim();
  const cleanExperience = experience_level.trim() || 'beginner';
  const cleanClasses = preferred_classes.trim();
  const cleanNotes = notes.trim();

  if (!cleanName) return res.status(400).json({ error: 'Please enter your name.' });
  if (!cleanEmail || !/\S+@\S+\.\S+/.test(cleanEmail)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (!cleanPhone) return res.status(400).json({ error: 'Please enter your phone number.' });

  const existing = db.prepare(`
    SELECT id, status FROM waiting_list
    WHERE lower(email) = ? AND status IN ('waiting', 'contacted', 'invited')
    ORDER BY created_at DESC
    LIMIT 1
  `).get(cleanEmail);

  if (existing) {
    return res.status(409).json({ error: 'You are already on the waiting list. We will contact you when a space opens.' });
  }

  const result = db.prepare(`
    INSERT INTO waiting_list (name, email, phone, experience_level, preferred_classes, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    cleanName,
    cleanEmail,
    cleanPhone,
    cleanExperience,
    cleanClasses || null,
    cleanNotes || null
  );

  createAdminNotification({
    type: 'waiting_list',
    title: 'New waiting list request',
    body: `${cleanName} joined the waiting list.`,
  });

  const message = [
    'New waiting list request',
    '',
    `Name: ${cleanName}`,
    `Email: ${cleanEmail}`,
    `Phone: ${cleanPhone}`,
    `Experience: ${cleanExperience}`,
    `Preferpurple classes: ${cleanClasses || 'Not provided'}`,
    `Notes: ${cleanNotes || 'None'}`,
    `Waiting list ID: ${result.lastInsertRowid}`,
  ].join('\n');

  sendContactMessage({ name: cleanName, email: cleanEmail, message })
    .catch(err => console.error('Waiting list email error:', err));

  res.status(201).json({
    message: 'You have been added to the waiting list.',
    waitingListEntry: { id: result.lastInsertRowid, status: 'waiting' },
  });
});

module.exports = router;
