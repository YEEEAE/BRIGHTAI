// scripts/playwright/verify-pricing-cro.mjs
// BAI-CRO-003 (2026-07-18): Verify CRO-003 acceptance criteria for /pricing/
// - 3 offer cards present (Assessment, Pilot featured, Enterprise)
// - No "99 ريال" anchor in visible text
// - Comparison table has scope/caption and is keyboard-accessible
// - FAQ accordion renders
// - Decision helper section renders
// - All CTAs carry data-cta + data-position + data-page-type

import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

mkdirSync('download/qa/pricing-cro', { recursive: true });

const browser = await chromium.launch();
const results = { mobile: {}, desktop: {} };

for (const vp of [{ name: 'mobile', w: 390, h: 844 }, { name: 'desktop', w: 1440, h: 900 }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

  const res = await page.goto('http://localhost:4173/pricing/', { waitUntil: 'networkidle' });

  // Capture visible text (no scripts/styles)
  const visibleText = await page.evaluate(() => document.body.innerText);

  // Check offer cards
  const offerCards = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('article.card--pricing')).map((el) => ({
      name: el.querySelector('.card__pricing-name')?.textContent?.trim(),
      tagline: el.querySelector('.card__pricing-tagline')?.textContent?.trim(),
      price: el.querySelector('.card__pricing-price')?.textContent?.trim(),
      featured: el.classList.contains('card--pricing--featured'),
      badge: el.querySelector('.card__pricing-badge')?.textContent?.trim() || null,
      ctaText: el.querySelector('.card__pricing-cta')?.textContent?.trim(),
    }));
  });

  // Check CTAs data attributes
  const ctaData = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[data-cta]')).map((el) => ({
      text: el.textContent.trim().slice(0, 40),
      cta: el.getAttribute('data-cta'),
      position: el.getAttribute('data-position'),
      offer: el.getAttribute('data-offer') || null,
      pageType: el.getAttribute('data-page-type'),
    }));
  });

  // Check table
  const tableCheck = await page.evaluate(() => {
    const table = document.querySelector('.pricing-table');
    const wrap = document.querySelector('.pricing-table-wrap');
    if (!table || !wrap) return null;
    return {
      caption: table.querySelector('caption')?.textContent?.trim(),
      captionPresent: !!table.querySelector('caption'),
      colScopeCount: table.querySelectorAll('th[scope="col"]').length,
      rowScopeCount: table.querySelectorAll('th[scope="row"]').length,
      wrapRole: wrap.getAttribute('role'),
      wrapTabindex: wrap.getAttribute('tabindex'),
      wrapAriaLabel: wrap.getAttribute('aria-label'),
      rowCount: table.querySelectorAll('tbody tr').length,
    };
  });

  // Check 99 anchor absent
  const has99Anchor = /99\s*ريال/.test(visibleText);

  // Check FAQ
  const faqCheck = await page.evaluate(() => {
    const items = document.querySelectorAll('.pricing-faq details');
    return {
      count: items.length,
      firstOpen: items[0]?.hasAttribute('open') ?? false,
      titles: Array.from(items).slice(0, 3).map((el) => el.querySelector('summary span')?.textContent?.trim()),
    };
  });

  // Check decision helper
  const decisionHelperCheck = await page.evaluate(() => {
    return {
      present: !!document.querySelector('.pricing-decision-helper'),
      cardCount: document.querySelectorAll('.pricing-decision-card').length,
      cardTitles: Array.from(document.querySelectorAll('.pricing-decision-card h3')).map((el) => el.textContent.trim()),
    };
  });

  // Check h1 and hero
  const heroCheck = await page.evaluate(() => {
    return {
      h1: document.querySelector('h1')?.textContent?.trim(),
      eyebrow: document.querySelector('.pricing-hero__eyebrow')?.textContent?.trim(),
    };
  });

  // Schema check
  const schemaCheck = await page.evaluate(() => {
    const ld = document.querySelector('script[type="application/ld+json"][id="brightai-foundation-schema"]');
    if (!ld) return null;
    const obj = JSON.parse(ld.textContent);
    const graph = obj['@graph'] || [];
    return {
      totalNodes: graph.length,
      types: graph.map((n) => n['@type']),
      hasService: graph.some((n) => n['@type'] === 'Service'),
      serviceCount: graph.filter((n) => n['@type'] === 'Service').length,
      hasFAQ: graph.some((n) => n['@type'] === 'FAQPage'),
    };
  });

  await page.screenshot({ path: `download/qa/pricing-cro/${vp.name}.png`, fullPage: true });

  results[vp.name] = {
    httpStatus: res?.status(),
    consoleErrors,
    hero: heroCheck,
    offers: offerCards,
    offerCount: offerCards.length,
    has99Anchor,
    ctaCount: ctaData.length,
    ctaDataSummary: {
      uniqueCta: [...new Set(ctaData.map((c) => c.cta))],
      uniquePositions: [...new Set(ctaData.map((c) => c.position))],
      allHavePageType: ctaData.every((c) => c.pageType === 'pricing'),
    },
    table: tableCheck,
    faq: faqCheck,
    decisionHelper: decisionHelperCheck,
    schema: schemaCheck,
  };
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(results, null, 2));

// Acceptance criteria check
let allOk = true;
for (const [vp, r] of Object.entries(results)) {
  const issues = [];
  if (r.httpStatus !== 200) issues.push(`http ${r.httpStatus}`);
  if (r.has99Anchor) issues.push('99-anchor present');
  if (r.offerCount !== 3) issues.push(`offer count ${r.offerCount} ≠ 3`);
  if (!r.offers.find((o) => o.featured)) issues.push('no featured offer');
  if (r.ctaCount < 5) issues.push(`cta count ${rctaCount} < 5`);
  if (!r.ctaDataSummary.allHavePageType) issues.push('cta missing page-type');
  if (!r.table?.captionPresent) issues.push('table missing caption');
  if (r.table?.colScopeCount !== 4) issues.push(`table col-scope ${r.table?.colScopeCount} ≠ 4`);
  if (r.table?.wrapRole !== 'region') issues.push('table wrap not region');
  if (r.table?.wrapTabindex !== '0') issues.push('table wrap not tabbable');
  if (r.faq?.count < 8) issues.push(`faq count ${r.faq?.count} < 8`);
  if (!r.decisionHelper?.present) issues.push('decision helper missing');
  if (!r.schema?.hasService) issues.push('no Service schema');
  if (r.schema?.serviceCount !== 3) issues.push(`service schema count ${r.schema?.serviceCount} ≠ 3`);
  if (!r.schema?.hasFAQ) issues.push('no FAQPage schema');
  if (r.consoleErrors.length > 0) issues.push(`console errors: ${r.consoleErrors.length}`);

  if (issues.length === 0) {
    console.log(`\n[${vp}] ✅ ALL CHECKS PASS`);
  } else {
    allOk = false;
    console.log(`\n[${vp}] ❌ ISSUES: ${issues.join(', ')}`);
  }
}

process.exit(allOk ? 0 : 1);
