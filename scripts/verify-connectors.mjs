/**
 * verify-connectors.mjs — Deterministic verification gate for /kernel/connectors/ (M26).
 */
import { readFileSync } from 'node:fs';

async function loadTs() {
  const mod = await import('../src/data/kernel-connectors.ts');
  return mod;
}

function loadJs() {
  const jsPath = new URL('../public/js/kernel-connectors-data.js', import.meta.url);
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

  console.log('\n═══ verify-connectors — M26 ═══\n');

  console.log('─ Determinism ─');
  const d1 = ts.buildConnectorsData();
  const d2 = ts.buildConnectorsData();
  check('Two builds produce identical data', JSON.stringify(d1) === JSON.stringify(d2));

  console.log('\n─ Count matrix ─');
  check('Connectors = 8', ts.CONNECTORS_COUNT === 8, 'got ' + ts.CONNECTORS_COUNT);
  check('Connected = 6', ts.CONNECTORS_CONNECTED === 6, 'got ' + ts.CONNECTORS_CONNECTED);
  check('Pending = 1', ts.CONNECTORS_PENDING === 1, 'got ' + ts.CONNECTORS_PENDING);
  check('Error = 1', ts.CONNECTORS_ERROR === 1, 'got ' + ts.CONNECTORS_ERROR);
  check('Sync history = 8', ts.CONNECTORS_SYNC_HISTORY === 8, 'got ' + ts.CONNECTORS_SYNC_HISTORY);
  check('Guide steps = 4', ts.CONNECTORS_GUIDE_STEPS === 4, 'got ' + ts.CONNECTORS_GUIDE_STEPS);

  const data = ts.buildConnectorsData();
  check('Connectors length = 8', data.connectors.length === 8, 'got ' + data.connectors.length);
  check('Connected count = 6', data.connectors.filter((c) => c.status === 'connected').length === 6);
  check('Pending count = 1', data.connectors.filter((c) => c.status === 'pending').length === 1);
  check('Error count = 1', data.connectors.filter((c) => c.status === 'error').length === 1);
  check('Sync history length = 8', data.syncHistory.length === 8, 'got ' + data.syncHistory.length);
  check('Custom guide length = 4', data.customGuide.length === 4, 'got ' + data.customGuide.length);

  const ids = data.connectors.map((c) => c.id);
  check('SAP exists', ids.includes('sap'));
  check('Oracle exists', ids.includes('oracle-ebs'));
  check('Dynamics exists', ids.includes('dynamics365'));
  check('Epic exists', ids.includes('epic-his'));
  check('Moodle exists', ids.includes('moodle'));
  check('SharePoint exists', ids.includes('sharepoint'));
  check('Salesforce exists', ids.includes('salesforce'));
  check('Okta exists', ids.includes('okta'));

  const salesforce = data.connectors.find((c) => c.id === 'salesforce');
  check('Salesforce has error status', salesforce && salesforce.status === 'error');
  check('Salesforce has errorMsg', salesforce && typeof salesforce.errorMsg === 'string' && salesforce.errorMsg.length > 0);

  const moodle = data.connectors.find((c) => c.id === 'moodle');
  check('Moodle is pending', moodle && moodle.status === 'pending');

  check('All connectors read-only', data.connectors.every((c) => c.readOnly === true));

  console.log('\n─ TS↔JS parity ─');
  const tsData = ts.buildConnectorsData();
  const jsData = js.buildConnectorsData();
  check('TS and JS data identical', JSON.stringify(tsData) === JSON.stringify(jsData));

  console.log('\n─ Source hygiene ─');
  const tsSource = readFileSync(new URL('../src/data/kernel-connectors.ts', import.meta.url), 'utf-8');
  const jsSource = readFileSync(new URL('../public/js/kernel-connectors-data.js', import.meta.url), 'utf-8');

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
