import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage();

const requests = [];
const errors = [];
page.on('request', (req) => {
  const url = req.url();
  if (url.includes('scroll-reveal') || url.includes('focus-trap') || url.includes('font-async') || url.includes('analytics')) {
    requests.push({ url, method: req.method() });
  }
});
page.on('console', (msg) => {
  if (msg.type() === 'error' || msg.type() === 'warning') {
    errors.push(`[${msg.type()}] ${msg.text()}`);
  }
});
page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}\n${err.stack || ''}`));
page.on('response', (resp) => {
  const url = resp.url();
  if (url.includes('scroll-reveal') || url.includes('focus-trap')) {
    requests.push({ url, status: resp.status() });
  }
});

await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

// Check what scripts are loaded
const scriptsLoaded = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('script[src]')).map(s => s.src);
});

// Check if scroll-reveal global is exposed
const globals = await page.evaluate(() => {
  return {
    IntersectionObserver: typeof IntersectionObserver !== 'undefined',
    featureCardCount: document.querySelectorAll('#problem .feature-card').length,
    featureCardsWithIsVisible: document.querySelectorAll('#problem .feature-card.is-visible').length,
    featureCardsOpacity1: Array.from(document.querySelectorAll('#problem .feature-card')).filter(c => parseFloat(getComputedStyle(c).opacity) > 0.9).length,
  };
});

console.log('Scripts loaded:');
scriptsLoaded.forEach(s => console.log('  -', s));
console.log('\nRequests for our scripts:');
requests.forEach(r => console.log('  -', JSON.stringify(r)));
console.log('\nErrors:');
errors.forEach(e => console.log('  -', e));
console.log('\nGlobals:');
console.log(JSON.stringify(globals, null, 2));

await browser.close();
