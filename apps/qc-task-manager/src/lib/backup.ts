// SQLite online backups for QC Task Manager.
//
// The source is opened read-only and copied through SQLite's online backup
// API. This is intentionally different from copying qc_tasks.db directly:
// SQLite's API reads a consistent snapshot while WAL pages are still active.
// Backup files and status metadata live outside public/ and are gitignored.

import Database from 'better-sqlite3';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';

export const BACKUP_RETENTION = 14;
export const BACKUP_TIME_ZONE = 'Asia/Riyadh';
export const BACKUP_FILE_PATTERN = /^qc_tasks-\d{4}-\d{2}-\d{2}-\d{6}\.db$/;
const STATUS_FILE_NAME = 'status.json';

export type BackupTrigger = 'scheduled' | 'manual' | 'cli' | 'test';

export interface BackupOptions {
  /** Absolute path to the source SQLite database file. */
  dbPath: string;
  /** Directory where timestamped backup files are written. */
  backupDir: string;
  /** How many backups to keep (oldest pruned). Default 14. */
  keep?: number;
  /** Caller used for structured logs and admin status. */
  trigger?: BackupTrigger;
}

export interface BackupResult {
  /** Full path of the created backup file. */
  file: string;
  /** File name only (qc_tasks-YYYY-MM-DD-HHmmss.db). */
  name: string;
  /** Size in bytes. */
  size: number;
  /** How many old backups were pruned by retention. */
  pruned: number;
}

export interface BackupStatus {
  state: 'never' | 'success' | 'failure';
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastError: string | null;
  lastBackupName: string | null;
  lastBackupSize: number | null;
  lastTrigger: BackupTrigger | null;
}

export interface BackupFile {
  name: string;
  file: string;
  size: number;
  modifiedAt: string;
}

const EMPTY_STATUS: BackupStatus = {
  state: 'never',
  lastAttemptAt: null,
  lastSuccessAt: null,
  lastFailureAt: null,
  lastError: null,
  lastBackupName: null,
  lastBackupSize: null,
  lastTrigger: null,
};

let activeBackup: Promise<BackupResult> | null = null;

function riyadhParts(date: Date): Record<string, string> {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: BACKUP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  return Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
}

/** Local Riyadh timestamp used in backup names. */
export function backupTimestamp(date = new Date()): string {
  const p = riyadhParts(date);
  return `${p.year}-${p.month}-${p.day}-${p.hour}${p.minute}${p.second}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function statusPath(backupDir: string): string {
  return join(resolve(backupDir), STATUS_FILE_NAME);
}

function writeStatus(backupDir: string, status: BackupStatus): void {
  mkdirSync(backupDir, { recursive: true });
  const target = statusPath(backupDir);
  const temp = `${target}.tmp`;
  writeFileSync(temp, `${JSON.stringify(status, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
  renameSync(temp, target);
}

export function getBackupStatus(backupDir: string): BackupStatus {
  const target = statusPath(backupDir);
  if (!existsSync(target)) return { ...EMPTY_STATUS };
  try {
    const parsed = JSON.parse(readFileSync(target, 'utf8')) as Partial<BackupStatus>;
    return {
      ...EMPTY_STATUS,
      ...parsed,
      state: parsed.state === 'success' || parsed.state === 'failure' ? parsed.state : 'never',
    };
  } catch {
    return { ...EMPTY_STATUS, state: 'failure', lastError: 'Backup status file is unreadable.' };
  }
}

export function listBackups(backupDir: string): BackupFile[] {
  if (!existsSync(backupDir)) return [];
  return readdirSync(backupDir)
    .filter((name) => BACKUP_FILE_PATTERN.test(name))
    .map((name) => {
      const file = join(backupDir, name);
      const stats = statSync(file);
      return { name, file, size: stats.size, modifiedAt: stats.mtime.toISOString() };
    })
    .sort((a, b) => b.name.localeCompare(a.name));
}

function log(message: string, error?: unknown): void {
  if (error) {
    console.error(`[backup] ${message}`, error);
  } else {
    console.info(`[backup] ${message}`);
  }
}

async function performBackup(options: BackupOptions): Promise<BackupResult> {
  const trigger = options.trigger ?? 'cli';
  const attemptedAt = nowIso();
  const previous = getBackupStatus(options.backupDir);
  writeStatus(options.backupDir, { ...previous, lastAttemptAt: attemptedAt, lastTrigger: trigger });

  try {
    const keep = options.keep ?? BACKUP_RETENTION;
    if (!Number.isInteger(keep) || keep < 1) throw new Error('Backup retention must be a positive integer.');
    if (!existsSync(options.dbPath)) throw new Error(`Database file not found: ${options.dbPath}`);

    mkdirSync(options.backupDir, { recursive: true });
    // Manual and CLI calls can happen more than once in one second. Keep the
    // required second-resolution format while avoiding an accidental overwrite
    // by advancing the candidate timestamp until the name is free.
    let timestampDate = new Date();
    let name = `qc_tasks-${backupTimestamp(timestampDate)}.db`;
    while (existsSync(join(options.backupDir, name))) {
      timestampDate = new Date(timestampDate.getTime() + 1_000);
      name = `qc_tasks-${backupTimestamp(timestampDate)}.db`;
    }
    const file = join(options.backupDir, name);
    // The online backup API creates a consistent destination snapshot from
    // SQLite's pager, including committed pages currently held in the WAL.
    const source = new Database(options.dbPath, { readonly: true, fileMustExist: true });
    try {
      await source.backup(file);
    } finally {
      source.close();
    }
    // The source database runs in WAL mode, so better-sqlite3 may create the
    // destination in WAL mode too. Normalize the standalone backup to the
    // DELETE journal so the restore unit is one .db file, never a required
    // pair of copied WAL/SHM sidecars.
    const normalized = new Database(file);
    try {
      normalized.pragma('journal_mode = DELETE');
    } finally {
      normalized.close();
    }

    const backups = listBackups(options.backupDir);
    let pruned = 0;
    for (const old of backups.slice(keep)) {
      rmSync(old.file, { force: true });
      pruned += 1;
    }

    const size = statSync(file).size;
    const status: BackupStatus = {
      state: 'success',
      lastAttemptAt: attemptedAt,
      lastSuccessAt: nowIso(),
      lastFailureAt: null,
      lastError: null,
      lastBackupName: name,
      lastBackupSize: size,
      lastTrigger: trigger,
    };
    writeStatus(options.backupDir, status);
    log(`created ${name} (${size} bytes, trigger=${trigger}, pruned=${pruned})`);
    return { file, name, size, pruned };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status: BackupStatus = {
      ...getBackupStatus(options.backupDir),
      state: 'failure',
      lastAttemptAt: attemptedAt,
      lastFailureAt: nowIso(),
      lastError: message,
      lastTrigger: trigger,
    };
    writeStatus(options.backupDir, status);
    log(`failed (trigger=${trigger}): ${message}`, error);
    throw error;
  }
}

/** Take one serialized, WAL-safe backup and apply retention. */
export function createBackup(options: BackupOptions): Promise<BackupResult> {
  if (activeBackup) return activeBackup;
  activeBackup = performBackup(options).finally(() => {
    activeBackup = null;
  });
  return activeBackup;
}

export function backupDirectoryForDatabase(dbPath: string): string {
  return resolve(join(dirname(resolve(dbPath)), 'backups'));
}
