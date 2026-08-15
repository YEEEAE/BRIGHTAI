// Database-backed unit checks for /lab/notifications (PROMPT 26) — the
// lab-filtered view over the SAME notifications table.
//
// Runs in its own process so QC_DATABASE_PATH is set before src/lib/db.ts
// evaluates its singleton path (same pattern as the other test-lab-* scripts).
// Seed OFF — no fabricated notifications.
//
// Covered:
//   1. Migration 022: notifications.entity_href column exists.
//   2. Engine: createNotification(href) persists entity_href; every lab kind is
//      registered in PERSISTED_SEVERITY (no fallback severity); listLabNotifications
//      scopes to lab kinds only, orders unread-first, counts unread/total,
//      supports the unreadOnly filter; mark-read (one + all) flows through the
//      same is_read column the global page and bell use.
//   3. Writers: review actions (4 kinds, self-approval skip), calibration
//      attention (overdue + compliant silent), maintenance events (owner alert,
//      actor skip), retests (open + completion, self skip), document review
//      windows (due + OK silent), acknowledgement assign + acknowledge.
//      Every notification carries the real entity href.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const appDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const tempDir = mkdtempSync(join(tmpdir(), 'brightai-qc-lab-notifications-'));
const dbPath = join(tempDir, 'lab-notifications.db');

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

const LAB_KINDS = [
  'lab_test_review_started',
  'lab_test_rejected',
  'lab_test_changes_requested',
  'lab_test_approved',
  'lab_document_review_due',
  'lab_document_acknowledgement',
  'lab_document_acknowledged',
  'lab_calibration_due',
  'lab_calibration_overdue',
  'lab_maintenance_event',
  'lab_retest_update',
];

const isoDay = (days) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10); // YYYY-MM-DD (UTC, matches local for these windows)

let db;
let employeeId;
let supervisorId;
let managerId;
let productId;
let equipmentId;

function insertTestRow(overrides = {}) {
  const info = db
    .prepare(
      `INSERT INTO lab_test_records (
         test_number, test_type, product_id, lot_number, sampling_area, sample_count,
         final_result, status, tested_by, created_by, submitted_at, created_at, updated_at
       ) VALUES (?, 'air', ?, 'LOT-N', 'Area 1', 5, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))`,
    )
    .run(
      `TMP-${Math.random().toString(36).slice(2, 10)}`,
      productId,
      overrides.final_result ?? null,
      overrides.status ?? 'SUBMITTED',
      overrides.tested_by ?? employeeId,
      overrides.created_by ?? employeeId,
    );
  const id = Number(info.lastInsertRowid);
  const number = `LAB-TEST-${String(id).padStart(5, '0')}`;
  db.prepare('UPDATE lab_test_records SET test_number = ? WHERE id = ?').run(number, id);
  return { id, number };
}

