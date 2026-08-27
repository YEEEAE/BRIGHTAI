#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { walkFiles } from "./indexing-recovery-utils.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LEGACY_PATHS = [
  "/tenders/", "/ai-scolecs/", "/smart-medical-archive/", "/smart-automation/",
  "/data-analysis/", "/ai-workflows/", "/ai-agent/", "/ai-bots/", "/tools/",
  "/consultation/", "/try/", "/docs-en.html", "/blog/ai-governance.html",
  "/en/services/", "/en/interview/", "/demo/pages/",
];
const SCANNED_EXTENSIONS = /\.(?:html|xml|json|txt|mjs|js)$/i;
const EXCLUDED_FILES = new Set([
  "_redirects",
  "redirects.json",
  "scripts/legacy-paths-audit.mjs",
  "scripts/legacy-seo-surface-audit.mjs",
  "scripts/legacy-seo-surface.test.mjs",
  "scripts/normalize-legacy-redirects.mjs",
  "scripts/indexing-recovery-audits.test.mjs",
  "scripts/seo-health-check.mjs",
  "scripts/seo-url-map.mjs",
  "scripts/sitemap-audit-utils.mjs",
]);

export async function auditLegacyPaths({ root = ROOT } = {}) {
  const files = (await walkFiles(root))
    .filter((relPath) => SCANNED_EXTENSIONS.test(relPath))
    .filter((relPath) => !EXCLUDED_FILES.has(relPath))
    .filter((relPath) => !relPath.startsWith("report/"));
  const findings = [];

  for (const relPath of files) {
    const content = await fs.readFile(path.join(root, relPath), "utf8");
    const values = [
      ...content.matchAll(/\b(?:href|src|action|data-href|data-src)\s*=\s*["']([^"']+)["']/gi),
      ...content.matchAll(/https:\/\/brightai\.live\/[^\s<>"')\]]+/gi),
    ].map((match) => match[1] || match[0]);
    for (const legacyPath of LEGACY_PATHS) {
      for (const value of values) {
        if (value.includes(legacyPath)) {
          findings.push({ relPath, value, legacyPath });
        }
      }
    }
  }

  return { filesScanned: files.length, findings };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await auditLegacyPaths();
  console.log(JSON.stringify(result, null, 2));
  if (process.argv.includes("--strict") && result.findings.length) process.exitCode = 1;
}
