#!/usr/bin/env node
/**
 * scripts/setup-cloudflare-hsts-transform-rule.mjs — BAI-SEC-11 (2026-07-25)
 *
 * Ensures the Cloudflare edge adds Strict-Transport-Security to every
 * response on brightai.site. This is the HTTP layer enforcement that
 * completes the canonical posture in scripts/security-headers.mjs:
 *
 *   - SSR routes (/api/*)        — HTTP headers via src/middleware.ts
 *   - Prerendered static pages    — meta http-equiv via injectSecurityMeta()
 *   - Static pages, HTTP layer    — THIS SCRIPT (Cloudflare Transform Rule)
 *
 * HSTS does NOT work in <meta http-equiv>. The only way to add it to
 * prerendered HTML responses is on the HTTP layer, and the only HTTP
 * layer in front of dist/client/* is Cloudflare.
 *
 * The rule is created via the Cloudflare Rulesets API v4 — the modern
 * Transform Rules surface (the legacy Transformations v1 API is
 * deprecated and Cloudflare's UI is moving everyone to Rulesets).
 *
 * The script is idempotent: if a rule with the same description already
 * exists, it is left untouched. If the rule has drifted (e.g. someone
 * changed the max-age in scripts/security-headers.mjs), it is updated.
 *
 * USAGE:
 *   CLOUDFLARE_API_TOKEN=xxx CLOUDFLARE_ZONE_ID=yyy \
 *     node scripts/setup-cloudflare-hsts-transform-rule.mjs
 *   DRY_RUN=1 node scripts/setup-cloudflare-hsts-transform-rule.mjs
 *   JSON_OUT=download/cf-hsts.json node scripts/setup-cloudflare-hsts-transform-rule.mjs
 *
 * EXIT CODES:
 *   0 — rule exists with the expected value (or was created/updated).
 *   1 — rule could not be ensured (API call failed, etc.).
 *   2 — fatal (missing env vars, malformed response, etc.).
 *
 * API surface:
 *   GET  /zones/{zone_id}/rulesets/phases/http_response_headers_transform/entrypoint
 *   PUT  /zones/{zone_id}/rulesets/phases/http_response_headers_transform/entrypoint
 *   Both accept the same body: { rules: [...] }.
 *   See https://developers.cloudflare.com/rules/transform/managed-transforms/list-api/
 */

import fs from "node:fs";

import { RESPONSE_SECURITY_HEADERS } from "./security-headers.mjs";

const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
const DRY_RUN = process.env.DRY_RUN === "1";
const API_BASE = "https://api.cloudflare.com/client/v4";

const HSTS_VALUE = RESPONSE_SECURITY_HEADERS["Strict-Transport-Security"];
const RULE_DESCRIPTION = "BrightAI HSTS preload (BAI-SEC-11)";

if (!TOKEN || !ZONE_ID) {
  console.error(
    "FATAL: CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID are required.\n" +
      "  - Generate a token at https://dash.cloudflare.com/profile/api-tokens\n" +
      "    with permission: Zone > Transform Rules > Edit\n" +
      "  - Find the zone ID at https://dash.cloudflare.com/?to=/:account/:zone\n" +
      "      (right sidebar → API → Zone ID)"
  );
  process.exit(2);
}

function log(msg) {
  console.log(`[cloudflare:hsts] ${msg}`);
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
    const msg = errs.map((e) => `${e.code || ""} ${e.message || ""}`).join("; ");
    throw new Error(`${method} ${path} → HTTP ${res.status}: ${msg || "(no detail)"}`);
  }
  return json;
}

/**
 * Build the desired rule. We match EVERY request (expression: "true") and
 * SET the Strict-Transport-Security response header to the canonical
 * value. `set` overwrites any existing value; we are the authoritative
 * source for HSTS on this zone.
 */
function buildDesiredRule() {
  return {
    expression: "true",
    description: RULE_DESCRIPTION,
    action: "rewrite",
    action_parameters: {
      headers: {
        "Strict-Transport-Security": {
          operation: "set",
          value: HSTS_VALUE,
        },
      },
    },
  };
}

/**
 * Read the current entrypoint ruleset for the http_response_headers_transform
 * phase. Returns { rulesetId, rules } where rulesetId is null if the
 * entrypoint has not been initialised yet.
 *
 * BAI-SEC-11 fix (2026-07-25): Cloudflare returns HTTP 404 + error code
 * 10003 ("could not find entrypoint ruleset in the http_response_headers_transform
 * phase") when no rules have ever been created for this phase on the zone.
 * This is the normal "fresh zone" state on brightai.site. The PUT path
 * creates the entrypoint atomically with the first rule, so we treat
 * this specific 404 as "no existing rules" and return defaults instead
 * of aborting. Any other HTTP error is re-thrown.
 */
