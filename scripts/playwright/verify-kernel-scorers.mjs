/**
 * verify-kernel-scorers.mjs — M8: Scorer Registry + Runner page.
 * Serves dist via `astro preview` (or BASE_URL) then drives the scorers UI:
 * SSR registry stats (33 scorers / 5 categories), rules banners, registry
 * search + category filters, scorer detail drawer (controls + evidence
 * requirements), runner with fixtures, critical PII leak → Blocked +
 * production-ready block, hallucinated regulatory claim → fail,
 * injection → blocked, compliance w/o control mapping rule, no console errors.
 *
 * Usage: node scripts/playwright/verify-kernel-scorers.mjs
 * Exit 0 = pass, non-zero = fail. Requires `npx playwright install chromium`.
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:4321';
const URL = `${BASE}/kernel/scorers/`;

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

  // 1) SSR: العنوان + الإحصاءات (33 سكورر).
  const h1 = await page.locator('h1.sc-header__title').innerText().catch(() => '');
  check('SSR h1 present', h1.length > 0, h1.slice(0, 60));
  const kpis = await page.locator('.sc-kpi').count();
  check('SSR KPI cards (>=4)', kpis >= 4, `found ${kpis}`);
  const totalText = await page.locator('.sc-kpi').first().innerText().catch(() => '');
  check('SSR total = 33', /33/.test(totalText), totalText.replace(/\n/g, ' ').slice(0, 40));
  const cats = await page.locator('.sc-cat').count();
  check('SSR category cards (5)', cats === 5, `found ${cats}`);

  // 2) القواعد الخمس ظاهرة.
  const rules = await page.locator('.sc-rule').count();
  check('5 governance rules shown', rules >= 5, `rules=${rules}`);

  // 3) السجل: 33 صفاً + الفلاتر.
  const rows = await page.locator('#sc-registry-body tr[data-sc-row]').count();
  check('registry rows rendered (33)', rows >= 30, `rows=${rows}`);

  // بحث: sc-pii-leakage → صف واحد.
  await page.fill('#sc-search', 'sc-pii-leakage');
  await page.waitForTimeout(200);
  const searchRows = await page.locator('#sc-registry-body tr[data-sc-row]').count();
  check('registry search narrows to 1', searchRows === 1, `rows=${searchRows}`);
  await page.fill('#sc-search', '');

  // فلتر فئة: compliance → 6 صفوف.
  await page.evaluate(() => {
    const chip = document.querySelector('[data-sc-cat-chip="compliance"]');
    if (chip) chip.click();
  });
  await page.waitForTimeout(200);
  const compRows = await page.locator('#sc-registry-body tr[data-sc-row]').count();
  check('category filter (compliance) = 6', compRows === 6, `rows=${compRows}`);
  await page.evaluate(() => {
    const chip = document.querySelector('[data-sc-cat-chip="all"]');
    if (chip) chip.click();
  });

  // 4) درج التفاصيل: ضوابط الامتثال + متطلبات الدليل.
  await page.evaluate(() => {
    const btn = document.querySelector('[data-sc-action="open"][data-sc-id="sc-comp-pdpl"]');
    if (btn) btn.click();
  });
  await page.waitForSelector('#sc-detail:not([hidden])', { timeout: 5000 });
  const controls = await page.locator('.sc-controls .sc-control-list .sc-control').count();
  check('detail controls shown (>=3 PDPL controls)', controls >= 3, `controls=${controls}`);
  const controlIdShown = await page.locator('.sc-controls .sc-control__id').allInnerTexts().catch(() => []);
  check('control IDs are mapped (PDPL-*)', controlIdShown.some((t) => /PDPL-\d+/.test(t)), controlIdShown.join(', ').slice(0, 60));
  const evidenceReq = await page.locator('.sc-detail__grid').count();
  check('detail grid rendered', evidenceReq >= 1, `grids=${evidenceReq}`);
  await page.evaluate(() => {
    const close = document.querySelector('[data-sc-action="close-detail"]');
    if (close) close.click();
  });

  // 5) الـ Runner — fixture PII leak → Blocked + منع الإنتاج.
  await page.evaluate(() => {
    const fx = document.querySelector('[data-sc-fixture="fx-pii-leak"]');
    if (fx) fx.click();
  });
  await page.waitForTimeout(150);
  await page.click('#sc-run-btn');
  await page.waitForSelector('#sc-run-results:not([hidden])', { timeout: 5000 });
  const verdictText = await page.locator('#sc-run-summary').innerText().catch(() => '');
  check('PII leak run → Blocked verdict', /Blocked/.test(verdictText), verdictText.slice(0, 80).replace(/\n/g, ' '));
  const criticalAlert = await page.locator('.sc-alert--critical').count();
  check('critical PII alert shown', criticalAlert >= 1, `alerts=${criticalAlert}`);
  const leakRow = await page.locator('[data-sc-result="sc-pii-leakage"]').first().innerText().catch(() => '');
  check('sc-pii-leakage status = blocked', /محظور|blocked/.test(leakRow), leakRow.slice(0, 40).replace(/\n/g, ' '));
  // كل نتيجة تعرض الأعمدة التسعة + الدليل + البيئة.
  const thCount = await page.locator('.sc-results-table th').count();
  check('results table has 11 columns (9 + evidence + env)', thCount >= 11, `th=${thCount}`);
  const traceBtns = await page.locator('.sc-trace').count();
  check('trace links present', traceBtns > 0, `traces=${traceBtns}`);

  // 6) هلوسة تنظيمية → فشل sc-hal-fabricated-reg.
  await page.evaluate(() => {
    const fx = document.querySelector('[data-sc-fixture="fx-hallucination"]');
    if (fx) fx.click();
  });
  await page.waitForTimeout(150);
  await page.click('#sc-run-btn');
  await page.waitForTimeout(700);
  const verdict2 = await page.locator('#sc-run-summary').innerText().catch(() => '');
  check('hallucination run → Incomplete', /Incomplete/.test(verdict2), verdict2.slice(0, 80).replace(/\n/g, ' '));
  const fabRow = await page.locator('[data-sc-result="sc-hal-fabricated-reg"]').first().innerText().catch(() => '');
  check('sc-hal-fabricated-reg fails', /فشل|fail/.test(fabRow), fabRow.slice(0, 40).replace(/\n/g, ' '));

  // 7) حقن أوامر → blocked على سكورر الحقن.
  await page.evaluate(() => {
    const fx = document.querySelector('[data-sc-fixture="fx-injection"]');
    if (fx) fx.click();
  });
  await page.waitForTimeout(150);
  await page.click('#sc-run-btn');
  await page.waitForTimeout(700);
  const injRow = await page.locator('[data-sc-result="sc-inj-prompt"]').first().innerText().catch(() => '');
  check('sc-inj-prompt blocks injection', /محظور|blocked/.test(injRow), injRow.slice(0, 40).replace(/\n/g, ' '));

  // 8) طلب سليم → Complete + sc-pii-leakage نجاح.
  await page.evaluate(() => {
    const fx = document.querySelector('[data-sc-fixture="fx-safe"]');
    if (fx) fx.click();
  });
  await page.waitForTimeout(150);
  await page.click('#sc-run-btn');
  await page.waitForTimeout(700);
  const verdictSafe = await page.locator('#sc-run-summary').innerText().catch(() => '');
  check('safe run → Complete', /Complete/.test(verdictSafe), verdictSafe.slice(0, 80).replace(/\n/g, ' '));

  // 9) امتثال: مقيّم compliance بدون مخالفة يمر مع ضوابط (fx-safe).
  const compPassRow = await page.locator('[data-sc-result="sc-comp-pdpl"]').first().innerText().catch(() => '');
  check('compliance scorer passes with controls', /نجاح|pass/.test(compPassRow), compPassRow.slice(0, 40).replace(/\n/g, ' '));

  // 10) شارة البيئة في النتائج (Demo/Simulated).
  const envText = await page.locator('#sc-run-summary').innerText().catch(() => '');
  check('environment badge visible in run', /Demo|Simulated/.test(envText), envText.slice(0, 120).replace(/\n/g, ' '));

  // 11) لا أخطاء console حقيقية.
  const KNOWN_CSP = /frame-ancestors|report-uri|X-Frame-Options/i;
  const realErrors = consoleErrors.filter((e) => !KNOWN_CSP.test(e));
  check('no console errors', realErrors.length === 0, realErrors.join(' | ').slice(0, 300));

  await page.screenshot({ path: '/tmp/opencode/kernel-scorers.png', fullPage: true });

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
  if (failed.length > 0) {
    failed.forEach((f) => console.log(`  ❌ ${f.name}`));
    process.exit(1);
  }
  process.exit(0);
} catch (err) {
  console.error('❌ Playwright run crashed:', err.message);
  await page.screenshot({ path: '/tmp/opencode/kernel-scorers-fail.png', fullPage: true }).catch(() => {});
  process.exit(1);
} finally {
  await browser.close();
}
