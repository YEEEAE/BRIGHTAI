import Database from 'better-sqlite3';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readdirSync, copyFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { runMigrations, MigrationError } from '../src/lib/migrations.ts';

const appDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const migrationDir = join(appDir, 'db/migrations');
const tempRoot = mkdtempSync(join(tmpdir(), 'brightai-qc-migrations-'));

// Laboratory tables added by migrations 011-014 (PROMPT 02).
const LAB_TABLES = [
  'lab_test_templates',
  'lab_test_template_versions',
  'lab_equipment',
  'lab_equipment_maintenance',
  'lab_equipment_calibration',
  'lab_products',
  'lab_product_equipment',
  'lab_test_records',
  'lab_test_samples',
  'lab_test_retests',
  'lab_test_equipment_snapshots',
  'lab_test_document_snapshots',
  'lab_documents',
  'lab_document_versions',
  'lab_document_links',
  'lab_document_acknowledgements',
  'lab_saved_views',
];

function database(name) {
  const db = new Database(join(tempRoot, `${name}.db`));
  db.pragma('foreign_keys = ON');
  return db;
}

function writeMigration(dir, name, sql) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, name), sql);
}

try {
  console.log('■ Fresh database');
  {
    const db = database('fresh');
    const result = runMigrations(db, { migrationsDir: migrationDir, backup: false });
    assert.equal(result.applied.length, 16);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM schema_migrations').get().n, 16);
    assert.ok(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='tasks'").get());
    for (const table of LAB_TABLES) {
      assert.ok(
        db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(table),
        `fresh database is missing lab table ${table}`,
      );
    }
    assert.ok(db.prepare("SELECT 1 FROM sqlite_master WHERE type='index' AND name='idx_lab_tests_status'").get());
    assert.ok(db.prepare("SELECT 1 FROM sqlite_master WHERE type='index' AND name='idx_lab_doc_ack_version'").get());
    assert.ok(db.prepare("SELECT 1 FROM sqlite_master WHERE type='index' AND name='idx_lab_saved_views_user'").get());
    assert.deepEqual(db.pragma('foreign_key_check'), []);
    db.close();
  }

  console.log('■ qc_audit_log rows preserved across the 011 rebuild');
  {
    // Simulate the real v10 → v14 upgrade: apply only migrations 001-010,
    // write rows with the LEGACY vocabulary, then upgrade with the full set.
    const v10Dir = join(tempRoot, 'migrations-v10');
    mkdirSync(v10Dir, { recursive: true });
    for (const file of readdirSync(migrationDir).filter((f) => /^\d{3}_/.test(f)).sort()) {
      if (Number(file.slice(0, 3)) <= 10) copyFileSync(join(migrationDir, file), join(v10Dir, file));
    }
    const db = database('audit-preserve');
    runMigrations(db, { migrationsDir: v10Dir, backup: false });
    db.prepare(
      "INSERT INTO users (id, username, password_hash, full_name, role) VALUES (1, 'auditor', 'hash', 'Audit User', 'admin')",
    ).run();
    const insert = db.prepare(
      'INSERT INTO qc_audit_log (id, entity_type, entity_id, task_id, actor_id, action, old_value, new_value, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    );
    insert.run(1, 'FINDING', 11, null, 1, 'CREATE', null, 'OPEN', 'legacy row', '2026-01-01 00:00:00');
    insert.run(2, 'CAPA', 12, null, 1, 'STATUS_TRANSITION', 'DRAFT', 'OPEN', null, '2026-01-02 00:00:00');
    insert.run(3, 'EVIDENCE', 13, null, 1, 'APPROVAL', null, null, 'approved', '2026-01-03 00:00:00');
    const before = db
      .prepare('SELECT id, entity_type, entity_id, task_id, actor_id, action, old_value, new_value, note, created_at FROM qc_audit_log ORDER BY id')
      .all();

    const upgraded = runMigrations(db, { migrationsDir: migrationDir, backup: false });
    assert.equal(upgraded.applied.length, 6, 'upgrade applies exactly migrations 011-016');
    const after = db
      .prepare('SELECT id, entity_type, entity_id, task_id, actor_id, action, old_value, new_value, note, created_at FROM qc_audit_log ORDER BY id')
      .all();
    assert.deepEqual(after, before, 'qc_audit_log rows are preserved verbatim across the rebuild');
    // The rebuilt table accepts the new laboratory vocabulary AND the legacy one.
    db.prepare(
      "INSERT INTO qc_audit_log (entity_type, entity_id, actor_id, action, note) VALUES ('LAB_TEST', 1, 1, 'SUBMIT', 'lab event')",
    ).run();
    db.prepare(
      "INSERT INTO qc_audit_log (entity_type, entity_id, actor_id, action) VALUES ('FINDING', 21, 1, 'UPDATE')",
    ).run();
    const count = db.prepare('SELECT COUNT(*) AS n FROM qc_audit_log').get().n;
    assert.equal(count, 5);
    assert.deepEqual(db.pragma('foreign_key_check'), []);
    db.close();
  }

  console.log('■ Existing database upgrade and data preservation');
  {
    const db = database('existing');
    db.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, full_name TEXT NOT NULL, role TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')));
      CREATE TABLE tasks (id INTEGER PRIMARY KEY, title TEXT NOT NULL, description TEXT, created_by INTEGER NOT NULL REFERENCES users(id), assigned_to INTEGER REFERENCES users(id), due_date TEXT, blocker_note TEXT, status TEXT NOT NULL DEFAULT 'not_started', priority TEXT NOT NULL DEFAULT 'medium', progress_percent INTEGER NOT NULL DEFAULT 0, completed_at TEXT, completed_by INTEGER REFERENCES users(id), created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')));
      INSERT INTO users (id, username, password_hash, full_name, role) VALUES (7, 'legacy', 'hash', 'Legacy User', 'employee');
      INSERT INTO tasks (id, title, created_by) VALUES (9, 'Keep this task', 7);`);
    runMigrations(db, { migrationsDir: migrationDir, backup: false });
    assert.equal(db.prepare('SELECT title FROM tasks WHERE id=9').get().title, 'Keep this task');
    assert.ok(db.prepare('SELECT department FROM tasks WHERE id=9').get());
    assert.deepEqual(db.pragma('foreign_key_check'), []);
    db.close();
  }

  console.log('■ Repeated migration and checksum drift');
  {
    const db = database('repeat');
    const first = runMigrations(db, { migrationsDir: migrationDir, backup: false });
    const second = runMigrations(db, { migrationsDir: migrationDir, backup: false });
    assert.equal(first.applied.length, 16);
    assert.equal(second.applied.length, 0);
    db.close();
  }

  console.log('■ Failure rollback and recovery');
  {
    const dir = join(tempRoot, 'failure-migrations');
    writeMigration(dir, '001_initial.sql', 'CREATE TABLE items (id INTEGER PRIMARY KEY, value TEXT NOT NULL);');
    writeMigration(dir, '002_fail.sql', "INSERT INTO items (value) VALUES ('not persisted'); SELECT * FROM missing_table;");
    const db = database('failure');
    assert.throws(() => runMigrations(db, { migrationsDir: dir, backup: false }), MigrationError);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM items').get().n, 0);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM schema_migration_failures').get().n, 1);
    writeFileSync(join(dir, '002_fail.sql'), "INSERT INTO items (value) VALUES ('recovered');");
    const recovered = runMigrations(db, { migrationsDir: dir, backup: false });
    assert.equal(recovered.applied.length, 1);
    assert.equal(db.prepare('SELECT value FROM items').get().value, 'recovered');
    db.close();
  }

  console.log('■ Destructive SQL guard');
  {
    const dir = join(tempRoot, 'destructive-migrations');
    writeMigration(dir, '001_initial.sql', 'CREATE TABLE items (id INTEGER PRIMARY KEY);');
    writeMigration(dir, '002_drop.sql', 'DROP TABLE items;');
    const db = database('destructive');
    assert.throws(() => runMigrations(db, { migrationsDir: dir, backup: false }), MigrationError);
    assert.ok(db.prepare("SELECT 1 FROM sqlite_master WHERE name='items'").get());
    db.close();
  }

  console.log('■ Migration tests passed');
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}
