const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

const ROOT_DIR = "/Users/yzydalshmry/Desktop/BrightAI/frontend/pages/";
const DOMAIN = "https://brightai.site";
const META_REFRESH_TAG_REGEX =
  /<meta\b(?=[^>]*\bhttp-equiv\s*=\s*(?:"\s*refresh\s*"|'\s*refresh\s*'|refresh\b))[^>]*\/?>/gi;

function collectHtmlFiles(dir, acc = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectHtmlFiles(fullPath, acc);
    } else if (entry.isFile() && path.extname(entry.name).toLowerCase() === ".html") {
      acc.push(fullPath);
    }
  }
  return acc;
}

function buildCanonicalUrl(filePath) {
  const relativePath = path.relative(ROOT_DIR, filePath).split(path.sep).join("/");
  let canonicalPath;

  if (relativePath === "index.html") {
    canonicalPath = "/";
  } else if (relativePath.endsWith("/index.html")) {
    canonicalPath = "/" + relativePath.slice(0, -"index.html".length);
  } else {
    canonicalPath = "/" + relativePath;
  }

  canonicalPath = canonicalPath
    .split("/")
    .map((segment, i) => (i === 0 ? "" : encodeURIComponent(segment)))
    .join("/");

  if (!canonicalPath.startsWith("/")) canonicalPath = "/" + canonicalPath;
  return DOMAIN + canonicalPath;
}

function hasCanonicalInHead(html) {
  const $ = cheerio.load(html, { decodeEntities: false });
  return $("head link[rel]")
    .toArray()
    .some((el) => {
      const rel = ($(el).attr("rel") || "").toLowerCase();
      return rel.split(/\s+/).includes("canonical");
    });
}

function injectCanonicalIntoHead(html, canonicalHref) {
  const canonicalTag = `<link rel="canonical" href="${canonicalHref}" />`;

  const closeHeadMatch = /<\/head\s*>/i.exec(html);
  if (closeHeadMatch && closeHeadMatch.index != null) {
    const idx = closeHeadMatch.index;
    const before = html.slice(0, idx);
    const after = html.slice(idx);
    const prefix = before.endsWith("\n") ? "" : "\n";
    return `${before}${prefix}    ${canonicalTag}\n${after}`;
  }

  const openHeadMatch = /<head\b[^>]*>/i.exec(html);
  if (openHeadMatch && openHeadMatch.index != null) {
    const idx = openHeadMatch.index + openHeadMatch[0].length;
    return `${html.slice(0, idx)}\n    ${canonicalTag}\n${html.slice(idx)}`;
  }

  const openHtmlMatch = /<html\b[^>]*>/i.exec(html);
  if (openHtmlMatch && openHtmlMatch.index != null) {
    const idx = openHtmlMatch.index + openHtmlMatch[0].length;
    return `${html.slice(0, idx)}\n<head>\n    ${canonicalTag}\n</head>\n${html.slice(idx)}`;
  }

  return `<head>\n    ${canonicalTag}\n</head>\n${html}`;
}

function secureOverwrite(filePath, content) {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  const tempPath = path.join(dir, `.${base}.${process.pid}.${Date.now()}.tmp`);
  const originalStat = fs.statSync(filePath);

  try {
    fs.writeFileSync(tempPath, content, {
      encoding: "utf8",
      mode: originalStat.mode,
      flag: "wx",
    });
    fs.renameSync(tempPath, filePath);
  } catch (err) {
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    throw err;
  }
}

function processFile(filePath) {
  const original = fs.readFileSync(filePath, "utf8");
  let updated = original.replace(META_REFRESH_TAG_REGEX, "");
  let removedRefresh = updated !== original;
  let addedCanonical = false;

  if (!hasCanonicalInHead(updated)) {
    const canonicalHref = buildCanonicalUrl(filePath);
    updated = injectCanonicalIntoHead(updated, canonicalHref);
    addedCanonical = true;
  }

  if (updated !== original) {
    secureOverwrite(filePath, updated);
    return { changed: true, removedRefresh, addedCanonical };
  }

  return { changed: false, removedRefresh: false, addedCanonical: false };
}

function main() {
  if (!fs.existsSync(ROOT_DIR) || !fs.statSync(ROOT_DIR).isDirectory()) {
    throw new Error(`Directory not found or invalid: ${ROOT_DIR}`);
  }

  const startedAt = process.hrtime.bigint();
  const htmlFiles = collectHtmlFiles(ROOT_DIR);
  let changed = 0;
  let refreshRemoved = 0;
  let canonicalAdded = 0;

  for (const filePath of htmlFiles) {
    const result = processFile(filePath);
    if (result.changed) changed += 1;
    if (result.removedRefresh) refreshRemoved += 1;
    if (result.addedCanonical) canonicalAdded += 1;
  }

  const endedAt = process.hrtime.bigint();
  const durationMs = Number(endedAt - startedAt) / 1e6;

  console.log(`Scanned: ${htmlFiles.length} HTML file(s)`);
  console.log(`Modified: ${changed} file(s)`);
  console.log(`Meta refresh removed in: ${refreshRemoved} file(s)`);
  console.log(`Canonical added in: ${canonicalAdded} file(s)`);
  console.log(`Duration: ${durationMs.toFixed(2)} ms`);
}

main();
