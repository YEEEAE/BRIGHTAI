// Database-backed unit checks for authentication lockout, notification writes,
// and per-user saved search filters.
// This runs in its own process so QC_DATABASE_PATH is set before src/lib/db.ts
// evaluates its singleton path.

import Database from 'better-sqlite3';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const appDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const tempDir = mkdtempSync(join(tmpdir(), 'brightai-qc-unit-'));
const dbPath = join(tempDir, 'rules.db');

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`  ✅ ${message}`);
}

try {
  process.env.QC_DATABASE_PATH = dbPath;
  process.env.QC_DB_PATH = '';

  // Apply the same schema/seed path used by the app before importing DB-backed
  // modules. The child process intentionally owns this temporary database.
  execFileSync(process.execPath, ['scripts/init-db.mjs'], {
    cwd: appDir,
    env: { ...process.env, QC_DATABASE_PATH: dbPath, QC_DB_PATH: '' },
    stdio: 'ignore',
  });
  // Avoid starting the production catch-up backup during this focused test;
  // backup behavior has its own deterministic unit/E2E coverage.
  const backupDir = join(tempDir, 'backups');
  mkdirSync(backupDir, { recursive: true });
  writeFileSync(
    join(backupDir, 'status.json'),
    JSON.stringify({ state: 'success', lastSuccessAt: new Date().toISOString() }),
  );

  const { verifyCredentials } = await import('../src/lib/auth.ts');
  const { createNotification, listPersistedNotifications } = await import('../src/lib/notifications.ts');
  const { getDb } = await import('../src/lib/db.ts');

  console.log('\n■ Login lockout');
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const result = verifyCredentials('employee', 'wrong-password', `192.0.2.${attempt}`);
    assert(result.status === (attempt === 5 ? 'locked' : 'invalid'), `lockout: failed attempt ${attempt} handled`);
  }
  const lockedLogin = verifyCredentials('employee', 'admin123', '198.51.100.10');
  assert(lockedLogin.status === 'locked', 'lockout: correct password rejected while account is locked');

  const db = getDb();
  db.prepare("UPDATE users SET locked_until = datetime('now', '-1 minute'), failed_login_attempts = 0 WHERE username = 'employee'").run();
  const unlockedLogin = verifyCredentials('employee', 'admin123', '198.51.100.11');
  assert(unlockedLogin.status === 'ok', 'lockout: expired lock permits a correct login');
  const auditRows = db.prepare("SELECT COUNT(*) AS n FROM login_attempts WHERE username = 'employee' AND succeeded = 0").get();
  assert(Number(auditRows.n) >= 5, 'lockout: failed attempts are audited');

  console.log('\n■ Notification creation');
  const manager = db.prepare("SELECT id FROM users WHERE username = 'manager'").get();
  const employee = db.prepare("SELECT id FROM users WHERE username = 'employee'").get();
  const task = db.prepare('INSERT INTO tasks (title, created_by, assigned_to) VALUES (?, ?, ?)').run(
    'Notification unit fixture',
    employee.id,
    employee.id,
  );
  const taskId = Number(task.lastInsertRowid);
  createNotification({
    userId: manager.id,
    taskId,
    type: 'assigned',
    title: 'Task assigned',
    message: 'Notification unit fixture was assigned.',
    actorId: employee.id,
  });
  const persisted = listPersistedNotifications(manager.id, 10);
  assert(persisted.some((item) => item.taskId === taskId && item.kind === 'assigned'), 'notifications: active recipient receives persisted notification');
  const activity = db.prepare("SELECT action FROM task_activity_log WHERE task_id = ? AND action = 'notification_created'").get(taskId);
  assert(!!activity, 'notifications: notification creation is recorded in activity history');

  db.prepare('UPDATE users SET is_active = 0 WHERE id = ?').run(manager.id);
  createNotification({
    userId: manager.id,
    taskId,
    type: 'assigned',
    title: 'Should not arrive',
    message: 'Inactive recipients are skipped.',
    actorId: employee.id,
  });
  const inactiveCount = db.prepare("SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND title = 'Should not arrive'").get(manager.id);
  assert(Number(inactiveCount.n) === 0, 'notifications: inactive recipient is never notified');

  console.log('\n■ Saved filters (per user)');
  // DB-backed saved-filter round trip + server-side ownership enforcement.
  // The same lazy dynamic import used by /search (taskSearch.getSearchDb)
  // resolves to the in-process getDb singleton, so these functions and the
  // API handler below share this temporary database.
  const { saveFilter, listSavedFilters, deleteSavedFilter, savedFilterHref } = await import('../src/lib/taskSearch.ts');
  const { POST: filtersPost } = await import('../src/pages/api/filters.ts');

  // Minimal APIContext for POST /api/filters: same-origin form POST with an
  // empty cookie jar by default (the CSRF + auth gates run before any parse).
  function filtersContext({ origin = 'http://qc.test', fields = {} }) {
    const cookieMap = new Map();
    const cookies = {
      get(key) {
        const value = cookieMap.get(key);
        return value === undefined ? undefined : { value };
      },
      set(key, value) {
        cookieMap.set(key, value);
      },
      delete(key) {
        cookieMap.delete(key);
      },
    };
    return {
      request: new Request('http://qc.test/api/filters', {
        method: 'POST',
        headers: {
          Origin: origin,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(fields).toString(),
      }),
      url: new URL('http://qc.test/api/filters'),
      cookies,
      clientAddress: '127.0.0.1',
      redirect: (dest) => new Response(null, { status: 302, headers: { Location: dest } }),
    };
  }

  const mgrRow = db.prepare("SELECT id FROM users WHERE username = 'manager'").get();
  const empRow = db.prepare("SELECT id FROM users WHERE username = 'employee'").get();

  // Unauthorized access is denied at the handler before any DB write.
  const anonSave = await filtersPost(
    filtersContext({ fields: { action: 'save', name: 'Sneaky', filter_json: '{}', next: '/search' } }),
  );
  assert(anonSave.status === 401, 'saved filters: unauthenticated POST is rejected with 401');
  const crossOrigin = await filtersPost(
    filtersContext({ origin: 'http://evil.test', fields: { action: 'save', name: 'Sneaky', filter_json: '{}' } }),
  );
  assert(crossOrigin.status === 403, 'saved filters: cross-origin POST is rejected with 403');
  assert(
    Number(db.prepare('SELECT COUNT(*) AS n FROM saved_filters').get().n) === 0,
    'saved filters: denied requests never write rows',
  );

  // Happy path round trip: save → list → apply (href) → owner delete → gone.
  const filterId = await saveFilter(mgrRow.id, 'Completed only', '{"status":"completed"}');
  const myFilters = await listSavedFilters(mgrRow.id);
  assert(
    myFilters.some(
      (f) => f.id === filterId && f.name === 'Completed only' && f.filter_json === '{"status":"completed"}',
    ),
    'saved filters: save then list returns the row',
  );
  const stored = myFilters.find((f) => f.id === filterId);
  assert(savedFilterHref(stored.filter_json) === '/search?status=completed', 'saved filters: apply href rebuilds the search URL');
  assert((await listSavedFilters(empRow.id)).length === 0, 'saved filters: a user only lists their own filters');
  const foreignDelete = await deleteSavedFilter(empRow.id, filterId);
  assert(
    foreignDelete === false && (await listSavedFilters(mgrRow.id)).some((f) => f.id === filterId),
    'saved filters: foreign delete is denied (owner-only)',
  );
  const ownerDelete = await deleteSavedFilter(mgrRow.id, filterId);
  assert(
    ownerDelete === true && !(await listSavedFilters(mgrRow.id)).some((f) => f.id === filterId),
    'saved filters: owner delete removes the row (gone)',
  );

  console.log('\nDatabase-backed unit checks passed.');
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
