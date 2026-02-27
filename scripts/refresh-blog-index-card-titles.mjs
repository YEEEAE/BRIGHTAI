#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const BLOG_INDEX = path.join(ROOT, "frontend/pages/blog/index.html");
const BLOGGER_ROOT = path.join(ROOT, "frontend/pages/blogger");

function stripTags(value) {
  return value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function extractRedirectTargetPath(content) {
  const metaTags = [...content.matchAll(/<meta[^>]*>/gi)].map((match) => match[0]);
  for (const tag of metaTags) {
    if (!/http-equiv\s*=\s*["']refresh["']/i.test(tag)) continue;
    const contentMatch = tag.match(/content\s*=\s*["']([^"']+)["']/i);
    if (!contentMatch?.[1]) continue;
    const urlMatch = contentMatch[1].match(/url\s*=\s*([^;]+)/i);
    if (!urlMatch?.[1]) continue;
    return urlMatch[1].trim();
  }

  const jsRedirectMatch = content.match(/window\.location\.replace\(\s*["']([^"']+)["']\s*\)/i);
  return jsRedirectMatch?.[1]?.trim() || null;
}

function toBloggerFilePath(href) {
  if (!href) return null;
  if (!href.startsWith("/frontend/pages/blogger/")) return null;
  const fileName = href.slice("/frontend/pages/blogger/".length);
  return path.join(BLOGGER_ROOT, fileName);
}

async function resolveTitleFromHref(rawHref) {
  let href = rawHref;
  if (!href || href === "/frontend/pages/blog/index.html") {
    href = "/frontend/pages/blogger/nca-ai-compliance-saudi.html";
  }

  let targetFile = toBloggerFilePath(href);
  if (!targetFile) return null;

  for (let hop = 0; hop < 3; hop += 1) {
    let content = null;
    try {
      content = await fs.readFile(targetFile, "utf8");
    } catch {
      return null;
    }

    const redirectTarget = extractRedirectTargetPath(content);
    if (redirectTarget) {
      const nextFile = toBloggerFilePath(redirectTarget);
      if (!nextFile) break;
      targetFile = nextFile;
      continue;
    }

    const titleMatch = content.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (!titleMatch?.[1]) return null;
    const cleanTitle = stripTags(titleMatch[1]);
    return cleanTitle || null;
  }

  return null;
}

async function main() {
  const original = await fs.readFile(BLOG_INDEX, "utf8");
  const blockRegex =
    /(<a\s+href="([^"]+)"[^>]*class="flex-1 flex flex-col"[^>]*>\s*<h4[^>]*>\s*)([\s\S]*?)(<\/h4>)/g;

  let updated = original;
  let match = blockRegex.exec(original);
  let updatedCards = 0;

  while (match) {
    const fullMatch = match[0];
    const prefix = match[1];
    const href = match[2];
    const currentTitleRaw = match[3];
    const suffix = match[4];

    const currentTitle = stripTags(currentTitleRaw);
    const shouldRefresh = currentTitle === "تم نقل الصفحة" || /\.html$/i.test(currentTitle);
    if (!shouldRefresh) {
      match = blockRegex.exec(original);
      continue;
    }

    const nextTitle = await resolveTitleFromHref(href);
    if (!nextTitle || nextTitle === currentTitle) {
      match = blockRegex.exec(original);
      continue;
    }

    const replacement = `${prefix}${nextTitle}${suffix}`;
    if (updated.includes(fullMatch)) {
      updated = updated.replace(fullMatch, replacement);
      updatedCards += 1;
    }

    match = blockRegex.exec(original);
  }

  if (updated !== original) {
    await fs.writeFile(BLOG_INDEX, updated, "utf8");
  }

  console.log(`Blog card titles refreshed: ${updatedCards}`);
}

main().catch((error) => {
  console.error(error?.stack || error);
  process.exit(1);
});
