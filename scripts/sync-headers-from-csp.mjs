#!/usr/bin/env node
/**
 * scripts/sync-headers-from-csp.mjs — BAI-SEC-11 (2026-07-25)
 *
 * Generator that reads the canonical posture in scripts/security-headers.mjs
 * and rewrites the security-header section of two derived files so they
 * stay in lockstep with the source of truth:
 *
 *   1. public/_headers  — Netlify / Cloudflare Pages convention. The whole
 *      path/header block (everything after the documentation comment
 *      header) is replaced with one `/*` rule carrying every entry from
 *      RESPONSE_SECURITY_HEADERS plus a default `Cache-Control: must-revalidate`
 *      for the same path.
 *
 *   2. render.yaml  — Render Blueprint. The `services[0].headers[]` list
 *      is split into two groups: security entries (whose `name` matches a
 *      key in RESPONSE_SECURITY_HEADERS) and non-security entries (Cache-Control,
 *      per-path overrides, custom headers). The security group is REPLACED
 *      with a fresh block in canonical declaration order, and the non-security
 *      group is preserved verbatim in its original order. New keys in
 *      RESPONSE_SECURITY_HEADERS that were missing from render.yaml are
 *      added to the security group automatically.
 *
 * IDEMPOTENT:
 *   Running the generator on a file that already matches the source
 *   produces a byte-identical output. The CI gate scripts/verify-csp-drift.mjs
 *   exits non-zero if the generator is needed.
 *
 * USAGE:
 *   node scripts/sync-headers-from-csp.mjs
 *   DRY_RUN=1 node scripts/sync-headers-from-csp.mjs   # print diff only
 *   CHECK=1 node scripts/sync-headers-from-csp.mjs     # exit 1 if drift, 0 if clean
 *
 * EXIT CODES:
 *   0 — files already match the source, or generator ran successfully.
 *   1 — drift detected (CHECK=1 only).
 *   2 — fatal (source file missing, parse error, etc.).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { RESPONSE_SECURITY_HEADERS } from "./security-headers.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const PUBLIC_HEADERS = path.join(ROOT, "public", "_headers");
const RENDER_YAML = path.join(ROOT, "render.yaml");

// ─── helpers ───────────────────────────────────────────────────────────────

function yamlEscape(value) {
  // Double-quoted YAML scalar: backslash-escape backslashes and double
  // quotes. The CSP value does not contain control characters, so we do
  // not need the more elaborate \n / \t / \uXXXX escapes.
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

// ─── public/_headers rewriter ──────────────────────────────────────────────

/**
 * Rewrite public/_headers. The file has two regions:
 *   1. Documentation comment block (every line that is blank or starts
 *      with `#`, from the top of the file until the first non-comment
 *      line at column 0). Preserved verbatim.
 *   2. Path/header rules. Replaced with a single `/*` rule containing
 *      every RESPONSE_SECURITY_HEADERS entry plus a default Cache-Control.
 */
function rewritePublicHeaders(text, headers) {
  const lines = text.split(/\r?\n/);

  // Find the first rules-block start. Netlify/Cloudflare convention: a
  // path line starts at column 0 and is non-blank, non-comment. The
  // header lines below it are indented. The block ends when a non-indented
  // non-blank line appears that is not part of the current rule.
  //
  // We classify the file into three regions:
  //   - prefix: leading comment block (preserved verbatim)
  //   - rules: the first path-glob + its indented headers (REPLACED)
  //   - suffix: everything after the rules block (preserved verbatim,
  //     this is where trailing documentation comments live)
  let ruleStart = -1;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.trim() === "") continue;
    if (l.startsWith("#")) continue;
    ruleStart = i;
    break;
  }
  if (ruleStart === -1) {
    // No rules block at all — append a fresh one to the prefix.
    const newRules = buildRulesBlock(headers);
    return lines.join("\n") + "\n" + newRules;
  }

  // Find the end of the rules block. Walk forward from ruleStart, skipping
  // the path line and its indented continuation lines. Stop at the first
  // non-indented, non-blank line (or end of file). Trailing blank lines
  // (between the last header of the current rule and the next rule / suffix)
  // are part of the suffix — we walk back to include them.
  let ruleEnd = lines.length;
  for (let i = ruleStart + 1; i < lines.length; i++) {
    const l = lines[i];
    if (l.trim() === "") {
      continue;
    }
    if (l.startsWith(" ") || l.startsWith("\t")) {
      continue;
    }
    // Found the first non-indented, non-blank line after the rule. Walk
    // back through any blank lines immediately preceding it so the suffix
    // keeps its leading blank line(s).
    let back = i - 1;
    while (back > ruleStart && lines[back].trim() === "") back--;
    ruleEnd = back + 1;
    break;
  }

  const prefix = lines.slice(0, ruleStart).join("\n");
  const suffix = lines.slice(ruleEnd).join("\n");
  const newRules = buildRulesBlock(headers);

  // Ensure exactly one blank line between the prefix comment block and
  // the rules block (the original file convention). The suffix retains
  // its own leading blank lines (the walk-back above).
  const prefixTrimmed = prefix.endsWith("\n") ? prefix.slice(0, -1) : prefix;
  return prefixTrimmed + "\n\n" + newRules + (suffix ? "\n" + suffix : "");
}

