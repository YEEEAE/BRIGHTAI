import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage();
const beaconBlocked = [];
page.on('console', (msg) => {
  const t = msg.text();
  if (msg.type() === 'error' && t.includes('cloudflareinsights')) beaconBlocked.push(t.substring(0,200));
});
await page.goto('https://brightai.site/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(5000);
console.log('cloudflare beacon blocks:', beaconBlocked.length);
beaconBlocked.forEach(b => console.log('  ', b));
await browser.close();
