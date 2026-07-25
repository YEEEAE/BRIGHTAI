#!/usr/bin/env node
/**
 * scripts/verify-csp-drift.mjs — BAI-SEC-11 (2026-07-25)
 *
 * CI gate that asserts the two derived config files are in lockstep with
 * the canonical posture in scripts/security-headers.mjs:
 *
 *   1. public/_headers  — Netlify / Cloudflare Pages convention.
 *   2. render.yaml      — Render Blueprint.
 *
 * If either file drifts from RESPONSE_SECURITY_HEADERS, the script prints
 * a per-file, per-header diff and exits 1. Use the generator to fix:
 *
 *   pnpm run headers:sync
 *
 * For a one-off post-deploy check on the live Cloudflare-front response,
 * use `pnpm run verify:live:headers` (different concern — that script
 * fetches the live URLs and checks the response headers).
 *
 * EXIT CODES:
 *   0 — no drift
 *   1 — drift detected
 *   2 — fatal (source file missing, parse error, etc.)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { RESPONSE_SECURITY_HEADERS } from "./security-headers.mjs";
import {
  loadRenderYamlHeaders,
  loadPublicHeaders,
} from "./headers-config.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const PUBLIC_HEADERS = path.join(ROOT, "public", "_headers");
const RENDER_YAML = path.join(ROOT, "render.yaml");

/**
 * The Netlify _headers file uses a `path-glob` key, then indented
 * `Name: value` lines. We only look at the `/*` block (the canonical
 * "applies to everything" rule). Cache-Control etc. in the same block
 * are filtered out because they are NOT in RESPONSE_SECURITY_HEADERS.
 */
function readPublicHeadersSecuritySubset() {
  const rules = loadPublicHeaders();
  const rule = rules["/*"] || {};
  const out = {};
  for (const name of Object.keys(RESPONSE_SECURITY_HEADERS)) {
    if (rule[name] != null) out[name] = rule[name];
  }
  return out;
}

/**
 * The render.yaml `headers[]` block lists `{ path, name, value }` items.
 * We only consider the entries at path `/*` whose `name` is a key in
 * RESPONSE_SECURITY_HEADERS. Path-specific overrides (e.g. /frontend/*)
 * are intentionally ignored — they are not the canonical posture, they
 * are exceptions (see KI-001 / KI-CSP-DRIFT history in .agents/brain.md).
 */
function readRenderYamlSecuritySubset() {
  const entries = loadRenderYamlHeaders();
  const out = {};
  for (const e of entries) {
    if (e.path !== "/*") continue;
    if (!(e.name in RESPONSE_SECURITY_HEADERS)) continue;
    // Unwrap the double-quoted YAML scalar — the generator emits values
    // wrapped in "..." and the parser stores them verbatim. The CSP value
    // is the same on both sides, so we compare raw.
    out[e.name] = e.value;
  }
  return out;
}

/**
 * Format a string diff summary between two header maps. The keys present
 * on the left but missing on the right are flagged "missing on right";
 * keys on the right but missing on the left are flagged "missing on
 * left"; values that differ are flagged "value differs". We do not try
 * to do real character-level diff — the values are mostly single-line
 * strings where presence/equality is enough.
 */
function diffSubset(left, right, sourceLabel) {
  const issues = [];
  const allKeys = new Set([...Object.keys(left), ...Object.keys(right)]);
  for (const key of allKeys) {
    if (!(key in left)) {
      issues.push({ key, kind: "missing-on-source", source: sourceLabel });
    } else if (!(key in right)) {
      issues.push({ key, kind: "missing-on-derived", source: sourceLabel });
    } else if (left[key] !== right[key]) {
      issues.push({ key, kind: "value-differs", source: sourceLabel });
    }
  }
  return issues;
}

function main() {
  let exitCode = 0;

  // Check public/_headers
  let publicIssues = [];
  try {
    const publicSubset = readPublicHeadersSecuritySubset();
    publicIssues = diffSubset(
      RESPONSE_SECURITY_HEADERS,
      publicSubset,
      "public/_headers"
    );
  } catch (e) {
    console.error(`Fatal: failed to parse public/_headers: ${e.message}`);
    process.exit(2);
  }

  // Check render.yaml
  let renderIssues = [];
  try {
    const renderSubset = readRenderYamlSecuritySubset();
    renderIssues = diffSubset(
      RESPONSE_SECURITY_HEADERS,
      renderSubset,
      "render.yaml"
    );
  } catch (e) {
    console.error(`Fatal: failed to parse render.yaml: ${e.message}`);
    process.exit(2);
  }

  const allIssues = [...publicIssues, ...renderIssues];
  if (allIssues.length === 0) {
    console.log("");
    console.log("✓ CSP drift check passed.");
    console.log(`  Source of truth: scripts/security-headers.mjs`);
    console.log(`  Derived files:   public/_headers, render.yaml`);
    console.log(
      `  Security headers verified: ${Object.keys(RESPONSE_SECURITY_HEADERS).length} (×2 files)`
    );
    console.log("");
    process.exit(0);
  }

  // Group issues by file for readable output.
  const byFile = {};
  for (const issue of allIssues) {
    byFile[issue.source] = byFile[issue.source] || [];
    byFile[issue.source].push(issue);
  }

  console.error("");
  console.error("✗ CSP drift detected between source of truth and derived files:");
  console.error("");

  for (const [file, issues] of Object.entries(byFile)) {
    console.error(`  ${file}:`);
    for (const i of issues) {
      if (i.kind === "missing-on-source") {
        console.error(`    - ${i.key}: present in source of truth but MISSING in ${file}`);
      } else if (i.kind === "missing-on-derived") {
        console.error(`    - ${i.key}: present in ${file} but NOT in source of truth (should be removed)`);
      } else if (i.kind === "value-differs") {
        console.error(`    - ${i.key}: VALUE DIFFERS between source of truth and ${file}`);
      }
    }
  }
  console.error("");
  console.error(`  Fix: pnpm run headers:sync`);
  console.error("");

  process.exit(1);
}

try {
  main();
} catch (e) {
  console.error("Fatal:", e.message);
  console.error(e.stack);
  process.exit(2);
}
