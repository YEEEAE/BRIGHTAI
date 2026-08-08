#!/usr/bin/env node
/**
 * scripts/verify-crawler-access.mjs — BAI-IDX-CRAWL (2026-08-08)
 *
 * Synthetic monitor: fetches brightai.site (or HOST) as each major search
 * engine and AI crawler and asserts every response is HTTP 200.
 *
 * WHY THIS EXISTS:
 *   On 2026-08-08 the site was fully blocked to every AI crawler
 *   (GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot) and to the
 *   /sitemap.xml entry point for non-verified bots, by Cloudflare Bot
 *   Management `ai_bots_protection: "block"`. Every local dist/ check
 *   was green at the same time, because local builds do not sit behind
 *   the Cloudflare edge. This monitor closes that gap: it tests the
 *   REAL production surface with REAL crawler user agents.
 *
 * WHAT IT CHECKS (all must return 200):
 *   - /                as every crawler in CRAWLERS
 *   - /sitemap.xml     as Googlebot (the discovery entry point)
 *   - sitemap <loc>    count >= EXPECTED_SITEMAP_URLS (default 200)
 *
 * EXIT CODES:
 *   0 — every check passed (site is reachable to crawlers).
 *   1 — one or more checks failed (site is blocking crawlers).
 *
 * USAGE:
 *   node scripts/verify-crawler-access.mjs
 *   HOST=https://brightai.site node scripts/verify-crawler-access.mjs
 *   EXPECTED_SITEMAP_URLS=251 node scripts/verify-crawler-access.mjs
 *
 * Run locally after deploys, or wire into CI / a cron monitor. Pair with
 * scripts/setup-cloudflare-ai-crawler-allowlist.mjs which restores the
 * edge config if this monitor fails.
 */

const HOST = (process.env.HOST || "https://brightai.site").replace(/\/$/, "");
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS || 15000);
const EXPECTED_SITEMAP_URLS = Number(process.env.EXPECTED_SITEMAP_URLS || 200);

// Crawler user agents. Kept in sync with public/robots.txt. If you add
// a crawler to robots.txt, add it here too.
const CRAWLERS = [
  "Googlebot/2.1",
  "Googlebot-Image/1.0",
  "bingbot/2.0",
  "Applebot/0.1",
  "DuckDuckBot/1.1",
  "GPTBot/1.1",
  "OAI-SearchBot/1.0",
  "ChatGPT-User/1.0",
  "PerplexityBot/1.0",
  "ClaudeBot/1.0",
  "anthropic-ai/1.0",
  "CCBot/2.0",
  "Bytespider/1.0",
  "Meta-ExternalAgent/1.0",
  "Google-Extended/1.0",
  "Applebot-Extended/1.0",
  "Amazonbot/1.0",
];

function ua(token) {
  return `Mozilla/5.0 (compatible; ${token})`;
}

async function fetchStatus(token, path) {
  const url = `${HOST}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": ua(token) },
      signal: controller.signal,
      redirect: "manual",
    });
    return { status: res.status, url };
  } catch (e) {
    return { status: 0, url, error: e.name === "AbortError" ? "timeout" : e.message };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const failures = [];
  const passed = [];

  console.log(`[verify-crawler-access] host: ${HOST}`);
  console.log(
    `[verify-crawler-access] testing ${CRAWLERS.length} crawlers on / + sitemap\n`
  );

  for (const token of CRAWLERS) {
    const home = await fetchStatus(token, "/");
    const ok = home.status === 200;
    const line = `  ${token.padEnd(26)} / -> ${home.status}${
      home.error ? ` (${home.error})` : ""
    }`;
    if (ok) {
      passed.push(line);
    } else {
      failures.push(`${token} on / → ${home.status}${home.error ? ` (${home.error})` : ""}`);
      console.log(`✗ ${line}`);
    }
  }

  // Always print passing ones too, for a complete audit trail.
  for (const line of passed) console.log(`✓ ${line}`);

  console.log("");
  // Sitemap discovery check — the single most important entry point.
  const sitemap = await fetchStatus("Googlebot/2.1", "/sitemap.xml");
  console.log(
    `  sitemap.xml (Googlebot) -> ${sitemap.status}${
      sitemap.error ? ` (${sitemap.error})` : ""
    }`
  );
  if (sitemap.status !== 200) {
    failures.push(`sitemap.xml (Googlebot) → ${sitemap.status}`);
  } else {
    // Count <loc> entries.
    let body = "";
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const res = await fetch(`${HOST}/sitemap.xml`, {
        headers: { "User-Agent": ua("Googlebot/2.1") },
        signal: controller.signal,
      });
      body = await res.text();
      clearTimeout(timer);
    } catch (e) {
      failures.push(`sitemap.xml body read failed: ${e.message}`);
    }
    const locCount = (body.match(/<loc>/g) || []).length;
    console.log(`  sitemap <loc> count -> ${locCount} (expected >= ${EXPECTED_SITEMAP_URLS})`);
    if (locCount < EXPECTED_SITEMAP_URLS) {
      failures.push(
        `sitemap <loc> count ${locCount} < expected ${EXPECTED_SITEMAP_URLS}`
      );
    }
  }

  console.log("");
  if (failures.length === 0) {
    console.log(
      `✓ [verify-crawler-access] PASS — ${CRAWLERS.length} crawlers + sitemap all reachable.`
    );
    process.exit(0);
  }
  console.error(
    `✗ [verify-crawler-access] FAIL — ${failures.length} check(s) failed:`
  );
  for (const f of failures) console.error(`    - ${f}`);
  console.error(
    "    If ai_bots_protection drifted back to 'block', run:\n" +
      "      node scripts/setup-cloudflare-ai-crawler-allowlist.mjs"
  );
  process.exit(1);
}

main().catch((e) => {
  console.error(`[verify-crawler-access] FATAL: ${e.message}`);
  process.exit(1);
});
