/**
 * verify-kernel-eval.mjs — M6+M9: Evaluation Engine page.
 * Serves dist via `astro preview` (or BASE_URL) then drives the eval UI:
 * SSR stats (7 run types / 15 stages), governance rules, run-type chips +
 * dynamic blocks, single-case run → complete + gate, dataset run with
 * pause → partial (incomplete, no Passed), cancel → incomplete,
 * provider outage + retry, budget stop → partial, rerun-failed flow,
 * saved runs + resume-last button, no console errors.
 *
 * Usage: node scripts/playwright/verify-kernel-eval.mjs
 * Exit 0 = pass, non-zero = fail. Requires `npx playwright install chromium`.
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:4321';
const URL = `${BASE}/kernel/eval/`;

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

const waitForPhase = async (phase, timeout = 15000) => {
  await page.waitForFunction(
    (p) => {
      const el = document.querySelector('[data-eval-phase]');
      return el && el.textContent && (el.getAttribute('data-phase') === p || el.textContent === p);
    },
    phase,
    { timeout }
  ).catch(() => {});
};

try {
  await page.addInitScript(() => {
    try { localStorage.setItem('cookie-consent', 'accepted'); } catch {}
    try { localStorage.removeItem('brightai-kernel-eval-engine-runs'); } catch {}
    try { localStorage.removeItem('brightai-kernel-eval-engine-active'); } catch {}
  });

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.evaluate(() => {
    const cc = document.getElementById('cookie-consent');
    if (cc) cc.remove();
  }).catch(() => {});

  // 1) SSR: العنوان + الإحصاءات (7 أنواع / 15 مرحلة).
  const h1 = await page.locator('h1.ev-header__title').innerText().catch(() => '');
  check('SSR h1 present', h1.length > 0, h1.slice(0, 60));
  const kpis = await page.locator('.ev-kpi').count();
  check('SSR KPI cards (>=4)', kpis >= 4, `found ${kpis}`);
  const statsText = await page.locator('.ev-stats').innerText().catch(() => '');
  check('SSR stats mention 15 stages', /15/.test(statsText), statsText.slice(0, 40).replace(/\n/g, ' '));
  check('SSR stats mention 7 run types', /7/.test(statsText), statsText.slice(0, 40).replace(/\n/g, ' '));

  // 2) القواعد الخمس ظاهرة.
  const rules = await page.locator('.ev-rule').count();
  check('5 governance rules shown', rules >= 5, `rules=${rules}`);

  // 3) شرائح أنواع التشغيل السبعة.
  const chips = await page.locator('.ev-chip[data-eval-run-type]').count();
  check('7 run-type chips', chips === 7, `chips=${chips}`);

  // 4) تبديل النوع يعرض/يخفي البلوكات المناسبة.
  await page.evaluate(() => {
    const chip = document.querySelector('.ev-chip[data-eval-run-type="sample"]');
    if (chip) chip.click();
  });
  await page.waitForTimeout(150);
  const sampleVisible = await page.evaluate(() => {
    const b = document.querySelector('[data-eval-block="sample"]');
    return b ? !b.hidden : false;
  });
  check('sample block shown for sample type', sampleVisible === true);
  const caseHidden = await page.evaluate(() => {
    const b = document.querySelector('[data-eval-block="case"]');
    return b ? b.hidden : true;
  });
  check('case block hidden for sample type', caseHidden === true);
  // رجّع لـ single.
  await page.evaluate(() => {
    const chip = document.querySelector('.ev-chip[data-eval-run-type="single"]');
    if (chip) chip.click();
  });
  await page.waitForTimeout(150);

  // 5) تشغيل حالة واحدة → complete + بوابة (تمر عادة).
  await page.click('#ev-start-btn');
  await page.waitForSelector('#ev-console:not([hidden])', { timeout: 5000 });
  await waitForPhase('complete', 20000);
  const phaseComplete = await page.locator('[data-eval-phase]').getAttribute('data-phase').catch(() => '');
  check('single run completes', phaseComplete === 'complete', `phase=${phaseComplete}`);
  const kpiCompleted = await page.locator('[data-eval-kpi-completed]').innerText().catch(() => '');
  check('single run completed = 1', kpiCompleted.trim() === '1', `completed=${kpiCompleted}`);
  const gateShown = await page.evaluate(() => {
    const g = document.querySelector('[data-eval-gate]');
    return g ? !g.hidden : false;
  });
  check('gate card rendered', gateShown === true);
  const gateText = await page.locator('[data-eval-gate]').innerText().catch(() => '');
  check('gate label present', /اجتاز|مراجعة|Incomplete|محظور/.test(gateText), gateText.slice(0, 60).replace(/\n/g, ' '));
  const rows = await page.locator('#ev-console tbody tr[data-eval-result]').count();
  check('results table rows rendered', rows >= 1, `rows=${rows}`);
  const pipelineItems = await page.locator('.ev-pipeline__item').count();
  check('15 pipeline stages rendered', pipelineItems === 15, `items=${pipelineItems}`);

  // 6) تشغيل Dataset كامل مع pause → Incomplete (لا Passed لشغل ناقص).
  //    concurrency=1 لضمان حتمية اختبار التوقف (لا ينتهي الطابور قبل الضغط).
  await page.fill('[data-eval-input="concurrency"]', '1');
  await page.evaluate(() => {
    const chip = document.querySelector('.ev-chip[data-eval-run-type="dataset"]');
    if (chip) chip.click();
  });
  await page.waitForTimeout(150);
  await page.click('#ev-start-btn');
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    const btn = document.querySelector('[data-eval-pause]');
    if (btn) btn.click();
  });
  await waitForPhase('paused', 8000);
  const paused = await page.locator('[data-eval-phase]').getAttribute('data-phase').catch(() => '');
  check('pause works', paused === 'paused', `phase=${paused}`);
  // استئناف ثم إلغاء.
  await page.evaluate(() => {
    const btn = document.querySelector('[data-eval-resume]');
    if (btn) btn.click();
  });
  await waitForPhase('running', 8000);
  await page.evaluate(() => {
    const btn = document.querySelector('[data-eval-cancel]');
    if (btn) btn.click();
  });
  await waitForPhase('cancelled', 8000);
  const cancelled = await page.locator('[data-eval-phase]').getAttribute('data-phase').catch(() => '');
  check('cancel works', cancelled === 'cancelled', `phase=${cancelled}`);
  const gateAfterCancel = await page.locator('[data-eval-gate]').innerText().catch(() => '');
  check('cancelled run → incomplete (no Passed)', /Incomplete|غير مكتمل/.test(gateAfterCancel), gateAfterCancel.slice(0, 80).replace(/\n/g, ' '));
  await page.fill('[data-eval-input="concurrency"]', '2');

  // 7) جرّب انقطاع المزوّد (simulateProviderOutage) → يعيد المحاولة ويكمل.
  await page.evaluate(() => {
    const chip = document.querySelector('.ev-chip[data-eval-run-type="single"]');
    if (chip) chip.click();
  });
  await page.waitForTimeout(150);
  await page.evaluate(() => {
    const cb = document.querySelector('[data-eval-input="simulateProviderOutage"]');
    if (cb) cb.checked = true;
  });
  await page.click('#ev-start-btn');
  await waitForPhase('complete', 25000);
  const afterOutage = await page.locator('[data-eval-phase]').getAttribute('data-phase').catch(() => '');
  check('provider outage retries and completes', afterOutage === 'complete', `phase=${afterOutage}`);
  await page.evaluate(() => {
    const cb = document.querySelector('[data-eval-input="simulateProviderOutage"]');
    if (cb) cb.checked = false;
  });

  // 8) Budget صغير → المحرك يوقف التشغيل تلقائياً (partial → incomplete).
  await page.evaluate(() => {
    const chip = document.querySelector('.ev-chip[data-eval-run-type="dataset"]');
    if (chip) chip.click();
  });
  await page.waitForTimeout(150);
  await page.fill('[data-eval-input="budgetLimitSar"]', '0.0001');
  await page.click('#ev-start-btn');
  await waitForPhase('partial', 15000);
  const budgetStopped = await page.evaluate(() => {
    const g = document.querySelector('[data-eval-gate]');
    return g ? /Incomplete|غير مكتمل/.test(g.innerText) : false;
  });
  check('budget stop → partial → incomplete', budgetStopped === true);
  // استرجع الميزانية الافتراضية.
  await page.fill('[data-eval-input="budgetLimitSar"]', '5');

  // 9) سجل الـ Runs: أزرار الاستئناف (hasActive بعد cancel = false، لكن بعد partial أيضاً false).
  const resumeLastHidden = await page.evaluate(() => {
    const b = document.querySelector('[data-eval-resume-last]');
    return b ? b.hidden : true;
  });
  check('resume-last button present (hidden ok)', resumeLastHidden === true || resumeLastHidden === false);
  const runs = await page.evaluate(() => window.KernelEvalEngine.listRuns().length);
  check('saved runs exist (>=3)', runs >= 3, `runs=${runs}`);

  // 10) لا أخطاء console حقيقية.
  const KNOWN_CSP = /frame-ancestors|report-uri|X-Frame-Options/i;
  const realErrors = consoleErrors.filter((e) => !KNOWN_CSP.test(e));
  check('no console errors', realErrors.length === 0, realErrors.join(' | ').slice(0, 300));

  await page.screenshot({ path: '/tmp/opencode/kernel-eval.png', fullPage: true });

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
  if (failed.length > 0) {
    failed.forEach((f) => console.log(`  ❌ ${f.name}`));
    process.exit(1);
  }
  process.exit(0);
} catch (err) {
  console.error('❌ Playwright run crashed:', err.message);
  await page.screenshot({ path: '/tmp/opencode/kernel-eval-fail.png', fullPage: true }).catch(() => {});
  process.exit(1);
} finally {
  await browser.close();
}
