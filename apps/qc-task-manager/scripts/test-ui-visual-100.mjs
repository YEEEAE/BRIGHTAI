// QC-100-UI-VISUAL-007 — route-level visual coverage guard.
//
// This is intentionally source-based: it proves that every Astro route is
// classified, uses the approved layout shell (or is an explicit redirect), and
// that the shared presentation recipes guarding all route families exist. It
// does not pretend that source inspection replaces browser review.
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_DIR = fileURLToPath(new URL('..', import.meta.url));
const PAGES_DIR = join(APP_DIR, 'src', 'pages');
const GLOBAL_CSS = readFileSync(join(APP_DIR, 'src', 'styles', 'global.css'), 'utf8');
const BASE_LAYOUT = readFileSync(join(APP_DIR, 'src', 'layouts', 'BaseLayout.astro'), 'utf8');
const failures = [];
let checks = 0;

function ok(condition, label) {
  checks += 1;
  if (!condition) failures.push(label);
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

const pages = walk(PAGES_DIR)
  .filter((file) => file.endsWith('.astro'))
  .map((file) => ({ file, route: relative(PAGES_DIR, file).replace(/\.astro$/, '') }))
  .sort((a, b) => a.route.localeCompare(b.route));

const REDIRECT_ONLY = new Set(['admin/index']);
const PRINT_ROUTES = new Set(pages.filter(({ route }) => route.endsWith('/print')).map(({ route }) => route));
const REGISTER_EXEMPLARS = ['search.astro', 'lab/tests/index.astro', 'lab/documents/index.astro'];

function sourceAt(relativePath) {
  return readFileSync(join(PAGES_DIR, relativePath), 'utf8');
}

ok(pages.length >= 75, `route inventory: expected at least 75 Astro pages (found ${pages.length})`);
ok(REDIRECT_ONLY.size === 1, 'redirect-only visual exception is explicit');

for (const { file, route } of pages) {
  const source = readFileSync(file, 'utf8');
  const isRedirect = REDIRECT_ONLY.has(route);
  const isPrint = PRINT_ROUTES.has(route);
  ok(
    isRedirect || source.includes('layouts/BaseLayout.astro') || source.includes('layouts/PrintLayout.astro'),
    `layout coverage: ${route}`,
  );
  ok(
    isRedirect || isPrint || source.includes('<main') || source.includes('<BaseLayout'),
    `visual page classification: ${route}`,
  );
}

for (const recipe of ['qc-page-stack', 'qc-surface-panel', 'qc-table-panel', 'type-metadata']) {
  ok(GLOBAL_CSS.includes(`.${recipe}`), `shared visual recipe exists: ${recipe}`);
}
ok(BASE_LAYOUT.includes('qc-page-content'), 'all standard routes receive the shared page content flow');
ok(BASE_LAYOUT.includes('max-w-7xl'), 'content shell has one enterprise-wide desktop width');
ok(!GLOBAL_CSS.includes('transition-all'), 'global visual layer does not reintroduce generic transition-all');
ok(GLOBAL_CSS.includes('@media (max-width: 40rem)'), 'small-viewport reflow contract exists');
ok(GLOBAL_CSS.includes('.qc-table-panel {\n    min-inline-size: 0;'), 'table panels cannot widen the root viewport at 400% zoom');
ok(GLOBAL_CSS.includes('overflow-wrap: anywhere;'), 'table cell content wraps instead of overlapping at narrow widths');
ok(GLOBAL_CSS.includes("input[type='checkbox'], input[type='radio']"), 'checkable controls expose a 44px coarse-pointer hit area');

for (const route of REGISTER_EXEMPLARS) {
  const source = sourceAt(route);
  ok(source.includes('qc-table-panel'), `register table panel: ${route}`);
  ok(!source.includes('<form method="get"') || source.includes('formPresets'), `register filter recipe: ${route}`);
}

for (const route of ['login.astro', '404.astro']) {
  const source = sourceAt(route);
  ok(source.includes('qc-surface-panel'), `entry surface: ${route}`);
  ok(source.includes('type-page-title'), `entry hierarchy: ${route}`);
}

console.log(`test:ui-visual-100 — ${checks - failures.length}/${checks} checks passed (${pages.length} Astro routes; ${PRINT_ROUTES.size} print routes)`);
if (failures.length) {
  console.error('\nFailures:');
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  process.exit(1);
}
