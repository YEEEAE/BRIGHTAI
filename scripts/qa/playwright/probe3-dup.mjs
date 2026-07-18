import { chromium } from 'playwright';
const b = await chromium.launch();
const t = await (await b.newContext({viewport:{width:1024,height:900}})).newPage();
await t.goto('http://localhost:4321/pricing/', { waitUntil: 'networkidle' });
const html = await t.evaluate(() => {
  const a = document.querySelector('a[data-position="offer_detail_pilot"]');
  return a ? a.outerHTML.slice(0,200) : 'NOT FOUND';
});
console.log(html);
await b.close();
