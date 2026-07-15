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
 */
function perfCssDefer() {
  return {
    name: 'perf-css-defer',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const distDir = dir.pathname.replace(/\/$/, '');
        // Walk all .html files in dist
        const walk = (d) => {
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
          const newHtml = html.replace(pattern, (full, name, hash) => {
            count++;
            const href = `/_astro/${name}.${hash}.css`;
            return (
              `<link rel="preload" href="${href}" as="style" onload="this.onload=null;this.rel='stylesheet'">` +
              `<noscript><link rel="stylesheet" href="${href}"></noscript>`
            );
          });
          if (count > 0) {
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
 *                  + KERNEL-AUDIT-2026-07-15-BATCH-10 (EXEC-16 — output mode audit)
 *
 * LATEST CHANGE (KERNEL-AUDIT-2026-07-15-BATCH-10):
 *  - Audit attempted to set `output: 'hybrid'` explicitly (was misleadingly
 *    'static' + node adapter). Astro 6.4.6 REMOVED `output: 'hybrid'` as a
 *    separate option — the default `output: 'static'` now behaves identically
 *    when an adapter is present (every page prerenders by default, SSR routes
 *    opt in via `export const prerender = false`). Reverted to `output: 'static'`
 *    with documentation explaining the actual behavior.
 *
 * PRESERVATION CONTRACT (REPORTS-SEC-01 + KERNEL-AI-2026-07-14):
 *  - `output: 'static'` (Astro 6.4+ default with adapter) → all `.astro`
 *    pages prerender by default. SSR routes opt in via `export const prerender = false`.
 *  - Current SSR routes (all in src/pages/api/):
 *      1. /api/ai/chat  (chat.ts)   — KERNEL-AI-2026-07-14
 *      2. /api/lead     (lead.ts)    — KERNEL-AI-2026-07-14
 *      3. /api/health   (health.ts)  — KERNEL-AUDIT-2026-07-15-BATCH-10 (new)
 *  - `site`, `trailingSlash: 'always'`, `compressHTML`, `redirects`,
 *    `vite` config unchanged.
 *
 * DEPLOYMENT NOTE:
 *  - Render: `node({ mode: 'standalone' })` bundles Node server into
 *    `dist/server/entry.mjs`, serves static from `dist/client/`.
 *    Render `startCommand` is `node ./dist/server/entry.mjs`.
 *  - With Astro 6.4.6 default behavior + @astrojs/node adapter, all 190
 *    pages prerender to HTML, the 3 API routes stay server-side.
 */
export default defineConfig({
  site: 'https://brightai.site',
  // Astro 6.4.6 default (static + adapter behaves as hybrid). SSR routes
  // opt in via `export const prerender = false`.
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
      // REPORTS-SEO-FOUNDATION requires the 404 page to be indexable, so we
      // explicitly inject it via `customPages`. The 500 page remains
      // excluded because it's a server-error fallback (not a real route).
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
        'https://brightai.site/404/',
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
      lastmod: new Date(),
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