async function readEntrypoint() {
  try {
    const json = await cfFetch(
      "GET",
      `/zones/${ZONE_ID}/rulesets/phases/http_response_headers_transform/entrypoint`
    );
    return {
      rulesetId: json.result?.id ?? null,
      rules: json.result?.rules ?? [],
    };
  } catch (e) {
    // Match the exact error pattern Cloudflare emits for missing entrypoint.
    // cfFetch formats errors as: "GET /path → HTTP 404: 10003 could not find..."
    if (e.message.includes("HTTP 404") && e.message.includes("10003")) {
      return { rulesetId: null, rules: [] };
    }
    throw e;
  }
}

/**
 * Write (replace) the entrypoint ruleset. If existing rules are present
 * we preserve any that are not the HSTS one; we upsert the HSTS rule
 * in the canonical position (first, so subsequent rules can override if
 * needed in the future).
 */
async function writeEntrypoint(rules) {
  const body = { rules };
  return cfFetch(
    "PUT",
    `/zones/${ZONE_ID}/rulesets/phases/http_response_headers_transform/entrypoint`,
    body
  );
}

function findHstsRule(rules) {
  return rules.find((r) => r.description === RULE_DESCRIPTION);
}

function shapeMatches(rule) {
  if (!rule) return false;
  if (rule.expression !== "true") return false;
  if (rule.action !== "rewrite") return false;
  const op = rule.action_parameters?.headers?.["Strict-Transport-Security"];
  if (!op) return false;
  if (op.operation !== "set") return false;
  if (op.value !== HSTS_VALUE) return false;
  return true;
}

async function main() {
  log(`zone_id: ${ZONE_ID}`);
  log(`desired HSTS value: ${HSTS_VALUE}`);

  const desired = buildDesiredRule();
  log(`desired rule: ${JSON.stringify(desired)}`);

  if (DRY_RUN) {
    log("DRY_RUN=1 — skipping API calls");
    const current = await readEntrypoint();
    log(
      `current entrypoint: rulesetId=${current.rulesetId ?? "(none)"} rules=${current.rules.length}`
    );
    const existing = findHstsRule(current.rules);
    if (existing) {
      log(`found existing rule: ${JSON.stringify(existing)}`);
      if (shapeMatches(existing)) {
        log("✓ existing rule already matches desired shape (no change needed)");
      } else {
        log("✗ existing rule drift detected (would be replaced with the desired rule)");
      }
    } else {
      log("no existing HSTS rule found (would be added)");
    }
    return;
  }

  const current = await readEntrypoint();
  log(
    `current entrypoint: rulesetId=${current.rulesetId ?? "(none)"} rules=${current.rules.length}`
  );

  const existing = findHstsRule(current.rules);

  if (existing && shapeMatches(existing)) {
    log("✓ HSTS rule already present and matches desired shape. No change needed.");
    if (process.env.JSON_OUT) {
      fs.writeFileSync(
        process.env.JSON_OUT,
        JSON.stringify(
          {
            action: "noop",
            reason: "rule-already-matches",
            existing: { id: existing.id, description: existing.description },
            value: HSTS_VALUE,
          },
          null,
          2
        )
      );
    }
    process.exit(0);
  }

  // Build the new rules list: keep every rule that is NOT the HSTS rule,
  // then prepend the desired HSTS rule.
  const keptRules = current.rules.filter((r) => !findHstsRule([r]));
  const newRules = [desired, ...keptRules];

  log(
    existing
      ? `drift detected — replacing existing rule with desired shape (${current.rules.length} → ${newRules.length} rules)`
      : `no existing HSTS rule — adding it (${current.rules.length} → ${newRules.length} rules)`
  );

  const result = await writeEntrypoint(newRules);
  const newRuleset = result.result;
  log(`✓ HSTS rule written. New ruleset id: ${newRuleset?.id ?? "(unknown)"}`);
  log(`  total rules: ${newRuleset?.rules?.length ?? newRules.length}`);

  if (process.env.JSON_OUT) {
    fs.writeFileSync(
      process.env.JSON_OUT,
      JSON.stringify(
        {
          action: existing ? "updated" : "created",
          rulesetId: newRuleset?.id,
          totalRules: newRuleset?.rules?.length,
          desiredRule: desired,
        },
        null,
        2
      )
    );
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(`[cloudflare:hsts] FATAL: ${e.message}`);
  if (e.stack) console.error(e.stack);
  process.exit(1);
});
