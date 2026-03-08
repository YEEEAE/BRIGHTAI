#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { glob } from "glob";
import { relPathToSitePath } from "./seo-url-map.mjs";

const ROOT = process.cwd();
const SITE_ORIGIN = "https://brightai.site";
const REPORT_PATH = path.join(ROOT, "reports", "semrush-broken-internal-links-2026-03-08.json");
const REPORT_OUTPUT = path.join(ROOT, "reports", "semrush-broken-links-rewritten-to-frontend-pages.md");

const FILE_PATTERNS = ["**/*.html", "**/*.htm", "**/*.js", "**/*.mjs", "**/*.css"];
const IGNORE_PATTERNS = [
  "**/.git/**",
  "**/node_modules/**",
  "backend/**",
  "brightai-platform/**",
  "scripts/**",
  "reports/**",
  "تقارير للمشروع/**",
  "brightai_orchestrator_output/**",
];

const ATTR_REFERENCE_REGEX = /\b(href|src|action|poster|data-href|data-src)\s*=\s*(['"])([^"'<>]+)\2/gi;
const CSS_URL_REGEX = /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi;
const JS_URL_KEY_REGEX = /\b(?:url|href|path|link)\s*:\s*(['"`])([^"'`\n\r]+)\1/g;
const JS_QUOTED_KEY_REGEX = /(['"`])(?:url|href|path|link)\1\s*:\s*(['"`])([^"'`\n\r]+)\2/g;
const JS_ASSIGNMENT_REGEX = /\b(?:href|src|action)\s*=\s*(['"`])([^"'`\n\r]+)\1/g;
const JS_SET_ATTRIBUTE_REGEX = /\bsetAttribute\(\s*['"](?:href|src|action|data-href|data-src)['"]\s*,\s*(['"`])([^"'`\n\r]+)\1\s*\)/g;

const SKIP_PREFIXES = [
  "http://",
  "//",
  "mailto:",
  "tel:",
  "javascript:",
  "data:",
  "blob:",
  "sms:",
  "geo:",
  "ftp:",
  "ws:",
  "wss:",
  "whatsapp:",
  "chrome-extension:",
  "about:",
];

function normalizeRelPath(filePath) {
  return filePath.split(path.sep).join("/");
}

function normalizeSitePath(sitePath) {
  if (!sitePath || sitePath === "/") {
    return "/";
  }

  return sitePath.replace(/\/+$/, "") || "/";
}

function decodePathname(pathname) {
  return pathname
    .split("/")
    .map((segment) => {
      if (!segment) {
        return segment;
      }

      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    })
    .join("/");
}

function relPathToDestinationPath(relPath) {
  const normalized = normalizeRelPath(relPath);
  if (normalized.endsWith("/index.html")) {
    return `/${normalized.slice(0, -"/index.html".length)}/`;
  }

  return `/${normalized}`;
}

function splitReferenceAndSuffix(reference) {
  const queryIndex = reference.indexOf("?");
  const hashIndex = reference.indexOf("#");
  let splitIndex = -1;

  if (queryIndex >= 0 && hashIndex >= 0) {
    splitIndex = Math.min(queryIndex, hashIndex);
  } else if (queryIndex >= 0) {
    splitIndex = queryIndex;
  } else if (hashIndex >= 0) {
    splitIndex = hashIndex;
  }

  if (splitIndex < 0) {
    return { referencePath: reference, suffix: "" };
  }

  return {
    referencePath: reference.slice(0, splitIndex),
    suffix: reference.slice(splitIndex),
  };
}

function resolveBrokenPath(referencePath) {
  const trimmed = String(referencePath || "").trim();
  if (!trimmed) {
    return null;
  }

  if (SKIP_PREFIXES.some((prefix) => trimmed.startsWith(prefix))) {
    return null;
  }

  if (trimmed.startsWith(SITE_ORIGIN)) {
    return normalizeSitePath(decodePathname(new URL(trimmed).pathname));
  }

  if (trimmed.startsWith("/")) {
    return normalizeSitePath(decodePathname(trimmed));
  }

  return null;
}

function pushMatches(replacements, content, regex, valueGroup, brokenTargetMap) {
  regex.lastIndex = 0;
  let match = regex.exec(content);

  while (match) {
    const original = match[valueGroup];
    if (original) {
      const valueOffset = match[0].indexOf(original);
      if (valueOffset >= 0) {
        const valueStart = match.index + valueOffset;
        const valueEnd = valueStart + original.length;
        const { referencePath, suffix } = splitReferenceAndSuffix(original);
        const brokenPath = resolveBrokenPath(referencePath);
        const destinationPath = brokenPath ? brokenTargetMap.get(brokenPath) : null;

        if (destinationPath && `${destinationPath}${suffix}` !== original) {
          replacements.push({
            valueStart,
            valueEnd,
            nextValue: `${destinationPath}${suffix}`,
            original,
          });
        }
      }
    }

    match = regex.exec(content);
  }
}

function applyReplacements(content, replacements) {
  const unique = [];
  const seen = new Set();

  for (const replacement of replacements) {
    const key = `${replacement.valueStart}:${replacement.valueEnd}:${replacement.nextValue}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(replacement);
    }
  }

  unique.sort((a, b) => b.valueStart - a.valueStart);

  let updated = content;
  let lastStart = Number.POSITIVE_INFINITY;

  for (const replacement of unique) {
    if (replacement.valueEnd > lastStart) {
      continue;
    }

    updated =
      updated.slice(0, replacement.valueStart) +
      replacement.nextValue +
      updated.slice(replacement.valueEnd);
    lastStart = replacement.valueStart;
  }

  return updated;
}

async function buildFrontendSourceIndex() {
  const matches = await glob("frontend/pages/**/*.html", {
    cwd: ROOT,
    nodir: true,
  });

  const index = new Map();
  for (const relPath of matches.map(normalizeRelPath)) {
    const sitePath = relPathToSitePath(relPath);
    if (!sitePath) {
      continue;
    }

    index.set(normalizeSitePath(sitePath), relPath);
  }

  return index;
}

async function buildBrokenTargetMap() {
  const raw = await fs.readFile(REPORT_PATH, "utf8");
  const report = JSON.parse(raw);
  const sourceIndex = await buildFrontendSourceIndex();
  const brokenTargetMap = new Map();

  for (const entry of report.data) {
    const brokenPath = normalizeSitePath(decodePathname(new URL(entry.target_url).pathname));
    if (brokenTargetMap.has(brokenPath)) {
      continue;
    }

    const sourceRelPath = sourceIndex.get(brokenPath);
    if (!sourceRelPath) {
      continue;
    }

    brokenTargetMap.set(brokenPath, relPathToDestinationPath(sourceRelPath));
  }

  return brokenTargetMap;
}

async function main() {
  const brokenTargetMap = await buildBrokenTargetMap();
  const files = new Set();

  for (const pattern of FILE_PATTERNS) {
    const matches = await glob(pattern, {
      cwd: ROOT,
      nodir: true,
      ignore: IGNORE_PATTERNS,
    });
    for (const file of matches) {
      files.add(normalizeRelPath(file));
    }
  }

  const changeSummary = [];

  for (const file of [...files].sort()) {
    const absolutePath = path.join(ROOT, file);
    const content = await fs.readFile(absolutePath, "utf8");
    const replacements = [];

    pushMatches(replacements, content, ATTR_REFERENCE_REGEX, 3, brokenTargetMap);
    pushMatches(replacements, content, CSS_URL_REGEX, 2, brokenTargetMap);
    pushMatches(replacements, content, JS_URL_KEY_REGEX, 2, brokenTargetMap);
    pushMatches(replacements, content, JS_QUOTED_KEY_REGEX, 3, brokenTargetMap);
    pushMatches(replacements, content, JS_ASSIGNMENT_REGEX, 2, brokenTargetMap);
    pushMatches(replacements, content, JS_SET_ATTRIBUTE_REGEX, 2, brokenTargetMap);

    if (!replacements.length) {
      continue;
    }

    const updated = applyReplacements(content, replacements);
    if (updated === content) {
      continue;
    }

    await fs.writeFile(absolutePath, updated, "utf8");
    changeSummary.push({ file, changes: replacements.length });
  }

  const lines = [];
  lines.push("# Broken Links Rewritten To Frontend Pages");
  lines.push("");
  lines.push(`- Date: ${new Date().toISOString()}`);
  lines.push(`- Broken targets mapped: ${brokenTargetMap.size}`);
  lines.push(`- Files updated: ${changeSummary.length}`);
  lines.push("");
  lines.push("## Updated Files");
  lines.push("");

  if (!changeSummary.length) {
    lines.push("- None");
  } else {
    changeSummary.sort((a, b) => b.changes - a.changes || a.file.localeCompare(b.file));
    for (const item of changeSummary) {
      lines.push(`- \`${item.file}\` => ${item.changes} replacements`);
    }
  }

  lines.push("");
  await fs.writeFile(REPORT_OUTPUT, `${lines.join("\n")}\n`, "utf8");

  console.log(`Broken targets mapped: ${brokenTargetMap.size}`);
  console.log(`Files updated: ${changeSummary.length}`);
  console.log(`Report: ${REPORT_OUTPUT}`);
}

await main();
