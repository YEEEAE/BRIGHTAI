// Comprehensive Idempotency Test Suite for QC Task Manager.
//
// Verifies:
//   1. Syntax validation: keys > 200 chars, empty keys, control chars -> rejected (400).
//   2. Payload hashing: SHA-256 fingerprinting for FormData, JSON, and strings.
//   3. Duplicate mutation prevention: duplicate POST with identical Idempotency-Key
//      returns cached response; verified with exact database row counts (only 1 row inserted).
//   4. Replay attack protection: altered body with same Idempotency-Key returns 400 Mismatched Payload.
//   5. User scoping: identical Idempotency-Key submitted by two different users succeeds for both
//      without cross-user collision.
//   6. In-flight concurrency conflict: simultaneous requests on same key return 409 Conflict.
//   7. 24-hour expiration window: keys older than 24h expire and allow new execution.
//   8. Failure cleanup: thrown errors in mutation handler delete the PENDING lease so retries work.

import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  ensureIdempotencyTable,
  validateIdempotencyKey,
  hashPayload,
  withIdempotency,
  IDEMPOTENCY_EXPIRY_MS,
} from '../src/lib/idempotency.ts';
import { runMigrations } from '../src/lib/migrations.ts';
import { EMBEDDED_MIGRATIONS } from '../src/lib/migrationRegistry.ts';

const tempRoot = mkdtempSync(join(tmpdir(), 'qc-idempotency-test-'));
const dbPath = join(tempRoot, 'idempotency.db');
const checks = [];

function pass(name) {
  checks.push(name);
  console.log(`PASS ${name}`);
}

