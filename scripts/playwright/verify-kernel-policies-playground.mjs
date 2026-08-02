/**
 * verify-kernel-policies-playground.mjs — Browser smoke test for M28 Link 2
 * (policies → playground).
 *
 * Verifies:
 *  1. /kernel/policies/ renders policy rows, each with a "جرّبها" link that
 *     points to /kernel/playground/ with pii/action/pack params.
 *  2. The playground applies a linked policy: a policy that is OFF by default
 *     (pr_iban_block_cross) flips to aria-checked="true" when arriving with
 *     ?pii=iban&action=block, and #pg-link-note becomes visible.
 *  3. Unmatchable params (?pii=salary) leave toggles at default and note hidden.
 *
 * Run: node scripts/playwright/verify-kernel-policies-playground.mjs
 * Exit 0 = pass, non-zero = fail.
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:4323';
const POLICIES_URL = `${BASE}/kernel/policies/`;
const PLAYGROUND_URL = `${BASE}/kernel/playground/`;

const browser = await chromium.launch();

const consoleErrors = [];
const pageErrors = [];
const harmless = [
  "frame-ancestors' is ignored when delivered via a <meta>",
  "'report-uri' is ignored when delivered via a <meta>",
  'X-Frame-Options may only be set via an HTTP header',
];

let failures = 0;
function ok(name) { console.log(`  ✓ ${name}`); }
function fail(name, detail) {
  failures += 1;
  console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
}
function attachLoggers(page) {
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!harmless.some((h) => text.includes(h))) consoleErrors.push(text);
    }
  });
  page.on('pageerror', (err) => pageErrors.push(err.message));
}

function toggleState(page, pid) {
  return page.evaluate((id) => {
    const t = document.querySelector(`.pg-toggle[data-pid="${id}"]`);
    return t ? t.getAttribute('aria-checked') : null;
  }, pid);
}
function noteHidden(page) {
  return page.evaluate(() => {
    const el = document.getElementById('pg-link-note');
    return el ? el.hidden : true;
  });
}

// ---- Phase A: policies page — "جرّبها" links present and well-formed.
console.log('Phase A: /kernel/policies/');
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
attachLoggers(page);
await page.goto(POLICIES_URL, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(1500);

try {
  const cookieBtn = page.locator('#cookie-accept');
  if (await cookieBtn.count()) await cookieBtn.click({ force: true, timeout: 3000 });
} catch { /* no cookie bar */ }

const links = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('[data-po-playground]')).map((a) => ({
    href: a.getAttribute('href'),
    label: a.textContent.trim(),
  }));
});
ok(links.length >= 1 ? `policy rows with "جرّبها": ${links.length}` : 'no playground links found');
if (links.length < 1) fail('playground links', 'none');
const first = links[0];
ok(first && /^\/kernel\/playground\/\?pii=/.test(first.href) ? `first link: ${first.href}` : `first link malformed: ${first?.href}`);
if (first && !/^\/kernel\/playground\/\?pii=/.test(first.href)) fail('first link format', first.href);
ok(first && /action=/.test(first.href) ? 'link carries action param' : 'link missing action');
if (first && !/action=/.test(first.href)) fail('action param', first.href);
await page.close();

// ---- Phase B: baseline default state (no params).
console.log('Phase B: default playground state');
const pageB = await browser.newPage({ viewport: { width: 1440, height: 900 } });
attachLoggers(pageB);
await pageB.goto(PLAYGROUND_URL, { waitUntil: 'networkidle', timeout: 60000 });
await pageB.waitForTimeout(1500);
const offByDefault = await toggleState(pageB, 'pr_iban_block_cross');
ok(offByDefault === 'false' ? `pr_iban_block_cross OFF by default` : `pr_iban_block_cross=${offByDefault} (expected false)`);
if (offByDefault !== 'false') fail('default off policy', String(offByDefault));
await pageB.close();

// ---- Phase C: arrive with matching link params → policy flips ON + note shows.
console.log('Phase C: navigate with ?pii=iban&action=block&pack=sama');
const pageC = await browser.newPage({ viewport: { width: 1440, height: 900 } });
attachLoggers(pageC);
await pageC.goto(`${PLAYGROUND_URL}?pii=iban&action=block&pack=sama&name=block+iban`, {
  waitUntil: 'networkidle', timeout: 60000,
});
await pageC.waitForTimeout(1500);

ok(consoleErrors.length === 0 ? 'no console errors' : `console errors (${consoleErrors.length}): ${consoleErrors.join(' | ')}`);
if (consoleErrors.length) fail('console errors', consoleErrors.join(' | '));
ok(pageErrors.length === 0 ? 'no page errors' : `page errors (${pageErrors.length}): ${pageErrors.join(' | ')}`);
if (pageErrors.length) fail('page errors', pageErrors.join(' | '));

const afterLink = await toggleState(pageC, 'pr_iban_block_cross');
ok(afterLink === 'true' ? 'pr_iban_block_cross flipped ON via link' : `pr_iban_block_cross=${afterLink} (expected true)`);
if (afterLink !== 'true') fail('linked policy applied', String(afterLink));

const noteC = await noteHidden(pageC);
ok(!noteC ? 'link note (#pg-link-note) visible' : 'link note hidden');
if (noteC) fail('link note', 'hidden');

const packC = await pageC.evaluate(() => {
  const sel = document.querySelector('[data-context="pack"]');
  return sel ? sel.value : null;
});
ok(packC === 'sama' ? `pack select set to sama` : `pack select=${packC} (expected sama)`);
if (packC !== 'sama') fail('pack select', String(packC));

await pageC.screenshot({ path: '/var/folders/md/ply6x_qd1k3gzt5vvg5ksnrr0000gn/T/opencode/kernel-policies-playground.png' });
await pageC.close();

// ---- Phase D: unmatchable params → default preserved, note hidden.
console.log('Phase D: navigate with ?pii=salary (unmatchable)');
const pageD = await browser.newPage({ viewport: { width: 1440, height: 900 } });
attachLoggers(pageD);
await pageD.goto(`${PLAYGROUND_URL}?pii=salary&action=redact&name=salary`, {
  waitUntil: 'networkidle', timeout: 60000,
});
await pageD.waitForTimeout(1500);

const unmatchable = await toggleState(pageD, 'pr_iban_block_cross');
ok(unmatchable === 'false' ? 'unmatchable pii leaves toggles at default' : `pr_iban_block_cross=${unmatchable} (expected false)`);
if (unmatchable !== 'false') fail('unmatchable toggles', String(unmatchable));

const noteD = await noteHidden(pageD);
ok(noteD ? 'note stays hidden for unmatchable pii' : 'note shown for unmatchable pii');
if (!noteD) fail('unmatchable note', 'shown');
await pageD.close();

await browser.close();

if (failures > 0) {
  console.log(`\n❌ ${failures} check(s) failed`);
  process.exit(1);
}
console.log('\n✅ kernel policies→playground link: all checks passed');
process.exit(0);
