#!/usr/bin/env node
/**
 * scripts/setup-cloudflare-ai-crawler-allowlist.mjs — BAI-IDX-CRAWL (2026-08-08)
 *
 * Ensures the Cloudflare edge does NOT block legitimate search-engine and
 * AI crawlers from brightai.site. This is the programmatic re-enforcement
 * of the 2026-08-08 emergency unblock documented in
 * report/2026-08-08-cloudflare-crawler-unblock.md.
 *
 * ROOT CAUSE (found 2026-08-08):
 *   Zone Bot Management had `ai_bots_protection: "block"`. Cloudflare's
 *   AI-bot classifier blocks GPTBot / OAI-SearchBot / ChatGPT-User /
 *   PerplexityBot / ClaudeBot / anthropic-ai / CCBot / Bytespider /
 *   Meta-ExternalAgent / Google-Extended / Applebot-Extended / Amazonbot
 *   with HTTP 403 unless they are "verified" by Cloudflare (only Googlebot
 *   and Bingbot are classified verified on the Free plan). Result: every
 *   AI answer engine was locked out, /sitemap.xml returned 403 to any
 *   non-verified bot, and 268 JSON-LD pages + 251 sitemap URLs were
 *   unreachable. `public/robots.txt` was already correct (Allow: / for all
 *   these crawlers) — the block was purely at the edge.
 *
 * THE FIX:
 *   Set `ai_bots_protection: "disabled"` via the Bot Management API.
 *   This hands AI-crawler gating back to robots.txt (which is the
 *   authoritative, crawler-honoured signal anyway). Bot Fight Mode
 *   (`fight_mode`) stays ON — it continues to protect against scrapers
 *   and abusive automation that are NOT in robots.txt.
 *
 * WHY THIS AND NOT A WAF SKIP RULE:
 *   On the Free plan, the AI-bots block is emitted by the Bot Management
 *   engine, not by a WAF managed/custom rule. A WAF custom rule with
 *   action=skip cannot skip Bot Management on Free. The only authoritative
 *   switch is bot_management.ai_bots_protection. This script toggles it.
 *
 * IDEMPOTENT:
 *   Re-running on a zone already set to "disabled" is a no-op. The script
 *   reads current state, compares to desired, and only writes on drift.
 *
 * USAGE:
 *   CLOUDFLARE_API_TOKEN=xxx CLOUDFLARE_ZONE_ID=yyy \
 *     node scripts/setup-cloudflare-ai-crawler-allowlist.mjs
 *   DRY_RUN=1 node scripts/setup-cloudflare-ai-crawler-allowlist.mjs
 *   JSON_OUT=download/cf-ai-crawler-allowlist.json \
 *     node scripts/setup-cloudflare-ai-crawler-allowlist.mjs
 *
 * EXIT CODES:
 *   0 — bot_management.ai_bots_protection is "disabled" (confirmed).
 *   1 — could not ensure the setting (API error).
 *   2 — fatal (missing env vars, malformed response).
 *
 * NOTE ON AUTH SCHEME:
 *   The bot_management endpoint accepts PUT with a Bearer token on this
 *   zone. PATCH returns "Method not allowed for this authentication
 *   scheme" (Cloudflare error 10405) — PUT is the supported verb. This
 *   was confirmed during the 2026-08-08 incident response.
 *
 * GUARDRAIL:
 *   This script changes ONLY ai_bots_protection. It does not touch
 *   fight_mode, enable_js, security_level, WAF rules, CSP, or HSTS.
 *   fight_mode stays exactly as-is (ON), preserving abuse protection.
 */

const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
const DRY_RUN = process.env.DRY_RUN === "1";
const JSON_OUT = process.env.JSON_OUT;
const API_BASE = "https://api.cloudflare.com/client/v4";

const DESIRED_AI_BOTS_PROTECTION = "disabled";

