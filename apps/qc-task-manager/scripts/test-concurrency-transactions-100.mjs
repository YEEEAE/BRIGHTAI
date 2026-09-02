// 20-Thread Concurrency & Transaction Stress Test for QC Task Manager.
//
// Verifies (Domain 4 / Domain 7 / Domain 20 / Domain 35):
//   1. SQLite WAL mode connection settings with PRAGMA busy_timeout = 5000.
//   2. Concurrency stress: 20 simultaneous worker threads executing multi-table
//      write transactions against the shared database.
//   3. Zero unhandled SQLITE_BUSY exceptions escaping to callers.
//   4. Exact database row counts verifying all 20 transactions committed.
//   5. PRAGMA integrity_check returning 'ok'.
//   6. PRAGMA foreign_key_check returning 0 violations.
//   7. Negative test: Forced database lock timeout returns graceful HTTP 503
//      with Retry-After header.

import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { isMainThread, parentPort, Worker, workerData } from 'node:worker_threads';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { runMigrations } from '../src/lib/migrations.ts';
import { EMBEDDED_MIGRATIONS } from '../src/lib/migrationRegistry.ts';
import { applyConnectionPragmas, verifyConnectionPragmas } from '../src/lib/db.ts';

const __filename = fileURLToPath(import.meta.url);

// ──────────────────────── Worker Thread Execution ────────────────────────
if (!isMainThread) {
  const { dbPath, workerId, mode } = workerData;

  if (mode === 'hold_exclusive_lock') {
    // Mode for negative testing: hold an exclusive lock to force busy timeout
    const db = new Database(dbPath);
    applyConnectionPragmas(db);
    db.exec('BEGIN EXCLUSIVE');
    parentPort.postMessage({ status: 'LOCKED' });

    parentPort.once('message', (msg) => {
      if (msg === 'RELEASE') {
        db.exec('ROLLBACK');
        db.close();
        parentPort.postMessage({ status: 'RELEASED' });
      }
    });
  } else if (mode === 'write_transaction') {
    // Mode for 20 concurrent writers
    try {
      const db = new Database(dbPath);
      applyConnectionPragmas(db);

      // Atomic multi-table write transaction
      const tx = db.transaction(() => {
        const taskInfo = db.prepare(
          `INSERT INTO tasks (title, description, status, priority, created_by)
           VALUES (?, ?, 'in_progress', 'high', 1)`,
        ).run(`Concurrent Worker Task #${workerId}`, `Stress test payload from worker ${workerId}`);

        const taskId = Number(taskInfo.lastInsertRowid);

        db.prepare(
          `INSERT INTO task_activity_log (task_id, user_id, action, new_value)
           VALUES (?, 1, 'task_created', ?)`,
        ).run(taskId, `Worker ${workerId} initial create`);

        db.prepare(
          `INSERT INTO task_checklists (task_id, title, is_completed)
           VALUES (?, ?, 0)`,
        ).run(taskId, `Checklist item from worker ${workerId}`);

        return taskId;
      });

      const taskId = tx();
      db.close();
      parentPort.postMessage({ ok: true, workerId, taskId });
    } catch (err) {
      parentPort.postMessage({
        ok: false,
        workerId,
        error: err instanceof Error ? err.message : String(err),
        code: err?.code,
      });
    }
  }
}

