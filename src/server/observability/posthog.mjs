// Explicit product analytics for the approved Beta only.
//
// There is no client SDK, no auto-capture, no session recording/replay, no
// heatmaps, no form capture, and no cross-domain or web-vitals collection.
// Only the named events below can be emitted, only with the named properties.
// Every event uses a fresh random distinct_id and disables person profiles, so
// no user, tenant, email, IP, or raw identifier is linked across events.
import { randomUUID } from 'node:crypto';
import { posthogSettings } from './config.mjs';
import { safeActionCategory, safeProduct, safeSection, safeStatus } from './redact.mjs';

const TIMEOUT_MS = 2000;

const EVENT_RULES = Object.freeze({
  portal_viewed: new Set(['section']),
  login_flow_result: new Set(['status_code']),
  product_opened: new Set(['product']),
  policy_action_result: new Set(['action_category', 'status_code']),
  quota_exhausted: new Set(['product']),
});

function sanitizeProperty(name, value) {
  if (name === 'status_code') return safeStatus(value);
  if (name === 'section') return safeSection(value);
  if (name === 'product') return safeProduct(value);
  if (name === 'action_category') return safeActionCategory(value);
  return null;
}

// Returns the accepted property set; unknown events or properties are dropped
// entirely rather than partially forwarded.
export function buildProductEvent(name, properties = {}) {
  if (!Object.hasOwn(EVENT_RULES, name) || !properties || typeof properties !== 'object' || Array.isArray(properties)) return null;
  const allowed = EVENT_RULES[name];
  if (!allowed) return null;
  const safe = {};
  for (const [key, value] of Object.entries(properties)) {
    if (!allowed.has(key)) return null;
    const sanitized = sanitizeProperty(key, value);
    if (sanitized === null || sanitized === undefined) return null;
    safe[key] = sanitized;
  }
  return Object.keys(safe).length ? { event: name, properties: safe } : null;
}

async function send(settings, payload) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(settings.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: settings.apiKey,
        distinct_id: randomUUID(),
        event: payload.event,
        properties: {
          // No person profile and no GeoIP enrichment. No tenant/user ID.
          $process_person_profile: false,
          $geoip_disable: true,
          $lib: 'aigas-server',
          environment: settings.environment,
          ...(settings.release ? { release: settings.release } : {}),
          ...payload.properties,
        },
      }),
      signal: controller.signal,
      redirect: 'error',
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

// Fire-and-forget. Callers use `void captureProductEvent(...)`.
export async function captureProductEvent(name, properties = {}) {
  const settings = posthogSettings();
  if (!settings.enabled) return false;
  const payload = buildProductEvent(name, properties);
  if (!payload) return false;
  return send(settings, payload);
}

export const productEventNames = Object.freeze(Object.keys(EVENT_RULES));
