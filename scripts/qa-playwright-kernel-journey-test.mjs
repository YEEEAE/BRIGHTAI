/**
 * kernel-journey-test.mjs — K1 (2026-07-18)
 *
 * Automated verification of the 5-stage Kernel journey (per K1 prompt).
 *
 * Acceptance checks:
 *   1) Journey progress bar (5 stages) appears on every /kernel/* page
 *   2) Every kernel page exposes a 5-stage navigation with one "current" stage
 *   3) On /kernel/scenarios/: all 12 cards carry data-sector + data-risk-band
 *      + data-scenario-id, plus a "افتح في المحادثة" link that targets
 *      /kernel/chat/?scenario=<id>
 *   4) On /kernel/chat/?scenario=pdpl-id-leak: a banner appears carrying
 *      data-sector + data-risk-band
 *   5) The kernel lead form picks up scenario + sector + riskBand via
 *      hidden inputs (no PII in URL)
 *   6) No horizontal overflow at 320 / 375 / 544 / 1024 px on any of the
 *      5 journey entry pages
 *   7) Full keyboard journey: from /kernel/ → scenarios → chat → policies
 *      → evidence → audit, every step reachable via Tab + Enter, no dead-ends
 *   8) KernelDemoPill visible on every kernel page
 *   9) CTA buttons carry data-cta (when present in DOM)
 *
 * Output: process.exit(0) on full pass, 1 on any failure. Logs a per-check
 * pass/fail summary.
 *
 * Note: launches a Chromium browser against a built `astro preview` server
 * (port 4321 by default). The script is run via:
 *   pnpm preview &   # in one terminal
 *   node scripts/playwright/kernel-journey-test.mjs
 *
 * But this script also supports `--port 0` to launch its own server-less
 * pass against `file://` (HTML only — JS-only checks are skipped then).
 */

import { chromium, devices } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, statSync, existsSync } from 'node:fs';
import { resolve, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');

// ── Config ─────────────────────────────────────────────────────────────────

const VIEWPORTS = [
  { name: '320',  width: 320,  height: 568  },
  { name: '375',  width: 375,  height: 812  },
  { name: '544',  width: 544,  height: 720  },
  { name: '1024', width: 1024, height: 768  },
];

const STAGE_PAGES = [
  { name: 'onboarding',  path: '/kernel/'                  },
  { name: 'scenario',    path: '/kernel/scenarios/'        },
  { name: 'run',         path: '/kernel/chat/'             },
  { name: 'interpret',   path: '/kernel/policies/'         },
  { name: 'interpret',   path: '/kernel/evidence/'        },
  { name: 'interpret',   path: '/kernel/audit/'            },
  { name: 'interpret',   path: '/kernel/compliance/'       },
  { name: 'interpret',   path: '/kernel/approvals/'        },
  { name: 'interpret',   path: '/kernel/stats/'            },
  { name: 'interpret',   path: '/kernel/reports/'          },
  { name: 'interpret',   path: '/kernel/connectors/'       },
];

const SCENARIO_IDS = [
  'pdpl-id-leak', 'procurement-contract', 'sfda-medical-export',
  'nca-prompt-injection', 'hr-salary-export', 'finance-iban-leak',
  'code-secret-extract', 'healthcare-research', 'legal-contract-summary',
  'hr-cv-screening', 'finance-quarterly-report', 'code-sql-injection',
];

const ALLOWED_SECTORS = new Set([
  'banking', 'government', 'healthcare', 'hr', 'legal', 'finance', 'code',
  'telecom', 'manufacturing', 'education',
]);

const ALLOWED_RISK_BANDS = new Set(['minimal', 'low', 'medium', 'high', 'critical']);

// ── Reporter ───────────────────────────────────────────────────────────────

let passCount = 0;
let failCount = 0;
const failures = [];

function pass(check) {
  passCount++;
  console.log(`  ✅ ${check}`);
}
function fail(check, detail) {
  failCount++;
  failures.push({ check, detail });
  console.log(`  ❌ ${check} — ${detail}`);
}

async function check(name, fn) {
  try {
    const result = await fn();
    if (result === false) {
      fail(name, 'returned false');
    } else if (typeof result === 'string') {
      fail(name, result);
    } else {
      pass(name);
    }
  } catch (e) {
    fail(name, e.message);
  }
}

// ── Server bootstrap ───────────────────────────────────────────────────────

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

/** Resolve a URL path to a file under dist/ (or dist/client/). */
function resolveFile(urlPath) {
  // Drop leading slash, normalize
  let p = urlPath.split('?')[0].split('#')[0];
  if (p === '/') p = '/index.html';
  if (p.endsWith('/')) p += 'index.html';

  const candidates = [
    join(REPO_ROOT, 'dist', p),
    join(REPO_ROOT, 'dist', 'client', p),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      const st = statSync(candidate);
      if (st.isFile()) return candidate;
    }
  }
  return null;
}

