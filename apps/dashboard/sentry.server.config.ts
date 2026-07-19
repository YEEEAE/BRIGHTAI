/**
 * @brightai/dashboard — Sentry server config (Next.js 15 convention).
 *
 * P0-3 (2026-07-19): configures Sentry's automatic instrumentation
 * (OpenTelemetry, fetch hooks, etc.). The actual init is in
 * `instrumentation.ts` to allow Sentry to be a no-op when DSN is
 * unset (dev + CI).
 *
 * Sentry reads this file via `@sentry/nextjs`'s `withSentryConfig`.
 * We don't wrap withSentryConfig in `next.config.mjs` yet because
 * the dynamic init in `instrumentation.ts` is enough for now.
 *
 * See https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  // Empty config — actual init happens in instrumentation.ts
  // (which respects SENTRY_DSN env var and is no-op in dev).
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0,
  // Disable the default Next.js integration (we have our own).
  // This file is only loaded if the user explicitly runs
  // `withSentryConfig` in next.config.mjs, so it's currently inert.
  enabled: false,
});
