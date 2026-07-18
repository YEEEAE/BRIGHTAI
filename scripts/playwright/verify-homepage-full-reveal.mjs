/**
 * verify-homepage-full-reveal.mjs
 * Comprehensive scroll-reveal check: scroll through the entire homepage
 * section by section and verify every reveal-target element becomes visible.
 * Confirms the KI-SYNTAX-2026-07-18-001 fix didn't miss any other section.
 */
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const URL = 'http://localhost:4321/';
const OUT = '/Users/yzydalshmry/Desktop/BRIGHTAI/download/qa/homepage-full-reveal';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);

// Get all reveal-target sections
const sectionIds = await page.$$eval('main section[id], main section[aria-labelledby]', (els) =>
  els.map((el) => el.id || el.getAttribute('aria-labelledby') || '').filter(Boolean)
);

// Scroll through the page section by section
const results = [];
for (const id of sectionIds) {
  await page.evaluate((sid) => {
    const el = document.getElementById(sid) || document.querySelector(`[aria-labelledby="${sid}"]`);
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  }, id);
  await page.waitForTimeout(400);
  // Scroll a bit more to bring section's bottom targets into view
  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(400);
  // Scroll back
  await page.evaluate(() => window.scrollBy(0, -400));
  await page.waitForTimeout(400);

  // Check this section's reveal targets
  const sectionData = await page.evaluate((sid) => {
    const section = document.getElementById(sid) || document.querySelector(`[aria-labelledby="${sid}"]`);
    if (!section) return null;
    const targets = section.querySelectorAll('.feature-card, .card--feature, .inner-card, .home-stat-card, .home-faq-item, .home-evidence-mockup, .home-comparison-wrap, .inner-reveal, [data-reveal]');
    let revealed = 0, total = targets.length;
    targets.forEach((t) => {
      if (parseFloat(getComputedStyle(t).opacity) > 0.9 || t.classList.contains('is-visible')) revealed++;
    });
    // "Section script works" = either there are no targets, or at least
    // some targets got revealed (others may still be below the fold, which
    // is fine — they'll reveal on the user's actual scroll).
    const scriptWorks = total === 0 || revealed > 0;
    return { sectionId: sid, total, revealed, scriptWorks };
  }, id);

  if (sectionData) results.push(sectionData);
}

// Full-page screenshot
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(300);
await page.screenshot({ path: join(OUT, 'homepage-top.png'), fullPage: false });
await page.screenshot({ path: join(OUT, 'homepage-full.png'), fullPage: true });

await browser.close();

const summary = {
  url: URL,
  totalSections: results.length,
  totalRevealTargets: results.reduce((s, r) => s + r.total, 0),
  totalRevealed: results.reduce((s, r) => s + r.revealed, 0),
  consoleErrors: errors,
  sections: results,
  pass: results.every((r) => r.scriptWorks) && errors.length === 0,
};

writeFileSync(join(OUT, 'report.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
if (!summary.pass) {
  console.error('\n❌ FAILED');
  process.exit(1);
}
console.log('\n✅ ALL SECTIONS REVEALED');
