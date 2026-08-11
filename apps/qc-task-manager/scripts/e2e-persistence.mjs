// Acceptance check for BLOB persistence across a standalone server restart.
// The orchestrator runs this script twice with the same database: create the
// upload, restart the server, then verify the original bytes are downloadable.

import { chromium } from 'playwright';
import Database from 'better-sqlite3';

const BASE = process.env.BASE_URL;
const DB_PATH = process.env.QC_DATABASE_PATH ?? process.env.QC_DB_PATH;
const STAGE = process.env.PERSISTENCE_STAGE;
if (!BASE || !DB_PATH || !['create', 'verify'].includes(STAGE)) {
  throw new Error('BASE_URL, QC_DATABASE_PATH, and PERSISTENCE_STAGE=create|verify are required.');
}

const PASS = process.env.ADMIN_DEFAULT_PASSWORD ?? 'admin123';
const bytes = Buffer.from('%PDF-1.7 persistence fixture');
const headers = { Origin: BASE, Referer: `${BASE}/` };

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();
const db = new Database(DB_PATH);
const q = (sql, ...params) => db.prepare(sql).get(...params);

async function login() {
  const response = await ctx.request.post(`${BASE}/login`, {
    form: { username: 'employee', password: PASS, redirect: '/employee' },
    headers,
    maxRedirects: 0,
  });
  if (response.status() !== 302) throw new Error(`employee login failed: ${response.status()}`);
}

try {
  // A GET /login is intentionally not enough to initialize the SQLite schema.
  await ctx.request.post(`${BASE}/login`, {
    form: { username: '__persistence_warmup__', password: 'invalid' },
    headers,
    maxRedirects: 0,
  });

  if (STAGE === 'create') {
    const employee = q("SELECT id FROM users WHERE username = 'employee'");
    const task = db.prepare(
      `INSERT INTO tasks (title, status, priority, created_by, assigned_to)
       VALUES (?, 'in_progress', 'medium', ?, ?)`,
    ).run('E2E restart persistence', employee.id, employee.id);
    const taskId = Number(task.lastInsertRowid);
    db.prepare(
      "INSERT INTO task_activity_log (task_id, user_id, action, new_value) VALUES (?, ?, 'task_created', ?)",
    ).run(taskId, employee.id, 'E2E restart persistence');

    await login();
    const upload = await ctx.request.post(`${BASE}/api/tasks/${taskId}/attachments`, {
      multipart: { file: { name: 'restart-proof.pdf', mimeType: 'application/pdf', buffer: bytes } },
      headers,
    });
    if (upload.status() !== 200) throw new Error(`upload failed: ${upload.status()} ${await upload.text()}`);
    const attachment = q("SELECT id, file_name, file_data FROM task_attachments WHERE task_id = ?", taskId);
    if (!attachment || attachment.file_name !== 'restart-proof.pdf' || !Buffer.from(attachment.file_data).equals(bytes)) {
      throw new Error('uploaded BLOB was not stored before restart');
    }
    console.log('✅ persistence create: uploaded evidence stored in SQLite');
  } else {
    const task = q("SELECT id FROM tasks WHERE title = 'E2E restart persistence'");
    if (!task) throw new Error('persistence fixture task missing after restart');
    const attachment = q('SELECT id FROM task_attachments WHERE task_id = ? AND file_name = ?', task.id, 'restart-proof.pdf');
    if (!attachment) throw new Error('persistence fixture attachment missing after restart');
    await login();
    const download = await ctx.request.get(`${BASE}/api/tasks/${task.id}/attachments/${attachment.id}`);
    if (download.status() !== 200) throw new Error(`download after restart failed: ${download.status()}`);
    if (!Buffer.from(await download.body()).equals(bytes)) throw new Error('downloaded bytes changed after restart');
    console.log('✅ persistence verify: original upload survived server restart');
  }
} finally {
  await browser.close();
  db.close();
}
