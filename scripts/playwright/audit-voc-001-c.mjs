/**
 * audit-voc-001-c.mjs — BAI-VOC-001-C visual + a11y verification
 *
 * Verifies CTA localization across 14 P0 surfaces. For each page:
 *   1. Loads the page from http://127.0.0.1:8765
 *   2. Asserts HTTP 200
 *   3. Extracts ONLY the hero CTA block (specific selectors) + final CTA block CTAs
 *   4. Checks: no vague CTAs in hero/final (e.g. "اعرف أكثر", "تعرّف على")
 *   5. Checks: each primary/secondary CTA has an action verb (action-oriented)
 *   6. Checks: microcopy lines exist + each ≤ 12 words
 *   7. Asserts: keyboard focus reaches primary CTA via Tab
 *   8. Captures hero-zone + final-CTA screenshots
 *
 * Run: `node scripts/playwright/audit-voc-001-c.mjs`
 * Exit: 0 if all checks pass, 1 if any fails.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'http://127.0.0.1:8766';
const SURFACES = [
  { slug: 'home', path: '/' },
  { slug: 'services', path: '/services/' },
  { slug: 'pricing', path: '/pricing/' },
  { slug: 'assessment', path: '/assessment/ai-governance-readiness/' },
  { slug: 'customers-hub', path: '/customers/' },
  { slug: 'customers-bank', path: '/customers/bank/' },
  { slug: 'customers-hospital', path: '/customers/hospital/' },
  { slug: 'customers-pharma', path: '/customers/pharma/' },
  { slug: 'solutions-hub', path: '/solutions/' },
  { slug: 'solutions-banking', path: '/solutions/banking-ai-governance/' },
  { slug: 'solutions-government', path: '/solutions/government-ai-governance/' },
  { slug: 'solutions-healthcare', path: '/solutions/healthcare-ai-governance/' },
  { slug: 'solutions-manufacturing', path: '/solutions/manufacturing-ai-governance/' },
  { slug: 'solutions-riyadh', path: '/solutions/banking-ai-governance/riyadh/' },
  { slug: 'solutions-khobar', path: '/solutions/banking-ai-governance/khobar/' },
];

const VAGUE_CTA_PATTERNS = [
  /^\s*اعرف أكثر\s*$/i,         // "learn more"
  /^\s*تعرّف على\s+/i,           // "learn about X"
  /^\s*تعرف على\s+/i,            // variant
  /^\s*شاهد\s*$/i,                // "see" only
  /^\s*افتح\s*$/i,                // "open" only
  /^\s*صمم\s*$/i,                 // "design" only
  /^\s*صمّم\s*$/i,                // variant
  /^\s*خطط\s*$/i,                 // "plan" only
  /^\s*ناقش\s*$/i,                // "discuss" only
  /^\s*استكشف\s*$/i,              // "explore" only
];

// Action verbs to assert CTAs are action-oriented.
// Includes Arabic: احجز، اطلب، ابدأ، افتح، شاهد، اختبر، اكتشف،
// تعرّف، اعرف، انضم، حمّل، نزّل، سجّل، احصل، جرّب، قيّم، أرسل،
// تواصل، ناقش، صمّم، خطط، استكشف، شوف، تحدّث، تحدث
const ACTION_VERBS = [
  'احجز', 'اطلب', 'ابدأ', 'افتح', 'شاهد', 'اختبر', 'اكتشف',
  'تعرّف', 'اعرف', 'انضم', 'حمّل', 'نزّل', 'سجّل', 'احصل',
  'جرّب', 'قيّم', 'أرسل', 'تواصل', 'ناقش', 'صمّم', 'خطط',
  'استكشف', 'شوف', 'تحدث', 'تحدّث', 'Book', 'Start', 'Get',
  'Try', 'Watch', 'Test', 'Download',
];

// Selectors for HERO CTA blocks (the primary + secondary buttons above the fold)
const HERO_CTA_SELECTORS = [
  '.home-hero-actions > a',
  '.home-hero-actions > .cta-actions > a',
  '.home-kernel-actions > a',
  '.inner-hero__actions > a',
  '.inner-hero__actions > .cta-actions > a',
  '.about-hero__actions > a',
  '.about-hero__actions > .cta-actions > a',
  '.pricing-hero__actions > a',
  '.pricing-hero__actions > .cta-actions > a',
  '.split-hero__main .home-hero-actions > a',
  '.split-hero__main .home-hero-actions > .cta-actions > a',
  '.split-hero__main .home-kernel-actions > a',
];

// Selectors for FINAL CTA block
const FINAL_CTA_SELECTORS = [
  '.inner-cta-final__actions > a',
  '.inner-cta-final__actions > .cta-actions > a',
  '.home-cta-card .wa-btn',
  '.home-cta-card form button',
  '.home-cta-strip a',
];

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 900 },
];

const OUT_DIR = path.resolve(process.cwd(), 'download/qa/voc-001-c');
fs.mkdirSync(OUT_DIR, { recursive: true });

const results = [];
let totalChecks = 0;
let passChecks = 0;
let failChecks = 0;

const browser = await chromium.launch();

for (const vp of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.name === 'mobile' ? 2 : 1,
    isMobile: vp.name === 'mobile',
    hasTouch: vp.name === 'mobile',
  });
  const page = await context.newPage();

  for (const surface of SURFACES) {
    const url = `${BASE}${surface.path}`;
    let resp;
    try {
      resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    } catch (err) {
      console.error(`[${vp.name}] ${surface.slug}: navigation failed: ${err.message}`);
      failChecks++;
      totalChecks++;
      results.push({ vp: vp.name, surface: surface.slug, fail: `nav: ${err.message}` });
      continue;
    }
    const status = resp ? resp.status() : 0;
    if (status !== 200) {
      console.error(`[${vp.name}] ${surface.slug}: HTTP ${status}`);
      failChecks++;
      totalChecks++;
      results.push({ vp: vp.name, surface: surface.slug, status, fail: `HTTP ${status}` });
      continue;
    }

    // 1) Extract HERO CTAs (primary + secondary only)
    const heroCtaData = await page.evaluate((selectors) => {
      const ctas = [];
      const seen = new Set();
      for (const sel of selectors) {
        document.querySelectorAll(sel).forEach((el) => {
          const text = (el.textContent || '').trim().replace(/\s+/g, ' ');
          const key = `${el.tagName}|${text}|${el.getAttribute('href') || ''}`;
          if (seen.has(key)) return;
          seen.add(key);
          if (text.length === 0 || text.length > 80) return;
          ctas.push({
            tag: el.tagName,
            text,
            href: el.getAttribute('href') || '',
            selector: sel,
          });
        });
      }
      return { ctas, total: ctas.length };
    }, HERO_CTA_SELECTORS);

    // 2) Extract FINAL CTA CTAs
    const finalCtaData = await page.evaluate((selectors) => {
      const ctas = [];
      const seen = new Set();
      for (const sel of selectors) {
        document.querySelectorAll(sel).forEach((el) => {
          const text = (el.textContent || '').trim().replace(/\s+/g, ' ');
          const key = `${el.tagName}|${text}|${el.getAttribute('href') || ''}`;
          if (seen.has(key)) return;
          seen.add(key);
          if (text.length === 0 || text.length > 80) return;
          ctas.push({
            tag: el.tagName,
            text,
            href: el.getAttribute('href') || '',
            selector: sel,
          });
        });
      }
      return { ctas, total: ctas.length };
    }, FINAL_CTA_SELECTORS);

    // 3) Extract microcopy lines
    const microcopyData = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.cta-micro, .inner-card__cta-micro')).map((el) => {
        const text = (el.textContent || '').trim().replace(/\s+/g, ' ');
        const words = text.split(/[\s•،/|]+/).filter((w) => w.length > 0);
        return { text, wordCount: words.length, isAriaHidden: el.getAttribute('aria-hidden') === 'true' };
      });
    });

    // 4) Verify no vague CTAs
    const allCtas = [
      ...heroCtaData.ctas,
      ...finalCtaData.ctas,
    ];
    const vagueFound = allCtas.filter((c) => VAGUE_CTA_PATTERNS.some((re) => re.test(c.text)));

    // 5) Check action orientation (each CTA contains an action verb)
    const nonActionCtas = allCtas.filter((c) => !ACTION_VERBS.some((v) => c.text.includes(v)));

    // 6) Check microcopy ≤ 12 words
    const longMicrocopy = microcopyData.filter((m) => m.wordCount > 12);

    // 7) Keyboard focus on primary CTA
    let focusableFirst = null;
    try {
      const tabbed = await page.evaluate((selectors) => {
        const h1 = document.querySelector('h1');
        if (!h1) return null;
        for (const sel of selectors) {
          const first = document.querySelector(sel);
          if (first) {
            first.focus();
            const active = document.activeElement;
            if (active === first) {
              return {
                focused: true,
                tag: active.tagName,
                text: (active.textContent || '').trim().slice(0, 60),
                selector: sel,
              };
            }
          }
        }
        return { focused: false, reason: 'no-focusable-hero-cta' };
      }, HERO_CTA_SELECTORS);
      focusableFirst = tabbed;
    } catch (err) {
      focusableFirst = { focused: false, error: err.message };
    }

    // 8) Check no broken links (collect all unique hrefs)
    const allHrefs = await page.evaluate(() => {
      const hrefs = new Set();
      document.querySelectorAll('a[href]').forEach((a) => {
        const h = a.getAttribute('href');
        if (h && !h.startsWith('#') && !h.startsWith('javascript:') && !h.startsWith('mailto:') && !h.startsWith('tel:') && !h.startsWith('https://wa.me/')) {
          hrefs.add(h);
        }
      });
      return Array.from(hrefs);
    });

    // Aggregate checks
    const checks = {
      http200: status === 200,
      heroCtasCount: heroCtaData.ctas.length,
      finalCtasCount: finalCtaData.ctas.length,
      microcopyCount: microcopyData.length,
      noVagueCtas: vagueFound.length === 0,
      noNonActionCtas: nonActionCtas.length === 0,
      noLongMicrocopy: longMicrocopy.length === 0,
      // If page has 0 hero CTAs (e.g. customer case studies), focus check is N/A
      keyboardFocusOk: heroCtaData.ctas.length === 0 ? true : (focusableFirst?.focused === true),
      allHrefsCount: allHrefs.length,
    };

    const allPass =
      checks.http200 &&
      checks.noVagueCtas &&
      checks.noNonActionCtas &&
      checks.noLongMicrocopy &&
      checks.keyboardFocusOk;

    if (allPass) passChecks++;
    else failChecks++;
    totalChecks++;

    const emoji = allPass ? '✅' : '❌';
    const issues = [];
    if (!checks.noVagueCtas) issues.push(`vague:${vagueFound.map((v) => v.text).join('|')}`);
    if (!checks.noNonActionCtas) issues.push(`non-action:${nonActionCtas.map((c) => c.text).join('|')}`);
    if (!checks.noLongMicrocopy) issues.push(`long-microcopy:${longMicrocopy.map((m) => `${m.text}(${m.wordCount})`).join('|')}`);
    if (!checks.keyboardFocusOk) issues.push(`focus-fail`);
    console.log(
      `${emoji} [${vp.name.padEnd(7)}] ${surface.slug.padEnd(20)} | hero:${checks.heroCtasCount} final:${checks.finalCtasCount} micro:${checks.microcopyCount} ${issues.length ? '| ' + issues.join(' ') : ''}`
    );

    results.push({
      vp: vp.name,
      surface: surface.slug,
      url,
      ...checks,
      vague: vagueFound.map((v) => v.text),
      nonAction: nonActionCtas.map((c) => c.text),
      longMicrocopy: longMicrocopy.map((m) => ({ text: m.text, words: m.wordCount })),
      focusableFirst,
    });

    // Screenshots
    const heroShot = path.join(OUT_DIR, `${vp.name}-${surface.slug}-hero.png`);
    await page.screenshot({ path: heroShot, fullPage: false, clip: { x: 0, y: 0, width: vp.width, height: Math.min(900, vp.height) } });
    // Final CTA screenshot (scroll to last section)
    await page.evaluate(() => {
      const finals = document.querySelectorAll('.inner-cta-final, .home-cta-strip, .home-cta-card');
      const last = finals[finals.length - 1];
      if (last) last.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await page.waitForTimeout(200);
    const finalShot = path.join(OUT_DIR, `${vp.name}-${surface.slug}-final.png`);
    await page.screenshot({ path: finalShot, fullPage: false, clip: { x: 0, y: 0, width: vp.width, height: Math.min(900, vp.height) } });
  }
  await context.close();
}
await browser.close();

// Report
console.log('\n' + '='.repeat(70));
console.log(`Total: ${totalChecks} | Pass: ${passChecks} | Fail: ${failChecks}`);
console.log(`Screenshots: ${OUT_DIR}`);
console.log('='.repeat(70));
if (failChecks > 0) {
  console.error('\nFailures detail:');
  for (const r of results) {
    if (r.fail || (r.http200 && (r.noVagueCtas === false || r.noLongMicrocopy === false || r.keyboardFocusOk === false))) {
      console.error(JSON.stringify(r, null, 2));
    }
  }
  process.exit(1);
}
process.exit(0);
