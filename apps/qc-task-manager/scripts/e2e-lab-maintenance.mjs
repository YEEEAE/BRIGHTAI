// E2E spec for the QC Laboratory Equipment Maintenance Log
// (/lab/equipment/[id]/maintenance — page reference §36).
//
// Runs against a LIVE server sharing the same SQLite database (same pattern
// as e2e-lab-equipment.mjs). Covers the maintenance log end-to-end:
//   A. Auth wall: anonymous GET the maintenance page → login redirect.
//   B. RBAC walls: employee may view the page but has no logging form;
//      supervisor (LAB_EQUIPMENT_MAINTENANCE) sees the form (200).
//   C. Supervisor logs a COMPLETED maintenance event through the real form
//      POST → redirected back; row + CREATE audit exist in the DB.
//   D. The page renders the event in Maintenance History (with Logged By), the
//      returned-to-service marker, and the audit trail entry.
//   E. Timeline combines usage + maintenance + calibration + returned-to-service.
//   F. Archived equipment: amber banner + no form; a direct POST is rejected.
//   G. Validation failure: COMPLETED without a completed date → flash error,
//      no row written.
//   H. No horizontal overflow on the maintenance page at 1440 / 390.
//
// Usage (from the app directory, via e2e-acceptance.mjs):
//   QC_DATABASE_PATH=<db> PORT=<port> BASE_URL=http://127.0.0.1:<port> \
//     ADMIN_DEFAULT_PASSWORD=... node scripts/e2e-lab-maintenance.mjs

import { chromium } from 'playwright';
import Database from 'better-sqlite3';

const BASE = process.env.BASE_URL ?? 'http://localhost:4399';
const DB_PATH = process.env.QC_DATABASE_PATH || process.env.QC_DB_PATH;
if (!DB_PATH) {
  console.error('❌ QC_DATABASE_PATH is required (must match the server database).');
  process.exit(1);
}
const PASS = process.env.ADMIN_DEFAULT_PASSWORD ?? 'admin123';

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
function eq_(actual, expected, label) {
  ok(actual === expected, `${label} (expected ${expected}, got ${actual})`);
}

const db = new Database(DB_PATH, { readonly: false });
const browser = await chromium.launch({ headless: true });

async function login(page, username) {
  await page.goto(`${BASE}/login`);
  await page.fill('#username', username);
  await page.fill('#password', PASS);
  await page.locator('form[action="/login"] button[type="submit"]').click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15_000 });
}

// A dedicated device for this suite (like e2e-lab-equipment's EQ-E2E-001).
const managerId = Number(db.prepare("SELECT id FROM users WHERE username='manager'").get().id);
const supervisorId = Number(db.prepare("SELECT id FROM users WHERE username='supervisor'").get().id);
const supervisorName = String(db.prepare("SELECT full_name FROM users WHERE username='supervisor'").get().full_name);

const CODE = 'EQ-MAINT-E2E';
db.prepare(
  `INSERT INTO lab_equipment (code, name, location, status_raw, calibration_status_raw, is_archived, created_by, created_at, updated_at)
   VALUES (?, 'E2E Maintenance Device', 'LABORATORY', 'In Use', 'yes', 0, ?, datetime('now'), datetime('now'))`,
).run(CODE, managerId);
const equipmentId = Number(db.prepare('SELECT id FROM lab_equipment WHERE code = ?').get(CODE).id);
const maintenanceUrl = `/lab/equipment/${equipmentId}/maintenance`;

const maintenanceCount = () =>
  Number(db.prepare('SELECT COUNT(*) AS n FROM lab_equipment_maintenance WHERE equipment_id = ?').get(equipmentId).n);
const auditsForMaintenance = () =>
  db
    .prepare(
      "SELECT action, note, actor_id FROM qc_audit_log WHERE entity_type='LAB_EQUIPMENT_MAINTENANCE' AND entity_id IN (SELECT id FROM lab_equipment_maintenance WHERE equipment_id = ?) ORDER BY id",
    )
    .all(equipmentId);

// ── A. Auth wall ──
{
  const ctx = await browser.newContext();
  const res = await ctx.request.get(`${BASE}${maintenanceUrl}`, { maxRedirects: 0 });
  ok(res.status() === 302, 'anonymous GET maintenance page → 302');
  ok((res.headers().location ?? '').startsWith('/login'), 'anonymous redirects to /login');
  await ctx.close();
}

