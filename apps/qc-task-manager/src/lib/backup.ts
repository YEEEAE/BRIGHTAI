// SQLite online backups for QC Task Manager.
//
// The source is opened read-only and copied through SQLite's online backup
// API. This is intentionally different from copying qc_tasks.db directly:
// SQLite's API reads a consistent snapshot while WAL pages are still active.
// Backup files and status metadata live outside public/ and are gitignored.

import Database from 'better-sqlite3';
import { createHash } from 'node:crypto';
import {
  copyFileSync,
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
import { fileURLToPath } from 'node:url';

export const BACKUP_RETENTION = 14;
export const BACKUP_TIME_ZONE = 'Asia/Riyadh';
export const BACKUP_FILE_PATTERN = /^qc_tasks-\d{4}-\d{2}-\d{2}-\d{6}\.db$/;
const STATUS_FILE_NAME = 'status.json';
const METADATA_SUFFIX = '.json';
const RESTORE_CONFIRMATION = 'RESTORE QC DATABASE';
const DEFAULT_APPLICATION_VERSION = 'unknown';

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
  metadataFile: string;
  metadata: BackupMetadata;
  verification: VerificationResult;
}

export interface BackupMetadata {
  schemaVersion: number | null;
  applicationVersion: string;
  timestamp: string;
  checksum: string;
  counts: Record<string, number>;
}

export interface VerificationResult {
  result: 'PASS' | 'FAIL';
  file: string;
  integrityCheck: string;
  foreignKeyCheck: 'PASS' | 'FAIL' | 'NOT_RUN';
  schemaVersion: number | null;
  checksum: string | null;
  checks: Record<string, boolean>;
  failures: string[];
}

export interface RestoreResult {
  verification: VerificationResult;
  safetyBackup: BackupResult | null;
  productionDbPath: string;
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
  lastVerificationAt: string | null;
  lastVerificationResult: 'PASS' | 'FAIL' | null;
  lastVerificationError: string | null;
}

