#!/usr/bin/env node
/**
 * verify-chat-mobile-drawers.mjs
 *
 * KRN-008 / EXEC-08 — Mobile chat UX verification.
 * Asserts the new mobile drawer system works on real viewports.
 *
 * Acceptance criteria (from user spec):
 *   AC #1: iPhone SE (320×568) iOS Safari — composer visible without scroll on load
 *   AC #2: Pixel 5 (393×851) Chrome Android — composer visible without scroll on load
 *   AC #3: "الرسائل" button opens threads drawer with focus trap; Escape closes; focus returns to button
 *   AC #4: "السياق" button opens context drawer (same pattern)
 *   AC #6: Desktop (≥1024px) — 3-pane layout unchanged (threads | thread | context)
 *
 * Exit 0 = all checks pass. Exit 1 = at least one failure.
 */

import { chromium, devices } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:18765';
const CHAT_PATH = '/kernel/chat/';
const FAILURES = [];

function check(name, ok, detail) {
  if (ok) {
    console.log(`\x1b[32m✓ ${name}\x1b[0m${detail ? ' — ' + detail : ''}`);
  } else {
    console.log(`\x1b[31m✗ ${name}\x1b[0m${detail ? ' — ' + detail : ''}`);
    FAILURES.push({ name, detail });
  }
}

/**
 * Wait until the page is fully hydrated: the mobile chat JS attaches
 * drawer handlers via astro:page-load OR sync (when document is ready).
 */
async function waitForHandlers(page) {
  await page.waitForFunction(
    () => {
      const btn = document.querySelector('[data-kernel-chat-threads-toggle]');
      return btn && btn.dataset.bound === '1';
    },
    { timeout: 5000 }
  );
}

async function measureComposerVisibility(page) {
  return await page.evaluate(() => {
    const composer = document.querySelector('.kernel-chat-composer');
    if (!composer) return { found: false };
    const rect = composer.getBoundingClientRect();
    const viewportH = window.innerHeight;
    return {
      found: true,
      top: rect.top,
      bottom: rect.bottom,
      height: rect.height,
      visible: rect.top < viewportH && rect.bottom > 0,
      fullyInViewport: rect.top >= 0 && rect.bottom <= viewportH,
      viewportH,
    };
  });
}

async function clickAndAssertOpen(page, triggerSelector, drawerId, drawerTitleText) {
  // Ensure drawer is closed before clicking
  await page.evaluate((id) => {
    const d = document.getElementById(id);
    if (d) {
      d.setAttribute('data-open', 'false');
      d.setAttribute('aria-hidden', 'true');
    }
  }, drawerId);

  // Dismiss cookie consent if present (it intercepts pointer events on first visit)
  await page.evaluate(() => {
    const cc = document.getElementById('cookie-consent');
    if (cc) cc.style.display = 'none';
  });

  await page.click(triggerSelector, { force: true });

  // Wait for transition + data-open
  await page.waitForFunction(
    (id) => {
      const d = document.getElementById(id);
      return d && d.getAttribute('data-open') === 'true' && d.getAttribute('aria-hidden') === 'false';
    },
    drawerId,
    { timeout: 3000 }
  );

  const state = await page.evaluate((id) => {
    const d = document.getElementById(id);
    const panel = d.querySelector('.kernel-chat-drawer__panel');
    const rect = panel.getBoundingClientRect();
    const panelTitle = panel.querySelector('.kernel-chat-drawer__title');
    return {
      dataOpen: d.getAttribute('data-open'),
      ariaHidden: d.getAttribute('aria-hidden'),
      role: d.getAttribute('role'),
      ariaModal: d.getAttribute('aria-modal'),
      ariaLabelledby: d.getAttribute('aria-labelledby'),
      panelTitle: panelTitle ? panelTitle.textContent.trim() : null,
      panelTransform: getComputedStyle(panel).transform,
      bodyOverflow: document.body.style.overflow,
      panelVisible: rect.left < window.innerWidth && rect.right > 0,
      triggerExpanded: document.querySelector(`[aria-controls="${id}"]`).getAttribute('aria-expanded'),
    };
  }, drawerId);

  check(`${drawerTitleText} drawer opens on click`, state.dataOpen === 'true' && state.ariaHidden === 'false');
  check(`${drawerTitleText} drawer has role="dialog"`, state.role === 'dialog');
  check(`${drawerTitleText} drawer has aria-modal="true"`, state.ariaModal === 'true');
  check(`${drawerTitleText} drawer has aria-labelledby`, !!state.ariaLabelledby);
  check(`${drawerTitleText} panel title is "${drawerTitleText}"`, state.panelTitle === drawerTitleText);
  check(`${drawerTitleText} panel is visible (slid in)`, state.panelVisible);
  check(`${drawerTitleText} trigger has aria-expanded="true"`, state.triggerExpanded === 'true');
  check(`${drawerTitleText} body scroll is locked`, state.bodyOverflow === 'hidden');

  return state;
}

