// Run the complete QC acceptance surface against isolated standalone servers.
// Each suite gets a fresh SQLite file and port so fixtures cannot leak between
// scenarios and a failure identifies one bounded workflow.

import { execFileSync, spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { CANONICAL_E2E_SUITES } from './e2e-registry.mjs';

const appDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const tempDir = mkdtempSync(join(tmpdir(), 'brightai-qc-acceptance-'));
const CHILD_TIMEOUT_MS = Number(process.env.E2E_SUITE_TIMEOUT_MS ?? 120_000);
const suiteResults = [];
const suites = CANONICAL_E2E_SUITES;
if (suites.length === 0) {
  console.error('E2E registry is empty — refusing to run an empty acceptance surface.');
  process.exit(1);
}

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

function runChild(script, env, timeoutMs = CHILD_TIMEOUT_MS) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [script], {
      cwd: appDir,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let settled = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      setTimeout(() => {
        if (child.exitCode === null) child.kill('SIGKILL');
      }, 2_000).unref();
    }, timeoutMs);
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolvePromise({ ...result, stdout, stderr, timedOut });
    };
    child.once('error', (error) => finish({ code: null, signal: null, error }));
    child.once('close', (code, signal) => finish({ code, signal }));
  });
}

function assertionCounts(output) {
  const matches = [...output.matchAll(/(?:Result:\s*)?(\d+)\s+passed(?:\s*\/|,\s*)(\d+)\s+failed/gi)];
  if (matches.length === 0) return { passed: null, failed: null };
  const [, passed, failed] = matches.at(-1);
  return { passed: Number(passed), failed: Number(failed) };
}

function suiteEnv(dbPath, port, extra = {}) {
  return {
    ...process.env,
    ...extra,
    NODE_ENV: 'production',
    ADMIN_DEFAULT_PASSWORD: 'acceptance-only-password-2026',
    // Fixture-only opt-out of the first-login must_change_password seeding
    // flag (see src/lib/seed.ts). The password lifecycle itself is covered by
    // the dedicated `auth-password-flow` suite, which re-enables the flag per
    // scenario through direct DB fixtures. NEVER set this on a real deployment.
    QC_SEED_MUST_CHANGE_PASSWORD: '0',
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
  if (server.exitCode !== null) return;
  await new Promise((resolvePromise) => {
    const timer = setTimeout(() => {
      if (server.exitCode === null) server.kill('SIGKILL');
      resolvePromise();
    }, 2_000);
    server.once('close', () => {
      clearTimeout(timer);
      resolvePromise();
    });
    server.kill('SIGTERM');
  });
}

async function runSuite(label, script, port) {
  const startedAt = Date.now();
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
    console.log(`   DB path: ${dbPath}`);
    const result = await runChild(script, env);
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    if (result.timedOut) throw new Error(`${label} TIMEOUT after ${CHILD_TIMEOUT_MS}ms`);
    if (result.error) throw result.error;
    if (result.code !== 0) throw new Error(`${script} exited with ${result.signal ?? `code ${result.code}`}`);
    suiteResults.push({ label, script, ...assertionCounts(`${result.stdout}\n${result.stderr}`), durationMs: Date.now() - startedAt, timeout: 'none' });
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
    const startedAt = Date.now();
    await waitForServer(server, createEnv.BASE_URL);
    console.log('\n▶ Acceptance suite: restart persistence (create)');
    const result = await runChild('scripts/e2e-persistence.mjs', createEnv);
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    if (result.timedOut) throw new Error(`restart persistence (create) TIMEOUT after ${CHILD_TIMEOUT_MS}ms`);
    if (result.code !== 0) throw new Error(`restart persistence (create) exited with code ${result.code}`);
    suiteResults.push({ label: 'restart persistence (create)', script: 'scripts/e2e-persistence.mjs', ...assertionCounts(`${result.stdout}\n${result.stderr}`), durationMs: Date.now() - startedAt, timeout: 'none' });
  } finally {
    await stopServer(server);
  }

  const verifyEnv = suiteEnv(dbPath, port, { PERSISTENCE_STAGE: 'verify' });
  server = startServer(verifyEnv);
  try {
    const startedAt = Date.now();
    await waitForServer(server, verifyEnv.BASE_URL);
    console.log('▶ Acceptance suite: restart persistence (verify after restart)');
    const result = await runChild('scripts/e2e-persistence.mjs', verifyEnv);
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    if (result.timedOut) throw new Error(`restart persistence (verify) TIMEOUT after ${CHILD_TIMEOUT_MS}ms`);
    if (result.code !== 0) throw new Error(`restart persistence (verify) exited with code ${result.code}`);
    suiteResults.push({ label: 'restart persistence (verify)', script: 'scripts/e2e-persistence.mjs', ...assertionCounts(`${result.stdout}\n${result.stderr}`), durationMs: Date.now() - startedAt, timeout: 'none' });
    console.log('✅ restart persistence');
  } finally {
    await stopServer(server);
  }
}

try {
  const gitEnv = { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' };
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: appDir, encoding: 'utf8', env: gitEnv }).trim();
  const status = execFileSync('git', ['status', '--porcelain'], { cwd: appDir, encoding: 'utf8', env: gitEnv }).trim() || '(clean)';
  const nodeVersion = process.version;
  const pnpmVersion = execFileSync('pnpm', ['--version'], { cwd: appDir, encoding: 'utf8' }).trim();
  console.log('QC acceptance reproducibility');
  console.log(`HEAD SHA: ${head}`);
  console.log(`Dirty/untracked status: ${status}`);
  console.log(`Node version: ${nodeVersion}`);
  console.log(`pnpm version: ${pnpmVersion}`);
  console.log(`DB path root: ${tempDir}`);
  console.log(`Child suite timeout: ${CHILD_TIMEOUT_MS}ms`);
  console.log(`QC acceptance runner using ${suites.length} isolated workflow databases plus one restart-persistence database.`);
  for (let i = 0; i < suites.length; i += 1) {
    const [label, script] = suites[i];
    await runSuite(label, script, 4500 + i);
  }
  await runPersistenceSuite(4500 + suites.length + 1);
  const totalPassed = suiteResults.reduce((sum, r) => sum + (r.passed ?? 0), 0);
  const totalFailed = suiteResults.reduce((sum, r) => sum + (r.failed ?? 0), 0);
  const assertionsParsable = suiteResults.every((r) => r.passed !== null);
  const totalDurationMs = suiteResults.reduce((sum, r) => sum + r.durationMs, 0);
  console.log('\nAcceptance summary');
  console.log(`  HEAD SHA: ${head}`);
  console.log(`  Dirty/untracked status: ${status}`);
  console.log(`  Suites: ${suiteResults.length} passed / ${suites.length + 2} total (incl. 2-phase restart persistence)`);
  console.log(`  Assertions: ${assertionsParsable ? `${totalPassed} passed / ${totalFailed} failed` : `${totalPassed}+ passed / parsability incomplete`} (per-suite counts parsed from suite output)`);
  console.log(`  Total duration: ${totalDurationMs}ms`);
  console.log('');
  for (const result of suiteResults) {
    console.log(`  ${result.label} | ${result.script} | passed=${result.passed ?? '?'} failed=${result.failed ?? '?'} | ${result.durationMs}ms | timeout=${result.timeout}`);
  }
  console.log('\n✅ All QC acceptance suites passed.');
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
