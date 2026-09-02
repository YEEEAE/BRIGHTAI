// Adversarial security contracts: malicious uploads, privilege escalation,
// secret fallback rejection, and password-hash storage.
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const temp = mkdtempSync(join(tmpdir(), 'brightai-security-adversarial-'));
process.env.QC_DATABASE_PATH = join(temp, 'security.db');
process.env.QC_DB_PATH = '';
process.env.ADMIN_DEFAULT_PASSWORD = 'adversarial-seed-pass-2026';
process.env.QC_SEED_MUST_CHANGE_PASSWORD = '0';

let passed = 0;
function ok(condition, message) {
  assert.ok(condition, message);
  passed += 1;
  console.log(`  ✅ ${message}`);
}

try {
  const { getDb, closeDatabase } = await import('../src/lib/db.ts');
  const { getUserById, createSession, destroySession } = await import('../src/lib/auth.ts');
  const { validateUploadedFile } = await import('../src/lib/taskUpdates/shared.ts');
  const { POST: backupPost } = await import('../src/pages/api/admin/backup.ts');

  const db = getDb();
  const employeeRow = db.prepare("SELECT * FROM users WHERE username = 'employee'").get();
  const adminRow = db.prepare("SELECT * FROM users WHERE username = 'admin'").get();
  ok(/^\$2[ab]\$10\$/.test(employeeRow.password_hash), 'password hashes use bcrypt cost factor 10');

  const svg = new File(['<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'], 'proof.svg', { type: 'image/svg+xml' });
  const svgResult = validateUploadedFile(svg, Buffer.from(await svg.arrayBuffer()));
  ok(svgResult.ok === false, 'malicious SVG upload is rejected');
  ok(db.prepare('SELECT COUNT(*) AS n FROM task_attachments').get().n === 0, 'malicious SVG creates no attachment record');
  const polyglot = new File([Buffer.from('%PDF-1.7\n<script>alert(1)</script>')], 'polyglot.pdf', { type: 'application/pdf' });
  const polyglotResult = validateUploadedFile(polyglot, Buffer.from(await polyglot.arrayBuffer()));
  ok(polyglotResult.ok === false, 'active-content polyglot is rejected');

  const employee = getUserById(employeeRow.id);
  const employeeToken = createSession(employee);
  const cookies = { get: (name) => name === 'qc_session' ? { value: employeeToken } : undefined };
  const origin = 'http://localhost:4321';
  const context = {
    request: new Request(`${origin}/api/admin/backup`, { method: 'POST', headers: { Origin: origin, Accept: 'application/json' } }),
    url: new URL(`${origin}/api/admin/backup`),
    cookies,
    redirect: (path) => new Response(null, { status: 302, headers: { Location: path } }),
  };
  const response = await backupPost(context);
  ok(response.status === 403, 'employee direct API call to /api/admin/backup is rejected with 403');
  ok(db.prepare('SELECT COUNT(*) AS n FROM sessions WHERE token = ?').get(employeeToken).n === 1, 'authorization failure does not mutate session records');
  destroySession(employeeToken);
  ok(db.prepare('SELECT COUNT(*) AS n FROM sessions WHERE token = ?').get(employeeToken).n === 0, 'logout revokes the server-side session row immediately');

  const fallbackProbe = spawnSync(process.execPath, ['--import', '../../scripts/test-ts-loader.mjs', '--experimental-strip-types', '-e', "await import('./src/lib/db.ts')"], {
    cwd: process.cwd(), encoding: 'utf8', env: { ...process.env, NODE_ENV: 'production', SESSION_SECRET: 'dev-secret' },
  });
  ok(fallbackProbe.status !== 0 && !fallbackProbe.stderr.includes('dev-secret'), 'production rejects development secret without echoing its value');

  const productionSeedProbe = spawnSync(process.execPath, ['--import', '../../scripts/test-ts-loader.mjs', '--experimental-strip-types', '-e', "await import('./src/lib/db.ts').then(({getDb}) => getDb())"], {
    cwd: process.cwd(), encoding: 'utf8', env: { ...process.env, NODE_ENV: 'production', ADMIN_DEFAULT_PASSWORD: '', QC_SEED_MUST_CHANGE_PASSWORD: '0', QC_DATABASE_PATH: join(temp, 'production-seed.db') },
  });
  ok(productionSeedProbe.status !== 0 && productionSeedProbe.stderr.includes('forbidden in production'), 'production rejects fixture password opt-out before seeding');

  closeDatabase();
  console.log(`SECURITY-ADVERSARIAL: PASS (${passed} checks)`);
} finally {
  rmSync(temp, { recursive: true, force: true });
}
