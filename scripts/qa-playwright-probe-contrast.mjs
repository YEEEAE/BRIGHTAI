import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1024, height: 900 } });
const t = await ctx.newPage();
await t.goto('http://localhost:4321/pricing/', { waitUntil: 'networkidle' });
const info = await t.evaluate(() => {
  const out = [];
  document.querySelectorAll('a').forEach((a) => {
    const pos = a.getAttribute('data-position');
    const cta = a.getAttribute('data-cta');
    if ((pos && pos.startsWith('offer_detail')) || cta === 'pilot_request' || cta === 'enterprise_contact') {
      const cs = getComputedStyle(a);
      out.push({
        dataPosition: pos,
        dataCta: cta,
        text: (a.textContent || '').trim().slice(0, 20),
        color: cs.color,
        background: cs.backgroundColor,
        cls: a.className.toString().slice(0, 50),
        href: a.getAttribute('href'),
      });
    }
  });
  return out;
});
console.log(JSON.stringify(info, null, 2));
await b.close();