function buildRulesBlock(headers) {
  const rules = [];
  rules.push("/*");
  for (const [name, value] of Object.entries(headers)) {
    rules.push(`  ${name}: ${value}`);
  }
  rules.push(`  Cache-Control: public, max-age=0, must-revalidate`);
  return rules.join("\n");
}

// ─── render.yaml rewriter ──────────────────────────────────────────────────

/**
 * Split render.yaml into three parts:
 *   - prefix: everything before the first `headers:` directive
 *   - securityEntries: the entries in the headers list whose `name` is
 *     a key in RESPONSE_SECURITY_HEADERS (rendered verbatim from the
 *     canonical source)
 *   - nonSecurityEntries: every other entry (Cache-Control, custom paths,
 *     future additions) preserved in their original lines
 *   - suffix: everything after the headers block
 *
 * Entry parsing: an entry starts with `- path: <glob>` at any indent.
 * Continuation lines (indented, not a dash, not a top-level key) are part
 * of the same entry. Blank lines and `#` comments that follow an entry
 * are kept with the entry so we do not lose context.
 */
function rewriteRenderYaml(text, headers) {
  const headerKeys = new Set(Object.keys(headers));
  const lines = text.split(/\r?\n/);

  // Find the `headers:` directive and its range. We capture the indent
  // of the directive itself so we can recognise sibling top-level keys
  // (e.g. `routes:` under `services[0]`) that are at the SAME indent
  // level but with leading whitespace.
  let headersStart = -1;
  let headersIndent = "";
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^([ \t]*)headers:\s*$/);
    if (m) {
      headersStart = i;
      headersIndent = m[1];
      break;
    }
  }
  if (headersStart === -1) {
    throw new Error("render.yaml: could not find `headers:` directive");
  }

  // Find the end of the headers block — a sibling top-level key at the
  // SAME indent as `headers:` (e.g. `routes:`), or a key at LESS indent
  // (e.g. leaving `services:`), or end of file.
  let headersEnd = lines.length;
  for (let i = headersStart + 1; i < lines.length; i++) {
    const l = lines[i];
    if (l.trim() === "") continue; // blank lines do not end the block
    // Indent of this line:
    const lineIndentMatch = l.match(/^([ \t]*)/);
    const lineIndent = lineIndentMatch ? lineIndentMatch[1] : "";
    if (lineIndent.length <= headersIndent.length) {
      // A line at the same or shallower indent than `headers:` is a
      // sibling top-level key — the headers block is over.
      headersEnd = i;
      break;
    }
  }

  // Within the headers block, walk the entries. Each entry starts at a
  // `- path:` line; continuation lines are indented and non-blank.
  //
  // A "security entry" is one at path `/*` whose `name` matches a key in
  // RESPONSE_SECURITY_HEADERS — that is the canonical security policy
  // definition. ALL OTHER entries — including path-specific overrides
  // (e.g. `/frontend/*` with a tightened CSP) and entries with a
  // security-header name on a non-`/*` path — are treated as non-security
  // and preserved verbatim. This is important: dropping the
  // `/frontend/*` overrides would re-introduce KI-001 (backend code
  // leaking into Google index).
  const nonSecurityEntries = [];
  let entryLines = [];
  let entryName = null;
  let entryPath = null;
  let hasPathDash = false;
  const flushEntry = () => {
    if (entryLines.length === 0) return;
    // Preserve everything that is not a canonical `/*` security entry.
    const isCanonicalSecurityEntry =
      hasPathDash && entryName && headerKeys.has(entryName) && entryPath === "/*";
    if (!isCanonicalSecurityEntry) {
      nonSecurityEntries.push(entryLines.join("\n"));
    }
    entryLines = [];
    entryName = null;
    entryPath = null;
    hasPathDash = false;
  };

  for (let i = headersStart + 1; i < headersEnd; i++) {
    const raw = lines[i];
    const l = raw.replace(/\s+$/, ""); // trim trailing whitespace

    if (l === "") {
      // Blank line — finalize the current entry, preserve the blank line
      // as part of the next entry's preamble (we do not currently output
      // a blank between non-security entries; Render YAML tolerates it).
      flushEntry();
      continue;
    }

    if (/^\s*#/.test(l)) {
      // Comment line — attach to the current entry. Per-entry comments
      // are dropped (they describe the old static values) and replaced
      // with a single sync marker for the whole security group.
      entryLines.push(l);
      continue;
    }

    const dashPath = l.match(/^\s*-\s+path:\s*(.+?)\s*$/);
    if (dashPath) {
      // New entry starts — flush the previous one.
      flushEntry();
      entryLines.push(l);
      entryPath = dashPath[1];
      hasPathDash = true;
      continue;
    }

    const nameMatch = l.match(/^\s+name:\s*(.+?)\s*$/);
    if (nameMatch) {
      entryName = nameMatch[1];
      entryLines.push(l);
      continue;
    }

    // Other continuation (value, path-only, etc.) — attach.
    entryLines.push(l);
  }
  flushEntry();

  // Build the new headers block. Layout matches the original file:
  //   - `headers:` key
  //   - security entries first, in canonical declaration order
  //   - non-security entries after, in their original order
  const newHeadersLines = [];
  newHeadersLines.push("    headers:");
  for (const [name, value] of Object.entries(headers)) {
    newHeadersLines.push(`      - path: /*`);
    newHeadersLines.push(`        name: ${name}`);
    newHeadersLines.push(`        value: "${yamlEscape(value)}"`);
  }
  for (const block of nonSecurityEntries) {
    newHeadersLines.push(block);
  }

  // Assemble: prefix + new headers + suffix
  const prefix = lines.slice(0, headersStart);
  const suffix = lines.slice(headersEnd);
  return [...prefix, ...newHeadersLines, ...suffix].join("\n");
}

