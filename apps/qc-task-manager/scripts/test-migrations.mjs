import Database from 'better-sqlite3';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { runMigrations, MigrationError } from '../src/lib/migrations.ts';

const appDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const migrationDir = join(appDir, 'db/migrations');
const tempRoot = mkdtempSync(join(tmpdir(), 'brightai-qc-migrations-'));

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
    assert.equal(result.applied.length, 2);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM schema_migrations').get().n, 2);
    assert.ok(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='tasks'").get());
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
    assert.equal(first.applied.length, 2);
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
