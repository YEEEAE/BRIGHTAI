// Visual QA tool (docs phase 27): captures full-page screenshots of the
// representative screens at 1440 / 768 / 375 px against a LIVE server with a
// disposable database, and records programmatic overflow checks
// (documentElement.scrollWidth <= innerWidth). NOT a test suite — a review
// aid for the UI/UX audit; output lands in download/qa/ui-audit/.
//
// Usage: node scripts/ui-screenshots.mjs
// Requires: a production build (dist/server/entry.mjs) and Playwright.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const APP_DIR = process.cwd();
const OUT_DIR = join(APP_DIR, 'download', 'qa', 'ui-audit');
mkdirSync(OUT_DIR, { recursive: true });
const tempDir = mkdtempSync(join(tmpdir(), 'qc-ui-shots-'));
const dbPath = join(tempDir, 'shots.db');
const PORT = 4560;
const BASE = `http://127.0.0.1:${PORT}`;
const PASS = 'admin123'; // fixture seed (QC_SEED_MUST_CHANGE_PASSWORD=0 below)

// Server env mirrors the acceptance runner's suiteEnv (fixture-only opt-out).
const env = {
  ...process.env,
  NODE_ENV: 'production',
  // Fixture-only: the production seed refuses the default password unless the
  // operator explicitly provides one (mirrors the acceptance runner).
  ADMIN_DEFAULT_PASSWORD: PASS,
  QC_SEED_MUST_CHANGE_PASSWORD: '0',
  HOST: '127.0.0.1',
  PORT: String(PORT),
  BASE_URL: BASE,
  QC_DATABASE_PATH: dbPath,
  QC_DB_PATH: dbPath,
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Ready = GET /login answers 200 (same readiness contract as e2e-acceptance).
async function waitForServer(child, url, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error('server exited early');
    try {
      const res = await fetch(`${url}/login`, { redirect: 'manual' });
      if (res.status === 200) return;
    } catch {}
    await sleep(250);
  }
  throw new Error('server timeout');
}

// POST /login bootstraps schema + seed (GET /login never touches SQLite).
async function warmup(url) {
  const res = await fetch(`${url}/login`, {
    method: 'POST',
    headers: { Origin: url, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'username=admin&password=admin123',
    redirect: 'manual',
  });
  await res.arrayBuffer().catch(() => {});
}

// Screens per role: [name, path]
const SCREENS = {
  public: [['login', '/login']],
  employee: [
    ['employee-home', '/employee'],
    ['search', '/search'],
    ['notifications', '/notifications'],
    ['findings', '/findings'],
    ['lab-home', '/lab'],
    ['lab-tests', '/lab/tests'],
    ['lab-tests-new', '/lab/tests/new?type=air'],
    ['lab-change-requests', '/lab/change-requests'],
  ],
  supervisor: [
    ['supervisor-home', '/supervisor'],
    ['lab-tests-review', '/lab/tests/review'],
    ['lab-documents', '/lab/documents'],
    ['lab-equipment', '/lab/equipment'],
  ],
  manager: [
    ['manager-home', '/manager'],
    ['dashboard', '/dashboard'],
    ['reports', '/reports'],
    ['manager-workload', '/manager/workload'],
  ],
  admin: [
    ['admin-users', '/admin/users'],
    ['admin-system-health', '/admin/system-health'],
    ['404', '/definitely-not-a-page'],
  ],
};
const WIDTHS = [1440, 768, 375];

const overflowReport = [];
let captured = 0;

async function login(context, username) {
  const page = await context.newPage();
  await page.goto(`${BASE}/login`);
  await page.fill('#username', username);
  await page.fill('#password', PASS);
  await page.locator('form[action="/login"] button[type="submit"]').click();
  try {
    await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15_000 });
  } catch (err) {
    const flash = await page.locator('[role="alert"]').allInnerTexts().catch(() => []);
    console.error(`login failed for ${username}: url=${page.url()} alerts=${JSON.stringify(flash)}`);
    await page.close();
    throw err;
  }
  await page.close();
}

const server = spawn(process.execPath, ['./dist/server/entry.mjs'], { cwd: APP_DIR, env, stdio: 'inherit' });
try {
  await waitForServer(server, BASE);
  await warmup(BASE);
  const browser = await chromium.launch({ headless: true });

  for (const width of WIDTHS) {
    for (const [role, screens] of Object.entries(SCREENS)) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      if (role !== 'public') await login(context, role);
      for (const [name, path] of screens) {
        const page = await context.newPage();
        try {
          await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 20_000 });
          await page.waitForTimeout(150); // settle hydration
          // Measure BEFORE the full-page capture: Chromium's fullPage pass
          // resizes the viewport and can transiently skew layout metrics
          // (observed +4px on the sticky-blur lab form at 768px).
          const readMetrics = () =>
            page.evaluate(() => ({
              docWidth: document.documentElement.scrollWidth,
              innerWidth: window.innerWidth,
              h1: document.querySelectorAll('h1').length,
            }));
          let metrics = await readMetrics();
          if (metrics.docWidth > metrics.innerWidth) {
            // Transient overflows happen mid-hydration/font-load — re-measure
            // once after a longer settle before flagging.
            await page.waitForTimeout(600);
            metrics = await readMetrics();
          }
          const shot = join(OUT_DIR, `${name}@${width}.png`);
          await page.screenshot({ path: shot, fullPage: true });
          captured += 1;
          overflowReport.push({
            name,
            width,
            overflow: metrics.docWidth > metrics.innerWidth,
            docWidth: metrics.docWidth,
            h1Count: metrics.h1,
          });
        } catch (err) {
          overflowReport.push({ name, width, error: err.message.slice(0, 120) });
        }
        await page.close();
      }
      await context.close();
    }
  }

  await browser.close();
  console.log(`captured ${captured} screenshots → ${OUT_DIR}`);
  const bad = overflowReport.filter((r) => r.overflow || r.error || (r.h1Count ?? 1) !== 1);
  console.log(`overflow/H1 issues: ${bad.length}`);
  for (const r of bad) console.log(`  ! ${r.name}@${r.width}:`, JSON.stringify(r));
} finally {
  if (server.exitCode === null) server.kill('SIGTERM');
  setTimeout(() => rmSync(tempDir, { recursive: true, force: true }), 1500);
}
