import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SITE = "https://brightai.site";
const EXCLUDED_DIRS = new Set([
  ".agents",
  ".codex",
  ".git",
  ".next",
  ".render-static",
  "node_modules",
  "reports",
]);

function sectionImage(relPath) {
  const normalized = relPath.replaceAll("\\", "/").replace(/^\.\//, "");
  if (normalized.startsWith("kernel/")) return "og-kernel.png";
  if (normalized.startsWith("blog/")) return "og-blog.png";
  if (normalized.startsWith("solutions/")) return "og-solutions.png";
  if (normalized.startsWith("docs/")) return "og-docs.png";
  return "og-home.png";
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function metaPattern(key) {
  return new RegExp(
    `<meta\\b(?=[^>]*(?:property|name)\\s*=\\s*["']${escapeRegExp(key)}["'])[^>]*>`,
    "i",
  );
}

function setTagContent(tag, value) {
  if (/\bcontent\s*=\s*["'][^"']*["']/i.test(tag)) {
    return tag.replace(/\bcontent\s*=\s*(["'])[^"']*\1/i, `content="${value}"`);
  }
  return tag.replace(/\s*\/?>$/, ` content="${value}" />`);
}

function setMeta(html, key, value, attribute = "property") {
  const pattern = metaPattern(key);
  const match = html.match(pattern);
  if (match) {
    const normalizedTag = setTagContent(match[0], value).replace(
      /\b(?:property|name)\s*=\s*(["'])[^"']+\1/i,
      `${attribute}="${key}"`,
    );
    return html.replace(pattern, normalizedTag);
  }

  return html.replace(
    /<\/head>/i,
    `  <meta ${attribute}="${key}" content="${value}" />\n</head>`,
  );
}

function extract(html, pattern) {
  return html.match(pattern)?.[1]?.trim() ?? "";
}

function hasNoindex(html) {
  return /<meta\b(?=[^>]*name\s*=\s*["']robots["'])[^>]*content\s*=\s*["'][^"']*\bnoindex\b/i.test(html);
}

function addHreflangWhenMissing(html, relPath, canonical) {
  const needsHreflang = relPath.startsWith("kernel/") || relPath.startsWith("blog/");
  if (!needsHreflang || !canonical || hasNoindex(html) || /\bhreflang\s*=/i.test(html)) {
    return html;
  }

  const links = [
    `<link rel="alternate" hreflang="ar-SA" href="${canonical}">`,
    `<link rel="alternate" hreflang="x-default" href="${canonical}">`,
  ].join("\n");

  return html.replace(
    /(<link\b(?=[^>]*rel\s*=\s*["']canonical["'])[^>]*>)/i,
    `$1\n${links}`,
  );
}

function removePlaceholderProfileUrls(html) {
  const placeholderUrls = [
    "https://www.wikidata.org/wiki/[QID]",
    "https://linkedin.com/in/[founder-linkedin]",
    "https://twitter.com/[founder-twitter]",
  ];

  let output = html;
  for (const url of placeholderUrls) {
    const escapedUrl = escapeRegExp(url);
    output = output.replace(new RegExp(`,\\s*"${escapedUrl}"`, "g"), "");
    output = output.replace(new RegExp(`"${escapedUrl}"\\s*,?`, "g"), "");
  }
  return output;
}

export function transformHtml(html, relPath) {
  const imageUrl = `${SITE}/assets/images/og/${sectionImage(relPath)}`;
  const title = extract(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description = extract(
    html,
    /<meta\b(?=[^>]*name\s*=\s*["']description["'])[^>]*content\s*=\s*["']([^"']*)["'][^>]*>/i,
  );
  const canonical = extract(
    html,
    /<link\b(?=[^>]*rel\s*=\s*["']canonical["'])[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/i,
  );

  let output = removePlaceholderProfileUrls(html);
  output = setMeta(output, "og:type", "website");
  if (title) output = setMeta(output, "og:title", title);
  if (description) output = setMeta(output, "og:description", description);
  if (canonical) output = setMeta(output, "og:url", canonical);
  output = setMeta(output, "og:image", imageUrl);
  output = setMeta(output, "og:image:width", "1200");
  output = setMeta(output, "og:image:height", "630");
  output = setMeta(output, "twitter:card", "summary_large_image", "name");
  if (title) output = setMeta(output, "twitter:title", title, "name");
  if (description) output = setMeta(output, "twitter:description", description, "name");
  output = setMeta(output, "twitter:image", imageUrl, "name");
  return addHreflangWhenMissing(output, relPath, canonical);
}

function collectHtmlFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && EXCLUDED_DIRS.has(entry.name)) continue;
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) collectHtmlFiles(absolute, files);
    else if (entry.isFile() && entry.name.endsWith(".html")) files.push(absolute);
  }
  return files;
}

if (process.argv[2] === "--transform") {
  const relPath = process.argv[3];
  if (!relPath) throw new Error("Usage: --transform <relative-html-path>");
  const input = fs.readFileSync(0, "utf8");
  process.stdout.write(transformHtml(input, relPath));
} else {
  const files = collectHtmlFiles(ROOT);
  let changed = 0;
  for (const file of files) {
    const relPath = path.relative(ROOT, file).replaceAll("\\", "/");
    const before = fs.readFileSync(file, "utf8");
    const after = transformHtml(before, relPath);
    if (after !== before) {
      fs.writeFileSync(file, after);
      changed += 1;
    }
  }
  console.log(`Updated ${changed} of ${files.length} HTML files.`);
}
