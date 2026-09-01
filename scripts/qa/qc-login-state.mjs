#!/usr/bin/env node
/**
 * Capture an authenticated Playwright storage state for the QC app so the layout
 * audit can reach role-gated routes.
 *
 * Credentials come from the environment only — never from argv (which leaks into
 * shell history and the process list) and never committed.
 *
 *   QC_AUDIT_USER=admin QC_AUDIT_PASSWORD=… node scripts/qa/qc-login-state.mjs
 *
 * Writes download/qa/global-bg-audit/qc-storage-state.json (gitignored).
 */
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { chromium } from 'playwright';

const REPO = new URL('../../', import.meta.url).pathname.replace(/\/$/, '');
const BASE = process.env.QC_AUDIT_BASE || 'http://127.0.0.1:4341';
const USER = process.env.QC_AUDIT_USER || 'admin';
const PASS = process.env.QC_AUDIT_PASSWORD;
const OUT = join(REPO, 'download/qa/global-bg-audit/qc-storage-state.json');

if (!PASS) {
  console.error('QC_AUDIT_PASSWORD is not set. Refusing to guess a password.');
  process.exit(2);
}

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`${BASE}/login`, { waitUntil: 'load' });
await page.fill('input[name="username"], input#username', USER);
await page.fill('input[type="password"]', PASS);
await Promise.all([
  page.waitForLoadState('load'),
  page.click('button[type="submit"]'),
]);

const url = page.url();
const signedIn = !/\/login/.test(url);
console.log(`post-login URL: ${url}`);
if (!signedIn) {
  const err = await page.locator('[role="alert"], .error, [data-error]').first().textContent().catch(() => null);
  console.error(`login failed${err ? `: ${err.trim().slice(0, 160)}` : ''}`);
  await browser.close();
  process.exit(1);
}

mkdirSync(dirname(OUT), { recursive: true });
await page.context().storageState({ path: OUT });
await browser.close();
console.log(`storage state → ${OUT.replace(`${REPO}/`, '')}`);
