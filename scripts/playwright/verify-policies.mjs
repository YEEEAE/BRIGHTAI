/**
 * verify-policies.mjs — M17: Policy Governance page functional verification.
 * Launches Chromium, loads /kernel/policies/, then asserts:
 * SSR stats (11 policies, 6 stat cards), engine mounted (window.KernelPolicies),
 * config blob (11 policies + 1000 sim requests), policies table rendered (11 rows),
 * conflict detection, createVersion (immutable — new version + hash change),
 * certificate guard (pr_saudi_id_pdpl v1 certified → current edit blocked),
 * rollback (creates new version), diff (Git-like added/removed), simulation
 * (1000 requests → affected + false positives), generator (suggest → demo draft),
 * import/export validation, no console errors.
 */
import { chromium } from 'playwright';

const BASE = process.env.PO_URL || 'http://localhost:4877/kernel/policies/';
const failures = [];
const ok = (name, cond, detail = '') => {
  if (cond) console.log('✅ ' + name + (detail ? ' — ' + detail : ''));
  else { console.log('❌ ' + name + (detail ? ' — ' + detail : '')); failures.push(name); }
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const consoleErrors = [];
page.on('console', (msg) => {
  if (msg.type() !== 'error') return;
  const text = msg.text();
  if (text.includes('.vite/deps') || text.includes('Outdated Optimize Dep')) return;
  if (text.includes('Content Security Policy directive') || text.includes('X-Frame-Options may only be set')) return;
  consoleErrors.push(text);
});
page.on('pageerror', (err) => consoleErrors.push('PAGEERROR: ' + err.message));

await page.goto(BASE, { waitUntil: 'networkidle' });

// Dismiss overlays that can intercept clicks.
await page.evaluate(() => {
  const q = (s) => document.querySelector(s);
  const c = q('.cookie-consent'); if (c) c.remove();
  const s = q('#kernel-sidebar'); if (s) s.remove();
  const n = q('.kernel-sidebar'); if (n) n.remove();
  const toast = q('#k-toast'); if (toast) toast.remove();
});

// ── Engine mounted? ──
const engineMounted = await page.evaluate(() => !!window.KernelPolicies);
ok('engine mounted (window.KernelPolicies)', engineMounted);

// ── Config blob parsed (11 policies + 1000 sim requests) ──
const blob = await page.evaluate(() => {
  const el = document.getElementById('policies-config');
  if (!el) return null;
  try { const d = JSON.parse(el.textContent || '{}'); return { policies: d.policies.length, sim: d.simRequests.length, pii: Object.keys(d.piiPatterns || {}).length }; } catch (e) { return null; }
});
ok('config blob parsed (11 policies)', blob && blob.policies === 11);
ok('config blob parsed (1000 sim requests)', blob && blob.sim === 1000);
ok('config blob has real PII patterns (>=10)', blob && blob.pii >= 10);

// ── SSR stats ──
const statCards = await page.locator('.po-stat').count();
ok('SSR stat cards (6)', statCards === 6, 'found ' + statCards);
const totalText = await page.locator('.po-stat').first().innerText();
ok('SSR total policies = 11', /11/.test(totalText), totalText.replace(/\n/g, ' ').slice(0, 30));

// ── Policies table rendered (11 rows) ──
const rows = await page.locator('[data-po-tbody] .po-table__row').count();
ok('policies table 11 rows', rows === 11, 'found ' + rows);
const versionChips = await page.locator('.po-version-chip').count();
ok('version chips on rows (>=11)', versionChips >= 11);

// ── API: conflicts ──
const conflicts = await page.evaluate(() => window.KernelPolicies.conflicts());
ok('conflicts() returns array', Array.isArray(conflicts));

// ── API: createVersion → immutable new version + hash change ──
const cv = await page.evaluate(() => {
  const before = window.KernelPolicies.get('pr_phone_pdpl');
  const beforeVer = before.versions[before.versions.length - 1].version;
  const beforeHash = before.versions[before.versions.length - 1].hash;
  const res = window.KernelPolicies.createVersion('pr_phone_pdpl', {
    rule: {
      if: { piiType: 'mobile', operator: 'matches', pattern: '\\b0?5\\d{8}\\b' },
      and: { compliancePack: 'pdpl', orPacks: ['iso_27001', 'nca_ecc'] },
      then: { action: 'mask', riskModifier: 6 },
    },
    note: 'اختبار M17',
  });
  const after = window.KernelPolicies.get('pr_phone_pdpl');
  const afterVer = after.versions[after.versions.length - 1].version;
  const afterHash = after.versions[after.versions.length - 1].hash;
  return { ok: res.ok, beforeVer, afterVer, beforeHash, afterHash, msg: res.message };
});
ok('createVersion creates new version', cv.ok && cv.afterVer === cv.beforeVer + 1, 'v' + cv.beforeVer + '→v' + cv.afterVer);
ok('createVersion changes hash', cv.beforeHash !== cv.afterHash, cv.afterHash.slice(0, 12));
ok('createVersion is deterministic hash format', /^h[0-9a-f]{8}$/.test(cv.afterHash));

// ── Certificate guard: pr_patient_sfda current version (v1) certified → blocked ──
const certGuard = await page.evaluate(() => {
  const res = window.KernelPolicies.createVersion('pr_patient_sfda', { note: 'محاولة تعديل مثبتة' });
  return { ok: res.ok, blocked: !!res.blocked, certifiedBy: res.certifiedBy || null, msg: res.message };
});
ok('certified current version edit blocked', certGuard.ok === false && certGuard.blocked === true, certGuard.certifiedBy || '');
ok('certificate guard message clear', /شهادة/.test(certGuard.msg || ''));

// ── API: diff (Git-like) ──
const diffRes = await page.evaluate(() => {
  const p = window.KernelPolicies.get('pr_phone_pdpl');
  const vs = p.versions.map((x) => x.version);
  const a = vs[vs.length - 2]; // before
  const b = vs[vs.length - 1]; // after
  return window.KernelPolicies.diff('pr_phone_pdpl', a, b);
});
ok('diff returns added/removed', diffRes && Array.isArray(diffRes.added) && Array.isArray(diffRes.removed));
ok('diff detects OR pack change', diffRes.added.some((l) => l.indexOf('OR.pack') !== -1) || diffRes.removed.some((l) => l.indexOf('OR.pack') !== -1));

// ── API: rollback creates new version ──
const rb = await page.evaluate(() => {
  const p = window.KernelPolicies.get('pr_phone_pdpl');
  const vs = p.versions.map((x) => x.version);
  const target = vs[vs.length - 2];
  const res = window.KernelPolicies.rollback('pr_phone_pdpl', target);
  const after = window.KernelPolicies.get('pr_phone_pdpl');
  return { ok: res.ok, lastVer: after.versions[after.versions.length - 1].version, msg: res.message };
});
ok('rollback creates new version', rb.ok && rb.lastVer === 4, 'v4');
ok('rollback message mentions target', /عُدنا لإصدار v2/.test(rb.msg || ''), rb.msg);

// ── API: simulation (deterministic, 1000 requests) ──
const sim = await page.evaluate(() => window.KernelPolicies.simulate());
ok('simulation total = 1000', sim && sim.total === 1000, 'total=' + (sim && sim.total));
ok('simulation affected > 0', sim && sim.affected > 0, 'affected=' + (sim && sim.affected));
ok('simulation false positives >= 0', sim && sim.falsePositives >= 0, 'fp=' + (sim && sim.falsePositives));
ok('simulation byDept populated', sim && Object.keys(sim.byDept).length >= 5, 'depts=' + (sim && Object.keys(sim.byDept).length));
ok('simulation warning object present', sim && sim.warn && typeof sim.warn.fpOverThreshold === 'boolean');

// Determinism: same simulate() twice → same stats
const sim2 = await page.evaluate(() => window.KernelPolicies.simulate());
ok('simulation deterministic (same affected/fp)', sim2.affected === sim.affected && sim2.falsePositives === sim.falsePositives);

// ── API: generator (suggest → demo draft) ──
const sug = await page.evaluate(() => window.KernelPolicies.suggest('امنع تسريب أرقام الجوال مع PDPL'));
ok('generator returns draft', sug && sug.status === 'draft' && sug.mode === 'demo', sug && sug.name);
ok('generator maps mobile → mask', sug && sug.piiType === 'mobile' && sug.action === 'mask');
const addSug = await page.evaluate(() => window.KernelPolicies.addSuggested(window.__poSuggested || null));
// addSuggested needs the object; use the suggest return via serialize
const addSug2 = await page.evaluate((json) => {
  const obj = JSON.parse(json);
  return window.KernelPolicies.addSuggested(obj);
}, JSON.stringify(await page.evaluate(() => window.KernelPolicies.suggest('سياسة حظر الآيبان للامتثال SAMA'))));
ok('addSuggested adds demo draft', addSug2 && addSug2.ok === true, addSug2 && addSug2.message);

// ── API: export/import validation ──
const exportText = await page.evaluate(() => window.KernelPolicies.exportConfig());
ok('exportConfig is valid JSON with app marker', typeof exportText === 'string' && exportText.indexOf('brightai-kernel-policies') !== -1);
const badImport = await page.evaluate(() => window.KernelPolicies.importConfig('{"foo":1}'));
ok('importConfig rejects malformed', badImport && badImport.ok === false);
const goodImport = await page.evaluate((json) => window.KernelPolicies.importConfig(json), exportText);
ok('importConfig accepts own export', goodImport && goodImport.ok === true && goodImport.count >= 11);

// ── API: snapshot ──
const snap = await page.evaluate(() => window.KernelPolicies.snapshot());
ok('snapshot has policy counts', snap && snap.policyCount >= 11 && snap.activeCount >= 9, 'active=' + (snap && snap.activeCount));
ok('snapshot reports certified count >= 2', snap && snap.certifiedCount >= 2);

// ── UI: simulate-all button updates KPIs ──
await page.locator('[data-po-sim-all]').click();
await page.waitForTimeout(200);
const affectedText = await page.locator('[data-po-sim-affected]').innerText();
ok('sim-all button updates affected KPI', /^\d+$/.test(affectedText.trim()), affectedText);
const simRows = await page.locator('.po-sim-row').count();
ok('sim-bydept rows rendered', simRows >= 5, 'rows=' + simRows);

// ── UI: editor modal opens on edit ──
await page.locator('[data-po-edit="pr_email_pdpl"]').first().click();
await page.waitForTimeout(150);
const editorVisible = await page.locator('[data-po-editor]').getAttribute('hidden');
ok('editor modal opens', editorVisible === null);
const editorJson = await page.locator('[data-po-editor-json]').innerText();
ok('editor JSON preview non-empty', (editorJson || '').trim().length > 10);
await page.locator('.po-modal__close[data-po-editor-close]').click();
await page.waitForTimeout(150);

// ── UI: versions modal opens (pr_saudi_id_pdpl has certified v1) ──
await page.locator('[data-po-versions="pr_saudi_id_pdpl"]').first().click();
await page.waitForTimeout(150);
const versionsVisible = await page.locator('[data-po-versions-modal]').getAttribute('hidden');
ok('versions modal opens', versionsVisible === null);
const versionsRows = await page.locator('.po-versions__row').count();
ok('versions rows rendered (>=2)', versionsRows >= 2, 'rows=' + versionsRows);
const certifiedRow = await page.locator('.po-versions__row--certified').count();
ok('certified version row flagged', certifiedRow >= 1, 'certified=' + certifiedRow);
await page.locator('.po-modal__close[data-po-versions-close]').click();
await page.waitForTimeout(150);

// ── UI: generator button fills result ──
await page.locator('[data-po-gen-input]').fill('امنع تسريب ملفات المرضى مع SFDA');
await page.locator('[data-po-gen-btn]').click();
await page.waitForTimeout(150);
const genResult = await page.locator('[data-po-gen-result]').innerText();
ok('generator UI result non-empty', (genResult || '').trim().length > 20);

// ── No console errors ──
ok('no console errors (' + consoleErrors.length + ')', consoleErrors.length === 0);
if (consoleErrors.length) consoleErrors.slice(0, 5).forEach((e) => console.log('   console: ' + e));

await browser.close();

console.log('');
if (failures.length) {
  console.log('FAILED CHECKS: ' + failures.join(', '));
  process.exit(1);
}
console.log('ALL POLICY GOVERNANCE CHECKS PASSED');
process.exit(0);