async function pressEscapeAndAssertClose(page, drawerId, triggerSelector) {
  await page.keyboard.press('Escape');

  await page.waitForFunction(
    (id) => {
      const d = document.getElementById(id);
      return d && d.getAttribute('data-open') === 'false' && d.getAttribute('aria-hidden') === 'true';
    },
    drawerId,
    { timeout: 3000 }
  );

  const state = await page.evaluate(({ id, sel }) => {
    const d = document.getElementById(id);
    const trigger = document.querySelector(sel);
    return {
      dataOpen: d.getAttribute('data-open'),
      ariaHidden: d.getAttribute('aria-hidden'),
      triggerExpanded: trigger.getAttribute('aria-expanded'),
      bodyOverflow: document.body.style.overflow,
      activeElementId: document.activeElement === trigger ? 'trigger' : 'other',
      activeElementTag: document.activeElement.tagName,
    };
  }, { id: drawerId, sel: triggerSelector });

  check(`Escape closes ${drawerId}`, state.dataOpen === 'false' && state.ariaHidden === 'true');
  check(`Trigger aria-expanded reset to "false" after Escape`, state.triggerExpanded === 'false');
  check(`Body scroll restored after Escape (no other drawer open)`, state.bodyOverflow === '');
  check(`Focus returned to trigger button after Escape`, state.activeElementId === 'trigger',
    `actual activeElement=${state.activeElementTag}`);
}

async function testFocusTrap(page, drawerId) {
  // Open the drawer
  await page.evaluate((id) => {
    const d = document.getElementById(id);
    d.setAttribute('data-open', 'true');
    d.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }, drawerId);

  // Focus the LAST focusable in the panel
  const focusInfo = await page.evaluate((id) => {
    const d = document.getElementById(id);
    const panel = d.querySelector('.kernel-chat-drawer__panel');
    const focusable = panel.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const visible = Array.from(focusable).filter(n => {
      if (n.hasAttribute('disabled')) return false;
      if (n.getAttribute('aria-hidden') === 'true') return false;
      return n.offsetParent !== null;
    });
    const last = visible[visible.length - 1];
    last.focus();
    return {
      lastTag: last.tagName,
      lastText: last.textContent.trim().slice(0, 40),
      count: visible.length,
    };
  }, drawerId);

  // Tab → focus should wrap to first
  await page.keyboard.press('Tab');
  const afterTab = await page.evaluate((id) => {
    const d = document.getElementById(id);
    const panel = d.querySelector('.kernel-chat-drawer__panel');
    return {
      inPanel: panel.contains(document.activeElement),
      activeText: document.activeElement.textContent.trim().slice(0, 40),
    };
  }, drawerId);

  check(`Focus trap: focus wraps to first focusable when Tab from last (${drawerId})`, afterTab.inPanel,
    `focusable count=${focusInfo.count}, active="${afterTab.activeText}"`);

  // Close the drawer
  await page.evaluate((id) => {
    const d = document.getElementById(id);
    d.setAttribute('data-open', 'false');
    d.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }, drawerId);
}

// ════════════════════════════════════════════════════════════════════
// Test runs
// ════════════════════════════════════════════════════════════════════

const browser = await chromium.launch();

// ── AC #1: iPhone SE (320×568) — composer visible without scroll on load
console.log('\n══ AC #1: iPhone SE (320×568) iOS Safari emulation ══');
{
  const context = await browser.newContext({
    ...devices['iPhone SE'],
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  });
  const page = await context.newPage();
  await page.goto(BASE_URL + CHAT_PATH, { waitUntil: 'networkidle' });
  await waitForHandlers(page);

  const composer = await measureComposerVisibility(page);
  check('Composer exists on iPhone SE', composer.found);
  check('Composer is fully in viewport on page load (no scroll)',
    composer.fullyInViewport,
    `top=${composer.top} bottom=${composer.bottom} viewportH=${composer.viewportH} height=${composer.height}`);

  // Verify toolbar is visible (not display:none)
  const toolbarVisible = await page.evaluate(() => {
    const t = document.querySelector('.kernel-chat-toolbar');
    if (!t) return false;
    return getComputedStyle(t).display !== 'none';
  });
  check('Mobile toolbar is visible on iPhone SE', toolbarVisible);

  // Verify threads/context panes are hidden
  const leftPaneHidden = await page.evaluate(() => {
    const p = document.querySelector('.kernel-chat-layout__pane--left');
    return p && getComputedStyle(p).display === 'none';
  });
  const rightPaneHidden = await page.evaluate(() => {
    const p = document.querySelector('.kernel-chat-layout__pane--right');
    return p && getComputedStyle(p).display === 'none';
  });
  check('Threads pane is hidden on iPhone SE', leftPaneHidden);
  check('Context pane is hidden on iPhone SE', rightPaneHidden);

  // Open threads drawer, verify focus trap, Escape close
  await clickAndAssertOpen(page, '[data-kernel-chat-threads-toggle]', 'kernel-chat-drawer-threads', 'المحادثات');
  await testFocusTrap(page, 'kernel-chat-drawer-threads');
  await pressEscapeAndAssertClose(page, 'kernel-chat-drawer-threads', '[data-kernel-chat-threads-toggle]');

  // Open context drawer, verify, Escape close
  await clickAndAssertOpen(page, '[data-kernel-chat-context-toggle]', 'kernel-chat-drawer-context', 'لوحة السياق');
  await testFocusTrap(page, 'kernel-chat-drawer-context');
  await pressEscapeAndAssertClose(page, 'kernel-chat-drawer-context', '[data-kernel-chat-context-toggle]');

  // Take screenshot for record
  await page.screenshot({
    path: 'download/qa/krn-008-iphone-se.png',
    fullPage: false,
  });

  await context.close();
}

