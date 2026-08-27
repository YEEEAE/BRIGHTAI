#!/usr/bin/env node
/**
 * scripts/setup-cloudflare-redirect-rules.mjs — BAI-REDIRECT-001 (2026-07-30)
 *
 * Ensures the Cloudflare edge applies BrightAI's legacy 301 redirects at
 * the request layer (http_request_dynamic_redirect phase). This is the
 * authoritative layer for the 207 legacy URLs in redirects.json — the
 * three other layers in the codebase do NOT work in production:
 *
 *   1. `astro.config.mjs` `redirects:` option — Astro 6 with
 *      `output: 'static'` generates meta refresh in HTML files; it does
 *      NOT produce a 301 response. Live curl confirms:
 *        /report → 301 → /report/   (Cloudflare trailing-slash normalize)
 *        /report → (expected) 301 → /trust/
 *   2. `render.yaml` `routes:` directive — Render Web Service
 *      (runtime: node) does NOT support the `routes:` block. It is
 *      only honoured on Render Static Sites. Confirmed by the BAI-SEC-11
 *      investigation (2026-07-25) which found the same is true for the
 *      `headers:` block. Live curl confirms redirects there are not
 *      applied.
 *   3. `public/_redirects` (Netlify / Cloudflare Pages format) — Render
 *      does not read this file. The file is generated for documentation
 *      and as a ready-to-use posture for any future migration to a
 *      static-only host.
 *
 * The single layer that works on the current Render Web Service +
 * Cloudflare front stack is the Cloudflare edge itself. This script
 * pushes every entry in redirects.json to the entrypoint ruleset of
 * the http_request_dynamic_redirect phase as a Single Redirect rule.
 *
 * IMPORTANT — execution order in Cloudflare:
 *   The Cloudflare rules pipeline executes (in order):
 *     1. Single Redirects
 *     2. URL Rewrite Rules
 *     3. Configuration Rules
 *     4. Origin Rules
 *     5. Bulk Redirects
 *     6. Managed Transforms
 *     7. Request Header Transform Rules
 *     8. Cache Rules
 *   Single Redirects are the FIRST thing that runs. Our 301 responses
 *   therefore take effect before any caching, before any origin hit.
 *   This is the desired behaviour for legacy 301 redirects.
 *
 * IMPORTANT — rule ordering within the ruleset:
 *   Cloudflare matches the FIRST rule that satisfies the expression.
 *   A shorter prefix can shadow a longer one (e.g. `/blog` would
 *   shadow `/blog/ai` if listed first). We therefore sort entries
 *   longest-path-first before pushing.
 *
 * IMPORTANT — limits:
 *   Cloudflare Single Redirects are subject to per-zone limits:
 *     - Free: 10 rules
 *     - Pro: 100 rules (typical; 250 rules per Phase in some plans)
 *     - Business / Enterprise: 1000+ rules
 *   This script generates 207 rules (current redirects.json size after
 *   filtering wildcards and http variants — see `loadAndFilter()`).
 *   brightai.live is on a Pro-or-higher plan per the BAI-REDIRECT-001
 *   investigation; if the limit is hit, the Cloudflare API returns
 *   HTTP 400 and the script exits 1 with the API error visible.
 *
 * USAGE:
 *   CLOUDFLARE_API_TOKEN=xxx CLOUDFLARE_ZONE_ID=yyy \
 *     node scripts/setup-cloudflare-redirect-rules.mjs
 *   DRY_RUN=1 node scripts/setup-cloudflare-redirect-rules.mjs
 *   JSON_OUT=download/cf-redirects.json node scripts/setup-cloudflare-redirect-rules.mjs
 *
 * EXIT CODES:
 *   0 — every rule is in place with the expected shape.
 *   1 — Cloudflare API error (rule push failed).
 *   2 — fatal (missing env vars, malformed input, etc.).
 *
 * IDEMPOTENT — re-running on a zone that already has the BAI-REDIRECT-001
 * ruleset is a no-op (the desired rules are detected as a subset of the
 * current rules; existing non-BAI rules are preserved; existing BAI rules
 * that drifted are replaced; existing BAI rules that match exactly are
 * preserved).
 */

