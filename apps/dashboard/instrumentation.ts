/**
 * @brightai/dashboard — Next.js instrumentation hook.
 *
 * P0-3 (2026-07-19): server-side Sentry init. This file is the
 * Next.js 15 convention for runtime initialization. It runs once
 * per server boot, before any request is handled.
 *
 * Next.js auto-discovers this file (it must be at the root of the
 * app source). See https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

/**
 * Next.js calls this on server boot. The `register()` API was
 * added in Next.js 15; it lets us run code on a specific runtime.
 */
export async function register(): Promise<void> {
  // Lazy import so the instrumentation bundle stays small for the
  // edge runtime (which doesn't need Sentry).
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initServerSentry } = await import('./lib/observability/sentry');
    initServerSentry();
  }
}
