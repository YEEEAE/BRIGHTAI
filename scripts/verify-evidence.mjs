/**
 * verify-evidence.mjs — Deterministic contract gate for /kernel/evidence/.
 *
 * Mirrors scripts/verify-approvals.mjs (canonical pattern) with one adaptation:
 * evidence has no SLA-window concept, so the SLA group is dropped and hygiene
 * is renumbered to section 5.
 *
 * Contract verified (5 groups):
 *   1. Determinism  — building twice yields byte-identical rows.
 *   2. Count matrix — total=12, allowed=6, blocked=2, pending_approval=2,
 *                     approved=1, draft=1.
 *   3. TS ↔ JS parity — the TS generator and the JS UMD mirror produce
 *                       identical rows and an identical final hash.
 *   4. Chain validity — every hash = fnv1a(prevHash + '|' + canonical(row)),
 *                       genesis = '0x00000000', final hash pinned.
 *   5. Source hygiene — no Math.random / Date.now / toLocaleString / fetch(
 *                       in the data mirror, TS source, or engine.
 *
 * Run: `npm run verify:evidence`
 *   (= node --import ./scripts/test-ts-loader.mjs --experimental-strip-types
 *      scripts/verify-evidence.mjs)
 *
 * Exit: 0 on full pass, 1 on any failure.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const dataMirrorPath = path.join(rootDir, 'public', 'js', 'kernel-evidence-data.js');
const tsSourcePath = path.join(rootDir, 'src', 'data', 'kernel-evidence.ts');
const enginePath = path.join(rootDir, 'public', 'js', 'kernel-evidence.js');

const failures = [];
function check(name, ok, detail = '') {
  const mark = ok ? '✓' : '✗';
  console.log(`${mark} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures.push(name);
}

// ── Load TS source (via the registered TS loader + strip-types flag) ─────
const tsMod = await import(pathToFileURL(tsSourcePath).href + '?t=' + Date.now());

// ── Load JS UMD mirror in a VM (synthesizes the CommonJS branch) ─────────
const jsSource = fs.readFileSync(dataMirrorPath, 'utf8');
const jsExports = {};
const vmCtx = vm.createContext({ module: { exports: jsExports }, exports: jsExports });
vm.runInContext(jsSource, vmCtx, { filename: 'kernel-evidence-data.js' });
const jsMod = vmCtx.module.exports;

function buildRowsFromTs() { return tsMod.buildEvidenceRows(); }
function buildRowsFromJs() { return jsMod.buildEvidenceRows(); }

// ── 1) Determinism ──────────────────────────────────────────────────────
{
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
}

// ── 2) Count matrix ─────────────────────────────────────────────────────
{
  const rows = buildRowsFromTs();
  function counts(r) {
    const c = { allowed: 0, blocked: 0, pending_approval: 0, approved: 0, draft: 0 };
    for (const row of r) c[row.status] = (c[row.status] || 0) + 1;
    return c;
  }
  const c = counts(rows);
  check('الإجمالي = 12', rows.length === 12, String(rows.length));
  check('مسموح = 6 (allowed)', c.allowed === 6, String(c.allowed));
  check('محظور = 2 (blocked)', c.blocked === 2, String(c.blocked));
  check('بانتظار موافقة = 2 (pending_approval)', c.pending_approval === 2, String(c.pending_approval));
  check('معتمد = 1 (approved)', c.approved === 1, String(c.approved));
  check('مسودة = 1 (draft)', c.draft === 1, String(c.draft));
}

// ── 3) TS ↔ JS parity ───────────────────────────────────────────────────
{
  const rowsA = buildRowsFromTs();
  const rowsJs = buildRowsFromJs();
  check('JS mirror builds 12 rows too', rowsJs.length === rowsA.length, String(rowsJs.length));
  let parity = rowsA.length === rowsJs.length;
  let firstDiff = -1;
  for (let i = 0; parity && i < rowsA.length; i += 1) {
    if (JSON.stringify(rowsA[i]) !== JSON.stringify(rowsJs[i])) {
      parity = false;
      firstDiff = i;
    }
  }
  check('TS ↔ JS تطابق كامل (كل الصفوف)', parity,
    firstDiff === -1 ? '' : `أول اختلاف عند row ${firstDiff}`);
  check(
    'التطابق: prevHash / hash / id / status',
    !parity || (rowsA[rowsA.length - 1].hash === rowsJs[rowsJs.length - 1].hash),
    parity ? `final hash = ${rowsA[rowsA.length - 1].hash}` : '',
  );
}

// ── 4) Chain validity ───────────────────────────────────────────────────
{
  const rowsA = buildRowsFromTs();
  const fnv = tsMod.fnv1a;
  const canon = tsMod.evidenceCanonical;
  let chainOk = true;
  let chainErrorAt = -1;
  let chainBrokenAt = -1;
  for (let i = 0; i < rowsA.length; i += 1) {
    const r = rowsA[i];
    const expectedPrev = i === 0 ? '0x00000000' : rowsA[i - 1].hash;
    if (r.prevHash !== expectedPrev) {
      chainOk = false; chainErrorAt = i; break;
    }
    const expected = fnv(expectedPrev + '|' + canon(r));
    if (r.hash !== expected) {
      chainOk = false; chainBrokenAt = i; break;
    }
  }
  check('سلسلة الهاش صحيحة من genesis إلى النهاية', chainOk,
    chainOk ? '' : (chainBrokenAt !== -1 ? `كسر عند row ${chainBrokenAt}` : `prevHash mismatch عند row ${chainErrorAt}`));
  check('genesis = 0x00000000', rowsA[0].prevHash === '0x00000000', rowsA[0].prevHash);
  check('final hash = 0x98db5fe5', rowsA[rowsA.length - 1].hash === '0x98db5fe5', rowsA[rowsA.length - 1].hash);
}

// ── 5) Source hygiene ───────────────────────────────────────────────────
{
  const hygieneTargets = [dataMirrorPath, tsSourcePath, enginePath];
  const badPatterns = [
    [/Math\.random/g, 'Math.random'],
    [/Date\.now/g, 'Date.now'],
    [/toLocaleString/g, 'toLocaleString'],
    [/\bfetch\s*\(/g, 'fetch('],
  ];
  function stripCommentsAndStrings(src) {
    let out = src
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
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
}

// ── report ──────────────────────────────────────────────────────────────
if (failures.length) {
  console.error(`\n❌ فشل التحقق: ${failures.length} بند/بنود\n  - ${failures.join('\n  - ')}`);
  process.exit(1);
}
console.log('\n✅ verify-evidence: كل البنود ناجحة — contract ثابت.');
process.exit(0);