// ─── main ──────────────────────────────────────────────────────────────────

function main() {
  const dryRun = process.env.DRY_RUN === "1";
  const checkOnly = process.env.CHECK === "1";

  const publicHeadersCurrent = fs.readFileSync(PUBLIC_HEADERS, "utf8");
  const renderYamlCurrent = fs.readFileSync(RENDER_YAML, "utf8");

  const publicHeadersNext = rewritePublicHeaders(publicHeadersCurrent, RESPONSE_SECURITY_HEADERS);
  const renderYamlNext = rewriteRenderYaml(renderYamlCurrent, RESPONSE_SECURITY_HEADERS);

  const publicHeadersDirty = publicHeadersCurrent !== publicHeadersNext;
  const renderYamlDirty = renderYamlCurrent !== renderYamlNext;

  if (checkOnly) {
    const drifted = [];
    if (publicHeadersDirty) drifted.push(PUBLIC_HEADERS);
    if (renderYamlDirty) drifted.push(RENDER_YAML);
    if (drifted.length) {
      console.error(`✗ Drift detected in ${drifted.length} file(s):`);
      for (const f of drifted) console.error(`  - ${path.relative(ROOT, f)}`);
      console.error(`Run: node scripts/sync-headers-from-csp.mjs`);
      process.exit(1);
    } else {
      console.log("✓ No drift between security-headers.mjs and the derived files.");
      process.exit(0);
    }
  }

  if (!publicHeadersDirty && !renderYamlDirty) {
    console.log("✓ Already in sync. No changes written.");
    return;
  }

  if (dryRun) {
    console.log("DRY RUN — would rewrite:");
    if (publicHeadersDirty) console.log(`  - ${path.relative(ROOT, PUBLIC_HEADERS)}`);
    if (renderYamlDirty) console.log(`  - ${path.relative(ROOT, RENDER_YAML)}`);
    return;
  }

  if (publicHeadersDirty) {
    fs.writeFileSync(PUBLIC_HEADERS, publicHeadersNext, "utf8");
    console.log(`✓ Wrote ${path.relative(ROOT, PUBLIC_HEADERS)}`);
  }
  if (renderYamlDirty) {
    fs.writeFileSync(RENDER_YAML, renderYamlNext, "utf8");
    console.log(`✓ Wrote ${path.relative(ROOT, RENDER_YAML)}`);
  }
}

try {
  main();
} catch (e) {
  console.error("Fatal:", e.message);
  process.exit(2);
}
