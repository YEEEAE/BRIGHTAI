// E2E coverage for automatic/admin backup surfaces.
//
// Usage (built server must share the same DB):
//   BASE_URL=http://localhost:4399 QC_DATABASE_PATH=/absolute/path/qc_tasks.db \
//     node scripts/e2e-backup.mjs

import { chromium } from 'playwright';
import Database from 'better-sqlite3';
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const BASE = process.env.BASE_URL ?? 'http://localhost:4399';
const DB_PATH = process.env.QC_DATABASE_PATH ?? process.env.QC_DB_PATH;
if (!DB_PATH) {
  console.error('QC_DATABASE_PATH is required.');
  process.exit(1);
}

const PASS = process.env.ADMIN_DEFAULT_PASSWORD ?? 'admin123';
const CSRF_HEADERS = { Origin: BASE, Referer: `${BASE}/` };
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

async function login(ctx, username, redirect) {
  return ctx.request.post(`${BASE}/login`, {
    form: { username, password: PASS, redirect },
    headers: CSRF_HEADERS,
    maxRedirects: 0,
  });
}

const browser = await chromium.launch({ headless: true });
const anon = await browser.newContext();
const manager = await browser.newContext();
const admin = await browser.newContext();
try {
  const anonSettings = await anon.request.get(`${BASE}/admin/settings`, { maxRedirects: 0 });
  ok(anonSettings.status() === 302 && (anonSettings.headers().location ?? '').startsWith('/login?redirect='), 'anonymous admin settings redirects to login');

  const managerLogin = await login(manager, 'manager', '/admin/settings');
  ok(managerLogin.status() === 302, `manager login succeeds (got ${managerLogin.status()} ${managerLogin.headers().location ?? ''})`);
  const managerSettings = await manager.request.get(`${BASE}/admin/settings`, { maxRedirects: 0 });
  ok(managerSettings.status() === 302 && (managerSettings.headers().location ?? '').startsWith('/manager'), `non-admin cannot access admin settings (got ${managerSettings.status()} ${managerSettings.headers().location ?? ''})`);

  const adminLogin = await login(admin, 'admin', '/admin/settings');
  ok(adminLogin.status() === 302 && adminLogin.headers().location === '/admin/settings', 'admin login redirects to settings');
  const page = await admin.newPage();
  await page.goto(`${BASE}/admin/settings`);
  const html = await page.content();
  ok(html.includes('Database backups') && html.includes('Create backup now'), 'admin settings renders backup status and manual action');
  await page.close();

  const manual = await admin.request.post(`${BASE}/api/admin/backup`, {
    headers: { ...CSRF_HEADERS, Accept: 'application/json' },
    maxRedirects: 0,
  });
  const manualText = await manual.text();
  let payload = {};
  try { payload = JSON.parse(manualText); } catch { console.log(`  ℹ️ manual response body: ${JSON.stringify(manualText)}`); }
  ok(manual.status() === 200 && payload.ok === true, `admin manual backup returns success JSON (got ${manual.status()})`);
  ok(payload.backup?.verification?.result === 'PASS', 'manual backup returns PASS verification');
  const name = payload.backup?.name ?? '';
  ok(/^qc_tasks-\d{4}-\d{2}-\d{2}-\d{6}\.db$/.test(name), 'manual backup uses required filename format');
  ok(existsSync(join(dirname(DB_PATH), 'backups', name)), 'manual backup file exists on disk');

  const db = new Database(DB_PATH, { readonly: true });
  const integrity = db.prepare('PRAGMA integrity_check').get();
  db.close();
  ok(integrity.integrity_check === 'ok', 'live database passes integrity_check');

  const backupDir = join(dirname(DB_PATH), 'backups');
  // Retention only manages qc_tasks-<ts>.db files (src/lib/backup.ts
  // listBackups → BACKUP_FILE_PATTERN; pre-migration-*.db safety snapshots are
  // deliberately never pruned). Every acceptance suite boots its own server
  // against a fresh DB in the same temp dir, so pre-migration files from OTHER
  // suites accumulate here — they are not "retention backups" and must not be
  // counted against the retention cap. Mirrors the app's own listBackups.
  const backupFiles = readdirSync(backupDir).filter((file) => /^qc_tasks-\d{4}-\d{2}-\d{2}-\d{6}\.db$/.test(file));
  ok(backupFiles.length >= 1 && backupFiles.length <= 14, 'backup retention directory contains at most 14 databases');

  const directDb = await admin.request.get(`${BASE}/db/backups/${encodeURIComponent(name)}`, { maxRedirects: 0 });
  const directStatus = await admin.request.get(`${BASE}/db/backups/status.json`, { maxRedirects: 0 });
  ok(directDb.status() !== 200 && directStatus.status() !== 200, 'backup database and status files are not served over HTTP');

  const getManual = await admin.request.get(`${BASE}/api/admin/backup`, { maxRedirects: 0 });
  ok(getManual.status() === 404 || getManual.status() === 405, `manual backup endpoint has no GET/download surface (got ${getManual.status()})`);
} finally {
  await anon.close();
  await manager.close();
  await admin.close();
  await browser.close();
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error('Failures:', failures.join(', '));
  process.exitCode = 1;
}
