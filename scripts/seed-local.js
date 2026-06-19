#!/usr/bin/env node
/**
 * Training Club Local Database Seeder
 * Creates realistic test accounts for local development.
 * Safe to run multiple times — clears test accounts first.
 *
 * Usage: node scripts/seed-local.js
 *
 * Creates:
 *   admin@trainingclub.test / TestPass123  (admin)
 *   monthly@trainingclub.test / TestPass123 (active monthly member)
 *   freetrial@trainingclub.test / TestPass123 (free class booked)
 *   expired@trainingclub.test / TestPass123  (expired membership)
 *   nowaiver@trainingclub.test / TestPass123 (registered but no waiver)
 */

const BACKEND = `${__dirname}/../backend`;
const bcrypt = require(`${BACKEND}/node_modules/bcryptjs`);
const Database = require(`${BACKEND}/node_modules/better-sqlite3`);
const db = new Database(process.env.DATABASE_PATH || `${BACKEND}/data/club.db`);

const HASH = bcrypt.hashSync('TestPass123', 10);
const TEST_EMAILS = [
  'admin@trainingclub.test',
  'monthly@trainingclub.test',
  'freetrial@trainingclub.test',
  'expired@trainingclub.test',
  'nowaiver@trainingclub.test',
];

// Clean up existing test accounts
TEST_EMAILS.forEach(email => {
  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (user) {
    db.prepare('DELETE FROM memberships WHERE user_id = ?').run(user.id);
    db.prepare('DELETE FROM users WHERE id = ?').run(user.id);
  }
});

function addUser(data) {
  return db.prepare(`
    INSERT INTO users (full_name, email, password_hash, phone, date_of_birth,
      experience_level, address, emergency_contact_name, emergency_contact_relationship,
      emergency_contact_phone, medical_notes, waiver_signed, waiver_signed_at, role)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.full_name, data.email, HASH, data.phone || null, data.dob || null,
    data.level || 'beginner', data.address || null,
    data.ec_name || null, data.ec_rel || null, data.ec_phone || null,
    data.medical || null,
    data.waiver ? 1 : 0,
    data.waiver ? data.waiver : null,
    data.role || 'member'
  ).lastInsertRowid;
}

function addMembership(userId, type, status, daysFromNow) {
  const expires = daysFromNow !== null
    ? new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000).toISOString()
    : null;
  db.prepare(`INSERT INTO memberships (user_id, type, status, starts_at, expires_at, amount_paid)
    VALUES (?, ?, ?, datetime('now'), ?, ?)`)
    .run(userId, type, status, expires, type === 'monthly' ? 8000 : type === 'drop_in' ? 1500 : 0);
}

// 1. Admin
const adminId = addUser({
  full_name: 'Test Admin', email: 'admin@trainingclub.test', role: 'admin',
  phone: '0871111111', waiver: new Date().toISOString(),
});
console.log('OK admin@trainingclub.test (admin, password: TestPass123)');

// 2. Active monthly member
const monthlyId = addUser({
  full_name: 'Sarah Monthly', email: 'monthly@trainingclub.test',
  phone: '0872222222', dob: '1995-03-20', level: 'intermediate',
  address: '5 Castle St, Your Town',
  ec_name: 'Tom Monthly', ec_rel: 'Father', ec_phone: '0873333333',
  waiver: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // signed 15 days ago
});
addMembership(monthlyId, 'monthly', 'active', 15); // expires in 15 days
console.log('OK monthly@trainingclub.test (active monthly, expires in 15 days)');

// 3. Free trial booked
const freeId = addUser({
  full_name: 'Dave Freetrial', email: 'freetrial@trainingclub.test',
  phone: '0874444444', level: 'beginner',
  waiver: new Date().toISOString(),
});
addMembership(freeId, 'free_class', 'active', null);
console.log('OK freetrial@trainingclub.test (free trial booked)');

// 4. Expired membership
const expiredId = addUser({
  full_name: 'Mary Expired', email: 'expired@trainingclub.test',
  phone: '0875555555', level: 'advanced',
  address: '10 Wine St, Your Town',
  ec_name: 'Paul Expired', ec_rel: 'Spouse', ec_phone: '0876666666',
  medical: 'Previous knee injury, fully recovered.',
  waiver: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // signed 60 days ago
});
addMembership(expiredId, 'monthly', 'active', -5); // expired 5 days ago
console.log('OK expired@trainingclub.test (membership expired 5 days ago)');

// 5. No waiver
const nowaiverID = addUser({
  full_name: 'Pete Nowaiver', email: 'nowaiver@trainingclub.test',
  phone: '0877777777', waiver: false,
});
console.log('OK nowaiver@trainingclub.test (registered, no waiver signed)');

console.log('\nAll test accounts use password: TestPass123');
console.log('Run "node scripts/db-tasks.js list-members" to verify\n');

db.close();
