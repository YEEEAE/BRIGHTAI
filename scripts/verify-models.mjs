/**
 * verify-models.mjs — Deterministic verification gate for /kernel/models/ (M25).
 *
 * Checks:
 *   1. Determinism: two builds produce byte-identical data
 *   2. Count matrix: registry=6, arena=3, routingNodes=9, routingLinks=12,
 *      overrides=2, alerts=3, leaderboard=6
 *   3. TS↔JS parity: every field matches between TS and JS
 *   4. Arena run determinism: same prompt = same results
 *   5. Source hygiene: no Math.random, Date.now, toLocaleString, fetch
 */

import { readFileSync } from 'node:fs';

async function loadTs() {
  const mod = await import('../src/data/kernel-models.ts');
  return mod;
}

function loadJs() {
  const jsPath = new URL('../public/js/kernel-models-data.js', import.meta.url);
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

  console.log('\n═══ verify-models — M25 ═══\n');

  // ── 1. Determinism ────────────────────────────────────────────────────────
  console.log('─ Determinism ─');
  const d1 = ts.buildModelsData();
  const d2 = ts.buildModelsData();
  check('Two builds produce identical data', JSON.stringify(d1) === JSON.stringify(d2));

  // ── 2. Count matrix ───────────────────────────────────────────────────────
  console.log('\n─ Count matrix ─');
  check('Registry = 6', ts.MODELS_REGISTRY_COUNT === 6, 'got ' + ts.MODELS_REGISTRY_COUNT);
  check('Arena = 3', ts.MODELS_ARENA_COUNT === 3, 'got ' + ts.MODELS_ARENA_COUNT);
  check('Routing nodes = 9', ts.MODELS_ROUTING_NODES === 9, 'got ' + ts.MODELS_ROUTING_NODES);
  check('Routing links = 12', ts.MODELS_ROUTING_LINKS === 12, 'got ' + ts.MODELS_ROUTING_LINKS);
  check('Overrides = 2', ts.MODELS_OVERRIDES === 2, 'got ' + ts.MODELS_OVERRIDES);
  check('Alerts = 3', ts.MODELS_ALERTS === 3, 'got ' + ts.MODELS_ALERTS);
  check('Leaderboard = 6', ts.MODELS_LEADERBOARD === 6, 'got ' + ts.MODELS_LEADERBOARD);

  const data = ts.buildModelsData();
  check('Registry length = 6', data.registry.length === 6, 'got ' + data.registry.length);
  check('Arena models length = 3', data.arenaModels.length === 3, 'got ' + data.arenaModels.length);
  check('Routing nodes length = 9', data.routingNodes.length === 9, 'got ' + data.routingNodes.length);
  check('Routing links length = 12', data.routingLinks.length === 12, 'got ' + data.routingLinks.length);
  check('Manual overrides length = 2', data.manualOverrides.length === 2, 'got ' + data.manualOverrides.length);
  check('Alerts length = 3', data.alerts.length === 3, 'got ' + data.alerts.length);
  check('Security leaderboard length = 6', data.securityLeaderboard.length === 6, 'got ' + data.securityLeaderboard.length);

  // ── 3. TS↔JS parity ───────────────────────────────────────────────────────
  console.log('\n─ TS↔JS parity ─');
  const tsData = ts.buildModelsData();
  const jsData = js.buildModelsData();
  check('TS and JS data identical', JSON.stringify(tsData) === JSON.stringify(jsData));

  // ── 4. Arena run determinism ──────────────────────────────────────────────
  console.log('\n─ Arena run determinism ─');
  const run1 = ts.buildArenaRun('اختبار الطلب');
  const run2 = ts.buildArenaRun('اختبار الطلب');
  check('Same prompt = same arena results', JSON.stringify(run1) === JSON.stringify(run2));
  check('Arena results length = 3', run1.length === 3, 'got ' + run1.length);
  check('Arena has exactly one winner', run1.filter((r) => r.isWinner).length === 1, 'got ' + run1.filter((r) => r.isWinner).length);

  const jsRun = js.buildArenaRun('اختبار الطلب');
  check('TS and JS arena run identical', JSON.stringify(run1) === JSON.stringify(jsRun));

  // ── 5. Source hygiene ─────────────────────────────────────────────────────
  console.log('\n─ Source hygiene ─');
  const tsSource = readFileSync(new URL('../src/data/kernel-models.ts', import.meta.url), 'utf-8');
  const jsSource = readFileSync(new URL('../public/js/kernel-models-data.js', import.meta.url), 'utf-8');

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