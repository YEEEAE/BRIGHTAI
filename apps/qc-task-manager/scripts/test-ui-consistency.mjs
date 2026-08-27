// UI consistency guard (docs/UI-DESIGN-SYSTEM.md §7).
// Source-level, deterministic, dependency-free. Fails when a page regresses
// to a pattern the design system replaced:
//   1. English-only UI: no Arabic characters rendered from src/pages.
//   2. One pagination: register pages use the shared Pagination component,
//      no inline `pageNumbers` windowing blocks remain.
//   3. One page header: converted pages use PageHeader (no hand-rolled
//      <header> blocks with inline H1s on those specific screens).
//   4. Workload page carries no second width wrapper (nested width containers
//      used to double-pad the page and exceed the app's max width).
//   5. The lab test register renders workflow status through StatusPill
//      (text + tone from the central map, never color alone).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_DIR = fileURLToPath(new URL('..', import.meta.url));
const PAGES = join(APP_DIR, 'src', 'pages');

let checks = 0;
const failures = [];
function ok(cond, label) {
  checks += 1;
  if (!cond) failures.push(label);
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFiles: false, withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

const astroPages = walk(PAGES).filter((f) => f.endsWith('.astro'));
ok(astroPages.length > 50, `sanity: expected the full page tree (found ${astroPages.length})`);

// 1. Arabic characters anywhere in page sources → the UI is English-only.
const arabic = /[\u0600-\u06FF]/;
for (const file of astroPages) {
  const src = readFileSync(file, 'utf8');
  if (arabic.test(src)) failures.push(`english-only UI: Arabic characters in ${file.replace(APP_DIR, '')}`);
}
ok(true, 'arabic scan ran');

function read(rel) {
  return readFileSync(join(APP_DIR, rel), 'utf8');
}

// 2. Shared pagination everywhere.
const PAGINATED = [
  'src/pages/search.astro',
  'src/pages/lab/search.astro',
  'src/pages/lab/audit.astro',
  'src/pages/lab/tests/index.astro',
  'src/pages/lab/tests/review.astro',
  'src/pages/lab/products/index.astro',
  'src/pages/lab/calibration/index.astro',
  'src/pages/lab/retests/index.astro',
  'src/pages/lab/documents/index.astro',
  'src/pages/lab/templates/index.astro',
  'src/pages/lab/equipment/index.astro',
  'src/pages/lab/acknowledgements/index.astro',
];
for (const rel of PAGINATED) {
  const src = read(rel);
  ok(src.includes('ui/Pagination.astro'), `shared pagination import: ${rel}`);
  ok(!src.includes('const pageNumbers'), `no inline pageNumbers block: ${rel}`);
}
ok(
  read('src/components/ui/Pagination.astro').includes('aria-label={label}'),
  'Pagination component renders a labeled nav landmark',
);

// 3. PageHeader adoption on converted screens.
const HEADERED = [
  'src/pages/manager/index.astro',
  'src/pages/supervisor/index.astro',
  'src/pages/employee/index.astro',
  'src/pages/manager/workload.astro',
  'src/pages/findings/index.astro',
  'src/pages/reports.astro',
];
for (const rel of HEADERED) {
  ok(read(rel).includes('ui/PageHeader.astro'), `PageHeader used: ${rel}`);
}

// 4. Workload page: no second width wrapper, English copy only.
{
  const src = read('src/pages/manager/workload.astro');
  ok(!src.includes('max-w-7xl'), 'workload: no nested max-w-7xl wrapper');
  ok(!arabic.test(src), 'workload: English-only copy');
}

// 5. Lab test register: central StatusPill for workflow status.
{
  const src = read('src/pages/lab/tests/index.astro');
  ok(src.includes('ui/StatusPill.astro'), 'tests register: StatusPill imported');
  ok(!src.includes('const statusTone'), 'tests register: no local statusTone color map');
}

// Report
console.log(`\ntest:ui-consistency — ${checks - failures.length}/${checks} checks passed`);
if (failures.length > 0) {
  console.error('\nFailures:');
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
