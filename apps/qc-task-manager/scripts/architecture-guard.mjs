// Static architecture contract for QC Task Manager.
// It is intentionally dependency-free and never executes application code.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_DIR = resolve(fileURLToPath(new URL('..', import.meta.url)));
const SRC_DIR = join(APP_DIR, 'src');
const SCHEMA_FILE = join(APP_DIR, 'db', 'schema.sql');

const failures = [];
const rel = (file) => relative(APP_DIR, file).replaceAll('\\', '/');

function fail(category, file, line, message) {
  failures.push(`${category} ${rel(file)}:${line} ${message}`);
}

function filesUnder(dir, predicate = () => true) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...filesUnder(file, predicate));
    else if (predicate(file)) out.push(file);
  }
  return out;
}

function sourceFiles() {
  return filesUnder(SRC_DIR, (file) => /\.(ts|tsx|astro)$/.test(file));
}

function linesOf(file) {
  return readFileSync(file, 'utf8').split(/\r?\n/);
}

function canonical(path) {
  return new Set([
    join(SRC_DIR, 'lib', 'task-policy.ts'),
    join(SRC_DIR, 'lib', 'permissions.ts'),
    join(SRC_DIR, 'lib', 'validation.ts'),
    join(SRC_DIR, 'lib', 'sla', 'index.ts'),
    join(SRC_DIR, 'lib', 'workflows', 'index.ts'),
    join(SRC_DIR, 'lib', 'activity.ts'),
  ]).has(path);
}

function checkRequiredFiles() {
  const required = [
    'src/lib/task-policy.ts',
    'src/lib/permissions.ts',
    'src/lib/validation.ts',
    'src/lib/sla/index.ts',
    'src/lib/workflows/index.ts',
    'src/lib/audit/index.ts',
    'src/lib/ai/index.ts',
    'src/lib/findings/index.ts',
    'src/lib/capa/index.ts',
    'src/lib/evidence/index.ts',
    'src/lib/templates/index.ts',
  ];
  for (const path of required) {
    const file = join(APP_DIR, path);
    try {
      statSync(file);
    } catch {
      fail('MISSING_CANONICAL', file, 1, 'required canonical module is missing');
    }
  }
}

function checkDuplicateAuthority() {
  const definitions = [
    ['ROLE_RANK', /\b(?:const|let|var)\s+ROLE_RANK\b/],
    ['EMPLOYEE_EDITABLE_FIELDS', /\b(?:const|let|var)\s+EMPLOYEE_EDITABLE_FIELDS\b/],
    ['EMPLOYEE_LOCKED_FIELDS', /\b(?:const|let|var)\s+EMPLOYEE_LOCKED_FIELDS\b/],
    ['canTransitionStatus', /\b(?:export\s+)?function\s+canTransitionStatus\b/],
    ['isTaskReadOnly', /\b(?:export\s+)?function\s+isTaskReadOnly\b/],
    ['isOverdue', /\b(?:export\s+)?function\s+isOverdue\b/],
    // QC Laboratory RBAC: every can*Lab* predicate is owned by the canonical
    // permissions module (PROMPT 03 contract — no second permission system).
    ['can*Lab* predicate', /\b(?:export\s+)?function\s+can\w*Lab\w*\b/],
  ];
  const allowed = new Set([
    join(SRC_DIR, 'lib', 'task-policy.ts'),
    join(SRC_DIR, 'lib', 'permissions.ts'),
    join(SRC_DIR, 'lib', 'sla', 'index.ts'),
    join(SRC_DIR, 'lib', 'workflows', 'index.ts'),
  ]);
  for (const file of sourceFiles()) {
    if (allowed.has(file)) continue;
    for (const [name, pattern] of definitions) {
      linesOf(file).forEach((line, index) => {
        if (pattern.test(line)) fail('DUPLICATE_AUTHORITY', file, index + 1, `${name} must be owned by its canonical module`);
      });
    }
  }
}

