import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import AxeBuilder from '@axe-core/playwright';
import { chromium } from 'playwright';

const origin = new URL(process.env.BASE_URL ?? 'http://127.0.0.1:4321').origin;
const defaultPaths = [
  '/', '/products/',
  '/products/firewall/', '/products/risk-engine/', '/products/human-gate/',
  '/products/ledger/', '/products/secure-chat/',
  '/docs/', '/contact/', '/auth/sign-up/', '/app/trial/',
];
const paths = process.env.AUDIT_PATHS ? process.env.AUDIT_PATHS.split(',').filter(Boolean) : defaultPaths;
let preview;
let browser;
const results = [];
const failures = [];

async function waitForServer() {
  for (let attempt = 0; attempt < 80; attempt++) {
    try {
      const response = await fetch(origin);
      if (response.ok) return;
    } catch {}
    if (preview?.exitCode !== null && preview?.exitCode !== undefined) {
      throw new Error(`Astro preview exited with code ${preview.exitCode}`);
    }
    await delay(250);
  }
  throw new Error(`Preview server did not respond at ${origin}`);
}

function headingIssues(items) {
  const issues = [];
  let prior = 0;
  for (const { level, text } of items) {
    if (prior && level > prior + 1) issues.push(`h${prior} → h${level}: ${text}`);
    prior = level;
  }
  if (items.filter(item => item.level === 1).length !== 1) {
    issues.push(`expected one h1, found ${items.filter(item => item.level === 1).length}`);
  }
  return issues;
}

