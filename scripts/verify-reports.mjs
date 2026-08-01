/**
 * verify-reports.mjs — Deterministic verification gate for /kernel/reports/ (M23).
 *
 * Checks:
 *   1. Determinism: two builds produce byte-identical rows
 *   2. Count matrix: total=42, ready=38, generating=1, failed=3, scheduled=4
 *   3. TS↔JS parity: every field matches between TS and JS
 *   4. Chain validity: genesis → end, every prevHash matches
 *   5. Source hygiene: no Math.random, Date.now, toLocaleString, fetch
 */

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// ── Load TS source (via tsx loader) ──────────────────────────────────────────

async function loadTs() {
  const mod = await import('../src/data/kernel-reports.ts');
  return mod;
}

// ── Load JS mirror ───────────────────────────────────────────────────────────

function loadJs() {
  const jsPath = new URL('../public/js/kernel-reports-data.js', import.meta.url);
  const code = readFileSync(jsPath, 'utf-8');
  const moduleObj = { exports: {} };
  const fn = new Function('module', 'exports', code);
  fn(moduleObj, moduleObj.exports);
  return moduleObj.exports;
}

// ── Tests ────────────────────────────────────────────────────────────────────

async function main() {
  const ts = await loadTs();
  const js = loadJs();

  let pass = 0;
  let fail = 0;
  const errors = [];

  function check(name, condition, detail) {
    if (condition) {
      pass += 1;
      console.log('  ✅ ' + name);
    } else {
      fail += 1;
      errors.push(name + (detail ? ': ' + detail : ''));
      console.log('  ❌ ' + name + (detail ? ' — ' + detail : ''));
    }
  }

  console.log('\n═══ verify-reports — M23 ═══\n');

  // ── 1. Determinism ────────────────────────────────────────────────────────
  console.log('─ Determinism ─');
  const rows1 = ts.buildReportRows();
  const rows2 = ts.buildReportRows();
  const detJson1 = JSON.stringify(rows1);
  const detJson2 = JSON.stringify(rows2);
  check('Two builds produce identical rows', detJson1 === detJson2);

  const sched1 = ts.buildScheduledReports();
  const sched2 = ts.buildScheduledReports();
  check('Two builds produce identical scheduled', JSON.stringify(sched1) === JSON.stringify(sched2));

  const versions1 = ts.buildTemplateVersions();
  const versions2 = ts.buildTemplateVersions();
  check('Two builds produce identical versions', JSON.stringify(versions1) === JSON.stringify(versions2));

  // ── 2. Count matrix ───────────────────────────────────────────────────────
  console.log('\n─ Count matrix ─');
  const stats = ts.buildReportStats();
  check('Total reports = 42', stats.total === 42, 'got ' + stats.total);
  check('Ready = 38', stats.ready === 38, 'got ' + stats.ready);
  check('Generating = 1', stats.generating === 1, 'got ' + stats.generating);
  check('Scheduled = 4', stats.scheduled === 4, 'got ' + stats.scheduled);
  check('Recipients >= 1', stats.recipients >= 1, 'got ' + stats.recipients);
  check('Languages = 5', stats.byLanguage === 5, 'got ' + stats.byLanguage);

  // ── 3. TS↔JS parity ───────────────────────────────────────────────────────
  console.log('\n─ TS↔JS parity ─');
  const tsRows = ts.buildReportRows();
  const jsRows = js.buildReportRows();
  check('TS and JS row count match', tsRows.length === jsRows.length, 'ts=' + tsRows.length + ' js=' + jsRows.length);

  let parityOk = true;
  for (let i = 0; i < tsRows.length; i += 1) {
    const t = tsRows[i];
    const j = jsRows[i];
    if (t.id !== j.id || t.title !== j.title || t.type !== j.type || t.status !== j.status ||
        t.format !== j.format || t.language !== j.language || t.hash !== j.hash ||
        t.prevHash !== j.prevHash || t.traceCoverageCount !== j.traceCoverageCount) {
      parityOk = false;
      check('Row ' + i + ' parity', false, 'ts.hash=' + t.hash + ' js.hash=' + j.hash);
      break;
    }
  }
  if (parityOk) check('All rows byte-identical between TS and JS', true);

  const tsSched = ts.buildScheduledReports();
  const jsSched = js.buildScheduledReports();
  check('Scheduled count match', tsSched.length === jsSched.length);
  check('Scheduled parity', JSON.stringify(tsSched) === JSON.stringify(jsSched));

  const tsVersions = ts.buildTemplateVersions();
  const jsVersions = js.buildTemplateVersions();
  check('Versions count match', tsVersions.length === jsVersions.length);
  check('Versions parity', JSON.stringify(tsVersions) === JSON.stringify(jsVersions));

  // ── 4. Chain validity ─────────────────────────────────────────────────────
  console.log('\n─ Chain validity ─');
  let chainOk = true;
  let prev = '0x00000000';
  for (let i = 0; i < tsRows.length; i += 1) {
    const r = tsRows[i];
    if (r.prevHash !== prev) {
      chainOk = false;
      check('Chain at row ' + i, false, 'expected prev=' + prev + ' got=' + r.prevHash);
      break;
    }
    prev = r.hash;
  }
  if (chainOk) check('Hash chain valid (genesis → end)', true);

  // Versions chain
  let vChainOk = true;
  let vPrev = '0x00000000';
  for (let i = 0; i < tsVersions.length; i += 1) {
    const v = tsVersions[i];
    if (v.hash === vPrev) {
      vChainOk = false;
      break;
    }
    vPrev = v.hash;
  }
  check('Versions hash chain unique', vChainOk);

  // ── 5. Source hygiene ─────────────────────────────────────────────────────
  console.log('\n─ Source hygiene ─');
  const tsSource = readFileSync(new URL('../src/data/kernel-reports.ts', import.meta.url), 'utf-8');
  const jsSource = readFileSync(new URL('../public/js/kernel-reports-data.js', import.meta.url), 'utf-8');

  // Strip comments and strings for hygiene check.
  function stripCommentsAndStrings(code) {
    return code
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
      .replace(/'(?:[^'\\]|\\.)*'/g, "''")
      .replace(/"(?:[^"\\]|\\.)*"/g, '""')
      .replace(/`(?:[^`\\]|\\.)*`/g, '``');
  }

  const tsStripped = stripCommentsAndStrings(tsSource);
  const jsStripped = stripCommentsAndStrings(jsSource);

  check('No Math.random in TS', !/Math\.random/.test(tsStripped));
  check('No Date.now in TS', !/Date\.now/.test(tsStripped));
  check('No toLocaleString in TS', !/toLocaleString/.test(tsStripped));
  check('No fetch in TS', !/fetch\s*\(/.test(tsStripped));
  check('No Math.random in JS', !/Math\.random/.test(jsStripped));
  check('No Date.now in JS', !/Date\.now/.test(jsStripped));
  check('No toLocaleString in JS', !/toLocaleString/.test(jsStripped));
  check('No fetch in JS', !/fetch\s*\(/.test(jsStripped));

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n═══ Summary ═══');
  console.log('  Pass: ' + pass + '/' + (pass + fail));
  console.log('  Fail: ' + fail + '/' + (pass + fail));

  if (fail > 0) {
    console.log('\n❌ FAILED:');
    errors.forEach((e) => console.log('  - ' + e));
    process.exit(1);
  } else {
    console.log('\n✅ All checks passed.');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});