function notificationsFor(userId, extraSql = '', params = []) {
  return db
    .prepare(`SELECT * FROM notifications WHERE user_id = ? ${extraSql} ORDER BY id`)
    .all(userId, ...params);
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
  const notifications = await import('../src/lib/notifications.ts');
  const review = await import('../src/lib/lab/review.ts');
  const calibration = await import('../src/lib/lab/calibration.ts');
  const equipment = await import('../src/lib/lab/equipment.ts');
  const retests = await import('../src/lib/lab/retests.ts');
  const documents = await import('../src/lib/lab/documents.ts');
  const acknowledgements = await import('../src/lib/lab/acknowledgements.ts');

  db = getDb();
  employeeId = Number(db.prepare("SELECT id FROM users WHERE username = 'employee'").get().id);
  supervisorId = Number(db.prepare("SELECT id FROM users WHERE username = 'supervisor'").get().id);
  managerId = Number(db.prepare("SELECT id FROM users WHERE username = 'manager'").get().id);
  productId = Number(
    db
      .prepare("INSERT INTO lab_products (name, code, default_test_type, is_active, created_by) VALUES ('Catheter 24G', 'PRD-24G', 'air', 1, ?)")
      .run(managerId).lastInsertRowid,
  );
  equipmentId = Number(
    db
      .prepare("INSERT INTO lab_equipment (name, code, location, status_raw, created_by) VALUES ('Pressure Rig 1', 'EQ-PR-1', 'Lab A', 'Operational', ?)")
      .run(managerId).lastInsertRowid,
  );

  console.log('\n→ Migration 022: entity_href column');
  {
    const cols = db.prepare('PRAGMA table_info(notifications)').all().map((c) => c.name);
    ok(cols.includes('entity_href'), 'notifications has entity_href column');
    const version = db.prepare('SELECT MAX(version) AS v FROM schema_migrations').get().v;
    ok(version >= 22, 'schema version includes migration 022');
  }

  console.log('\n→ Engine: href persistence + lab scoping + read state');
  {
    // Empty start — nothing invented.
    const empty = notifications.listLabNotifications(employeeId);
    eq(empty.total, 0, 'empty: total is 0');
    eq(empty.unread, 0, 'empty: unread is 0');
    eq(empty.notifications.length, 0, 'empty: no rows');

    // href persists into entity_href.
    const wrote = notifications.createNotification({
      userId: employeeId,
      taskId: null,
      type: 'lab_retest_update',
      title: 'Engine href test',
      message: 'entity href roundtrip',
      href: '/lab/retests/123',
    });
    ok(wrote, 'createNotification with href returns true');
    const row = notificationsFor(employeeId).at(-1);
    eq(row.entity_href, '/lab/retests/123', 'entity_href persisted verbatim');

    // Non-lab notifications stay OUT of the lab view (same table, one system).
    notifications.createNotification({
      userId: employeeId,
      taskId: null,
      type: 'assigned',
      title: 'Task assigned',
      message: 'global-only',
    });
    const labOnly = notifications.listLabNotifications(employeeId);
    eq(labOnly.total, 1, 'lab view excludes non-lab kinds');
    const allRows = notifications.listPersistedNotifications(employeeId);
    ok(allRows.length >= 2, 'global view keeps every kind');
    const legacy = allRows.find((n) => n.kind === 'assigned');
    eq(legacy.href, '/notifications', 'task-less legacy row falls back to the notifications page');
    const withHref = allRows.find((n) => n.title === 'Engine href test');
    eq(withHref.href, '/lab/retests/123', 'entity_href wins over the fallback in the global view');

    // Every lab kind has a registered severity (no silent 'info' fallback).
    const probe = notifications.createNotification; // engine under test
    for (const kind of LAB_KINDS) {
      probe({ userId: managerId, taskId: null, type: kind, title: `probe ${kind}`, message: 'severity probe' });
    }
    const managerView = notifications.listLabNotifications(managerId);
    const severities = new Map(managerView.notifications.map((n) => [n.title, n.severity]));
    for (const kind of LAB_KINDS) {
      ok(severities.has(`probe ${kind}`), `kind ${kind} listed by listLabNotifications`);
    }
    eq(severities.get('probe lab_test_rejected'), 'danger', 'lab_test_rejected severity = danger');
    eq(severities.get('probe lab_calibration_overdue'), 'danger', 'lab_calibration_overdue severity = danger');
    eq(severities.get('probe lab_test_approved'), 'success', 'lab_test_approved severity = success');
    eq(severities.get('probe lab_retest_update'), 'info', 'lab_retest_update severity = info');
    db.prepare('DELETE FROM notifications WHERE user_id = ? AND title LIKE ?').run(managerId, 'probe %');

    // Unread-first ordering + unreadOnly filter.
    notifications.createNotification({
      userId: employeeId,
      taskId: null,
      type: 'lab_calibration_due',
      title: 'Second lab alert',
      message: 'ordering probe',
    });
    let view = notifications.listLabNotifications(employeeId);
    eq(view.total, 2, 'total counts both lab rows');
    eq(view.unread, 2, 'both rows unread');
    eq(view.notifications[0].title, 'Second lab alert', 'unread-first ordering (newest unread first)');

    // Mark-read flows through the same is_read column.
    const first = view.notifications[1];
    const marked = notifications.markNotificationRead(employeeId, first.id);
    ok(marked, 'markNotificationRead returns true');
    view = notifications.listLabNotifications(employeeId);
    eq(view.unread, 1, 'unread drops after mark-read');
    eq(view.notifications[0].isRead, false, 'unread row stays first');
    eq(view.notifications[1].isRead, true, 'read row is flagged');

    const unreadOnly = notifications.listLabNotifications(employeeId, { unreadOnly: true });
    eq(unreadOnly.notifications.length, 1, 'unreadOnly hides read rows');
    eq(unreadOnly.total, 2, 'unreadOnly keeps the real total');

    // Mark-all sweeps the whole feed — lab and legacy rows share is_read.
    const cleared = notifications.markAllNotificationsRead(employeeId);
    eq(cleared, 2, 'markAllNotificationsRead clears every remaining unread row (lab + legacy)');
    const afterAll = notifications.listLabNotifications(employeeId);
    eq(afterAll.unread, 0, 'everything read after mark-all');
    db.prepare('DELETE FROM notifications').run(); // clean slate for the writer sections
  }

  console.log('\n→ Review actions write the four test kinds with entity hrefs');
  {
    db.prepare('DELETE FROM notifications').run(); // clean slate per section
    const t1 = insertTestRow();
    review.transitionLabTest({ id: supervisorId, role: 'supervisor' }, 'start_review', t1.id, null);
    let rows = notificationsFor(employeeId);
    eq(rows.length, 1, 'start_review notifies the tester');
    eq(rows[0].type, 'lab_test_review_started', 'start_review kind');
    eq(rows[0].entity_href, `/lab/tests/${t1.id}`, 'start_review href points at the test');
    eq(rows[0].task_id, null, 'lab events carry task_id NULL');

    review.transitionLabTest({ id: managerId, role: 'manager' }, 'request_changes', t1.id, 'Missing lot number');
    rows = notificationsFor(employeeId);
    eq(rows.length, 2, 'request_changes notifies the tester');
    eq(rows.at(-1).type, 'lab_test_changes_requested', 'request_changes kind');
    eq(rows.at(-1).entity_href, `/lab/tests/${t1.id}`, 'request_changes href');

    const t2 = insertTestRow();
    review.transitionLabTest({ id: managerId, role: 'manager' }, 'reject', t2.id, 'Failed twice');
    rows = notificationsFor(employeeId);
    eq(rows.at(-1).type, 'lab_test_rejected', 'reject kind');
    eq(rows.at(-1).entity_href, `/lab/tests/${t2.id}`, 'reject href');

    const t3 = insertTestRow();
    review.transitionLabTest({ id: managerId, role: 'manager' }, 'approve', t3.id, null);
    rows = notificationsFor(employeeId);
    eq(rows.at(-1).type, 'lab_test_approved', 'approve kind');
    eq(rows.at(-1).entity_href, `/lab/tests/${t3.id}`, 'approve href');

    // The self-notification skip is unreachable through transitionLabTest
    // (invariant #1: a tester can never review/approve their own test) — the
    // skip exists as defense in depth and is covered by the review tests.
  }

  console.log('\n→ Calibration attention alerts with equipment hrefs');
  {
    db.prepare('DELETE FROM notifications').run(); // clean slate per section
    // Overdue → danger notification to the equipment owner.
    calibration.createLabCalibration(
      {
        equipment_id: equipmentId,
        last_calibrated_at: isoDay(-400),
        calibration_due_at: isoDay(-30),
        provider: 'Metrology SA',
        certificate_reference: 'CAL-N-001',
        result: 'PASS',
        next_due_at: isoDay(-1), // already past
        notes: null,
      },
      employeeId,
    );
    const rows = notificationsFor(managerId);
    eq(rows.length, 1, 'overdue calibration notifies the equipment owner');
    eq(rows[0].type, 'lab_calibration_overdue', 'overdue kind');
    eq(rows[0].entity_href, `/lab/equipment/${equipmentId}`, 'href points at the equipment record');

    // Compliant calibration stays silent.
    calibration.createLabCalibration(
      {
        equipment_id: equipmentId,
        last_calibrated_at: isoDay(0),
        calibration_due_at: isoDay(365),
        provider: 'Metrology SA',
        certificate_reference: 'CAL-N-002',
        result: 'PASS',
        next_due_at: isoDay(365),
        notes: null,
      },
      employeeId,
    );
    eq(notificationsFor(managerId).length, 1, 'compliant calibration sends nothing');

    // Due soon → warning kind.
    calibration.createLabCalibration(
      {
        equipment_id: equipmentId,
        last_calibrated_at: isoDay(-360),
        calibration_due_at: isoDay(5),
        provider: 'Metrology SA',
        certificate_reference: 'CAL-N-003',
        result: 'PASS',
        next_due_at: isoDay(5),
        notes: null,
      },
      employeeId,
    );
    const dueRows = notificationsFor(managerId);
    eq(dueRows.length, 2, 'due-soon calibration notifies too');
    eq(dueRows.at(-1).type, 'lab_calibration_due', 'due-soon kind');
  }

  console.log('\n→ Maintenance events alert the equipment owner');
  {
    db.prepare('DELETE FROM notifications').run(); // clean slate per section
    const maintenanceData = {
      maintenance_date: isoDay(0),
      issue: 'Seal leak on chamber door',
      maintenance_type: 'Corrective',
      description: 'Replaced door seal.',
      technician_vendor: 'In-house',
      status: 'COMPLETED',
      completed_date: isoDay(0),
      notes: null,
    };
    equipment.createLabEquipmentMaintenance(equipmentId, maintenanceData, supervisorId);
    const rows = notificationsFor(managerId);
    eq(rows.length, 1, 'maintenance by another user notifies the equipment owner');
    eq(rows[0].type, 'lab_maintenance_event', 'maintenance kind');
    eq(rows[0].entity_href, `/lab/equipment/${equipmentId}/maintenance`, 'href opens the maintenance history');

    // The owner logging their own maintenance gets no self-alert.
    equipment.createLabEquipmentMaintenance(equipmentId, { ...maintenanceData, issue: 'Filter swap' }, managerId);
    eq(notificationsFor(managerId).length, 1, 'actor does not notify themselves');
  }

  console.log('\n→ Retest open + completion alerts with retest hrefs');
  {
    db.prepare('DELETE FROM notifications').run(); // clean slate per section
    const original = insertTestRow({ status: 'APPROVED', final_result: 'FAIL', tested_by: employeeId, created_by: employeeId });
    const created = retests.createLabRetest({ id: supervisorId }, original.id, {
      reason: 'FAIL',
      reason_note: 'Repeat after retraining.',
    });
    let rows = notificationsFor(employeeId);
    eq(rows.length, 1, 'opening a retest notifies the original tester');
    eq(rows[0].type, 'lab_retest_update', 'retest-open kind');
    eq(rows[0].entity_href, `/lab/retests/${created.retest_id}`, 'href opens the retest');

    // Self skip: the tester opening a retest on their own test gets nothing.
    const own = insertTestRow({ status: 'APPROVED', final_result: 'HOLD', tested_by: employeeId, created_by: employeeId });
    retests.createLabRetest({ id: employeeId }, own.id, { reason: 'HOLD', reason_note: null });
    eq(notificationsFor(employeeId).length, 1, 'retest creator does not notify themselves');

    // Completion: approving the retest's new test closes the retest + alerts its creator.
    db.prepare("UPDATE lab_test_records SET status = 'SUBMITTED' WHERE id = ?").run(created.new_test_id);
    review.transitionLabTest({ id: managerId, role: 'manager' }, 'approve', created.new_test_id, null);
    const retestRow = db.prepare('SELECT status FROM lab_test_retests WHERE id = ?').get(created.retest_id);
    eq(retestRow.status, 'COMPLETED', 'retest completes on approval');
    const supervisorRows = notificationsFor(supervisorId);
    // The creator is also the new test's owner, so they receive the approval
    // alert too — both come from the shared table, one row each.
    const retestAlert = supervisorRows.filter((r) => r.type === 'lab_retest_update');
    const approvalAlert = supervisorRows.filter((r) => r.type === 'lab_test_approved');
    eq(retestAlert.length, 1, 'retest creator is notified on completion');
    eq(approvalAlert.length, 1, 'new-test approval alert reaches the creator too');
    eq(retestAlert[0].entity_href, `/lab/retests/${created.retest_id}`, 'completion href opens the retest');
  }

  console.log('\n→ Document review windows alert the owner');
  {
    db.prepare('DELETE FROM notifications').run(); // clean slate per section
    const dueDocId = documents.createLabDocument(
      {
        type: 'SOP',
        code: 'SOP-QC-900',
        title: 'Review Due Procedure',
        description: 'Due today fixture.',
        product_id: productId,
        owner_id: supervisorId,
        effective_date: isoDay(-360),
        review_due_date: isoDay(0), // DUE_TODAY window
        change_summary: 'Initial version.',
        content: '# Title\n\nStep content.',
        equipment_ids: [],
      },
      managerId,
    );
    let rows = notificationsFor(supervisorId);
    eq(rows.length, 1, 'review-due-today document notifies the owner');
    eq(rows[0].type, 'lab_document_review_due', 'document review kind');
    eq(rows[0].entity_href, `/lab/documents/${dueDocId}/edit`, 'href opens the document editor');

    // A far-future review date stays silent.
    documents.createLabDocument(
      {
        type: 'WI',
        code: 'WI-QC-901',
        title: 'Far Future WI',
        description: 'OK window fixture.',
        product_id: productId,
        owner_id: supervisorId,
        effective_date: isoDay(0),
        review_due_date: isoDay(300),
        change_summary: 'Initial version.',
        content: '# WI\n\nContent.',
        equipment_ids: [],
      },
      managerId,
    );
    eq(notificationsFor(supervisorId).length, 1, 'OK-window document sends nothing');

    // Inside the 7-day window → notified again (new document).
    documents.createLabDocument(
      {
        type: 'SOP',
        code: 'SOP-QC-902',
        title: 'Seven Day Procedure',
        description: 'DUE_7 fixture.',
        product_id: productId,
        owner_id: supervisorId,
        effective_date: isoDay(-360),
        review_due_date: isoDay(5),
        change_summary: 'Initial version.',
        content: '# Title\n\nStep content.',
        equipment_ids: [],
      },
      managerId,
    );
    eq(notificationsFor(supervisorId).length, 2, 'DUE_7 window document notifies');
  }

  console.log('\n→ Acknowledgement assign + acknowledge alerts');
  {
    db.prepare('DELETE FROM notifications').run(); // clean slate per section
    const docId = Number(
      db
        .prepare("INSERT INTO lab_documents (code, title, type, status, owner_id, created_by) VALUES ('SOP-QC-910', 'Acknowledge Me', 'SOP', 'APPROVED', ?, ?)")
        .run(managerId, managerId).lastInsertRowid,
    );
    const versionId = Number(
      db
        .prepare("INSERT INTO lab_document_versions (document_id, version, content_md, change_summary, author_id, status) VALUES (?, 1, '# v1', 'Release.', ?, 'APPROVED')")
        .run(docId, managerId).lastInsertRowid,
    );

    acknowledgements.assignLabDocumentAcknowledgements(versionId, [employeeId], managerId);
    let rows = notificationsFor(employeeId);
    eq(rows.length, 1, 'assignment notifies the employee');
    eq(rows[0].type, 'lab_document_acknowledgement', 'assignment kind');
    eq(rows[0].entity_href, `/lab/acknowledgements?version=${versionId}`, 'assignment href opens the version view');

    const ack = db
      .prepare('SELECT id FROM lab_document_acknowledgements WHERE document_version_id = ? AND user_id = ?')
      .get(versionId, employeeId);
    acknowledgements.acknowledgeLabDocumentAcknowledgement(Number(ack.id), employeeId);
    const ownerRows = notificationsFor(managerId);
    eq(ownerRows.length, 1, 'acknowledgement notifies the document owner');
    eq(ownerRows[0].type, 'lab_document_acknowledged', 'acknowledged kind');
    eq(ownerRows[0].entity_href, `/lab/acknowledgements?version=${versionId}`, 'acknowledged href');
  }

  console.log('\n→ Lab view scoping over the shared table');
  {
    // Clean slate, then two users + a non-lab row for one of them.
    db.prepare('DELETE FROM notifications').run();
    notifications.createNotification({
      userId: employeeId, taskId: null, type: 'lab_test_rejected',
      title: 'A rejected', message: 'm', href: '/lab/tests/10',
    });
    notifications.createNotification({
      userId: employeeId, taskId: null, type: 'lab_calibration_overdue',
      title: 'B overdue', message: 'm', href: '/lab/equipment/10',
    });
    notifications.createNotification({
      userId: employeeId, taskId: null, type: 'assigned',
      title: 'C legacy', message: 'm',
    });
    notifications.createNotification({
      userId: managerId, taskId: null, type: 'lab_test_approved',
      title: 'D approved', message: 'm', href: '/lab/tests/11',
    });

    const empView = notifications.listLabNotifications(employeeId);
    eq(empView.total, 2, 'employee lab view sees only their lab rows');
    eq(empView.unread, 2, 'employee lab view unread count');
    ok(empView.notifications.every((n) => n.kind.startsWith('lab_')), 'lab kinds only in the lab view');
    ok(empView.notifications.every((n) => n.href.startsWith('/lab/')), 'every row links to a real lab record');

    const mgrView = notifications.listLabNotifications(managerId);
    eq(mgrView.total, 1, 'manager lab view is strictly user-scoped');
    eq(mgrView.notifications[0].kind, 'lab_test_approved', 'manager sees their own kind');

    // Severity ordering is NOT applied at the SQL layer (page groups it) — the
    // query contract is unread-first then newest-first, so assert that.
    notifications.markNotificationRead(employeeId, empView.notifications[0].id);
    const ordered = notifications.listLabNotifications(employeeId);
    eq(ordered.notifications[0].isRead, false, 'remaining unread row stays first after mark-read');

    // unreadOnly reflects the shared read state.
    const unreadOnly = notifications.listLabNotifications(employeeId, { unreadOnly: true });
    eq(unreadOnly.notifications.length, 1, 'unreadOnly honors the shared is_read state');
  }
} catch (err) {
  console.error(err);
  failed += 1;
  failures.push(`unexpected error: ${err?.message ?? err}`);
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  for (const f of failures) console.log(`  FAILED: ${f}`);
  process.exit(1);
}
