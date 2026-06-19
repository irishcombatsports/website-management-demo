#!/usr/bin/env node
/**
 * MB Site Diagnostics
 * Checks every major endpoint on the live site.
 * Usage: node scripts/diagnose.js
 *        node scripts/diagnose.js http://localhost:3001  (local)
 */

const BASE = process.argv[2] || 'https://trainingclub.example';

const results = [];

async function check(name, fn) {
  try {
    const result = await fn();
    results.push({ name, status: 'OK', detail: result });
    console.log(`OK  ${name}: ${result}`);
  } catch (err) {
    results.push({ name, status: '❌', detail: err.message });
    console.log(`❌  ${name}: ${err.message}`);
  }
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  return { status: res.status, body: await res.json() };
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

(async () => {
  console.log(`\nMB Diagnostics → ${BASE}\n${'─'.repeat(50)}`);

  await check('Health check', async () => {
    const { body } = await get('/api/health');
    if (body.status !== 'ok') throw new Error('Not ok');
    return `ok (${body.timestamp})`;
  });

  await check('Stripe config', async () => {
    const { body } = await get('/api/stripe/config');
    if (!body.publishableKey) throw new Error('No publishable key returned');
    const keyType = body.publishableKey.startsWith('pk_live') ? 'LIVE 🟢' : 'TEST 🟡';
    return `key present (${keyType})`;
  });

  await check('Auth — reject invalid token', async () => {
    const res = await fetch(`${BASE}/api/auth/me`, {
      headers: { Authorization: 'Bearer invalidtoken123' },
    });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
    return '401 as expected';
  });

  await check('Auth — reject bad login', async () => {
    const { status } = await post('/api/auth/login', {
      email: 'nobody@nowhere.com', password: 'wrongpassword',
    });
    if (status !== 401) throw new Error(`Expected 401, got ${status}`);
    return '401 as expected';
  });

  await check('Admin — reject unauthenticated', async () => {
    const res = await fetch(`${BASE}/api/admin/stats`);
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
    return '401 as expected';
  });

  await check('Contact form — validation', async () => {
    const { status, body } = await post('/api/contact', { name: '', email: '', message: '' });
    if (status !== 400) throw new Error(`Expected 400, got ${status}`);
    return `400 validation working (${body.error})`;
  });

  await check('Frontend — homepage loads', async () => {
    const isLocal = BASE.includes('localhost');
    const url = isLocal ? BASE.replace('3001', '5173') : BASE;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    if (!text.includes('Your Town') && !text.includes('<div id="root">')) throw new Error('Unexpected content');
    return `HTTP ${res.status}${isLocal ? ' (Vite :5173)' : ''}`;
  });

  await check('Password reset — validation', async () => {
    const { status } = await post('/api/auth/forgot-password', { email: 'test@test.com' });
    if (status !== 200) throw new Error(`Expected 200, got ${status}`);
    return '200 (always succeeds to prevent enumeration)';
  });

  const passed = results.filter(r => r.status === 'OK').length;
  const failed = results.filter(r => r.status === '❌').length;

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`${passed}/${results.length} checks passed${failed > 0 ? ` — ${failed} FAILED` : ' — all good!'}\n`);

  if (failed > 0) process.exit(1);
})();
