/**
 * ga4-server.ts — GA4 Measurement Protocol (server-side) sender.
 *
 * Sends approved server-owned GA4 events after explicit visitor consent.
 * Lead reconciliation is emitted by the API only for a newly inserted row.
 *
 * Contract:
 *   - BEST-EFFORT. Any throw is swallowed by the caller (try/catch in
 *     lead.ts). A GA4 failure MUST NEVER fail a lead enqueue.
 *   - SAFE FALLBACK. If `GA4_API_SECRET` or `GA4_MEASUREMENT_SECRET` is
 *     empty/placeholder, the function logs a warning and returns — local
 *     dev works without secrets. Production must set both in Render env.
 *   - NO PII. Callers must pass only approved, non-identifying fields; this module
 *     additionally strips any key matching the PII suffix rule.
 *
 * Env vars (Render → Environment):
 *   - GA4_API_SECRET         — GA4 Measurement Protocol API secret
 *                               (create in GA4 → Admin → Data Streams →
 *                               choose stream → Measurement Protocol API
 *                               secrets → Create).
 *   - GA4_MEASUREMENT_SECRET — the Measurement ID (stream id), e.g.
 *                               `G-9LMB4PGTWJ`. Named `*_SECRET` per the
 *                               EXEC-10 prompt, though it is not actually
 *                               sensitive (it is public in the gtag URL).
 *
 * Reference:
 *   https://developers.google.com/analytics/devguides/collection/protocol/ga4
 *
 * @module lib/ga4-server
 */

// Measurement Protocol endpoint. `/mp/collect` for production;
// `/debug/mp/collect` mirrors the payload and returns validation errors
// (use for GA4 DebugView troubleshooting).
const MP_ENDPOINT = 'https://www.google-analytics.com/mp/collect';
const MP_DEBUG_ENDPOINT = 'https://www.google-analytics.com/debug/mp/collect';

// Best-effort budget. The lead route cannot hang on GA4. 3s covers slow
// networks without blocking the response meaningfully.
const SEND_TIMEOUT_MS = 3000;

// Placeholder values that mean "not configured". Matches the Groq
// placeholder convention in api/ai/chat.ts.
const PLACEHOLDER = /^(your_.*_placeholder|placeholder|example|test-?xxx|)$/i;

export interface ServerEvent {
  /** GA4 event name, for example `lead_created` or another approved event. */
  name: string;
  /** Event params. Must NOT contain PII. */
  params?: Record<string, unknown>;
}

export interface SendServerEventOptions {
  events: ServerEvent[];
  /**
   * GA4 client_id. Prefer the `_ga` cookie value (e.g. `GA1.1.123.456`)
   * so server events stitch to the same session as client gtag events.
   * Falls back to a stable hash of IP + UA (never raw PII).
   */
  clientId?: string;
  /** When true, hits the debug endpoint (returns validation JSON). */
  debug?: boolean;
}

/** Keys never allowed in server event params (mirrors analytics.ts PII
 *  suffix rule, minimal subset for server path). */
const PII_SUFFIX = /(_email|_phone|_name|_message|_address)$/i;
const PII_EXACT = new Set([
  'email', 'phone', 'name', 'message', 'address', 'company',
  'subject', 'body', 'notes', 'contact', 'url', 'href',
]);

function stripPii(params?: Record<string, unknown>): Record<string, unknown> {
  if (!params) return {};
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (PII_EXACT.has(key) || PII_SUFFIX.test(key)) continue;
    clean[key] = value;
  }
  return clean;
}

/**
 * Resolve GA4 config from env. Returns null if not configured (safe
 * fallback). The Measurement ID has two env names: the canonical
 * `GA4_MEASUREMENT_SECRET` (per EXEC-10 prompt) and a fallback to the
 * public site tag `G-9LMB4PGTWJ` so production works even if only the
 * API secret is set.
 */
function resolveConfig(): { apiSecret: string; measurementId: string } | null {
  const apiSecret = (process.env.GA4_API_SECRET ?? '').trim();
  const measurementId = (process.env.GA4_MEASUREMENT_SECRET ?? '').trim();

  if (!apiSecret || PLACEHOLDER.test(apiSecret)) {
    // Silent in production to avoid log noise; warn in dev.
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(
        '[ga4-server] GA4_API_SECRET not configured — server events are no-op. ' +
          'Set it in Render env (GA4 → Data Streams → Measurement Protocol API secrets).',
      );
    }
    return null;
  }

  // Measurement ID: prefer env, fall back to the public site tag. It is
  // not actually secret — it ships in every page's gtag URL.
  const finalMeasurementId = measurementId && !PLACEHOLDER.test(measurementId)
    ? measurementId
    : 'G-9LMB4PGTWJ';

  return { apiSecret, measurementId: finalMeasurementId };
}

/**
 * Send one or more GA4 events server-side via the Measurement Protocol.
 *
 * Resolves void on success OR safe-skip. Never rejects — any network /
 * parse error is logged and swallowed so the lead route stays durable.
 */
export async function sendServerEvent(
  opts: SendServerEventOptions,
): Promise<void> {
  const cfg = resolveConfig();
  if (!cfg) return; // not configured → no-op

  const { apiSecret, measurementId } = cfg;
  const clientId =
    opts.clientId && opts.clientId.trim()
      ? opts.clientId.trim()
      : '555'; // GA4 requires a non-empty client_id; 555 is the documented fallback.

  if (!opts.events.length) return;

  const payload = {
    client_id: clientId,
    events: opts.events.map((e) => ({
      name: e.name,
      params: { engagement_time_msec: 100, ...stripPii(e.params) },
    })),
  };

  const endpoint =
    (opts.debug ? MP_DEBUG_ENDPOINT : MP_ENDPOINT) +
    `?measurement_id=${encodeURIComponent(measurementId)}` +
    `&api_secret=${encodeURIComponent(apiSecret)}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
      // Server-to-server; no cookies/credentials.
      credentials: 'omit',
      // Keep redirect behavior explicit; GA4 does not redirect.
      redirect: 'manual',
    });

    if (!res.ok && res.status !== 204) {
      // Debug endpoint returns JSON with validation messages; log a short
      // prefix only — never the full body (may echo params).
      // eslint-disable-next-line no-console
      console.warn(
        `[ga4-server] MP responded ${res.status} for events:`,
        opts.events.map((e) => e.name).join(','),
      );
    }
  } catch (err) {
    // Network error, DNS, abort (timeout). All best-effort.
    const aborted = err instanceof Error && err.name === 'AbortError';
    // eslint-disable-next-line no-console
    console.warn(
      `[ga4-server] ${aborted ? 'timeout' : 'network error'} sending events:`,
      opts.events.map((e) => e.name).join(','),
    );
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Parse the GA4 client_id from a Cookie header. The `_ga` cookie is
 * shaped `GA1.<scope>.<rand>.<timestamp>`; gtag uses the last two
 * numeric segments (`<rand>.<timestamp>`) as client_id to stitch
 * client + server events into one session.
 *
 * Returns undefined if the cookie is absent or malformed.
 */
export function parseClientIdFromCookie(
  cookieHeader: string | null | undefined,
): string | undefined {
  if (!cookieHeader) return undefined;
  const match = cookieHeader.match(/_ga=GA1\.\d+\.(?<cid>\d+\.\d+)/);
  return match?.groups?.cid;
}
