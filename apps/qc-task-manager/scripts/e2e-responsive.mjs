// Lightweight responsive usability regression checks for the QC application.
// This is intentionally functional QA, not pixel comparison or SaaS visual testing.

import { chromium } from 'playwright';
import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.BASE_URL ?? 'http://localhost:4399';
const DB_PATH = process.env.QC_DATABASE_PATH ?? process.env.QC_DB_PATH;
const PASS = process.env.ADMIN_DEFAULT_PASSWORD ?? 'admin123';
if (!DB_PATH) throw new Error('QC_DATABASE_PATH is required.');

let passed = 0;
let failed = 0;
const failures = [];
function ok(condition, label) {
  if (condition) {
    passed += 1;
    console.log(`  ✅ ${label}`);
  } else {
    failed += 1;
    failures.push(label);
    console.log(`  ❌ ${label}`);
  }
}

const db = new Database(DB_PATH);
const one = (sql, ...params) => db.prepare(sql).get(...params);
const browser = await chromium.launch({ headless: true });
const artifactDir = join(process.cwd(), 'download', 'qa', 'responsive');
mkdirSync(artifactDir, { recursive: true });

// GET /login is intentionally non-mutating; the first POST bootstraps the
// isolated schema and seed, matching the acceptance runner contract.
await fetch(`${BASE}/login`, {
  method: 'POST',
  headers: { Origin: BASE, 'Content-Type': 'application/x-www-form-urlencoded' },
  body: 'username=%5F%5Fwarmup%5F%5F&password=x',
  redirect: 'manual',
});

// Stable, isolated records make detail/editor routes available on every runner.
const FIXTURE = {
  task: 'Responsive fixture with an intentionally very long operational task name that must wrap without widening the page at 400 percent zoom',
  product: 'PROD-RESPONSIVE-E2E-01',
  equipment: 'EQ-RESPONSIVE-E2E-01',
  test: 'LAB-TEST-RESPONSIVE-E2E-01',
  document: 'DOC-RESPONSIVE-E2E-01',
};
const manager = one("SELECT id FROM users WHERE username = 'manager'");
const employee = one("SELECT id FROM users WHERE username = 'employee'");
if (!manager || !employee) throw new Error('Seeded manager and employee are required.');

function clearFixtures() {
  const task = one('SELECT id FROM tasks WHERE title = ?', FIXTURE.task);
  if (task) {
    db.prepare('DELETE FROM task_activity_log WHERE task_id = ?').run(task.id);
    db.prepare('DELETE FROM task_comments WHERE task_id = ?').run(task.id);
    db.prepare('DELETE FROM task_attachments WHERE task_id = ?').run(task.id);
    db.prepare('DELETE FROM tasks WHERE id = ?').run(task.id);
  }
  const test = one('SELECT id FROM lab_test_records WHERE test_number = ?', FIXTURE.test);
  if (test) {
    db.prepare("UPDATE lab_test_records SET status = 'DRAFT' WHERE id = ?").run(test.id);
    db.prepare('DELETE FROM lab_test_samples WHERE test_id = ?').run(test.id);
    db.prepare('DELETE FROM lab_test_records WHERE id = ?').run(test.id);
  }
  db.prepare('DELETE FROM lab_document_links WHERE document_id IN (SELECT id FROM lab_documents WHERE code = ?)').run(FIXTURE.document);
  db.prepare('DELETE FROM lab_document_versions WHERE document_id IN (SELECT id FROM lab_documents WHERE code = ?)').run(FIXTURE.document);
  db.prepare('DELETE FROM lab_documents WHERE code = ?').run(FIXTURE.document);
  db.prepare('DELETE FROM lab_products WHERE code = ?').run(FIXTURE.product);
  db.prepare('DELETE FROM lab_equipment WHERE code = ?').run(FIXTURE.equipment);
}

clearFixtures();
const taskId = Number(db.prepare(`INSERT INTO tasks (title, description, status, priority, progress_percent, created_by, assigned_to)
  VALUES (?, 'responsive fixture', 'in_progress', 'medium', 25, ?, ?)`).run(FIXTURE.task, manager.id, manager.id).lastInsertRowid);
db.prepare('INSERT INTO task_activity_log (task_id, user_id, action, new_value) VALUES (?, ?, ?, ?)').run(taskId, manager.id, 'task_created', FIXTURE.task);
const productId = Number(db.prepare(`INSERT INTO lab_products (name, code, description, connector_type, created_by)
  VALUES ('Responsive Fixture Product', ?, 'responsive fixture', 'Threaded', ?)`).run(FIXTURE.product, manager.id).lastInsertRowid);
