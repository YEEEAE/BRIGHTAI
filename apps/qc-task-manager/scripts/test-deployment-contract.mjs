// Deployment-contract tests for the single writable QC instance on Render.
//
// Pins the contract that production documentation (docs/DEPLOYMENT.md) and
// the runtime must agree on:
//   1. exactly one writable instance is accepted; scale-out settings fail
//      before the database is opened (assertSqliteDeploymentContract);
//   2. database path resolution precedence (QC_DATABASE_PATH > QC_DB_PATH >
//      <app>/db/qc_tasks.db);
//   3. backup directory resolution (QC_BACKUP_DIR wins; backups/ sibling of
//      the database is the fallback) and a single source of truth for it —
//      only src/lib/backup.ts may read QC_BACKUP_DIR;
//   4. no secret values in logs or in the public health probe;
//   5. the repository deliberately keeps QC out of the root render.yaml
//      blueprint (manual dashboard service), and DEPLOYMENT.md describes
//      that reality without pre-picking a paid disk size.

import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { assertSqliteDeploymentContract, resolveDatabasePath } from '../src/lib/db.ts';
import { backupDirectoryForDatabase, configuredBackupDirectory } from '../src/lib/backup.ts';

const appRoot = resolve(process.cwd());
let passed = 0;
function ok(label, fn) {
  fn();
  passed += 1;
  console.log(`  ✔ ${label}`);
}

// ─────────────────── 1. Single writable instance contract ───────────────────

console.log('deployment contract: instance count');

ok('empty environment is accepted (one instance)', () => {
  assert.doesNotThrow(() => assertSqliteDeploymentContract({}));
});

ok('explicit single-instance values are accepted', () => {
  assert.doesNotThrow(() =>
    assertSqliteDeploymentContract({
      QC_SQLITE_INSTANCE_COUNT: '1',
      RENDER_NUM_INSTANCES: '1',
      WEB_CONCURRENCY: '1',
      QC_HORIZONTAL_SCALING: 'false',
    }),
  );
});

ok('WEB_CONCURRENCY > 1 is rejected', () => {
  assert.throws(() => assertSqliteDeploymentContract({ WEB_CONCURRENCY: '2' }), /one writable instance.*WEB_CONCURRENCY=2/s);
});

ok('RENDER_NUM_INSTANCES > 1 is rejected', () => {
  assert.throws(() => assertSqliteDeploymentContract({ RENDER_NUM_INSTANCES: '3' }), /one writable instance.*RENDER_NUM_INSTANCES=3/s);
});

ok('QC_SQLITE_INSTANCE_COUNT > 1 is rejected', () => {
  assert.throws(() => assertSqliteDeploymentContract({ QC_SQLITE_INSTANCE_COUNT: '4' }), /one writable instance/s);
});

ok('QC_HORIZONTAL_SCALING=true is rejected', () => {
  assert.throws(() => assertSqliteDeploymentContract({ QC_HORIZONTAL_SCALING: 'true' }), /one writable instance.*QC_HORIZONTAL_SCALING=true/s);
});

// ─────────────────────────── 2. Database path resolution ────────────────────

console.log('deployment contract: database path');

ok('QC_DATABASE_PATH takes precedence', () => {
  assert.equal(resolveDatabasePath({ QC_DATABASE_PATH: '/var/data/qc_tasks.db', QC_DB_PATH: '/legacy/old.db' }), '/var/data/qc_tasks.db');
});

ok('legacy QC_DB_PATH alias is honored when the spec var is unset', () => {
  assert.equal(resolveDatabasePath({ QC_DB_PATH: '/legacy/old.db' }), '/legacy/old.db');
});

ok('default falls back to <app>/db/qc_tasks.db', () => {
  const fallback = resolveDatabasePath({});
  assert.equal(fallback, resolve(appRoot, 'db', 'qc_tasks.db'));
});

// ─────────────────────────── 3. Backup path resolution ──────────────────────

console.log('deployment contract: backup path');

ok('QC_BACKUP_DIR wins over the derived directory', () => {
  const dir = configuredBackupDirectory('/var/data/qc_tasks.db', { QC_BACKUP_DIR: '/var/data/backups' });
  assert.equal(dir, resolve('/var/data/backups'));
});

ok('a relative QC_BACKUP_DIR is resolved to an absolute path', () => {
  const dir = configuredBackupDirectory('/var/data/qc_tasks.db', { QC_BACKUP_DIR: 'backups/out' });
  assert.equal(dir, resolve('backups/out'));
});

ok('a blank QC_BACKUP_DIR falls back to the backups/ sibling of the database', () => {
  for (const blank of ['', '   ']) {
    assert.equal(configuredBackupDirectory('/var/data/qc_tasks.db', { QC_BACKUP_DIR: blank }), backupDirectoryForDatabase('/var/data/qc_tasks.db'));
  }
});

ok('unset QC_BACKUP_DIR falls back to the backups/ sibling of the database', () => {
  assert.equal(configuredBackupDirectory('/var/data/qc_tasks.db', {}), resolve('/var/data/backups'));
  assert.equal(backupDirectoryForDatabase('/var/data/qc_tasks.db'), resolve('/var/data/backups'));
});

