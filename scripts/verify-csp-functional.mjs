import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage();

const functionalErrors = [];   // things that break site function (not CSP noise)
const ga4Loaded = [];
const scriptsBlocked = [];

page.on('console', (msg) => {
  const t = msg.text();
  if (msg.type() === 'error') {
    // Filter: real script/style/asset blocks (functional), ignore meta CSP warnings
    if (t.includes('Refused to load') || t.includes('Refused to apply') || t.includes('Refused to frame') || t.includes('Refused to execute')) {
      if (!t.includes('cloudflareinsights')) {
        functionalErrors.push(t.substring(0,200));
      }
    }
  }
});
page.on('response', (res) => {
  const url = res.url();
  if (url.includes('googletagmanager.com') || url.includes('google-analytics.com')) {
    ga4Loaded.push(`${res.status()} ${url.substring(0,80)}`);
  }
});
page.on('requestfailed', (req) => {
  const u = req.url();
  if (!u.includes('cloudflareinsights') && !u.includes('google-analytics.com/g/collect')) {
    scriptsBlocked.push(`${u.substring(0,80)} - ${req.failure()?.errorText}`);
  }
});

console.log('=== Functional check on https://brightai.live/ ===');
await page.goto('https://brightai.live/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(5000);

console.log('GA4/GTM requests loaded:', ga4Loaded.length);
ga4Loaded.slice(0,4).forEach(g => console.log('  ✅', g));
console.log('Functional CSP errors (non-beacon):', functionalErrors.length);
functionalErrors.slice(0,5).forEach(e => console.log('  ❌', e));
console.log('Other failed requests:', scriptsBlocked.length);
scriptsBlocked.slice(0,5).forEach(s => console.log('  ⚠️ ', s));

// check page actually rendered (h1 present)
const h1 = await page.locator('h1').first().textContent().catch(() => null);
console.log('H1 rendered:', h1 ? `"${h1.substring(0,50)}"` : 'MISSING');

await browser.close();