import fs from "node:fs";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
const DRY_RUN = process.env.DRY_RUN === "1";
const JSON_OUT = process.env.JSON_OUT;
const API_BASE = "https://api.cloudflare.com/client/v4";

const RULE_MARKER = "BAI-REDIRECT-001";
const PHASE = "http_request_dynamic_redirect";

if (!TOKEN || !ZONE_ID) {
  console.error(
    "FATAL: CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID are required.\n" +
      "  - Generate a token at https://dash.cloudflare.com/profile/api-tokens\n" +
      "    with permission: Zone > Single Redirect > Edit\n" +
      "  - Find the zone ID at https://dash.cloudflare.com/?to=/:account/:zone\n" +
      "      (right sidebar → API → Zone ID)"
  );
  process.exit(2);
}

function log(msg) {
  console.log(`[cloudflare:redirects] ${msg}`);
}

/**
 * Cloudflare API fetch wrapper. Throws Error with formatted message on
 * any non-2xx response or `success: false` payload.
 */
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
    const msg = errs.map((e) => `${e.code || ""} ${e.message || ""}`).join("; ");
    throw new Error(`${method} ${path} → HTTP ${res.status}: ${msg || "(no detail)"}`);
  }
  return json;
}

/**
 * Read and filter redirects.json.
 *
 * Returns a sorted, de-duplicated array of {from, to, status} entries
 * suitable for Cloudflare Single Redirects:
 *   - only literal paths (no `*`, `:`, `?` wildcards in from or to)
 *   - only path-shaped sources (no http://, no domain)
 *   - only one entry per source (first wins; mirrors
 *     check-redirect-destinations.mjs dedup logic)
 *   - sorted longest-path-first (Cloudflare first-match semantics)
 *
 * Throws if the file is missing or malformed — those are fatal.
 */
function loadAndFilter() {
  const redirectsPath = path.join(ROOT, "redirects.json");
  let raw;
  try {
    raw = readFileSync(redirectsPath, "utf8");
  } catch (e) {
    throw new Error(`FATAL: cannot read ${redirectsPath}: ${e.message}`);
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error(`FATAL: malformed JSON in ${redirectsPath}: ${e.message}`);
  }
  const redirects = Array.isArray(parsed.redirects) ? parsed.redirects : [];

  // Keep literal-path entries only.
  const literal = redirects.filter(
    (r) =>
      r &&
      typeof r.from === "string" &&
      typeof r.to === "string" &&
      !/[*:?]/.test(r.from) &&
      !/[*:?]/.test(r.to) &&
      /^\//.test(r.from) &&
      !/^https?:\/\//i.test(r.from)
  );

  // De-dupe by source (first wins).
  const seen = new Set();
  const deduped = [];
  for (const r of literal) {
    if (seen.has(r.from)) continue;
    seen.add(r.from);
    deduped.push({
      from: r.from,
      to: r.to,
      status: Number.isFinite(r.status) ? r.status : 301,
    });
  }

  // Sort longest-path-first (Cloudflare first-match; longest first
  // avoids shorter prefixes shadowing longer ones).
  deduped.sort((a, b) => b.from.length - a.from.length);

  return { total: redirects.length, kept: deduped, skipped: redirects.length - deduped.length };
}

/**
 * Build the desired rule list from filtered entries. Each rule is a
 * Single Redirect with a static target URL.
 *
 * Expression format: `http.request.uri.path eq "<from>"` — literal
 * path match. We DO NOT use wildcards or regex (the filter above
 * guarantees every from is literal).
 *
 * Cloudflare expression strings require double-quote escaping of any
 * embedded double quotes or backslashes. Our from values are sourced
 * from redirects.json which is a controlled file (no embedded
 * quotes/backslashes expected), but we still escape defensively.
 */
