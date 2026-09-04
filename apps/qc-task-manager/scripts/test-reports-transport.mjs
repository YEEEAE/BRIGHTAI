// Canonical contract guard for the reports transport route wiring.
//
// Fails when ANY of these regress:
//   1. .gitignore must not contain an unanchored `reports/` rule — the
//      historical form silently ignored `src/pages/api/reports/` so the
//      canonical HTTP adapter could never be committed while route-manifest
//      (a disk scan) kept passing locally (tracked-source absence ⇎ PASS).
//   2. Every route in REQUIRED_API_ROUTES must be backed by an on-disk file
//      route whose backing file is tracked by Git (same rule the hardened
//      route-manifest --check enforces, asserted here independently).
//   3. The transport adapter must remain the single canonical engine wiring:
//      it reuses the report catalog, filter/scope parsers, shared
//      authorization+scope resolution, streaming readers, the three writers,
//      and the report audit — never a second reporting engine.
//   4. The adapter must uphold the transport security contract: session
//      re-check, server-authoritative scope (no user path construction), and
//      safe download headers for every format.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  REQUIRED_API_ROUTES,
  buildManifest,
  routeSupports,
} from './route-manifest.mjs';

const APP_DIR = resolve(fileURLToPath(new URL('..', import.meta.url)));
const REPO_ROOT = resolve(APP_DIR, '..', '..');
const failures = [];
let checks = 0;

function check(condition, message) {
  checks += 1;
  if (!condition) failures.push(message);
}

function git(args, cwd) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' },
  });
}

// ── 1. .gitignore must not swallow source directories named `reports` ──
const gitignore = readFileSync(join(REPO_ROOT, '.gitignore'), 'utf8');
const rules = gitignore.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith('#'));
for (const rule of rules) {
  check(!/^reports\/$/.test(rule), `.gitignore contains an unanchored "reports/" rule (matches src/pages/api/reports/ — use "/reports/" instead): ${rule}`);
}

// ── 2. Required transport routes are backed by Git-TRACKED file routes ──
const manifest = buildManifest();
const appPrefix = 'apps/qc-task-manager/';
const trackedAppPages = new Set(
  git(['ls-files', '--full-name', '--', `${appPrefix}src/pages`], REPO_ROOT)
    .split('\n')
    .filter(Boolean)
    .map((line) => (line.startsWith(appPrefix) ? line.slice(appPrefix.length) : line)),
);
for (const required of REQUIRED_API_ROUTES) {
  const backing = manifest.fileRoutes.find(({ route }) => routeSupports(route, required.replace(':reportType', 'monthly-qc')));
  check(Boolean(backing), `required transport route is not backed by a file route: ${required}`);
  if (backing) {
    check(trackedAppPages.has(backing.file), `transport route file is not tracked by Git: ${backing.file}`);
  }
}

// ── 3 + 4. The adapter keeps the canonical wiring and security contract ──
const adapterPath = join(APP_DIR, 'src/pages/api/reports/[reportType].[format].ts');
const adapter = readFileSync(adapterPath, 'utf8');
const auditPath = join(APP_DIR, 'src/pages/api/reports/audit.ts');
const auditRoute = readFileSync(auditPath, 'utf8');

// 3. Reuse, not reimplementation.
for (const modulePath of [
  'lib/reporting/catalog',
  'lib/reporting/filters',
  'lib/reporting/preview',
  'lib/reporting/reader',
  'lib/reporting/audit',
  'lib/reporting/writers/pdf',
  'lib/reporting/writers/csv',
  'lib/reporting/writers/xlsx',
]) {
  check(adapter.includes(modulePath), `adapter must reuse the canonical ${modulePath} engine`);
}
check(!/SELECT|INSERT INTO|UPDATE .* FROM/i.test(adapter), 'adapter must not embed a second SQL reporting engine');
check(auditRoute.includes('lib/reporting/authorization') && auditRoute.includes('lib/reporting/reader'), 'audit route must reuse the canonical reporting authorization + reader');

// 4. Security contract.
check(adapter.includes("requireApiUser(context)"), 'adapter must re-check the server session (requireApiUser)');
check(adapter.includes('resolveReportContext'), 'adapter must resolve scope server-authoritatively via resolveReportContext');
check(adapter.includes("REPORT_CATALOG[reportType]"), 'adapter must validate the report type against the catalog');
check(adapter.includes("formats.includes(format)"), 'adapter must validate the download format');
check(adapter.includes('parseReportFilters'), 'adapter must validate filters through parseReportFilters');
check(!/searchParams\.get\(['"]scope['"]\)\s*===|params\.get\(['"]scope['"]\)/.test(adapter), 'adapter must not trust a raw scope parameter (use parseReportScope)');
check(!/params\.\w+|searchParams\.get\(/.test((adapter.match(/mkdtempSync\([\s\S]*?\)/) ?? [''])[0].replace(/join\(|tmpdir\(\)/g, '')), 'adapter must not build file paths from user input (only tmpdir template + catalog type)');
check(adapter.includes("text/csv; charset=utf-8"), 'CSV responses must use the safe text/csv content type');
check(adapter.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'), 'XLSX responses must use the safe spreadsheet content type');
check(adapter.includes("'application/pdf'"), 'PDF responses must use the application/pdf content type');
check((adapter.match(/Content-Disposition/g) ?? []).length === 3, 'all three formats must set an attachment Content-Disposition');
check((adapter.match(/filename="\$\{reportType\}\./g) ?? []).length === 3, 'download filenames must derive only from the validated catalog type');
check((adapter.match(/Cache-Control/g) ?? []).length === 3, 'all three formats must set no-store');
check(adapter.includes('apiJsonError'), 'adapter failures must use the safe JSON error contract (no stack/error leakage)');
check(auditRoute.includes('authorizeReportAudit'), 'audit route must enforce its authorization boundary');

console.log(`Reports transport contract: ${checks - failures.length}/${checks} checks passed.`);
if (failures.length) {
  console.error('Reports transport contract FAILED:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
