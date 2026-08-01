#!/usr/bin/env node
/**
 * scripts/verify-approvals.mjs — M19 /kernel/approvals/ determinism + parity gate.
 *
 * Proves the approvals module's hard contract before any commit:
 *
 *   1. DETERMINISM  — building the dataset twice yields byte-identical rows
 *      (same seed, no Math.random, no Date.now, no locale formatting).
 *   2. COUNT MATRIX — total=162 · pending=7 · critical=3 · review=2 ·
 *      approved=142 · rejected=8.
 *   3. TS ↔ JS PARITY — src/data/kernel-approvals.ts and the UMD browser mirror
 *      public/js/kernel-approvals-data.js produce identical FULL chains
 *      (same genesis 0x00000000, same every row, same final hash 0x90e4c4c8).
 *   4. CHAIN VALIDITY — for every row: hash === fnv1a(prev + '|' + canon(row)),
 *      i.e. the chain is cryptographically self-consistent.
 *   5. SLA WINDOW   — every actionable row (pending/critical/review) has a
 *      bounded SLA deadline inside its status window (critical 4h, other 24h),
 *      and approved/rejected rows have no SLA (slaDeadline === null).
 *   6. SOURCE HYGIENE — no Math.random / Date.now / toLocaleString / fetch in
 *      the data generator, the engine, or the worker (Prompt 19 immutable rule).
 *
 * Usage: node scripts/verify-approvals.mjs   (exit 0 = pass)
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const dataMirrorPath = path.join(rootDir, 'public', 'js', 'kernel-approvals-data.js');
const tsSourcePath = path.join(rootDir, 'src', 'data', 'kernel-approvals.ts');
const enginePath = path.join(rootDir, 'public', 'js', 'kernel-approvals.js');
const workerPath = path.join(rootDir, 'public', 'js', 'kernel-approvals-worker.js');

const failures = [];
function check(name, ok, detail = '') {
  const mark = ok ? '✓' : '✗';
  console.log(`${mark} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures.push(name);
}

// ── load the TS generator + the JS mirror (UMD → ESM shim) ─────────────
function pathToFileURL(p) {
  return new URL('file://' + p);
}
const tsMod = await import(pathToFileURL(tsSourcePath).href + '?t=' + Date.now());
const jsSource = fs.readFileSync(dataMirrorPath, 'utf8');
// Evaluate the UMD in a VM with a `module` object so it takes the
// CommonJS branch and assigns to module.exports (the UMD's own branch).
const jsExports = {};
const vmCtx = vm.createContext({ module: { exports: jsExports }, exports: jsExports });
vm.runInContext(jsSource, vmCtx, { filename: 'kernel-approvals-data.js' });
const jsMod = vmCtx.module.exports;

function buildRowsFromTs() {
  return tsMod.buildApprovalRows();
}
function buildRowsFromJs() {
  return jsMod.buildApprovalRows();
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
  const c = { pending: 0, critical: 0, review: 0, approved: 0, rejected: 0 };
  for (const r of rows) {
    c[r.status] = (c[r.status] || 0) + 1;
  }
  return c;
}
const c = counts(rowsA);
check('الإجمالي = 162', rowsA.length === 162, String(rowsA.length));
check('معلقة = 7', c.pending === 7, String(c.pending));
check('حرجة = 3', c.critical === 3, String(c.critical));
check('قيد المراجعة = 2', c.review === 2, String(c.review));
check('موافقة = 142', c.approved === 142, String(c.approved));
check('رفض = 8', c.rejected === 8, String(c.rejected));

// ── 3. TS ↔ JS parity (full chain) ──────────────────────────────────────
const rowsJs = buildRowsFromJs();
check('JS mirror builds 162 rows too', rowsJs.length === rowsA.length, String(rowsJs.length));
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
const canon = tsMod.approvalCanonical;
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
check('final hash = 0x90e4c4c8', rowsA[rowsA.length - 1].hash === '0x90e4c4c8', rowsA[rowsA.length - 1].hash);

// ── 5. SLA window sanity ────────────────────────────────────────────────
const NOW = tsMod.APPROVAL_NOW; // fixed "now" anchor (2026-07-31T12:00Z)
const H = 3600000;
let slaOk = true;
let slaDetail = '';
for (let i = 0; i < rowsA.length; i += 1) {
  const r = rowsA[i];
  const actionable = r.status === 'pending' || r.status === 'critical' || r.status === 'review';
  if (actionable) {
    const windowH = r.status === 'critical' ? 4 : 24;
    const deadline = r.slaDeadline;
    if (typeof deadline !== 'number' || !(deadline > r.ts && deadline <= NOW + windowH * H)) {
      slaOk = false;
      slaDetail = `row ${i} (${r.status}) deadline=${deadline}`;
      break;
    }
  } else if (r.slaDeadline !== null || r.slaHours !== null) {
    slaOk = false;
    slaDetail = `row ${i} (${r.status}) should have no SLA`;
    break;
  }
}
check('نافذة SLA منطقية (حرجة ≤ 4س، غيرها ≤ 24س، المعتمدة/المرفوضة بلا مهلة)', slaOk, slaDetail);

// ── 6. source hygiene (no Math.random / Date.now / toLocaleString / fetch) ──
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
console.log('\n✅ verify-approvals: كل البنود ناجحة — contract ثابت.');
process.exit(0);