try {
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  db.pragma('synchronous = NORMAL');

  runMigrations(db, { embeddedMigrations: EMBEDDED_MIGRATIONS, backup: false });
  ensureIdempotencyTable(db);
  pass('table creation and pragma readiness');

  // Verify schema and indexes of idempotency_keys
  const tableCols = db.prepare("PRAGMA table_info(idempotency_keys)").all().map((c) => c.name);
  for (const col of ['id', 'key', 'user_id', 'route', 'request_hash', 'response_status', 'response_body', 'status', 'created_at', 'updated_at']) {
    assert.ok(tableCols.includes(col), `idempotency_keys has column ${col}`);
  }
  const indexes = db.prepare("PRAGMA index_list(idempotency_keys)").all().map((i) => i.name);
  assert.ok(indexes.includes('idx_idempotency_user_key'), 'unique index on (user_id, key) exists');
  assert.ok(indexes.includes('idx_idempotency_created_at'), 'index on created_at exists');
  pass('schema structure and index contracts');

  // 1. Key validation
  assert.equal(validateIdempotencyKey('').ok, false);
  assert.equal(validateIdempotencyKey('   ').ok, false);
  assert.equal(validateIdempotencyKey(null).ok, false);
  assert.equal(validateIdempotencyKey(123).ok, false);
  assert.equal(validateIdempotencyKey('a'.repeat(201)).ok, false);
  assert.equal(validateIdempotencyKey('key\x00with-null').ok, false);
  assert.equal(validateIdempotencyKey('key\nwith-newline').ok, false);

  const validKey = validateIdempotencyKey('  idem-valid-key-001  ');
  assert.equal(validKey.ok, true);
  assert.equal(validKey.key, 'idem-valid-key-001');
  pass('key syntax and length boundary validation');

  // 2. Payload hashing
  const hashA = hashPayload({ action: 'close', comment: 'Done' });
  const hashA2 = hashPayload({ comment: 'Done', action: 'close' }); // key order invariance
  const hashB = hashPayload({ action: 'close', comment: 'Altered' });
  assert.equal(hashA, hashA2, 'payload hashing is deterministic regarding key order');
  assert.notEqual(hashA, hashB, 'different payload produces different hash');

  const form1 = new FormData();
  form1.append('completion_comment', 'Task finished');
  form1.append('skip_evidence', '1');
  const formHash1 = hashPayload(form1);
  const form2 = new FormData();
  form2.append('skip_evidence', '1');
  form2.append('completion_comment', 'Task finished');
  const formHash2 = hashPayload(form2);
  assert.equal(formHash1, formHash2, 'FormData hashing is deterministic regarding field insertion order');
  pass('deterministic payload hashing');

  // Seed two test users
  db.prepare("INSERT INTO users (id, username, password_hash, full_name, role) VALUES (101, 'user1', 'hash', 'User One', 'manager')").run();
  db.prepare("INSERT INTO users (id, username, password_hash, full_name, role) VALUES (102, 'user2', 'hash', 'User Two', 'supervisor')").run();

  function makeContext(headers = {}, pathname = '/api/tasks/1/close') {
    const reqHeaders = new Headers(headers);
    return {
      request: new Request(`http://localhost${pathname}`, {
        method: 'POST',
        headers: reqHeaders,
      }),
      url: new URL(`http://localhost${pathname}`),
    };
  }

  // 3. Test-First: Duplicate POST requests with identical Idempotency-Key -> only 1 mutation
  let mutationExecutionCount = 0;
  async function sampleMutation(payload) {
    mutationExecutionCount += 1;
    // Insert into tasks as real state transition
    db.prepare("INSERT INTO tasks (title, status, created_by) VALUES (?, 'in_progress', 101)").run(`Task created run #${mutationExecutionCount}`);
    return new Response(JSON.stringify({ ok: true, run: mutationExecutionCount }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const tasksBefore = db.prepare('SELECT COUNT(*) AS count FROM tasks').get().count;
  const ctx1 = makeContext({ 'Idempotency-Key': 'key-dup-test-01' });

  // First execution
  const res1 = await withIdempotency(
    ctx1,
    { id: 101 },
    () => sampleMutation({ action: 'first' }),
    { payload: { action: 'first' }, database: db },
  );
  assert.equal(res1.status, 200);
  const body1 = await res1.json();
  assert.equal(body1.run, 1);
  assert.equal(mutationExecutionCount, 1);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM tasks').get().count, tasksBefore + 1);

  // Second execution (duplicate) with same Idempotency-Key and payload
  const ctx2 = makeContext({ 'Idempotency-Key': 'key-dup-test-01' });
  const res2 = await withIdempotency(
    ctx2,
    { id: 101 },
    () => sampleMutation({ action: 'first' }),
    { payload: { action: 'first' }, database: db },
  );
  assert.equal(res2.status, 200);
  assert.equal(res2.headers.get('X-Idempotent-Replay'), 'true');
  const body2 = await res2.json();
  assert.equal(body2.run, 1, 'returns cached response body from first run');
  assert.equal(mutationExecutionCount, 1, 'mutation callback was NOT called a second time');
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM tasks').get().count, tasksBefore + 1, 'only one database row was inserted across duplicates');
  pass('duplicate POST deduplication with exact row count verification');

  // 4. Replay attack with altered body -> returns 400 Mismatched Payload
  const ctx3 = makeContext({ 'Idempotency-Key': 'key-dup-test-01' });
  const res3 = await withIdempotency(
    ctx3,
    { id: 101 },
    () => sampleMutation({ action: 'altered_tampered_payload' }),
    { payload: { action: 'altered_tampered_payload' }, database: db },
  );
  assert.equal(res3.status, 400);
  const body3 = await res3.json();
  assert.equal(body3.error, 'Mismatched Payload');
  assert.equal(mutationExecutionCount, 1, 'tampered replay did NOT execute mutation');
  pass('altered payload replay attack rejection (400 Mismatched Payload)');

  // 5. User scoping: identical Idempotency-Key for User 102 succeeds independently
  const ctxUser2 = makeContext({ 'Idempotency-Key': 'key-dup-test-01' });
  const resUser2 = await withIdempotency(
    ctxUser2,
    { id: 102 }, // different user
    () => sampleMutation({ action: 'user2_action' }),
    { payload: { action: 'user2_action' }, database: db },
  );
  assert.equal(resUser2.status, 200);
  assert.equal(resUser2.headers.get('X-Idempotent-Replay'), null);
  const bodyUser2 = await resUser2.json();
  assert.equal(bodyUser2.run, 2, 'user 2 mutation executed independently');
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM tasks').get().count, tasksBefore + 2);
  pass('user session scoping prevents cross-user key collision');

  // 6. In-flight concurrency conflict: status PENDING returns 409
  db.prepare(
    "INSERT INTO idempotency_keys (key, user_id, route, request_hash, status) VALUES ('inflight-key', 101, '/api/test', 'dummyhash', 'PENDING')",
  ).run();
  const ctxInflight = makeContext({ 'Idempotency-Key': 'inflight-key' }, '/api/test');
  const resInflight = await withIdempotency(
    ctxInflight,
    { id: 101 },
    () => sampleMutation({ test: 1 }),
    { payload: { test: 1 }, route: '/api/test', database: db },
  );
  assert.equal(resInflight.status, 409);
  const bodyInflight = await resInflight.json();
  assert.equal(bodyInflight.code, 'CONFLICT');
  pass('in-flight concurrent request conflict (HTTP 409)');

  // 7. Expiration behavior: key older than 24h expires
  const expiredTime = new Date(Date.now() - (IDEMPOTENCY_EXPIRY_MS + 1000)).toISOString();
  db.prepare(
    "INSERT INTO idempotency_keys (key, user_id, route, request_hash, status, created_at) VALUES ('expired-key', 101, '/api/test', 'hash', 'COMPLETED', ?)",
  ).run(expiredTime);

  let expiredRan = false;
  const ctxExpired = makeContext({ 'Idempotency-Key': 'expired-key' }, '/api/test');
  const resExpired = await withIdempotency(
    ctxExpired,
    { id: 101 },
    async () => {
      expiredRan = true;
      return new Response(JSON.stringify({ ok: true, refreshed: true }), { status: 200 });
    },
    { payload: { refresh: true }, route: '/api/test', database: db },
  );
  assert.equal(resExpired.status, 200);
  assert.equal(expiredRan, true, 'expired key permitted fresh mutation execution');
  pass('24-hour expiration window purging and refresh');

  // 8. Error cleanup: failed mutation cleans up PENDING lease
  const ctxFail = makeContext({ 'Idempotency-Key': 'fail-key' });
  await assert.rejects(
    () => withIdempotency(
      ctxFail,
      { id: 101 },
      async () => { throw new Error('Database disk error simulation'); },
      { payload: { fail: true }, database: db },
    ),
    /Database disk error simulation/,
  );
  const pendingAfterFail = db.prepare("SELECT * FROM idempotency_keys WHERE user_id = 101 AND key = 'fail-key'").get();
  assert.equal(pendingAfterFail, undefined, 'pending lease cleaned up after mutation error so retry can succeed');
  pass('failed mutation lease cleanup');

  // 9. Absence of Idempotency-Key header passes through without error
  const ctxNoHeader = makeContext({});
  let noHeaderRan = false;
  const resNoHeader = await withIdempotency(
    ctxNoHeader,
    { id: 101 },
    async () => {
      noHeaderRan = true;
      return new Response(JSON.stringify({ ok: true, direct: true }), { status: 200 });
    },
    { database: db },
  );
  assert.equal(resNoHeader.status, 200);
  assert.equal(noHeaderRan, true);
  pass('backward compatibility for callers without Idempotency-Key header');

  db.close();
  console.log(`\nIDEMPOTENCY TESTS: PASS (${checks.length} checks)`);
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}
