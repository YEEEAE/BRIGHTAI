#!/usr/bin/env node
/**
 * check-mobile-375.mjs — QA 375px viewport audit
 * 
 * يفحص 3 صفحات على 375px (mobile) + 1440px (desktop):
 *   - overflow-x (page-wide horizontal scroll)
 *   - touch target sizes (≥44x44px للعناصر التفاعلية)
 *   - visibility / presence of key a11y landmarks (main, h1, skip link)
 *   - screenshot PNG للصفحات الثلاث
 * 
 * Usage: node scripts/check-mobile-375.mjs [--live | --local]
 * 
 * Returns exit 1 لو في fail (overflow, touch target قصير، a11y مفقود).
 * يطبع output URLs للـ screenshots.
 */
import { chromium, devices } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const useLocal = args.includes('--local');
const useLive = args.includes('--live') || !useLocal; // default live

const BASE = useLocal ? 'http://localhost:4321' : 'https://brightai.site';
const OUT = path.join(process.cwd(), '_reports', 'mobile-375');
fs.mkdirSync(OUT, { recursive: true });

const PAGES = [
  { name: 'home', path: '/' },
  { name: 'solution', path: '/solutions/ai-firewall/' },
  { name: 'blog', path: '/blog/' },
];

const VIEWPORTS = [
  { name: 'mobile-375', width: 375, height: 812 },
  { name: 'desktop-1440', width: 1440, height: 900 },
];

const results = [];

const browser = await chromium.launch();

for (const vp of VIEWPORTS) {
  for (const p of PAGES) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.width <= 414 ? 2 : 1,
      isMobile: vp.width <= 414,
      hasTouch: vp.width <= 414,
      locale: 'ar-SA',
    });
    const page = await ctx.newPage();
    const url = `${BASE}${p.path}`;

    let pageError = null;
    const issues = [];
    const screenPath = path.join(OUT, `${vp.name}-${p.name}.png`);

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    } catch (err) {
      pageError = err.message;
    }

    if (!pageError) {
      // 1. overflow-x detection
      const overflow = await page.evaluate(() => ({
        docWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        bodyWidth: document.body.scrollWidth,
      }));
      const overflowAmount = overflow.docWidth - overflow.clientWidth;
      if (overflowAmount > 0) {
        issues.push({
          type: 'overflow-x',
          detail: `doc=${overflow.docWidth} client=${overflow.clientWidth} diff=${overflowAmount}px`,
        });
      }

      // 2. touch target sizes — تفاعلية فقط (a, button) ≥ 44px
      const targetSizes = await page.evaluate(() => {
        const sel = 'a, button, [role="button"], input[type="submit"], input[type="button"]';
        const els = Array.from(document.querySelectorAll(sel));
        const small = [];
        els.forEach((el) => {
          const rect = el.getBoundingClientRect();
          const visible = rect.width > 0 && rect.height > 0;
          if (!visible) return;
          if (rect.width < 44 || rect.height < 44) {
            const txt = (el.innerText || el.textContent || '').slice(0, 30).trim();
            small.push({
              tag: el.tagName.toLowerCase(),
              href: el.href?.slice(0, 50) || '',
              w: Math.round(rect.width),
              h: Math.round(rect.height),
              text: txt,
            });
          }
        });
        return { total: els.length, small };
      });
      if (vp.width <= 414 && targetSizes.small.length > 0) {
        // نبلغ بالأول 3 فقط (info, not fail)
        issues.push({
          type: 'small-touch-targets',
          detail: `${targetSizes.small.length}/${targetSizes.total} أصغر من 44px (eye-balling فقط — النص المختصر لا يضمن زر، الـ icon-only نعتبره مقبول إذا > 32px)`,
          sample: targetSizes.small.slice(0, 3),
        });
      }

      // 3. a11y landmarks
      const a11y = await page.evaluate(() => ({
        skipLink: !!document.querySelector('a.skip-to-content, a[href="#main-content"]'),
        main: !!document.querySelector('main, [role="main"]'),
        h1Count: document.querySelectorAll('h1').length,
        h1Text: document.querySelector('h1')?.innerText?.slice(0, 100) || '',
        lang: document.documentElement.lang,
        dir: document.documentElement.dir,
        titleLen: document.title.length,
      }));
      if (!a11y.skipLink) issues.push({ type: 'a11y', detail: 'no skip-link' });
      if (!a11y.main) issues.push({ type: 'a11y', detail: 'no <main>' });
      if (a11y.h1Count !== 1) issues.push({ type: 'a11y', detail: `h1 count = ${a11y.h1Count} (should be 1)` });
      if (!a11y.lang || !['ar', 'en'].includes(a11y.lang)) issues.push({ type: 'a11y', detail: `lang="${a11y.lang}"` });
      if (!a11y.dir || !['rtl', 'ltr'].includes(a11y.dir)) issues.push({ type: 'a11y', detail: `dir="${a11y.dir}"` });

      // 4. screenshot
      await page.screenshot({ path: screenPath, fullPage: false });
    }

    results.push({
      page: p.name,
      viewport: vp.name,
      url,
      error: pageError,
      issues,
      screenshot: screenPath.replace(process.cwd() + '/', ''),
    });

    await ctx.close();
  }
}

await browser.close();

// طباعة تقرير
console.log('\n╔════════════════════════════════════════════╗');
console.log('║ Mobile / Desktop QA Report                 ║');
console.log('╚════════════════════════════════════════════╝\n');
let totalIssues = 0;
for (const r of results) {
  console.log(`\n[${r.viewport.padEnd(13)}] ${r.page.padEnd(10)} ${r.url}`);
  if (r.error) {
    console.log(`  ❌ LOAD ERROR: ${r.error.slice(0, 80)}`);
    totalIssues++;
  } else {
    for (const i of r.issues) {
      console.log(`  ⚠️  ${i.type}: ${i.detail}`);
      if (i.sample) console.log(`     sample: ${JSON.stringify(i.sample)}`);
      totalIssues++;
    }
    console.log(`  📸 ${r.screenshot}`);
  }
}
console.log(`\nTOTAL ISSUES: ${totalIssues}\n`);

// حفظ JSON
fs.writeFileSync(
  path.join(OUT, 'report.json'),
  JSON.stringify(results, null, 2)
);

process.exit(totalIssues > 0 ? 1 : 0);
