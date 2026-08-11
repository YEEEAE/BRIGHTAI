// SQLite backup via better-sqlite3's online backup API (no external tools).
//
// Used programmatically (e.g. a future admin button) and by the `db:backup`
// npm script (scripts/backup-db.mjs mirrors this logic in plain JS for
// Node-20 compatibility — keep them in sync).
//
// The backup is taken on a READ-ONLY connection so it never contends with the
// app's writer, and better-sqlite3's backup() checkpoints the WAL correctly
// even while the app is running.

import Database from 'better-sqlite3';
import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';

export interface BackupOptions {
  /** Absolute path to the source SQLite database file. */
  dbPath: string;
  /** Directory where timestamped backup files are written. */
  backupDir: string;
  /** How many backups to keep (oldest pruned). Default 14. */
  keep?: number;
}

export interface BackupResult {
  /** Full path of the created backup file. */
  file: string;
  /** File name only (qc_tasks-YYYYMMDD-HHMMSS.db). */
  name: string;
  /** Size in bytes. */
  size: number;
  /** How many old backups were pruned by retention. */
  pruned: number;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Local timestamp used in backup file names. Milliseconds are included so two
 * backups in the same second never collide (the CLI / tests can create them
 * back-to-back).
 */
export function backupTimestamp(d = new Date()): string {
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-` +
    `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}` +
    `${pad(d.getMilliseconds())}`
  );
}

/**
 * Take a timestamped online backup of `dbPath` into `backupDir` and prune old
 * backups past `keep`. Throws a descriptive Error when the source DB is
 * missing or the backup fails.
 */
export async function createBackup(options: BackupOptions): Promise<BackupResult> {
  const keep = options.keep ?? 14;
  if (!existsSync(options.dbPath)) {
    throw new Error(`Database file not found: ${options.dbPath}`);
  }
  mkdirSync(options.backupDir, { recursive: true });

  const name = `qc_tasks-${backupTimestamp()}.db`;
  const file = join(options.backupDir, name);

  // Read-only source connection — the online backup checkpoints WAL pages
  // without ever writing to the live database.
  const source = new Database(options.dbPath, { readonly: true, fileMustExist: true });
  try {
    await source.backup(file);
  } finally {
    source.close();
  }

  // Retention: keep the newest `keep` backups, delete the rest.
  const backups = readdirSync(options.backupDir)
    .filter((f) => f.endsWith('.db'))
    .map((f) => join(options.backupDir, f))
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);

  let pruned = 0;
  for (const old of backups.slice(keep)) {
    rmSync(old, { force: true });
    pruned += 1;
  }

  return { file, name, size: statSync(file).size, pruned };
}
