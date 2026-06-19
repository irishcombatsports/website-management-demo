const db = require('./db/database');

function createAdminNotification({ type, title, body, memberId = null }) {
  try {
    db.prepare(`
      INSERT INTO admin_notifications (type, title, body, member_id)
      VALUES (?, ?, ?, ?)
    `).run(type, title, body, memberId);
  } catch (err) {
    console.error('Admin notification failed:', err);
  }
}

module.exports = { createAdminNotification };
