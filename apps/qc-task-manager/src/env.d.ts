/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly QC_DB_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// The resolved session user attached by src/middleware.ts onto EVERY request.
// It is null for anonymous visitors on public routes, and a full SessionData
// for authenticated users on every other route (the middleware guarantees it
// is set before any page or endpoint runs).
//
// NOTE: this must reference the lib type via the inline `import()` path because
// inside `namespace App` the bare name `SessionData` resolves to Astro's own
// (empty) App.SessionData for its built-in sessions feature.
declare namespace App {
  interface Locals {
    user: import('./lib/types').SessionData | null;
  }
}
