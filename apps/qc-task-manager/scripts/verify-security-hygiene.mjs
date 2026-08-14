// Security regression gate for the QC Task Manager. It deliberately scans
// source and the Git index: the application must never regress to unguarded
// API handlers, unsafe SQL, committed database files, or sensitive logging.

import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const repoRoot = fileURLToPath(new URL('../../..', import.meta.url));
const apiRoot = join(root, 'src/pages/api');
const failures = [];

function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)],
  );
}

function check(condition, message) {
  if (!condition) failures.push(message);
}

const middleware = readFileSync(join(root, 'src/middleware.ts'), 'utf8');
check(middleware.includes("Content-Security-Policy"), 'middleware must set Content-Security-Policy');
check(middleware.includes("X-Content-Type-Options"), 'middleware must set X-Content-Type-Options');
check(middleware.includes("Referrer-Policy"), 'middleware must set Referrer-Policy');
check(middleware.includes("X-Frame-Options"), 'middleware must set X-Frame-Options');

// Public, stateless routes are exempt from the session gate by design. The
// readiness probe (/api/health) must be reachable by infrastructure that has
// no cookie — it performs a read-only DB check and no state change.
const PUBLIC_API_ROUTES = new Set(['src/pages/api/health.ts']);

for (const path of files(apiRoot).filter((p) => p.endsWith('.ts'))) {
  const source = readFileSync(path, 'utf8');
  const label = relative(root, path);
  if (!PUBLIC_API_ROUTES.has(label)) {
    check(source.includes('requireApiUser('), `${label} must re-check the server session with requireApiUser`);
  }
  if (source.includes('export const POST')) {
    check(source.includes('requireCsrf('), `${label} must enforce CSRF for POST`);
  }
  if (label.includes('[id]')) check(source.includes('parsePositiveId('), `${label} must validate route id with Zod`);
  if (label.includes('[attachmentId]')) check(source.includes('parsePositiveId('), `${label} must validate attachment id with Zod`);
  check(!/\bquery\s*\(/.test(source), `${label} must not use raw query()`);
}

for (const path of files(join(root, 'src')).filter((p) => /\.(ts|tsx|astro)$/.test(p))) {
  const source = readFileSync(path, 'utf8');
  const label = relative(root, path);
  check(!/console\.(?:log|info|debug)\([^\n]*(?:password|cookie|token|file_data|arrayBuffer)/i.test(source), `${label} may log sensitive data`);
}

const tracked = execFileSync('git', ['ls-files'], { cwd: repoRoot, encoding: 'utf8' }).split('\n');
for (const path of tracked) {
  if (!path) continue;
  check(!/\.(?:db|sqlite|sqlite3)$/i.test(path), `database file is tracked: ${path}`);
  // Templates contain no values and are deliberately committed for deployment
  // documentation; real .env files are never allowed.
  check(!/(^|\/)\.env(?:\.(?!example$)|$)/.test(path), `environment file is tracked: ${path}`);
}

if (failures.length) {
  console.error('Security hygiene failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('Security hygiene passed.');
