// Source-of-truth route inventory for the Astro pages tree.
//
// File routes and middleware short-circuits are deliberately kept in separate
// collections. A middleware handler is not an Astro file route and must not
// make a missing page/API file look implemented.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_DIR = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PAGES_DIR = join(APP_DIR, 'src', 'pages');
const SOURCE_DIRS = [join(APP_DIR, 'src', 'pages'), join(APP_DIR, 'src', 'components')];
const PAGE_EXTENSIONS = new Set(['.astro', '.ts', '.tsx', '.js', '.jsx']);

export const REQUIRED_API_ROUTES = Object.freeze([
  '/api/reports/:reportType.csv',
  '/api/reports/:reportType.xlsx',
  '/api/reports/:reportType.pdf',
  '/api/reports/audit',
]);

// These are request controllers implemented by src/middleware.ts. They are
// documented here so a route audit can distinguish them from file routes.
export const MIDDLEWARE_ROUTES = Object.freeze([
  { method: 'POST', pattern: '/login', handler: 'handleLoginPost' },
  { method: 'POST', pattern: '/lab/tests/new', handler: 'handleLabTestFormPost' },
  { method: 'POST', pattern: '/lab/products/new', handler: 'handleLabProductCreatePost' },
  { method: 'POST', pattern: '/lab/products/:id/edit', handler: 'handleLabProductEditPost' },
  { method: 'POST', pattern: '/lab/products/:id/archive|restore', handler: 'handleLabProductArchivePost' },
  { method: 'POST', pattern: '/lab/templates/new', handler: 'handleLabTemplateCreatePost' },
  { method: 'POST', pattern: '/lab/templates/:id/edit', handler: 'handleLabTemplateEditPost' },
  { method: 'POST', pattern: '/lab/equipment/new', handler: 'handleLabEquipmentCreatePost' },
  { method: 'POST', pattern: '/lab/equipment/:id/edit', handler: 'handleLabEquipmentEditPost' },
  { method: 'POST', pattern: '/lab/calibration/new', handler: 'handleLabCalibrationCreatePost' },
  { method: 'POST', pattern: '/lab/calibration/:id/edit', handler: 'handleLabCalibrationEditPost' },
  { method: 'POST', pattern: '/lab/retests/new', handler: 'handleLabRetestCreatePost' },
  { method: 'POST', pattern: '/lab/change-requests/new', handler: 'handleLabChangeRequestSubmitPost' },
  { method: 'POST', pattern: '/lab/change-requests/:id/approve|reject', handler: 'handleLabChangeRequestReviewPost' },
  { method: 'POST', pattern: '/lab/tests/:id/links', handler: 'handleLabTestFindingLinkPost' },
  { method: 'POST', pattern: '/lab/tests/:id/links/unlink', handler: 'handleLabTestFindingUnlinkPost' },
  { method: 'POST', pattern: '/lab/tests/:id/void', handler: 'handleLabTestVoidPost' },
  { method: 'POST', pattern: '/lab/tests/:id/edit', handler: 'handleLabTestEditPost' },
  { method: 'POST', pattern: '/lab/documents/new', handler: 'handleLabDocumentCreatePost' },
  { method: 'POST', pattern: '/lab/documents/:id/edit', handler: 'handleLabDocumentEditPost' },
  { method: 'POST', pattern: '/lab/documents/:id', handler: 'handleLabDocumentWorkflowPost' },
  { method: 'POST', pattern: '/lab/acknowledgements/assign', handler: 'handleLabAcknowledgementAssignPost' },
  { method: 'POST', pattern: '/lab/acknowledgements/:id/acknowledge', handler: 'handleLabAcknowledgementPost' },
  { method: 'POST', pattern: '/manager/new|/supervisor/new', handler: 'handleCreateTaskPost' },
  { method: 'POST', pattern: '/employee/new', handler: 'handleCreateTaskPost' },
]);

