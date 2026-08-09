import { chromium } from 'playwright';
const browser = await chromium.launch();
const pages = [
  { name: 'kernel-index', path: '/kernel/' },
  { name: 'kernel-policies', path: '/kernel/policies/' },
  { name: 'kernel-audit', path: '/kernel/audit/' },
];
const widths = [{ label: 'desktop', width: 1440, height: 900 }, { label: 'mobile', width: 390, height: 844 }];
const url = 'http://localhost:4321';
let fail = 0;
for (const p of pages) {
  for (const w of widths) {
    const ctx = await browser.newContext({ viewport: { width: w.width, height: w.height }, deviceScaleFactor: 1 });
    const page = await ctx.newPage(); page.setDefaultTimeout(15000);
    const errs = [];
    page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await page.goto(url + p.path, { waitUntil: 'load' }).catch(()=>{fail++;});
    const title = await page.locator('h1').first().innerText().catch(()=> '?');
    const titleWrap = await page.locator('h1').first().evaluate(el => getComputedStyle(el).textWrap).catch(()=> '?');
    const dir = await page.locator('html').getAttribute('dir');
    const screenshot = `/Users/yzydalshmry/Desktop/BRIGHTAI/download/qa/krn-${p.name}-${w.label}.png`;
    await page.screenshot({ path: screenshot, fullPage: false });
    console.log(`${p.name} ${w.label}: dir=${dir} h1="${title.slice(0,40)}" textWrap=${titleWrap} errs=${errs.length} shot=${screenshot}`);
    await ctx.close();
  }
}
await browser.close();
console.log(fail ? `FAIL ${fail} navigations` : 'DONE');
process.exit(fail ? 1 : 0);
