/**
 * Screenshot script for kernel dashboard pages.
 * Captures all 6 pages at desktop + modal-open variants.
 */
import { chromium } from 'playwright';
import path from 'node:path';

const PAGES = [
  { slug: 'stats', name: '01-stats' },
  { slug: 'scenarios', name: '02-scenarios' },
  { slug: 'compliance', name: '03-compliance' },
  { slug: 'policies', name: '04-policies' },
  { slug: 'connectors', name: '05-connectors' },
  { slug: 'reports', name: '06-reports' },
];

const MODAL_TRIGGERS = {
  scenarios: '[data-scenario-id]',
  policies: '[data-edit-policy]',
  connectors: '[data-configure-connector]',
  reports: '#open-wizard-btn',
};

const OUT_DIR = path.resolve('reports/screenshots/kernel-dashboards');

const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
});

const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  locale: 'ar-SA',
});

for (const page of PAGES) {
  console.log(`Capturing ${page.slug}…`);
  const p = await ctx.newPage();
  await p.goto(`http://localhost:4321/kernel/${page.slug}/`, { waitUntil: 'networkidle', timeout: 30000 }).catch(async () => {
    // Fallback: file:// from dist/
    return p.goto(`file://${path.resolve(`dist/kernel/${page.slug}/index.html`)}`, { waitUntil: 'load' });
  });

  // Wait for charts/modals to render
  await p.waitForTimeout(2500);

  await p.screenshot({
    path: path.join(OUT_DIR, `${page.name}-desktop.png`),
    fullPage: true,
  });

  // Capture modal-open variant if applicable
  const modalTrigger = MODAL_TRIGGERS[page.slug];
  if (modalTrigger) {
    try {
      await p.click(modalTrigger);
      await p.waitForTimeout(800);
      await p.screenshot({
        path: path.join(OUT_DIR, `${page.name}-modal.png`),
        fullPage: false,
      });
    } catch (e) {
      console.warn(`  modal capture failed for ${page.slug}: ${e.message}`);
    }
  }

  await p.close();
}

await browser.close();
console.log(`\nDone. Screenshots saved to ${OUT_DIR}`);