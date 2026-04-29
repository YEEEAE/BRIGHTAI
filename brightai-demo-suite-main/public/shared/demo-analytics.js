/**
 * BrightAI Demo — Lightweight Analytics
 * Tracks demo interaction events in sessionStorage.
 * No external tracking. Purely local session stats for the demo UI.
 */

const STORAGE_KEY = 'brightai_demo_analytics';

function getStore() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveStore(data) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Records a demo interaction event.
 * @param {string} demoId
 * @param {'query'|'example_click'|'faq_open'|'error'} eventType
 */
export function trackEvent(demoId, eventType) {
  const store = getStore();
  if (!store[demoId]) store[demoId] = { queries: 0, errors: 0, example_clicks: 0, faq_opens: 0 };

  const map = { query: 'queries', error: 'errors', example_click: 'example_clicks', faq_open: 'faq_opens' };
  const key = map[eventType];
  if (key) store[demoId][key]++;

  saveStore(store);
}

/**
 * Returns stats for a specific demo.
 * @param {string} demoId
 * @returns {{ queries: number, errors: number, example_clicks: number, faq_opens: number }}
 */
export function getDemoStats(demoId) {
  const store = getStore();
  return store[demoId] || { queries: 0, errors: 0, example_clicks: 0, faq_opens: 0 };
}

/**
 * Clears analytics for a demo.
 * @param {string} demoId
 */
export function clearDemoStats(demoId) {
  const store = getStore();
  delete store[demoId];
  saveStore(store);
}