// ── B. RBAC walls ──
let supervisor;
{
  const emp = await browser.newPage();
  await login(emp, 'employee');
  const res = await emp.goto(`${BASE}${maintenanceUrl}`, { waitUntil: 'domcontentloaded' });
  ok(res.status() === 200, 'employee: maintenance page → 200');
  ok((await emp.locator('#issue').count()) === 0, 'employee: no maintenance logging form (LAB_EQUIPMENT_MAINTENANCE)');
  await emp.close();

  supervisor = await browser.newPage();
  await login(supervisor, 'supervisor');
  const res2 = await supervisor.goto(`${BASE}${maintenanceUrl}`, { waitUntil: 'domcontentloaded' });
  ok(res2.status() === 200, 'supervisor: maintenance page → 200');
  ok((await supervisor.locator('#issue').count()) === 1, 'supervisor: maintenance logging form visible');
}

// ── C. Log a COMPLETED event through the real form ──
{
  await supervisor.goto(`${BASE}${maintenanceUrl}`, { waitUntil: 'domcontentloaded' });
  await supervisor.fill('#maintenance_date', '2026-08-15');
  await supervisor.fill('#maintenance_type', 'Corrective');
  await supervisor.fill('#issue', 'E2E pressure leak on sealing ring');
  await supervisor.fill('#description', 'Replaced the sealing ring and re-tested the chamber.');
  await supervisor.fill('#technician_vendor', 'ACME Maintenance Co.');
  await supervisor.selectOption('#status', 'COMPLETED');
  await supervisor.fill('#completed_date', '2026-08-16');
  await supervisor.fill('#notes', 'Part replaced under warranty.');
  await supervisor.locator(`form[action="/api/lab/equipment/${equipmentId}/maintenance"] button[type="submit"]`).click();
  await supervisor.waitForURL((u) => u.pathname === maintenanceUrl, { timeout: 15_000 });

  eq_(maintenanceCount(), 1, 'create: one maintenance row written');
  const row = db.prepare('SELECT * FROM lab_equipment_maintenance WHERE equipment_id = ?').get(equipmentId);
  eq_(row.issue, 'E2E pressure leak on sealing ring', 'create: issue stored');
  eq_(row.status, 'COMPLETED', 'create: status stored');
  eq_(row.completed_date, '2026-08-16', 'create: completed_date stored');
  eq_(row.created_by, supervisorId, 'create: actor recorded');
  const audit = auditsForMaintenance();
  eq_(audit.length, 1, 'create: exactly one CREATE audit row');
  eq_(audit[0].action, 'CREATE', 'create: audit action CREATE');
  ok(audit[0].note.includes('equipment=EQ-MAINT-E2E'), 'create: audit note carries the equipment code');

  const alert = await supervisor.locator('[role="alert"]').textContent();
  ok(/Maintenance event recorded/.test(alert ?? ''), 'create: success flash shown');
}

// ── D. History + audit render on the page ──
{
  await supervisor.goto(`${BASE}${maintenanceUrl}`, { waitUntil: 'domcontentloaded' });
  const history = supervisor.locator('section[aria-labelledby="sec-history"]');
  ok((await history.getByText('E2E pressure leak on sealing ring').count()) > 0, 'history: event issue shown');
  ok((await history.getByText('ACME Maintenance Co.').count()) > 0, 'history: technician/vendor shown');
  ok((await history.getByText('Completed').count()) > 0, 'history: status label Completed');
  ok((await history.getByText(supervisorName).count()) > 0, 'history: Logged By resolves the supervisor name');

  const auditSection = supervisor.locator('section[aria-labelledby="sec-audit"]');
  ok((await auditSection.getByText('CREATE').count()) > 0, 'audit trail: CREATE action shown');
  ok((await auditSection.getByText('equipment=EQ-MAINT-E2E').count()) > 0, 'audit trail: note shown');
}

