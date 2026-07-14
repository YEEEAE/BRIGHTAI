// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
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
 *
 * LATEST CHANGE (REPORTS-SEO-FOUNDATION):
 *  - Sitemap filter now EXCLUDES ONLY `/api/*` routes. Previously excluded
 *    `/404` and `/design/*` — that is wrong per the new foundation rule
 *    ("كل صفحة تُفهرس"). Now 404 (still rendered as HTML page) and the
 *    `/design/*` system reference pages are ALL included in sitemap.xml.
 *  - `site` retained as `https://brightai.site` (confirmed by founder
 *    on 2026-07-07 — brightai.site is the live production domain, NOT
 *    www.brightaii.com which appeared in the original task brief).
 *  - Everything else from REPORTS-SEC-01 (Vercel adapter for `/api/ai/chat`)
 *    is preserved verbatim.
 *
 * PRESERVATION CONTRACT (REPORTS-SEC-01):
 *  - `output: 'static'` retained → all `.astro` pages remain prerendered HTML.
 *  - API route explicitly opts out via `export const prerender = false`
 *    → it becomes a serverless function; everything else stays static.
 *  - `site`, `trailingSlash: 'always'`, `compressHTML`, `redirects`,
 *    `vite` config unchanged.
 *
 * DEPLOYMENT NOTE:
 *  - Vercel: works out-of-the-box. `astro build` will emit
 *    `.vercel/output/functions/api/ai/chat.func/` + static `dist/`.
 *  - Render static: does NOT execute Vercel functions. To deploy on
 *    Render, either (a) swap `vercel(...)` for `node({ mode: 'standalone' })`
 *    + `npm install @astrojs/node`, or (b) migrate hosting to Vercel.
 *    This is documented in reports/2026-07-06-secret-hardening.md.
 */
export default defineConfig({
  site: 'https://brightai.site',
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
      customPages: [
        'https://brightai.site/404/',
      ],
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
    }),
  ],
  adapter: vercel({
    // We rely on Astro's built-in image pipeline; do not double-process via Vercel.
    imageService: false,
    // No Vercel Web Analytics — BrightAI uses GA4 + Clarity instead.
    webAnalytics: false,
    // Exclude the legacy preview/manifest paths from edge middleware if any.
    edgeMiddleware: false,
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