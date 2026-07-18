#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import * as cheerio from "cheerio";
import { glob } from "glob";

const FAQ_PATTERN = /"@type"\s*:\s*"FAQPage"/;
// BAI-SEO-003-S7 (2026-07-18): also include pages with a P0 snippet
// (`aside[data-snippet="tl-dr"]`) so the snippet contract gets wired
// into the WebPage SpeakableSpecification even on pages that don't
// carry an FAQPage (case studies / blog pillars / docs pillars).
const P0_SNIPPET_PATTERN = /aside[^>]*data-snippet="tl-dr"/;
const EXCLUDED_PATH_PREFIXES = ["kernel/", "components/"];
const EXCLUDED_PAGES = new Set(["demo/index.html", "report/index.html"]);

function extractCanonical(html) {
  const tag = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*>/i)?.[0];
  return tag?.match(/\bhref=["']([^"']+)["']/i)?.[1] || "";
}

function jsonLdBlocks(html) {
  const blocks = [];
  const pattern =
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = pattern.exec(html))) {
    const contentOffset = match.index + match[0].indexOf(match[1]);
    blocks.push({
      content: match[1],
      start: contentOffset,
      end: contentOffset + match[1].length,
    });
  }
  return blocks;
}

function objectRanges(json) {
  const ranges = [];
  const stack = [];
  let inString = false;
  let escaped = false;

  for (let index = 0; index < json.length; index += 1) {
    const char = json[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === "{") stack.push(index);
    else if (char === "}") {
      const start = stack.pop();
      if (start !== undefined) ranges.push({ start, end: index + 1 });
    }
  }

  return ranges;
}

function isWebPage(node) {
  const type = node?.["@type"];
  return Array.isArray(type) ? type.includes("WebPage") : type === "WebPage";
}

function scoreWebPage(node, canonical) {
  if (!isWebPage(node)) return -1;
  let score = 0;
  if (String(node["@id"] || "").endsWith("#webpage")) score += 100;
  if (canonical && node.url === canonical) score += 100;
  if (node.description) score += 20;
  if (node.isPartOf) score += 10;
  if (node.inLanguage) score += 10;
  score += Math.min(Object.keys(node).length, 10);
  return score;
}

function findPrimaryWebPage(html) {
  const canonical = extractCanonical(html);
  const candidates = [];

  for (const block of jsonLdBlocks(html)) {
    JSON.parse(block.content);
    for (const range of objectRanges(block.content)) {
      const source = block.content.slice(range.start, range.end);
      if (!/"@type"\s*:\s*"WebPage"/.test(source)) continue;
      try {
        const node = JSON.parse(source);
        const score = scoreWebPage(node, canonical);
        if (score >= 0) {
          candidates.push({
            node,
            score,
            start: block.start + range.start,
            end: block.start + range.end,
          });
        }
      } catch {
        // Nested object slices are attempted independently; only complete JSON objects count.
      }
    }
  }

  candidates.sort((left, right) => right.score - left.score);
  return candidates[0] || null;
}

function existingSelectors(html) {
  const $ = cheerio.load(html);
  const selectors = [];
  if ($("h1").length) selectors.push("h1");
  if ($(".tldr").length) selectors.push(".tldr");
  if ($(".key-takeaways").length) selectors.push(".key-takeaways");
  if ($("[data-speakable]").length) selectors.push("[data-speakable]");
  // BAI-SEO-003-S7 (2026-07-18): central contract for the P0 snippet
  // pack — `aside[data-snippet="tl-dr"]` is the canonical selector
  // referenced by `src/data/snippet-pack.ts`. Pages render one
  // <aside data-snippet="tl-dr" aria-label="الخلاصة">…</aside> in the
  // hero/intro; the post-build apply pass picks it up here.
  if ($('aside[data-snippet="tl-dr"]').length) {
    selectors.push('aside[data-snippet="tl-dr"]');
  }
  return selectors;
}

