/**
 * Astro env types — P0-3 (2026-07-19).
 * Augments Astro's `App.Locals` so middleware can set `requestId`
 * and route handlers can read it without unsafe `any` casts.
 */

/// <reference path="../.astro/types.d.ts" />

declare namespace App {
  interface Locals {
    /** Request ID propagated by middleware (UUID v4 or upstream X-Request-Id). */
    requestId: string;
  }
}

interface ImportMetaEnv {
  readonly SENTRY_DSN?: string;
  readonly SENTRY_RELEASE?: string;
  readonly SENTRY_TRACES_SAMPLE_RATE?: string;
  readonly LOG_LEVEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
