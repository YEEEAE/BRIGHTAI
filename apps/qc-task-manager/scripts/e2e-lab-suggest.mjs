// E2E spec for the /lab/search suggestion combobox (progressive enhancement).
//
// Runs against a LIVE server sharing the same SQLite database.
// Covers:
//   A. Progressive enhancement: with JS disabled the page still renders the
//      plain GET search form (input + submit) and no suggestion machinery.
//   B. Combobox ARIA: typing past the minimum length opens the listbox,
//      aria-expanded flips true, options expose role=option.
//   C. Keyboard: ArrowDown moves aria-activedescendant, Escape closes
//      (aria-expanded false), focus stays on the input.
//   D. Debounce: a burst of keystrokes yields at most one suggestion request
//      per pause window (counted via page.on('request')).
//   E. RBAC non-discovery: the employee never sees the supervisor's records
//      in suggestions.
//   F. Focus visibility: the combobox has a visible focus ring style.

import { chromium } from 'playwright';
import Database from 'better-sqlite3';

const BASE = process.env.BASE_URL ?? 'http://localhost:4399';
const DB_PATH = process.env.QC_DATABASE_PATH || process.env.QC_DB_PATH;
if (!DB_PATH) {
  console.error('❌ QC_DATABASE_PATH is required (must match the server database).');
  process.exit(1);
}
const PASS = process.env.ADMIN_DEFAULT_PASSWORD ?? 'admin123';

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

const db = new Database(DB_PATH, { readonly: false });
const browser = await chromium.launch({ headless: true });

async function login(page, username) {
  await page.goto(`${BASE}/login`);
  await page.fill('#username', username);
  await page.fill('#password', PASS);
  await page.locator('form[action="/login"] button[type="submit"]').click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15_000 });
}

try {
  // Deterministic fixture: employee-own + supervisor-foreign records.
  const employeeId = Number(db.prepare("SELECT id FROM users WHERE username = 'employee'").get().id);
  const supervisorId = Number(db.prepare("SELECT id FROM users WHERE username = 'supervisor'").get().id);
  const insertTest = db.prepare(`
    INSERT INTO lab_test_records (test_number, test_type, sample_count, status, tested_by, created_by)
    VALUES (?, 'air', 1, 'DRAFT', ?, ?)
    ON CONFLICT(test_number) DO NOTHING
  `);
  insertTest.run('E2E-SUG-OWN-1', employeeId, employeeId);
  insertTest.run('E2E-SUG-OWN-2', employeeId, employeeId);
  insertTest.run('E2E-SUG-FOREIGN-1', supervisorId, supervisorId);

  // ── A. Progressive enhancement (JS disabled) ──
  console.log('\n■ A. No-JS fallback');
  {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await login(page, 'employee');
    await page.goto(`${BASE}/lab/search`);
    ok(await page.locator('#lab-search-input').isVisible(), 'no-JS: search input renders');
    ok(await page.locator('form[action="/lab/search"]:has(#lab-search-input) button[type="submit"]').isVisible(), 'no-JS: submit button renders');
    ok(await page.locator('#lab-search-suggest').isHidden(), 'no-JS: suggestion listbox stays hidden');
    // The form still performs a server-rendered search.
    await page.fill('#lab-search-input', 'E2E-SUG-OWN');
    await page.locator('form[action="/lab/search"]:has(#lab-search-input) button[type="submit"]').click();
    await page.waitForURL((u) => u.pathname === '/lab/search' && u.searchParams.get('q') === 'E2E-SUG-OWN');
    ok(await page.locator('table').first().isVisible(), 'no-JS: GET search still returns the results table');
    await ctx.close();
  }

  // ── B–F. Combobox behavior with JS ──
  const page = await browser.newPage();
  await login(page, 'employee');
  await page.goto(`${BASE}/lab/search`);

  const input = page.locator('#lab-search-input');
  const list = page.locator('#lab-search-suggest');

  console.log('\n■ B. Combobox ARIA');
  ok((await input.getAttribute('role')) === 'combobox', 'input has role=combobox');
  ok((await input.getAttribute('aria-expanded')) === 'false', 'aria-expanded starts false');
  ok((await input.getAttribute('aria-controls')) === 'lab-search-suggest', 'aria-controls points at the listbox');
  ok((await list.getAttribute('role')) === 'listbox', 'listbox has role=listbox');

  let suggestRequests = 0;
  page.on('request', (req) => {
    if (req.url().includes('/api/lab/search-suggest')) suggestRequests += 1;
  });

  await input.click();
  await input.type('E2E-SUG', { delay: 60 }); // 7 keystrokes, each within the debounce window
  await page.waitForTimeout(700);
  ok((await input.getAttribute('aria-expanded')) === 'true', 'typing opens the listbox (aria-expanded=true)');
  const optionCount = await page.locator('#lab-search-suggest [role="option"]').count();
  ok(optionCount > 0, `options render (${optionCount})`);
  const optionTexts = await page.locator('#lab-search-suggest [role="option"]').allInnerTexts();
  ok(optionTexts.some((t) => t.includes('E2E-SUG-OWN-1')), 'own test appears in suggestions');
  ok(!optionTexts.some((t) => t.includes('E2E-SUG-FOREIGN-1')), 'foreign test never appears (non-discovery)');

  console.log('\n■ D. Debounce (one request per pause window)');
  ok(suggestRequests === 1, `burst of keystrokes fired exactly one suggestion request (got ${suggestRequests})`);

  console.log('\n■ C. Keyboard navigation');
  await input.press('ArrowDown');
  const active = await input.getAttribute('aria-activedescendant');
  ok(Boolean(active), `ArrowDown sets aria-activedescendant (${active})`);
  const activeSelected = await page.locator(`#${active}`).getAttribute('aria-selected');
  ok(activeSelected === 'true', 'active option carries aria-selected=true');
  await input.press('ArrowDown');
  ok((await input.getAttribute('aria-activedescendant')) !== active, 'second ArrowDown moves the active option');
  await input.press('Escape');
  ok((await input.getAttribute('aria-expanded')) === 'false', 'Escape closes the listbox');
  ok((await page.evaluate(() => document.activeElement?.id)) === 'lab-search-input', 'focus stays on the combobox after Escape');
  ok(await list.isHidden(), 'listbox is hidden after Escape');

  console.log('\n■ F. Focus visibility');
  const focusIndicator = await page.evaluate(() => {
    const el = document.querySelector('#lab-search-input');
    if (!el) return null;
    el.focus();
    const cs = getComputedStyle(el);
    return { outlineStyle: cs.outlineStyle, boxShadow: cs.boxShadow, borderColor: cs.borderColor };
  });
  ok(
    focusIndicator !== null &&
      (focusIndicator.boxShadow !== 'none' || focusIndicator.outlineStyle !== 'none'),
    'combobox shows a visible focus indicator (ring/outline) when focused',
  );

  console.log(`\n✅ ${passed} passed, ${failed} failed (e2e lab suggest)`);
  if (failed > 0) {
    console.error('\nFailures:');
    for (const f of failures) console.error(`  - ${f}`);
    process.exitCode = 1;
  }
} catch (err) {
  console.error('❌ e2e lab suggest crashed:', err);
  process.exitCode = 1;
} finally {
  await browser.close();
  db.close();
}
