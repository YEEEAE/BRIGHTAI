# 00 — Current SEO Reality

- Analysis date: 2026-09-08T12:14:27.721Z
- Branch: main
- HEAD: 07124af6
- Git status: ?? scripts/generate-seo-keyword-authority-audit.mjs
- Node: v22.22.3
- Package manager: pnpm (repository packageManager: pnpm@10.19.0)

## Inventory counts

| Metric | Count | Evidence |
|---|---:|---|
| Astro files | 83 | recursive src/pages/**/*.astro discovery |
| Candidate public Astro files | 74 | excludes API and utility/internal templates |
| Static Astro templates | 72 | source route shape |
| Dynamic Astro templates | 11 | source route shape |
| Sitemap URLs | 274 | public/sitemap.xml |
| Blog articles | 97 | recursive src/content/blog discovery |
| Docs sources | 50 | recursive src/content/docs discovery |
| CSV keywords | 80 | full CSV parse |
| Keywords with target URL | 54 | CSV target_url |

## Initial diagnostic boundary

This is a source-level freeze. Rendered HTML fields (canonical, hreflang, final schema, generated dynamic instances, and live ranking data) remain separate validation work and are not inferred from source filenames. No content or route was rewritten during this baseline wave.

## Known repository constraints

- The repository mind records prior local SEO gates and repeatedly notes that live Search Console/CrUX/PSI evidence is unavailable from this environment.
- target_url is preserved as the seed owner mapping; any future change must record old owner → new owner → reason.
- Broad or excluded terms are not converted into doorway pages.

## Content coverage

- Blog source word count total: 214,298 words (source Markdown approximation).
- Duplicate titles, duplicate descriptions, exact cannibalization, orphan URLs, and final indexability require rendered URL/link-graph analysis; this baseline marks them pending rather than guessing.
