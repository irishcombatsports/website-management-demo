#!/usr/bin/env node
/**
 * MB Common Database Tasks
 * Run against LOCAL db by default.
 *
 * Usage:
 *   node scripts/db-tasks.js list-members
 *   node scripts/db-tasks.js make-admin email@example.com
 *   node scripts/db-tasks.js remove-admin email@example.com
 *   node scripts/db-tasks.js delete-member email@example.com
 *   node scripts/db-tasks.js reset-membership email@example.com
 *   node scripts/db-tasks.js activate-membership email@example.com monthly
 *   node scripts/db-tasks.js unsign-waiver email@example.com
 *   node scripts/db-tasks.js stats
 */

const BACKEND = `${__dirname}/../backend`;
const Database = require(`${BACKEND}/node_modules/better-sqlite3`);
const db = new Database(process.env.DATABASE_PATH || `${BACKEND}/data/club.db`);

const [,, task, arg1, arg2] = process.argv;

function getUser(email) {
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) { console.error(`❌ No user found with email: ${email}`); process.exit(1); }
  return user;
}

const tasks = {
  'list-members': () => {
    const members = db.prepare(`
      SELECT u.id, u.full_name, u.email, u.role, u.waiver_signed,
             m.type as membership_type, m.status as membership_status
      FROM users u
      LEFT JOIN memberships m ON m.id = (
        SELECT id FROM memberships WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1
      )
      ORDER BY u.created_at DESC
    `).all();
    console.log(`\n${'─'.repeat(70)}`);
    console.log(`${'NAME'.padEnd(20)} ${'EMAIL'.padEnd(28)} ${'ROLE'.padEnd(8)} ${'WAIVER'.padEnd(8)} MEMBERSHIP`);
    console.log(`${'─'.repeat(70)}`);
    members.forEach(m => {
      console.log(
        `${(m.full_name || '').padEnd(20)} ${(m.email || '').padEnd(28)} ${(m.role || '').padEnd(8)} ${(m.waiver_signed ? 'yes' : 'no').padEnd(8)} ${m.membership_type || 'none'}`
      );
    });
    console.log(`${'─'.repeat(70)}`);
    console.log(`${members.length} total users\n`);
  },

  'stats': () => {
    const total   = db.prepare("SELECT COUNT(*) as c FROM users WHERE role='member'").get().c;
    const waivers = db.prepare("SELECT COUNT(*) as c FROM users WHERE waiver_signed=1").get().c;
    const active  = db.prepare("SELECT COUNT(*) as c FROM memberships WHERE status='active'").get().c;
    const monthly = db.prepare("SELECT COUNT(*) as c FROM memberships WHERE type='monthly' AND status='active'").get().c;
    const dropin  = db.prepare("SELECT COUNT(*) as c FROM memberships WHERE type='drop_in' AND status='active'").get().c;
    const free    = db.prepare("SELECT COUNT(*) as c FROM memberships WHERE type='free_class' AND status='active'").get().c;
    console.log(`\n📊 Database Stats`);
    console.log(`  Members:          ${total}`);
    console.log(`  Waivers signed:   ${waivers}`);
    console.log(`  Active memberships: ${active} (monthly: ${monthly}, drop-in: ${dropin}, free: ${free})\n`);
  },

  'make-admin': () => {
    const user = getUser(arg1);
    db.prepare("UPDATE users SET role='admin' WHERE id=?").run(user.id);
    console.log(`OK ${user.full_name} (${user.email}) is now an admin`);
  },

  'remove-admin': () => {
    const user = getUser(arg1);
    db.prepare("UPDATE users SET role='member' WHERE id=?").run(user.id);
    console.log(`OK ${user.full_name} (${user.email}) role set back to member`);
  },

  'delete-member': () => {
    const user = getUser(arg1);
    db.prepare('DELETE FROM memberships WHERE user_id=?').run(user.id);
    db.prepare('DELETE FROM password_resets WHERE user_id=?').run(user.id);
    db.prepare('DELETE FROM users WHERE id=?').run(user.id);
    console.log(`OK Deleted ${user.full_name} (${user.email}) and all their data`);
  },

  'reset-membership': () => {
    const user = getUser(arg1);
    db.prepare("UPDATE memberships SET status='inactive' WHERE user_id=?").run(user.id);
    console.log(`OK All memberships for ${user.email} set to inactive`);
  },

  'activate-membership': () => {
    const user = getUser(arg1);
    const type = arg2 || 'free_class';
    if (!['monthly', 'drop_in', 'free_class'].includes(type)) {
      console.error('❌ Type must be: monthly, drop_in, or free_class'); process.exit(1);
    }
    db.prepare("UPDATE memberships SET status='inactive' WHERE user_id=?").run(user.id);
    const expires = type === 'monthly'
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : type === 'drop_in'
      ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      : null;
    db.prepare(`INSERT INTO memberships (user_id, type, status, starts_at, expires_at, amount_paid)
      VALUES (?, ?, 'active', datetime('now'), ?, 0)`)
      .run(user.id, type, expires);
    console.log(`OK Activated ${type} membership for ${user.email}${expires ? ` (expires ${new Date(expires).toLocaleDateString('en-IE')})` : ''}`);
  },

  'unsign-waiver': () => {
    const user = getUser(arg1);
    db.prepare("UPDATE users SET waiver_signed=0, waiver_signed_at=NULL WHERE id=?").run(user.id);
    console.log(`OK Waiver unsigned for ${user.email}`);
  },
};

if (!task || !tasks[task]) {
  console.log('\nAvailable tasks:');
  Object.keys(tasks).forEach(t => console.log(`  node scripts/db-tasks.js ${t}`));
  console.log('');
  process.exit(0);
}

tasks[task]();
db.close();