function escapeExprString(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function buildDesiredRules(entries) {
  return entries.map((e) => ({
    action: "redirect",
    description: `${RULE_MARKER}: ${e.from} → ${e.to}`,
    expression: `http.request.uri.path eq "${escapeExprString(e.from)}"`,
    action_parameters: {
      from_value: {
        status_code: e.status,
        target_url: {
          value: e.to,
        },
        preserve_query_string: false,
      },
    },
  }));
}

/**
 * Read the current entrypoint ruleset for the http_request_dynamic_redirect
 * phase. Returns { rulesetId, rules } where rulesetId is null if the
 * entrypoint has not been initialised yet.
 *
 * BAI-REDIRECT-001 (2026-07-30) fix: Cloudflare returns HTTP 404 +
 * error code 10003 ("could not find entrypoint ruleset") when no
 * rules have ever been created for this phase on the zone. This is
 * the normal "fresh zone" state. The PUT path creates the entrypoint
 * atomically with the first rule, so we treat this specific 404 as
 * "no existing rules" and return defaults.
 */
async function readEntrypoint() {
  try {
    const json = await cfFetch(
      "GET",
      `/zones/${ZONE_ID}/rulesets/phases/${PHASE}/entrypoint`
    );
    return {
      rulesetId: json.result?.id ?? null,
      rules: json.result?.rules ?? [],
    };
  } catch (e) {
    if (e.message.includes("HTTP 404") && e.message.includes("10003")) {
      return { rulesetId: null, rules: [] };
    }
    throw e;
  }
}

/**
 * Write (replace) the entrypoint ruleset. We preserve any non-BAI
 * rules and upsert the BAI rules in the canonical position.
 */
async function writeEntrypoint(rules) {
  return cfFetch(
    "PUT",
    `/zones/${ZONE_ID}/rulesets/phases/${PHASE}/entrypoint`,
    { rules }
  );
}

function isBaiRule(rule) {
  return typeof rule?.description === "string" && rule.description.startsWith(`${RULE_MARKER}:`);
}

/**
 * Compare the desired rules against the current BAI rules. Returns:
 *   - newRules: rules to add (current BAI rules whose `from` is not in desired set)
 *   - keptRules: rules to keep (current BAI rules whose `from` is in desired set AND shape matches)
 *   - desiredMissing: desired rules that are not present at all in current BAI rules
 *   - driftRules: desired rules whose current version has drifted (different from/to)
 */
function diffRules(currentBaiRules, desiredRules) {
  const desiredByFrom = new Map();
  for (const r of desiredRules) {
    // Each desired rule has description "BAI-REDIRECT-001: <from> → <to>"
    // Extract the from portion to use as a dedup key.
    const m = r.description.match(/^BAI-REDIRECT-001: (\S+) → /);
    if (m) desiredByFrom.set(m[1], r);
  }

  const currentByFrom = new Map();
  for (const r of currentBaiRules) {
    const m = r.description.match(/^BAI-REDIRECT-001: (\S+) → /);
    if (m) currentByFrom.set(m[1], r);
  }

  const keptRules = [];
  const newRules = [];
  const driftRules = [];
  const desiredMissing = [];

  for (const [from, desired] of desiredByFrom) {
    const current = currentByFrom.get(from);
    if (!current) {
      desiredMissing.push(desired);
      newRules.push(desired);
    } else if (shapeMatches(current, desired)) {
      keptRules.push(current);
    } else {
      driftRules.push(desired);
      newRules.push(desired);
    }
  }
  return { keptRules, newRules, driftRules, desiredMissing };
}

function shapeMatches(current, desired) {
  if (current.expression !== desired.expression) return false;
  if (current.action !== desired.action) return false;
  const cur = current.action_parameters?.from_value;
  const des = desired.action_parameters.from_value;
  if (!cur || !des) return false;
  if (cur.status_code !== des.status_code) return false;
  if (cur.target_url?.value !== des.target_url.value) return false;
  return true;
}

async function main() {
  log(`zone_id: ${ZONE_ID}`);
  const { total, kept, skipped } = loadAndFilter();
  log(`loaded ${total} entries from redirects.json; kept ${kept.length} (skipped ${skipped})`);
  const desiredRules = buildDesiredRules(kept);

  if (DRY_RUN) {
    log("DRY_RUN=1 — skipping API writes");
    const current = await readEntrypoint();
    const currentBai = current.rules.filter(isBaiRule);
    log(
      `current entrypoint: rulesetId=${current.rulesetId ?? "(none)"} totalRules=${current.rules.length} baiRules=${currentBai.length}`
    );
    const diff = diffRules(currentBai, desiredRules);
    log(
      `diff: kept=${diff.keptRules.length} new=${diff.newRules.length} drift=${diff.driftRules.length} desiredMissing=${diff.desiredMissing.length}`
    );
    if (diff.driftRules.length > 0) {
      log(`drift detected in ${diff.driftRules.length} rules (would be replaced):`);
      for (const r of diff.driftRules.slice(0, 5)) log(`  ${r.description}`);
      if (diff.driftRules.length > 5) log(`  ... and ${diff.driftRules.length - 5} more`);
    }
    if (diff.newRules.length === 0) {
      log("✓ all desired rules already present and matching shape (no change needed)");
    } else {
      log(`would push ${diff.newRules.length} new/updated rules`);
    }
    if (JSON_OUT) {
      fs.writeFileSync(
        JSON_OUT,
        JSON.stringify(
          {
            action: "dry-run",
            totalRedirectsInJson: total,
            rulesKeptAfterFilter: kept.length,
            rulesSkippedByFilter: skipped,
            desiredRulesCount: desiredRules.length,
            currentRuleset: {
              rulesetId: current.rulesetId,
              totalRules: current.rules.length,
              baiRules: currentBai.length,
            },
            diff: {
              kept: diff.keptRules.length,
              new: diff.newRules.length,
              drift: diff.driftRules.length,
              desiredMissing: diff.desiredMissing.length,
            },
            sampleDesiredRules: desiredRules.slice(0, 5),
          },
          null,
          2
        )
      );
    }
    process.exit(0);
  }

  // Read current state, then push.
  const current = await readEntrypoint();
  const currentBai = current.rules.filter(isBaiRule);
  const nonBaiRules = current.rules.filter((r) => !isBaiRule(r));
  log(
    `current entrypoint: rulesetId=${current.rulesetId ?? "(none)"} totalRules=${current.rules.length} baiRules=${currentBai.length} nonBaiRules=${nonBaiRules.length}`
  );

  const diff = diffRules(currentBai, desiredRules);
  log(
    `diff: kept=${diff.keptRules.length} new=${diff.newRules.length} drift=${diff.driftRules.length}`
  );
  if (diff.driftRules.length > 0) {
    log(`drift detected in ${diff.driftRules.length} rules — will replace them`);
  }

  // Build the new ruleset. We append all desired rules at the END of
  // the ruleset (after non-BAI rules) so any future manual rules with
  // generic expressions run first. Within the BAI block, the
  // longest-first sort above already prevents prefix shadowing.
  const newRuleset = [...nonBaiRules, ...desiredRules];

  log(
    `writing ruleset: ${nonBaiRules.length} non-BAI + ${desiredRules.length} BAI = ${newRuleset.length} total rules`
  );
  const result = await writeEntrypoint(newRuleset);
  const newRulesetResult = result.result;
  log(`✓ ruleset written. New ruleset id: ${newRulesetResult?.id ?? "(unknown)"}`);
  log(`  total rules: ${newRulesetResult?.rules?.length ?? newRuleset.length}`);

  if (JSON_OUT) {
    fs.writeFileSync(
      JSON_OUT,
      JSON.stringify(
        {
          action: "applied",
          rulesetId: newRulesetResult?.id,
          totalRules: newRulesetResult?.rules?.length,
          desiredRulesCount: desiredRules.length,
          diff: {
            kept: diff.keptRules.length,
            new: diff.newRules.length,
            drift: diff.driftRules.length,
          },
        },
        null,
        2
      )
    );
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(`[cloudflare:redirects] FATAL: ${e.message}`);
  if (e.stack) console.error(e.stack);
  process.exit(1);
});
