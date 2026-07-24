// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

/**
 * perf-css-defer — Astro integration that runs at build done and converts
 * the global stylesheet <link> tags from render-blocking `rel="stylesheet"`
 * to non-blocking `rel="preload" as="style" onload="this.onload=null;this.rel='stylesheet'"`
 * with a <noscript> fallback. Critical CSS (font-face, headings, body baseline)
 * is already inlined in BaseLayout.astro, so deferring the rest is safe and
 * drops LCP by ~300-500ms on mobile Slow 4G.
 *
 * Scope: ONLY files that match `/_astro/{BaseLayout,KernelLayout,index}.*.css`
 * — the global stylesheet bundles emitted by BaseLayout's <style is:global>.
 * Per-component CSS (cards, buttons, …) stays as render-blocking because
 * they're small and tied to a specific component rendering on the page.
 *
 * @csp-attr-pending — REPORTS-CSP-01 (2026-07-15, HIGH-07 / IP-08):
 *   This integration injects `onload="..."` inline event handlers into
 *   every rendered HTML file. Inline event handlers require
 *   `script-src-attr 'unsafe-inline'` in CSP. The 'unsafe-inline' is
 *   still present in render.yaml and public/_headers for this reason.
 *
 *   Phase 3 path: rewrite this integration to either:
 *     (a) keep `rel="stylesheet"` and accept the LCP regression, OR
 *     (b) inject a tiny <script src="/js/css-defer-helper.js"> BEFORE
 *         the <link> that finds the link via document.head.querySelector
 *         and swaps it on `load`. This requires the helper to be allowed
 *         by script-src 'self'.
 *
 *   Until Phase 3 lands, this is a known blocker for the strict-CSP goal.
 */
function perfCssDefer() {
  return {
    name: 'perf-css-defer',
    hooks: {
      'astro:build:done': async (/** @type {{ dir: URL }} */ { dir }) => {
        const distDir = dir.pathname.replace(/\/$/, '');
        // Walk all .html files in dist
        /** @type {(d: string) => string[]} */
        const walk = (d) => {
          /** @type {string[]} */
          const out = [];
          for (const entry of readdirSync(d, { withFileTypes: true })) {
            const p = join(d, entry.name);
            if (entry.isDirectory()) out.push(...walk(p));
            else if (extname(entry.name) === '.html') out.push(p);
          }
          return out;
        };
        const htmlFiles = walk(distDir);
        // Match global stylesheet bundles: BaseLayout, KernelLayout, index.
        // Per-component CSS (cards, buttons, …) is small and stays as
        // render-blocking. The hash part is mandatory in Astro's output.
        const pattern = /<link rel="stylesheet" href="\/_astro\/(BaseLayout|KernelLayout|index)\.([A-Za-z0-9_-]+)\.css">/g;
        let totalTransformed = 0;
        for (const file of htmlFiles) {
          const html = readFileSync(file, 'utf-8');
          let count = 0;
          let newHtml = html.replace(pattern, (full, name, hash) => {
            count++;
            const href = `/_astro/${name}.${hash}.css`;
            return (
              `<link rel="preload" href="${href}" as="style" data-css-defer>` +
              `<noscript><link rel="stylesheet" href="${href}"></noscript>`
            );
          });
          if (count > 0) {
            if (!newHtml.includes('/js/css-defer.js')) {
              newHtml = newHtml.replace('</head>', '<script src="/js/css-defer.js" defer></script></head>');
            }
            writeFileSync(file, newHtml, 'utf-8');
            totalTransformed += count;
          }
        }
        console.log(`[perf-css-defer] transformed ${totalTransformed} render-blocking <link> tag(s) across ${htmlFiles.length} HTML file(s)`);
      },
    },
  };
}

/**
 * astro.config.mjs — REPORTS-SEO-FOUNDATION (2026-07-07)
 *                  + KERNEL-AI-2026-07-14 (switched to @astrojs/node)
 *                  + KERNEL-AUDIT-2026-07-15-BATCH-10 (EXEC-16 output mode)
 *                  + KRN-016-2026-07-15 (explicit hybrid model documentation)
 *
 * HYBRID OUTPUT MODEL (KRN-016, 2026-07-15):
 *  - `output: 'static'` (explicit) + `adapter: node({ mode: 'standalone' })`.
 *    In Astro 6.4.6 the literal `output: 'hybrid'` option was REMOVED —
 *    using it now triggers "[config] Astro found issue(s) with your
 *    configuration: The output: 'hybrid' option has been removed. Use
 *    output: 'static' (the default) instead, which now behaves the same
 *    way." The default `output: 'static'` + adapter combination IS the
 *    hybrid model since Astro 5: every page prerenders by default, and
 *    individual routes opt in to SSR via `export const prerender = false`.
 *    So this file uses `'static'` and the comment below documents the
 *    hybrid model the project actually runs.
 *
 *  - All 190 pages in src/pages/** prerender to HTML at build time
 *    (default behavior, no per-page opt-in needed). They land in
 *    `dist/client/` and are served by the Node server as static files.
 *  - The 3 SSR routes opt in via `export const prerender = false`:
 *      1. /api/ai/chat  (src/pages/api/ai/chat.ts)   — KERNEL-AI-2026-07-14
 *      2. /api/lead     (src/pages/api/lead.ts)      — KERNEL-AI-2026-07-14
 *      3. /api/health   (src/pages/api/health.ts)    — KERNEL-AUDIT-...BATCH-10
 *    These stay server-side and ship in `dist/server/` with `entry.mjs`.
 *  - For static pages that need EXPLICIT declaration (e.g., to document
 *    intent in a code review, to override an outer `prerender = false`
 *    scope, or to migrate a route from SSR later), add
 *    `export const prerender = true` at the top of the .astro file.
 *    Not needed today — every static page relies on the default — but
 *    available for future use.
 *
 * PRESERVATION CONTRACT (REPORTS-SEC-01 + KERNEL-AI-2026-07-14 + KRN-016):
 *  - This change is structural/metadata only — no route flips from SSR
 *    to static or vice versa. The 3 SSR routes stay SSR; everything
 *    else stays static. `dist/client/` + `dist/server/` output identical
 *    bytes modulo per-build timestamps (sitemap.xml lastmod etc.).
 *  - `site`, `trailingSlash: 'always'`, `compressHTML`, `redirects`,
 *    `vite` config unchanged.
 *
 * DEPLOYMENT NOTE:
 *  - Render: `node({ mode: 'standalone' })` bundles Node server into
 *    `dist/server/entry.mjs`, serves static from `dist/client/`.
 *    Render `startCommand` is `node ./dist/server/entry.mjs`.
 *  - With output 'static' + adapter, the 3 SSR routes stay server-side
 *    and 190 prerendered pages ship as static. Identical runtime as
 *    before the KRN-016 change — only the documentation was tightened.
 */
