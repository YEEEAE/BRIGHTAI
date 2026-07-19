/**
 * src/lib/observability/sentry.ts — Sentry init for Astro SSR.
 *
 * P0-3 (2026-07-19). Uses @sentry/node (no @sentry/astro because the
 * init is manual + the Astro integration doesn't add value for our
 * 3 SSR routes).
 *
 * Init is idempotent and no-op when SENTRY_DSN is unset.
 */

import * as Sentry from '@sentry/node';
import { scrubValue } from './logger';

let initialized = false;

/** Initialize Sentry for the Astro Node server. Safe to call twice. */
export function initSentry(): void {
  if (initialized) return;
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    release: process.env.SENTRY_RELEASE ?? undefined,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    beforeSend(event) {
      try {
        if (event.exception?.values) {
          event.exception.values = event.exception.values.map((e) => {
            e.value = scrubValue(e.value ?? '') as string;
            return e;
          });
        }
        if (event.message) event.message = scrubValue(event.message) as string;
        if (event.extra) event.extra = scrubValue(event.extra) as Record<string, unknown>;
        if (event.contexts) event.contexts = scrubValue(event.contexts) as Record<string, unknown>;
        return event;
      } catch {
        return null;
      }
    },
  });
  initialized = true;
}

/** Capture an exception. No-op when Sentry is not initialized. */
export function captureException(err: unknown, extra?: Record<string, unknown>): void {
  Sentry.captureException(err, { extra: scrubValue(extra) as Record<string, unknown> });
}

/** Capture a critical alert (fatal level). */
export function captureCriticalAlert(
  event: string,
  fields: Record<string, unknown> = {},
): void {
  Sentry.captureMessage(`critical: ${event}`, {
    level: 'fatal',
    extra: scrubValue(fields) as Record<string, unknown>,
  });
}
