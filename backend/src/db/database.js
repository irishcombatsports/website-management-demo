const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../data/club.db');

const fs = require('fs');
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    phone TEXT,
    date_of_birth TEXT,
    experience_level TEXT DEFAULT 'beginner',
    address TEXT,
    emergency_contact_name TEXT,
    emergency_contact_relationship TEXT,
    emergency_contact_phone TEXT,
    medical_notes TEXT,
    role TEXT DEFAULT 'member',
    is_coach INTEGER DEFAULT 0,
    waiver_signed INTEGER DEFAULT 0,
    waiver_signed_at TEXT,
    stripe_customer_id TEXT,
    reset_token TEXT,
    reset_token_expires TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS memberships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('free_class', 'monthly', 'limited_monthly', 'drop_in')),
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'expired', 'pending')),
    stripe_payment_intent_id TEXT,
    stripe_customer_id TEXT,
    amount_paid INTEGER DEFAULT 0,
    starts_at TEXT,
    expires_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS password_resets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS children (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_user_id INTEGER NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth TEXT,
    experience_level TEXT DEFAULT 'beginner',
    preferred_classes TEXT,
    medical_notes TEXT,
    waiver_signed INTEGER DEFAULT 0,
    waiver_signed_at TEXT,
    waiver_signed_by TEXT,
    waiver_version TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (parent_user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_children_parent_user_id
    ON children (parent_user_id);
`);

// Migrations — safe to run on every startup
try { db.exec(`ALTER TABLE memberships ADD COLUMN reminder_sent INTEGER DEFAULT 0`); } catch {}
try { db.exec(`ALTER TABLE memberships ADD COLUMN class_preference TEXT`); } catch {}
try { db.exec(`ALTER TABLE users ADD COLUMN is_coach INTEGER DEFAULT 0`); } catch {}

const membershipSchema = db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'memberships'").get()?.sql || '';
if (!membershipSchema.includes('limited_monthly')) {
  db.exec(`
    PRAGMA foreign_keys = OFF;
    CREATE TABLE memberships_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('free_class', 'monthly', 'limited_monthly', 'drop_in')),
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'expired', 'pending')),
      stripe_payment_intent_id TEXT,
      stripe_customer_id TEXT,
      amount_paid INTEGER DEFAULT 0,
      starts_at TEXT,
      expires_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      reminder_sent INTEGER DEFAULT 0,
      class_preference TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    INSERT INTO memberships_new (
      id, user_id, type, status, stripe_payment_intent_id, stripe_customer_id,
      amount_paid, starts_at, expires_at, created_at, reminder_sent, class_preference
    )
    SELECT
      id, user_id, type, status, stripe_payment_intent_id, stripe_customer_id,
      amount_paid, starts_at, expires_at, created_at,
      COALESCE(reminder_sent, 0), class_preference
    FROM memberships;
    DROP TABLE memberships;
    ALTER TABLE memberships_new RENAME TO memberships;
    PRAGMA foreign_keys = ON;
  `);
}
db.exec(`
  CREATE TABLE IF NOT EXISTS contact_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS admin_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    member_id INTEGER,
    read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (member_id) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_admin_notifications_read_created
    ON admin_notifications (read, created_at);

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    member_name TEXT NOT NULL,
    class_id TEXT NOT NULL,
    class_date TEXT NOT NULL,
    class_name TEXT NOT NULL,
    signed_in_at TEXT NOT NULL,
    admin_id INTEGER,
    admin_email TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (member_id) REFERENCES users(id),
    UNIQUE(member_id, class_date)
  );

  CREATE INDEX IF NOT EXISTS idx_attendance_class_date
    ON attendance (class_date);
  CREATE INDEX IF NOT EXISTS idx_attendance_member_id
    ON attendance (member_id);

  CREATE TABLE IF NOT EXISTS merch_pre_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product TEXT NOT NULL DEFAULT 'Gift Voucher / Equipment Enquiry',
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    size TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new', 'contacted', 'ordepurple', 'paid', 'cancelled')),
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_merch_pre_orders_created
    ON merch_pre_orders (created_at);

  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS waiting_list (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    experience_level TEXT DEFAULT 'beginner',
    preferred_classes TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'waiting' CHECK(status IN ('waiting', 'contacted', 'invited', 'joined', 'removed')),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_waiting_list_status_created
    ON waiting_list (status, created_at);

  CREATE TABLE IF NOT EXISTS analytics_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visitor_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    type TEXT NOT NULL,
    page_path TEXT NOT NULL,
    page_title TEXT,
    x REAL,
    y REAL,
    scroll_depth INTEGER,
    element_tag TEXT,
    element_text TEXT,
    element_id TEXT,
    element_classes TEXT,
    device_type TEXT,
    browser TEXT,
    screen_width INTEGER,
    screen_height INTEGER,
    traffic_source TEXT,
    conversion_name TEXT,
    metadata TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_analytics_events_created
    ON analytics_events (created_at);
  CREATE INDEX IF NOT EXISTS idx_analytics_events_page_type
    ON analytics_events (page_path, type);
  CREATE INDEX IF NOT EXISTS idx_analytics_events_visitor
    ON analytics_events (visitor_id, session_id);

  CREATE TABLE IF NOT EXISTS analytics_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT DEFAULT (datetime('now'))
  );
