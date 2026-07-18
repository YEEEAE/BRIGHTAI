#!/usr/bin/env node
/**
 * scripts/_check-duplicate-schema-ids.mjs
 *
 * BAI-SEO-003-S3 (2026-07-18) acceptance test: scan all built HTML files
 * for duplicate @id values across JSON-LD nodes on the same page.
 *
 * Rules:
 *   - Each @id must appear at most ONCE in the merged @graph of a single
 *     page (Google's docs explicitly state multiple nodes with the same
 *     @id in one document can cause the entity to be ignored).
 *   - The script returns exit 0 when 0 duplicates are found, exit 1
 *     otherwise (matching the project's `seo:gate` policy).
 *
 * Scope: every *.html under dist (the canonical build output).
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { glob } from "glob";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");

function collectNodes(value, out = []) {
  if (!value || typeof value !== "object") return out;
  if (Array.isArray(value)) {
    for (const v of value) collectNodes(v, out);
    return out;
  }
  if (Array.isArray(value["@graph"])) {
    for (const v of value["@graph"]) collectNodes(v, out);
    return out;
  }
  out.push(value);
  return out;
}

function parseJsonLd(html) {
  const pattern = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const all = [];
  let m;
  let i = 0;
  while ((m = pattern.exec(html))) {
    try {
      all.push(JSON.parse(m[1]));
    } catch (e) {
      throw new Error(`invalid JSON-LD block ${i}: ${e.message}`);
    }
    i++;
  }
  return all;
}

const files = await glob("**/*.html", {
  cwd: DIST,
  absolute: true,
  nodir: true,
  ignore: ["node_modules/**", ".git/**", ".server/**", "client/_astro/**"],
});

const failures = [];
let scannedCount = 0;
let duplicateCount = 0;

for (const file of files.sort()) {
  const relPath = path.relative(DIST, file);
  let html;
  try {
    html = await fs.readFile(file, "utf8");
  } catch {
    continue;
  }
  scannedCount++;
  let schemas;
  try {
    schemas = parseJsonLd(html);
  } catch (e) {
    failures.push({ relPath, error: e.message });
    continue;
  }
  const nodes = schemas.flatMap((s) => collectNodes(s));
  const idCounts = new Map();
  for (const node of nodes) {
    if (typeof node["@id"] === "string" && node["@id"].length > 0) {
      idCounts.set(node["@id"], (idCounts.get(node["@id"]) || 0) + 1);
    }
  }
  const duplicates = [...idCounts.entries()].filter(([, c]) => c > 1);
  if (duplicates.length) {
    duplicateCount += duplicates.length;
    failures.push({
      relPath,
      duplicates: duplicates.map(([id, c]) => ({ id, count: c })),
    });
  }
}

if (failures.length) {
  console.error(`Duplicate @id audit FAILED:`);
  for (const f of failures) {
    if (f.error) {
      console.error(`  ${f.relPath}: ${f.error}`);
    } else {
      for (const d of f.duplicates) {
        console.error(`  ${f.relPath}: @id "${d.id}" appears ${d.count}×`);
      }
    }
  }
  console.error(`\n${scannedCount} page(s) scanned, ${duplicateCount} duplicate(s) found.`);
  process.exit(1);
}

console.log(`Duplicate @id audit passed for ${scannedCount} page(s). 0 duplicates.`);
process.exit(0);
