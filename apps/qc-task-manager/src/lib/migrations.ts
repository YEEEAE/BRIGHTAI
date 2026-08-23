import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import type { Database as BetterSqliteDatabase } from 'better-sqlite3';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_MIGRATIONS_DIR = resolve(__dirname, '../../db/migrations');
const LEGACY_MARKER = '-- brightai:legacy-reconcile';
const DESTRUCTIVE = /\b(drop\s+table|drop\s+column|truncate|delete\s+from)\b/i;
const ALLOW_DESTRUCTIVE = /--\s*brightai:allow-destructive\b/i;

export class MigrationError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'MigrationError';
  }
}

type Migration = { version: number; name: string; source: string; checksum: string; file: string };

function checksum(source: string): string {
  return createHash('sha256').update(source, 'utf8').digest('hex');
}

function readMigrations(migrationsDir: string, embeddedMigrations?: { file: string; source: string }[]): Migration[] {
  let entries: { file: string; source: string }[];
  if (existsSync(migrationsDir)) {
    entries = readdirSync(migrationsDir).filter((file) => /^\d{3}_[a-z0-9_]+\.sql$/.test(file)).sort().map((file) => ({ file, source: readFileSync(join(migrationsDir, file), 'utf8') }));
  } else if (embeddedMigrations) {
    entries = embeddedMigrations;
  } else {
    throw new MigrationError(`Migration directory not found: ${migrationsDir}`);
  }
  const migrations = entries.map(({ file, source }) => {
    const match = /^(\d{3})_([a-z0-9_]+)\.sql$/.exec(file);
    if (!match) throw new MigrationError(`Invalid migration filename: ${file}`);
    return { version: Number(match[1]), name: match[2], source, checksum: checksum(source), file };
  });
  for (let index = 0; index < migrations.length; index += 1) {
    const expected = index + 1;
    if (migrations[index].version !== expected) throw new MigrationError(`Migration versions must be sequential: expected ${String(expected).padStart(3, '0')}`);
  }
  return migrations;
}

