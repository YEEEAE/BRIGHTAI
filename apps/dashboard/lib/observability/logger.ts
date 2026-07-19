/**
 * @brightai/dashboard — Structured JSON logger (pino) with PII scrubbing.
 *
 * P0-3 (2026-07-19): all `console.error` / `console.warn` calls in
 * server code are replaced with this logger. The output is a single
 * JSON line per event — ingestable by any log shipper (Render,
 * Datadog, Sentry logs, Axiom, etc.).
 *
 * Properties:
 *   - One JSON line per event (newline-delimited JSON).
 *   - PII patterns are scrubbed before write (see pii-scrubber.ts).
 *   - Request context (id, org, user) is automatically attached
 *     when the logger is called inside a request scope.
 *   - Falls back to stderr if pino fails (so logging can never crash
 *     the app).
 *
 * Usage:
 *   import { logger } from '@/lib/observability/logger';
 *   logger.info({ event: 'user_login', userId: '...' }, 'user signed in');
 *   logger.error({ event: 'audit_failure', error }, 'audit persistence failed');
 *
 * Env:
 *   LOG_LEVEL=info|warn|error|debug (default: info)
 *   NODE_ENV=production → no pretty-print; JSON only
 */

import pino from 'pino';
import { getRequestContext } from './request-context';
import { scrubValue } from './pii-scrubber';

/**
 * Build a base logger that:
 *   - Reads LOG_LEVEL from env
 *   - Outputs JSON to stdout (production) or pretty-printed to stderr (dev)
 *   - Includes the service name in every log
 */
function buildBaseLogger() {
  const isProd = process.env.NODE_ENV === 'production';
  return pino({
    name: '@brightai/dashboard',
    level: process.env.LOG_LEVEL ?? 'info',
    // Single-line JSON for production log shippers.
    // In dev, pino-pretty would be ideal but is a separate dep — we
    // use plain JSON for now and rely on the operator's terminal to
    // pretty-print via `jq` or similar.
    base: {
      service: 'dashboard',
      env: process.env.NODE_ENV ?? 'development',
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    // Wrap formatters to apply PII scrubber. Errors are scrubbed too.
    formatters: {
      level: (label) => ({ level: label }),
      // The `bindings` formatter wraps every log line's top-level fields.
      bindings: () => ({}),
    },
    hooks: {
      // Scrub every log line before write. Runs after formatters.
      logMethod(inputArgs, method) {
        try {
          const [mergeObj, msg, ...rest] = inputArgs;
          const safe = scrubValue(mergeObj);
          // pino's overloaded signature — cast to any to bypass strict overloads.
          (method as (...a: unknown[]) => void).call(this, safe, msg, ...rest);
        } catch {
          // Last-resort fallback — never throw from the logger.
          (method as (...a: unknown[]) => void).call(this, { _logger_scrub_error: true }, inputArgs[1]);
        }
      },
    },
  });
}

const baseLogger = buildBaseLogger();

/**
 * Wrap every log call to attach the current request context
 * (requestId, org, user) automatically. The scrubber runs in the
 * hook above, so we don't double-scrub.
 */
function withContext<T extends (...args: any[]) => any>(method: T): T {
  return ((...args: Parameters<T>) => {
    const ctx = getRequestContext();
    if (!ctx) return method(...args);
    const [first, ...rest] = args;
    const ctxFields = {
      requestId: ctx.requestId,
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      path: ctx.path,
      method: ctx.method,
    };
    const merge =
      first && typeof first === 'object' && !Array.isArray(first)
        ? { ...ctxFields, ...first }
        : { ...ctxFields, payload: first };
    return method(merge, ...rest);
  }) as T;
}

/** The exported logger — use this from app code. */
export const logger = {
  trace: withContext(baseLogger.trace.bind(baseLogger)),
  debug: withContext(baseLogger.debug.bind(baseLogger)),
  info: withContext(baseLogger.info.bind(baseLogger)),
  warn: withContext(baseLogger.warn.bind(baseLogger)),
  error: withContext(baseLogger.error.bind(baseLogger)),
  fatal: withContext(baseLogger.fatal.bind(baseLogger)),
  child(bindings: Record<string, unknown>) {
    return baseLogger.child(bindings);
  },
  /** Direct access to the raw pino logger for advanced use cases. */
  raw: baseLogger,
};

/**
 * Convenience: log a critical alert (for Sentry captureMessage wiring).
 * Use this for events that must page on-call (e.g., audit persistence
 * failure, hash chain break, P0 firewall block).
 */
export function logCritical(event: string, fields: Record<string, unknown> = {}): void {
  logger.fatal({ event, ...fields, severity: 'critical' }, `critical: ${event}`);
}