try {
  if (!process.env.BASE_URL) {
    preview = spawn('./node_modules/.bin/astro', ['preview', '--host', '127.0.0.1', '--port', '4321', '--strictPort'], {
      stdio: 'ignore', env: { ...process.env },
    });
  }
  await waitForServer();
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });

  for (const path of paths) {
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    const styleSheetHeaders = new Map();
    cdp.on('CSS.styleSheetAdded', ({ header }) => styleSheetHeaders.set(header.styleSheetId, header));
    await cdp.send('DOM.enable');
    await cdp.send('CSS.enable');
    await cdp.send('CSS.startRuleUsageTracking');
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.addInitScript(() => {
      window.__brightaiVitals = { lcp: null, cls: 0, inp: null, shifts: [] };
      try {
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) window.__brightaiVitals.lcp = entry.startTime;
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              window.__brightaiVitals.cls += entry.value;
              window.__brightaiVitals.shifts.push({
                value: entry.value,
                atMs: Math.round(entry.startTime),
                sources: (entry.sources ?? []).slice(0, 3).map(source => ({
                  node: source.node?.id || source.node?.getAttribute?.('class') || source.node?.tagName || '',
                  previous: source.previousRect, current: source.currentRect,
                })),
              });
            }
          }
        }).observe({ type: 'layout-shift', buffered: true });
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (entry.interactionId) window.__brightaiVitals.inp = Math.max(window.__brightaiVitals.inp ?? 0, entry.duration);
          }
        }).observe({ type: 'event', buffered: true, durationThreshold: 16 });
      } catch {}
    });

    const response = await page.goto(`${origin}${path}`, { waitUntil: 'networkidle' });
    const status = response?.status() ?? 0;
    const dependencyBlocked = path === '/app/trial/' && status === 503;
    assert.ok(status === 200 || dependencyBlocked, `${path} unexpected response ${status}`);
    await page.evaluate(() => document.fonts.ready);
    if (!dependencyBlocked) {
      assert.equal(await page.locator('html').getAttribute('dir'), 'rtl', `${path} direction`);
      assert.match(await page.locator('html').getAttribute('lang') ?? '', /^ar(?:-|$)/, `${path} language`);
    }
    assert.equal(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), true, `${path} reduced-motion emulation`);

    const axe = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    const structure = await page.evaluate(() => {
      const headingList = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')]
        .filter(node => node.getClientRects().length)
        .map(node => ({ level: Number(node.tagName.slice(1)), text: (node.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 100) }));
      const landmarks = [...document.querySelectorAll('header,nav,main,footer,[role="banner"],[role="navigation"],[role="main"],[role="contentinfo"]')]
        .filter(node => node.getClientRects().length)
        .map(node => ({ role: node.getAttribute('role') ?? node.tagName.toLowerCase(), label: node.getAttribute('aria-label') ?? node.getAttribute('aria-labelledby') ?? '' }));
      const invalid = [...document.querySelectorAll('[aria-invalid="true"]')].map(node => ({
        id: node.id || node.tagName.toLowerCase(), describedBy: (node.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean),
        missingDescriptionIds: (node.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean).filter(id => !document.getElementById(id)),
      }));
      const unlabelledControls = [...document.querySelectorAll('input:not([type="hidden"]),select,textarea')]
        .filter(node => !node.labels?.length && !node.getAttribute('aria-label') && !node.getAttribute('aria-labelledby'))
        .map(node => node.id || node.outerHTML.slice(0, 100));
      const focusable = [...document.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')]
        .filter(node => node.getClientRects().length).length;
      const images = [...document.images].map(img => ({ src: new URL(img.currentSrc || img.src, location.href).pathname, alt: img.alt, width: img.naturalWidth, height: img.naturalHeight }));
      const reducedMotionScrollBehavior = getComputedStyle(document.documentElement).scrollBehavior;
      const activeMotion = document.getAnimations().filter(animation => animation.playState === 'running' && (animation.effect?.getTiming().duration === 'auto' || animation.effect?.getTiming().duration > 10)).length;
      return { headings: headingList, landmarks, invalid, unlabelledControls, focusable, images, reducedMotionScrollBehavior, activeMotion };
    });

    const keyboard = [];
    await page.keyboard.press('Tab');
    for (let index = 0; index < 6; index++) {
      keyboard.push(await page.evaluate(() => {
        const node = document.activeElement;
        if (!(node instanceof HTMLElement)) return { tag: 'none', focusVisible: false };
        return { tag: node.tagName.toLowerCase(), id: node.id || '', text: (node.innerText || node.getAttribute('aria-label') || '').trim().slice(0, 50), focusVisible: node.matches(':focus-visible') };
      }));
      await page.keyboard.press('Tab');
    }
    const initialVitals = await page.evaluate(() => ({
      lcp: window.__brightaiVitals?.lcp ?? null,
      cls: window.__brightaiVitals?.cls ?? 0,
      shifts: window.__brightaiVitals?.shifts ?? [],
    }));
    const disclosure = page.locator('summary:visible').first();
    let syntheticInteraction = 'none';
    if (await disclosure.count()) {
      await disclosure.click();
      syntheticInteraction = 'details-summary click';
    }
    const navigation = await page.evaluate(({ interaction, initial }) => {
      const entry = performance.getEntriesByType('navigation')[0];
      const resources = performance.getEntriesByType('resource').map(item => ({ name: new URL(item.name).pathname, transferSize: item.transferSize, duration: item.duration }))
        .filter(item => item.transferSize > 100_000).sort((a, b) => b.transferSize - a.transferSize).slice(0, 10);
      const vitals = window.__brightaiVitals ?? {};
      return {
        ttfbMs: entry ? Math.round(entry.responseStart - entry.requestStart) : null,
        lcpMs: initial.lcp == null ? null : Math.round(initial.lcp),
        cls: Math.round((initial.cls ?? 0) * 1000) / 1000,
        layoutShifts: [...(initial.shifts ?? [])].sort((a, b) => b.value - a.value).slice(0, 5),
        inpProxyMs: vitals.inp == null ? null : Math.round(vitals.inp),
        inpNote: 'Synthetic single-page event-timing proxy; not field INP (requires real-user CrUX/RUM distribution).',
        syntheticInteraction: interaction,
        heavyResources: resources,
        resourceCount: performance.getEntriesByType('resource').length,
      };
    }, { interaction: syntheticInteraction, initial: initialVitals });
    const ruleUsage = await cdp.send('CSS.stopRuleUsageTracking');
    let allRuleBytes = 0;
    let usedRuleBytes = 0;
    const stylesheetDetails = [];
    for (const styleSheet of styleSheetHeaders.values()) {
      try {
        const { text } = await cdp.send('CSS.getStyleSheetText', { styleSheetId: styleSheet.styleSheetId });
        const rules = ruleUsage.ruleUsage.filter(rule => rule.styleSheetId === styleSheet.styleSheetId);
        allRuleBytes += text.length;
        const usedBytes = rules.filter(rule => rule.used).reduce((sum, rule) => sum + Math.max(0, rule.endOffset - rule.startOffset), 0);
        usedRuleBytes += usedBytes;
        stylesheetDetails.push({
          url: styleSheet.sourceURL || '(inline stylesheet)',
          totalBytes: text.length,
          usedBytes,
          unusedPercent: text.length ? Math.round((1 - usedBytes / text.length) * 1000) / 10 : null,
        });
      } catch {}
    }
    const cssCoverage = {
      allRuleBytes,
      usedRuleBytes,
      estimatedUnusedPercent: allRuleBytes ? Math.round((1 - usedRuleBytes / allRuleBytes) * 1000) / 10 : null,
      largestStylesheets: stylesheetDetails.sort((a, b) => b.totalBytes - a.totalBytes).slice(0, 8),
      note: 'Chromium CSS rule-use snapshot for this page/state; route-level coverage, not a safe deletion list.',
    };
    const colorScheme = await page.evaluate(() => getComputedStyle(document.body).colorScheme);
    const openDialogs = await page.locator('dialog[open],[role="dialog"]:visible').count();
    const violations = axe.violations.map(item => ({ id: item.id, impact: item.impact, help: item.help, helpUrl: item.helpUrl, nodes: item.nodes.length, nodeDetails: item.nodes.slice(0, 8).map(node => ({ target: node.target, summary: node.failureSummary, html: node.html })) }));
    const pageResult = {
      path, status, dependencyBlocked, axe: { violations, passes: axe.passes.length, incomplete: axe.incomplete.length },
      structure: { ...structure, headingIssues: headingIssues(structure.headings), hasMain: structure.landmarks.some(item => item.role === 'main') },
      keyboard, reducedMotionEmulated: true, openDialogs, colorScheme, metrics: navigation, cssCoverage, pageErrors,
    };
    results.push(pageResult);
    const serious = violations.filter(item => item.impact === 'critical' || item.impact === 'serious');
    if (serious.length) failures.push(`${path}: ${serious.map(item => `${item.id}(${item.impact})`).join(', ')}`);
    if (!dependencyBlocked && !pageResult.structure.hasMain) failures.push(`${path}: no main landmark`);
    if (pageResult.structure.headingIssues.length) failures.push(`${path}: heading hierarchy ${pageResult.structure.headingIssues.join('; ')}`);
    if (structure.unlabelledControls.length) failures.push(`${path}: unlabeled controls ${structure.unlabelledControls.join(', ')}`);
    if (!dependencyBlocked && !keyboard[0]?.focusVisible) failures.push(`${path}: first keyboard focus is not visibly indicated`);
    if (path !== '/app/trial/' && structure.reducedMotionScrollBehavior !== 'auto') failures.push(`${path}: reduced-motion scroll behavior is ${structure.reducedMotionScrollBehavior}`);
    if (structure.activeMotion) failures.push(`${path}: ${structure.activeMotion} CSS/WAAPI animations still running under reduced motion`);
    if (pageErrors.length) failures.push(`${path}: page errors ${pageErrors.join('; ')}`);
    if (structure.invalid.some(item => !item.describedBy.length || item.missingDescriptionIds.length)) failures.push(`${path}: aria-invalid control has missing error association`);
    await page.close();
  }

  // Exercise an actual dialog separately: the design-system reference has a keyboard-accessible modal example.
  const dialogPage = await context.newPage();
  const dialogResponse = await dialogPage.goto(`${origin}/docs/design-system/`, { waitUntil: 'networkidle' });
  if (dialogResponse?.ok()) {
    const invalidEmail = dialogPage.locator('#ds-email');
    if (await invalidEmail.count()) {
      const describedBy = (await invalidEmail.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
      const errorId = 'ds-email-error';
      const errorAssociation = {
        invalid: await invalidEmail.getAttribute('aria-invalid') === 'true',
        errorReferenced: describedBy.includes(errorId),
        errorVisible: await dialogPage.locator(`#${errorId}`).isVisible(),
      };
      results.push({ path: '/docs/design-system/ (error association)', errorAssociation });
      if (!errorAssociation.invalid || !errorAssociation.errorReferenced || !errorAssociation.errorVisible) {
        failures.push('design-system invalid email field does not reference its visible error');
      }
    }
    const trigger = dialogPage.locator('#ds-modal-trigger');
    if (await trigger.count()) {
      await trigger.focus();
      await dialogPage.keyboard.press('Enter');
      const dialog = dialogPage.locator('#ds-example-modal');
      if (await dialog.isVisible()) {
        const first = dialog.locator('[autofocus]');
        const last = dialog.locator('button').last();
        await last.focus();
        await dialogPage.keyboard.press('Tab');
        const wrapsForward = await first.evaluate(node => node === document.activeElement);
        const activeAfterForward = await dialogPage.evaluate(() => ({
          tag: document.activeElement?.tagName?.toLowerCase(), id: document.activeElement?.id ?? '',
          insideDialog: !!document.querySelector('#ds-example-modal')?.contains(document.activeElement),
        }));
        await first.focus();
        await dialogPage.keyboard.press('Shift+Tab');
        const wrapsBackward = await last.evaluate(node => node === document.activeElement);
        const focusRemainsTrapped = activeAfterForward.insideDialog && wrapsBackward;
        results.push({ path: '/docs/design-system/ (dialog interaction)', focusTrap: { wrapsForward, wrapsBackward, activeAfterForward, focusRemainsTrapped } });
        if (!focusRemainsTrapped) failures.push('design-system example dialog lets keyboard focus escape');
      } else {
        results.push({ path: '/docs/design-system/ (dialog interaction)', focusTrap: 'not openable in this build' });
      }
    }
  }
  await dialogPage.close();

  console.log(JSON.stringify({ checkedAt: new Date().toISOString(), origin, pages: paths.length, browser: await browser.version(), results, failures }, null, 2));
  assert.deepEqual(failures, [], 'Accessibility/performance smoke failures');
} finally {
  await browser?.close();
  if (preview && preview.exitCode === null) {
    preview.kill('SIGTERM');
    await new Promise(resolve => preview.once('exit', resolve));
  }
}
