/**
 * verify-kernel-datasets.mjs — M7: Dataset Manager page.
 * Serves dist via `astro preview` (or BASE_URL) then drives the datasets UI:
 * SSR stats, registry, open dataset detail, case table + filters, duplicate &
 * missing-behavior badges, version hashes, import modal (fixture→preview→apply
 * for CSV/JSON/JSONL/paste), metadata rendering, registry filtering,
 * manual case creation (creates a new version), delete guard (usedInRuns>0),
 * and the version-compare drawer.
 *
 * Usage: node scripts/playwright/verify-kernel-datasets.mjs
 * Exit 0 = pass, non-zero = fail. Requires `npx playwright install chromium`.
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:4321';
const URL = `${BASE}/kernel/datasets/`;

// المدخل المستخدم مرتين عمداً (فحص كشف التكرار عند الإضافة اليدوية).
const DUP_INPUT = 'اعرض بيانات الموظف 1098765432';
// عدد الصفوف المتوقع لكل صيغة استيراد من DATASET_IMPORT_FIXTURES.
const EXPECTED_IMPORT_ROWS = { json: 2, jsonl: 2, csv: 3, paste: 2 };

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const consoleErrors = [];
page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
page.on('pageerror', (err) => consoleErrors.push(String(err)));

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok });
  console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ` — ${detail}` : ''}`);
};

try {
  await page.addInitScript(() => {
    try { localStorage.setItem('cookie-consent', 'accepted'); } catch {}
  });

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.evaluate(() => {
    const cc = document.getElementById('cookie-consent');
    if (cc) cc.remove();
  }).catch(() => {});

  // 1) SSR: العنوان + إحصاءات المعيار السعودي (100 حالة).
  const h1 = await page.locator('h1.ds-header__title').innerText().catch(() => '');
  check('SSR h1 present', h1.length > 0, h1.slice(0, 60));
  const kpis = await page.locator('.ds-kpi').count();
  check('SSR KPI cards (>=4)', kpis >= 4, `found ${kpis}`);
  const totalText = await page.locator('.ds-kpi').first().innerText().catch(() => '');
  check('SSR total = 100', /100/.test(totalText), totalText.replace(/\n/g, ' ').slice(0, 40));
  check('SSR sector chips (8)', (await page.locator('.ds-sector').count()) === 8);

  // 2) تحذيرات التكرار والنقص ظاهرة في الـ SSR (نسخة المنشور فيها 1 تكرار + 2 نقص).
  const dupWarn = await page.locator('.ds-warning--dup').count();
  const missWarn = await page.locator('.ds-warning--miss').count();
  check('SSR duplicate warning shown', dupWarn >= 1, `dup=${dupWarn}`);
  check('SSR missing-behavior warnings shown', missWarn >= 1, `miss=${missWarn}`);

  // 3) السجل: صفوف موجودة.
  const rows = await page.locator('#ds-registry-body tr[data-ds-row]').count();
  check('registry rows rendered', rows >= 4, `rows=${rows}`);

  // 3b) فلترة السجل: بحث + حالة.
  await page.fill('#ds-search', 'Saudi Governance Benchmark');
  await page.waitForTimeout(200);
  const searchRows = await page.locator('#ds-registry-body tr[data-ds-row]').count();
  check('registry search filter narrows rows', searchRows >= 1 && searchRows < rows, `${searchRows} < ${rows}`);
  await page.fill('#ds-search', '');
  await page.selectOption('#ds-status-filter', 'published');
  await page.waitForTimeout(200);
  const pubRows = await page.locator('#ds-registry-body tr[data-ds-row]').count();
  check('registry status filter (published)', pubRows >= 1 && pubRows < rows, `${pubRows} < ${rows}`);
  await page.selectOption('#ds-status-filter', 'all');

  // 4) فتح المعيار السعودي → التفاصيل + الإصداران + الهاش + البيانات الوصفية.
  await page.evaluate(() => {
    const btn = document.querySelector('[data-ds-action="open"][data-ds-id="ds-sbg-v1"]');
    if (btn) btn.click();
  });
  await page.waitForSelector('#ds-detail:not([hidden])', { timeout: 5000 });
  const versionBlocks = await page.locator('.ds-version-block').count();
  check('detail versions shown (2)', versionBlocks === 2, `found ${versionBlocks}`);
  const hashShown = await page.locator('.ds-version-block .ds-hash').first().innerText().catch(() => '');
  check('version hash shown', /^0x[0-9a-f]{8}$/.test(hashShown.trim()), hashShown);
  const metaCells = await page.locator('.ds-meta__cell').count();
  check('metadata cells rendered (>=4)', metaCells >= 4, `cells=${metaCells}`);

  // 5) جدول الحالات + الفلاتر.
  await page.waitForSelector('[data-case-list] tr[data-case]', { timeout: 5000 });
  const caseRows = await page.locator('[data-case-list] tr[data-case]').count();
  check('case table rendered', caseRows > 0, `rows=${caseRows}`);
  const dupBadge = await page.locator('.ds-case-badge--dup').count();
  const missBadge = await page.locator('.ds-case-badge--miss').count();
  check('case duplicate badge', dupBadge >= 1, `badges=${dupBadge}`);
  check('case missing badge', missBadge >= 1, `badges=${missBadge}`);

  // فلترة بالقطاع sfda → عدد أقل من الكل.
  await page.evaluate(() => {
    const sel = document.querySelector('[data-case-filter="sector"]');
    if (sel) { sel.value = 'sfda'; sel.dispatchEvent(new Event('change', { bubbles: true })); }
  });
  await page.waitForTimeout(200);
  const filtered = await page.locator('[data-case-list] tr[data-case]').count();
  check('case filter (sector=sfda) narrows rows', filtered > 0 && filtered < caseRows, `${filtered} < ${caseRows}`);
  await page.evaluate(() => {
    const clear = document.querySelector('[data-case-filter-clear]');
    if (clear) clear.click();
  });

  // 6) إضافة حالة يدوية → ينشئ إصداراً جديداً (المسودة HR قابلة للتعديل).
  await page.evaluate(() => {
    const btn = document.querySelector('[data-ds-action="open"][data-ds-id="ds-hr-draft"]');
    if (btn) btn.click();
  });
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    const add = document.querySelector('[data-ds-action="add-case"]');
    if (add) add.click();
  });
  await page.waitForSelector('#ds-case-editor:not([hidden])', { timeout: 5000 });
  await page.fill('#ds-case-title', 'اختبار حالة يدوية');
  await page.fill('#ds-case-input', DUP_INPUT);
  await page.fill('#ds-case-expected', 'حظر');
  await page.evaluate(() => {
    const form = document.getElementById('ds-case-form');
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
  await page.waitForTimeout(300);
  const versionCountAfterAdd = await page.locator('.ds-version-block').count();
  check('manual case add creates new version', versionCountAfterAdd >= 2, `versions=${versionCountAfterAdd}`);
  const caseCountAfterAdd = await page.locator('[data-case-list] tr[data-case]').count();
  check('manual case appears in table', caseCountAfterAdd >= 9, `rows=${caseCountAfterAdd}`);

  // 6b) كشف التكرار عند الإضافة: نضيف حالة بنفس المدخل → تظهر شارة تكرار.
  await page.evaluate(() => {
    const add = document.querySelector('[data-ds-action="add-case"]');
    if (add) add.click();
  });
  await page.waitForSelector('#ds-case-editor:not([hidden])', { timeout: 5000 });
  await page.fill('#ds-case-title', 'نسخة مكررة للاختبار');
  await page.fill('#ds-case-input', DUP_INPUT);
  await page.fill('#ds-case-expected', 'حظر مكرر');
  await page.evaluate(() => {
    const form = document.getElementById('ds-case-form');
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
  await page.waitForTimeout(300);
  const dupBadgesAfterAdd = await page.locator('.ds-case-badge--dup').count();
  check('duplicate detection on manual add', dupBadgesAfterAdd >= 1, `badges=${dupBadgesAfterAdd}`);

  // 7) حارس الحذف: لا حذف لـ Dataset مستخدم في Run (SBG usedInRuns=3).
  await page.evaluate(() => {
    const del = document.querySelector('[data-ds-action="delete"][data-ds-id="ds-sbg-v1"]');
    if (del) del.click();
  });
  await page.waitForTimeout(200);
  const toast = await page.locator('#ds-toast:not([hidden]) #ds-toast-msg').innerText().catch(() => '');
  check('delete guard blocks used dataset', /لا يمكن حذف/.test(toast), toast.slice(0, 60));

  // 8) الاستيراد — أربع صيغ: JSON → JSONL → CSV → لصق جدول.
  const registryBeforeImport = await page.locator('#ds-registry-body tr[data-ds-row]').count();
  for (const tab of ['json', 'jsonl', 'csv', 'paste']) {
    await page.evaluate(() => {
      const imp = document.querySelector('[data-ds-action="import"]');
      if (imp) imp.click();
    });
    await page.waitForSelector('#ds-import-modal:not([hidden])', { timeout: 5000 });
    await page.evaluate((t) => {
      const tabEl = document.querySelector(`[data-import-tab="${t}"]`);
      if (tabEl) tabEl.click();
      const fix = document.querySelector('[data-import-fixture]');
      if (fix) fix.click();
    }, tab);
    await page.waitForTimeout(200);
    await page.evaluate(() => {
      const preview = document.querySelector('[data-import-preview]');
      if (preview) preview.click();
    });
    await page.waitForSelector('#ds-import-preview:not([hidden])', { timeout: 5000 });
    const previewRows = await page.locator('#ds-import-preview-body tbody tr').count();
    check(`import preview rows (${tab})`, previewRows === EXPECTED_IMPORT_ROWS[tab], `expected ${EXPECTED_IMPORT_ROWS[tab]}, rows=${previewRows}`);
    await page.evaluate(() => {
      const apply = document.querySelector('[data-import-apply]');
      if (apply) apply.click();
    });
    await page.waitForTimeout(300);
  }
  const registryAfterImport = await page.locator('#ds-registry-body tr[data-ds-row]').count();
  check('imported datasets added to registry (4 formats)', registryAfterImport >= registryBeforeImport + 4, `${registryBeforeImport} → ${registryAfterImport}`);

  // 9) درج المقارنة: SBG v1 vs v2 diff (3 تعديلات).
  await page.evaluate(() => {
    const cmp = document.querySelector('[data-ds-action="compare"][data-ds-id="ds-sbg-v1"]');
    if (cmp) cmp.click();
  });
  await page.waitForSelector('#ds-compare[aria-hidden="false"]', { timeout: 5000 });
  const diffRows = await page.locator('.ds-diff-row').count();
  check('compare drawer diff rows', diffRows >= 3, `rows=${diffRows}`);
  await page.evaluate(() => {
    const close = document.querySelector('[data-ds-compare-close]');
    if (close) close.click();
  });

  // 10) لا أخطاء console حقيقية.
  const KNOWN_CSP = /frame-ancestors|report-uri|X-Frame-Options/i;
  const realErrors = consoleErrors.filter((e) => !KNOWN_CSP.test(e));
  check('no console errors', realErrors.length === 0, realErrors.join(' | ').slice(0, 300));

  await page.screenshot({ path: '/tmp/opencode/kernel-datasets.png', fullPage: true });

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
  if (failed.length > 0) {
    failed.forEach((f) => console.log(`  ❌ ${f.name}`));
    process.exit(1);
  }
  process.exit(0);
} catch (err) {
  console.error('❌ Playwright run crashed:', err.message);
  await page.screenshot({ path: '/tmp/opencode/kernel-datasets-fail.png', fullPage: true }).catch(() => {});
  process.exit(1);
} finally {
  await browser.close();
}
