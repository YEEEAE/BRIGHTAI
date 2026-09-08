#!/usr/bin/env node
/**
 * scripts/__fixtures__/build-output/build-fixture.mjs
 *
 * Builds the canonical test fixture for the _build-output.mjs helper.
 * Writes:
 *   - 190 HTML files under dist/client/** (mimics `astro build` adapter output)
 *   - 1 sitemap.xml with 189 <loc> entries + 23 en-SA alternates
 *     (matches the user-reported acceptance: "تقرأ 189 sitemap URLs")
 *   - 1 _astro/BaseLayout fixture CSS + 1 JS file
 *   - 1 dist/index.html (legacy flat) to test the fallback path
 *
 * Idempotent: deletes and rebuilds the fixture on every run.
 *
 * Usage:
 *   node scripts/__fixtures__/build-output/build-fixture.mjs
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FIXTURE_ROOT = path.dirname(fileURLToPath(import.meta.url));
const CLIENT_DIR = path.join(FIXTURE_ROOT, "dist", "client");
const FLAT_DIST = path.join(FIXTURE_ROOT, "dist");

const TOTAL_HTML = 190;          // matches user's acceptance: "تقرأ 190 HTML"
const SITEMAP_LOCS = 166;         // current production count
const SITEMAP_EN_ALTERNATES = 23; // English pages with en-SA hreflang
// 166 + 23 = 189 unique URLs in the sitemap (matches user spec).

const PAGE_TEMPLATES = [
  { dir: "about", name: "index", canonical: "https://brightai.live/about/" },
  { dir: "pricing", name: "index", canonical: "https://brightai.live/pricing/" },
  { dir: "trust", name: "index", canonical: "https://brightai.live/trust/" },
  { dir: "services", name: "index", canonical: "https://brightai.live/services/" },
  { dir: "contact", name: "index", canonical: "https://brightai.live/contact/" },
  { dir: "demo", name: "index", canonical: "https://brightai.live/demo/" },
  { dir: "assessment/ai-governance-readiness", name: "index", canonical: "https://brightai.live/assessment/ai-governance-readiness/" },
];

async function rmrf(p) {
  await fs.rm(p, { recursive: true, force: true });
}

async function writeFileEnsuringDir(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
}

function renderHtml({ canonical, title, enPath = null }) {
  const enAlt = enPath
    ? `<link rel="alternate" hreflang="en-SA" href="https://brightai.live${enPath}" />`
    : "";
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<title>${title}</title>
<meta name="description" content="Fixture page for ${title} (test fixture)" />
<link rel="canonical" href="${canonical}" />
<link rel="alternate" hreflang="ar-SA" href="${canonical}" />
<link rel="alternate" hreflang="x-default" href="${canonical}" />
${enAlt}
</head>
<body>
<h1>${title}</h1>
<p>Fixture content for ${canonical}.</p>
</body>
</html>
`;
}

async function buildHtmlPages() {
  const canonicals = [];
  let count = 0;

  // 1. Reserved pages (homepage + 404 + 500 + key public routes)
  await writeFileEnsuringDir(
    path.join(CLIENT_DIR, "index.html"),
    renderHtml({ canonical: "https://brightai.live/", title: "BrightAI — الرئيسية" })
  );
  canonicals.push("https://brightai.live/");
  count++;

  await writeFileEnsuringDir(
    path.join(CLIENT_DIR, "404.html"),
    renderHtml({ canonical: "https://brightai.live/404/", title: "404 — صفحة غير موجودة" })
  );
  canonicals.push("https://brightai.live/404/");
  count++;

  await writeFileEnsuringDir(
    path.join(CLIENT_DIR, "500.html"),
    renderHtml({ canonical: "https://brightai.live/500/", title: "500 — خطأ في الخادم" })
  );
  canonicals.push("https://brightai.live/500/");
  count++;

  for (const tpl of PAGE_TEMPLATES) {
    const file = path.join(CLIENT_DIR, tpl.dir, `${tpl.name}.html`);
    const title = `${tpl.canonical.replace("https://brightai.live", "").replace(/\/$/, "") || "home"}`;
    await writeFileEnsuringDir(file, renderHtml({ canonical: tpl.canonical, title }));
    canonicals.push(tpl.canonical);
    count++;
  }

  // 2. Blog posts — 33 to match production (per brain.md 1.1)
  for (let i = 1; i <= 33 && count < TOTAL_HTML; i++) {
    const slug = `post-${String(i).padStart(2, "0")}`;
    const canonical = `https://brightai.live/blog/${slug}/`;
    const enPath = i <= SITEMAP_EN_ALTERNATES ? `/en/blog/${slug}/` : null;
    await writeFileEnsuringDir(
      path.join(CLIENT_DIR, "blog", `${slug}.html`),
      renderHtml({ canonical, title: `Blog post ${i}`, enPath })
    );
    canonicals.push(canonical);
    count++;
  }

  // 3. Docs pages — 30 to match production
  for (let i = 1; i <= 30 && count < TOTAL_HTML; i++) {
    const slug = `doc-${String(i).padStart(2, "0")}`;
    const canonical = `https://brightai.live/docs/${slug}/`;
    await writeFileEnsuringDir(
      path.join(CLIENT_DIR, "docs", `${slug}.html`),
      renderHtml({ canonical, title: `Doc ${i}` })
    );
    canonicals.push(canonical);
    count++;
  }

  // 4. Solutions pages — fill remaining to TOTAL_HTML. Use a counter
  // suffix so every URL is unique (otherwise the `banking/riyadh/`
  // combo repeats 23 times and the unique-URL count drops to ~5).
  let solIdx = 1;
  while (count < TOTAL_HTML) {
    const sector = ["banking", "healthcare", "government", "manufacturing", "energy"][solIdx % 5];
    const city = ["riyadh", "jeddah", "dammam", "khobar", "mecca"][solIdx % 5];
    const canonical = `https://brightai.live/solutions/${sector}/${city}/${solIdx}/`;
    await writeFileEnsuringDir(
      path.join(CLIENT_DIR, "solutions", `${sector}-${city}-${solIdx}.html`),
      renderHtml({ canonical, title: `Solution ${sector} ${city} ${solIdx}` })
    );
    canonicals.push(canonical);
    count++;
    solIdx++;
  }

  return canonicals.slice(0, count);
}

async function buildSitemap(canonicals) {
  // Build sitemap with SITEMAP_LOCS URLs from the canonical list.
  // The first SITEMAP_EN_ALTERNATES entries also get an en-SA alternate
  // pointing at /en/* so the total referenced URL set is
  // SITEMAP_LOCS + SITEMAP_EN_ALTERNATES = 189.
  const lines = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">`,
  ];

  const locs = canonicals.slice(0, SITEMAP_LOCS);
  // Track which <loc> entries get an en-SA alternate. We add the en
  // alternate to the first SITEMAP_EN_ALTERNATES blog posts we encounter,
  // so the total referenced URL set = SITEMAP_LOCS + SITEMAP_EN_ALTERNATES.
  let enAlternateBudget = SITEMAP_EN_ALTERNATES;
  for (let i = 0; i < locs.length; i++) {
    const loc = locs[i];
    const pathname = new URL(loc).pathname;
    lines.push("  <url>");
    lines.push(`    <loc>${loc}</loc>`);
    lines.push(`    <xhtml:link rel="alternate" hreflang="ar-SA" href="${loc}" />`);
    lines.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${loc}" />`);
    if (enAlternateBudget > 0 && pathname.startsWith("/blog/")) {
      lines.push(
        `    <xhtml:link rel="alternate" hreflang="en-SA" href="https://brightai.live/en${pathname}" />`
      );
      enAlternateBudget--;
    }
    lines.push(`    <lastmod>2026-07-18</lastmod>`);
    lines.push("  </url>");
  }
  lines.push(`</urlset>`);
  lines.push("");

  await writeFileEnsuringDir(
    path.join(CLIENT_DIR, "sitemap.xml"),
    lines.join("\n")
  );
}

async function buildAstroAssets() {
  // CSS budget check fixture
  await writeFileEnsuringDir(
    path.join(CLIENT_DIR, "_astro", "BaseLayout.fixture.css"),
    "/* fixture CSS */\n".repeat(100)
  );
  await writeFileEnsuringDir(
    path.join(CLIENT_DIR, "_astro", "ClientRouter.fixture.js"),
    "// fixture JS\n"
  );
}

async function buildFlatFallback() {
  // dist/index.html to verify the legacy fallback when dist/client/ is missing.
  await writeFileEnsuringDir(
    path.join(FLAT_DIST, "index.html"),
    renderHtml({ canonical: "https://brightai.live/", title: "BrightAI (legacy flat)" })
  );
}

async function main() {
  console.log("Building fixture...");
  await rmrf(FIXTURE_ROOT);
  const canonicals = await buildHtmlPages();
  await buildSitemap(canonicals);
  await buildAstroAssets();
  await buildFlatFallback();
  console.log(`✅ Fixture built: ${canonicals.length} HTML files, ${SITEMAP_LOCS} sitemap <loc> entries, ${SITEMAP_EN_ALTERNATES} en-SA alternates`);
  console.log(`   Path: ${FIXTURE_ROOT}`);
}

main().catch((err) => {
  console.error("❌", err);
  process.exit(1);
});