export default defineConfig({
  site: 'https://brightai.site',
  // KRN-016: Astro 6.4.6 removed literal 'hybrid'. Output 'static' +
  // adapter IS the hybrid model since Astro 5 (every page prerenders
  // by default; individual routes opt in to SSR via `prerender = false`).
  // The header comment above documents the active hybrid config.
  output: 'static',
  trailingSlash: 'always',
  compressHTML: true,
  redirects: {
    '/report/': {
      status: 301,
      destination: '/trust/',
    },
  },
  build: {
    format: 'directory',
  },
  integrations: [
    perfCssDefer(),
    sitemap({
      i18n: {
        defaultLocale: 'ar',
        locales: {
          ar: 'ar-SA',
          en: 'en-SA',
        },
      },
      // REPORTS-SEO-FOUNDATION (2026-07-07):
      // ONLY /api/* is excluded from the sitemap. Every other built HTML
      // page is indexable, including /404.html and /design/* system pages.
      // (500.html is generated by Render hosting as a static fallback and
      // is excluded by the Astro integration itself.)
      filter: (page) => !page.includes('/api/'),
      // @astrojs/sitemap v3 ignores status-code pages (404/500) by default.
      // 404 MUST stay out of the sitemap — Google drops 404 entries from
      // the index and treating an error page as indexable URL dilutes
      // sitemap quality. The `dist/sitemap-0.xml` and `dist/sitemap.xml`
      // produced by this integration are post-processed by
      // `scripts/generate-sitemap-all-pages.mjs`, which overwrites both
      // files with a clean URL set and writes `sitemap-index.xml` that
      // points to the clean version.
      //
      // KERNEL-SEO-2026-07-14: With `@astrojs/node` adapter, Astro enters
      // hybrid mode and the sitemap integration stops auto-discovering
      // dynamic routes under /kernel/*. We add 10 explicit entries so all
      // kernel sub-pages (chat, audit, approvals, stats, connectors,
      // scenarios, policies, evidence, compliance, reports) end up in
      // sitemap.xml. /kernel/ and /kernel/offline/ are auto-detected
      // (the offline page is intentionally indexable — it's a real
      // marketing page, not a service-worker fallback).
      customPages: [
        'https://brightai.site/kernel/chat/',
        'https://brightai.site/kernel/audit/',
        'https://brightai.site/kernel/approvals/',
        'https://brightai.site/kernel/stats/',
        'https://brightai.site/kernel/connectors/',
        'https://brightai.site/kernel/scenarios/',
        'https://brightai.site/kernel/policies/',
        'https://brightai.site/kernel/evidence/',
        'https://brightai.site/kernel/compliance/',
        'https://brightai.site/kernel/reports/',
      ],
      changefreq: 'weekly',
      priority: 0.7,
      // BAI-IDX-03 (2026-07-25): lastmod is owned by
      // scripts/generate-sitemap-all-pages.mjs — it derives each page's
      // freshness from `git log -1 --format=%cs -- <relPath>` (with file
      // mtime as a last-resort fallback). We deliberately do NOT set
      // `lastmod: new Date()` here, because that would emit the build
      // timestamp as page freshness and lie to crawlers about when the
      // content actually changed. The post-processor overwrites the
      // adapter-laid sitemap files (dist/sitemap-0.xml,
      // dist/sitemap-index.xml) with the git-based content, so this
      // omission is safe — the adapter's interim output is discarded.
    }),
  ],
  // KERNEL-AI-2026-07-14: switched from @astrojs/vercel to @astrojs/node
  // to enable the new /api/lead endpoint (and existing /api/ai/chat) on
  // Render as a Node service. Standalone mode bundles the Node server
  // into dist/server/entry.mjs and serves static files from dist/client/.
  adapter: node({
    mode: 'standalone',
    // Static files are served from dist/client/ at request time.
    // No external image service (we use Astro's built-in pipeline).
  }),
  vite: {
    build: {
      cssMinify: true,
      // SEMRUSH-FIX-2026-07-08 (#135): explicit minify to ensure Astro
      // bundles JS through esbuild (which is the default but not guaranteed
      // after the Vercel adapter integration in REPORTS-SEC-01). Setting it
      // explicitly rules out the unminified-JS warning across all 172 pages.
      minify: 'esbuild',
    },
  },
});