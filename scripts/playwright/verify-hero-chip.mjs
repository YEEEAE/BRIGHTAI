import { chromium } from 'playwright';

const url = 'http://localhost:4321/';
const browser = await chromium.launch();

// Test 1: Desktop — confirm chip rotation works
const ctx1 = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  locale: 'en-US',
});
const page1 = await ctx1.newPage();

const consoleErrors = [];
page1.on('pageerror', (e) => consoleErrors.push(`PAGE ERROR: ${e.message}`));
page1.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(`CONSOLE: ${msg.text()}`);
});

await page1.goto(url, { waitUntil: 'networkidle' });

// Wait for chip to mount
const chip = page1.locator('[data-hero-chip-rotate]');
await chip.waitFor({ state: 'visible', timeout: 5000 });

// Snapshot initial state
const initialWords = await page1.locator('.split-hero__chip-word').allTextContents();
const initialActive = await page1.locator('.split-hero__chip-word.is-active').textContent();

// Capture chip position + size
const chipBox = await chip.boundingBox();
const chipScreenshot = await chip.screenshot({ path: '/tmp/chip-initial.png' });

// Wait 3.2s for rotation (>2.8s interval + transition)
await page1.waitForTimeout(3200);
const rotatedActive = await page1.locator('.split-hero__chip-word.is-active').textContent();
const rotatedScreenshot = await chip.screenshot({ path: '/tmp/chip-rotated.png' });

// Wait another 3.2s for second rotation (back to first)
await page1.waitForTimeout(3200);
const secondActive = await page1.locator('.split-hero__chip-word.is-active').textContent();

// Computed styles check — chip word layout
const wordStyles = await page1.locator('.split-hero__chip-word').first().evaluate((el) => {
  const cs = window.getComputedStyle(el);
  return {
    opacity: cs.opacity,
    transform: cs.transform,
    position: cs.position,
    whiteSpace: cs.whiteSpace,
  };
});

const inactiveStyles = await page1.locator('.split-hero__chip-word:not(.is-active)').first().evaluate((el) => {
  const cs = window.getComputedStyle(el);
  return {
    opacity: cs.opacity,
    position: cs.position,
    pointerEvents: cs.pointerEvents,
  };
});

await ctx1.close();

// Test 2: Mobile viewport — confirm chip visible + rotates
const ctx2 = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 2,
});
const page2 = await ctx2.newPage();
await page2.goto(url, { waitUntil: 'networkidle' });
const mobileChip = page2.locator('[data-hero-chip-rotate]');
await mobileChip.waitFor({ state: 'visible', timeout: 5000 });
const mobileBox = await mobileChip.boundingBox();
const mobileScreenshot = await mobileChip.screenshot({ path: '/tmp/chip-mobile.png' });
const mobileInitial = await page2.locator('.split-hero__chip-word.is-active').textContent();
await page2.waitForTimeout(3200);
const mobileRotated = await page2.locator('.split-hero__chip-word.is-active').textContent();
await ctx2.close();

// Test 3: prefers-reduced-motion — confirm rotation disabled
const ctx3 = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  reducedMotion: 'reduce',
});
const page3 = await ctx3.newPage();
await page3.goto(url, { waitUntil: 'networkidle' });
const reducedChip = page3.locator('[data-hero-chip-rotate]');
await reducedChip.waitFor({ state: 'visible', timeout: 5000 });
const reducedInitial = await page3.locator('.split-hero__chip-word.is-active').textContent();
const reducedInactiveDisplay = await page3.locator('.split-hero__chip-word:not(.is-active)').first().evaluate((el) => {
  return window.getComputedStyle(el).display;
});
await page3.waitForTimeout(3500);
const reducedAfterWait = await page3.locator('.split-hero__chip-word.is-active').textContent();
await ctx3.close();

await browser.close();

// Report
const result = {
  consoleErrors,
  desktop: {
    initialWords,
    initialActive,
    rotatedActive,
    secondActive,
    rotationWorks: initialActive !== rotatedActive && rotatedActive !== secondActive && initialActive === secondActive,
    chipBox,
    wordStyles,
    inactiveStyles,
  },
  mobile: {
    visible: !!mobileBox,
    mobileBox,
    mobileInitial,
    mobileRotated,
    rotationWorks: mobileInitial !== mobileRotated,
  },
  reducedMotion: {
    initial: reducedInitial,
    afterWait: reducedAfterWait,
    inactiveDisplay: reducedInactiveDisplay,
    rotationStopped: reducedInitial === reducedAfterWait,
  },
};

console.log(JSON.stringify(result, null, 2));

// Exit code
const allPassed =
  result.desktop.rotationWorks &&
  result.mobile.rotationWorks &&
  result.reducedMotion.rotationStopped &&
  result.reducedMotion.inactiveDisplay === 'none' &&
  consoleErrors.length === 0;

if (!allPassed) {
  console.error('\n❌ Some checks failed');
  process.exit(1);
} else {
  console.log('\n✅ All checks passed');
  process.exit(0);
}
