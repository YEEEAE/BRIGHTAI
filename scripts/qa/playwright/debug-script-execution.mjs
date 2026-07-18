import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage();

const errors = [];
page.on('console', (msg) => {
  errors.push(`[${msg.type()}] ${msg.text()}`);
});
page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));

await page.goto('http://localhost:4321/', { waitUntil: 'load' });
await page.waitForTimeout(2000);

// Check if scroll-reveal is registered by checking global state
const debug = await page.evaluate(() => {
  // Try to find any module that has been loaded
  // Modules don't expose global state unless they explicitly do it
  const allScripts = Array.from(document.scripts).map(s => ({
    src: s.src,
    type: s.type,
    hasContent: s.textContent.length > 0,
  }));
  return {
    astroPageLoadEvent: typeof window !== 'undefined' && window.dispatchEvent ? 'dispatchable' : 'unknown',
    scripts: allScripts.filter(s => s.src.includes('scroll-reveal') || s.src.includes('analytics')),
  };
});
console.log('All console messages:');
errors.forEach(e => console.log('  -', e));
console.log('\nDebug:', JSON.stringify(debug, null, 2));

// Try to manually run the initReveal
const manualResult = await page.evaluate(async () => {
  try {
    const mod = await import('/js/scroll-reveal.js');
    console.log('module loaded:', typeof mod.default);
    if (mod.default) {
      mod.default();
      return { ok: true, hasDefault: true };
    }
    return { ok: false, hasDefault: true };
  } catch (e) {
    return { ok: false, error: e.message, stack: e.stack };
  }
});
console.log('\nManual import result:', JSON.stringify(manualResult, null, 2));

await page.waitForTimeout(500);
const afterManual = await page.evaluate(() => ({
  featureCardsOpacity1: Array.from(document.querySelectorAll('#problem .feature-card')).filter(c => parseFloat(getComputedStyle(c).opacity) > 0.9).length,
  featureCardsWithIsVisible: document.querySelectorAll('#problem .feature-card.is-visible').length,
}));
console.log('\nAfter manual init:', JSON.stringify(afterManual, null, 2));

await browser.close();