function speakableProperty(indent, selectors) {
  const childIndent = `${indent}  `;
  const selectorIndent = `${childIndent}  `;
  const selectorLines = selectors
    .map(
      (selector, index) =>
        `${selectorIndent}${JSON.stringify(selector)}${index < selectors.length - 1 ? "," : ""}`,
    )
    .join("\n");

  return [
    `${indent}"speakable": {`,
    `${childIndent}"@type": "SpeakableSpecification",`,
    `${childIndent}"cssSelector": [`,
    selectorLines,
    `${childIndent}]`,
    `${indent}}`,
  ].join("\n");
}

function addSpeakable(html, primary, selectors) {
  const objectSource = html.slice(primary.start, primary.end);
  // BAI-SEO-003-S7 (2026-07-18): make speakable insertion work for both
  // single-line and multi-line JSON-LD. The earlier regex required a
  // line-anchored `@type` line; FoundationSchema now emits a single
  // line of JSON.stringify output, so the anchored regex never matches.
  // We now locate the `@type`/`speakable` by plain substring search
  // and rely on objectRanges() to keep the source boundaries safe.
  const existingSpeakable = /"speakable"\s*:\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/;
  const existingMatch = objectSource.match(existingSpeakable);
  if (existingMatch) {
    const indentMatch = /([ \t]*)"speakable"/.exec(objectSource);
    const indent = indentMatch ? indentMatch[1] : "";
    const replacement = `${speakableProperty(indent, selectors)}`;
    const start = primary.start + existingMatch.index;
    const end = start + existingMatch[0].length;
    // Replace the existing block (which already includes its own
    // trailing comma) — never leave a stranded comma behind.
    return html.slice(0, start) + replacement + html.slice(end);
  }

  const typeLine = /"@type"\s*:\s*"WebPage"\s*,/;
  const match = objectSource.match(typeLine);
  if (!match) {
    throw new Error("Primary WebPage does not have a supported @type property.");
  }

  const indentMatch = /^([ \t]*)/.exec(objectSource);
  const indent = indentMatch ? indentMatch[1] : "";
  const insertionPoint = primary.start + match.index + match[0].length;
  // The match ends right after the comma that follows the @type value,
  // so the existing JSON already has the comma we need. speakableProperty
  // therefore must NOT emit a trailing comma — we close with `}` only.
  const property = speakableProperty(indent, selectors).replace(/,\s*$/, "");
  return html.slice(0, insertionPoint) + property + html.slice(insertionPoint);
}

export async function applySpeakable(root = process.cwd()) {
  const files = await glob("**/*.html", {
    cwd: root,
    absolute: true,
    nodir: true,
    ignore: ["node_modules/**", ".git/**", ".render-static/**"],
  });
  const changed = [];
  const skipped = [];

  for (const file of files.sort()) {
    const relPath = path.relative(root, file).replaceAll(path.sep, "/");
    if (EXCLUDED_PAGES.has(relPath)) continue;

    const html = await fs.readFile(file, "utf8");
    if (!FAQ_PATTERN.test(html) && !P0_SNIPPET_PATTERN.test(html)) continue;
    if (
      EXCLUDED_PATH_PREFIXES.some((prefix) => relPath.startsWith(prefix))
    ) {
      continue;
    }

    const selectors = existingSelectors(html);
    if (!selectors.includes("h1")) {
      skipped.push({ relPath, reason: "no readable h1" });
      continue;
    }

    const primary = findPrimaryWebPage(html);
    if (!primary) {
      skipped.push({ relPath, reason: "no primary WebPage node" });
      continue;
    }

    const updated = addSpeakable(html, primary, selectors);
    await fs.writeFile(file, updated);
    changed.push({ relPath, selectors });
  }

  return { changed, skipped };
}

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  applySpeakable()
    .then(({ changed, skipped }) => {
      console.log(`Added SpeakableSpecification to ${changed.length} page(s).`);
      for (const item of changed) {
        console.log(`  - ${item.relPath}: ${item.selectors.join(", ")}`);
      }
      if (skipped.length) {
        console.log(`Skipped ${skipped.length} page(s):`);
        for (const item of skipped) {
          console.log(`  - ${item.relPath}: ${item.reason}`);
        }
      }
    })
    .catch((error) => {
      console.error(error.stack || error.message);
      process.exitCode = 1;
    });
}
