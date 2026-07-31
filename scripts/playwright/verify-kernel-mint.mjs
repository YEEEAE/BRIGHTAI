// verify-kernel-mint.mjs — confirms the kernel-shell mint override applies at runtime.
// Usage: node scripts/playwright/verify-kernel-mint.mjs [kernelPath]
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const kernelPath = process.argv[2] || '/kernel/';

const port = 4399;
const preview = spawn('npx', ['astro', 'preview', '--port', String(port)], { cwd: process.cwd(), detached: true });
await new Promise((r) => setTimeout(r, 2500));

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
try {
  await page.goto('http://localhost:' + port + kernelPath, { waitUntil: 'networkidle', timeout: 30000 });

  const diag = await page.evaluate(() => {
    // Force the class the same way kernel-shell.js initShell() would.
    document.body.classList.add('kernel-shell');
    const cs = getComputedStyle(document.body);
    const results = {
      bodyClassApplied: document.body.classList.contains('kernel-shell'),
      bg: cs.backgroundColor,
      interactive: cs.getPropertyValue('--interactive-primary').trim(),
      textPrimary: cs.getPropertyValue('--text-primary').trim(),
    };
    // Find all stylesheet rules that mention kernel-shell and their layer
    const rules = [];
    for (const sheet of Array.from(document.styleSheets)) {
      let sheetRules;
      try { sheetRules = sheet.cssRules; } catch { continue; }
      for (const rule of Array.from(sheetRules)) {
        if (rule.selectorText && rule.selectorText.includes('kernel-shell')) {
          const layer = rule.parentRule ? rule.parentRule.name || '(nested)' : '(root)';
          const selText = rule.selectorText.slice(0, 60);
          rules.push({ layer, selector: selText, bg: rule.style.getPropertyValue('background-color') || rule.style.getPropertyValue('background') || '' });
        }
      }
    }
    // Find layer statements
    const layerOrder = [];
    for (const sheet of Array.from(document.styleSheets)) {
      for (const rule of Array.from(sheet.cssRules || [])) {
        if (rule.name) layerOrder.push({ sheet: sheet.href ? sheet.href.split('/').pop() : 'inline', name: rule.name });
      }
    }
    return { ...results, rules, layerOrder };
  });

  console.log('body class:', diag.bodyClassApplied);
  console.log('bg:', diag.bg, '| --interactive-primary:', diag.interactive, '| --text-primary:', diag.textPrimary);
  console.log('kernel-shell rules in CSSOM:');
  diag.rules.forEach((r) => console.log('  ', r.layer, '|', r.selector, '| bg:', r.bg));
  console.log('layer statements:');
  diag.layerOrder.forEach((l) => console.log('  ', l.sheet, '→', l.name));

  if (diag.interactive === '#2dd4a7' && diag.bg === 'rgb(8, 13, 22)') {
    console.log('PASS: mint override applies correctly at runtime.');
    await page.screenshot({ path: 'download/qa/kernel-mint.png', fullPage: false });
    process.exit(0);
  }
  console.error('FAIL: override did not apply as expected.');
  process.exit(1);
} catch (e) {
  console.error('FAIL:', e.message);
  process.exit(1);
} finally {
  await browser.close();
  try { process.kill(-preview.pid, 'SIGTERM'); } catch {}
}