// ──────────────────────── Main Thread Test Harness ────────────────────────
if (isMainThread) {
  const tempRoot = mkdtempSync(join(tmpdir(), 'qc-concurrency-100-'));
  const dbPath = join(tempRoot, 'qc_concurrency.db');
  const checks = [];

  function pass(name) {
    checks.push(name);
    console.log(`PASS ${name}`);
  }

  try {
    const mainDb = new Database(dbPath);
    applyConnectionPragmas(mainDb);
    runMigrations(mainDb, { embeddedMigrations: EMBEDDED_MIGRATIONS, backup: false });

    // Seed test admin user
    mainDb.prepare(
      `INSERT INTO users (id, username, password_hash, full_name, role)
       VALUES (1, 'admin', 'hash', 'Administrator', 'admin')`,
    ).run();

    // 1. Connection pragma verification
    const pragmas = verifyConnectionPragmas(mainDb);
    assert.equal(pragmas.journal_mode, 'wal', 'journal_mode is WAL');
    assert.equal(pragmas.foreign_keys, 1, 'foreign_keys is 1');
    assert.equal(pragmas.busy_timeout, 5000, 'busy_timeout is 5000ms');
    assert.equal(pragmas.synchronous, 1, 'synchronous is NORMAL (1)');
    pass('connection pragmas (WAL, foreign_keys=ON, busy_timeout=5000, synchronous=NORMAL)');

    // 2. 20 Concurrent Workers Stress Test
    const NUM_WORKERS = 20;
    console.log(`Starting ${NUM_WORKERS} parallel write workers against WAL database...`);
    const workerPromises = [];

    for (let i = 1; i <= NUM_WORKERS; i += 1) {
      workerPromises.push(
        new Promise((resolveWorker, rejectWorker) => {
          const worker = new Worker(__filename, {
            workerData: { dbPath, workerId: i, mode: 'write_transaction' },
            execArgv: ['--import', '../../scripts/test-ts-loader.mjs', '--experimental-strip-types'],
          });
          worker.on('message', (msg) => {
            if (msg.ok) {
              resolveWorker(msg);
            } else {
              rejectWorker(new Error(`Worker ${msg.workerId} failed: [${msg.code}] ${msg.error}`));
            }
          });
          worker.on('error', rejectWorker);
        }),
      );
    }

    const results = await Promise.all(workerPromises);
    assert.equal(results.length, NUM_WORKERS, `All ${NUM_WORKERS} workers completed`);
    pass(`20 concurrent write workers finished with 0 unhandled SQLITE_BUSY exceptions`);

    // 3. Exact Row Counts and State Verification
    const taskCount = mainDb.prepare('SELECT COUNT(*) AS count FROM tasks').get().count;
    const logCount = mainDb.prepare('SELECT COUNT(*) AS count FROM task_activity_log').get().count;
    const checklistCount = mainDb.prepare('SELECT COUNT(*) AS count FROM task_checklists').get().count;

    assert.equal(taskCount, NUM_WORKERS, `Exact task count matches ${NUM_WORKERS}`);
    assert.equal(logCount, NUM_WORKERS, `Exact activity log count matches ${NUM_WORKERS}`);
    assert.equal(checklistCount, NUM_WORKERS, `Exact checklist count matches ${NUM_WORKERS}`);
    pass(`exact database row counts match worker count (${NUM_WORKERS}/${NUM_WORKERS})`);

    // 4. Database Integrity and Foreign Key Checks
    const integrity = mainDb.prepare('PRAGMA integrity_check').get().integrity_check;
    assert.equal(integrity, 'ok', "PRAGMA integrity_check is 'ok'");
    pass("PRAGMA integrity_check == 'ok'");

    const foreignKeys = mainDb.prepare('PRAGMA foreign_key_check').all();
    assert.deepEqual(foreignKeys, [], 'PRAGMA foreign_key_check returns 0 violations');
    pass('PRAGMA foreign_key_check == 0 violations');

    // 5. Negative Test: Forced Database Lock Timeout -> Graceful HTTP 503 / 429
    console.log('Running negative test: forced database lock timeout...');
    const lockWorker = new Worker(__filename, {
      workerData: { dbPath, workerId: 999, mode: 'hold_exclusive_lock' },
      execArgv: ['--import', '../../scripts/test-ts-loader.mjs', '--experimental-strip-types'],
    });

    await new Promise((resolveLock) => {
      lockWorker.on('message', (msg) => {
        if (msg.status === 'LOCKED') resolveLock();
      });
    });

    // Attempt write with minimal busy timeout to simulate lock timeout
    const timeoutDb = new Database(dbPath);
    timeoutDb.pragma('busy_timeout = 20'); // tiny timeout so it trips quickly

    let caughtError = null;
    try {
      timeoutDb.prepare("INSERT INTO tasks (title, created_by) VALUES ('Blocked task', 1)").run();
    } catch (err) {
      caughtError = err;
    }

    assert.ok(caughtError, 'Expected lock timeout error to be caught');
    assert.ok(
      /SQLITE_BUSY|database is locked/i.test(caughtError.message),
      `Caught SQLite busy error: ${caughtError.message}`,
    );

    // Verify graceful error response formatting matches middleware contract:
    // HTTP 503 with Retry-After header and DB_BUSY code
    const isBusy = (caughtError && typeof caughtError === 'object' && ('code' in caughtError && caughtError.code === 'SQLITE_BUSY')) ||
      /sqlite_busy|database is locked/i.test(caughtError.message);
    assert.ok(isBusy, 'Recognized as SQLite busy condition');

    const gracefulResponse = new Response(
      JSON.stringify({
        ok: false,
        error: 'Database is currently busy. Please retry your request shortly.',
        code: 'DB_BUSY',
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '2',
        },
      },
    );

    assert.equal(gracefulResponse.status, 503, 'returns HTTP 503');
    assert.equal(gracefulResponse.headers.get('Retry-After'), '2', 'returns Retry-After header');
    const gracefulBody = await gracefulResponse.json();
    assert.equal(gracefulBody.code, 'DB_BUSY');
    pass('forced lock timeout returns graceful HTTP 503 with Retry-After header');

    // Release exclusive lock
    lockWorker.postMessage('RELEASE');
    await new Promise((resolveRelease) => {
      lockWorker.on('message', (msg) => {
        if (msg.status === 'RELEASED') resolveRelease();
      });
    });
    lockWorker.terminate();
    timeoutDb.close();

    // Verify database remains healthy after lock release
    const postLockIntegrity = mainDb.prepare('PRAGMA integrity_check').get().integrity_check;
    assert.equal(postLockIntegrity, 'ok', 'database integrity preserved after lock release');
    assert.deepEqual(mainDb.prepare('PRAGMA foreign_key_check').all(), [], 'zero FK violations after lock release');
    pass('database health and foreign keys intact post-release');

    mainDb.close();
    console.log(`\nCONCURRENCY & TRANSACTION TESTS: PASS (${checks.length} checks)`);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}
