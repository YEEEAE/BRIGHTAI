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

// Shared primitives must consume the semantic token layer. Leaf-route migration
// is intentionally incremental and is not bulk-enforced here.
for (const rel of [
  'src/components/ui/AppButton.astro',
  'src/components/ui/Banner.astro',
  'src/components/ui/PageHeader.astro',
  'src/components/ui/Pagination.astro',
  'src/components/ui/StatusPill.astro',
  'src/components/ui/formPresets.ts',
]) {
  const src = read(rel);
  ok(
    /(?:bg|text|border|ring|outline)-(?:surface|content|accent|focus|success|warning|danger|info)/.test(src) ||
      src.includes('type-page-') ||
      src.includes('statusTones'),
    `semantic tokens used by shared primitive: ${rel}`,
  );
  ok(!src.includes('focus:ring-'), `canonical focus contract: ${rel}`);
}
ok(read('src/styles/global.css').includes('--color-text-primary'), 'semantic token source exists');

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

// Detail routes must preserve orientation as well as their existing
// task-specific back links. Breadcrumbs are server-rendered and do not alter
// authorization or URL semantics.
for (const rel of ['src/pages/tasks/[id].astro', 'src/pages/findings/[id].astro']) {
  ok(read(rel).includes('components/Breadcrumbs.astro'), `breadcrumbs used on detail route: ${rel}`);
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

// 6. PageHeader adoption on lab screens (converted 2026-08-28, task 011).
const LAB_HEADERED = [
  'src/pages/lab/index.astro',
  'src/pages/lab/search.astro',
  'src/pages/lab/audit.astro',
  'src/pages/lab/calendar.astro',
  'src/pages/lab/reports.astro',
  'src/pages/lab/data-quality.astro',
  'src/pages/lab/saved-views/index.astro',
  'src/pages/lab/notifications.astro',
  'src/pages/lab/tests/index.astro',
  'src/pages/lab/tests/new.astro',
  'src/pages/lab/tests/review.astro',
  'src/pages/lab/tests/[id].astro',
  'src/pages/lab/retests/index.astro',
  'src/pages/lab/retests/new.astro',
  'src/pages/lab/products/index.astro',
  'src/pages/lab/products/new.astro',
  'src/pages/lab/templates/index.astro',
  'src/pages/lab/templates/new.astro',
  'src/pages/lab/equipment/index.astro',
  'src/pages/lab/equipment/new.astro',
  'src/pages/lab/calibration/index.astro',
  'src/pages/lab/calibration/new.astro',
  'src/pages/lab/documents/index.astro',
  'src/pages/lab/documents/new.astro',
  'src/pages/lab/documents/[id]/versions.astro',
  'src/pages/lab/documents/[id]/edit.astro',
  'src/pages/lab/acknowledgements/index.astro',
  'src/pages/lab/acknowledgements/assign.astro',
  'src/pages/lab/change-requests/index.astro',
  'src/pages/lab/change-requests/new.astro',
  'src/pages/lab/change-requests/[id].astro',
];
for (const rel of LAB_HEADERED) {
  ok(read(rel).includes('ui/PageHeader.astro'), `PageHeader used: ${rel}`);
}
// Legacy large page-title scale is gone from src/pages (h1s are text-2xl).
// Documented exception: the 403/404 fallback h1 branches inside detail pages
// (tasks/[id], findings/[id]) keep the larger error scale by design.
const H1_SCALE_EXEMPT = ['src/pages/tasks/[id].astro', 'src/pages/findings/[id].astro'];
for (const file of astroPages) {
  if (H1_SCALE_EXEMPT.some((rel) => file.endsWith(rel.replace(/\[id\]/, '[id]')))) continue;
  const src = readFileSync(file, 'utf8');
  if (/<h1[^>]*text-3xl/.test(src)) {
    failures.push(`page-title scale: legacy text-3xl h1 in ${file.replace(APP_DIR, '')}`);
  }
}
ok(true, 'h1 scale scan ran');

// 7. One banner: the exact hand-rolled alert recipe does not come back.
for (const file of astroPages) {
  const src = readFileSync(file, 'utf8');
  if (/class="rounded-lg border border-(red|amber|sky|emerald)-200 bg-(?:red|amber|sky|emerald)-50 px-4 py-3 text-sm text-(?:red|amber|sky|emerald)-700"/.test(src)) {
    failures.push(`banner primitive: hand-rolled alert div in ${file.replace(APP_DIR, '')}`);
  }
}
ok(true, 'banner scan ran');

// 8. Notifications: one presentation module + one card for both screens.
{
  const general = read('src/pages/notifications.astro');
  const lab = read('src/pages/lab/notifications.astro');
  for (const [label, src] of [['notifications', general], ['lab/notifications', lab]]) {
    ok(src.includes('ui/notificationPresentation'), `${label}: shared presentation maps`);
    ok(src.includes('NotificationCard.astro'), `${label}: shared card component`);
    ok(!src.includes('const KIND_ICON'), `${label}: no local KIND_ICON map`);
    ok(!src.includes('const SEVERITY_CARD'), `${label}: no local SEVERITY_CARD map`);
  }
  ok(
    read('src/components/NotificationCard.astro').includes('NOTIFICATION_SEVERITY_CARD'),
    'NotificationCard uses the shared severity map',
  );
}

// 9. Filter toolbars use the shared form presets (no third recipe).
const FILTER_PAGES = [
  'src/pages/lab/tests/index.astro',
  'src/pages/lab/tests/review.astro',
  'src/pages/lab/products/index.astro',
  'src/pages/lab/calibration/index.astro',
  'src/pages/lab/retests/index.astro',
  'src/pages/lab/documents/index.astro',
  'src/pages/lab/templates/index.astro',
  'src/pages/lab/equipment/index.astro',
  'src/pages/lab/acknowledgements/index.astro',
  'src/pages/lab/search.astro',
];
const FILTER_CONTROL =
  'mt-0.5 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';
for (const rel of FILTER_PAGES) {
  const src = read(rel);
  if (src.includes('<form method="get"')) {
    ok(src.includes('formPresets'), `form presets used: ${rel}`);
  }
}
for (const file of astroPages) {
  if (readFileSync(file, 'utf8').includes(`class="${FILTER_CONTROL}"`)) {
    failures.push(`form presets: literal control recipe in ${file.replace(APP_DIR, '')}`);
  }
}
ok(true, 'filter preset scan ran');

// 10. Lab badge class maps live in one module — no per-page re-declarations.
const BADGE_PAGES = [
  'src/pages/lab/calibration/index.astro',
  'src/pages/lab/calibration/[id].astro',
  'src/pages/lab/equipment/[id].astro',
  'src/pages/lab/acknowledgements/index.astro',
  'src/pages/lab/acknowledgements/assign.astro',
  'src/pages/lab/documents/index.astro',
  'src/pages/lab/documents/[id].astro',
  'src/pages/lab/documents/[id]/versions.astro',
  'src/pages/lab/templates/index.astro',
  'src/pages/lab/templates/[id].astro',
  'src/pages/lab/tests/[id].astro',
  'src/pages/lab/tests/review.astro',
];
for (const rel of BADGE_PAGES) {
  ok(read(rel).includes('labBadgeClasses'), `shared badge maps: ${rel}`);
  ok(
    !/const (STATUS_BADGE_CLS|CAL_STATUS_BADGE_CLS|ACK_BADGE_CLS|TYPE_BADGE_CLS|STATUS_STYLES|statusTone|resultTone)[:=]/.test(read(rel)),
    `no local badge map re-declaration: ${rel}`,
  );
}

// 11. LabActionButton delegates to AppButton (one button implementation).
{
  const src = read('src/components/lab/LabActionButton.astro');
  ok(src.includes("from '../ui/AppButton.astro'"), 'LabActionButton delegates to AppButton');
  ok(!src.includes('inline-flex'), 'LabActionButton owns no styling of its own');
}

// 12. Table cell padding: the px-4 py-3 header recipe is gone.
for (const file of astroPages) {
  const src = readFileSync(file, 'utf8');
  if (/<th [^>]*class="[^"]*px-4 py-3/.test(src) || /<th class="px-4 py-3">/.test(src)) {
    failures.push(`table padding: th px-4 py-3 in ${file.replace(APP_DIR, '')}`);
  }
}
ok(true, 'table padding scan ran');

// 13. No dead nav links: every implemented lab route maps to a real page file.
{
  const navSrc = read('src/lib/lab/navigation.ts');
  const implBlock = navSrc.slice(
    navSrc.indexOf('export const IMPLEMENTED_LAB_ROUTES'),
    navSrc.indexOf('];', navSrc.indexOf('export const IMPLEMENTED_LAB_ROUTES')),
  );
  const routes = [...implBlock.matchAll(/'(\/lab[^']*)'/g)].map((m) => m[1]);
  ok(routes.length > 30, `lab navigation: implemented routes parsed (${routes.length})`);
  for (const route of routes) {
    const candidates = [`src/pages${route}.astro`, `src/pages${route}/index.astro`];
    const exists = candidates.some((rel) => {
      try {
        readFileSync(join(APP_DIR, rel));
        return true;
      } catch {
        return false;
      }
    });
    ok(exists, `lab nav route exists on disk: ${route}`);
  }
}

// Report
console.log(`\ntest:ui-consistency — ${checks - failures.length}/${checks} checks passed`);
if (failures.length > 0) {
  console.error('\nFailures:');
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
