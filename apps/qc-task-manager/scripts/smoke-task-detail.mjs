// Smoke check for the QC-TASK-DETAIL-002 changes:
//   1. uploadAttachment stores a correct SHA-256 in task_attachments.file_hash.
//   2. closeTask evidence stores file_hash too.
//   3. createNotification({ actorId }) logs a `notification_created` activity row.
//
// Server-less: drives the lib functions directly on a temp SQLite DB (the same
// loader the main test suite uses). Throwaway — not part of `pnpm test`.
//
//   node --import ../../scripts/test-ts-loader.mjs --experimental-strip-types \
//        apps/qc-task-manager/scripts/smoke-task-detail.mjs

import { createHash } from 'node:crypto';
import Database from 'better-sqlite3';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Point the app's DB layer at a fresh temp DB BEFORE importing any lib that
// calls getDb() (db.ts creates + migrates + seeds on first access).
const tmpDir = mkdtempSync(join(tmpdir(), 'qc-smoke-'));
process.env.QC_DATABASE_PATH = join(tmpDir, 'smoke.db');

const { getDb } = await import('../src/lib/db.ts');
// First call bootstraps the schema + seeds the 4 standard users (admin123).
const db = getDb();

const { uploadAttachment, closeTask } = await import('../src/lib/taskUpdates.ts');
const { createNotification } = await import('../src/lib/notifications.ts');

let passed = 0;
let failed = 0;
const fail = (msg) => { failed += 1; console.log(`  ❌ ${msg}`); };
const pass = (msg) => { passed += 1; console.log(`  ✅ ${msg}`); };

try {
  // Seed: a manager (id 2 typically) + an employee (id 4) exist from the seed.
  const mgr = db.prepare("SELECT id FROM users WHERE username = 'manager'").get();
  const emp = db.prepare("SELECT id FROM users WHERE username = 'employee'").get();
  if (!mgr || !emp) throw new Error('seed users missing');

  // A sample PDF (magic bytes %PDF-) so validateUploadedFile accepts it.
  const pdfBytes = Buffer.concat([
    Buffer.from('%PDF-1.4\n%\xe2\xe3\xcf\xd3\n1 0 obj<<>>endobj\n'),
  ]);
  const expectedHash = createHash('sha256').update(pdfBytes).digest('hex');

  // --- Setup: one active task owned by the employee ---
  const task = db.prepare(
    `INSERT INTO tasks (title, department, status, priority, progress_percent, created_by, assigned_to, due_date)
     VALUES (?, 'QC', 'in_progress', 'high', 10, ?, ?, ?)`,
  ).run('Smoke task', mgr.id, emp.id, '2026-12-31');
  const taskId = Number(task.lastInsertRowid);

  console.log('\n■ uploadAttachment → file_hash');
  const file = new File([pdfBytes], 'report.pdf', { type: 'application/pdf' });
  const up = await uploadAttachment({ taskId, actor: { id: emp.id, role: 'employee' }, file });
  if (!up.ok) fail(`upload rejected: ${up.error}`);
  const row = db.prepare('SELECT file_hash FROM task_attachments WHERE id = ?').get(up.attachmentId);
  if (row?.file_hash === expectedHash) pass('file_hash stored and matches SHA-256 of the bytes');
  else fail(`file_hash mismatch (got ${row?.file_hash}, want ${expectedHash})`);

  console.log('\n■ createNotification({ actorId }) → notification_created');
  const before = db
    .prepare("SELECT COUNT(*) AS n FROM task_activity_log WHERE task_id = ? AND action = 'notification_created'")
    .get(taskId);
  createNotification({
    userId: mgr.id,
    taskId,
    type: 'priority_changed',
    title: 'Priority changed',
    message: 'Smoke notification.',
    actorId: emp.id,
  });
  const after = db
    .prepare("SELECT COUNT(*) AS n FROM task_activity_log WHERE task_id = ? AND action = 'notification_created'")
    .get(taskId);
  if (Number(after.n) === Number(before.n) + 1) pass('notification_created row appended to activity log');
  else fail(`expected +1 notification_created row (before=${before.n}, after=${after.n})`);

  // actorId omitted → no activity row (back-compat for non-audited callers).
  const before2 = db
    .prepare("SELECT COUNT(*) AS n FROM task_activity_log WHERE action = 'notification_created'")
    .get();
  createNotification({ userId: mgr.id, taskId, type: 'assigned', title: 't', message: 'm' });
  const after2 = db
    .prepare("SELECT COUNT(*) AS n FROM task_activity_log WHERE action = 'notification_created'")
    .get();
  if (Number(after2.n) === Number(before2.n)) pass('actorId omitted → no notification_created logged (back-compat)');
  else fail(`unexpected notification_created row without actorId (before=${before2.n}, after=${after2.n})`);

  console.log('\n■ closeTask evidence → file_hash');
  const closeTaskId = Number(
    db.prepare(
      `INSERT INTO tasks (title, department, status, priority, progress_percent, created_by, assigned_to, due_date)
       VALUES ('Smoke close', 'QC', 'in_progress', 'medium', 50, ?, ?, ?)`,
    ).run(mgr.id, emp.id, '2026-12-31').lastInsertRowid,
  );
  const evFile = new File([pdfBytes], 'evidence.pdf', { type: 'application/pdf' });
  const form = new FormData();
  form.append('completion_comment', 'Done — verified.');
  form.append('evidence', evFile);
  const closed = await closeTask({ taskId: closeTaskId, actor: { id: emp.id, role: 'employee' }, form });
  if (!closed.ok) fail(`close rejected: ${closed.error}`);
  const evRow = db
    .prepare('SELECT file_hash, is_evidence FROM task_attachments WHERE task_id = ? AND is_evidence = 1')
    .get(closeTaskId);
  if (evRow?.file_hash === expectedHash && evRow?.is_evidence === 1) pass('evidence file_hash stored (is_evidence=1)');
  else fail(`evidence file_hash wrong (got ${evRow?.file_hash}, want ${expectedHash})`);

  console.log(`\n${passed} passed, ${failed} failed`);
} catch (err) {
  failed += 1;
  console.error('💥 smoke crashed:', err);
} finally {
  // Release the DB handle so the temp dir can be removed (WAL + SHM files).
  try { (await import('../src/lib/db.ts')).closeDatabase(); } catch {}
  try { (new Database(process.env.QC_DATABASE_PATH, { readonly: true })).close(); } catch {}
  rmSync(tmpDir, { recursive: true, force: true });
}

process.exit(failed === 0 ? 0 : 1);