export interface BackupFile {
  name: string;
  file: string;
  size: number;
  modifiedAt: string;
  metadataFile: string;
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
  lastVerificationAt: null,
  lastVerificationResult: null,
  lastVerificationError: null,
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

function applicationVersion(): string {
  try {
    const packagePath = resolve(dirname(fileURLToPath(import.meta.url)), '../../package.json');
    return String((JSON.parse(readFileSync(packagePath, 'utf8')) as { version?: string }).version ?? DEFAULT_APPLICATION_VERSION);
  } catch {
    return DEFAULT_APPLICATION_VERSION;
  }
}

function checksum(file: string): string {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

function metadataPath(file: string): string {
  return `${file}${METADATA_SUFFIX}`;
}

function databaseSnapshot(db: Database.Database): { schemaVersion: number | null; counts: Record<string, number> } {
  const tables = new Set((db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[]).map((row) => row.name));
  const counts: Record<string, number> = {};
  for (const table of ['users', 'tasks', 'task_comments', 'task_attachments', 'task_activity_log']) {
    if (tables.has(table)) counts[table] = Number((db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as { count: number }).count);
  }
  const schemaVersion = tables.has('schema_migrations')
    ? Number((db.prepare('SELECT COALESCE(MAX(version), 0) AS version FROM schema_migrations').get() as { version: number }).version)
    : null;
  return { schemaVersion, counts };
}

function writeMetadata(file: string, metadata: BackupMetadata): string {
  const target = metadataPath(file);
  const temp = `${target}.tmp`;
  writeFileSync(temp, `${JSON.stringify(metadata, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
  renameSync(temp, target);
  return target;
}

function readMetadata(file?: string): BackupMetadata | null {
  if (!file || !existsSync(file)) return null;
  try { return JSON.parse(readFileSync(file, 'utf8')) as BackupMetadata; } catch { return null; }
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
      return { name, file, size: stats.size, modifiedAt: stats.mtime.toISOString(), metadataFile: metadataPath(file) };
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
    const keep = backupRetention(options.keep);
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

    const metadataDb = new Database(file, { readonly: true });
    const snapshot = databaseSnapshot(metadataDb);
    metadataDb.close();
    const metadata: BackupMetadata = {
      ...snapshot,
      applicationVersion: applicationVersion(),
      timestamp: nowIso(),
      checksum: checksum(file),
    };
    const metadataFile = writeMetadata(file, metadata);
    const verification = await verifyBackup({ file, metadataFile });
    if (verification.result !== 'PASS') throw new Error(`Created backup failed verification: ${verification.failures.join(' ')}`);

    const backups = listBackups(options.backupDir);
    let pruned = 0;
    for (const old of backups.slice(keep)) {
      rmSync(old.file, { force: true });
      rmSync(old.metadataFile, { force: true });
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
      lastVerificationAt: nowIso(),
      lastVerificationResult: verification.result,
      lastVerificationError: null,
    };
    writeStatus(options.backupDir, status);
    log(`created ${name} (${size} bytes, trigger=${trigger}, pruned=${pruned})`);
    return { file, name, size, pruned, metadataFile, metadata, verification };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status: BackupStatus = {
      ...getBackupStatus(options.backupDir),
      state: 'failure',
      lastAttemptAt: attemptedAt,
      lastFailureAt: nowIso(),
      lastError: message,
      lastTrigger: trigger,
      lastVerificationAt: getBackupStatus(options.backupDir).lastVerificationAt,
      lastVerificationResult: 'FAIL',
      lastVerificationError: message,
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

export function backupRetention(override?: number): number {
  const raw = override ?? Number(process.env.QC_BACKUP_RETENTION ?? BACKUP_RETENTION);
  if (!Number.isInteger(raw) || raw < 1) throw new Error('Backup retention must be a positive integer.');
  return raw;
}

export async function verifyBackup(options: { file: string; metadataFile?: string; expectedSchemaVersion?: number }): Promise<VerificationResult> {
  const failures: string[] = [];
  const checks: Record<string, boolean> = {};
  const metadata = readMetadata(options.metadataFile ?? metadataPath(options.file));
  if (!existsSync(options.file)) {
    return { result: 'FAIL', file: options.file, integrityCheck: 'not run', foreignKeyCheck: 'NOT_RUN', schemaVersion: null, checksum: null, checks: { fileExists: false }, failures: ['Backup file does not exist.'] };
  }
  let db: Database.Database | null = null;
  let snapshot: { schemaVersion: number | null; counts: Record<string, number> } | null = null;
  let integrityCheck = 'not run';
  let foreignKeyCheck: VerificationResult['foreignKeyCheck'] = 'NOT_RUN';
  try {
    db = new Database(options.file, { readonly: true, fileMustExist: true });
    integrityCheck = String((db.prepare('PRAGMA integrity_check').get() as { integrity_check: string }).integrity_check);
    checks.integrityCheck = integrityCheck === 'ok';
    if (!checks.integrityCheck) failures.push(`integrity_check returned ${integrityCheck}.`);
    const fk = db.prepare('PRAGMA foreign_key_check').all();
    foreignKeyCheck = fk.length === 0 ? 'PASS' : 'FAIL';
    checks.foreignKeyCheck = fk.length === 0;
    if (fk.length > 0) failures.push(`foreign_key_check returned ${fk.length} violation(s).`);
    snapshot = databaseSnapshot(db);
    checks.schemaVersion = options.expectedSchemaVersion === undefined || snapshot.schemaVersion === options.expectedSchemaVersion;
    if (!checks.schemaVersion) failures.push(`Schema version ${String(snapshot.schemaVersion)} does not match expected ${String(options.expectedSchemaVersion)}.`);
    if (metadata) {
      checks.checksum = checksum(options.file) === metadata.checksum;
      if (!checks.checksum) failures.push('Backup checksum does not match metadata.');
      checks.metadataSchemaVersion = metadata.schemaVersion === snapshot.schemaVersion;
      if (!checks.metadataSchemaVersion) failures.push('Metadata schema version does not match the database.');
      for (const [table, expected] of Object.entries(metadata.counts)) {
        checks[`count:${table}`] = snapshot.counts[table] === expected;
        if (!checks[`count:${table}`]) failures.push(`${table} count does not match metadata.`);
      }
    }
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
  } finally { db?.close(); }
  return { result: failures.length === 0 ? 'PASS' : 'FAIL', file: options.file, integrityCheck, foreignKeyCheck, schemaVersion: snapshot?.schemaVersion ?? null, checksum: existsSync(options.file) ? checksum(options.file) : null, checks, failures };
}

export async function restoreBackup(options: { productionDbPath: string; backupFile: string; metadataFile?: string; confirmation?: string; backupDir?: string; expectedSchemaVersion?: number }): Promise<RestoreResult> {
  if (options.confirmation !== RESTORE_CONFIRMATION) throw new Error(`Restore requires confirmation: ${RESTORE_CONFIRMATION}`);
  const verification = await verifyBackup({ file: options.backupFile, metadataFile: options.metadataFile, expectedSchemaVersion: options.expectedSchemaVersion });
  if (verification.result !== 'PASS') throw new Error(`Restore refused: backup verification ${verification.result}. ${verification.failures.join(' ')}`);
  const productionDir = dirname(resolve(options.productionDbPath));
  mkdirSync(productionDir, { recursive: true });
  const safetyBackup = existsSync(options.productionDbPath)
    ? await createBackup({ dbPath: options.productionDbPath, backupDir: options.backupDir ?? backupDirectoryForDatabase(options.productionDbPath), trigger: 'manual' })
    : null;
  const temp = `${options.productionDbPath}.restore-${process.pid}-${Date.now()}.tmp`;
  try {
    copyFileSync(options.backupFile, temp);
    const restored = new Database(temp, { readonly: true, fileMustExist: true });
    const integrity = String((restored.prepare('PRAGMA integrity_check').get() as { integrity_check: string }).integrity_check);
    const foreignKeys = restored.prepare('PRAGMA foreign_key_check').all();
    restored.close();
    if (integrity !== 'ok' || foreignKeys.length > 0) throw new Error('Restored temporary database failed integrity verification.');
    renameSync(temp, options.productionDbPath);
  } catch (error) {
    rmSync(temp, { force: true });
    throw error;
  }
  return { verification, safetyBackup, productionDbPath: options.productionDbPath };
}
