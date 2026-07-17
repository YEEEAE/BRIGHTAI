/**
 * audit-blog-docs.mjs — Targeted axe-core scan on /blog/ and /docs/
 *
 * Runs at 390px (mobile) and 1440px (desktop) viewports.
 * Captures:
 *   - JSON results per page × viewport (4 files)
 *   - Screenshots per page × viewport (4 PNGs)
 *   - Combined Markdown summary
 *
 * Usage:
 *   node scripts/playwright/audit-blog-docs.mjs
 */

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', '..', 'download', 'qa', 'a11y-blog-docs');
fs.mkdirSync(OUT_DIR, { recursive: true });

const BASE_URL = process.env.A11Y_BASE_URL || 'http://localhost:4321';

const PAGES = [
  { name: 'blog', url: `${BASE_URL}/blog/` },
  { name: 'docs', url: `${BASE_URL}/docs/` },
];

const VIEWPORTS = [
  { name: 'mobile-390', width: 390, height: 844, dpr: 2, isMobile: true, hasTouch: true },
  { name: 'desktop-1440', width: 1440, height: 900, dpr: 1, isMobile: false, hasTouch: false },
];

// Load axe-core from node_modules
const AXE_PATH = path.join(__dirname, '..', '..', 'node_modules', 'axe-core', 'axe.min.js');
if (!fs.existsSync(AXE_PATH)) {
  console.error(`axe.min.js not found at ${AXE_PATH}`);
  process.exit(1);
}
const AXE_SRC = fs.readFileSync(AXE_PATH, 'utf-8');

async function auditOne(browser, pageDef, viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: viewport.dpr,
    isMobile: viewport.isMobile,
    hasTouch: viewport.hasTouch,
  });
  const tab = await context.newPage();
  const consoleErrors = [];
  tab.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });

  const label = `${pageDef.name}-${viewport.name}`;

  try {
    await tab.goto(pageDef.url, { waitUntil: 'networkidle', timeout: 30_000 });
    await tab.addScriptTag({ content: AXE_SRC });

    const result = await tab.evaluate(async () => {
      return await window.axe.run({
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
        resultTypes: ['violations', 'incomplete', 'passes'],
      });
    });

    // Screenshot
    const shotPath = path.join(OUT_DIR, `${label}.png`);
    await tab.screenshot({ path: shotPath, fullPage: true });

    const summary = {
      page: pageDef.name,
      url: pageDef.url,
      viewport: viewport.name,
      width: viewport.width,
      violations: result.violations.length,
      incomplete: result.incomplete.length,
      passes: result.passes.length,
      consoleErrors: consoleErrors.length,
      timestamp: new Date().toISOString(),
      violationsList: result.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        help: v.help,
        helpUrl: v.helpUrl,
        nodes: v.nodes.length,
        targets: v.nodes.slice(0, 8).map((n) => n.target),
        failureSummary: v.nodes.slice(0, 2).map((n) => n.failureSummary),
      })),
      incompleteList: result.incomplete.map((v) => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        nodes: v.nodes.length,
      })),
      consoleErrorsList: consoleErrors,
    };

    fs.writeFileSync(path.join(OUT_DIR, `${label}.json`), JSON.stringify(summary, null, 2));
    return summary;
  } catch (err) {
    return { page: pageDef.name, viewport: viewport.name, error: err.message, timestamp: new Date().toISOString() };
  } finally {
    await tab.close();
    await context.close();
  }
}

const browser = await chromium.launch();
console.log(`Auditing ${PAGES.length} pages × ${VIEWPORTS.length} viewports with axe-core...\n`);

const all = [];
for (const p of PAGES) {
  for (const v of VIEWPORTS) {
    process.stdout.write(`  ${p.name.padEnd(6)} ${v.name.padEnd(14)} ... `);
    const r = await auditOne(browser, p, v);
    all.push(r);
    if (r.error) {
      console.log(`ERROR: ${r.error}`);
    } else {
      const cs = (r.violationsList || []).filter((x) => x.impact === 'critical').length;
      const ss = (r.violationsList || []).filter((x) => x.impact === 'serious').length;
      console.log(`C:${cs} S:${ss} M:${r.violations} incomplete (${r.violations - cs - ss} moderate/minor)`);
    }
  }
}

await browser.close();

// Build Markdown summary
let md = `# axe-core Audit — /blog/ and /docs/ (A11Y-BLOG-LINK + A11Y-DOCS-CONTRAST fix verification)\n\n`;
md += `**Generated**: ${new Date().toISOString()}\n`;
md += `**BASE_URL**: ${BASE_URL}\n`;
md += `**Rules**: wcag2a, wcag2aa, wcag21a, wcag21aa\n`;
md += `**Viewports**: mobile 390×844, desktop 1440×900\n\n`;

md += `## Summary Table\n\n`;
md += `| Page | Viewport | Critical | Serious | Moderate | Minor | Incomplete |\n`;
md += `|---|---|---|---|---|---|---|\n`;
for (const r of all) {
  if (r.error) {
    md += `| ${r.page} | ${r.viewport} | ERROR | — | — | — | — |\n`;
    continue;
  }
  const counts = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  for (const v of r.violationsList || []) {
    if (counts[v.impact] !== undefined) counts[v.impact]++;
  }
  md += `| ${r.page} | ${r.viewport} | ${counts.critical} | ${counts.serious} | ${counts.moderate} | ${counts.minor} | ${r.incomplete} |\n`;
}

const totalCS = all.reduce((s, r) => s + (r.violationsList || []).filter((v) => v.impact === 'critical' || v.impact === 'serious').reduce((n, v) => n + v.nodes, 0), 0);

md += `\n**Total critical+serious node(s)**: ${totalCS}\n\n`;

// Detail per violation
md += `## Violations Detail\n\n`;
for (const r of all) {
  if (!r.violationsList || r.violationsList.length === 0) continue;
  md += `### ${r.page} @ ${r.viewport}\n\n`;
  for (const v of r.violationsList) {
    md += `#### ${v.id} [${v.impact}] — ${v.nodes} node(s)\n`;
    md += `${v.help}\n\n`;
    md += `Doc: ${v.helpUrl}\n\n`;
    for (const t of v.targets.slice(0, 4)) {
      md += `- \`${t.join(' ')}\`\n`;
    }
    if (v.targets.length > 4) md += `- …and ${v.targets.length - 4} more\n`;
    md += `\n`;
  }
}

fs.writeFileSync(path.join(OUT_DIR, 'summary.md'), md);
console.log(`\n✅ Wrote ${path.join(OUT_DIR, 'summary.md')}`);
console.log(`   Screenshots: ${OUT_DIR}/*.png`);

if (totalCS > 0) {
  console.error(`\n❌ ${totalCS} critical/serious node(s) — fix required.`);
  process.exit(1);
} else {
  console.log(`\n✅ 0 critical + 0 serious violations.`);
}
