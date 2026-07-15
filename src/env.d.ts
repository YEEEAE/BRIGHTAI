/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

/**
 * env.d.ts — Ambient TypeScript declarations for Astro.
 *
 * REPORTS-CSP-01 (2026-07-15): Extend the Astro.locals type with the
 * per-request CSP nonce set by src/middleware.ts. Pages and layouts
 * can read Astro.locals.cspNonce to stamp inline <script> tags.
 */

declare namespace App {
  interface Locals {
    /**
     * Cryptographically random nonce generated per request by middleware.ts.
     * Use this value on every inline <script nonce={Astro.locals.cspNonce}>
     * or inline <style nonce={Astro.locals.cspNonce}> to satisfy CSP
     * script-src / style-src without 'unsafe-inline'.
     *
     * Only available on SSR responses (output: 'static' + adapter=node).
     * Undefined for prerendered pages served as static files.
     */
    cspNonce?: string;
  }
}