#!/usr/bin/env node
/**
 * scripts/_clean-migrated-kernel-jsonld.mjs
 *
 * BAI-SEO-003-S3 (2026-07-18): one-off cleaner for the 11 migrated
 * kernel page JSON-LD files in src/data/migrated-pages/kernel-*.json.
 *
 * What it removes (all duplicates of foundation Schema.astro nodes):
 *   - Organization / LocalBusiness merged @id=#organization
 *   - WebSite @id=#website
 *   - BreadcrumbList @id=...kernel/<slug>/#breadcrumb
 *   - WebPage @id=...kernel/<slug>/#webpage  (FoundationSchema emits the same @id)
 *   - aggregateRating nested in SoftwareApplication (fabricated 4.8/47)
 *
 * What it keeps:
 *   - SoftwareApplication @id=#product  (the Kernel product entity)
 *   - DefinedTermSet @id=...terms  (technical-ai-governance-terms)
 *
 * Idempotent: re-running on an already-cleaned file is a no-op.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../src/data/migrated-pages",
);

const KERNEL_FILES = [
  "kernel-approvals.json",
  "kernel-audit.json",
  "kernel-chat.json",
  "kernel-compliance.json",
  "kernel-connectors.json",
  "kernel-evidence.json",
  "kernel-offline.json",
  "kernel-policies.json",
  "kernel-reports.json",
  "kernel-scenarios.json",
  "kernel-stats.json",
];

const REMOVE_TYPES = new Set([
  "Organization", // also matches the merged "Organization + LocalBusiness" array
  "LocalBusiness",
  "WebSite",
  "WebPage",
  "BreadcrumbList",
]);

function hasAnyType(node, types) {
  const t = node?.["@type"];
  if (Array.isArray(t)) return t.some((x) => types.has(x));
  return types.has(t);
}

function cleanNode(node) {
  if (!node || typeof node !== "object") return node;
  // Strip aggregateRating
  if (node.aggregateRating && typeof node.aggregateRating === "object") {
    delete node.aggregateRating;
  }
  return node;
}

function cleanGraph(graph) {
  if (!Array.isArray(graph)) return graph;
  return graph.filter((node) => {
    if (!node || typeof node !== "object") return false;
    if (hasAnyType(node, REMOVE_TYPES)) return false;
    return true;
  });
}

async function processFile(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  const data = JSON.parse(raw);
  const jl = data.jsonLd;
  if (!Array.isArray(jl)) return { file: filePath, changed: false, reason: "no array" };

  let changed = false;
  for (let i = 0; i < jl.length; i++) {
    const wrapper = jl[i];
    if (!wrapper || typeof wrapper !== "object") continue;
    if (Array.isArray(wrapper["@graph"])) {
      const before = JSON.stringify(wrapper["@graph"]);
      const cleaned = cleanGraph(wrapper["@graph"]).map(cleanNode);
      // Re-strip aggregateRating from any node
      for (const n of cleaned) {
        if (n && typeof n === "object" && n.aggregateRating) {
          delete n.aggregateRating;
          changed = true;
        }
      }
      if (JSON.stringify(cleaned) !== before) {
        wrapper["@graph"] = cleaned;
        changed = true;
      }
    } else {
      const before = JSON.stringify(wrapper);
      const cleaned = cleanNode(wrapper);
      if (JSON.stringify(cleaned) !== before) {
        jl[i] = cleaned;
        changed = true;
      }
    }
  }

  if (changed) {
    // Preserve trailing newline if present
    const trailing = raw.endsWith("\n") ? "\n" : "";
    await fs.writeFile(filePath, JSON.stringify(data, null, 2) + trailing, "utf8");
  }
  return { file: filePath, changed };
}

const results = [];
for (const name of KERNEL_FILES) {
  const filePath = path.join(ROOT, name);
  try {
    const r = await processFile(filePath);
    results.push(r);
  } catch (e) {
    results.push({ file: filePath, changed: false, error: e.message });
  }
}

let changedCount = 0;
for (const r of results) {
  if (r.changed) changedCount++;
  console.log(`${r.changed ? "✓ cleaned" : "· clean  "}  ${path.basename(r.file)}  ${r.error ? `(${r.error})` : ""}`);
}
console.log(`\n${changedCount} file(s) updated.`);
