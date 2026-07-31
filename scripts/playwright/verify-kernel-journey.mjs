// verify-kernel-journey.mjs — runtime check for the kernel journey theater:
// pause/resume wiring + 7-line narrative log (active lit, past dim).
// Usage: node scripts/playwright/verify-kernel-journey.mjs
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const port = 4422;
const SCENE_DURATION = 13000;
// Serve dist/client statically: the deny-list (src/server/deny-list.mjs) 404s
// /kernel/* in the Node standalone server, so astro preview cannot reach the
// page. Static serving isolates this test to the page's own JS/CSS behavior.
const preview = spawn('python3', ['-m', 'http.server', String(port)], { cwd: process.cwd() + '/dist/client', detached: true });

async function waitForPreview(timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch('http://localhost:' + port + '/kernel/');
      if (res.ok) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const consoleErrors = [];
page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
page.on('pageerror', (err) => consoleErrors.push('pageerror: ' + err.message));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok, detail });
  console.log((ok ? 'PASS' : 'FAIL') + ':', name, detail ? '| ' + detail : '');
};

try {
  if (!(await waitForPreview(20000))) throw new Error('preview server did not become ready');
  await page.goto('http://localhost:' + port + '/kernel/', { waitUntil: 'networkidle', timeout: 30000 });

  const trigger = page.locator('#kernel-journey-trigger');
  await trigger.evaluate((el) => el.click());

  const journey = page.locator('#kernel-journey');
  check('journey theater visible', await journey.isVisible(), 'hidden attr removed');

  const pauseBtn = page.locator('#kernel-journey-pause');
  const stageTitle = page.locator('#kernel-journey-stage .kernel-journey__scene-title');
  const narrativeLines = page.locator('#kernel-journey-narrative .kernel-journey__narrative-line');

  check('7 narrative lines rendered', await narrativeLines.count() === 7, 'count=' + await narrativeLines.count());
  check('scene 1 active initially', (await stageTitle.textContent()).includes('كتابة الطلب'), await stageTitle.textContent());

  const activeFirst = await page.evaluate(() => {
    const lines = Array.from(document.querySelectorAll('#kernel-journey-narrative .kernel-journey__narrative-line'));
    return { active: lines.filter((l) => l.classList.contains('kernel-journey__narrative-line--active')).length, past: lines.filter((l) => l.classList.contains('kernel-journey__narrative-line--past')).length, texts: lines.map((l) => l.textContent).filter(Boolean).length };
  });
  check('first narrative line lit (active=1, past=0)', activeFirst.active === 1 && activeFirst.past === 0, JSON.stringify(activeFirst));

  await pauseBtn.evaluate((el) => el.click());
  check('pause: aria-pressed=true', (await pauseBtn.getAttribute('aria-pressed')) === 'true');
  check('pause: label becomes استئناف', (await pauseBtn.textContent()).trim() === 'استئناف', await pauseBtn.textContent());

  await sleep(SCENE_DURATION + 1200);
  const pausedTitle = (await stageTitle.textContent());
  check('no advance while paused', pausedTitle.includes('كتابة الطلب'), pausedTitle);

  await pauseBtn.evaluate((el) => el.click());
  check('resume: aria-pressed=false', (await pauseBtn.getAttribute('aria-pressed')) === 'false');
  check('resume: label back to إيقاف مؤقت', (await pauseBtn.textContent()).trim() === 'إيقاف مؤقت');

  await sleep(SCENE_DURATION + 1200);
  const resumedTitle = (await stageTitle.textContent());
  check('advances after resume', resumedTitle.includes('اشتعال الـ Firewall'), resumedTitle);

  const activeSecond = await page.evaluate(() => {
    const lines = Array.from(document.querySelectorAll('#kernel-journey-narrative .kernel-journey__narrative-line'));
    return { active: lines.filter((l) => l.classList.contains('kernel-journey__narrative-line--active')).length, past: lines.filter((l) => l.classList.contains('kernel-journey__narrative-line--past')).length, texts: lines.map((l) => l.textContent).filter(Boolean).length };
  });
  check('narrative log grows (2 filled, 1 active, 1 past)', activeSecond.active === 1 && activeSecond.past === 1 && activeSecond.texts === 2, JSON.stringify(activeSecond));

  const stopBtn = page.locator('#kernel-journey-stop');
  await stopBtn.evaluate((el) => el.click());
  check('stop: journey hidden state reset (pressed=false)', (await pauseBtn.getAttribute('aria-pressed')) === 'false');

  const fresh = await page.evaluate(() => document.querySelector('#kernel-journey-stage').innerHTML);
  check('stage persists after stop (content retained)', fresh.length > 0);

  // Known pre-existing CSP meta warnings (injected by injectSecurityMeta on every
  // prerendered page — frame-ancestors/report-uri/X-Frame-Options via <meta> are
  // ignored by browsers but harmless). Exclude them from the console-error gate.
  const cspMetaWarnings = (msg) =>
    msg.includes("'frame-ancestors' is ignored") ||
    msg.includes("'report-uri' is ignored") ||
    msg.includes('X-Frame-Options may only be set via an HTTP header');
  const realErrors = consoleErrors.filter((e) => !cspMetaWarnings(e));
  check('no console errors', realErrors.length === 0, realErrors.join(' ; '));

  const failed = results.filter((r) => !r.ok);
  if (failed.length > 0) {
    console.error('FAILED checks:', failed.length);
    process.exit(1);
  }
  console.log('ALL CHECKS PASSED');
  process.exit(0);
} catch (e) {
  console.error('FAIL:', e.message);
  process.exit(1);
} finally {
  await browser.close();
  try { process.kill(-preview.pid, 'SIGTERM'); } catch {}
}