`);

db.prepare(`
  INSERT OR IGNORE INTO app_settings (key, value)
  VALUES ('accepting_members', 'true')
`).run();

db.prepare(`
  INSERT OR IGNORE INTO app_settings (key, value)
  VALUES ('promote_next_signup_admin', 'false')
`).run();

const defaults = {
  club_name: 'Training Club',
  tagline: 'Start Your Training Journey',
  address: '123 Main Street, Your Town',
  email: 'hello@trainingclub.example',
  instagram: '@trainingclub',
  primary_colour: '#8B2FC9',
  logo_path: '',
  payment_mode: 'offline',
  stripe_enabled: 'false',
  waiting_list_enabled: 'false',
  membership_prices: JSON.stringify({
    free_class: 0,
    drop_in: 1000,
    monthly: 8000,
    limited_monthly: 6000,
  }),
  class_schedule: JSON.stringify([
    { day: 'Monday', classes: [{ time: '18:00', name: 'Fundamentals' }, { time: '19:00', name: 'Grappling' }] },
    { day: 'Wednesday', classes: [{ time: '18:00', name: 'Striking' }, { time: '19:00', name: 'No-Gi' }] },
    { day: 'Friday', classes: [{ time: '18:00', name: 'Mixed Training' }, { time: '19:00', name: 'Advanced Session' }] },
  ]),
};

const insertSetting = db.prepare(`
  INSERT OR IGNORE INTO app_settings (key, value)
  VALUES (?, ?)
`);
Object.entries(defaults).forEach(([key, value]) => insertSetting.run(key, value));

const analyticsDefaults = {
  tracking_enabled: 'true',
  heatmaps_enabled: 'true',
  cookie_consent_required: 'true',
  anonymise_ip: 'true',
  retention_days: '180',
  session_recording_enabled: 'false',
  weekly_email_reports: 'false',
};

const insertAnalyticsSetting = db.prepare(`
  INSERT OR IGNORE INTO analytics_settings (key, value)
  VALUES (?, ?)
`);
Object.entries(analyticsDefaults).forEach(([key, value]) => insertAnalyticsSetting.run(key, value));

const placeholderUpdates = {
  club_name: ['Combat Club', 'Training Club'],
  email: ['hello@combatclub.example', 'hello@trainingclub.example'],
  instagram: ['@combatclub', '@trainingclub'],
};

const updatePlaceholder = db.prepare(`
  UPDATE app_settings
  SET value = ?, updated_at = datetime('now')
  WHERE key = ? AND value = ?
`);
Object.entries(placeholderUpdates).forEach(([key, [oldValue, newValue]]) => {
  updatePlaceholder.run(newValue, key, oldValue);
});

module.exports = db;
