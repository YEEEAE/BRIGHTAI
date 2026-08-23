#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const redirectsJsonPath = path.join(ROOT, "redirects.json");
const publicRedirectsPath = path.join(ROOT, "public", "_redirects");
const renderYamlPath = path.join(ROOT, "render.yaml");
const astroConfigPath = path.join(ROOT, "astro.config.mjs");

/**
 * BAI-IDX-22 (2026-07-25): Inject redirects into astro.config.mjs.
 *
 * Replaces the `redirects: { ... },` block in astro.config.mjs with an
 * auto-generated list from redirects.json. This is the layer that
 * Astro's adapter actually processes for paths without a static file
 * — the Node middleware is NOT used (see DEC-BAI-IDX-22-001, Astro's
 * renderError for 404s reads the prerendered 404.html from disk
 * directly and never invokes the middleware).
 *
 * Only entries whose source has NO static file in src/pages/ are
 * included. Entries whose source resolves to a real page would be
 * deleted by the Astro build (it interprets the redirect as "this
 * path is now a redirect, remove the static file" — see BAI-IDX-12
 * for the /blog → /blog/ regression).
 *
 * Reversal cost: low. Delete this function + the call in main().
 */
async function injectAstroConfigRedirects(redirects) {
  const content = await fs.readFile(astroConfigPath, "utf8");

  // Locate the `redirects: {` block. The config has a single top-level
  // redirects object. We find it by anchoring on the keyword.
  const startMarker = "redirects: {";
  const startIndex = content.indexOf(startMarker);
  if (startIndex === -1) {
    throw new Error(
      `astro.config.mjs: could not find '${startMarker}' — cannot inject redirects`,
    );
  }

  // Walk forward from the opening `{` to find its matching `}`. The
  // redirects object is a flat list of `{ from, to, status }` entries
  // — no nested objects — so a brace-counting walk is reliable.
  const openBraceIndex = content.indexOf("{", startIndex);
  let depth = 1;
  let endBraceIndex = -1;
  for (let i = openBraceIndex + 1; i < content.length; i += 1) {
    const ch = content[i];
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        endBraceIndex = i;
        break;
      }
    }
  }
  if (endBraceIndex === -1) {
    throw new Error(
      `astro.config.mjs: unbalanced braces in redirects block — refusing to modify`,
    );
  }

  // Collect the set of paths that have a static page in src/pages/.
  // We use the src/pages/ tree (not dist/) because dist/ is a build
  // artifact and the Astro redirect check is against the source.
  const staticPages = new Set();
  async function walkSrcPages(dir) {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walkSrcPages(full);
      } else if (entry.isFile() && entry.name.endsWith(".astro")) {
        // Translate src/pages/foo/bar.astro → /foo/bar
        const rel = path
          .relative(path.join(ROOT, "src", "pages"), full)
          .replace(/\.astro$/, "")
          .replace(/index$/, "")
          .replace(/\\/g, "/");
        const url = "/" + rel;
        staticPages.add(url);
        // The trailing-slash variant (Astro's `trailingSlash: 'always'`
        // emits a directory with index.html for every page).
        if (!url.endsWith("/")) {
          staticPages.add(url + "/");
        }
      }
    }
  }
  await walkSrcPages(path.join(ROOT, "src", "pages"));

  // BAI-IDX-REDIR-002 (2026-08-24): dynamic routes render from content
  // collections (src/pages/docs/[...slug].astro etc.) — the .astro walk
  // above never sees them. Enumerate their slugs so the collision filter
  // can protect real pages like /docs/nca-ecc-ai-controls/ from
  // .html-suffixed redirect keys that Astro would collapse onto them.
  const contentDirs = [
    ["src/content/blog", "/blog"],
    ["src/content/docs", "/docs"],
    ["src/content/hub", "/hub"],
  ];
  const walkContent = async (dir, prefix) => {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walkContent(full, prefix);
      } else if (/\.(md|mdx)$/.test(entry.name)) {
        const slug = entry.name.replace(/\.(md|mdx)$/, "");
        staticPages.add(`${prefix}/${slug}`);
        staticPages.add(`${prefix}/${slug}/`);
      }
    }
  };
  for (const [dir, prefix] of contentDirs) {
    await walkContent(path.join(ROOT, dir), prefix);
  }

  // Also include dist/client special files that the Node adapter serves
  // directly (404.html, 500.html, index.html).
  staticPages.add("/");
  staticPages.add("/404");
  staticPages.add("/500");
  staticPages.add("/index.html");
  staticPages.add("/404.html");
  staticPages.add("/500.html");

  // Filter redirects: skip any whose source matches a static page.
  // We also skip entries with `*` or `:` in the source (wildcards +
  // placeholders — these work in Netlify _redirects but not in
  // Astro's redirects config which expects literal paths).
  //
  // BAI-IDX-REDIR-002 (2026-08-24): the check must cover the route
  // forms Astro NORMALIZES a key into — not just the raw `from`.
  // Astro 6 static output strips a trailing `.html` (and `/index.html`)
  // from redirect keys under `trailingSlash: 'always'` + directory
  // format, so a key like `/blog.html` (destination `/blog/`) is
  // emitted at `blog/index.html` — overwriting the REAL /blog/ page
  // with a self-refresh stub (verified 2026-08-24 for /blog/, /docs/,
  // /en/, /assessment/ai-governance-readiness/ and
  // /docs/nca-ecc-ai-controls/). Entries dropped here stay covered by
  // the runtime listener map (src/server/legacy-redirect-map.mjs) and
  // public/_redirects.
  const astroRouteForms = (from) => {
    const forms = new Set([from]);
    if (from.endsWith("/index.html")) {
      const dir = from.slice(0, -"/index.html".length);
      if (dir) {
        forms.add(dir);
        forms.add(dir + "/");
      }
    } else if (from.endsWith(".html")) {
      const stripped = from.slice(0, -".html".length);
      forms.add(stripped);
      forms.add(stripped + "/");
      if (!from.endsWith("/")) forms.add(from + "/");
    } else if (!from.endsWith("/")) {
      forms.add(from + "/");
    }
    return forms;
  };
  const safeRedirects = redirects.filter((r) => {
    if (!r || typeof r.from !== "string" || typeof r.to !== "string") return false;
    if (/[*:?]/.test(r.from) || /[*:?]/.test(r.to)) return false;
    if (staticPages.has(r.from)) return false;
    for (const form of astroRouteForms(r.from)) {
      if (staticPages.has(form)) return false;
    }
    return true;
  });

  // De-dupe by source path. First wins (existing entries take
  // precedence — mirrors the check-redirect-destinations.mjs logic).
  const seen = new Set();
  const deduped = [];
  for (const r of safeRedirects) {
    if (seen.has(r.from)) continue;
    seen.add(r.from);
    deduped.push(r);
  }

  // Build the new block content. We preserve the formatting style of
  // the original (multi-line object, single quote strings, sorted
  // longest-first to avoid prefix-shadowing — Astro's router is
  // first-match, so a longer prefix must come before a shorter one
  // for the same target).
  deduped.sort((a, b) => b.from.length - a.from.length);

  const blockLines = [];
  blockLines.push("redirects: {");
  blockLines.push(
    "    // BAI-IDX-22 (2026-07-25) — auto-generated legacy redirects.",
  );
  blockLines.push(
    "    // Source of truth: redirects.json (run scripts/generate-all-redirects.mjs",
  );
  blockLines.push(
    "    // before astro build via the `prebuild` npm script). Entries whose",
  );
  blockLines.push(
    "    // source has a static page in src/pages/ are filtered out (Astro would",
  );
  blockLines.push(
    "    // delete the static file at build time — see BAI-IDX-12 for the /blog",
  );
  blockLines.push(
    "    // regression that taught us this). Wildcards and :placeholders are also",
  );
  blockLines.push(
    "    // excluded (Astro's redirects config only accepts literal paths; the full",
  );
  blockLines.push(
    "    // wildcard set lives in public/_redirects for Netlify/Cloudflare Pages).",
  );
  blockLines.push(
    `    // ${deduped.length} entries (out of ${redirects.length} in redirects.json).`,
  );
  for (const r of deduped) {
    const status = Number.isInteger(r.status) ? r.status : 301;
    blockLines.push(`    '${r.from}': {`);
    blockLines.push(`      status: ${status},`);
    blockLines.push(`      destination: '${r.to}',`);
    blockLines.push(`    },`);
  }
  // Close the redirects object WITHOUT a trailing comma. The original
  // config had `},` on the line after the matching `}`; we preserve
  // that comma as part of `after` so we don't double it up.
  blockLines.push("  }");

  // Replace the old block.
  const before = content.slice(0, startIndex);
  const after = content.slice(endBraceIndex + 1);
  const newContent = before + blockLines.join("\n") + after;

  await fs.writeFile(astroConfigPath, newContent, "utf8");
  return {
    totalIn: redirects.length,
    afterFilter: safeRedirects.length,
    afterDedup: deduped.length,
    skipped: redirects.length - deduped.length,
  };
}

