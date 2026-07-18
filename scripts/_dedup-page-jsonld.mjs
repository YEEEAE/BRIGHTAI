#!/usr/bin/env node
/**
 * scripts/_dedup-page-jsonld.mjs
 *
 * BAI-SEO-003-S3 (2026-07-18): one-off cleaner that removes duplicate
 * ORGANIZATION + getBreadcrumbLd calls from page-level JSON-LD in
 * every .astro file under src/pages. These nodes are already emitted
 * by the foundation Schema.astro; the duplicates were a soft-spam
 * signal flagged by scripts/_check-duplicate-schema-ids.mjs.
 *
 * What it removes from each page's `jsonLd`:
 *   - ORGANIZATION references (top-level or inside @graph)
 *   - getBreadcrumbLd(...) calls (the foundation emits BreadcrumbList
 *     from the `breadcrumbs` prop on the layout)
 *
 * What it KEEPS (these are page-specific nodes, not duplicates):
 *   - LocalBusiness per city
 *   - FAQPage, HowTo, Article, TechArticle, BlogPosting, AboutPage
 *   - Service, ContactPage, CollectionPage, etc.
 *   - Event (none in build after BAI-SEO-003-S3 cleanup)
 *   - DefinedTermSet
 *   - Any Service/LocalBusiness by @id unique to the page
 *
 * Idempotent: re-running is a no-op.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { glob } from "glob";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PAGES = path.join(ROOT, "src/pages");

const files = await glob("**/*.astro", {
  cwd: PAGES,
  absolute: true,
  nodir: true,
  ignore: ["**/_archive/**", "**/_old/**", "**/dist/**"],
});

let touchedCount = 0;
for (const file of files.sort()) {
  const original = await fs.readFile(file, "utf8");
  let updated = original;

  // Strategy A: remove `ORGANIZATION,` entries that appear at the top level
  // of an @graph array (typically the second line after the @graph: [ line).
  // These are usually like "  ORGANIZATION," or "  ORGANIZATION\n".
  // We use a tight regex: only remove the literal identifier `ORGANIZATION`
  // when followed by a comma/newline + optional whitespace + end of line.
  updated = updated.replace(/^[ \t]*ORGANIZATION,?[ \t]*\r?\n/gm, "");

  // Strategy B: remove `getBreadcrumbLd([...])` calls that are the only
  // top-level node in an @graph. We don't try to surgically remove
  // mid-array entries (too risky to mis-parse). We look for the specific
  // pattern of a line that starts with `    getBreadcrumbLd(` through
  // to its closing `])` on the same/next lines — typical of the 4–6
  // city pages that use this helper.
  updated = updated.replace(
    /^[ \t]*getBreadcrumbLd\(\[[\s\S]*?\]\),?[ \t]*\r?\n/gm,
    "",
  );

  // Phase 2 (always run, even if Phase 1 was a no-op): clean up
  // `import { ORGANIZATION, ... }` and `import { ..., getBreadcrumbLd, ... }`
  // lines if the identifiers are no longer referenced anywhere in the file.
  const identifierCount = (u, name) => {
    const lines = u.split("\n");
    const withoutImports = lines
      .filter((l) => !/^\s*import\b/.test(l))
      .join("\n");
    const m = withoutImports.match(new RegExp(`\\b${name}\\b`, "g"));
    return m ? m.length : 0;
  };

  const hasOrg = identifierCount(updated, "ORGANIZATION") > 0;
  const hasBreadcrumb = identifierCount(updated, "getBreadcrumbLd") > 0;

  if (
    /import\s*\{[^}]*\bORGANIZATION\b[^}]*\}\s*from/.test(updated) ||
    /import\s*\{[^}]*\bgetBreadcrumbLd\b[^}]*\}\s*from/.test(updated)
  ) {
    const newUpdated = updated.replace(
      /^import\s*\{([^}]*)\}\s*from\s*(['"])([^'"]*schema-helpers)\2;?[ \t]*\r?\n/m,
      (match, inside, q, path_) => {
        const ids = inside
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .filter((id) => {
            if (id === "ORGANIZATION" && !hasOrg) return false;
            if (id === "getBreadcrumbLd" && !hasBreadcrumb) return false;
            return true;
          });
        if (ids.length === 0) return ""; // drop the line entirely
        return `import { ${ids.join(", ")} } from ${q}${path_}${q};\n`;
      },
    );
    updated = newUpdated;
  }

  if (updated !== original) {
    await fs.writeFile(file, updated, "utf8");
    touchedCount++;
    const rel = path.relative(ROOT, file);
    console.log(`✓ cleaned  ${rel}`);
  }
}

console.log(`\n${touchedCount} file(s) updated.`);
