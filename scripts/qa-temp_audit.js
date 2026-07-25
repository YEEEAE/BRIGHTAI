import { chromium } from 'playwright';

const pages = [
  'https://brightai.site/kernel/',
  'https://brightai.site/kernel/chat/',
  'https://brightai.site/kernel/audit/',
  'https://brightai.site/kernel/approvals/',
  'https://brightai.site/kernel/stats/',
  'https://brightai.site/kernel/connectors/',
  'https://brightai.site/kernel/scenarios/',
  'https://brightai.site/kernel/policies/',
  'https://brightai.site/kernel/evidence/',
  'https://brightai.site/kernel/compliance/',
  'https://brightai.site/kernel/reports/'
];

async function run() {
  const browser = await chromium.launch({ headless: true });
  
  for (const url of pages) {
    console.log(`\n========================================`);
    console.log(`Auditing: ${url}`);
    console.log(`========================================`);
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    const consoleErrors = [];
    const networkFailures = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    page.on('pageerror', err => {
      consoleErrors.push(err.message);
    });
    
    page.on('requestfailed', req => {
      networkFailures.push(`${req.method()} ${req.url()}: ${req.failure().errorText}`);
    });
    
    try {
      const response = await page.goto(url, { waitUntil: 'load', timeout: 30000 });
      console.log(`Status: ${response.status()}`);
      
      const title = await page.title();
      console.log(`Title: ${title}`);
      
      const dir = await page.evaluate(() => document.documentElement.getAttribute('dir'));
      const lang = await page.evaluate(() => document.documentElement.getAttribute('lang'));
      console.log(`HTML dir: ${dir}, lang: ${lang}`);
      
      const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a')).map(a => ({
          text: a.innerText.trim(),
          href: a.getAttribute('href')
        }));
      });
      console.log(`Found ${links.length} links on page.`);
      
      const hasHeader = await page.evaluate(() => !!document.querySelector('header'));
      const hasFooter = await page.evaluate(() => !!document.querySelector('footer'));
      const hasSkipLink = await page.evaluate(() => !!document.querySelector('.k-skip-link'));
      const hasMain = await page.evaluate(() => !!document.querySelector('#k-content') || !!document.querySelector('main'));
      
      console.log(`Structure: Header=${hasHeader}, Footer=${hasFooter}, SkipLink=${hasSkipLink}, Main=${hasMain}`);
      
      if (consoleErrors.length > 0) {
        console.log(`❌ Console Errors:`);
        consoleErrors.forEach(err => console.log(`   - ${err}`));
      } else {
        console.log(`✅ No Console Errors`);
      }
      
      if (networkFailures.length > 0) {
        console.log(`❌ Network Failures:`);
        networkFailures.forEach(err => console.log(`   - ${err}`));
      } else {
        console.log(`✅ No Network Failures`);
      }
      
    } catch (err) {
      console.error(`Error loading page: ${err.message}`);
    } finally {
      await page.close();
      await context.close();
    }
  }
  
  await browser.close();
}

run().catch(console.error);
