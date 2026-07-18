/**
 * kernel-chat-sse-json-test.mjs — K2 (2026-07-18)
 *
 * Automated verification of the chat composer wiring from K2:
 *   - composer posts to /api/ai/chat with Accept: text/event-stream
 *     (SSE) and auto-detects a JSON response (fallback).
 *   - provider badge reflects the live provider from response metadata —
 *     never a hard-coded "NVIDIA NIM" label.
 *   - DEMO badge appears when the reply is a seed/demo fallback.
 *   - Enter does NOT submit while an IME composition is active (CJK guard).
 *
 * Acceptance checks (subset of K2):
 *   1) No static "NVIDIA" / "NVIDIA NIM" text in the provider card.
 *   2) After sending a message, either a live AI bubble appears and the
 *      provider badge updates to groq/gemini, OR a DEMO badge is shown
 *      (fallback path — expected when API keys are absent in dev).
 *   3) IME composition guard: dispatching compositionstart then Enter
 *      does not submit a message.
 *
 * Run:
 *   node scripts/playwright/kernel-chat-sse-json-test.mjs
 *   BASE_URL=http://127.0.0.1:4321 node scripts/playwright/kernel-chat-sse-json-test.mjs
 *
 * The script launches its own static server against dist/ by default
 * (mirrors kernel-journey-test.mjs). The /api/ai/chat endpoint is NOT
 * served by the static server, so the SSE/JSON request will 404 and the
 * composer falls back to the demo reply — which is exactly what we assert
 * for the provider-truth + demo-badge checks.
 */

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, statSync, existsSync } from 'node:fs';
import { resolve, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

function resolveFile(urlPath) {
  let p = urlPath.split('?')[0].split('#')[0];
  if (p === '/') p = '/index.html';
  if (p.endsWith('/')) p += 'index.html';
  for (const candidate of [join(REPO_ROOT, 'dist', p), join(REPO_ROOT, 'dist', 'client', p)]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

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
        res.writeHead(200, {
          'Content-Type': MIME[ext] || 'application/octet-stream',
          'Cache-Control': 'no-store',
        });
        res.end(readFileSync(file));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
      }
    });
    server.on('error', rej);
    server.listen(port, '127.0.0.1', () => res({ server, url: `http://127.0.0.1:${port}` }));
  });
}

let passCount = 0;
let failCount = 0;
const failures = [];
function pass(check) { passCount++; console.log(`  ✅ ${check}`); }
function fail(check, detail) { failCount++; failures.push({ check, detail }); console.log(`  ❌ ${check} — ${detail}`); }
async function check(name, fn) {
  try {
    const r = await fn();
    if (r === false) fail(name, 'returned false');
    else if (typeof r === 'string') fail(name, r);
    else pass(name);
  } catch (e) { fail(name, e.message); }
}

async function main() {
  let serverHandle = null;
  let baseUrl = process.env.BASE_URL || process.env.KERNEL_TEST_URL;
  if (!baseUrl) {
    const started = await startStaticServer(4321);
    serverHandle = started.server;
    baseUrl = started.url;
  }

  console.log(`\n🧪 K2 Kernel chat SSE/JSON test`);
  console.log(`   base: ${baseUrl}\n`);

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });

  // ── 1. No hard-coded NVIDIA provider label ──
  {
    const page = await ctx.newPage();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${baseUrl}/kernel/chat/`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});

    await check('provider card excludes hard-coded NVIDIA label', async () => {
      const txt = await page.locator('[data-provider-card]').first().innerText();
      if (/nvidia/i.test(txt)) return `found "NVIDIA" in provider card: ${txt.replace(/\s+/g, ' ').slice(0, 80)}`;
      return true;
    });

    await check('provider badge defaults to "—" before first reply', async () => {
      const v = await page.locator('[data-provider-badge]').first().innerText();
      if (v.trim() !== '—') return `expected "—", got "${v}"`;
      return true;
    });
  }

  // ── 2. Send a message — expect live reply OR demo fallback ──
  {
    const page = await ctx.newPage();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${baseUrl}/kernel/chat/`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});

    const input = page.locator('[data-kernel-chat-input]').first();
    const sendBtn = page.locator('[data-kernel-chat-send]').first();

    await check('sending a message produces an AI bubble', async () => {
      await input.fill('اشرح لي ضوابط PDPL باختصار.');
      await sendBtn.click();
      try {
        await page.waitForSelector('.kernel-chat-message--ai', { timeout: 8000 });
      } catch {
        return 'no AI message appeared within 8s (neither live nor demo)';
      }
      return true;
    });

    await check('either provider badge updates (live) or DEMO badge shows (fallback)', async () => {
      // Give the composer time to resolve (live SSE/JSON or demo timeout).
      await page.waitForTimeout(2500);
      const badge = await page.locator('[data-provider-badge]').first().innerText();
      const demoVisible = await page.locator('[data-demo-badge]').first().isVisible().catch(() => false);
      const live = /groq|gemini/i.test(badge);
      if (!live && !demoVisible) {
        return `provider badge="${badge}", demo badge not visible — neither live nor demo state surfaced`;
      }
      return true;
    });
  }

  // ── 3. IME composition guard — Enter must not submit ──
  {
    const page = await ctx.newPage();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${baseUrl}/kernel/chat/`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});

    const input = page.locator('[data-kernel-chat-input]').first();
    await input.click();

    await check('Enter during IME composition does not submit', async () => {
      // Simulate an active IME composition, then press Enter.
      await page.evaluate(() => {
        const el = document.querySelector('[data-kernel-chat-input]');
        el.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
        el.value = 'مرحبا';
      });
      const before = await page.locator('.kernel-chat-message').count();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
      const after = await page.locator('.kernel-chat-message').count();
      if (after > before) return `message submitted during composition (before=${before}, after=${after})`;
      return true;
    });

    await check('Enter after composition ends DOES submit', async () => {
      await page.evaluate(() => {
        const el = document.querySelector('[data-kernel-chat-input]');
        el.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
      });
      const before = await page.locator('.kernel-chat-message').count();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
      const after = await page.locator('.kernel-chat-message').count();
      if (after <= before) return `message NOT submitted after composition end (before=${before}, after=${after})`;
      return true;
    });
  }

  await browser.close();
  if (serverHandle) serverHandle.close();

  console.log(`\n${'='.repeat(60)}`);
  console.log(`  passed: ${passCount}`);
  console.log(`  failed: ${failCount}`);
  if (failCount > 0) {
    console.log(`\nFailures:`);
    for (const f of failures) console.log(`  • ${f.check}: ${f.detail}`);
    process.exit(1);
  }
  console.log(`\n✅ all K2 chat SSE/JSON checks passed`);
  process.exit(0);
}

main().catch((e) => { console.error('test runner crashed:', e); process.exit(1); });