function checkLayerBoundaries() {
  const components = filesUnder(join(SRC_DIR, 'components'), (file) => /\.(ts|tsx|astro)$/.test(file));
  for (const file of components) {
    linesOf(file).forEach((line, index) => {
      if (/from ['"].*\/lib\/(db|auth|taskUpdates|deleteRequests|users)['"]/.test(line)) {
        fail('UI_AUTHORITY', file, index + 1, 'UI components must call server endpoints, not DB/auth/mutation modules');
      }
      if (/from ['"].*\/lib\/permissions['"]/.test(line)) {
        fail('UI_AUTHORITY', file, index + 1, 'UI components must not own authorization decisions');
      }
    });
  }

  const aiDir = join(SRC_DIR, 'lib', 'ai');
  for (const file of filesUnder(aiDir, (candidate) => /\.(ts|tsx)$/.test(candidate))) {
    linesOf(file).forEach((line, index) => {
      if (/from ['"].*\/(db|permissions|taskUpdates|workflows|audit)['"]/.test(line)) {
        fail('AI_AUTHORITY', file, index + 1, 'AI modules are suggestion-only and cannot import authority or mutation layers');
      }
    });
  }
}

function checkDatabaseInvariants() {
  const schema = readFileSync(SCHEMA_FILE, 'utf8');
  const checks = [
    [/role\s+TEXT[\s\S]*CHECK\s*\(\s*role\s+IN\s*\(/i, 'user role CHECK constraint'],
    [/status\s+TEXT[\s\S]*CHECK\s*\(\s*status\s+IN\s*\(/i, 'task status CHECK constraint'],
    [/created_by\s+INTEGER\s+NOT NULL\s+REFERENCES\s+users\(id\)/i, 'task creator foreign key'],
    [/task_id\s+INTEGER\s+NOT NULL\s+REFERENCES\s+tasks\(id\)/i, 'task child foreign key'],
  ];
  for (const [pattern, label] of checks) {
    if (!pattern.test(schema)) fail('DB_INVARIANT', SCHEMA_FILE, 1, `missing ${label}`);
  }
}

function checkMutationPolicyImports() {
  const apiDir = join(SRC_DIR, 'pages', 'api');
  for (const file of filesUnder(apiDir, (candidate) => candidate.endsWith('.ts'))) {
    const text = readFileSync(file, 'utf8');
    if (!/export\s+async\s+function\s+(POST|PUT|PATCH|DELETE)\b/.test(text)) continue;
    const hasServerGuard = /requireApiUser|requireUser|api-security|taskUpdates|permissions|validation|deleteRequests|users|backup|notifications/.test(text);
    if (!hasServerGuard) fail('API_AUTHORITY', file, 1, 'mutation API must import a server-side guard/policy/mutation service');
  }
}

// ─────────────── QC-100-ARCHITECTURE-002 boundary rules ───────────────

/** The employee row-scope rule is SQL owned by src/lib/scope.ts alone. */
function checkRowScopeOwnership() {
  const scopeFile = join(SRC_DIR, 'lib', 'scope.ts');
  const pattern = /\((?:t\.)?(?:assigned_to|tested_by)\s*=\s*\?\s*OR\s*(?:t\.)?created_by\s*=\s*\?\)/i;
  for (const file of sourceFiles()) {
    if (file === scopeFile) continue;
    linesOf(file).forEach((line, index) => {
      if (pattern.test(line)) {
        fail('SCOPE_AUTHORITY', file, index + 1, 'employee row-scope SQL belongs to src/lib/scope.ts (import TASK_ROW_SCOPE_SQL / LAB_TEST_ROW_SCOPE_SQL)');
      }
    });
  }
}

/** Pages and layouts render data; they never open the database themselves. */
function checkNoDatabaseInPages() {
  const pagesDir = join(SRC_DIR, 'pages');
  const layoutsDir = join(SRC_DIR, 'layouts');
  const files = [
    ...filesUnder(pagesDir, (file) => file.endsWith('.astro')),
    ...filesUnder(layoutsDir, (file) => file.endsWith('.astro')),
  ];
  for (const file of files) {
    linesOf(file).forEach((line, index) => {
      // Pure helpers/constants from lib/db (toBool, BACKUP_DIR, DB_PATH) are
      // fine; opening a connection or preparing a statement is not.
      const importsConnection = /from ['"].*\/lib\/db['"]/.test(line) && /\b(getDb|transaction|query|db)\b\s*[,}]/.test(line);
      if (/\bgetDb\s*\(/.test(line) || /\.prepare\s*\(/.test(line) || importsConnection) {
        fail('PAGE_DB_ACCESS', file, index + 1, 'pages/layouts must read through a src/lib service, not the SQLite connection');
      }
    });
  }
}

/**
 * One JSON response contract for every API endpoint: the shared apiJson /
 * apiJsonError builders (they own the content type + no-store policy).
 * Local `json()` helpers and hand-built ok:true/false literals are how the
 * contract fragmented before. Public probes keep their documented shapes.
 */
function checkApiResponseContract() {
  const apiDir = join(SRC_DIR, 'pages', 'api');
  const allowlist = new Set([
    join(apiDir, 'health.ts'),
    join(apiDir, 'readiness.ts'),
  ]);
  for (const file of filesUnder(apiDir, (candidate) => candidate.endsWith('.ts'))) {
    if (allowlist.has(file)) continue;
    linesOf(file).forEach((line, index) => {
      if (/(?:const|function)\s+json\s*[=(]/.test(line)) {
        fail('API_CONTRACT', file, index + 1, 'use apiJson/apiJsonError from lib/api-security instead of a local json() helper');
      }
      if (/JSON\.stringify\(\s*\{\s*ok:\s*(?:true|false)/.test(line)) {
        fail('API_CONTRACT', file, index + 1, 'build JSON bodies with apiJson/apiJsonError so every response carries code + no-store');
      }
      if (/new Response\(\s*['"`]/.test(line)) {
        fail('API_CONTRACT', file, index + 1, 'no plain-text response bodies — errors are JSON via apiJsonError');
      }
    });
  }
}

/** Every API route file must be referenced by a page, script, or test. */
function checkNoOrphanApiRoutes() {
  const apiDir = join(SRC_DIR, 'pages', 'api');
  const consumers = [
    ...filesUnder(SRC_DIR, (file) => /\.(ts|tsx|astro)$/.test(file) && !file.startsWith(apiDir)),
    ...filesUnder(join(APP_DIR, 'public'), (file) => file.endsWith('.js')),
    ...filesUnder(join(APP_DIR, 'scripts'), (file) => file.endsWith('.mjs')),
  ];
  const haystack = consumers.map((file) => readFileSync(file, 'utf8')).join('\n');
  for (const file of filesUnder(apiDir, (candidate) => candidate.endsWith('.ts'))) {
    const route = `/api/${relative(apiDir, file).replaceAll('\\', '/').replace(/\.ts$/, '')}`;
    // Callers build these URLs from template literals or string concatenation,
    // so each dynamic segment matches any non-slash run, and an /index route
    // matches its directory with or without the trailing segment.
    const pattern = route
      .replace(/\/index$/, '')
      .split('/')
      .filter(Boolean)
      .map((part) => (/^\[.+\]$/.test(part) ? '[^/\'"`\\s]+' : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
      .join('/');
    if (!new RegExp(`/${pattern}`).test(haystack)) {
      fail('ORPHAN_ROUTE', file, 1, `no page, client script, or test references ${route}`);
    }
  }
}

checkRequiredFiles();
checkDuplicateAuthority();
checkLayerBoundaries();
checkDatabaseInvariants();
checkMutationPolicyImports();
checkRowScopeOwnership();
checkNoDatabaseInPages();
checkApiResponseContract();
checkNoOrphanApiRoutes();

if (failures.length > 0) {
  console.error(`Architecture Guard failed with ${failures.length} violation(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log('Architecture Guard passed: canonical ownership and trust boundaries verified.');
}
