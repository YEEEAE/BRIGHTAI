#!/usr/bin/env node
/**
 * scripts/verify-replay.mjs — M20 /kernel/replay/ determinism + parity gate.
 *
 * Proves the time-machine module's hard contract before any commit:
 *
 *   1. DETERMINISM  — building the dataset twice yields byte-identical rows
 *      (same seed, no Math.random, no Date.now, no locale formatting).
 *   2. COUNT MATRIX — total=520 · blocked=340 · released=12 · falsePos=48 ·
 *      untouched=168.
 *   3. TS ↔ JS PARITY — src/data/kernel-replay.ts and the UMD browser mirror
 *      public/js/kernel-time-machine-data.js produce identical FULL chains
 *      (same genesis 0x00000000, same every row, same final hash).
 *   4. CHAIN VALIDITY — for every row: hash === fnv1a(prev + '|' + canon(row)),
 *      i.e. the chain is cryptographically self-consistent.
 *   5. SIMULATION CONTRACT — the default full-run replay (Feb–Jul 2026, all
 *      depts, all policies) yields extraBlocked=340 · extraAllowed=12 ·
 *      falsePos=48 · net=328, a non-empty affected table + ranked depts, and a
 *      side-effect warning naming a high-false-positive policy.
 *   6. CONSENT GATE — external mode WITHOUT consent returns consentRequired=true
 *      with ZERO simulation data; external mode WITH consent returns a real
 *      result; local mode needs no consent (Prompt 20 immutable rule).
 *   7. TIMELINE — every valid Trace ID yields a stable 6-step reconstruction
 *      (same output across calls), and unknown traces still resolve.
 *   8. SOURCE HYGIENE — no Math.random / Date.now / toLocaleString / fetch in
 *      the data generator, the engine, or the worker.
 *
 * Usage: node scripts/verify-replay.mjs   (exit 0 = pass)
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const dataMirrorPath = path.join(rootDir, 'public', 'js', 'kernel-time-machine-data.js');
const tsSourcePath = path.join(rootDir, 'src', 'data', 'kernel-replay.ts');
const workerPath = path.join(rootDir, 'public', 'js', 'kernel-time-machine-worker.js');
const enginePath = path.join(rootDir, 'public', 'js', 'kernel-time-machine.js');

const failures = [];
function check(name, ok, detail = '') {
  const mark = ok ? '✓' : '✗';
  console.log(`${mark} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures.push(name);
}

// ── load the TS generator + the JS mirror (UMD → ESM shim) ─────────────
const tsMod = await import(new URL('file://' + tsSourcePath).href + '?t=' + Date.now());
const jsSource = fs.readFileSync(dataMirrorPath, 'utf8');
const jsExports = {};
const vmCtx = vm.createContext({ module: { exports: jsExports }, exports: jsExports });
vm.runInContext(jsSource, vmCtx, { filename: 'kernel-time-machine-data.js' });
const jsMod = vmCtx.module.exports;

const rowsA = tsMod.buildReplayRows();
const rowsB = tsMod.buildReplayRows();
const rowsJs = jsMod.buildReplayRows();

// ── 1. determinism ──────────────────────────────────────────────────────
let deterministic = rowsA.length === rowsB.length;
for (let i = 0; deterministic && i < rowsA.length; i += 1) {
  if (JSON.stringify(rowsA[i]) !== JSON.stringify(rowsB[i])) {
    deterministic = false;
    console.log(`   first drift at row ${i}`);
  }
}
check('التحديدية (determinism): بناءان → صفوف متطابقة', deterministic);

// ── 2. count matrix (TS) ────────────────────────────────────────────────
let blocked = 0;
let released = 0;
let falsePos = 0;
let untouched = 0;
for (const r of rowsA) {
  if (r.policy === '') untouched += 1;
  else if (r.before === 'allowed' && r.after === 'blocked') blocked += 1;
  else if (r.before === 'blocked' && r.after === 'allowed') released += 1;
  if (r.falsePos) falsePos += 1;
}
check('الإجمالي = 520', rowsA.length === 520, String(rowsA.length));
check('محظور (allowed→blocked) = 340', blocked === 340, String(blocked));
check('مُسمّى (blocked→allowed) = 12', released === 12, String(released));
check('إيجابية كاذبة = 48', falsePos === 48, String(falsePos));
check('غير متأثر = 168', untouched === 168, String(untouched));

// ── 3. TS ↔ JS parity (full chain) ──────────────────────────────────────
check('JS mirror builds 520 rows too', rowsJs.length === rowsA.length, String(rowsJs.length));
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
  'التطابق: final hash',
  !parity || rowsA[rowsA.length - 1].hash === rowsJs[rowsJs.length - 1].hash,
  parity ? `final hash = ${rowsA[rowsA.length - 1].hash}` : '',
);

// ── 4. chain validity ───────────────────────────────────────────────────
const fnv = tsMod.fnv1a;
const canon = tsMod.replayCanonical;
let chainOk = true;
let chainDetail = '';
for (let i = 0; i < rowsA.length; i += 1) {
  const r = rowsA[i];
  const expectedPrev = i === 0 ? '0x00000000' : rowsA[i - 1].hash;
  if (r.prevHash !== expectedPrev) {
    chainOk = false;
    chainDetail = `prevHash mismatch عند row ${i}`;
    break;
  }
  if (r.hash !== fnv(expectedPrev + '|' + canon(r))) {
    chainOk = false;
    chainDetail = `كسر عند row ${i}`;
    break;
  }
}
check('سلسلة الهاش صحيحة من genesis إلى النهاية', chainOk, chainDetail);
check('genesis = 0x00000000', rowsA[0].prevHash === '0x00000000', rowsA[0].prevHash);

// ── 5. simulation contract (default full run) ───────────────────────────
const allPolicyIds = tsMod.REPLAY_POLICIES.map((p) => p.id);
const fullParams = {
  fromMs: tsMod.REPLAY_TS_START,
  toMs: tsMod.REPLAY_TS_END,
  dept: '',
  policyIds: allPolicyIds,
  mode: 'local',
  externalConsented: false,
};
const fullRun = tsMod.simulateReplay(rowsA, fullParams);
check('المحاكاة الكاملة: scoped = 520', fullRun.scoped === 520, String(fullRun.scoped));
check('كان سيُحظر إضافياً = 340', fullRun.stats.extraBlocked === 340, String(fullRun.stats.extraBlocked));
check('كان سيُسمح إضافياً = 12', fullRun.stats.extraAllowed === 12, String(fullRun.stats.extraAllowed));
check('إيجابية كاذبة = 48', fullRun.stats.falsePos === 48, String(fullRun.stats.falsePos));
check('صافي الأثر = 328', fullRun.stats.net === 328, String(fullRun.stats.net));
check('جدول متأثر غير فارغ (352 صفاً)', fullRun.affected.length === 352, String(fullRun.affected.length));
check('الأقسام المتأثرة مرتّبة (≥ 3 أقسام)', fullRun.depts.length >= 3, String(fullRun.depts.length));
check(
  'تحذير الأثر الجانبي يذكر سياسة عالية الإيجابيات الكاذبة',
  fullRun.warning !== null && fullRun.warning.falsePos > 0,
  fullRun.warning ? `${fullRun.warning.policyId} (FP=${fullRun.warning.falsePos}, legit=${fullRun.warning.count}, قسم=${fullRun.warning.dept})` : 'لا تحذير',
);

// ── 6. consent gate (Prompt 20 security rule) ───────────────────────────
const extNoConsent = tsMod.simulateReplay(rowsA, {
  ...fullParams,
  mode: 'external',
  externalConsented: false,
});
check(
  'بوابة الموافقة: external بدون موافقة → consentRequired + صفر بيانات',
  extNoConsent.consentRequired === true &&
    extNoConsent.scoped === 0 &&
    extNoConsent.stats.extraBlocked === 0 &&
    extNoConsent.affected.length === 0,
  JSON.stringify(extNoConsent.stats),
);

const extConsented = tsMod.simulateReplay(rowsA, {
  ...fullParams,
  mode: 'external',
  externalConsented: true,
});
check(
  'بوابة الموافقة: external بموافقة → نتيجة حقيقية',
  extConsented.consentRequired === false && extConsented.scoped === 520 && extConsented.stats.extraBlocked === 340,
  String(extConsented.stats.extraBlocked),
);

const localRun = tsMod.simulateReplay(rowsA, { ...fullParams, mode: 'local' });
check('بوابة الموافقة: local لا يتطلب موافقة', localRun.consentRequired === false && localRun.scoped === 520);

// Partial-policy simulation sanity (only p-email selected → releases only).
const emailOnly = tsMod.simulateReplay(rowsA, {
  ...fullParams,
  policyIds: ['p-email'],
});
check(
  'محاكاة جزئية: p-email فقط → 12 مُسمّى، 0 حظر',
  emailOnly.stats.extraAllowed === 12 && emailOnly.stats.extraBlocked === 0,
  JSON.stringify(emailOnly.stats),
);

// ── 7. timeline determinism ─────────────────────────────────────────────
const tl1 = tsMod.buildTimeline('AI-2026-10493', rowsA);
const tl2 = tsMod.buildTimeline('AI-2026-10493', rowsA);
check('خط زمني: ثابت عبر الاستدعاءات (6 خطوات)', JSON.stringify(tl1) === JSON.stringify(tl2) && tl1.length === 6);
const tlUnknown = tsMod.buildTimeline('AI-2026-99999', rowsA);
check('خط زمني: Trace غير موجود يُبنى أيضاً (6 خطوات)', tlUnknown.length === 6);

// ── 8. source hygiene (no Math.random / Date.now / toLocaleString / fetch) ──
const hygieneTargets = [dataMirrorPath, tsSourcePath, workerPath, enginePath].filter((p) => fs.existsSync(p));
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

// ── report ──────────────────────────────────────────────────────────────
if (failures.length) {
  console.error(`\n❌ فشل التحقق: ${failures.length} بند/بنود\n  - ${failures.join('\n  - ')}`);
  process.exit(1);
}
console.log('\n✅ verify-replay: كل البنود ناجحة — contract ثابت.');
process.exit(0);