// ── E. Combined timeline ──
{
  db.prepare(
    `INSERT INTO lab_test_records (test_number, test_type, equipment_id, status, final_result, created_by, created_at, updated_at)
     VALUES ('LAB-TEST-MAINT-E2E', 'air', ?, 'APPROVED', 'PASS', ?, datetime('now'), datetime('now'))`,
  ).run(equipmentId, managerId);
  db.prepare(
    `INSERT INTO lab_equipment_calibration (equipment_id, last_calibrated_at, provider, certificate_reference, result, created_by)
     VALUES (?, '2026-07-10', 'Metrology SA', 'CERT-E2E-001', 'PASS', ?)`,
  ).run(equipmentId, managerId);

  await supervisor.goto(`${BASE}${maintenanceUrl}`, { waitUntil: 'domcontentloaded' });
  const timeline = supervisor.locator('section[aria-labelledby="sec-timeline"]');
  ok((await timeline.getByText('Usage').count()) > 0, 'timeline: usage kind rendered');
  ok((await timeline.getByText('LAB-TEST-MAINT-E2E · APPROVED').count()) > 0, 'timeline: usage entry with test drill-down');
  ok((await timeline.getByText('Maintenance').count()) > 0, 'timeline: maintenance kind rendered');
  ok((await timeline.getByText('Calibration').count()) > 0, 'timeline: calibration kind rendered');
  ok((await timeline.getByText('Calibration · CERT-E2E-001').count()) > 0, 'timeline: calibration entry with certificate');
  ok((await timeline.getByText('Returned to service').count()) > 0, 'timeline: returned-to-service marker derived from COMPLETED event');
  ok((await timeline.getByText('Metrology SA').count()) > 0, 'timeline: calibration provider shown');
}

// ── F. Archived equipment ──
{
  db.prepare('UPDATE lab_equipment SET is_archived = 1 WHERE id = ?').run(equipmentId);
  await supervisor.goto(`${BASE}${maintenanceUrl}`, { waitUntil: 'domcontentloaded' });
  ok((await supervisor.locator('#issue').count()) === 0, 'archived: logging form hidden');
  ok((await supervisor.getByText('archived — new maintenance events cannot be logged').count()) > 0, 'archived: amber banner shown');

  const before = maintenanceCount();
  const res = await supervisor.request.post(`${BASE}/api/lab/equipment/${equipmentId}/maintenance`, {
    headers: { origin: BASE },
    form: {
      maintenance_date: '2026-09-01',
      maintenance_type: 'Preventive',
      issue: 'Rejected on archived device',
      technician_vendor: 'Vendor',
      status: 'PLANNED',
    },
    maxRedirects: 0,
  });
  ok(res.status() === 302, 'archived: direct POST still redirects (flash path)');
  eq_(maintenanceCount(), before, 'archived: no new row written');
  db.prepare('UPDATE lab_equipment SET is_archived = 0 WHERE id = ?').run(equipmentId);
}

// ── G. Validation failure ──
{
  await supervisor.goto(`${BASE}${maintenanceUrl}`, { waitUntil: 'domcontentloaded' });
  await supervisor.fill('#maintenance_date', '2026-08-20');
  await supervisor.fill('#maintenance_type', 'Preventive');
  await supervisor.fill('#issue', 'Scheduled check');
  await supervisor.fill('#technician_vendor', 'ACME Maintenance Co.');
  await supervisor.selectOption('#status', 'COMPLETED');
  await supervisor.locator(`form[action="/api/lab/equipment/${equipmentId}/maintenance"] button[type="submit"]`).click();
  await supervisor.waitForURL((u) => u.pathname === maintenanceUrl, { timeout: 15_000 });
  const alert = await supervisor.locator('[role="alert"]').textContent();
  ok(/Completed Date is required/.test(alert ?? ''), 'validation: flash error for COMPLETED without completed date');
  eq_(maintenanceCount(), 1, 'validation: no row written');
}

// ── H. No horizontal overflow ──
{
  for (const [width, label] of [[1440, 'desktop'], [390, 'mobile']]) {
    await supervisor.setViewportSize({ width, height: 900 });
    await supervisor.goto(`${BASE}${maintenanceUrl}`, { waitUntil: 'domcontentloaded' });
    const w = await supervisor.evaluate(() => document.documentElement.scrollWidth);
    ok(w <= width, `overflow: maintenance page at ${label} (${w} ≤ ${width})`);
  }
}

await browser.close();
db.close();
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error('\nFailures:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}