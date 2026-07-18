/**
 * Visual audit screenshots — 2026-07-14
 * Captures desktop + mobile screenshots of every public non-Kernel page
 * for visual regression review after the RTL/inline-style cleanup.
 *
 * Saves to /Users/yzydalshmry/Desktop/BRIGHTAI/report/2026-07-14-visual-audit/screenshots/
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const BASE = 'http://localhost:4321';
const OUT = '/Users/yzydalshmry/Desktop/BRIGHTAI/report/2026-07-14-visual-audit/screenshots';

// Page list to audit (non-Kernel only, per task brief).
const PAGES = [
  { name: 'home',                  url: '/' },
  { name: 'about',                 url: '/about/' },
  { name: 'services',              url: '/services/' },
  { name: 'pricing',               url: '/pricing/' },
  { name: 'trust',                 url: '/trust/' },
  { name: 'demo',                  url: '/demo/' },
  { name: 'contact',               url: '/contact/' },
  { name: 'assessment',            url: '/assessment/ai-governance-readiness/' },
  { name: 'solutions-index',       url: '/solutions/' },
  { name: 'solution-sector',       url: '/solutions/healthcare-ai-governance/' },
  { name: 'solution-sector-city',  url: '/solutions/healthcare-ai-governance/jeddah/' },
  { name: 'solution-slug',         url: '/solutions/ai-firewall/' },
  { name: 'blog-index',            url: '/blog/' },
  { name: 'blog-post',             url: '/blog/ai-governance-saudi-arabia/' },
  { name: 'docs-index',            url: '/docs/' },
  { name: 'docs-page',             url: '/docs/ai-governance-saudi-arabia/' },
  { name: 'hub-index',             url: '/hub/' },
  { name: 'hub-page',              url: '/hub/solutions/' },
  { name: 'privacy-policy',        url: '/privacy-policy/' },
  { name: 'en-privacy-policy',     url: '/en/privacy-policy/' },
  { name: 'customers-index',       url: '/customers/' },
  { name: 'sales-deck',            url: '/sales-deck/' },
  { name: 'thank-you',             url: '/thank-you/' },
  { name: 'sitemap-page',          url: '/sitemap/' },
  { name: '404',                   url: '/this-page-does-not-exist/' },
];

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900,  isMobile: false },
  { name: 'mobile',  width: 390,  height: 844,  isMobile: true  },
];

async function main() {
  if (!existsSync(OUT)) {
    await mkdir(OUT, { recursive: true });
  }

  const browser = await chromium.launch();
  const results = [];

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
      isMobile: vp.isMobile,
      hasTouch: vp.isMobile,
    });

    for (const p of PAGES) {
      const page = await ctx.newPage();
      const url = BASE + p.url;
      const t0 = Date.now();
      try {
        const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
        const status = resp ? resp.status() : 0;
        // Wait an extra beat for fonts/animations to settle
        await page.waitForTimeout(800);
        const out = path.join(OUT, `${p.name}--${vp.name}.png`);
        await page.screenshot({ path: out, fullPage: true, animations: 'disabled' });
        const ms = Date.now() - t0;
        results.push({ page: p.name, viewport: vp.name, status, ms, ok: status < 400 });
        process.stdout.write(`  ${vp.name.padEnd(7)} ${p.name.padEnd(28)} ${status}  ${ms}ms\n`);
      } catch (err) {
        results.push({ page: p.name, viewport: vp.name, error: String(err.message), ok: false });
        process.stdout.write(`  ${vp.name.padEnd(7)} ${p.name.padEnd(28)} ERROR ${err.message}\n`);
      }
      await page.close();
    }
    await ctx.close();
  }

  await browser.close();

  // Write a manifest so the report can reference all artifacts.
  const manifestPath = path.join(OUT, '..', 'manifest.json');
  await writeFile(manifestPath, JSON.stringify({
    generated: new Date().toISOString(),
    base: BASE,
    pages: PAGES.length,
    viewports: VIEWPORTS.map(v => v.name),
    total: results.length,
    failed: results.filter(r => !r.ok).length,
    results,
  }, null, 2));

  const failed = results.filter(r => !r.ok).length;
  if (failed > 0) {
    console.error(`\n❌ ${failed} screenshot(s) failed.`);
    process.exit(1);
  } else {
    console.log(`\n✅ ${results.length} screenshots captured.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
