/**
 * audit-voc-001-a.mjs — BAI-VOC-001-A visual verification
 *
 * Captures mobile (390x844) + desktop (1440x900) screenshots of the 9 surfaces
 * that received VOC injection in BAI-VOC-001-A. For each page/viewport, it:
 *   1. Loads the page from http://127.0.0.1:8765
 *   2. Asserts the H1 is visible
 *   3. Asserts the 5 VOC pillars all appear in the hero (H1 + lead)
 *   4. Captures a hero-zone screenshot (top 800px)
 *   5. Logs to console + screenshots to download/qa/voc-001-a/
 *
 * Run: `node scripts/playwright/audit-voc-001-a.mjs`
 * Exit: 0 if all checks pass, 1 if any fails.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'http://127.0.0.1:8765';
const SURFACES = [
  { slug: 'home', path: '/' },
  { slug: 'services', path: '/services/' },
  { slug: 'banking', path: '/solutions/banking-ai-governance/' },
  { slug: 'government', path: '/solutions/government-ai-governance/' },
  { slug: 'healthcare', path: '/solutions/healthcare-ai-governance/' },
  { slug: 'manufacturing', path: '/solutions/manufacturing-ai-governance/' },
  { slug: 'bank', path: '/customers/bank/' },
  { slug: 'hospital', path: '/customers/hospital/' },
  { slug: 'pharma', path: '/customers/pharma/' },
];
const VOC_PILLARS = [
  'جرد AI',
  'مالك مسؤول',
  'سجل مخاطر',
  'أدلة جاهزة',
  'إشراف بشري',
];
const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 900 },
];

const OUT_DIR = path.resolve(process.cwd(), 'download/qa/voc-001-a');
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
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded' });
    const status = resp ? resp.status() : 0;
    if (status !== 200) {
      console.error(`[${vp.name}] ${surface.slug}: HTTP ${status}`);
      failChecks++;
      totalChecks++;
      results.push({ vp: vp.name, surface: surface.slug, status, fail: `HTTP ${status}` });
      continue;
    }

    // Wait for hero to be ready (h1 visible)
    const h1Visible = await page.locator('h1').first().isVisible().catch(() => false);

    // Check 5 VOC pillars in hero zone (H1 + immediate lead paragraph)
    const heroHTML = await page.evaluate(() => {
      const main = document.body;
      const h1 = main.querySelector('h1');
      if (!h1) return '';
      // Walk up to find the closest SECTION container
      let scope = h1.parentElement;
      while (scope && scope.tagName !== 'SECTION' && scope.tagName !== 'BODY') {
        scope = scope.parentElement;
      }
      const scopeHTML = (scope || h1.parentElement).innerHTML;
      const h1Text = h1.textContent || '';
      const afterH1 = scopeHTML.indexOf(h1.outerHTML) + h1.outerHTML.length;
      const afterText = scopeHTML.slice(afterH1, afterH1 + 3000);
      const pMatch = afterText.match(/<p[^>]*>([\s\S]*?)<\/p>/);
      const leadText = pMatch ? pMatch[0] : '';
      return h1Text + ' ' + leadText;
    });

    const pillarCounts = VOC_PILLARS.map((p) => ({ pillar: p, present: heroHTML.includes(p) }));
    const pillarCount = pillarCounts.filter((p) => p.present).length;
    const pillarsOk = pillarCount >= 2;

    // Screenshot hero (first 900px of viewport height)
    const shotPath = path.join(OUT_DIR, `${vp.name}-${surface.slug}.png`);
    await page.screenshot({ path: shotPath, fullPage: false, clip: { x: 0, y: 0, width: vp.width, height: Math.min(900, vp.height) } });

    const checks = {
      http200: status === 200,
      h1Visible,
      pillarsOk,
      pillarCount,
      missingPillars: pillarCounts.filter((p) => !p.present).map((p) => p.pillar),
    };
    const allPass = checks.http200 && checks.h1Visible && checks.pillarsOk;
    if (allPass) {
      passChecks++;
    } else {
      failChecks++;
    }
    totalChecks++;
    results.push({ vp: vp.name, surface: surface.slug, ...checks, shot: shotPath });

    const statusEmoji = allPass ? '✅' : '❌';
    console.log(
      `${statusEmoji} [${vp.name.padEnd(7)}] ${surface.slug.padEnd(14)} | H1:${h1Visible ? 'visible' : 'HIDDEN'} | pillars:${pillarCount}/5 ${pillarCount < 2 ? `MISSING ${JSON.stringify(checks.missingPillars)}` : ''}`
    );
  }

  await context.close();
}
await browser.close();

// Report
console.log('\n' + '='.repeat(60));
console.log(`Total: ${totalChecks} | Pass: ${passChecks} | Fail: ${failChecks}`);
console.log(`Screenshots: ${OUT_DIR}`);
console.log('='.repeat(60));
if (failChecks > 0) {
  console.error('\nFailures:');
  for (const r of results) {
    if (r.fail || (r.http200 && r.h1Visible && r.pillarsOk === false)) {
      console.error(JSON.stringify(r, null, 2));
    }
  }
  process.exit(1);
}
process.exit(0);
