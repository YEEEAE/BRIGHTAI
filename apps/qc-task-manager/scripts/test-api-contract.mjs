// API response-contract guard (QC-100-ARCHITECTURE-002).
// Source-level, deterministic, dependency-free. One error/success dialect for
// every JSON API endpoint:
//   success → apiJson(body)                → { ok: true, ...payload } + no-store
//   error   → apiJsonError(msg, status, code) → { ok: false, error, code } + no-store
//
// Rules enforced here:
//   1. No endpoint declares a local `json()` helper — everyone uses the shared
//      helpers from src/lib/api-security.ts (one caching + content-type policy).
//   2. No endpoint hand-builds `{ ok: false, ... }` or `{ ok: true, ... }`
//      literals with new Response(JSON.stringify(...)) — that is how error
//      payloads without a stable `code` and without no-store crept back in.
//   3. No endpoint returns raw plain-text bodies (`new Response('...')`) for
//      errors — HTML form posts previously surfaced raw exception text
//      (SQLite details included) directly in the browser.
//   4. Exception handlers in JSON endpoints must not map unknown failures to
//      400 VALIDATION — server faults are 5xx (DB/REPORT codes). A typed
//      DomainRuleError (a QC policy rejection with user-facing rule text) is
//      the one exception: it is an expected rejection, so 400 is correct.
//
// Documented exceptions (allowlist):
//   - api/health.ts, api/readiness.ts: public probe contracts with their own
//     body shapes (readiness returns { ok, status:'unready', reason }).
//   - api/ux/events.ts: success is 204 No Content (no body by design); errors
//     already use apiJsonError.
//   - api/reports/[reportType].[format].ts and api/export/**: binary
//     attachment responses (CSV/XLSX/PDF); errors already use apiJsonError.
//   - Flash+redirect form endpoints (e.g. api/filters.ts, api/lab/saved-views.ts,
//     api/lab/tests/[id]/review.ts): redirect contracts, no JSON body at all.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_DIR = fileURLToPath(new URL('..', import.meta.url));
const API_DIR = join(APP_DIR, 'src', 'pages', 'api');

let checks = 0;
const failures = [];
function ok(cond, label) {
  checks += 1;
  if (!cond) failures.push(label);
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (entry.name.endsWith('.ts')) out.push(p);
  }
  return out;
}

// Binary/attachment endpoints: their success path is a file stream, not JSON.
const BINARY_PATTERNS = [/reports\/\[reportType\]\.\[format\]\.ts$/, /\/export\//];
// Public probes with documented bespoke body shapes.
const PROBE_ALLOWLIST = [/\/api\/health\.ts$/, /\/api\/readiness\.ts$/];

const files = walk(API_DIR);
ok(files.length >= 30, `api endpoint inventory present (found ${files.length})`);

for (const file of files) {
  const rel = file.slice(APP_DIR.length + 1);
  const src = readFileSync(file, 'utf8');
  const isBinary = BINARY_PATTERNS.some((re) => re.test(rel));
  const isProbe = PROBE_ALLOWLIST.some((re) => re.test(rel));

  if (isBinary || isProbe) continue; // documented exceptions — see header

  // Rule 1 — no local json() helpers.
  ok(!/(?:const|function)\s+json\s*[=(]/.test(src), `${rel}: uses shared api helpers, not a local json() helper`);

  // Rule 2 — no hand-built ok:false / ok:true JSON literals.
  ok(!/JSON\.stringify\(\s*\{\s*ok:\s*false/.test(src), `${rel}: errors go through apiJsonError (stable code + no-store)`);
  ok(!/JSON\.stringify\(\s*\{\s*ok:\s*true/.test(src), `${rel}: success bodies go through apiJson (no-store)`);

  // Rule 3 — no plain-text error bodies.
  ok(!/new Response\(\s*['"`]/.test(src), `${rel}: no plain-text response bodies`);

  // Rule 4 — catch handlers do not answer unknown failures with 400.
  // Request-body parsing and schema failures ARE validation (400 is correct),
  // so catch blocks that mention the parse/schema context are exempt.
  const catchBodies = src.match(/catch\s*(\([^)]*\))?\s*\{[\s\S]*?\n\s*\}/g) ?? [];
  for (const body of catchBodies) {
    const validationFlavored = /(request\.json|safeParse|parsed|issues|Invalid|invalid|schema|DomainRuleError)/i.test(body);
    const returns400 = /,\s*400\s*\)/.test(body);
    ok(!returns400 || validationFlavored, `${rel}: catch handler does not map unknown failures to 400`);
  }

  // Every JSON endpoint must opt into the shared helpers at all.
  const usesJson = /apiJsonError|apiJson\(/.test(src);
  const isRedirectOnly = !/JSON\.stringify/.test(src) && /Response\.redirect|context\.redirect/.test(src);
  const has204 = /status:\s*204|new Response\(null/.test(src);
  ok(usesJson || isRedirectOnly || has204, `${rel}: imports the shared api response helpers`);
}

if (failures.length) {
  console.error(`API contract guard FAILED — ${failures.length} of ${checks} checks:`);
  for (const f of failures) console.error('  ✗ ' + f);
  process.exit(1);
}
console.log(`API contract guard passed: ${checks} checks across ${files.length} endpoints.`);
