/**
 * verify-chat-states.mjs — CHAT-STATE-001 verification (2026-08-09).
 *
 * Verifies that the kernel chat page cleanly separates the four
 * conversational states (live / demo / unavailable / blocked) plus the
 * cancelled (user-abort) state, per the AC:
 *   "user always knows what happened, what is happening, and next action".
 *
 * Checks (one per state):
 *   1. LIVE      — SSE 200 with done{provider:'groq'} → badge "مباشر".
 *   2. DEMO      — HTTP 404 → badge "تجريبي" + unavailable banner.
 *   3. UNAVAILABLE (provider_failed) — HTTP 502 → badge "غير متاح" + retry button.
 *   4. BLOCKED   — HTTP 451 firewall block → badge "محظور بالسياسة" + suggested phrasing.
 *   5. CANCELLED — user aborts mid-stream → badge "مُلغى" + retry banner.
 *   6. RATE_LIMIT — HTTP 429 + Retry-After → rate-limit banner, NO demo fallback.
 *
 * Uses Playwright route interception so the tests are deterministic and
 * do not require a live provider. Each check reloads the page so the
 * chat module re-initialises clean.
 *
 * Usage: node scripts/playwright/verify-chat-states.mjs --base=http://localhost:8788
 * Exit 0 = pass, non-zero = fail. Screenshots: download/qa/chat-states/.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const base = process.argv.find((a) => a.startsWith('--base='))?.split('=')[1] ?? 'http://localhost:8788';
const shotDir = 'download/qa/chat-states';
mkdirSync(shotDir, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const failures = [];

function report(label, ok, detail = '') {
  console.log(`  ${ok ? '✅' : '❌'} ${label}${detail ? ' — ' + detail : ''}`);
  if (!ok) failures.push(label);
}

/**
 * Dismiss overlays (cookie consent + kernel onboarding tour) that would
 * intercept clicks on the chat composer. These are page-level chrome,
 * not part of the chat-under-test.
 */
async function dismissOverlays(page) {
  // Cookie consent: accept or hide the dialog.
  await page.evaluate(() => {
    const cc = document.getElementById('cookie-consent');
    if (cc) cc.style.display = 'none';
    const onb = document.querySelector('[data-kernel-onboarding]');
    if (onb) onb.style.display = 'none';
  }).catch(() => {});
}

/** Send a message and wait for the AI article + badge to appear. */
async function sendAndWait(page) {
  await page.fill('[data-kernel-chat-input]', 'سؤال تجريبي');
  await page.click('[data-kernel-chat-send]');
  // Wait for either the AI message or the error banner.
  await page.waitForFunction(
    () => {
      const ai = document.querySelector('.kernel-chat-message--ai:not([data-trace-id]) .kernel-source-badge:not([hidden])');
      const err = document.querySelector('[data-kernel-chat-error-slot] .kernel-chat-policy-banner');
      const blocked = document.querySelector('.kernel-chat-suggestion');
      return ai || err || blocked;
    },
    { timeout: 8000 },
  ).catch(() => {});
}

