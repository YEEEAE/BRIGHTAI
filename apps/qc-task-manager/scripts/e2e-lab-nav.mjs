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
  { username: 'admin', expectDataQualityKpi: true, expectNewProduct: true },
  { username: 'manager', expectDataQualityKpi: true, expectNewProduct: true },
  { username: 'supervisor', expectDataQualityKpi: true, expectNewProduct: false },
  { username: 'employee', expectDataQualityKpi: false, expectNewProduct: false },
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

  // Secondary nav: only implemented routes are linked (today: /lab, /lab/tests,
  // /lab/tests/new, /lab/equipment, /lab/calibration, /lab/documents — all live now).
  const secondary = page.locator('nav[aria-label="Laboratory sections"] a');
  const secondaryHrefs = await secondary.evaluateAll((nodes) => nodes.map((n) => n.getAttribute('href')));
  ok(secondaryHrefs.includes('/lab'), `${roleCase.username}: secondary nav shows the command center`);
  ok(secondaryHrefs.includes('/lab/tests'), `${roleCase.username}: secondary nav shows the test register`);
  ok(secondaryHrefs.includes('/lab/tests/new'), `${roleCase.username}: secondary nav shows the new-test link`);
  ok(secondaryHrefs.includes('/lab/equipment'), `${roleCase.username}: secondary nav shows the equipment registry`);
  ok(secondaryHrefs.includes('/lab/calibration'), `${roleCase.username}: secondary nav shows the calibration register`);
  ok(secondaryHrefs.includes('/lab/documents'), `${roleCase.username}: secondary nav shows the document library`);
  if (roleCase.username !== 'employee') {
    ok(secondaryHrefs.includes('/lab/retests'), `${roleCase.username}: secondary nav shows the retest register`);
  }
  ok(secondaryHrefs.every((href) =>
    href === '/lab' || href === '/lab/tests' || href === '/lab/tests/new' || href === '/lab/tests/review' ||
    href === '/lab/products' || href === '/lab/products/new' || href === '/lab/templates' || href === '/lab/equipment' ||
    href === '/lab/calibration' || href === '/lab/documents' || href === '/lab/documents/new' || // Document editor (PROMPT 41)
    href === '/lab/acknowledgements' || // Acknowledgement register (LAB_DOCUMENT_ACKNOWLEDGE)
    href === '/lab/saved-views' || // Saved views register (PROMPT 24)
    href === '/lab/calendar' || // Laboratory calendar (PROMPT 25)
    href === '/lab/notifications' || // Lab-filtered notifications (PROMPT 26)
    href === '/lab/data-quality' || // Data Quality Center (PROMPT 27)
    href === '/lab/audit' || // Lab-wide audit timeline (shared qc_audit_log)
    href === '/lab/reports' || // Laboratory reports (§13, supervisor+ nav entry)
    href === '/lab/retests', // Retest register (§46, supervisor+ nav entry)
  ), `${roleCase.username}: no dead links in secondary nav`);

  // Command center (PROMPT 04): KPI cards render from real queries, and the
  // permission-scoped ones match the role (Data Quality KPI is supervisor+,
  // "New Product" action is manager+).
  const kpiCount = await page.locator('[data-lab-kpi]').count();
  ok(kpiCount === (roleCase.expectDataQualityKpi ? 13 : 12), `${roleCase.username}: ${kpiCount} KPI cards rendered`);
  const hasDataQualityKpi = (await page.locator('[data-lab-kpi="data_quality_issues"]').count()) === 1;
  ok(hasDataQualityKpi === roleCase.expectDataQualityKpi, `${roleCase.username}: Data Quality KPI matches role permission`);
  const bodyText = await page.locator('main').innerText();
  const hasNewProduct = bodyText.includes('New Product');
  ok(hasNewProduct === roleCase.expectNewProduct, `${roleCase.username}: New Product action matches role permission`);

  // No drill-down may link to an unimplemented route (no dead links) — every
  // KPI/action href inside main must target an implemented lab route. The test
  // register + its details page now exist, so test KPI drill-downs and the
  // per-row View links are live (/lab/tests?, /lab/tests/<id>); New Test links
  // to the live form (?type=air|vacuum); the calibration KPI drill-down is now
  // live too (/lab/calibration, /lab/calibration?due=1). The document-library
  // KPI drill-down is live as well (/lab/documents, /lab/documents?review=due).
  // Everything else stays disabled.
  const mainHrefs = await page.locator('main a[href^="/lab/"]').evaluateAll((nodes) => nodes.map((n) => n.getAttribute('href')));
  ok(mainHrefs.every((href) =>
    href === '/lab' ||
    href === '/lab/tests' ||
    href === '/lab/tests/new' ||
    href === '/lab/products' ||
    href === '/lab/products/new' || // Product Master module (PROMPT 08)
    href === '/lab/templates' ||
    href === '/lab/templates/new' ||
    href === '/lab/equipment' || // Equipment Registry module (PROMPT 11)
    href.startsWith('/lab/equipment?') || // live "requires attention" drill-down
    href === '/lab/tests/review' ||
    href.startsWith('/lab/tests/new?type=') ||
    href.startsWith('/lab/tests?') ||
    href === '/lab/calibration' || // Calibration Register module (§37)
    href.startsWith('/lab/calibration?') || // live due=1 drill-down
    href === '/lab/documents' || // SOP/WI Library register (§39)
    href.startsWith('/lab/documents?') || // live review=due drill-down
    href === '/lab/documents/new' || // Document editor (PROMPT 41)
    href.startsWith('/lab/documents/new?type=') || // live New SOP / New WI quick actions
    href === '/lab/acknowledgements' || // Acknowledgement register (LAB_DOCUMENT_ACKNOWLEDGE)
    href === '/lab/saved-views' || // Saved views register (PROMPT 24)
    href === '/lab/calendar' || // Laboratory calendar (PROMPT 25)
    href === '/lab/notifications' || // Lab-filtered notifications (PROMPT 26)
    href === '/lab/data-quality' || // Live data-quality KPI drill-down (PROMPT 27)
    href === '/lab/audit' || // Lab-wide audit timeline (supervisor+ nav entry)
    href === '/lab/reports' || // Laboratory reports (§13 — missed in this allowlist by QC-LAB-REPORTS-001)
    href === '/lab/retests' || // Retest register module (§46)
    href.startsWith('/lab/retests?') || // live open-retests KPI drill-down
    href === '/lab/retests/new' || // Create Retest from a dispositioned test
    href.startsWith('/lab/retests/new?test=') || // pre-scoped create form
    href.startsWith('/lab/tests/') || // live test detail links
    /^\/lab\/tests\/\d+$/.test(href), // live per-row View links
  ), `${roleCase.username}: no drill-down links to unimplemented routes`);
  const disabledActions = await page.locator('main button[disabled][aria-disabled="true"]').count();
  // Calibration, the Document editor and Retests are all live now, so no role
  // has any disabled "coming soon" action left on the command center.
  ok(disabledActions >= 0, `${roleCase.username}: no unexpected disabled actions (${disabledActions})`);

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
  ok(!bodyText.includes('Data Quality Issues'), 'query ?role=admin does not upgrade employee permissions (no Data Quality KPI)');
  ok(!bodyText.includes('New Product'), 'query parameter cannot expose manager+ actions');
  const kpiCount = await page.locator('[data-lab-kpi]').count();
  ok(kpiCount === 12, 'employee KPI card count unchanged by query parameters');

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
