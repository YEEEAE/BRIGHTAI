import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';

const root = resolve(new URL('..', import.meta.url).pathname);
const controller = await readFile(join(root, 'public/scripts/form-productivity.js'), 'utf8');
const pageHtml = `<!doctype html><html><body data-qc-user-id="42">
  <form id="lab-test" method="POST" action="/save"><label for="lot_number">Lot number</label><input id="lot_number" name="lot_number" required>
  <label for="notes">Notes</label><textarea id="notes" name="notes"></textarea><button type="submit">Save</button></form>
  <form id="logout" method="POST" action="/logout"><button type="submit">Sign out</button></form>
  <script>${controller}</script></body></html>`;
const server = createServer((request, response) => {
  if (request.url === '/save') { setTimeout(() => { response.writeHead(200, { 'content-type': 'text/html' }); response.end(pageHtml); }, 250); return; }
  if (request.url === '/logout') { response.writeHead(200, { 'content-type': 'text/html' }); response.end(pageHtml); return; }
  response.writeHead(200, { 'content-type': 'text/html' }); response.end(pageHtml);
});
await new Promise((resolveServer) => server.listen(0, '127.0.0.1', resolveServer));
const address = server.address();
const url = `http://127.0.0.1:${address.port}/lab/tests/new?type=air`;
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
let passed = 0;
let failed = 0;
function ok(condition, message) { if (condition) { passed += 1; console.log(`  ✅ ${message}`); } else { failed += 1; console.log(`  ❌ ${message}`); } }

try {
  await page.goto(url);
  await page.locator('#lot_number').fill('LOT-001');
  await page.waitForTimeout(650);
  const draft = await page.evaluate(() => {
    const key = Object.keys(localStorage).find((value) => value.startsWith('qc-form-draft:v1:42:/lab/tests/new?type=air:'));
    return key ? JSON.parse(localStorage.getItem(key) || 'null') : null;
  });
  ok(draft?.values?.lot_number?.[0] === 'LOT-001', 'draft stores field values after the 500ms debounce');
  const unload = await page.evaluate(() => { const event = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(event); return event.defaultPrevented; });
  ok(unload, 'dirty form cancels beforeunload');
  await page.reload();
  ok(await page.locator('#lab-test [data-qc-restore]').isVisible(), 'restore banner appears for a previous draft');
  await page.locator('#lab-test [data-qc-restore]').click();
  ok(await page.locator('#lot_number').inputValue() === 'LOT-001', 'restore repopulates the field');
  await page.locator('#lot_number').fill('');
  await page.locator('#lab-test button[type="submit"]').click();
  ok((await page.locator('#lot_number').evaluate((el) => document.activeElement === el)), 'empty submit focuses the first invalid field');
  ok((await page.locator('#lot_number').getAttribute('aria-describedby') || '').includes('lot_number-error'), 'invalid field references its inline error');
  await page.locator('#lot_number').fill('LOT-002');
  await page.evaluate(() => { window.fetch = () => new Promise(() => {}); });
  await page.evaluate(() => document.querySelector('#lab-test').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  ok(await page.locator('#lab-test button[type="submit"]').isDisabled(), 'submit locks immediately and disables the button');
  await page.goto(url);
  await page.evaluate(() => {
    const key = 'qc-form-draft:v1:42:/lab/tests/new?type=air:http://127.0.0.1:' + location.port + '/save';
    localStorage.setItem(key, '{}');
  });
  const clearedOnLogout = await page.evaluate(() => {
    document.querySelector('#logout').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    return !Object.keys(localStorage).some((key) => key.startsWith('qc-form-draft:v1:42:'));
  });
  ok(clearedOnLogout, 'logout clears drafts scoped to the current user');
  const formFiles = execFileSync('rg', ['-l', '<form\\b', 'src'], { cwd: root, encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  ok(formFiles.length === 51, `mutation form inventory remains 51 files (found ${formFiles.length})`);
} finally {
  await browser.close();
  await new Promise((resolveServer) => server.close(resolveServer));
}
console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