/** Install a route handler that responds to /api/ai/chat/ with a fixed payload. */
function mockChat(page, { status = 200, json = null, sse = null, headers = {} }) {
  page.route('**/api/ai/chat/**', async (route) => {
    if (sse) {
      // Build an SSE response.
      const frames = sse.map(({ event, data }) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`).join('');
      await route.fulfill({
        status,
        contentType: 'text/event-stream',
        headers: { ...headers },
        body: frames,
      });
    } else if (json) {
      await route.fulfill({
        status,
        contentType: 'application/json',
        headers,
        body: JSON.stringify(json),
      });
    } else {
      await route.fulfill({ status, headers, body: '' });
    }
  });
}

console.log(`\nCHAT-STATE-001 verification — ${base}/kernel/chat/\n`);

// ── 1. LIVE state (SSE 200 + done{provider}) ──────────────────────────
{
  console.log('1) LIVE — SSE 200 with done{provider:"groq"}');
  await page.goto(`${base}/kernel/chat/`, { waitUntil: 'networkidle' });
  await dismissOverlays(page);
  mockChat(page, {
    status: 200,
    sse: [
      { event: 'token', data: { delta: 'هذا رد مباشر من النموذج.' } },
      { event: 'done', data: { provider: 'groq', sessionId: null } },
    ],
  });
  await sendAndWait(page);
  await page.waitForTimeout(500);
  const liveBadge = await page.locator('.kernel-chat-message--ai .kernel-source-badge[data-source="live"]').count();
  report('badge "مباشر" appears on live AI reply', liveBadge > 0, `found ${liveBadge}`);
  await page.screenshot({ path: `${shotDir}/01-live.png`, fullPage: false });
  await page.unroute('**/api/ai/chat/**');
}

// ── 2. DEMO state (HTTP 404) ──────────────────────────────────────────
{
  console.log('\n2) DEMO — HTTP 404 (endpoint unavailable)');
  await page.goto(`${base}/kernel/chat/`, { waitUntil: 'networkidle' });
  await dismissOverlays(page);
  mockChat(page, { status: 404, json: { error: 'not_found' } });
  await sendAndWait(page);
  await page.waitForTimeout(1200); // demo reply has a 700ms delay
  const demoBadge = await page.locator('.kernel-chat-message--ai .kernel-source-badge[data-source="demo"]').count();
  const unavailBanner = await page.locator('[data-kernel-chat-error-slot] .kernel-chat-policy-banner--info').count();
  report('badge "تجريبي" appears on demo reply', demoBadge > 0, `found ${demoBadge}`);
  report('unavailable (info) banner shown', unavailBanner > 0);
  await page.screenshot({ path: `${shotDir}/02-demo.png`, fullPage: false });
  await page.unroute('**/api/ai/chat/**');
}

// ── 3. UNAVAILABLE / provider_failed (HTTP 502) ───────────────────────
{
  console.log('\n3) UNAVAILABLE — HTTP 502 provider_failed');
  await page.goto(`${base}/kernel/chat/`, { waitUntil: 'networkidle' });
  await dismissOverlays(page);
  mockChat(page, { status: 502, json: { error: 'provider_failed', detail: 'timeout' } });
  await sendAndWait(page);
  await page.waitForTimeout(500);
  const errBanner = await page.locator('[data-kernel-chat-error-slot] .kernel-chat-policy-banner--danger').count();
  const retryBtn = await page.locator('[data-kernel-chat-error-slot] [data-kernel-retry]').count();
  const demoFallback = await page.locator('.kernel-chat-message--ai .kernel-source-badge[data-source="demo"]').count();
  report('danger error banner shown for 502', errBanner > 0);
  report('retry button present in banner', retryBtn > 0);
  report('NO demo fallback after provider failure', demoFallback === 0, `found ${demoFallback} (expected 0)`);
  await page.screenshot({ path: `${shotDir}/03-unavailable.png`, fullPage: false });
  await page.unroute('**/api/ai/chat/**');
}

// ── 4. BLOCKED state (HTTP 451 firewall block) ────────────────────────
{
  console.log('\n4) BLOCKED — HTTP 451 firewall block');
  await page.goto(`${base}/kernel/chat/`, { waitUntil: 'networkidle' });
  await dismissOverlays(page);
  mockChat(page, {
    status: 451,
    json: {
      reply: 'تعذّر إرسال الطلب: يحتوي على بيانات محظورة.',
      blocked: true,
      decision: 'block',
      traceId: 'AI-TEST-451',
      findings: ['هوية وطنية', 'رقم جوال'],
    },
  });
  await sendAndWait(page);
  await page.waitForTimeout(500);
  const blockedBadge = await page.locator('.kernel-chat-message--ai .kernel-source-badge[data-source="blocked"]').count();
  const suggestion = await page.locator('.kernel-chat-message--ai .kernel-chat-suggestion').count();
  const whyBtn = await page.locator('.kernel-chat-message--ai [data-kernel-why-modified]').count();
  report('badge "محظور بالسياسة" appears', blockedBadge > 0, `found ${blockedBadge}`);
  report('suggested-phrasing box rendered', suggestion > 0);
  report('"ليش عدّلت؟" button present', whyBtn > 0);
  await page.screenshot({ path: `${shotDir}/04-blocked.png`, fullPage: false });
  await page.unroute('**/api/ai/chat/**');
}

// ── 5. CANCELLED state (user aborts mid-stream) ───────────────────────
{
  console.log('\n5) CANCELLED — user aborts mid-stream');
  await page.goto(`${base}/kernel/chat/`, { waitUntil: 'networkidle' });
  await dismissOverlays(page);
  // SSE that hangs — never sends done. We use a handler that fulfills
  // with a slow trickle so the stream stays open long enough for the
  // cancel button to be visible + clickable.
  page.route('**/api/ai/chat/**', async (route) => {
    // Fulfill with an SSE body but DO NOT close — emulate an open stream
    // by only writing the token frame and letting the body be short.
    // The chat reader will still be "reading" until done fires, which
    // never happens here, so the cancel button stays visible.
    await new Promise((r) => setTimeout(r, 300)); // small delay so UI catches up
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      headers: {},
      body: 'event: token\ndata: {"delta":"رد جزئي..."}\n\n',
    });
  });
  await page.fill('[data-kernel-chat-input]', 'سؤال طويل');
  // Click send, then immediately check the button morphed to cancel.
  // We do this in a single evaluate so we catch the streaming state
  // before the (very short) mock stream resolves.
  const result = await page.evaluate(async () => {
    const sendBtn = document.querySelector('[data-kernel-chat-send]');
    const input = document.querySelector('[data-kernel-chat-input]');
    if (!sendBtn || !input) return { error: 'no send/input' };
    input.value = 'سؤال طويل';
    // Trigger the submit (form submit, not button click — matches Enter).
    const form = document.querySelector('[data-kernel-chat-form]');
    form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    // Give the handler one frame to call enterStreamingState().
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const morphed = sendBtn.classList.contains('kernel-chat-composer__btn--cancel');
    const ariaLabel = sendBtn.getAttribute('aria-label');
    if (morphed) {
      // Click cancel to trigger the abort path.
      sendBtn.click();
      await new Promise((r) => setTimeout(r, 400));
      const badge = document.querySelector('.kernel-chat-message--ai .kernel-source-badge[data-source="cancelled"]');
      const restored = sendBtn.classList.contains('kernel-chat-composer__btn--primary');
      return { morphed: true, ariaLabel, cancelled: !!badge, restored };
    }
    return { morphed: false, ariaLabel };
  });
  report('send button morphed to cancel during streaming', result.morphed, result.ariaLabel || '');
  report('badge "مُلغى" appears after abort', result.cancelled === true);
  report('send button restored to primary after abort', result.restored === true);
  await page.screenshot({ path: `${shotDir}/05-cancelled.png`, fullPage: false });
  await page.unroute('**/api/ai/chat/**');
}

// ── 6. RATE_LIMIT (HTTP 429 + Retry-After, no demo) ───────────────────
{
  console.log('\n6) RATE_LIMIT — HTTP 429 + Retry-After');
  await page.goto(`${base}/kernel/chat/`, { waitUntil: 'networkidle' });
  await dismissOverlays(page);
  mockChat(page, {
    status: 429,
    json: { error: 'quota_exceeded', retryAfterSec: 30 },
    headers: { 'Retry-After': '30' },
  });
  await sendAndWait(page);
  await page.waitForTimeout(500);
  const rateBanner = await page.locator('[data-kernel-chat-error-slot] .kernel-chat-policy-banner--warning').count();
  const rateText = await page.locator('[data-kernel-chat-error-slot]').textContent();
  const demoFallback = await page.locator('.kernel-chat-message--ai .kernel-source-badge[data-source="demo"]').count();
  const retryOnRate = await page.locator('[data-kernel-chat-error-slot] [data-kernel-retry]').count();
  report('rate-limit warning banner shown', rateBanner > 0);
  report('banner mentions retry delay', /30|ثانية|لحظات/.test(rateText || ''));
  report('NO retry button on rate-limit (must wait)', retryOnRate === 0, `found ${retryOnRate} (expected 0)`);
  report('NO demo fallback on rate-limit', demoFallback === 0, `found ${demoFallback} (expected 0)`);
  await page.screenshot({ path: `${shotDir}/06-rate-limit.png`, fullPage: false });
  await page.unroute('**/api/ai/chat/**');
}

// ── Summary ───────────────────────────────────────────────────────────
console.log(`\n${failures.length === 0 ? '✅ ALL CHECKS PASSED' : '❌ ' + failures.length + ' CHECK(S) FAILED'}`);
if (failures.length) {
  console.log('Failed:');
  failures.forEach((f) => console.log('  - ' + f));
}
await browser.close();
process.exit(failures.length === 0 ? 0 : 1);
