// E2E spec for the QC LABORATORY navigation + RBAC shell (PROMPT 03).
//
// Runs against a LIVE server sharing the same SQLite database (same pattern
// as e2e-findings.mjs). Covers:
//   A. Auth wall: anonymous /lab → 302 to /login (middleware prefix guard).
//   B. Every seeded role reaches /lab (200) — all roles hold LAB_VIEW.
//   C. Navbar: the Laboratory link is rendered for all four roles, in both
//      the desktop cluster and the mobile menu.
//   D. Secondary nav is permission-aware: rendered server-side from
//      labNavForRole; only implemented routes are linked (no dead links).
//   E. Bypass attempts fail: query parameters (?role=...) and hidden-field
//      style payloads never influence authorization — the decision comes
//      from the session alone.
//   F. Existing routes unchanged: role landing pages still resolve and the
//      new /lab link did not disturb the admin desktop navbar (no overflow).
//
// Usage (from the app directory, via e2e-acceptance.mjs):
//   QC_DATABASE_PATH=<db> PORT=<port> BASE_URL=http://127.0.0.1:<port> \
//     ADMIN_DEFAULT_PASSWORD=... node scripts/e2e-lab-nav.mjs

import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://localhost:4399';
if (!process.env.QC_DATABASE_PATH && !process.env.QC_DB_PATH) {
  console.error('❌ QC_DATABASE_PATH is required (must match the server database).');
  process.exit(1);
}
const PASS = process.env.ADMIN_DEFAULT_PASSWORD ?? 'admin123';

// ── tiny test harness ──
let passed = 0;
let failed = 0;
const failures = [];
function ok(cond, label) {
  if (cond) {
    passed += 1;
    console.log(`  ✅ ${label}`);
  } else {
    failed += 1;
    failures.push(label);
    console.log(`  ❌ ${label}`);
  }
}

const browser = await chromium.launch({ headless: true });

async function login(page, username) {
  await page.goto(`${BASE}/login`);
  await page.fill('#username', username);
  await page.fill('#password', PASS);
  await page.locator('form[action="/login"] button[type="submit"]').click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15_000 });
}

// ── A. Anonymous → login wall ──
{
  const ctx = await browser.newContext();
  const response = await ctx.request.get(`${BASE}/lab`, { maxRedirects: 0 });
  ok(response.status() === 302, 'anonymous /lab → 302');
  ok((response.headers().location ?? '').startsWith('/login'), 'anonymous /lab redirects to /login');
  const deep = await ctx.request.get(`${BASE}/lab/tests?role=admin`, { maxRedirects: 0 });
  ok(deep.status() === 302, 'anonymous deep /lab route → 302 (auth precedes everything)');
  await ctx.close();
}

// ── B + C + D. Every role reaches /lab; navbar + secondary nav behavior ──
const roleCases = [
  { username: 'admin', expectReviewQueue: true, expectCapabilities: true },
  { username: 'manager', expectReviewQueue: true, expectCapabilities: true },
  { username: 'supervisor', expectReviewQueue: true, expectCapabilities: true },
  { username: 'employee', expectReviewQueue: false, expectCapabilities: true },
];

for (const roleCase of roleCases) {
  const page = await browser.newPage();
  await login(page, roleCase.username);

  const response = await page.goto(`${BASE}/lab`, { waitUntil: 'domcontentloaded' });
  ok(response.status() === 200, `${roleCase.username}: /lab renders 200`);

  // Navbar desktop link
  const desktopLink = page.locator(`header a[href="/lab"], nav a[href="/lab"]`).first();
  ok((await desktopLink.count()) > 0, `${roleCase.username}: navbar shows the Laboratory link`);

  // Mobile menu contains the link too (menu is hidden but rendered in DOM)
  const mobileLinks = await page.locator('#mobile-menu a[href="/lab"]').count();
  ok(mobileLinks > 0, `${roleCase.username}: mobile menu shows the Laboratory link`);

  // Secondary nav: only implemented routes are linked (today: /lab itself)
  const secondary = page.locator('nav[aria-label="Laboratory sections"] a');
  const secondaryHrefs = await secondary.evaluateAll((nodes) => nodes.map((n) => n.getAttribute('href')));
  ok(secondaryHrefs.includes('/lab'), `${roleCase.username}: secondary nav shows the command center`);
  ok(secondaryHrefs.every((href) => href === '/lab'), `${roleCase.username}: no dead links in secondary nav`);

  // Capability cards are permission-filtered: employees get no Review & Approval card
  const bodyText = await page.locator('main').innerText();
  const hasReviewCard = bodyText.includes('Review & Approval');
  ok(hasReviewCard === roleCase.expectReviewQueue, `${roleCase.username}: capability cards match role permissions`);

  // Breadcrumbs present
  ok((await page.locator('nav[aria-label="Breadcrumb"]').count()) === 1, `${roleCase.username}: breadcrumbs render`);

  await page.close();
}

// ── E. Bypass attempts: query params and forged fields never grant anything ──
{
  const page = await browser.newPage();
  await login(page, 'employee');
  // Employee holds LAB_VIEW so /lab renders — but the ?role= parameter must
  // NOT upgrade the rendered permission-filtered content.
  await page.goto(`${BASE}/lab?role=admin&permissions=LAB_TEST_APPROVE`, { waitUntil: 'domcontentloaded' });
  const bodyText = await page.locator('main').innerText();
  ok(!bodyText.includes('Review & Approval'), 'query ?role=admin does not upgrade employee permissions');
  ok(!bodyText.includes('Management Dashboard'), 'query parameter cannot expose supervisor+ capabilities');

  // POST with forged hidden role field — the middleware decides from the
  // session user only; the payload is ignored entirely.
  const forged = await page.request.post(`${BASE}/lab?role=admin`, {
    data: 'role=admin&permission=LAB_TEST_APPROVE&status=APPROVED',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Origin: BASE },
    maxRedirects: 0,
  });
  ok([403, 404, 405, 500].includes(forged.status) || forged.status === 303 || forged.status === 302,
    `forged POST payload does not produce an authorized page effect (status ${forged.status})`);
  await page.close();
}

// ── F. Existing routes unchanged + admin navbar has no horizontal overflow ──
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await login(page, 'admin');
  await page.goto(`${BASE}/lab`, { waitUntil: 'domcontentloaded' });
  const overflow1440 = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  ok(!overflow1440, 'admin /lab: no horizontal overflow at 1440px');

  // At lg (1024) the admin desktop cluster now has one more link — verify it
  // still fits (the overflow fix pinned the cluster to lg+).
  await page.setViewportSize({ width: 1024, height: 768 });
  const overflow1024 = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  ok(!overflow1024, 'admin /lab: no horizontal overflow at 1024px');

  await page.setViewportSize({ width: 390, height: 844 });
  const overflow390 = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  ok(!overflow390, 'admin /lab: no horizontal overflow at 390px (mobile menu)');

  // Existing landing pages still resolve for their roles
  const pageMarks = [
    ['/admin/users', 200],
    ['/dashboard', 200],
    ['/manager', 200],
    ['/findings', 200],
  ];
  for (const [path, expected] of pageMarks) {
    const res = await page.request.get(`${BASE}${path}`);
    ok(res.status() === expected, `existing route unchanged: ${path} → ${res.status()}`);
  }
  await page.close();
}

await browser.close();

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error('Failures:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('✅ Laboratory navigation + RBAC E2E checks passed.');
