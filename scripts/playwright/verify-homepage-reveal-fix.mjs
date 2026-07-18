/**
 * verify-homepage-reveal-fix.mjs
 *
 * FIX-2026-07-18 (KI-SYNTAX-2026-07-18-001): verifies the homepage renders
 * the 6 problem-section feature cards and that the scroll-reveal observer
 * successfully adds .is-visible to them. Before the fix, all 6 cards
 * stayed at opacity:0 because the scroll-reveal.js inline `import` failed
 * with a SyntaxError, producing the long empty space after the
 * "كل شركة تبي AI…" section title.
 *
 * Checks:
 *   1. HTTP 200 from /
 *   2. 0 console errors (catches any remaining SyntaxError)
 *   3. All 6 problem-section feature cards are visible (opacity > 0.9)
 *   4. Each card has the canonical title text (positive content check)
 *   5. Footer renders (proves the page below the section is intact)
 *   6. Screenshot for visual confirmation
 */
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const URL = process.env.URL || 'http://127.0.0.1:4321/';
const OUT = '/Users/yzydalshmry/Desktop/BRIGHTAI/download/qa/homepage-reveal-fix';

const PROBLEM_TITLES = [
  'هل الموظف يرفع بيانات حساسة؟',
  'وش لو الـ AI أعطى جواب غلط؟',
  'وين سجل التدقيق؟',
  'هل متوافق مع PDPL؟',
  'هل AI يعدّل في الـ ERP بالغلط؟',
  'هل الطبيب/المحاسب يثق فيه؟',
];

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  locale: 'ar-SA',
});
const page = await context.newPage();

const consoleErrors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});
page.on('pageerror', (err) => {
  consoleErrors.push(`pageerror: ${err.message}`);
});

const response = await page.goto(URL, { waitUntil: 'networkidle', timeout: 30_000 });
const status = response?.status() ?? 0;

// Wait for scroll-reveal observer to reveal cards (IntersectionObserver fires
// immediately for above-viewport elements after initReveal runs on astro:page-load).
await page.waitForTimeout(1200);

const cards = await page.$$eval('#problem .feature-card', (els) =>
  els.map((el) => {
    const cs = window.getComputedStyle(el);
    return {
      title: el.querySelector('h3')?.textContent?.trim() || '',
      opacity: parseFloat(cs.opacity),
      hasIsVisible: el.classList.contains('is-visible'),
      transform: cs.transform,
    };
  }),
);

const footerRendered = await page.$('footer.footer') !== null;
const footerText = await page.$eval('footer.footer', (el) => el.textContent?.length || 0).catch(() => 0);

await page.screenshot({ path: join(OUT, 'homepage-full.png'), fullPage: true });
await page.screenshot({ path: join(OUT, 'problem-section.png'), clip: await page.$eval('#problem', (el) => {
  const r = el.getBoundingClientRect();
  return { x: r.x, y: r.y, width: r.width, height: r.height };
}).catch(() => ({ x: 0, y: 0, width: 1440, height: 900 })) });

await browser.close();

const results = {
  url: URL,
  status,
  consoleErrors,
  cardsFound: cards.length,
  cards: cards.map((c) => ({
    title: c.title,
    opacity: c.opacity,
    hasIsVisible: c.hasIsVisible,
    transform: c.transform,
  })),
  allCardsRevealed: cards.length === 6 && cards.every((c) => c.opacity > 0.9),
  allTitlesMatch: PROBLEM_TITLES.every((t) => cards.some((c) => c.title === t)),
  footerRendered,
  footerTextLen: footerText,
  pass:
    status === 200 &&
    consoleErrors.length === 0 &&
    cards.length === 6 &&
    cards.every((c) => c.opacity > 0.9) &&
    PROBLEM_TITLES.every((t) => cards.some((c) => c.title === t)) &&
    footerRendered,
};

writeFileSync(join(OUT, 'report.json'), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));

if (!results.pass) {
  console.error('\n❌ FAILED — see report.json');
  process.exit(1);
}
console.log('\n✅ ALL CHECKS PASS');
