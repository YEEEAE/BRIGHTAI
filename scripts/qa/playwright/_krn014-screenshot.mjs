import { chromium } from 'playwright';
const URLS = [
  'http://localhost:4321/kernel/policies/',
  'http://localhost:4321/kernel/audit/',
  'http://localhost:4321/kernel/compliance/',
];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
for (const url of URLS) {
  const slug = url.split('/').filter(Boolean).pop().replace(/[^a-z0-9-]/g, '-');
  await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
  await page.screenshot({ path: `/tmp/krn014-${slug}.png`, fullPage: true });
  console.log('shot:', slug);
}
await browser.close();
