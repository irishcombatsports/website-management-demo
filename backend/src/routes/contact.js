const express = require('express');
const { sendContactMessage } = require('../email');
const db = require('../db/database');
const { createAdminNotification } = require('../notifications');

const router = express.Router();

router.post('/', (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !name.trim()) return res.status(400).json({ error: 'Please enter your name.' });
  if (!email || !email.trim()) return res.status(400).json({ error: 'Please enter your email address.' });
  if (!/\S+@\S+\.\S+/.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (!message || !message.trim()) return res.status(400).json({ error: 'Please enter a message.' });
  if (message.trim().length < 10) return res.status(400).json({ error: 'Message is too short.' });

  // Save to DB first — message is never lost even if email fails
  db.prepare('INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)')
    .run(name.trim(), email.trim(), message.trim());
  createAdminNotification({
    type: 'contact',
    title: 'New contact message',
    body: `${name.trim()} sent a website message.`,
  });

  // Send email in the background — don't block the response
  sendContactMessage({ name: name.trim(), email: email.trim(), message: message.trim() })
    .catch(err => console.error('Contact email error:', err));

  res.json({ message: 'Message sent!' });
});

module.exports = router;
