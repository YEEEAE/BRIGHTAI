#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { glob } from "glob";

const ROOT = process.cwd();
const SITE_ORIGIN = "https://brightai.site/";
const HTML_LANG_REGEX = /<html\b([^>]*?)\blang=(["'])([^"']+)\2([^>]*)>/i;
const HREFLANG_REGEX = /hreflang=["']([^"']+)["']/gi;
const CANONICAL_REGEX = /<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i;

function shouldIgnoreFile(filePath) {
  return [
    "node_modules/",
    ".git/",
    "backend/",
    "brightai-platform/",
    "reports/",
    "scripts/",
    "tmp/",
    "dist/",
    "build/",
  ].some((segment) => filePath.includes(segment));
}

function inferTargetLang(filePath, content) {
  const canonicalMatch = content.match(CANONICAL_REGEX);
  if (!canonicalMatch) {
    return null;
  }

  const canonicalUrl = canonicalMatch[1];
  if (!canonicalUrl.startsWith(SITE_ORIGIN)) {
    return null;
  }

  const hreflangCodes = new Set(
    Array.from(content.matchAll(HREFLANG_REGEX), (match) => match[1].trim()),
  );

  if (!hreflangCodes.size) {
    return null;
  }

  const isEnglishVariant =
    filePath.startsWith("en/") ||
    filePath.endsWith("-en.html") ||
    canonicalUrl.includes("/docs/") && canonicalUrl.includes("-en/");

  if (isEnglishVariant && hreflangCodes.has("en-US")) {
    return "en-US";
  }

  if (hreflangCodes.has("ar-SA")) {
    return "ar-SA";
  }

  if (hreflangCodes.has("en-US")) {
    return "en-US";
  }

  return null;
}

async function main() {
  const files = await glob("**/*.html", { cwd: ROOT, nodir: true });
  const changedFiles = [];

  for (const relPath of files) {
    const normalizedPath = relPath.replace(/\\/g, "/");
    if (shouldIgnoreFile(normalizedPath)) {
      continue;
    }

    const absolutePath = path.join(ROOT, normalizedPath);
    const original = await fs.readFile(absolutePath, "utf8");
    const targetLang = inferTargetLang(normalizedPath, original);
    if (!targetLang) {
      continue;
    }

    const htmlTagMatch = original.match(HTML_LANG_REGEX);
    if (!htmlTagMatch) {
      continue;
    }

    const currentLang = htmlTagMatch[3];
    if (currentLang === targetLang) {
      continue;
    }

    const updated = original.replace(
      HTML_LANG_REGEX,
      `<html${htmlTagMatch[1]}lang="${targetLang}"${htmlTagMatch[4]}>`,
    );

    if (updated === original) {
      continue;
    }

    await fs.writeFile(absolutePath, updated, "utf8");
    changedFiles.push({ file: normalizedPath, from: currentLang, to: targetLang });
  }

  console.log(JSON.stringify({ changed: changedFiles.length, files: changedFiles }, null, 2));
}

main().catch((error) => {
  console.error(error?.stack || error);
  process.exit(1);
});
