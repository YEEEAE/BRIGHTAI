import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, statSync, existsSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';

const __dirname = '/Users/yzydalshmry/Desktop/BRIGHTAI/scripts/playwright';
const REPO_ROOT = '/Users/yzydalshmry/Desktop/BRIGHTAI';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

function resolveFile(urlPath) {
  let p = urlPath.split('?')[0].split('#')[0];
  if (p === '/') p = '/index.html';
  if (p.endsWith('/')) p += 'index.html';
  const candidates = [join(REPO_ROOT, 'dist', p), join(REPO_ROOT, 'dist', 'client', p)];
  for (const c of candidates) {
    if (existsSync(c) && statSync(c).isFile()) return c;
  }
  return null;
}

const server = createServer((req, res) => {
  const file = resolveFile(req.url || '/');
  if (!file) { res.writeHead(404); res.end(); return; }
  const body = readFileSync(file);
  res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'text/plain' });
  res.end(body);
});
await new Promise(r => server.listen(4321, '127.0.0.1', r));
const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
await page.setViewportSize({ width: 1024, height: 768 });
await page.goto('http://127.0.0.1:4321/kernel/', { waitUntil: 'networkidle' });
const total = await page.locator('[data-stage-link]').count();
console.log('total data-stage-link:', total);
for (let i = 0; i < 30; i++) {
  await page.keyboard.press('Tab');
  const info = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return 'none';
    return {
      tag: el.tagName,
      cls: el.className,
      href: el.getAttribute('href') || null,
      dataStageLink: el.matches('[data-stage-link]'),
      dataJourneyProgress: el.matches('[data-journey-progress]'),
      isJourney: !!el.closest('[data-journey-progress]'),
    };
  });
  if (info.isJourney) {
    console.log(`Tab ${i}: INSIDE journey, tag=${info.tag} cls=${info.cls} href=${info.href} stage-link=${info.dataStageLink}`);
  }
}
await browser.close();
server.close();
