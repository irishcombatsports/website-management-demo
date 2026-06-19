const express = require('express');
const db = require('../db/database');
const { sendContactMessage } = require('../email');
const { createAdminNotification } = require('../notifications');

const router = express.Router();

const VALID_AMOUNTS = new Set(['€10', '€25', '€50', '€100', 'Other']);

router.post('/', (req, res) => {
  const {
    name = '',
    email = '',
    phone = '',
    size = '',
    quantity = 1,
    notes = '',
  } = req.body;

  const cleanName = name.trim();
  const cleanEmail = email.trim();
  const cleanPhone = phone.trim();
  const cleanSize = size.trim();
  const cleanNotes = notes.trim();
  const cleanQuantity = Math.max(1, Math.min(10, Number.parseInt(quantity, 10) || 1));

  if (!cleanName) return res.status(400).json({ error: 'Please enter your name.' });
  if (!cleanEmail || !/\S+@\S+\.\S+/.test(cleanEmail)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (!VALID_AMOUNTS.has(cleanSize)) return res.status(400).json({ error: 'Please choose a valid voucher amount.' });

  const result = db.prepare(`
    INSERT INTO merch_pre_orders (product, name, email, phone, size, quantity, notes)
    VALUES ('Gift Voucher / Equipment Enquiry', ?, ?, ?, ?, ?, ?)
  `).run(cleanName, cleanEmail, cleanPhone || null, cleanSize, cleanQuantity, cleanNotes || null);

  createAdminNotification({
    type: 'merch_pre_order',
    title: 'New voucher or equipment enquiry',
    body: `${cleanName} asked about ${cleanSize} voucher/equipment interest.`,
  });

  const message = [
    'New voucher or equipment enquiry',
    '',
    `Name: ${cleanName}`,
    `Email: ${cleanEmail}`,
    `Phone: ${cleanPhone || 'Not provided'}`,
    `Voucher amount: ${cleanSize}`,
    `Quantity: ${cleanQuantity}`,
    `Notes: ${cleanNotes || 'None'}`,
    `Enquiry ID: ${result.lastInsertRowid}`,
  ].join('\n');

  sendContactMessage({ name: cleanName, email: cleanEmail, message })
    .catch(err => console.error('Pre-order email error:', err));

  res.status(201).json({
    message: 'Pre-order interest saved.',
    preOrder: {
      id: result.lastInsertRowid,
      product: 'Gift Voucher / Equipment Enquiry',
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      size: cleanSize,
      quantity: cleanQuantity,
      notes: cleanNotes,
      status: 'new',
    },
  });
});

module.exports = router;
