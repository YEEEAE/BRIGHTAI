#!/usr/bin/env node
/**
 * @brightai/db — Local database setup
 *
 * Idempotent. Re-run safely.
 *
 * Steps:
 *   1. Wait for Postgres to be ready.
 *   2. Apply the RLS policies (rls.sql) via the brightai_admin role.
 *      This grants the right privileges to brightai_app and
 *      brightai_service on the (empty) public schema so future
 *      `prisma migrate` runs inherit them via ALTER DEFAULT PRIVILEGES.
 *   3. Verify the application + service roles can connect.
 *
 * Usage:
 *   node scripts/setup-local-db.mjs
 *   # or:
 *   pnpm --filter @brightai/db db:setup
 */

import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RLS_PATH = join(__dirname, '..', 'prisma', 'policies', 'rls.sql');

const DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://brightai_admin:brightai_admin@localhost:5432/brightai_dev';

const APP_URL =
  process.env.DATABASE_URL_APP ??
  'postgresql://brightai_app:brightai_app@localhost:5432/brightai_dev';

const SERVICE_URL =
  process.env.DATABASE_URL_SERVICE ??
  'postgresql://brightai_service:brightai_service@localhost:5432/brightai_dev';

/** Run psql with given URL, return { stdout, stderr, exitCode }. */
function runPsql(url, sql, description) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      'psql',
      [url, '-v', 'ON_ERROR_STOP=1', '-X', '-q', '-c', sql],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    );
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (b) => (stdout += b.toString()));
    child.stderr.on('data', (b) => (stderr += b.toString()));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`  ✓ ${description}`);
        resolve({ stdout, stderr });
      } else {
        reject(
          new Error(
            `${description} failed (exit ${code}):\n${stderr || stdout}`,
          ),
        );
      }
    });
  });
}

/** Sleep helper. */
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Wait until psql can connect, max 30 attempts. */
async function waitForPostgres() {
  const MAX = 30;
  for (let i = 1; i <= MAX; i++) {
    try {
      await runPsql(DATABASE_URL, 'SELECT 1;', 'ping');
      return;
    } catch (err) {
      if (i === MAX) throw err;
      process.stdout.write(`\r  ⏳ waiting for postgres (${i}/${MAX})…`);
      await sleep(1000);
    }
  }
}

/** Verify a role can connect. */
async function verifyRole(url, role) {
  try {
    await runPsql(url, 'SELECT current_user, session_user;', `${role} can connect`);
  } catch (err) {
    throw new Error(`${role} role check failed. Did docker compose up -d finish?`);
  }
}

async function main() {
  console.log('🔧 BrightAI local database setup\n');

  console.log('[1/4] Waiting for postgres to be ready…');
  await waitForPostgres();
  console.log('  ✓ postgres is up');

  console.log('\n[2/4] Applying RLS policies (rls.sql)…');
  const rls = readFileSync(RLS_PATH, 'utf8');
  // psql -f reads from file
  await new Promise((resolve, reject) => {
    const child = spawn('psql', [DATABASE_URL, '-v', 'ON_ERROR_STOP=1', '-X', '-q', '-f', RLS_PATH], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stderr = '';
    child.stderr.on('data', (b) => (stderr += b.toString()));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        console.log('  ✓ rls.sql applied');
        resolve();
      } else {
        reject(new Error(`rls.sql failed (exit ${code}):\n${stderr}`));
      }
    });
  });

  console.log('\n[3/4] Verifying roles can connect…');
  await verifyRole(APP_URL, 'brightai_app');
  await verifyRole(SERVICE_URL, 'brightai_service');

  console.log('\n[4/4] Done. Next steps:');
  console.log('   pnpm --filter @brightai/db db:generate');
  console.log('   pnpm --filter @brightai/db db:migrate:dev');
  console.log('   pnpm --filter @brightai/db db:seed');
}

main().catch((err) => {
  console.error('\n❌ setup-local-db.mjs failed:');
  console.error(err.message);
  process.exit(1);
});