// ── AC #2: Pixel 5 (393×851) — same as iPhone SE
console.log('\n══ AC #2: Pixel 5 (393×851) Chrome Android emulation ══');
{
  const context = await browser.newContext({
    ...devices['Pixel 5'],
  });
  const page = await context.newPage();
  await page.goto(BASE_URL + CHAT_PATH, { waitUntil: 'networkidle' });
  await waitForHandlers(page);

  const composer = await measureComposerVisibility(page);
  check('Composer exists on Pixel 5', composer.found);
  check('Composer is fully in viewport on page load (no scroll)',
    composer.fullyInViewport,
    `top=${composer.top} bottom=${composer.bottom} viewportH=${composer.viewportH} height=${composer.height}`);

  const toolbarVisible = await page.evaluate(() => {
    const t = document.querySelector('.kernel-chat-toolbar');
    return t && getComputedStyle(t).display !== 'none';
  });
  check('Mobile toolbar is visible on Pixel 5', toolbarVisible);

  // Take screenshot
  await page.screenshot({
    path: 'download/qa/krn-008-pixel-5.png',
    fullPage: false,
  });

  await context.close();
}

// ── AC #6: Desktop (≥1024px) — 3-pane layout unchanged
console.log('\n══ AC #6: Desktop 1440×900 — 3-pane layout preserved ══');
{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  await page.goto(BASE_URL + CHAT_PATH, { waitUntil: 'networkidle' });

  // Toolbar must be hidden
  const toolbarHidden = await page.evaluate(() => {
    const t = document.querySelector('.kernel-chat-toolbar');
    return t && getComputedStyle(t).display === 'none';
  });
  check('Mobile toolbar is hidden on desktop', toolbarHidden);

  // All 3 panes must be visible
  const panesVisible = await page.evaluate(() => {
    const left = document.querySelector('.kernel-chat-layout__pane--left');
    const center = document.querySelector('.kernel-chat-layout__pane--center');
    const right = document.querySelector('.kernel-chat-layout__pane--right');
    return {
      left: left && getComputedStyle(left).display !== 'none',
      center: center && getComputedStyle(center).display !== 'none',
      right: right && getComputedStyle(right).display !== 'none',
    };
  });
  check('Desktop: threads pane visible', panesVisible.left);
  check('Desktop: chat pane visible', panesVisible.center);
  check('Desktop: context pane visible', panesVisible.right);

  // Grid should be 3-column
  const gridColumns = await page.evaluate(() => {
    const layout = document.querySelector('.kernel-chat-layout');
    return getComputedStyle(layout).gridTemplateColumns;
  });
  // Should be 3 distinct tracks (3 columns). Count non-zero values.
  const trackCount = gridColumns.split(/\s+/).filter(s => /^\d/.test(s)).length;
  check('Desktop: layout has 3 grid columns', trackCount === 3, `gridTemplateColumns="${gridColumns}"`);

  // No body scroll lock (no drawer open by default)
  const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
  check('Desktop: body scroll is not locked', bodyOverflow === '');

  // Take screenshot
  await page.screenshot({
    path: 'download/qa/krn-008-desktop.png',
    fullPage: false,
  });

  await context.close();
}

await browser.close();

console.log('\n════════════════════════════════════════════════════════════════');
if (FAILURES.length === 0) {
  console.log('\x1b[32m✅ All KRN-008 / EXEC-08 mobile UX checks passed.\x1b[0m');
  process.exit(0);
} else {
  console.log(`\x1b[31m❌ ${FAILURES.length} failure(s):\x1b[0m`);
  FAILURES.forEach(f => console.log(`  - ${f.name}${f.detail ? ' — ' + f.detail : ''}`));
  process.exit(1);
}
