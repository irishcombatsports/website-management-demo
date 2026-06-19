const express = require('express');
const db = require('../db/database');

const router = express.Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM app_settings').all();
  const settings = Object.fromEntries(rows.map(row => [row.key, row.value]));
  const jsonKeys = ['membership_prices', 'class_schedule'];
  for (const key of jsonKeys) {
    if (settings[key]) {
      try { settings[key] = JSON.parse(settings[key]); } catch {}
    }
  }

  res.json({
    acceptingMembers: settings.accepting_members !== 'false',
    club: {
      name: settings.club_name,
      tagline: settings.tagline,
      address: settings.address,
      email: settings.email,
      instagram: settings.instagram,
      primaryColour: settings.primary_colour,
      logoPath: settings.logo_path,
    },
    payment: {
      mode: settings.payment_mode,
      stripeEnabled: settings.stripe_enabled === 'true',
    },
    waitingListEnabled: settings.waiting_list_enabled === 'true',
    membershipPrices: settings.membership_prices,
    classSchedule: settings.class_schedule,
  });
});

module.exports = router;
