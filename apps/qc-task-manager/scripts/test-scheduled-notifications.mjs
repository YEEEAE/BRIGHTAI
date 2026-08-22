// Database-backed unit checks for the daily scheduled reminder job
// (PROMPT 46) — scripts/scheduled-notifications.mjs +
// src/lib/lab/scheduledNotifications.ts.
//
// Runs in its own process so QC_DATABASE_PATH is set before src/lib/db.ts
// evaluates its singleton path (same pattern as the other test-lab-*
// scripts). Seed OFF — no fabricated notifications.
//
// Covered:
//   1. Migration 025: notifications.dedupe_key column + partial unique index.
//   2. Buckets: calibration (overdue / due-today / 7 / 15 / 30 / compliant
//      silent), document review (same windows via deriveDocumentReviewState),
//      acknowledgements (pending rows anchored to the parent review_due_date).
//   3. Recipients: equipment manager (created_by), document owner
//      (owner_id ?? created_by), assigned acknowledger; inactive users
//      skipped; archived equipment / non-live documents excluded.
//   4. Idempotency: running the job twice on the same day yields the exact
//      same rows (dedupe_key unique index); a different run date inserts new
//      rows.
//   5. Rows use the EXISTING kinds and appear in listLabNotifications.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const appDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const tempDir = mkdtempSync(join(tmpdir(), 'brightai-qc-scheduled-notifications-'));
const dbPath = join(tempDir, 'scheduled-notifications.db');

