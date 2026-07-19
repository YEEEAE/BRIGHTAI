/**
 * @brightai/dashboard — Sentry init (server + edge).
 *
 * P0-3 (2026-07-19): alerts path. Sentry is initialized only when
 * SENTRY_DSN is set in env (so dev + CI work without it). When set,
 * every server-side error is captured with org-scoped context.
 *
 * The init is idempotent — calling it twice is safe.
 *
 * Wiring:
 *   - `apps/dashboard/instrumentation.ts` (Next.js) calls
 *     initServerSentry() on the Node runtime.
 *   - `lib/firewall/audit/durable.ts` calls captureCriticalAlert()
 *     from logAuditFailure so audit persistence failures page on-call.
 *   - Route handlers may call `captureException(err)` for unhandled
 *     errors. The PII scrubber runs in the beforeSend hook.
 */

import * as Sentry from '@sentry/nextjs';
import { getRequestContext } from './request-context';
import { scrubValue, scrubError } from './pii-scrubber';

let initialized = false;

/**
 * Initialize Sentry on the server. No-op if SENTRY_DSN is unset.
 * Safe to call multiple times.
 */
export function initServerSentry(): void {
  if (initialized) return;
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    // No DSN — stay quiet in dev. Production must set SENTRY_DSN.
    return;
  }
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    release: process.env.SENTRY_RELEASE ?? undefined,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    // PII scrubbing — runs before any event leaves the process.
    beforeSend(event) {
      try {
        if (event.exception?.values) {
          event.exception.values = event.exception.values.map((e) => {
            e.value = scrubString(e.value ?? '');
            return e;
          });
        }
        if (event.message) event.message = scrubString(event.message);
        if (event.extra) {
          event.extra = scrubValue(event.extra) as Record<string, unknown>;
        }
        if (event.contexts) {
          const scrubbed = scrubValue(event.contexts) as Record<string, unknown>;
          // Sentry's Contexts type expects each value to be a Context
          // (object with typed fields). After scrubbing we may end up
          // with primitive values; the safest thing is to merge into
          // `extra` which accepts free-form Record<string, unknown>.
          event.extra = { ...(event.extra ?? {}), ...scrubbed };
          delete event.contexts;
        }
        return event;
      } catch {
        return null; // drop the event if scrubbing fails
      }
    },
  });
  initialized = true;
}

/**
 * Capture an exception with org-scoped context. Safe to call when
 * Sentry is not initialized (becomes a no-op).
 */
export function captureException(err: unknown, extra?: Record<string, unknown>): void {
  const ctx = getRequestContext();
  Sentry.withScope((scope) => {
    if (ctx?.organizationId) scope.setTag('organizationId', ctx.organizationId);
    if (ctx?.userId) scope.setUser({ id: ctx.userId });
    if (ctx?.requestId) scope.setTag('requestId', ctx.requestId);
    if (extra) scope.setExtras(scrubValue(extra) as Record<string, unknown>);
    Sentry.captureException(scrubError(err));
  });
}

/**
 * Capture a critical alert (audit failure, hash chain break, P0
 * firewall block). Always uses `fatal` level so it pages on-call.
 */
export function captureCriticalAlert(
  event: string,
  fields: Record<string, unknown> = {},
): void {
  const ctx = getRequestContext();
  Sentry.withScope((scope) => {
    scope.setLevel('fatal');
    if (ctx?.organizationId) scope.setTag('organizationId', ctx.organizationId);
    if (ctx?.userId) scope.setUser({ id: ctx.userId });
    if (ctx?.requestId) scope.setTag('requestId', ctx.requestId);
    scope.setExtras(scrubValue(fields) as Record<string, unknown>);
    Sentry.captureMessage(`critical: ${event}`, 'fatal');
  });
}

/** Helper for beforeSend (avoid pulling in the scrub module twice). */
function scrubString(s: string): string {
  return scrubValue(s) as string;
}