if (!TOKEN || !ZONE_ID) {
  console.error(
    "FATAL: CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID are required.\n" +
      "  - Generate a token at https://dash.cloudflare.com/profile/api-tokens\n" +
      "    with permissions: Zone > Bot Management (Edit), Zone > WAF (Edit),\n" +
      "    Zone > Rulesets (Edit), Zone > Zone Settings (Read), Zone > Analytics (Read).\n" +
      "  - Find the zone ID at https://dash.cloudflare.com/?to=/:account/:zone\n" +
      "      (right sidebar → API → Zone ID)"
  );
  process.exit(2);
}

function log(msg) {
  console.log(`[cloudflare:crawler-allowlist] ${msg}`);
}

async function cfFetch(method, path, body) {
  const url = `${API_BASE}${path}`;
  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    const errs = json.errors || [];
    const msg = errs
      .map((e) => `${e.code || ""} ${e.message || ""}`)
      .join("; ");
    throw new Error(
      `${method} ${path} → HTTP ${res.status}: ${msg || "(no detail)"}`
    );
  }
  return json;
}

async function readBotManagement() {
  const json = await cfFetch(
    "GET",
    `/zones/${ZONE_ID}/bot_management`
  );
  return json.result || {};
}

async function writeAiBotsProtection(value) {
  // PUT is the supported verb; PATCH returns 10405 on Bearer auth.
  const json = await cfFetch("PUT", `/zones/${ZONE_ID}/bot_management`, {
    ai_bots_protection: value,
  });
  return json.result || {};
}

async function main() {
  log(`zone_id: ${ZONE_ID}`);
  log(`desired ai_bots_protection: ${DESIRED_AI_BOTS_PROTECTION}`);

  const current = await readBotManagement();
  log(
    `current bot_management: ai_bots_protection=${current.ai_bots_protection} fight_mode=${current.fight_mode} enable_js=${current.enable_js}`
  );

  const inSync = current.ai_bots_protection === DESIRED_AI_BOTS_PROTECTION;

  if (inSync && !DRY_RUN) {
    log("✓ ai_bots_protection already 'disabled'. No change needed.");
    if (JSON_OUT) {
      const fs = await import("node:fs");
      fs.writeFileSync(
        JSON_OUT,
        JSON.stringify(
          {
            action: "noop",
            reason: "already-disabled",
            ai_bots_protection: current.ai_bots_protection,
            fight_mode: current.fight_mode,
          },
          null,
          2
        )
      );
    }
    process.exit(0);
  }

  if (DRY_RUN) {
    log("DRY_RUN=1 — skipping write");
    log(
      inSync
        ? "✓ already in sync (would be no-op)"
        : `✗ drift detected (would set ai_bots_protection=${DESIRED_AI_BOTS_PROTECTION})`
    );
    if (JSON_OUT) {
      const fs = await import("node:fs");
      fs.writeFileSync(
        JSON_OUT,
        JSON.stringify(
          {
            action: "dry-run",
            inSync,
            current: current.ai_bots_protection,
            desired: DESIRED_AI_BOTS_PROTECTION,
          },
          null,
          2
        )
      );
    }
    process.exit(0);
  }

  log(
    `drift detected — setting ai_bots_protection: ${current.ai_bots_protection} → ${DESIRED_AI_BOTS_PROTECTION}`
  );
  const result = await writeAiBotsProtection(DESIRED_AI_BOTS_PROTECTION);
  log(`✓ applied. ai_bots_protection=${result.ai_bots_protection}`);
  log(
    `  fight_mode unchanged: ${result.fight_mode} (abuse protection still active)`
  );

  if (JSON_OUT) {
    const fs = await import("node:fs");
    fs.writeFileSync(
      JSON_OUT,
      JSON.stringify(
        {
          action: "updated",
          before: current.ai_bots_protection,
          after: result.ai_bots_protection,
          fight_mode: result.fight_mode,
        },
        null,
        2
      )
    );
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(`[cloudflare:crawler-allowlist] FATAL: ${e.message}`);
  if (e.stack) console.error(e.stack);
  process.exit(1);
});