const equipmentId = Number(db.prepare(`INSERT INTO lab_equipment (name, code, location, status_raw, serial_number, created_by)
  VALUES ('Responsive Fixture Equipment', ?, 'Lab Bench', 'Operational', 'SN-RESPONSIVE-01', ?)`).run(FIXTURE.equipment, manager.id).lastInsertRowid);
const testId = Number(db.prepare(`INSERT INTO lab_test_records
  (test_number, test_type, product_id, equipment_id, lot_number, sampling_area, sample_count, final_result, status, tested_by, created_by)
  VALUES (?, 'air', ?, ?, 'LOT-RESPONSIVE-01', 'Area A', 1, 'PASS', 'APPROVED', ?, ?)`).run(FIXTURE.test, productId, equipmentId, employee.id, employee.id).lastInsertRowid);
db.prepare(`INSERT INTO lab_test_samples (test_id, sample_no, sample_identifier, part_name, result, status)
  VALUES (?, 1, 'RESPONSIVE-S01', 'Fixture Part', 'PASS', 'APPROVED')`).run(testId);
const documentId = Number(db.prepare(`INSERT INTO lab_documents
  (code, title, type, owner_id, status, created_by, created_at, updated_at)
  VALUES (?, 'Responsive Fixture SOP', 'SOP', ?, 'APPROVED', ?, datetime('now'), datetime('now'))`).run(FIXTURE.document, manager.id, manager.id).lastInsertRowid);
const versionId = Number(db.prepare(`INSERT INTO lab_document_versions
  (document_id, version, content_md, change_summary, author_id, status)
  VALUES (?, 1, '# Responsive fixture', 'Fixture', ?, 'APPROVED')`).run(documentId, manager.id).lastInsertRowid);
db.prepare('UPDATE lab_documents SET current_version_id = ? WHERE id = ?').run(versionId, documentId);

const SCREENS = [
  { name: 'login', path: '/login', role: 'guest' },
  { name: 'employee home', path: '/employee', role: 'employee' },
  { name: 'manager home', path: '/manager', role: 'manager' },
  { name: 'task detail', path: `/tasks/${taskId}`, role: 'manager' },
  { name: 'lab home', path: '/lab', role: 'manager' },
  { name: 'tests register', path: '/lab/tests', role: 'manager' },
  { name: 'new test', path: '/lab/tests/new?type=air', role: 'employee' },
  { name: 'test detail', path: `/lab/tests/${testId}`, role: 'manager' },
  { name: 'documents', path: '/lab/documents', role: 'manager' },
  { name: 'document detail', path: `/lab/documents/${documentId}`, role: 'manager' },
  { name: 'document editor', path: `/lab/documents/${documentId}/edit`, role: 'manager' },
  { name: 'equipment', path: '/lab/equipment', role: 'manager' },
  { name: 'change request', path: '/lab/change-requests', role: 'manager' },
  { name: 'lab search', path: '/lab/search', role: 'manager' },
  { name: 'reports', path: '/reports', role: 'manager' },
  { name: 'lab management', path: '/lab/management', role: 'manager' },
  { name: 'admin users', path: '/admin/users', role: 'admin' },
  { name: 'system health', path: '/admin/system-health', role: 'admin' },
];
const VIEWPORTS = [1440, 1024, 768, 375, 320].map((width) => ({ width, height: width <= 768 ? 844 : 900 }));

async function login(page, username) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('#username', username);
  await page.fill('#password', PASS);
  await page.locator('form[action="/login"] button[type="submit"]').click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15_000 });
}

async function stabilize(page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
}