function ensureMetadata(db: BetterSqliteDatabase): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY, name TEXT NOT NULL, checksum TEXT NOT NULL, applied_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS schema_migration_failures (
      id INTEGER PRIMARY KEY AUTOINCREMENT, version INTEGER NOT NULL, name TEXT NOT NULL,
      checksum TEXT NOT NULL, error_message TEXT NOT NULL, failed_at TEXT NOT NULL
    );
  `);
}

function hasLegacyUserTables(db: BetterSqliteDatabase): boolean {
  return !!db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name IN ('users','tasks') LIMIT 1").get();
}

function columnNames(db: BetterSqliteDatabase, table: string): Set<string> {
  return new Set((db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map((row) => row.name));
}

function reconcileLegacy(db: BetterSqliteDatabase, initialSql: string): void {
  const additions: { table: string; column: string; ddl: string }[] = [
    { table: 'users', column: 'failed_login_attempts', ddl: 'ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER NOT NULL DEFAULT 0' },
    { table: 'users', column: 'locked_until', ddl: 'ALTER TABLE users ADD COLUMN locked_until TEXT' },
    { table: 'users', column: 'last_login_at', ddl: 'ALTER TABLE users ADD COLUMN last_login_at TEXT' },
    { table: 'users', column: 'created_by', ddl: 'ALTER TABLE users ADD COLUMN created_by INTEGER REFERENCES users(id) ON DELETE SET NULL' },
    { table: 'users', column: 'updated_at', ddl: 'ALTER TABLE users ADD COLUMN updated_at TEXT' },
    { table: 'tasks', column: 'department', ddl: "ALTER TABLE tasks ADD COLUMN department TEXT NOT NULL DEFAULT 'QC'" },
    { table: 'tasks', column: 'recurrence', ddl: "ALTER TABLE tasks ADD COLUMN recurrence TEXT NOT NULL DEFAULT 'none'" },
    { table: 'tasks', column: 'recurrence_end_date', ddl: 'ALTER TABLE tasks ADD COLUMN recurrence_end_date TEXT' },
    { table: 'tasks', column: 'parent_recurring_task_id', ddl: 'ALTER TABLE tasks ADD COLUMN parent_recurring_task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL' },
    { table: 'tasks', column: 'started_at', ddl: 'ALTER TABLE tasks ADD COLUMN started_at TEXT' },
    { table: 'tasks', column: 'cancelled_at', ddl: 'ALTER TABLE tasks ADD COLUMN cancelled_at TEXT' },
    { table: 'tasks', column: 'cancelled_by', ddl: 'ALTER TABLE tasks ADD COLUMN cancelled_by INTEGER REFERENCES users(id) ON DELETE SET NULL' },
    { table: 'tasks', column: 'completion_comment_id', ddl: 'ALTER TABLE tasks ADD COLUMN completion_comment_id INTEGER' },
    { table: 'tasks', column: 'inspection_type', ddl: 'ALTER TABLE tasks ADD COLUMN inspection_type TEXT' },
    { table: 'tasks', column: 'finding_classification', ddl: 'ALTER TABLE tasks ADD COLUMN finding_classification TEXT' },
    { table: 'tasks', column: 'risk_level', ddl: 'ALTER TABLE tasks ADD COLUMN risk_level TEXT' },
    { table: 'tasks', column: 'corrective_action_required', ddl: 'ALTER TABLE tasks ADD COLUMN corrective_action_required INTEGER' },
    { table: 'tasks', column: 'reference_number', ddl: 'ALTER TABLE tasks ADD COLUMN reference_number TEXT' },
    { table: 'tasks', column: 'audit_batch_or_work_order', ddl: 'ALTER TABLE tasks ADD COLUMN audit_batch_or_work_order TEXT' },
    { table: 'task_comments', column: 'is_completion_comment', ddl: 'ALTER TABLE task_comments ADD COLUMN is_completion_comment INTEGER NOT NULL DEFAULT 0' },
    { table: 'task_attachments', column: 'file_hash', ddl: 'ALTER TABLE task_attachments ADD COLUMN file_hash TEXT' },
    { table: 'task_attachments', column: 'is_evidence', ddl: 'ALTER TABLE task_attachments ADD COLUMN is_evidence INTEGER NOT NULL DEFAULT 0' },
    { table: 'task_activity_log', column: 'field', ddl: 'ALTER TABLE task_activity_log ADD COLUMN field TEXT' },
    { table: 'task_activity_log', column: 'note', ddl: 'ALTER TABLE task_activity_log ADD COLUMN note TEXT' },
    { table: 'task_activity_log', column: 'ip_address', ddl: 'ALTER TABLE task_activity_log ADD COLUMN ip_address TEXT' },
    { table: 'task_delete_requests', column: 'review_note', ddl: 'ALTER TABLE task_delete_requests ADD COLUMN review_note TEXT' },
  ];
  let added = 0;
  for (const item of additions) {
    if (!db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(item.table)) continue;
    if (!columnNames(db, item.table).has(item.column)) {
      db.exec(item.ddl);
      added += 1;
    }
  }
  if (columnNames(db, 'users').has('updated_at')) db.exec('UPDATE users SET updated_at = COALESCE(updated_at, created_at)');

  if (columnNames(db, 'task_delete_requests').has('task_title')) {
    db.prepare('DELETE FROM task_delete_requests WHERE task_id NOT IN (SELECT id FROM tasks)').run();
    db.exec(`CREATE TABLE task_delete_requests_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT, task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      requested_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT, reason TEXT, review_note TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
      reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL, reviewed_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    INSERT INTO task_delete_requests_new (id, task_id, requested_by, reason, review_note, status, reviewed_by, reviewed_at, created_at)
      SELECT id, task_id, requested_by, reason, review_note, status, reviewed_by, reviewed_at, created_at FROM task_delete_requests;
    DROP TABLE task_delete_requests;
    ALTER TABLE task_delete_requests_new RENAME TO task_delete_requests;`);
    console.warn('[migrations] rebuilt legacy task_delete_requests into the FK-safe shape.');
  }
  db.exec(initialSql);
  if (added > 0) console.warn(`[migrations] migrated ${added} legacy column(s).`);
}

function backupBeforeMigration(db: BetterSqliteDatabase, backupDir: string): string {
  const source = typeof db.name === 'string' ? db.name : '';
  // SQLite's in-memory database has no filesystem representation. A
  // destructive migration still goes through the same guard, but there is no
  // source file that can safely be copied.
  if (source === ':memory:') return '';

  mkdirSync(backupDir, { recursive: true });
  const destination = join(backupDir, `pre-migration-${new Date().toISOString().replace(/[:.]/g, '-')}.db`);
  if (source) {
    db.pragma('wal_checkpoint(TRUNCATE)');
    db.exec(`VACUUM INTO '${destination.replaceAll("'", "''")}'`);
  }
  return destination;
}

