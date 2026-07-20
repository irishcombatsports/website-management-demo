const express = require('express');
const db = require('../db/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

const allowedEventTypes = new Set([
  'page_view',
  'page_exit',
  'click',
  'dead_click',
  'rage_click',
  'scroll',
  'mouse_move',
  'touch',
  'form_interaction',
  'conversion',
]);

function clampText(value, max = 220) {
  if (value === undefined || value === null) return null;
  return String(value).replace(/\s+/g, ' ').trim().slice(0, max);
}

function getRange(range = 'last_7_days') {
  const map = {
    today: "-0 days",
    yesterday: "-1 days",
    last_7_days: "-7 days",
    last_30_days: "-30 days",
    last_90_days: "-90 days",
    this_year: "start of year",
  };

  if (range === 'yesterday') {
    return {
      start: "datetime('now', 'start of day', '-1 day')",
      end: "datetime('now', 'start of day')",
    };
  }

  if (range === 'this_year') {
    return {
      start: "datetime('now', 'start of year')",
      end: "datetime('now')",
    };
  }

  return {
    start: `datetime('now', '${map[range] || map.last_7_days}')`,
    end: "datetime('now')",
  };
}

function readSettings() {
  return Object.fromEntries(
    db.prepare('SELECT key, value FROM analytics_settings').all().map(row => [row.key, row.value])
  );
}

router.get('/config', (req, res) => {
  const settings = readSettings();
  res.json({
    trackingEnabled: settings.tracking_enabled === 'true',
    heatmapsEnabled: settings.heatmaps_enabled === 'true',
    cookieConsentRequired: settings.cookie_consent_required === 'true',
    anonymiseIp: settings.anonymise_ip !== 'false',
    retentionDays: Number(settings.retention_days || 180),
  });
});

router.post('/events', (req, res) => {
  const settings = readSettings();
  if (settings.tracking_enabled !== 'true') {
    return res.json({ ok: true, stored: 0, paused: true });
  }

  const events = Array.isArray(req.body?.events) ? req.body.events.slice(0, 60) : [];
  if (events.length === 0) return res.status(400).json({ error: 'No events supplied' });

  const insert = db.prepare(`
    INSERT INTO analytics_events (
      visitor_id, session_id, type, page_path, page_title, x, y, scroll_depth,
      element_tag, element_text, element_id, element_classes, device_type, browser,
      screen_width, screen_height, traffic_source, conversion_name, metadata
    )
    VALUES (
      @visitor_id, @session_id, @type, @page_path, @page_title, @x, @y, @scroll_depth,
      @element_tag, @element_text, @element_id, @element_classes, @device_type, @browser,
      @screen_width, @screen_height, @traffic_source, @conversion_name, @metadata
    )
  `);

  const save = db.transaction((rows) => {
    let stored = 0;
    for (const event of rows) {
      if (!allowedEventTypes.has(event.type)) continue;
      if (!event.visitorId || !event.sessionId || !event.pagePath) continue;
      insert.run({
        visitor_id: clampText(event.visitorId, 80),
        session_id: clampText(event.sessionId, 80),
        type: event.type,
        page_path: clampText(event.pagePath, 300) || '/',
        page_title: clampText(event.pageTitle, 160),
        x: Number.isFinite(event.x) ? event.x : null,
        y: Number.isFinite(event.y) ? event.y : null,
        scroll_depth: Number.isFinite(event.scrollDepth) ? Math.max(0, Math.min(100, Math.round(event.scrollDepth))) : null,
        element_tag: clampText(event.elementTag, 40),
        element_text: clampText(event.elementText, 160),
        element_id: clampText(event.elementId, 100),
        element_classes: clampText(event.elementClasses, 180),
        device_type: clampText(event.deviceType, 20),
        browser: clampText(event.browser, 40),
        screen_width: Number.isFinite(event.screenWidth) ? event.screenWidth : null,
        screen_height: Number.isFinite(event.screenHeight) ? event.screenHeight : null,
        traffic_source: clampText(event.trafficSource, 80),
        conversion_name: clampText(event.conversionName, 120),
        metadata: event.metadata ? JSON.stringify(event.metadata).slice(0, 1200) : null,
      });
      stored += 1;
    }
    return stored;
  });

  res.json({ ok: true, stored: save(events) });
});

router.get('/admin/summary', authenticate, requireAdmin, (req, res) => {
  const { range = 'last_7_days', device = '', source = '', page = '' } = req.query;
  const selected = getRange(range);
  const filters = [`created_at >= ${selected.start}`, `created_at < ${selected.end}`];
  const params = {};

  if (device) {
    filters.push('device_type = @device');
    params.device = device;
  }
  if (source) {
    filters.push('traffic_source = @source');
    params.source = source;
  }
  if (page) {
    filters.push('page_path = @page');
    params.page = page;
  }

  const where = `WHERE ${filters.join(' AND ')}`;
  const base = db.prepare(`
    SELECT
      COUNT(DISTINCT visitor_id) AS visitors,
      COUNT(DISTINCT session_id) AS sessions,
      SUM(CASE WHEN type = 'page_view' THEN 1 ELSE 0 END) AS pageViews,
      SUM(CASE WHEN type = 'conversion' THEN 1 ELSE 0 END) AS conversions,
      AVG(CASE WHEN type = 'page_exit' THEN json_extract(metadata, '$.timeOnPageSeconds') ELSE NULL END) AS avgTime
    FROM analytics_events
    ${where}
  `).get(params);

  const topPages = db.prepare(`
    SELECT page_path AS path, COUNT(*) AS views
    FROM analytics_events
    ${where} AND type = 'page_view'
    GROUP BY page_path
    ORDER BY views DESC
    LIMIT 8
  `).all(params);

  const clickedButtons = db.prepare(`
    SELECT COALESCE(NULLIF(element_text, ''), element_id, element_tag, 'Unknown') AS label, COUNT(*) AS clicks
    FROM analytics_events
    ${where} AND type IN ('click', 'conversion')
    GROUP BY label
    ORDER BY clicks DESC
    LIMIT 8
  `).all(params);

  const devices = db.prepare(`
    SELECT COALESCE(device_type, 'Unknown') AS label, COUNT(DISTINCT visitor_id) AS visitors
    FROM analytics_events
    ${where}
    GROUP BY label
  `).all(params);

  const heatmap = db.prepare(`
    SELECT page_path AS path,
      COUNT(CASE WHEN type = 'click' THEN 1 END) AS clicks,
      COUNT(CASE WHEN type = 'dead_click' THEN 1 END) AS deadClicks,
      COUNT(CASE WHEN type = 'rage_click' THEN 1 END) AS rageClicks,
      MAX(scroll_depth) AS maxScroll,
      AVG(scroll_depth) AS avgScroll
    FROM analytics_events
    ${where}
    GROUP BY page_path
    ORDER BY clicks DESC
    LIMIT 8
  `).all(params);

  const conversionRate = base.sessions ? Math.round((Number(base.conversions || 0) / Number(base.sessions)) * 1000) / 10 : 0;
  const avgScroll = heatmap.length
    ? Math.round(heatmap.reduce((sum, row) => sum + Number(row.avgScroll || 0), 0) / heatmap.length)
    : 0;

  const recommendations = [];
  if (avgScroll && avgScroll < 55) recommendations.push('Most visitors are not reaching the lower half of key pages. Move important calls-to-action higher.');
  if (conversionRate < 3) recommendations.push('Conversion rate is currently low. Test clearer button wording and repeat enquiry buttons after pricing.');
  if (devices.find(d => d.label === 'Mobile' && d.visitors > (base.visitors || 0) * 0.6)) recommendations.push('Mobile traffic dominates. Review mobile spacing, buttons and form length first.');
  if (clickedButtons.length === 0) recommendations.push('No button clicks found in this range yet. Make primary actions more visually obvious.');

  res.json({
    range,
    totals: {
      visitors: Number(base.visitors || 0),
      sessions: Number(base.sessions || 0),
      pageViews: Number(base.pageViews || 0),
      conversions: Number(base.conversions || 0),
      conversionRate,
      avgTimeSeconds: Math.round(Number(base.avgTime || 0)),
    },
    devices,
    topPages,
    clickedButtons,
    heatmap,
    recommendations,
    settings: readSettings(),
  });
});

router.patch('/admin/settings', authenticate, requireAdmin, (req, res) => {
  const allowed = new Set([
    'tracking_enabled',
    'heatmaps_enabled',
    'cookie_consent_required',
    'anonymise_ip',
    'retention_days',
    'session_recording_enabled',
    'weekly_email_reports',
  ]);
  const entries = Object.entries(req.body || {}).filter(([key]) => allowed.has(key));
  const update = db.prepare(`
    INSERT INTO analytics_settings (key, value, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `);
  const save = db.transaction(() => {
    entries.forEach(([key, value]) => update.run(key, String(value)));
  });
  save();
  res.json({ ok: true, settings: readSettings() });
});

router.delete('/admin/events', authenticate, requireAdmin, (req, res) => {
  const result = db.prepare('DELETE FROM analytics_events').run();
  res.json({ ok: true, deleted: result.changes });
});

router.get('/admin/export.csv', authenticate, requireAdmin, (req, res) => {
  const rows = db.prepare(`
    SELECT created_at, type, page_path, element_text, scroll_depth, device_type, browser, traffic_source, conversion_name
    FROM analytics_events
    ORDER BY created_at DESC
    LIMIT 10000
  `).all();
  const header = ['created_at', 'type', 'page_path', 'element_text', 'scroll_depth', 'device_type', 'browser', 'traffic_source', 'conversion_name'];
  const csv = [
    header.join(','),
    ...rows.map(row => header.map(key => `"${String(row[key] ?? '').replace(/"/g, '""')}"`).join(',')),
  ].join('\n');
  res.setHeader('content-type', 'text/csv; charset=utf-8');
  res.setHeader('content-disposition', 'attachment; filename="analytics-report.csv"');
  res.send(csv);
});

module.exports = router;