async function inspect(page, screen, viewport) {
  const label = `${screen.name} @ ${viewport.width}px`;
  const response = await page.goto(`${BASE}${screen.path}`, { waitUntil: 'domcontentloaded' });
  await stabilize(page);
  ok(response?.status() === 200, `${label}: HTTP 200`);
  const metrics = await page.evaluate(() => {
    const viewportWidth = window.innerWidth;
    const visible = (el) => {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };
    const bodyOverflow = document.body.scrollWidth > viewportWidth + 1;
    const overflowNodes = bodyOverflow ? [...document.querySelectorAll('body *')].map((el) => { const r = el.getBoundingClientRect(); return { tag: el.tagName, cls: String(el.className || '').slice(0, 80), right: Math.round(r.right), width: Math.round(r.width), text: (el.textContent || '').trim().slice(0, 30) }; }).filter((x) => x.right > viewportWidth + 1).sort((a, b) => b.right - a.right).slice(0, 3) : [];
    const actions = [...document.querySelectorAll('main button, main input[type="submit"], main form, main a.inline-flex, main a[class*="rounded"]')]
      .filter((el) => !el.closest('table'))
      .filter(visible);
    const clippedAction = actions.find((el) => { const r = el.getBoundingClientRect(); return r.left < -1 || r.right > viewportWidth + 1; });
    const tableIssues = [...document.querySelectorAll('table')].filter(visible).filter((table) => {
      const tableWidth = table.getBoundingClientRect().width;
      if (tableWidth <= viewportWidth + 1) return false;
      let node = table.parentElement;
      for (let i = 0; node && i < 5; i += 1, node = node.parentElement) {
        const cls = String(node.className || '');
        const overflowX = getComputedStyle(node).overflowX;
        if (/overflow-x-auto|overflow-auto|responsive-table/i.test(cls) || overflowX === 'auto' || overflowX === 'scroll') return false;
      }
      return true;
    });
    const dialogs = [...document.querySelectorAll('[role="dialog"], dialog')].filter(visible).map((el) => { const r = el.getBoundingClientRect(); return r.left >= -1 && r.top >= -1 && r.right <= viewportWidth + 1 && r.bottom <= window.innerHeight + 1; });
    const errors = [...document.querySelectorAll('[role="alert"], [aria-live="assertive"]')].filter(visible).map((el) => { const r = el.getBoundingClientRect(); return r.left >= -1 && r.right <= viewportWidth + 1; });
    const mobileToggle = document.querySelector('button[aria-controls="mobile-menu"]');
    const desktopNav = document.querySelector('header nav, header a[href="/logout"]');
    return { bodyOverflow, overflowNodes, viewportWidth, bodyWidth: document.body.scrollWidth, mainWidth: document.querySelector('main')?.getBoundingClientRect().width, actionCount: actions.length, clippedAction: !!clippedAction, tableIssues: tableIssues.length, dialogsInside: dialogs.every(Boolean), errorsInside: errors.every(Boolean), mobileToggleVisible: !!mobileToggle && visible(mobileToggle), desktopNavVisible: !!desktopNav && visible(desktopNav) };
  });
  ok(!metrics.bodyOverflow, `${label}: no accidental horizontal overflow`);
  ok(metrics.actionCount > 0, `${label}: primary/action affordance exists`);
  ok(!metrics.clippedAction, `${label}: primary/action affordance is not horizontally clipped`);
  const actionReachable = await page.evaluate(() => {
    const visible = (el) => { const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0; };
    const action = [...document.querySelectorAll('main button, main input[type="submit"], main form, main a.inline-flex, main a[class*="rounded"]')]
      .filter((el) => !el.closest('table'))
      .find(visible);
    if (!action) return false;
    action.scrollIntoView({ block: 'center', inline: 'nearest' });
    const r = action.getBoundingClientRect();
    return r.top < window.innerHeight && r.bottom > 0 && r.left >= -1 && r.right <= window.innerWidth + 1;
  });
  ok(actionReachable, `${label}: primary/action affordance is reachable`);
  ok(screen.role === 'guest' || (viewport.width <= 768 ? metrics.mobileToggleVisible : metrics.desktopNavVisible), `${label}: navigation is usable`);
  ok(metrics.tableIssues === 0, `${label}: wide tables have a responsive container`);
  ok(metrics.dialogsInside, `${label}: dialogs stay inside viewport`);
  ok(metrics.errorsInside, `${label}: visible errors are not clipped`);
  if (metrics.overflowNodes.length) console.log(`    overflow nodes @${metrics.viewportWidth}: body=${metrics.bodyWidth} main=${metrics.mainWidth}: ${JSON.stringify(metrics.overflowNodes)}`);
  if (metrics.bodyOverflow || metrics.clippedAction || metrics.tableIssues || !metrics.dialogsInside || !metrics.errorsInside) {
    await page.screenshot({ path: join(artifactDir, `${screen.name.replace(/[^a-z0-9]+/gi, '-')}-${viewport.width}.png`), fullPage: true });
  }
}

try {
  for (const viewport of VIEWPORTS) {
    const contexts = new Map();
    for (const role of ['employee', 'manager', 'admin']) contexts.set(role, await browser.newContext({ viewport }));
    contexts.set('guest', await browser.newContext({ viewport }));
    const pages = new Map();
    for (const [role, context] of contexts) {
      const page = await context.newPage();
      pages.set(role, page);
      if (role !== 'guest') await login(page, role);
    }
    for (const screen of SCREENS) await inspect(pages.get(screen.role), screen, viewport);
    for (const context of contexts.values()) await context.close();
  }
} finally {
  db.close();
  await browser.close();
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) {
  console.error('Failures:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log('✅ Responsive usability E2E checks passed.');
