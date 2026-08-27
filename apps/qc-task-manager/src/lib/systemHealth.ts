import { statfsSync, statSync, existsSync, readFileSync } from 'node:fs';
import { basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DB_PATH, BACKUP_DIR, getDb } from './db';
import { getBackupStatus, listBackups } from './backup';
import { verifyAllAuditChains } from './audit/qcChain';
import { getAiProviderHealth } from './ai/health';

const DEFAULT_DISK_WARNING_RATIO = 0.8;
export type DiskHealth = { availableBytes: number | null; capacityBytes: number | null; usedBytes: number | null; appBytes: number; warning: boolean; configuredCapacityBytes: number | null };

export function safeDatabasePath(path: string): string { return `${basename(dirname(path))}/${basename(path)}`; }
export function fileSize(path: string): number { try { return statSync(path).size; } catch { return 0; } }
function directoryBytes(path: string): number { if (!existsSync(path)) return 0; return listBackups(path).reduce((sum, backup) => sum + backup.size + fileSize(backup.metadataFile), 0); }
function configuredCapacity(): number | null {
  const bytes = Number(process.env.QC_DISK_CAPACITY_BYTES);
  if (Number.isFinite(bytes) && bytes > 0) return Math.floor(bytes);
  const gigabytes = Number(process.env.QC_DISK_CAPACITY_GB);
  return Number.isFinite(gigabytes) && gigabytes > 0 ? Math.floor(gigabytes * 1024 ** 3) : null;
}
export function getDiskHealth(dbPath = DB_PATH, backupDir = BACKUP_DIR): DiskHealth {
  const appBytes = fileSize(dbPath) + fileSize(`${dbPath}-wal`) + fileSize(`${dbPath}-shm`) + directoryBytes(backupDir);
  try {
    const stats = statfsSync(dirname(dbPath));
    const capacityBytes = Number(stats.blocks) * Number(stats.bsize);
    const availableBytes = Number(stats.bavail) * Number(stats.bsize);
    const configured = configuredCapacity();
    const referenceCapacity = configured ?? capacityBytes;
    return { availableBytes, capacityBytes, usedBytes: capacityBytes - availableBytes, appBytes, configuredCapacityBytes: configured, warning: appBytes >= referenceCapacity * DEFAULT_DISK_WARNING_RATIO || availableBytes <= referenceCapacity * 0.2 };
  } catch {
    const configured = configuredCapacity();
    return { availableBytes: null, capacityBytes: null, usedBytes: null, appBytes, configuredCapacityBytes: configured, warning: configured !== null && appBytes >= configured * DEFAULT_DISK_WARNING_RATIO };
  }
}
export function applicationIdentity(): { version: string; commit: string } {
  let version = 'unknown';
  try { const packagePath = fileURLToPath(new URL('../../package.json', import.meta.url)); version = String((JSON.parse(readFileSync(packagePath, 'utf8')) as { version?: string }).version ?? version); } catch { /* diagnostics stay available if metadata is absent */ }
  return { version, commit: process.env.RENDER_GIT_COMMIT ?? process.env.GIT_COMMIT ?? process.env.COMMIT_SHA ?? 'unknown' };
}
export function getSystemHealth() {
  const db = getDb();
  const schema = db.prepare('SELECT COALESCE(MAX(version), 0) AS version FROM schema_migrations').get() as { version: number };
  const migration = db.prepare('SELECT version, name, applied_at FROM schema_migrations ORDER BY version DESC LIMIT 1').get() as { version: number; name: string; applied_at: string } | undefined;
  const failures = db.prepare('SELECT COUNT(*) AS count FROM schema_migration_failures').get() as { count: number };
  const foreignKeyViolations = db.prepare('PRAGMA foreign_key_check').all().length;
  const integrity = String((db.prepare('PRAGMA integrity_check').get() as { integrity_check: string }).integrity_check);
  const backupStatus = getBackupStatus(BACKUP_DIR);
  const backups = listBackups(BACKUP_DIR);
  const audit = verifyAllAuditChains(db);
  return { identity: applicationIdentity(), dbPath: safeDatabasePath(DB_PATH), dbSize: fileSize(DB_PATH), walSize: fileSize(`${DB_PATH}-wal`), schemaVersion: Number(schema.version), latestMigration: migration ?? null, migrationFailureCount: Number(failures.count), foreignKeys: { enabled: Number(db.pragma('foreign_keys', { simple: true })) === 1, violations: foreignKeyViolations }, integrity: { status: integrity === 'ok' ? 'PASS' : 'FAIL', result: integrity }, backup: { status: backupStatus, latest: backups[0] ?? null }, audit, disk: getDiskHealth(), ai: getAiProviderHealth() };
}
