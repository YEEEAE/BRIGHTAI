#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { glob } from "glob";
import {
  findCounterpartRelPath,
  normalizeRelPath,
  relPathToCanonical,
} from "./seo-url-map.mjs";
import {
  HIGH_CONFIDENCE_CORE_FILES,
  SITEMAP_REQUIRED_SERVICE_PAGE_FILES,
} from "./high-confidence-sitemap-config.mjs";

const ROOT = process.cwd();
const BASE_URL = "https://brightai.site";

const EXTRA_TARGETS = [
  "frontend/pages/ai-scolecs/index.html",
  "frontend/pages/ai-workflows/index.html",
  "frontend/pages/blog/data-analytics/kpi-dashboard-guide.html",
  "frontend/pages/blog/data-analytics/power-bi-saudi-guide.html",
  "smart-medical-archive/index.html",
];

const CANONICAL_REGEX = /<link\b[^>]*rel=["']canonical["'][^>]*>/i;
const HREFLANG_ALT_REGEX = /\s*<link\b[^>]*rel=["'][^"']*\balternate\b[^"']*["'][^>]*hreflang=["'][^"']+["'][^>]*>\s*/gi;
const OG_URL_REGEX = /<meta\b[^>]*property=["']og:url["'][^>]*>/i;

function insertIntoHead(content, tagBlock) {
  const headOpen = content.match(/<head[^>]*>/i);
  if (!headOpen || headOpen.index == null) {
    return `${tagBlock}\n${content}`;
  }
  const insertAt = headOpen.index + headOpen[0].length;
  return `${content.slice(0, insertAt)}\n${tagBlock}${content.slice(insertAt)}`;
}

function upsertTag(content, regex, tag) {
  if (regex.test(content)) {
    return content.replace(regex, tag);
  }
  return insertIntoHead(content, tag);
}

function buildRequiredHreflang(relPath, lowerPathMap) {
  const selfUrl = relPathToCanonical(relPath, BASE_URL);
  const counterpart = findCounterpartRelPath(relPath, lowerPathMap);
  const counterpartUrl = counterpart ? relPathToCanonical(counterpart, BASE_URL) : null;
  const isEnglish = /-en\.html$/i.test(relPath) || relPath === "en/index.html" || relPath.startsWith("en/");

  if (isEnglish) {
    if (counterpartUrl) {
      return [
        { code: "ar-SA", href: counterpartUrl },
        { code: "en-US", href: selfUrl },
        { code: "x-default", href: counterpartUrl },
      ];
    }
    return [
      { code: "en-US", href: selfUrl },
      { code: "x-default", href: selfUrl },
    ];
  }

  if (counterpartUrl) {
    return [
      { code: "ar-SA", href: selfUrl },
      { code: "en-US", href: counterpartUrl },
      { code: "x-default", href: selfUrl },
    ];
  }

  return [
    { code: "ar-SA", href: selfUrl },
    { code: "x-default", href: selfUrl },
  ];
}

async function main() {
  const targets = new Set(
    [...HIGH_CONFIDENCE_CORE_FILES, ...SITEMAP_REQUIRED_SERVICE_PAGE_FILES, ...EXTRA_TARGETS].map(
      (file) => normalizeRelPath(file)
    )
  );

  const htmlFiles = await glob("**/*.html", {
    cwd: ROOT,
    nodir: true,
    ignore: [
      "**/node_modules/**",
      "**/.git/**",
      "backend/**",
      "brightai-platform/**",
      "scripts/**",
      "reports/**",
      "brightai_orchestrator_output/**",
    ],
  });

  const lowerPathMap = new Map(htmlFiles.map((file) => [file.toLowerCase(), file]));

  const changes = [];

  for (const relPath of targets) {
    const absolutePath = path.join(ROOT, relPath);
    let content;
    try {
      content = await fs.readFile(absolutePath, "utf8");
    } catch {
      continue;
    }

    const canonical = relPathToCanonical(relPath, BASE_URL);
    if (!canonical) {
      continue;
    }

    const hreflangs = buildRequiredHreflang(relPath, lowerPathMap);
    const hreflangTags = hreflangs
      .map((item) => `<link rel="alternate" hreflang="${item.code}" href="${item.href}" />`)
      .join("\n");

    let updated = content.replace(HREFLANG_ALT_REGEX, "\n");
    updated = updated.replace(CANONICAL_REGEX, `<link rel="canonical" href="${canonical}" />\n${hreflangTags}`);
    if (!CANONICAL_REGEX.test(content)) {
      updated = insertIntoHead(updated, `<link rel="canonical" href="${canonical}" />\n${hreflangTags}`);
    }

    updated = upsertTag(updated, OG_URL_REGEX, `<meta property="og:url" content="${canonical}" />`);

    if (updated !== content) {
      await fs.writeFile(absolutePath, updated, "utf8");
      changes.push(relPath);
    }
  }

  console.log(`Updated files: ${changes.length}`);
  if (changes.length) {
    console.log(changes.join("\n"));
  }
}

main().catch((error) => {
  console.error(error?.stack || error);
  process.exit(1);
});
