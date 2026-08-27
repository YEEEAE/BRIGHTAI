import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();

const consoleErrors = [];
const cspViolations = [];
const failedRequests = [];

page.on('console', (msg) => {
  const text = msg.text();
  if (msg.type() === 'error') {
    consoleErrors.push(text);
    if (text.includes('Content Security Policy') || text.includes('Refused to')) {
      cspViolations.push(text);
    }
  }
});

page.on('requestfailed', (req) => {
  failedRequests.push(`${req.url()} - ${req.failure()?.errorText}`);
});

page.on('response', (res) => {
  if (res.status() >= 400) {
    failedRequests.push(`HTTP ${res.status()} ${res.url()}`);
  }
});

const urls = [
  'https://brightai.live/',
  'https://brightai.live/kernel/',
  'https://brightai.live/blog/',
  'https://brightai.live/contact/',
];

for (const url of urls) {
  consoleErrors.length = 0;
  cspViolations.length = 0;
  failedRequests.length = 0;
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    console.log(`\n=== ${url} ===`);
    console.log(`  CSP violations: ${cspViolations.length}`);
    cspViolations.forEach(v => console.log(`    ❌ ${v.substring(0, 150)}`));
    console.log(`  Other console errors: ${consoleErrors.length - cspViolations.length}`);
    consoleErrors.filter(e => !e.includes('Content Security Policy') && !e.includes('Refused to')).slice(0,3).forEach(e => console.log(`    ⚠️  ${e.substring(0, 120)}`));
    console.log(`  Failed requests: ${failedRequests.length}`);
    failedRequests.slice(0,3).forEach(r => console.log(`    ⚠️  ${r.substring(0, 120)}`));
  } catch (e) {
    console.log(`\n=== ${url} === ❌ NAVIGATION FAILED: ${e.message.substring(0,100)}`);
  }
}

await browser.close();
