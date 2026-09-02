// SQLite connection layer for QC Task Manager.
//
// Responsibilities (per the database-layer spec):
//   1. Open db/qc_tasks.db with better-sqlite3. The path comes from
//      `QC_DATABASE_PATH` (spec name), falling back to the legacy `QC_DB_PATH`
//      alias (kept so existing scripts/README/e2e flows keep working), then to
//      <app>/db/qc_tasks.db.
//   2. Enable WAL mode, `foreign_keys = ON`, `busy_timeout = 5000` and
//      `synchronous = NORMAL` on every connection.
//   3. Apply db/migrations/ sequentially on startup, then validate the final
//      schema, migration version, and foreign-key integrity.
//   4. Seed accounts when the users table is empty (see src/lib/seed.ts).
//   5. Expose `db` (lazy singleton), a typed `query` helper, a `transaction`
//      helper and a `closeDatabase` helper for tests.
//
// Every SQL statement in this app goes through prepared statements
// (`db.prepare(...)` with `?`/named params) — user input is NEVER concatenated
// into SQL. Migration DDL is isolated in the migration runner and is never
// built from user input.
//
// Schema application + seeding happen once per process (guarded by a flag),
// so repeated getDb() calls are cheap.

import Database from 'better-sqlite3';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, existsSync } from 'node:fs';
import type { Database as BetterSqliteDatabase } from 'better-sqlite3';
import { seedDemoData, seedUsersIfEmpty } from './seed';
import { seedLabEquipmentIfEmpty } from './lab/seed';
import { startBackupScheduler } from './backup-scheduler';
import { configuredBackupDirectory } from './backup';
import { runMigrations } from './migrations';
import { EMBEDDED_MIGRATIONS } from './migrationRegistry';
import { backfillAuditChain } from './audit/chain';
import { backfillQcAuditChain } from './audit/qcChain';
import { importWICatalog } from './lab/wiCatalog';
import { assertProductionSecretPolicy } from './security-config';

// Evaluate at server startup so an unsafe production configuration cannot
// serve even a health or login request. The check never prints secret values.
assertProductionSecretPolicy();

const __dirname = dirname(fileURLToPath(import.meta.url));

// Resolve to <app>/db/qc_tasks.db. From src/lib/ that's ../../db/qc_tasks.db.
const DB_DIR = resolve(__dirname, '..', '..', 'db');

/** Telemetry/session retention window (90 days) used by the startup purge. */
const RETENTION_WINDOW_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * Pure resolution of the SQLite database path so tests can assert the exact
 * precedence without reloading the module: `QC_DATABASE_PATH` (spec name)
 * first, then the legacy `QC_DB_PATH` alias (kept for existing
 * scripts/README/e2e flows), then <app>/db/qc_tasks.db.
 */
export function resolveDatabasePath(env: NodeJS.ProcessEnv = process.env): string {
  return env.QC_DATABASE_PATH ?? env.QC_DB_PATH ?? resolve(DB_DIR, 'qc_tasks.db');
}

const DB_PATH = resolveDatabasePath();
const BACKUP_DIR = configuredBackupDirectory(DB_PATH);

/** SQLite writes are intentionally single-instance. Reject common scale-out
 * settings before opening the file when the host exposes them to the process. */
export function assertSqliteDeploymentContract(env: NodeJS.ProcessEnv = process.env): void {
  const violations: string[] = [];
  if (env.QC_HORIZONTAL_SCALING === 'true') violations.push('QC_HORIZONTAL_SCALING=true');
  for (const key of ['QC_SQLITE_INSTANCE_COUNT', 'RENDER_NUM_INSTANCES', 'WEB_CONCURRENCY']) {
    const value = Number(env[key]);
    if (Number.isInteger(value) && value > 1) violations.push(`${key}=${value}`);
  }
  if (violations.length > 0) throw new Error(`[db] SQLite deployment contract violation: one writable instance is required (${violations.join(', ')}).`);
}

let _db: BetterSqliteDatabase | null = null;
let _initialized = false;

/**
 * Ensure the parent directory of the resolved DB path exists (the file itself
 * is created on first open). This honors custom `QC_DATABASE_PATH` values
 * pointing at nested directories that don't exist yet — not just <app>/db.
 */