let passed = 0;
let failed = 0;
const failures = [];
function ok(cond, label) {
  if (cond) {
    passed += 1;
    console.log(`  ✅ ${label}`);
  } else {
    failed += 1;
    failures.push(label);
    console.log(`  ❌ ${label}`);
  }
}
function eq(actual, expected, label) {
  ok(actual === expected, `${label} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
}

const isoDay = (days) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

let db;
let employeeId;
let supervisorId;
let managerId;

function insertEquipment(code, overrides = {}) {
  return Number(
    db
      .prepare(
        `INSERT INTO lab_equipment (name, code, location, status_raw, is_archived, created_by)
         VALUES (?, ?, 'Lab A', 'Operational', ?, ?)`,
      )
      .run(overrides.name ?? `Rig ${code}`, code, overrides.is_archived ?? 0, overrides.created_by ?? managerId)
      .lastInsertRowid,
  );
}

function insertCalibration(equipmentId, dueDate, overrides = {}) {
  return Number(
    db
      .prepare(
        `INSERT INTO lab_equipment_calibration (
           equipment_id, last_calibrated_at, calibration_due_at, provider,
           certificate_reference, result, next_due_at, notes, created_by
         ) VALUES (?, date('now', '-1 year'), ?, 'Prov', 'CERT-1', ?, NULL, NULL, ?)`,
      )
      .run(equipmentId, dueDate, overrides.result ?? null, managerId)
      .lastInsertRowid,
  );
}

function insertDocument(code, overrides = {}) {
  const docId = Number(
    db
      .prepare(
        `INSERT INTO lab_documents (code, title, type, status, review_due_date, owner_id, created_by)
         VALUES (?, ?, 'SOP', ?, ?, ?, ?)`,
      )
      .run(code, `Doc ${code}`, overrides.status ?? 'APPROVED', overrides.review_due ?? null, overrides.owner_id ?? null, managerId)
      .lastInsertRowid,
  );
  const versionId = Number(
    db
      .prepare(
        `INSERT INTO lab_document_versions (document_id, version, content_md, author_id, status)
         VALUES (?, 1, '# content', ?, 'APPROVED')`,
      )
      .run(docId, managerId).lastInsertRowid,
  );
  db.prepare('UPDATE lab_documents SET current_version_id = ? WHERE id = ?').run(versionId, docId);
  return { docId, versionId };
}

function insertAck(versionId, userId) {
  return Number(
    db
      .prepare(
        `INSERT INTO lab_document_acknowledgements (document_version_id, user_id, status)
         VALUES (?, ?, 'PENDING')`,
      )
      .run(versionId, userId).lastInsertRowid,
  );
}

function scheduledRows(extraSql = '', params = []) {
  return db
    .prepare(`SELECT * FROM notifications WHERE dedupe_key IS NOT NULL ${extraSql} ORDER BY id`)
    .all(...params);
}

try {
  process.env.QC_DATABASE_PATH = dbPath;
  process.env.QC_DB_PATH = '';
  process.env.QC_SEED_LAB_EQUIPMENT = '0';

  execFileSync(process.execPath, ['scripts/init-db.mjs'], {
    cwd: appDir,
    env: { ...process.env, QC_DATABASE_PATH: dbPath, QC_DB_PATH: '', QC_SEED_LAB_EQUIPMENT: '0' },
    stdio: 'ignore',
  });

  const backupDir = join(tempDir, 'backups');
  mkdirSync(backupDir, { recursive: true });
  writeFileSync(
    join(backupDir, 'status.json'),
    JSON.stringify({ state: 'success', lastSuccessAt: new Date().toISOString() }),
  );

  const { getDb } = await import('../src/lib/db.ts');
  const { runScheduledNotifications } = await import('../src/lib/lab/scheduledNotifications.ts');
  const notifications = await import('../src/lib/notifications.ts');

  db = getDb();
  employeeId = Number(db.prepare("SELECT id FROM users WHERE username = 'employee'").get().id);
  supervisorId = Number(db.prepare("SELECT id FROM users WHERE username = 'supervisor'").get().id);
  managerId = Number(db.prepare("SELECT id FROM users WHERE username = 'manager'").get().id);

  console.log('\n→ Migration 025: dedupe_key + partial unique index');
  {
    const cols = db.prepare('PRAGMA table_info(notifications)').all().map((c) => c.name);
    ok(cols.includes('dedupe_key'), 'notifications has dedupe_key column');
    const idx = db
      .prepare("SELECT sql FROM sqlite_master WHERE name = 'uq_notifications_dedupe_key'")
      .get();
    ok(Boolean(idx), 'uq_notifications_dedupe_key index exists');
    ok(String(idx.sql).includes('WHERE dedupe_key IS NOT NULL'), 'index is partial (interactive rows unaffected)');
    const version = db.prepare('SELECT MAX(version) AS v FROM schema_migrations').get().v;
    eq(version, 27, 'schema version is 27');
  }

  console.log('\n→ Calibration buckets + recipients');
  {
    db.prepare("DELETE FROM notifications").run();
    db.prepare("DELETE FROM lab_document_acknowledgements").run();
    db.prepare("DELETE FROM lab_document_versions").run();
    db.prepare("DELETE FROM lab_documents").run();
    db.prepare("DELETE FROM lab_equipment_calibration").run();
    db.prepare("DELETE FROM lab_equipment").run();
    const today = isoDay(0);
    const eqOverdue = insertEquipment('EQ-OVD');
    insertCalibration(eqOverdue, isoDay(-5));
    const eqToday = insertEquipment('EQ-TOD');
    insertCalibration(eqToday, today);
    const eq7 = insertEquipment('EQ-D7');
    insertCalibration(eq7, isoDay(7));
    const eq15 = insertEquipment('EQ-D15');
    insertCalibration(eq15, isoDay(15));
    const eq30 = insertEquipment('EQ-D30');
    insertCalibration(eq30, isoDay(30));
    const eqOk = insertEquipment('EQ-OK');
    insertCalibration(eqOk, isoDay(60)); // compliant — silent
    const eqArchived = insertEquipment('EQ-ARC', { is_archived: 1 });
    insertCalibration(eqArchived, isoDay(-1)); // archived equipment — silent
    const eqManagedBySupervisor = insertEquipment('EQ-SUP', { created_by: supervisorId });
    insertCalibration(eqManagedBySupervisor, isoDay(3));

    const summary = runScheduledNotifications(today);
    eq(summary.calibration_overdue, 1, 'one overdue calibration notification');
    eq(summary.calibration_due, 5, 'five due notifications (today/7/15/30 + supervisor device)');
    eq(summary.document_review, 0, 'no document rows in this section');
    eq(summary.acknowledgements, 0, 'no ack rows in this section');

    const rows = scheduledRows("AND type IN ('lab_calibration_due','lab_calibration_overdue')");
    eq(rows.length, 6, 'exactly six calibration rows');
    const byCode = new Map(
      rows.map((r) => [r.title.split(': ')[1], r]),
    );
    eq(byCode.get('EQ-OVD').type, 'lab_calibration_overdue', 'overdue kind');
    ok(byCode.get('EQ-OVD').title.includes('overdue'), 'overdue title');
    eq(byCode.get('EQ-TOD').type, 'lab_calibration_due', 'due-today kind');
    ok(byCode.get('EQ-TOD').title.includes('due today'), 'due-today title');
    ok(byCode.get('EQ-D7').title.includes('due in 7 days'), '7-day bucket title');
    ok(byCode.get('EQ-D15').title.includes('due in 15 days'), '15-day bucket title');
    ok(byCode.get('EQ-D30').title.includes('due in 30 days'), '30-day bucket title');
    ok(!byCode.has('EQ-OK'), 'compliant (60 days) is silent');
    ok(!byCode.has('EQ-ARC'), 'archived equipment is silent');
    eq(byCode.get('EQ-SUP').user_id, supervisorId, 'recipient is the equipment manager (created_by)');
    for (const r of rows) {
      eq(r.task_id, null, 'scheduled rows are task-less');
      ok(r.entity_href.startsWith(`/lab/equipment/`), `href points at the device (${r.entity_href})`);
      ok(r.dedupe_key.startsWith(`sched:${r.user_id}:`), 'dedupe key encodes the user');
    }
    const managerRows = rows.filter((r) => r.user_id === managerId);
    eq(managerRows.length, 5, 'manager (default created_by) got the five own devices');
  }

  console.log('\n→ Document review buckets + recipients');
  {
    db.prepare("DELETE FROM notifications").run();
    db.prepare("DELETE FROM lab_document_acknowledgements").run();
    db.prepare("DELETE FROM lab_document_versions").run();
    db.prepare("DELETE FROM lab_documents").run();
    db.prepare("DELETE FROM lab_equipment_calibration").run();
    db.prepare("DELETE FROM lab_equipment").run();
    const today = isoDay(0);
    insertDocument('DOC-OVD', { review_due: isoDay(-2) });
    insertDocument('DOC-TOD', { review_due: today });
    insertDocument('DOC-D7', { review_due: isoDay(7) });
    insertDocument('DOC-D15', { review_due: isoDay(15) });
    insertDocument('DOC-D30', { review_due: isoDay(30) });
    insertDocument('DOC-OK', { review_due: isoDay(60) }); // OK — silent
    insertDocument('DOC-NULL'); // no review date — silent
    insertDocument('DOC-ARCH', { status: 'ARCHIVED', review_due: isoDay(-1) }); // not live — silent
    insertDocument('DOC-SUP', { review_due: isoDay(5), owner_id: supervisorId });

    const summary = runScheduledNotifications(today);
    eq(summary.document_review, 6, 'six document review notifications');
    eq(summary.calibration_due + summary.calibration_overdue, 0, 'calibration section empty');

    const rows = scheduledRows("AND type = 'lab_document_review_due'");
    eq(rows.length, 6, 'exactly six document rows');
    const byCode = new Map(rows.map((r) => [r.title.split(': ')[1], r]));
    ok(byCode.get('DOC-OVD').title.includes('overdue'), 'overdue document title');
    ok(byCode.get('DOC-TOD').message.includes('due today'), 'due-today document message');
    ok(byCode.get('DOC-D7').message.includes('in 7 days'), '7-day document bucket');
    ok(byCode.get('DOC-D15').message.includes('in 15 days'), '15-day document bucket');
    ok(byCode.get('DOC-D30').message.includes('in 30 days'), '30-day document bucket');
    ok(!byCode.has('DOC-OK'), 'OK (60 days) document is silent');
    ok(!byCode.has('DOC-NULL'), 'document without review date is silent');
    ok(!byCode.has('DOC-ARCH'), 'archived document is silent');
    eq(byCode.get('DOC-SUP').user_id, supervisorId, 'recipient is owner_id when set');
    eq(byCode.get('DOC-OVD').user_id, managerId, 'recipient falls back to created_by when owner is NULL');
    ok(rows.every((r) => r.entity_href.startsWith('/lab/documents/')), 'hrefs point at the document');
  }

  console.log('\n→ Acknowledgement pending reminders');
  {
    db.prepare("DELETE FROM notifications").run();
    db.prepare("DELETE FROM lab_document_acknowledgements").run();
    db.prepare("DELETE FROM lab_document_versions").run();
    db.prepare("DELETE FROM lab_documents").run();
    db.prepare("DELETE FROM lab_equipment_calibration").run();
    db.prepare("DELETE FROM lab_equipment").run();
    const today = isoDay(0);
    const live = insertDocument('ACK-LIVE', { review_due: isoDay(7) });
    insertAck(live.versionId, employeeId);
    const overdue = insertDocument('ACK-OVD', { review_due: isoDay(-1) });
    insertAck(overdue.versionId, employeeId);
    const okDoc = insertDocument('ACK-OK', { review_due: isoDay(60) });
    insertAck(okDoc.versionId, employeeId); // parent OK — silent
    const archived = insertDocument('ACK-ARCH', { status: 'ARCHIVED', review_due: isoDay(-1) });
    insertAck(archived.versionId, employeeId); // parent not live — silent

    const summary = runScheduledNotifications(today);
    eq(summary.acknowledgements, 2, 'two ack reminders (7-day + overdue anchors)');
    const rows = scheduledRows("AND type = 'lab_document_acknowledgement'");
    eq(rows.length, 2, 'exactly two ack rows');
    eq(rows.every((r) => r.user_id === employeeId), true, 'recipient is the assigned acknowledger');
    ok(rows.every((r) => r.title.startsWith('Acknowledgement required: ACK-')), 'ack titles');
    ok(rows.every((r) => r.entity_href.startsWith('/lab/acknowledgements?version=')), 'href opens the version-filtered register');
  }

  console.log('\n→ Inactive recipients are skipped');
  {
    db.prepare("DELETE FROM notifications").run();
    db.prepare("DELETE FROM lab_document_acknowledgements").run();
    db.prepare("DELETE FROM lab_document_versions").run();
    db.prepare("DELETE FROM lab_documents").run();
    db.prepare("DELETE FROM lab_equipment_calibration").run();
    db.prepare("DELETE FROM lab_equipment").run();
    db.prepare('UPDATE users SET is_active = 0 WHERE id = ?').run(managerId);
    const eqInactive = insertEquipment('EQ-INACT');
    insertCalibration(eqInactive, isoDay(3));
    const summary = runScheduledNotifications(isoDay(0));
    eq(summary.calibration_due, 0, 'no notification for an inactive recipient');
    eq(summary.skipped_inactive, 1, 'inactive skip counted');
    eq(scheduledRows().length, 0, 'no rows written');
    db.prepare('UPDATE users SET is_active = 1 WHERE id = ?').run(managerId);
  }

  console.log('\n→ Idempotency: same day twice, new day inserts');
  {
    db.prepare("DELETE FROM notifications").run();
    db.prepare("DELETE FROM lab_document_acknowledgements").run();
    db.prepare("DELETE FROM lab_document_versions").run();
    db.prepare("DELETE FROM lab_documents").run();
    db.prepare("DELETE FROM lab_equipment_calibration").run();
    db.prepare("DELETE FROM lab_equipment").run();
    const eqA = insertEquipment('EQ-IDEM');
    insertCalibration(eqA, isoDay(5));
    const doc = insertDocument('DOC-IDEM', { review_due: isoDay(5) });
    insertAck(doc.versionId, employeeId);

    const today = isoDay(0);
    const first = runScheduledNotifications(today);
    const rowsAfterFirst = scheduledRows();
    const second = runScheduledNotifications(today);
    const rowsAfterSecond = scheduledRows();

    eq(first.calibration_due + first.document_review + first.acknowledgements, 3, 'first run inserts 3 rows');
    eq(second.calibration_due + second.document_review + second.acknowledgements, 0, 'second run same day inserts nothing');
    eq(second.skipped_inactive, 0, 'duplicates are not counted as skips');
    eq(rowsAfterSecond.length, rowsAfterFirst.length, 'row count unchanged');
    eq(
      JSON.stringify(rowsAfterFirst.map((r) => [r.user_id, r.type, r.entity_href, r.dedupe_key, r.title])),
      JSON.stringify(rowsAfterSecond.map((r) => [r.user_id, r.type, r.entity_href, r.dedupe_key, r.title])),
      'run twice → exact same rows',
    );

    // A different run date opens a new dedupe scope (the next day's reminder).
    const third = runScheduledNotifications(isoDay(1));
    eq(third.calibration_due + third.document_review + third.acknowledgements, 3, 'next-day run inserts fresh rows');
    eq(scheduledRows().length, 6, 'two days × three rows');

    // Interactive notifications are unaffected by the unique index.
    notifications.createNotification({
      userId: employeeId,
      taskId: null,
      type: 'lab_calibration_due',
      title: 'Interactive twin',
      message: 'same kind, no dedupe key',
      href: `/lab/equipment/${eqA}`,
    });
    notifications.createNotification({
      userId: employeeId,
      taskId: null,
      type: 'lab_calibration_due',
      title: 'Interactive twin',
      message: 'exact duplicate of the previous interactive row',
      href: `/lab/equipment/${eqA}`,
    });
    eq(scheduledRows().length, 6, 'interactive rows never carry dedupe_key');

    // The scheduled rows surface through the EXISTING lab notification list.
    const labView = notifications.listLabNotifications(employeeId);
    ok(
      labView.notifications.some((n) => n.kind === 'lab_document_acknowledgement' && n.title.includes('DOC-IDEM')),
      'scheduled ack row appears in /lab/notifications',
    );
  }

  console.log(`\n■ scheduled-notifications: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error(failures.map((f) => `  ❌ ${f}`).join('\n'));
    process.exitCode = 1;
  }
} catch (err) {
  console.error('[test-scheduled-notifications] crashed:', err);
  process.exitCode = 1;
} finally {
  try {
    const { closeDatabase } = await import('../src/lib/db.ts');
    closeDatabase();
  } catch {}
  rmSync(tempDir, { recursive: true, force: true });
}
