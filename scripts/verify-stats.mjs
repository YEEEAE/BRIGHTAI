/**
 * verify-stats.mjs — Deterministic verification gate for /kernel/stats/ (M24).
 *
 * Checks:
 *   1. Determinism: two builds produce byte-identical data
 *   2. Count matrix: total=12483, allowed=11210, blocked=382, pending=841, pii=1554
 *   3. TS↔JS parity: every field matches between TS and JS
 *   4. Source hygiene: no Math.random, Date.now, toLocaleString, fetch
 */

import { readFileSync } from 'node:fs';

async function loadTs() {
  const mod = await import('../src/data/kernel-stats.ts');
  return mod;
}

function loadJs() {
  const jsPath = new URL('../public/js/kernel-stats-data.js', import.meta.url);
  const code = readFileSync(jsPath, 'utf-8');
  const moduleObj = { exports: {} };
  const fn = new Function('module', 'exports', code);
  fn(moduleObj, moduleObj.exports);
  return moduleObj.exports;
}

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

  console.log('\n═══ verify-stats — M24 ═══\n');

  // ── 1. Determinism ────────────────────────────────────────────────────────
  console.log('─ Determinism ─');
  const d1 = ts.buildStatsData();
  const d2 = ts.buildStatsData();
  check('Two builds produce identical data', JSON.stringify(d1) === JSON.stringify(d2));

  // ── 2. Count matrix ───────────────────────────────────────────────────────
  console.log('\n─ Count matrix ─');
  check('Total = 12483', ts.STATS_TOTAL === 12483, 'got ' + ts.STATS_TOTAL);
  check('Allowed = 11210', ts.STATS_ALLOWED === 11210, 'got ' + ts.STATS_ALLOWED);
  check('Blocked = 382', ts.STATS_BLOCKED === 382, 'got ' + ts.STATS_BLOCKED);
  check('Pending = 841', ts.STATS_PENDING === 841, 'got ' + ts.STATS_PENDING);
  check('PII = 1554', ts.STATS_PII === 1554, 'got ' + ts.STATS_PII);

  const data = ts.buildStatsData();
  check('KPIs count = 6', data.kpis.length === 6, 'got ' + data.kpis.length);
  check('Top users = 10', data.topUsers.length === 10, 'got ' + data.topUsers.length);
  check('Top departments = 7', data.topDepartments.length === 7, 'got ' + data.topDepartments.length);
  check('Top models = 5', data.topModels.length === 5, 'got ' + data.topModels.length);
  check('Live events = 20', data.liveEvents.length === 20, 'got ' + data.liveEvents.length);
  check('Alerts = 4', data.alerts.length === 4, 'got ' + data.alerts.length);
  check('Quotas = 7', data.quotas.length === 7, 'got ' + data.quotas.length);

  // ── 3. TS↔JS parity ───────────────────────────────────────────────────────
  console.log('\n─ TS↔JS parity ─');
  const tsData = ts.buildStatsData();
  const jsData = js.buildStatsData();
  check('TS and JS data identical', JSON.stringify(tsData) === JSON.stringify(jsData));

  // ── 4. Source hygiene ─────────────────────────────────────────────────────
  console.log('\n─ Source hygiene ─');
  const tsSource = readFileSync(new URL('../src/data/kernel-stats.ts', import.meta.url), 'utf-8');
  const jsSource = readFileSync(new URL('../public/js/kernel-stats-data.js', import.meta.url), 'utf-8');

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