export function runMigrations(db: BetterSqliteDatabase, options: { migrationsDir?: string; embeddedMigrations?: { file: string; source: string }[]; backup?: boolean; backupDir?: string } = {}): { applied: Migration[]; currentVersion: number } {
  db.pragma('foreign_keys = ON');
  const migrations = readMigrations(options.migrationsDir ?? DEFAULT_MIGRATIONS_DIR, options.embeddedMigrations);
  ensureMetadata(db);
  const appliedRows = db.prepare('SELECT version, name, checksum FROM schema_migrations ORDER BY version').all() as { version: number; name: string; checksum: string }[];
  const applied = new Map(appliedRows.map((row) => [row.version, row]));
  for (const migration of migrations) {
    const old = applied.get(migration.version);
    if (old && (old.name !== migration.name || old.checksum !== migration.checksum)) throw new MigrationError(`Applied migration ${migration.file} checksum/name drift detected`);
  }
  if (applied.size === 0 && hasLegacyUserTables(db)) {
    const initial = migrations[0];
    db.prepare('INSERT INTO schema_migrations (version, name, checksum, applied_at) VALUES (?, ?, ?, datetime(\'now\'))').run(initial.version, initial.name, initial.checksum);
    applied.set(initial.version, { version: initial.version, name: initial.name, checksum: initial.checksum });
  }
  const newlyApplied: Migration[] = [];
  for (const migration of migrations) {
    if (applied.has(migration.version)) continue;
    try {
      if (DESTRUCTIVE.test(migration.source) && !ALLOW_DESTRUCTIVE.test(migration.source)) throw new MigrationError(`Destructive SQL rejected in ${migration.file}`);
      if (DESTRUCTIVE.test(migration.source) && options.backup !== false) backupBeforeMigration(db, options.backupDir ?? join(dirname(typeof db.name === 'string' ? db.name : process.cwd()), 'backups'));
      db.transaction(() => {
        if (migration.source.includes(LEGACY_MARKER)) {
          const initial = migrations.find((candidate) => candidate.version === 1);
          if (!initial) throw new MigrationError('Legacy reconciliation requires migration 001');
          reconcileLegacy(db, initial.source);
        }
        else db.exec(migration.source);
        const foreignKeys = db.pragma('foreign_key_check') as unknown[];
        if (foreignKeys.length > 0) throw new MigrationError(`Foreign key check failed after ${migration.file}`);
        db.prepare('INSERT INTO schema_migrations (version, name, checksum, applied_at) VALUES (?, ?, ?, datetime(\'now\'))').run(migration.version, migration.name, migration.checksum);
      })();
      newlyApplied.push(migration);
      applied.set(migration.version, migration);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      db.prepare('INSERT INTO schema_migration_failures (version, name, checksum, error_message, failed_at) VALUES (?, ?, ?, ?, datetime(\'now\'))').run(migration.version, migration.name, migration.checksum, message);
      throw error instanceof MigrationError ? error : new MigrationError(`Migration ${migration.file} failed: ${message}`, { cause: error });
    }
  }
  return { applied: newlyApplied, currentVersion: migrations.at(-1)?.version ?? 0 };
}

export { DEFAULT_MIGRATIONS_DIR };
