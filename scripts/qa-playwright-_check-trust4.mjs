import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
const page = await ctx.newPage();
await page.goto('http://localhost:4173/trust/', { waitUntil: 'networkidle' });
const data = await page.evaluate(() => {
  const cards = document.querySelectorAll('article.card--feature.card--lg');
  if (cards.length === 0) return null;
  const card = cards[0];  // First card
  const cs = getComputedStyle(card);
  const ps = getComputedStyle(card.parentElement);
  return {
    card: {
      transform: cs.transform,
      position: cs.position,
      left: cs.left,
      right: cs.right,
      gridColumn: cs.gridColumn,
      gridColumnStart: cs.gridColumnStart,
      gridRow: cs.gridRow,
      animation: cs.animation,
    },
    parent: {
      display: ps.display,
      gridTemplateColumns: ps.gridTemplateColumns,
      transform: ps.transform,
    },
    siblings: card.parentElement.children.length,
  };
});
console.log(JSON.stringify(data, null, 2));
await browser.close();
