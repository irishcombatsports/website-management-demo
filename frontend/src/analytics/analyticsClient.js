const CONSENT_KEY = 'demo_analytics_consent';
const VISITOR_KEY = 'demo_analytics_visitor_id';
const SESSION_KEY = 'demo_analytics_session_id';
const SESSION_STARTED_KEY = 'demo_analytics_session_started_at';

const defaultConfig = {
  endpoint: '/api/analytics/events',
  configEndpoint: '/api/analytics/config',
  requireConsent: true,
  sampleMouseMoveMs: 1200,
  flushIntervalMs: 5000,
  maxQueueSize: 40,
  trackMouse: true,
  trackTouch: true,
  trackHeatmaps: true,
};

function createId(prefix) {
  const random = crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}_${random}`;
}

function getDeviceType() {
  const width = window.innerWidth;
  const touch = navigator.maxTouchPoints > 0;
  if (width >= 1024 && !touch) return 'Desktop';
  if (width >= 768) return 'Tablet';
  return 'Mobile';
}

function getBrowser() {
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return 'Edge';
  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return 'Chrome';
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return 'Safari';
  if (/Firefox\//.test(ua)) return 'Firefox';
  return 'Other';
}

function getTrafficSource() {
  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get('utm_source');
  if (utmSource) return utmSource;
  const referrer = document.referrer;
  if (!referrer) return 'Direct';
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    if (host.includes('google')) return 'Google';
    if (host.includes('facebook')) return 'Facebook';
    if (host.includes('instagram')) return 'Instagram';
    if (host.includes('tiktok')) return 'TikTok';
    if (host.includes('linkedin')) return 'LinkedIn';
    return host.replace(/^www\./, '');
  } catch {
    return 'Referral';
  }
}

function getElementInfo(target) {
  const element = target?.closest?.('a, button, input, select, textarea, [role="button"], [data-analytics-label]');
  if (!element) return {};
  const text = element.getAttribute('data-analytics-label') || element.innerText || element.value || element.getAttribute('aria-label') || '';
  return {
    elementTag: element.tagName?.toLowerCase(),
    elementText: text.trim().slice(0, 120),
    elementId: element.id || '',
    elementClasses: element.className?.toString?.().slice(0, 160) || '',
    conversionName: element.getAttribute('data-analytics-conversion') || '',
    href: element.getAttribute('href') || '',
  };
}

function getScrollDepth() {
  const doc = document.documentElement;
  const scrollable = Math.max(1, doc.scrollHeight - window.innerHeight);
  return Math.min(100, Math.max(0, Math.round((window.scrollY / scrollable) * 100)));
}

export function getAnalyticsConsent() {
  return localStorage.getItem(CONSENT_KEY);
}

export function setAnalyticsConsent(value) {
  localStorage.setItem(CONSENT_KEY, value);
  window.dispatchEvent(new CustomEvent('analytics-consent-changed', { detail: value }));
}

export function createAnalyticsTracker(options = {}) {
  const config = { ...defaultConfig, ...options };
  let remoteConfig = {};
  let enabled = false;
  let queue = [];
  let flushTimer = null;
  let lastMouseMove = 0;
  let maxScroll = 0;
  let scrollMarksTracked = new Set();
  let pageStartedAt = Date.now();
  let lastClicks = [];
  let visitorId = localStorage.getItem(VISITOR_KEY);
  let sessionId = sessionStorage.getItem(SESSION_KEY);

  if (!visitorId) {
    visitorId = createId('vis');
    localStorage.setItem(VISITOR_KEY, visitorId);
  }
  if (!sessionId) {
    sessionId = createId('ses');
    sessionStorage.setItem(SESSION_KEY, sessionId);
    sessionStorage.setItem(SESSION_STARTED_KEY, String(Date.now()));
  }

  function hasConsent() {
    if (remoteConfig.cookieConsentRequired === false || config.requireConsent === false) return true;
    return getAnalyticsConsent() === 'accepted';
  }

  function commonPayload() {
    return {
      visitorId,
      sessionId,
      pagePath: window.location.pathname,
      pageTitle: document.title,
      deviceType: getDeviceType(),
      browser: getBrowser(),
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      trafficSource: getTrafficSource(),
    };
  }

  function track(type, payload = {}) {
    if (!enabled || !hasConsent()) return;
    queue.push({ type, ...commonPayload(), ...payload });
    if (queue.length >= config.maxQueueSize) flush();
  }

  function flush() {
    if (!queue.length || !hasConsent()) return;
    const events = queue.splice(0, config.maxQueueSize);
    const body = JSON.stringify({ events });
    if (navigator.sendBeacon) {
      const sent = navigator.sendBeacon(config.endpoint, new Blob([body], { type: 'application/json' }));
      if (sent) return;
    }
    fetch(config.endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {
      queue = events.concat(queue).slice(0, 120);
    });
  }

  function trackPageView() {
    pageStartedAt = Date.now();
    maxScroll = getScrollDepth();
    scrollMarksTracked = new Set();
    track('page_view');
  }

  function trackPageExit() {
    track('page_exit', {
      scrollDepth: maxScroll,
      metadata: { timeOnPageSeconds: Math.round((Date.now() - pageStartedAt) / 1000) },
    });
    flush();
  }

  function onClick(event) {
    const info = getElementInfo(event.target);
    const now = Date.now();
    const x = Math.round((event.clientX / Math.max(1, window.innerWidth)) * 1000) / 10;
    const y = Math.round(((event.clientY + window.scrollY) / Math.max(1, document.documentElement.scrollHeight)) * 1000) / 10;
    const isInteractive = Boolean(info.elementTag);
    const clickPayload = { x, y, scrollDepth: getScrollDepth(), ...info };

    track(isInteractive ? 'click' : 'dead_click', clickPayload);

    lastClicks = lastClicks.filter(item => now - item.at < 1400);
    lastClicks.push({ at: now, x: event.clientX, y: event.clientY });
    const nearbyClicks = lastClicks.filter(item => Math.abs(item.x - event.clientX) < 28 && Math.abs(item.y - event.clientY) < 28);
    if (nearbyClicks.length >= 3) track('rage_click', clickPayload);

    const href = info.href || '';
    if (info.conversionName) track('conversion', { ...clickPayload, conversionName: info.conversionName });
    if (href.startsWith('tel:')) track('conversion', { ...clickPayload, conversionName: 'Phone click' });
    if (href.startsWith('mailto:')) track('conversion', { ...clickPayload, conversionName: 'Email click' });
    if (href.includes('wa.me') || href.includes('whatsapp')) track('conversion', { ...clickPayload, conversionName: 'WhatsApp click' });
  }

  function onSubmit(event) {
    const label = event.target?.getAttribute?.('data-analytics-label') || event.target?.id || 'Form submission';
    track('conversion', { conversionName: label, elementTag: 'form', elementText: label });
  }

  function onInput(event) {
    const tag = event.target?.tagName?.toLowerCase();
    if (!['input', 'select', 'textarea'].includes(tag)) return;
    const info = getElementInfo(event.target);
    track('form_interaction', { ...info, elementTag: tag });
  }

  function onScroll() {
    const depth = getScrollDepth();
    if (depth > maxScroll) maxScroll = depth;
    for (const mark of [25, 50, 75, 90, 100]) {
      if (depth >= mark && !scrollMarksTracked.has(mark)) {
        scrollMarksTracked.add(mark);
        track('scroll', { scrollDepth: mark });
      }
    }
  }

  function onMouseMove(event) {
    if (!config.trackMouse) return;
    const now = Date.now();
    if (now - lastMouseMove < config.sampleMouseMoveMs) return;
    lastMouseMove = now;
    track('mouse_move', {
      x: Math.round((event.clientX / Math.max(1, window.innerWidth)) * 1000) / 10,
      y: Math.round(((event.clientY + window.scrollY) / Math.max(1, document.documentElement.scrollHeight)) * 1000) / 10,
      scrollDepth: getScrollDepth(),
    });
  }

  function onTouch(event) {
    if (!config.trackTouch) return;
    const touch = event.changedTouches?.[0];
    if (!touch) return;
    track('touch', {
      x: Math.round((touch.clientX / Math.max(1, window.innerWidth)) * 1000) / 10,
      y: Math.round(((touch.clientY + window.scrollY) / Math.max(1, document.documentElement.scrollHeight)) * 1000) / 10,
      scrollDepth: getScrollDepth(),
    });
  }

  async function start() {
    try {
      const response = await fetch(config.configEndpoint);
      if (response.ok) remoteConfig = await response.json();
    } catch {}
    if (remoteConfig.trackingEnabled === false) return () => {};
    enabled = true;
    trackPageView();
    flushTimer = window.setInterval(flush, config.flushIntervalMs);
    document.addEventListener('click', onClick, { passive: true });
    document.addEventListener('submit', onSubmit, true);
    document.addEventListener('change', onInput, true);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('touchend', onTouch, { passive: true });
    window.addEventListener('pagehide', trackPageExit);
    window.addEventListener('analytics-consent-changed', flush);

    return () => {
      trackPageExit();
      enabled = false;
      window.clearInterval(flushTimer);
      document.removeEventListener('click', onClick);
      document.removeEventListener('submit', onSubmit, true);
      document.removeEventListener('change', onInput, true);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchend', onTouch);
      window.removeEventListener('pagehide', trackPageExit);
      window.removeEventListener('analytics-consent-changed', flush);
    };
  }

  return { start, track, flush };
}
