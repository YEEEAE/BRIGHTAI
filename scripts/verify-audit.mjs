#!/usr/bin/env node
/**
 * scripts/verify-audit.mjs — REPORTS-15 /kernel/audit/ determinism + parity gate.
 *
 * Proves the audit module's hard contract before any commit:
 *
 *   1. DETERMINISM  — building the dataset twice yields byte-identical rows
 *      (same seed, no Math.random, no Date.now, no locale formatting).
 *   2. COUNT MATRIX — total=12,483 · allowed=11,210 · blocked=382 ·
 *      pending=841 · error=50 · approvals=1,554 (= 841 pending + 713
 *      human-approved allowed).
 *   3. TS ↔ JS PARITY — src/data/kernel-audit.ts and the UMD browser mirror
 *      public/js/kernel-audit-data.js produce identical FULL chains
 *      (same genesis 0x00000000, same every row, same final hash).
 *   4. CHAIN VALIDITY — for every row: hash === fnv1a(prev + '|' + canon(row)),
 *      i.e. the chain is cryptographically self-consistent.
 *   5. SOURCE HYGIENE — no Math.random / Date.now / toLocaleString / fetch in
 *      the data generator or the engine (Prompt 19 immutable rule).
 *
 * Usage: node scripts/verify-audit.mjs   (exit 0 = pass)
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const dataMirrorPath = path.join(rootDir, 'public', 'js', 'kernel-audit-data.js');
const tsSourcePath = path.join(rootDir, 'src', 'data', 'kernel-audit.ts');
const enginePath = path.join(rootDir, 'public', 'js', 'audit.js');
const workerPath = path.join(rootDir, 'public', 'js', 'kernel-audit-worker.js');

const failures = [];
function check(name, ok, detail = '') {
  const mark = ok ? '✓' : '✗';
  console.log(`${mark} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures.push(name);
}

// ── load the TS generator + the JS mirror (UMD → ESM shim) ─────────────
const tsMod = await import(pathToFileURL(tsSourcePath).href + '?t=' + Date.now());
const jsSource = fs.readFileSync(dataMirrorPath, 'utf8');
// Evaluate the UMD in a VM with a `module` object so it takes the
// CommonJS branch and assigns to module.exports (the UMD's own branch).
const jsExports = {};
const vmCtx = vm.createContext({ module: { exports: jsExports }, exports: jsExports });
vm.runInContext(jsSource, vmCtx, { filename: 'kernel-audit-data.js' });
const jsMod = vmCtx.module.exports;

function buildRowsFromTs() {
  return tsMod.buildAuditRows();
}
function buildRowsFromJs() {
  return jsMod.buildAuditRows();
}
function pathToFileURL(p) {
  return new URL('file://' + p);
}

// ── 1. determinism ──────────────────────────────────────────────────────
const rowsA = buildRowsFromTs();
const rowsB = buildRowsFromTs();
let deterministic = rowsA.length === rowsB.length;
for (let i = 0; deterministic && i < rowsA.length; i += 1) {
  const a = JSON.stringify(rowsA[i]);
  const b = JSON.stringify(rowsB[i]);
  if (a !== b) {
    deterministic = false;
    console.log(`   first drift at row ${i}: ${a.slice(0, 80)} vs ${b.slice(0, 80)}`);
  }
}
check('التحديدية (determinism): بناءان → صفوف متطابقة', deterministic);

// ── 2. count matrix (TS) ────────────────────────────────────────────────
function counts(rows) {
  const c = { allowed: 0, blocked: 0, pending: 0, error: 0, approvals: 0 };
  const keyOf = (status) =>
    status === 'pending_approval' ? 'pending' : status;
  for (const r of rows) {
    const k = keyOf(r.status);
    c[k] = (c[k] || 0) + 1;
    if (r.status === 'pending_approval' || (r.status === 'allowed' && r.humanApproved)) c.approvals += 1;
  }
  return c;
}
const c = counts(rowsA);
check('الإجمالي = 12,483', rowsA.length === 12483, String(rowsA.length));
check('مسموح = 11,210', c.allowed === 11210, String(c.allowed));
check('محظور = 382', c.blocked === 382, String(c.blocked));
check('بانتظار الموافقة = 841', c.pending === 841, String(c.pending));
check('خطأ = 50', c.error === 50, String(c.error));
check('موافقات = 1,554', c.approvals === 1554, String(c.approvals));

// ── 3. TS ↔ JS parity (full chain) ──────────────────────────────────────
const rowsJs = buildRowsFromJs();
check('JS mirror builds 12,483 rows too', rowsJs.length === rowsA.length, String(rowsJs.length));
let parity = rowsA.length === rowsJs.length;
let firstDiff = -1;
for (let i = 0; parity && i < rowsA.length; i += 1) {
  if (JSON.stringify(rowsA[i]) !== JSON.stringify(rowsJs[i])) {
    parity = false;
    firstDiff = i;
  }
}
check('TS ↔ JS تطابق كامل (كل الصفوف)', parity, firstDiff === -1 ? '' : `أول اختلاف عند row ${firstDiff}`);
check(
  'التطابق: prevHash / hash / traceId / status',
  !parity || (rowsA[rowsA.length - 1].hash === rowsJs[rowsJs.length - 1].hash),
  parity ? `final hash = ${rowsA[rowsA.length - 1].hash}` : '',
);

// ── 4. chain validity ───────────────────────────────────────────────────
const fnv = tsMod.fnv1a;
const canon = tsMod.auditCanonical;
let chainOk = true;
let chainErrorAt = -1;
let chainBrokenAt = -1;
for (let i = 0; i < rowsA.length; i += 1) {
  const r = rowsA[i];
  const expectedPrev = i === 0 ? '0x00000000' : rowsA[i - 1].hash;
  if (r.prevHash !== expectedPrev) {
    chainOk = false;
    chainErrorAt = i;
    break;
  }
  const expected = fnv(expectedPrev + '|' + canon(r));
  if (r.hash !== expected) {
    chainOk = false;
    chainBrokenAt = i;
    break;
  }
}
check('سلسلة الهاش صحيحة من genesis إلى النهاية', chainOk,
  chainOk ? '' : (chainBrokenAt !== -1 ? `كسر عند row ${chainBrokenAt}` : `prevHash mismatch عند row ${chainErrorAt}`));
check('genesis = 0x00000000', rowsA[0].prevHash === '0x00000000', rowsA[0].prevHash);

// ── 5. source hygiene (no Math.random / Date.now / toLocaleString / fetch) ──
// Strips comments (block + line) and string literals before scanning, so
// documentation that *forbids* these patterns doesn't trip the gate.
const hygieneTargets = [dataMirrorPath, tsSourcePath, enginePath, workerPath];
const badPatterns = [
  [/Math\.random/g, 'Math.random'],
  [/Date\.now/g, 'Date.now'],
  [/toLocaleString/g, 'toLocaleString'],
  [/\bfetch\s*\(/g, 'fetch('],
];

function stripCommentsAndStrings(src) {
  // Remove block comments /* ... */ (non-greedy), then line comments // ...
  let out = src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
  // Remove string literals (single/double quotes + template literals without nesting)
  out = out.replace(/'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`/g, '""');
  return out;
}

let hygieneOk = true;
for (const file of hygieneTargets) {
  const src = stripCommentsAndStrings(fs.readFileSync(file, 'utf8'));
  for (const [re, label] of badPatterns) {
    const matches = src.match(re);
    if (matches && matches.length) {
      hygieneOk = false;
      console.log(`   ✗ ${path.basename(file)}: ${label} × ${matches.length}`);
    }
  }
}
check('نظافة المصدر (لا Math.random / Date.now / toLocaleString / fetch)', hygieneOk);

// ── report ──────────────────────────────────────────────────────────────
if (failures.length) {
  console.error(`\n❌ فشل التحقق: ${failures.length} بند/بنود\n  - ${failures.join('\n  - ')}`);
  process.exit(1);
}
console.log('\n✅ verify-audit: كل البنود ناجحة — contract ثابت.');
process.exit(0);