export const MIDDLEWARE_GUARDS = Object.freeze([
  { pattern: '/dashboard/**', handler: 'dashboard role guard' },
  { pattern: '/admin/**', handler: 'admin role guard' },
  { pattern: '/manager/**', handler: 'manager role guard' },
  { pattern: '/supervisor/**', handler: 'supervisor role guard' },
  { pattern: '/lab/**', handler: 'LAB_VIEW guard' },
  { pattern: '/**', handler: 'session/authentication wall' },
]);

function filesUnder(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...filesUnder(file));
    else if (PAGE_EXTENSIONS.has(file.slice(file.lastIndexOf('.')))) files.push(file);
  }
  return files;
}

export function normalizeFileRoute(file) {
  const relativeFile = relative(PAGES_DIR, file).replaceAll('\\', '/');
  const withoutExtension = relativeFile.replace(/\.(astro|tsx?|jsx?)$/, '');
  const segments = withoutExtension.split('/');
  const last = segments.at(-1);
  if (last === 'index') segments.pop();
  const route = `/${segments.join('/')}`
    .replace(/\[\.\.\.([^\]]+)\]/g, '*$1')
    .replace(/\[([^\]]+)\]/g, ':$1');
  return (route || '/').replace(/\/+/g, '/').replace(/\/$/, '') || '/';
}

function routePatternToRegex(pattern) {
  let source = '';
  for (let index = 0; index < pattern.length;) {
    const marker = pattern[index];
    if (marker === ':' || marker === '*') {
      index += 1;
      while (index < pattern.length && /[A-Za-z0-9_-]/.test(pattern[index])) index += 1;
      source += marker === ':' ? '[^/]+' : '.+';
      continue;
    }
    source += marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    index += 1;
  }
  return new RegExp(`^${source}$`);
}

export function routeSupports(pattern, concretePath) {
  return routePatternToRegex(pattern).test(concretePath);
}

export function buildManifest() {
  const files = filesUnder(PAGES_DIR).sort();
  const fileRoutes = files.map((file) => ({
    route: normalizeFileRoute(file),
    file: relative(APP_DIR, file).replaceAll('\\', '/'),
  }));
  return {
    generatedFrom: 'src/pages',
    fileRoutes,
    middlewareRoutes: MIDDLEWARE_ROUTES,
    middlewareGuards: MIDDLEWARE_GUARDS,
  };
}

function sourceFiles() {
  return SOURCE_DIRS.flatMap(filesUnder).sort();
}

function checkUiReferences(manifest, failures) {
  const filePatterns = manifest.fileRoutes.map(({ route }) => route);
  for (const file of sourceFiles()) {
    const lines = readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, index) => {
      if (!/(?:href|action)\s*=/.test(line) || !line.includes('/api/reports/')) return;
      if (line.includes('/api/reports/audit')) {
        if (!filePatterns.includes('/api/reports/audit')) failures.push(`${relative(APP_DIR, file)}:${index + 1} references missing /api/reports/audit`);
        return;
      }
      if (!manifest.fileRoutes.some(({ route }) => route === '/api/reports/:reportType.:format')) {
        failures.push(`${relative(APP_DIR, file)}:${index + 1} references report downloads without /api/reports/[reportType].[format].ts`);
      }
    });
  }
}

export function validateManifest(manifest = buildManifest()) {
  const failures = [];
  const filePatterns = manifest.fileRoutes.map(({ route }) => route);
  for (const required of REQUIRED_API_ROUTES) {
    if (!filePatterns.some((pattern) => routeSupports(pattern, required.replace(':reportType', 'monthly-qc')))) {
      failures.push(`required route is not backed by a file route: ${required}`);
    }
  }
  checkUiReferences(manifest, failures);
  return failures;
}

function main() {
  const manifest = buildManifest();
  if (process.argv.includes('--check')) {
    const failures = validateManifest(manifest);
    if (failures.length > 0) {
      console.error(`Route manifest check failed with ${failures.length} violation(s):`);
      failures.forEach((failure) => console.error(`- ${failure}`));
      process.exitCode = 1;
      return;
    }
    console.log(`Route manifest check passed: ${manifest.fileRoutes.length} file routes, ${manifest.middlewareRoutes.length} middleware routes, ${manifest.middlewareGuards.length} middleware guards.`);
    return;
  }
  console.log(JSON.stringify(manifest, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) main();