async function main() {
  try {
    const data = await fs.readFile(redirectsJsonPath, "utf8");
    const parsed = JSON.parse(data);
    const redirects = parsed.redirects || [];

    console.log(`قراءة ${redirects.length} قاعدة تحويل من redirects.json`);

    // 1. توليد ملف public/_redirects
    let netlifyRedirects = `# ==============================================================================\n`;
    netlifyRedirects += `# BRIGHTAI - Static Redirects Configuration (AUTO-GENERATED DO NOT EDIT)\n`;
    netlifyRedirects += `# Source: redirects.json\n`;
    netlifyRedirects += `# ==============================================================================\n\n`;
    netlifyRedirects += `http://brightai.site/*        https://brightai.site/:splat  301\n`;
    netlifyRedirects += `https://www.brightai.site/*    https://brightai.site/:splat  301\n\n`;

    for (const r of redirects) {
      netlifyRedirects += `${r.from} ${r.to} ${r.status || 301}\n`;
    }
    
    // إضافة حماية إضافية للـ frontend
    netlifyRedirects += `/frontend/* /404/ 301\n`;

    await fs.writeFile(publicRedirectsPath, netlifyRedirects, "utf8");
    console.log(`تم تحديث public/_redirects بنجاح`);

    // 2. تحديث ملف render.yaml
    const renderYamlContent = await fs.readFile(renderYamlPath, "utf8");
    const routesStartIndex = renderYamlContent.indexOf("    routes:");
    if (routesStartIndex === -1) {
      throw new Error("لم يتم العثور على '    routes:' في ملف render.yaml");
    }

    const yamlPrefix = renderYamlContent.substring(0, routesStartIndex + "    routes:\n".length);
    let yamlRoutes = "";

    // إضافة التحويلات الأساسية لـ trailing slash والصفحات الخاصة
    const baseRedirects = [
      { from: "/index.html", to: "/" },
      { from: "/about", to: "/about/" },
      { from: "/about.html", to: "/about/" },
      { from: "/about/index.html", to: "/about/" },
      { from: "/contact", to: "/contact/" },
      { from: "/contact.html", to: "/contact/" },
      { from: "/contact/index.html", to: "/contact/" },
      { from: "/services", to: "/services/" },
      { from: "/services.html", to: "/services/" },
      { from: "/services/index.html", to: "/services/" },
      { from: "/pricing", to: "/pricing/" },
      { from: "/pricing.html", to: "/pricing/" },
      { from: "/pricing/index.html", to: "/pricing/" },
      { from: "/demo", to: "/demo/" },
      { from: "/demo.html", to: "/demo/" },
      { from: "/demo/index.html", to: "/demo/" },
      { from: "/privacy-policy", to: "/privacy-policy/" },
      { from: "/privacy-policy.html", to: "/privacy-policy/" },
      { from: "/privacy-policy/index.html", to: "/privacy-policy/" },
      { from: "/cookie-policy", to: "/cookie-policy/" },
      { from: "/cookie-policy.html", to: "/cookie-policy/" },
      { from: "/cookie-policy/index.html", to: "/cookie-policy/" },
      { from: "/terms", to: "/terms/" },
      { from: "/terms.html", to: "/terms/" },
      { from: "/terms/index.html", to: "/terms/" },
      { from: "/pdpl-statement", to: "/pdpl-statement/" },
      { from: "/pdpl-statement.html", to: "/pdpl-statement/" },
      { from: "/pdpl-statement/index.html", to: "/pdpl-statement/" },
      { from: "/data-processing-agreement", to: "/data-processing-agreement/" },
      { from: "/data-processing-agreement.html", to: "/data-processing-agreement/" },
      { from: "/data-processing-agreement/index.html", to: "/data-processing-agreement/" },
      { from: "/trust", to: "/trust/" },
      { from: "/trust.html", to: "/trust/" },
      { from: "/trust/index.html", to: "/trust/" },
    ];

    const seenRoutes = new Set();
    const addYamlRoute = (from, to) => {
      if (seenRoutes.has(from) || from === to) return;
      seenRoutes.add(from);
      yamlRoutes += `      - type: redirect\n        source: ${from}\n        destination: ${to}\n`;
    };

    // إضافة التحويلات الأساسية أولاً
    for (const br of baseRedirects) {
      addYamlRoute(br.from, br.to);
    }

    // إضافة التحويلات من redirects.json
    for (const r of redirects) {
      addYamlRoute(r.from, r.to);
    }

    // إضافة حماية الـ frontend والـ RSS
    addYamlRoute("/frontend", "/404/");
    addYamlRoute("/frontend/", "/404/");
    addYamlRoute("/frontend/*", "/404/");
    addYamlRoute("/rss", "/rss.xml/");
    addYamlRoute("/rss.html", "/rss.xml/");
    addYamlRoute("/rss/index.html", "/rss.xml/");
    addYamlRoute("/blog/feed", "/rss.xml/");
    addYamlRoute("/blog/feed.html", "/rss.xml/");
    addYamlRoute("/blog/feed.xml", "/rss.xml/");
    addYamlRoute("/blog/feed.xml/", "/rss.xml/");
    addYamlRoute("/blog/feed/index.html", "/rss.xml/");

    await fs.writeFile(renderYamlPath, yamlPrefix + yamlRoutes, "utf8");
    console.log(`تم تحديث render.yaml بنجاح مع ${seenRoutes.size} قواعد تحويل`);

    // 3. BAI-IDX-22 (2026-07-25): inject the safe subset of redirects
    //    into astro.config.mjs. This is the layer that the @astrojs/node
    //    adapter actually processes for paths without a static file.
    const astroStats = await injectAstroConfigRedirects(redirects);
    console.log(
      `تم تحديث astro.config.mjs: ${astroStats.afterDedup} redirect(s) (${astroStats.skipped} skipped — have static page or wildcards)`,
    );

  } catch (error) {
    console.error("خطأ أثناء توليد التحويلات:", error);
    process.exit(1);
  }
}

main();