ok('QC_BACKUP_DIR is read in exactly one place (src/lib/backup.ts)', () => {
  const offenders = [];
  const visit = (dir) => {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) {
        visit(path);
      } else if (/\.(ts|astro)$/.test(entry)) {
        const source = readFileSync(path, 'utf8');
        if (/(?:process\.env|env)\.QC_BACKUP_DIR/.test(source) && path !== join(appRoot, 'src', 'lib', 'backup.ts')) {
          offenders.push(path);
        }
      }
    }
  };
  visit(join(appRoot, 'src'));
  assert.deepEqual(offenders, []);
});

ok('db runtime, scheduler, and CLI scripts share configuredBackupDirectory', () => {
  for (const rel of [
    'src/lib/db.ts',
    'src/lib/backup-scheduler.ts',
    'scripts/backup-db.mjs',
    'scripts/restore-db.mjs',
    'scripts/init-db.mjs',
  ]) {
    assert.match(readFileSync(join(appRoot, rel), 'utf8'), /configuredBackupDirectory/, `${rel} must use the shared backup-directory resolution`);
  }
  // The admin endpoint consumes the already-resolved BACKUP_DIR constant from
  // lib/db.ts instead of re-resolving — assert that import stays intact.
  assert.match(
    readFileSync(join(appRoot, 'src/pages/api/admin/backup.ts'), 'utf8'),
    /import \{ BACKUP_DIR, DB_PATH \} from '\.\.\/\.\.\/\.\.\/lib\/db';/,
    'admin backup endpoint must use the shared BACKUP_DIR constant',
  );
});

// ──────────────────────────── 4. No secret logging ──────────────────────────

console.log('deployment contract: secret hygiene');

const SECRET_ENV_NAMES = ['ADMIN_DEFAULT_PASSWORD', 'SESSION_SECRET', 'GROQ_API_KEY', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY'];

function collectSourceFiles(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) collectSourceFiles(path, files);
    else if (/\.(ts|astro)$/.test(entry)) files.push(path);
  }
  return files;
}

ok('no console.* statement reads a secret env value', () => {
  const offenders = [];
  for (const file of collectSourceFiles(join(appRoot, 'src'))) {
    const source = readFileSync(file, 'utf8');
    for (const line of source.split('\n')) {
      if (/console\.(log|info|warn|error)\b/.test(line) && SECRET_ENV_NAMES.some((name) => line.includes(`process.env.${name}`))) {
        offenders.push(`${file}: ${line.trim()}`);
      }
    }
  }
  assert.deepEqual(offenders, []);
});

ok('the violating-instance error never embeds unrelated env values', () => {
  try {
    assertSqliteDeploymentContract({ WEB_CONCURRENCY: '2', ADMIN_DEFAULT_PASSWORD: 'super-secret-value' });
    assert.fail('expected contract violation');
  } catch (error) {
    assert.match(error.message, /WEB_CONCURRENCY=2/);
    assert.doesNotMatch(error.message, /super-secret-value/);
  }
});

ok('the public health probe never reads process.env and identifies the QC service', () => {
  const source = readFileSync(join(appRoot, 'src/pages/api/health.ts'), 'utf8');
  assert.doesNotMatch(source, /process\.env/);
  assert.match(source, /qc-task-manager/);
  assert.match(source, /live:\s*true/);
  assert.doesNotMatch(source, /getDb\(/, 'Render liveness must not be blocked by first-boot database state');
});

ok('the separate readiness probe verifies the database without exposing env values', () => {
  const source = readFileSync(join(appRoot, 'src/pages/api/readiness.ts'), 'utf8');
  assert.match(source, /getDb\(/);
  assert.match(source, /schema_migrations/);
  assert.doesNotMatch(source, /process\.env/);
});

// ─────────────────────── 5. Repository deployment topology ──────────────────

console.log('deployment contract: repository topology');

ok('root render.yaml owns only the public site — no QC service block', () => {
  const blueprint = readFileSync(resolve(appRoot, '..', '..', 'render.yaml'), 'utf8');
  assert.doesNotMatch(blueprint, /qc-task-manager/, 'QC is deployed as a separate manual Render service; re-adding it to the blueprint requires a documented decision (see docs/DEPLOYMENT.md)');
});

ok('DEPLOYMENT.md documents the manual QC service and the exact production paths', () => {
  const doc = readFileSync(join(appRoot, 'docs', 'DEPLOYMENT.md'), 'utf8');
  assert.match(doc, /QC_DATABASE_PATH=\/var\/data\/qc_tasks\.db/);
  assert.match(doc, /QC_BACKUP_DIR=\/var\/data\/backups/);
  assert.match(doc, /dist\/server\/entry\.mjs/);
  assert.match(doc, /healthCheckPath: \/api\/health|Health check.*\/api\/health/);
  assert.doesNotMatch(doc, /defines the QC Task Manager as a second/, 'stale claim: the blueprint does not define a QC service');
});

ok('DEPLOYMENT.md does not pre-pick a paid disk size (operator choice)', () => {
  const doc = readFileSync(join(appRoot, 'docs', 'DEPLOYMENT.md'), 'utf8');
  assert.doesNotMatch(doc, /sizeGB/, 'disk size is an operator decision; the repository must not invent one');
});

// ─────────────────────────────────── Report ─────────────────────────────────

console.log(`Deployment contract tests passed: ${passed} checks (instance count, DB path, backup path, secret hygiene, repository topology).`);