function ensureDir(): void {
  const dir = dirname(DB_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

// ─────────────────────── Startup schema validation ───────────────────────
// After migrations run, the boot fails fast (with a precise message) if any
// required table, index, or migration version is missing — a broken schema
// must never be served.

/** Every table the app relies on (must exist after migrations). */
const REQUIRED_TABLES = [
  'schema_migrations',
  'schema_migration_failures',
  'users',
  'tasks',
  'task_comments',
  'task_attachments',
  'task_activity_log',
  'task_delete_requests',
  'task_deletion_history',
  'task_checklists',
  'task_dependencies',
  'notifications',
  'sessions',
  'login_attempts',
  'saved_filters',
  'sla_policies',
  'escalation_policies',
  'escalation_events',
  'qc_findings',
  'qc_rca',
  'qc_capa',
  'qc_evidence',
  'qc_audit_log',
  'workflow_definitions',
  'workflow_steps',
  'workflow_instances',
  'workflow_actions',
  'ai_audit_log',
  'lab_test_templates',
  'lab_test_template_versions',
  'lab_equipment',
  'lab_equipment_maintenance',
  'lab_equipment_calibration',
  'lab_products',
  'lab_product_equipment',
  'lab_template_equipment',
  'lab_test_records',
  'lab_test_samples',
  'lab_test_retests',
  'lab_test_findings',
  'lab_test_environment_readings',
  'lab_test_equipment_snapshots',
  'lab_test_document_snapshots',
  'lab_documents',
  'lab_document_versions',
  'lab_document_links',
  'lab_document_acknowledgements',
  'lab_saved_views',
  'lab_change_requests',
  'ux_events',
] as const;

/** Every index required by the application (FK lookups + dashboard filters). */
const REQUIRED_INDEXES = [
  'idx_tasks_status',
  'idx_tasks_priority',
  'idx_tasks_assigned_to',
  'idx_tasks_created_by',
  'idx_tasks_due_date',
  'idx_tasks_completed_at',
  'idx_tasks_recurrence',
  'idx_comments_task_id',
  'idx_comments_user_id',
  'idx_attachments_task_id',
  'idx_attachments_uploaded_by',
  'idx_attachments_evidence_type',
  'idx_activity_task_created',
  'idx_activity_user_id',
  'idx_delreq_task_id',
  'idx_delreq_requested_by',
  'idx_delreq_reviewed_by',
  'idx_delreq_one_pending',
  'idx_task_deletion_history_task',
  'idx_task_deletion_history_reviewed',
  'idx_checklists_task_id',
  'idx_checklists_completed_by',
  'idx_dependencies_depends_on',
  'idx_notifications_user',
  'idx_notifications_task',
  'idx_sessions_expires',
  'idx_login_attempts_user',
  'idx_login_attempts_ip_failure',
  'idx_saved_filters_user',
  'idx_users_created_by',
  'idx_tasks_sla_status',
  'idx_tasks_sla_due',
  'idx_sla_policies_match',
  'idx_escalation_events_task',
  'idx_escalation_events_retry',
  'idx_workflow_steps_definition_order',
  'idx_workflow_instances_status',
  'idx_workflow_actions_instance_time',
  'idx_qc_findings_task',
  'idx_qc_findings_owner_status',
  'idx_qc_findings_due',
  'idx_qc_rca_finding',
  'idx_qc_capa_finding_status',
  'idx_qc_evidence_finding',
  'idx_qc_evidence_capa',
  'idx_qc_audit_entity',
  'idx_qc_audit_user_actor_time',
  'idx_activity_event_hash',
  'idx_ai_audit_user_created',
  'idx_ai_audit_feature_created',
  'idx_lab_products_code',
  'idx_lab_products_active',
  'idx_lab_product_equipment_equipment',
  'idx_lab_template_equipment_equipment',
  'idx_lab_equipment_code',
  'idx_lab_equipment_archived',
  'idx_lab_equip_maint_equipment',
  'idx_lab_equip_cal_equipment',
  'idx_lab_equip_cal_due',
  'idx_lab_templates_code',
  'idx_lab_template_versions_template',
  'idx_lab_tests_status',
  'idx_lab_tests_type',
  'idx_lab_tests_product',
  'idx_lab_tests_equipment',
  'idx_lab_tests_tested_by',
  'idx_lab_tests_created_at',
  'idx_lab_tests_final_result',
  'idx_lab_tests_lot',
  'idx_lab_tests_sampling_area',
  'idx_lab_samples_test',
  'idx_lab_retests_original',
  'idx_lab_retests_new',
  'idx_lab_test_findings_test',
  'idx_lab_test_findings_finding',
  'idx_lab_test_env_readings_test',
  'idx_lab_documents_code',
  'idx_lab_documents_type_status',
  'idx_lab_documents_review_due',
  'idx_lab_doc_versions_document',
  'idx_lab_doc_links_document',
  'idx_lab_doc_links_entity',
  'idx_lab_doc_ack_version',
  'idx_lab_doc_ack_user',
  'idx_lab_saved_views_user',
  'idx_lab_tests_updated_at',
  'idx_lab_tests_created_by',
  'idx_lab_tests_template',
  'idx_lab_tests_template_version',
  'idx_lab_retests_status',
  'idx_lab_retests_updated_at',
  'idx_lab_equip_cal_equipment_created',
  'idx_lab_doc_ack_status',
  'idx_lab_doc_ack_assigned_at',
  'idx_lab_documents_owner',
  'idx_lab_documents_product',
  'idx_lab_documents_updated_at',
  'uq_notifications_dedupe_key',
  'idx_lab_change_requests_status_created',
  'idx_lab_change_requests_requester_status',
  'idx_lab_change_requests_target',
  'idx_report_audit_actor_time',
  'idx_report_audit_type_time',
  'idx_task_templates_department',
  'idx_task_templates_status',
  'idx_lab_documents_source_register',
  'idx_ux_events_name_time',
  'idx_ux_events_route_time',
] as const;

/**
 * Verify every required table and index exists. Throws with the full list of
 * missing objects so a corrupted/partial database fails early instead of with
 * confusing query errors later.
 *
 * Runs on the FIRST connection (lazy getDb() — importing this module has no
 * side effects), which in practice is the first real request of the server
 * (any session-bearing request touches the DB).
 */
function validateSchema(db: BetterSqliteDatabase, expectedVersion: number): void {
  const tables = new Set(
    (db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as { name: string }[]).map(
      (r) => r.name,
    ),
  );
  const indexes = new Set(
    (db.prepare("SELECT name FROM sqlite_master WHERE type = 'index'").all() as { name: string }[]).map(
      (r) => r.name,
    ),
  );

  const missingTables = REQUIRED_TABLES.filter((t) => !tables.has(t));
  const missingIndexes = REQUIRED_INDEXES.filter((i) => !indexes.has(i));
  const currentVersion = Number(
    (db.prepare('SELECT COALESCE(MAX(version), 0) AS version FROM schema_migrations').get() as { version: number }).version,
  );

  if (missingTables.length === 0 && missingIndexes.length === 0 && currentVersion === expectedVersion) return;

  const details: string[] = [];
  if (missingTables.length > 0) details.push(`missing tables: ${missingTables.join(', ')}`);
  if (missingIndexes.length > 0) details.push(`missing indexes: ${missingIndexes.join(', ')}`);
  if (currentVersion !== expectedVersion) details.push(`schema version ${currentVersion} does not match expected ${expectedVersion}`);
  throw new Error(
    `[db] startup validation failed — ${details.join('; ')}. ` +
      'The migration history and runtime schema are out of sync.',
  );
}

/** Apply the ordered migration history, validate the result, then seed. */
function initialize(db: BetterSqliteDatabase): void {
  if (_initialized) return;
  const migrationResult = runMigrations(db, {
    backup: true,
    backupDir: BACKUP_DIR,
    // Byte-for-byte mirror of db/migrations/ — see src/lib/migrationRegistry.ts
    // for the contract, and scripts/test-embedded-migration-parity.mjs for the
    // guard that keeps disk and bundle identical.
    embeddedMigrations: EMBEDDED_MIGRATIONS,
  });
  backfillAuditChain(db);
  backfillQcAuditChain(db);
  validateSchema(db, migrationResult.currentVersion);
  seedUsersIfEmpty(db);
  // Paper WI index import is catalog-only. It runs after legitimate users are
  // seeded because the legacy created_by column is required for identity rows;
  // it creates no content/version/audit actor and is idempotent by code.
  importWICatalog(db);
  // SEED_DEMO=1 → demo team + 12 mixed-status tasks (only on an empty DB).
  seedDemoData(db);
  // Canonical 24-device lab equipment registry (PROMPT 11). Idempotent; gated
  // by QC_SEED_LAB_EQUIPMENT !== '0' so empty-DB fixtures can opt out.
  if (process.env.QC_SEED_LAB_EQUIPMENT !== '0') {
    seedLabEquipmentIfEmpty(db);
  }
  backfillAuditChain(db);
  backfillQcAuditChain(db);
  // Periodic session cleanup: purge expired rows at process start (per spec).
  // Sessions live in SQLite, so this runs naturally once per server boot.
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(new Date().toISOString());
  // Audit retention: login_attempts rows older than 90 days are pruned so the
  // audit table cannot grow without bound in a long-lived database.
  db.prepare('DELETE FROM login_attempts WHERE created_at < ?').run(
    new Date(Date.now() - RETENTION_WINDOW_MS).toISOString(),
  );
  // UX telemetry is a separate, privacy-minimized measurement surface. Keep
  // only the bounded 90-day window; it is never part of the audit chain.
  db.prepare('DELETE FROM ux_events WHERE created_at < ?').run(
    new Date(Date.now() - RETENTION_WINDOW_MS).toISOString(),
  );
  _initialized = true;
}

/**
 * Purge expired session rows. Called on every login (per spec) so the sessions
 * table never accumulates stale tokens. Returns the number of rows removed.
 */
export function cleanupExpiredSessions(): number {
  const db = getDb();
  const info = db
    .prepare('DELETE FROM sessions WHERE expires_at < ?')
    .run(new Date().toISOString());
  return info.changes;
}

/**
 * Enforce deterministic SQLite WAL connection pragmas:
 * - journal_mode = WAL: non-blocking concurrent reads during writes.
 * - foreign_keys = ON: relational integrity enforced on every connection.
 * - busy_timeout = 5000: wait up to 5000ms for busy lock instead of failing with SQLITE_BUSY.
 * - synchronous = NORMAL: durability without full fsync penalty for WAL mode.
 */
export function applyConnectionPragmas(db: BetterSqliteDatabase): void {
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  db.pragma('synchronous = NORMAL');
}

/** Verify that the active connection enforces the mandatory pragmas. */
export function verifyConnectionPragmas(db: BetterSqliteDatabase): {
  journal_mode: string;
  foreign_keys: number;
  busy_timeout: number;
  synchronous: number;
} {
  return {
    journal_mode: String(db.pragma('journal_mode', { simple: true })).toLowerCase(),
    foreign_keys: Number(db.pragma('foreign_keys', { simple: true })),
    busy_timeout: Number(db.pragma('busy_timeout', { simple: true })),
    synchronous: Number(db.pragma('synchronous', { simple: true })),
  };
}

/**
 * Open (or reuse) the SQLite connection. WAL + foreign_keys + busy_timeout +
 * synchronous are applied once per connection; schema + seed run once per
 * process. Safe to call repeatedly — returns the same instance.
 */
export function getDb(): BetterSqliteDatabase {
  if (_db) return _db;

  assertSqliteDeploymentContract();
  ensureDir();
  const db = new Database(DB_PATH);
  applyConnectionPragmas(db);

  initialize(db);

  _db = db;
  startBackupScheduler({ dbPath: DB_PATH, backupDir: BACKUP_DIR });
  return db;
}

/**
 * Close the database connection and reset the singleton. Designed for tests
 * (open a temp DB, run assertions, close, repeat). Safe to call repeatedly —
 * no-op when no connection is open.
 */
export function closeDatabase(): void {
  if (!_db) return;
  _db.close();
  _db = null;
  _initialized = false;
}

/**
 * The raw better-sqlite3 instance (per the spec export list). The connection
 * opens lazily on first property access via a Proxy, so merely importing this
 * module never touches disk — `getDb()` is equivalent and preferred inside the
 * app; `db` exists for the spec/tests.
 *
 * Bundler note: in the PRODUCTION bundle, Rollup replaces this export with a
 * static module-namespace object (this module gets merged into a shared chunk
 * that also carries a namespace facade, and nothing in the app references the
 * proxy directly). The live Proxy is what you get from SOURCE — the dev
 * server and tests (e.g. via Vite's ssrLoadModule). `getDb()` behaves the same
 * in every environment, so app code should use it.
 */
export const db = new Proxy({} as BetterSqliteDatabase, {
  get(_target, prop, _receiver) {
    const instance = getDb();
    const value = Reflect.get(instance, prop, instance);
    // Bind methods so `db.prepare(...)`/`db.transaction(...)` keep `this` on
    // the live instance (a plain property copy would lose it).
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});

/**
 * Run a function inside a database transaction (per the spec export list).
 * The function receives nothing and returns its result; the transaction
 * commits on success and rolls back on throw.
 *
 * @example
 * const ids = transaction(() => {
 *   const a = query('INSERT INTO ...').run(1);
 *   const b = query('INSERT INTO ...').run(2);
 *   return [Number(a.lastInsertRowid), Number(b.lastInsertRowid)];
 * });
 */
export function transaction<T>(fn: () => T): T {
  return getDb().transaction(fn)();
}

/** Convert a 0/1 SQLite integer into a boolean. */
export function toBool(value: number | null | undefined): boolean {
  return Number(value) === 1;
}

// ─────────────────────────── Typed query helper ────────────────────────────
// A thin wrapper so call sites read as `query.all(...)` / `query.one(...)` /
// `query.run(...)` with a single typed return type instead of importing the
// raw better-sqlite3 Statement API everywhere.

export interface QueryHelper {
  /** Return all matching rows. Each row is a plain object keyed by column. */
  all<T = Record<string, unknown>>(...params: unknown[]): T[];
  /** Return the first matching row, or undefined. */
  one<T = Record<string, unknown>>(...params: unknown[]): T | undefined;
  /** Run an INSERT/UPDATE/DELETE and return the better-sqlite3 RunResult. */
  run(...params: unknown[]): Database.RunResult;
}

export { DB_PATH, BACKUP_DIR };
