/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** Spec env var for the SQLite database path (see src/lib/db.ts). */
  readonly QC_DATABASE_PATH?: string;
  /** Legacy alias for QC_DATABASE_PATH, kept for backward compatibility. */
  readonly QC_DB_PATH?: string;
  /** Explicit backup output directory (see configuredBackupDirectory in
   *  src/lib/backup.ts); falls back to a backups/ sibling of the database. */
  readonly QC_BACKUP_DIR?: string;
  readonly QC_BACKUP_RETENTION?: string;
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
    requestId: string;
  }
}
