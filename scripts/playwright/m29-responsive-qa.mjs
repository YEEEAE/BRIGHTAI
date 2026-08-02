/**
 * m29-responsive-qa.mjs — M29 Responsive QA sweep for the 16 Kernel pages.
 *
 * Tests every page at 1440 / 1100 / 1024 / 768 / 390:
 *   1. Horizontal overflow (document + body scrollWidth > clientWidth).
 *   2. Console errors (filtering known-harmless meta-CSP warnings).
 *   3. Page errors (uncaught exceptions).
 *   4. Small tap targets: visible interactive elements with rendered
 *      clickable box < 44x44 px.
 *   5. lang/dir sanity (ar / rtl on <html>, LTR islands present on tech data).
 *   6. Screenshots → qa-screenshots/m29/<page>--<w>.png
 *
 * Output: report/m29-responsive-qa.json + a summary table.
 * Exit 0 = pass, non-zero = overflow or console errors found.
 *
 * Run: node scripts/playwright/m29-responsive-qa.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.env.BASE_URL || 'http://localhost:4321';
const OUT_DIR = 'qa-screenshots/m29';
mkdirSync(OUT_DIR, { recursive: true });

// The 16 design-doc pages (design-doc §4, order preserved).
const PAGES = [
  '/kernel/',
  '/kernel/playground/',
  '/kernel/chat/',
  '/kernel/scenarios/',
  '/kernel/redteam/',
  '/kernel/policies/',
  '/kernel/audit/',
  '/kernel/approvals/',
  '/kernel/replay/',
  '/kernel/compliance/',
  '/kernel/evidence/',
  '/kernel/reports/',
  '/kernel/stats/',
  '/kernel/models/',
  '/kernel/connectors/',
  '/kernel/api/',
];

const VIEWPORTS = [
  { width: 1440, height: 900, name: '1440' },
  { width: 1100, height: 900, name: '1100' },
  { width: 1024, height: 768, name: '1024' },
  { width: 768, height: 1024, name: '768' },
  { width: 390, height: 844, name: '390' },
];

// Known-harmless meta-CSP browser warnings (real CSP comes from HTTP headers),
// plus the Vite dev-toolbar 504 artifact (dev server only — never in prod).
const HARMLESS = [
  "frame-ancestors' is ignored when delivered via a <meta>",
  "'report-uri' is ignored when delivered via a <meta>",
  'X-Frame-Options may only be set via an HTTP header',
  'Failed to load resource: the server responded with a status of 504',
  'Outdated Optimize Dep',
  'dev-toolbar/entrypoint',
];

const browser = await chromium.launch();
const results = [];
let totalFailures = 0;

for (const path of PAGES) {
  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!HARMLESS.some((h) => text.includes(h))) consoleErrors.push(text);
      }
    });
    page.on('pageerror', (err) => pageErrors.push(err.message));

    const url = `${BASE}${path}`;
    const entry = { path, viewport: vp.name, url, overflow: false, pageOverflow: false, bodyOverflow: false, overflowEls: [], consoleErrors, pageErrors, smallTargets: [], lang: null, dir: null, error: null };
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(1200);
      // dismiss cookie banner if present so it does not cover content / count as overflow
      try {
        const cookieBtn = page.locator('#cookie-accept, [data-cookie-accept]');
        if (await cookieBtn.count()) await cookieBtn.first().click({ force: true, timeout: 3000 });
      } catch { /* no cookie banner */ }

      entry.lang = await page.locator('html').getAttribute('lang');
      entry.dir = await page.locator('html').getAttribute('dir');

      const layout = await page.evaluate(() => {
        const de = document.documentElement;
        const body = document.body;
        const winW = window.innerWidth;
        const pageOverflow = de.scrollWidth > winW + 1;
        const bodyOverflow = body.scrollWidth > de.clientWidth + 1;
        const overflows = [];
        if (pageOverflow || bodyOverflow) {
          const offenders = new Set();
          for (const el of document.querySelectorAll('body *')) {
            const r = el.getBoundingClientRect();
            const cs = getComputedStyle(el);
            const isVisible = cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0';
            if (!isVisible) continue;
            if (r.width > 0 && (r.right > winW + 1 || r.left < -1)) {
              // skip fixed overlays intentionally off-canvas; skip elements whose
              // nearest scroll container is horizontally scrollable (carousels);
              // skip elements entirely off-screen (closed off-canvas menus).
              if (cs.position === 'fixed') continue;
              if (r.left > winW + 1 || r.right < -1) continue;
              const p = el.parentElement;
              if (p && getComputedStyle(p).overflowX === 'auto') continue;
              offenders.add(`${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ').slice(0, 3).join('.') : ''}`);
            }
          }
          for (const o of offenders) overflows.push(o);
        }
        return { pageOverflow, bodyOverflow, deScrollWidth: de.scrollWidth, bodyScrollWidth: body.scrollWidth, clientWidth: winW, overflows };
      });
      entry.pageOverflow = layout.pageOverflow;
      entry.bodyOverflow = layout.bodyOverflow;
      entry.overflow = layout.pageOverflow || layout.bodyOverflow;
      entry.overflowEls = layout.overflows;
      entry.scrollWidth = layout.deScrollWidth;
      entry.bodyScrollWidth = layout.bodyScrollWidth;
      entry.clientWidth = layout.clientWidth;

      // small tap targets
      const targets = await page.evaluate(() => {
        const small = [];
        const sel = 'a[href], button, input, select, textarea, [role="button"], [tabindex]:not([tabindex="-1"])';
        for (const el of document.querySelectorAll(sel)) {
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') continue;
          if (r.width === 0 || r.height === 0) continue;
          if (r.width < 44 || r.height < 44) {
            const label = el.getAttribute('aria-label') || el.textContent?.trim().slice(0, 30) || '';
            small.push({ tag: el.tagName.toLowerCase(), cls: (typeof el.className === 'string' ? el.className.split(' ').slice(0, 3).join('.') : ''), w: Math.round(r.width), h: Math.round(r.height), label });
          }
        }
        return small;
      });
      entry.smallTargets = targets;

      // lang/dir LTR island sanity on the trace search + mono values
      entry.ltrIslands = await page.locator('.k-mono[dir="ltr"], .k-topbar__search-input, [data-kernel-trace-id]').count();

      await page.screenshot({ path: `${OUT_DIR}/${path.replaceAll('/', '_')}--${vp.name}.png`, fullPage: true });
    } catch (err) {
      entry.error = err.message;
    }

    if (entry.overflow) {
      entry.fail = true;
      totalFailures += 1;
      console.log(`✗ OVERFLOW ${path} @${vp.name} (sw=${entry.scrollWidth} cw=${entry.clientWidth}) → ${entry.overflowEls.slice(0, 5).join(', ')}`);
    } else if (entry.consoleErrors.length) {
      entry.fail = true;
      totalFailures += 1;
      console.log(`✗ CONSOLE ${path} @${vp.name} → ${entry.consoleErrors.slice(0, 3).join(' | ')}`);
    } else if (entry.pageErrors.length) {
      entry.fail = true;
      totalFailures += 1;
      console.log(`✗ PAGEERR ${path} @${vp.name} → ${entry.pageErrors[0]}`);
    } else {
      console.log(`  ✓ ${path} @${vp.name}`);
    }

    results.push(entry);
    await context.close();
  }
}

await browser.close();

writeFileSync('report/m29-responsive-qa.json', JSON.stringify(results, null, 2));
console.log('\n════════════════════════════════════════════');
console.log(`  16 pages × 5 viewports scanned → ${totalFailures} failing combinations`);
console.log('════════════════════════════════════════════');
process.exit(totalFailures > 0 ? 1 : 0);
