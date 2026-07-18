import { chromium } from 'playwright';

const browser = await chromium.launch();

async function shot(url, name, viewport = { width: 1440, height: 900 }) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
  });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `/tmp/ba-${name}.png`, fullPage: false });
  console.log(`✅ ${name}: ${url} (errors: ${errors.length})`);
  if (errors.length > 0) errors.slice(0, 5).forEach((e) => console.log(`  - ${e}`));
  await ctx.close();
}

await shot('http://localhost:4321/', 'home');
await shot('http://localhost:4321/pricing/', 'pricing');
await shot('http://localhost:4321/about/', 'about');
await shot('http://localhost:4321/contact/', 'contact');
await shot('http://localhost:4321/demo/', 'demo');
await shot('http://localhost:4321/solutions/banking-ai-governance/', 'solutions');

await browser.close();