// Run the complete QC acceptance surface against isolated standalone servers.
// Each suite gets a fresh SQLite file and port so fixtures cannot leak between
// scenarios and a failure identifies one bounded workflow.

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const appDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const tempDir = mkdtempSync(join(tmpdir(), 'brightai-qc-acceptance-'));
const suites = [
  ['admin-users', 'scripts/e2e-admin-users.mjs'],
  ['auth-lockout', 'scripts/e2e-auth-lockout.mjs'],
  ['task-shared', 'scripts/e2e-task-shared.mjs'],
  ['delete-request', 'scripts/e2e-delete-request.mjs'],
  ['dashboard', 'scripts/e2e-dashboard.mjs'],
  ['a11y', 'scripts/e2e-a11y.mjs'],
  ['backup', 'scripts/e2e-backup.mjs'],
  ['search', 'scripts/e2e-search.mjs'],
  ['findings', 'scripts/e2e-findings.mjs'],
  ['lab-nav', 'scripts/e2e-lab-nav.mjs'],
  ['lab-form', 'scripts/e2e-lab-form.mjs'],
  ['lab-tests', 'scripts/e2e-lab-tests.mjs'],
  ['reports', 'scripts/e2e-reports.mjs'],
];

function sleep(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

async function waitForServer(child, url) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`server exited before readiness with code ${child.exitCode}`);
    }
    try {
      const response = await fetch(`${url}/login`, { redirect: 'manual' });
      if (response.status === 200) return;
    } catch {
      // The standalone server may need a few retries while Astro initializes.
    }
    await sleep(250);
  }
  throw new Error(`server did not become ready at ${url}`);
}

function runChild(script, env) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [script], {
      cwd: appDir,
      env,
      stdio: 'inherit',
    });
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`${script} exited with ${signal ?? `code ${code}`}`));
    });
  });
}

function suiteEnv(dbPath, port, extra = {}) {
  return {
    ...process.env,
    ...extra,
    NODE_ENV: 'production',
    ADMIN_DEFAULT_PASSWORD: 'acceptance-only-password-2026',
    HOST: '127.0.0.1',
    PORT: String(port),
    BASE_URL: `http://127.0.0.1:${port}`,
    QC_DATABASE_PATH: dbPath,
    QC_DB_PATH: dbPath,
  };
}

function startServer(env) {
  return spawn(process.execPath, ['./dist/server/entry.mjs'], {
    cwd: appDir,
    env,
    stdio: 'inherit',
  });
}

async function stopServer(server) {
  if (server.exitCode === null) server.kill('SIGTERM');
  await sleep(150);
}

async function runSuite(label, script, port) {
  const dbPath = join(tempDir, `${label}.db`);
  const env = suiteEnv(dbPath, port);
  const server = startServer(env);
  try {
    await waitForServer(server, env.BASE_URL);
    // GET /login does not touch SQLite. Bootstrap schema + seed once before
    // suites that inspect the fixture database directly.
    await fetch(`${env.BASE_URL}/login`, {
      method: 'POST',
      headers: {
        Origin: env.BASE_URL,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'username=%5F%5Fwarmup%5F%5F&password=x',
      redirect: 'manual',
    });
    console.log(`\n▶ Acceptance suite: ${label}`);
    await runChild(script, env);
    console.log(`✅ ${label}`);
  } finally {
    await stopServer(server);
  }
}

async function runPersistenceSuite(port) {
  const dbPath = join(tempDir, 'persistence.db');
  const createEnv = suiteEnv(dbPath, port, { PERSISTENCE_STAGE: 'create' });
  let server = startServer(createEnv);
  try {
    await waitForServer(server, createEnv.BASE_URL);
    console.log('\n▶ Acceptance suite: restart persistence (create)');
    await runChild('scripts/e2e-persistence.mjs', createEnv);
  } finally {
    await stopServer(server);
  }

  const verifyEnv = suiteEnv(dbPath, port, { PERSISTENCE_STAGE: 'verify' });
  server = startServer(verifyEnv);
  try {
    await waitForServer(server, verifyEnv.BASE_URL);
    console.log('▶ Acceptance suite: restart persistence (verify after restart)');
    await runChild('scripts/e2e-persistence.mjs', verifyEnv);
    console.log('✅ restart persistence');
  } finally {
    await stopServer(server);
  }
}

try {
  console.log(`QC acceptance runner using ${suites.length} isolated workflow databases plus one restart-persistence database.`);
  for (let i = 0; i < suites.length; i += 1) {
    const [label, script] = suites[i];
    await runSuite(label, script, 4500 + i);
  }
  await runPersistenceSuite(4512);
  console.log('\n✅ All QC acceptance suites passed.');
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
