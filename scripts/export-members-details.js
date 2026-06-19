#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

const BASE_URL = process.env.MB_BASE_URL || 'https://trainingclub.example';
const OUTPUT_DIR = process.env.MB_MEMBERS_OUTPUT_DIR
  || path.join(os.homedir(), 'Desktop', 'MB Assets', 'members details');
const LOCAL_ENV_PATHS = [
  path.join(OUTPUT_DIR, 'member-export-settings.txt'),
  path.join(OUTPUT_DIR, '.members-export.env'),
  path.join(__dirname, 'member-export-settings.txt'),
  path.join(__dirname, '.members-export.env'),
];

function loadLocalEnv() {
  for (const envPath of LOCAL_ENV_PATHS) {
    if (!fs.existsSync(envPath)) continue;
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const index = trimmed.indexOf('=');
      if (index === -1) continue;
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

function csvValue(value) {
  const safe = value == null ? '' : String(value);
  return `"${safe.replace(/"/g, '""')}"`;
}

function membershipLabel(member) {
  const labels = {
    monthly: 'Unlimited Monthly',
    limited_monthly: '2 Classes Weekly',
    drop_in: 'Drop-In',
    free_class: 'Free Trial',
  };
  return labels[member.membership_type] || member.membership_type || 'None';
}

function isActive(member) {
  const now = Date.now();
  const starts = member.starts_at ? new Date(member.starts_at).getTime() : null;
  const expires = member.expires_at ? new Date(member.expires_at).getTime() : null;
  return member.membership_status === 'active'
    && (!starts || starts <= now)
    && (!expires || expires > now);
}

async function login() {
  const email = process.env.MB_ADMIN_EMAIL;
  const password = process.env.MB_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error(`Missing MB_ADMIN_EMAIL or MB_ADMIN_PASSWORD. Add them to ${LOCAL_ENV_PATHS[0]}`);
  }

  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.token) {
    throw new Error(`Admin login failed (${res.status})`);
  }
  return body.token;
}

async function fetchMembers(token) {
  const res = await fetch(`${BASE_URL}/api/admin/members`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Member export failed (${res.status})`);
  return body.members || [];
}

async function fetchPreOrders(token) {
  const res = await fetch(`${BASE_URL}/api/admin/pre-orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json().catch(() => ({}));
  if (res.status === 404) {
    console.warn('Pre-order export not available yet. Railway may still be deploying.');
    return [];
  }
  if (!res.ok) throw new Error(`Pre-order export failed (${res.status})`);
  return body.preOrders || [];
}

function writeMembersFiles(members, preOrderCount = 0) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const now = new Date();
  const rows = [
    ['Full Name', 'Email', 'Contact Number', 'Membership', 'Status', 'Waiver Signed', 'Joined'],
    ...members.map(member => [
      member.full_name,
      member.email,
      member.phone || '',
      membershipLabel(member),
      isActive(member) ? 'Active' : (member.membership_status || 'No membership'),
      member.waiver_signed ? 'Yes' : 'No',
      member.created_at ? new Date(member.created_at).toLocaleDateString('en-IE') : '',
    ]),
  ];

  const csv = rows.map(row => row.map(csvValue).join(',')).join('\n') + '\n';
  const csvPath = path.join(OUTPUT_DIR, 'registered-members.csv');
  const jsonPath = path.join(OUTPUT_DIR, 'registered-members.json');
  const updatedPath = path.join(OUTPUT_DIR, 'last-updated.txt');

  fs.writeFileSync(csvPath, csv);
  fs.writeFileSync(jsonPath, JSON.stringify({ updated_at: now.toISOString(), members }, null, 2));
  fs.writeFileSync(updatedPath, `Last updated: ${now.toLocaleString('en-IE')}\nMembers exported: ${members.length}\nPre-orders exported: ${preOrderCount}\n`);

  return { csvPath, jsonPath, updatedPath };
}

function writePreOrderFiles(preOrders) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const rows = [
    ['Product', 'Name', 'Email', 'Phone', 'Size', 'Quantity', 'Status', 'Notes', 'Created'],
    ...preOrders.map(order => [
      order.product || 'MB Rash Guard',
      order.name,
      order.email,
      order.phone || '',
      order.size,
      order.quantity,
      order.status || 'new',
      order.notes || '',
      order.created_at ? new Date(order.created_at).toLocaleString('en-IE') : '',
    ]),
  ];

  const csv = rows.map(row => row.map(csvValue).join(',')).join('\n') + '\n';
  const csvPath = path.join(OUTPUT_DIR, 'rash-guard-pre-orders.csv');
  const jsonPath = path.join(OUTPUT_DIR, 'rash-guard-pre-orders.json');

  fs.writeFileSync(csvPath, csv);
  fs.writeFileSync(jsonPath, JSON.stringify({ updated_at: new Date().toISOString(), preOrders }, null, 2));

  return { csvPath, jsonPath };
}

(async () => {
  loadLocalEnv();
  const token = await login();
  const members = await fetchMembers(token);
  const preOrders = await fetchPreOrders(token);
  const preOrderFiles = writePreOrderFiles(preOrders);
  const files = writeMembersFiles(members, preOrders.length);
  console.log(`Exported ${members.length} members`);
  console.log(files.csvPath);
  console.log(`Exported ${preOrders.length} pre-orders`);
  console.log(preOrderFiles.csvPath);
})().catch(err => {
  console.error(err.message);
  process.exit(1);
});