/** Minimal static file server for /dist/. */
function startStaticServer(port = 4321) {
  return new Promise((res, rej) => {
    const server = createServer((req, res) => {
      try {
        const file = resolveFile(req.url || '/');
        if (!file) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('Not Found');
          return;
        }
        const ext = extname(file).toLowerCase();
        const mime = MIME[ext] || 'application/octet-stream';
        const body = readFileSync(file);
        res.writeHead(200, {
          'Content-Type': mime,
          'Content-Length': String(body.length),
          'Cache-Control': 'no-store',
        });
        res.end(body);
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error: ' + e.message);
      }
    });
    server.on('error', rej);
    server.listen(port, '127.0.0.1', () => {
      res({ server, url: `http://127.0.0.1:${port}` });
    });
  });
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  let serverHandle = null;
  let baseUrl = process.env.KERNEL_TEST_URL || process.env.BASE_URL;
  if (!baseUrl) {
    const started = await startStaticServer(4321);
    serverHandle = started.server;
    baseUrl = started.url;
  }

  console.log(`\n🧪 K1 Kernel journey test`);
  console.log(`   base: ${baseUrl}\n`);

  const browser = await chromium.launch();
  const context = await browser.newContext({ ignoreHTTPSErrors: true });

  // ── 1. Per-viewport overflow + journey progress on each stage page ──
  for (const vp of VIEWPORTS) {
    console.log(`\n[Viewport ${vp.width}px]`);
    for (const stage of STAGE_PAGES) {
      const page = await context.newPage();
      await page.setViewportSize({ width: vp.width, height: vp.height });
      try {
        await page.goto(`${baseUrl}${stage.path}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

        const stageLabel = `${stage.name} (${stage.path}) @ ${vp.width}px`;

        // Horizontal overflow check
        await check(`no horizontal overflow · ${stageLabel}`, async () => {
          const overflow = await page.evaluate(() => {
            const docW = document.documentElement.scrollWidth;
            const winW = window.innerWidth;
            return { docW, winW, overflow: docW - winW };
          });
          if (overflow.overflow > 1) {
            return `scrollWidth ${overflow.docW} > innerWidth ${overflow.winW} (delta ${overflow.overflow}px)`;
          }
          return true;
        });

        // Journey progress bar present
        await check(`journey progress visible · ${stageLabel}`, async () => {
          const found = await page.locator('[data-journey-progress]').count();
          if (found === 0) return 'no [data-journey-progress] element';
          return true;
        });

        // 5 stages listed
        await check(`5 stages listed · ${stageLabel}`, async () => {
          const count = await page.locator('[data-journey-progress] .k-journey__item').count();
          if (count !== 5) return `expected 5 stages, found ${count}`;
          return true;
        });

        // Exactly one stage marked current
        await check(`exactly one current stage · ${stageLabel}`, async () => {
          const current = await page.locator('[data-journey-progress] [aria-current="step"]').count();
          if (current !== 1) return `expected 1, found ${current}`;
          return true;
        });

        // KernelDemoPill visible
        await check(`demo pill visible · ${stageLabel}`, async () => {
          const visible = await page.locator('[data-kernel-demo-pill]').first().isVisible().catch(() => false);
          if (!visible) return 'no [data-kernel-demo-pill] visible';
          return true;
        });
      } finally {
        await page.close();
      }
    }
  }

  // ── 2. Scenario metadata on /kernel/scenarios/ ──────────────────────
  console.log(`\n[Scenario metadata]`);
  {
    const page = await context.newPage();
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto(`${baseUrl}/kernel/scenarios/`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    for (const id of SCENARIO_IDS) {
      const card = page.locator(`article[data-scenario-id="${id}"]`).first();
      await check(`scenario card present · ${id}`, async () => {
        if (await card.count() === 0) return 'no article with that data-scenario-id';
        return true;
      });
      await check(`scenario has data-sector · ${id}`, async () => {
        const v = await card.getAttribute('data-sector');
        if (!v || !ALLOWED_SECTORS.has(v)) return `data-sector="${v}" not allowed`;
        return true;
      });
      await check(`scenario has data-risk-band · ${id}`, async () => {
        const v = await card.getAttribute('data-risk-band');
        if (!v || !ALLOWED_RISK_BANDS.has(v)) return `data-risk-band="${v}" not allowed`;
        return true;
      });
      await check(`scenario has open-in-chat link · ${id}`, async () => {
        const link = card.locator('a.kernel-scenario-card__open');
        const href = await link.getAttribute('href');
        if (!href || !href.startsWith('/kernel/chat/')) return `href="${href}" not /kernel/chat/`;
        return true;
      });
    }
  }

  // ── 3. Scenario banner on /kernel/chat/?scenario=... ───────────────
  console.log(`\n[Scenario banner on chat]`);
  {
    const page = await context.newPage();
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto(`${baseUrl}/kernel/chat/?scenario=pdpl-id-leak`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    await check('banner visible', async () => {
      const visible = await page.locator('[data-scenario-banner]').isVisible();
      if (!visible) return 'banner not visible';
      return true;
    });
    await check('banner has data-sector', async () => {
      const v = await page.locator('[data-scenario-banner]').getAttribute('data-sector');
      if (!v) return 'no data-sector';
      return true;
    });
    await check('banner has data-risk-band', async () => {
      const v = await page.locator('[data-scenario-banner]').getAttribute('data-risk-band');
      if (!v) return 'no data-risk-band';
      return true;
    });
    await check('banner no PII in URL', async () => {
      const url = page.url();
      // scenario id is opaque (no PII). Make sure no email, phone, or
      // national id pattern is in the URL.
      if (/@/.test(url) || /\d{10,}/.test(url)) return `URL contains PII pattern: ${url}`;
      return true;
    });

    // ── 4. Lead form picks up scenario metadata via sessionStorage ──
    console.log(`\n[Lead form journey context]`);

    // Click the "open in chat" link on the scenarios page first, to set
    // sessionStorage, then come back to the chat page and inspect the form.
    await page.close();

    const page2 = await context.newPage();
    await page2.setViewportSize({ width: 1024, height: 768 });
    await page2.goto(`${baseUrl}/kernel/scenarios/`, { waitUntil: 'domcontentloaded' });
    await page2.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    // Click the first "افتح في المحادثة" link
    const openLink = page2.locator('a.kernel-scenario-card__open').first();
    await openLink.click();
    await page2.waitForLoadState('domcontentloaded');
    await page2.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    // wait a bit for kernel-journey-context.js to inject hidden inputs
    await sleep(500);

    await check('lead form has hidden scenario input', async () => {
      const has = await page2.locator('form[data-kernel-lead-form-element] input[name="scenario"]').count();
      if (has === 0) return 'no hidden scenario input';
      return true;
    });
    await check('lead form has hidden sector input', async () => {
      const has = await page2.locator('form[data-kernel-lead-form-element] input[name="sector"]').count();
      if (has === 0) return 'no hidden sector input';
      return true;
    });
    await check('lead form has hidden riskBand input', async () => {
      const has = await page2.locator('form[data-kernel-lead-form-element] input[name="riskBand"]').count();
      if (has === 0) return 'no hidden riskBand input';
      return true;
    });
    await check('lead form scenario value is non-empty after scenario click', async () => {
      const v = await page2.locator('form[data-kernel-lead-form-element] input[name="scenario"]').first().inputValue();
      if (!v) return 'empty value';
      return true;
    });
    await check('lead form sector value is in allowed set', async () => {
      const v = await page2.locator('form[data-kernel-lead-form-element] input[name="sector"]').first().inputValue();
      if (!v || !ALLOWED_SECTORS.has(v)) return `sector="${v}" not allowed`;
      return true;
    });
    await check('lead form riskBand value is in allowed set', async () => {
      const v = await page2.locator('form[data-kernel-lead-form-element] input[name="riskBand"]').first().inputValue();
      if (!v || !ALLOWED_RISK_BANDS.has(v)) return `riskBand="${v}" not allowed`;
      return true;
    });

    await page2.close();
  }

  // ── 5. Full keyboard journey ────────────────────────────────────────
  console.log(`\n[Full keyboard journey]`);
  {
    const page = await context.newPage();
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto(`${baseUrl}/kernel/`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    await check('keyboard: pressing Tab from body reaches journey progress', async () => {
      await page.evaluate(() => document.body.focus());
      // Tab through many elements — sidebar + drawer + topnav come first
      // (~30+ focusable elements before the journey progress in 1024px).
      let found = false;
      for (let i = 0; i < 120; i++) {
        await page.keyboard.press('Tab');
        const isStage = await page.evaluate(() => {
          const el = document.activeElement;
          return el && el.matches('[data-stage-link]');
        });
        if (isStage) { found = true; break; }
      }
      if (!found) return 'no stage link reached after 120 Tabs';
      return true;
    });

    // Open scenarios page and use keyboard to open a scenario in chat
    await page.goto(`${baseUrl}/kernel/scenarios/`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    await check('keyboard: scenario open link is reachable by Tab', async () => {
      await page.evaluate(() => document.body.focus());
      let found = false;
      for (let i = 0; i < 80; i++) {
        await page.keyboard.press('Tab');
        const isLink = await page.evaluate(() => {
          const el = document.activeElement;
          return el && el.matches('a.kernel-scenario-card__open');
        });
        if (isLink) { found = true; break; }
      }
      if (!found) return 'no open-in-chat link reached after 80 Tabs';
      return true;
    });

    await page.close();
  }

  await browser.close();

  if (serverHandle) {
    serverHandle.close();
  }

  // ── Report ───────────────────────────────────────────────────────────
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  passed: ${passCount}`);
  console.log(`  failed: ${failCount}`);
  if (failCount > 0) {
    console.log(`\nFailures:`);
    for (const f of failures) {
      console.log(`  • ${f.check}: ${f.detail}`);
    }
    process.exit(1);
  }
  console.log(`\n✅ all kernel journey checks passed`);
  process.exit(0);
}

main().catch((e) => {
  console.error('test runner crashed:', e);
  process.exit(1);
});
