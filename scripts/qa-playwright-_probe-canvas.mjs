import { chromium, devices } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices['iPhone 14'], isMobile: true });
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:4321/');
const result = await page.evaluate(() => {
  const canvases = Array.from(document.querySelectorAll('canvas.dotted-surface-canvas'));
  return canvases.map((c) => ({
    className: c.className,
    display: getComputedStyle(c).display,
    visibility: getComputedStyle(c).visibility,
    opacity: getComputedStyle(c).opacity,
    width: c.offsetWidth,
    height: c.offsetHeight,
    parentDisplay: getComputedStyle(c.parentElement).display,
  }));
});
console.log(JSON.stringify(result, null, 2));
await browser.close();
