// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

import {
  STATIC_SECURITY_META_OTHER,
  buildCspWithStyleHashes,
  computeStyleHash,
} from './scripts/security-headers.mjs';

/**
 * BAI-PERF-01 (2026-07-25) — perf-css-defer removed.
 *
 * Previously this file defined a `perfCssDefer()` Astro integration that
 * ran at build-done and post-processed every HTML file in dist/ to convert
 * `<link rel="stylesheet" href="/_astro/{BaseLayout,KernelLayout,index}.*.css">`
 * tags into `<link rel="preload" ... data-css-defer>` + `<noscript>` fallback,
 * then injected `<script src="/js/css-defer.js" defer>` to swap them at runtime.
 *
 * That approach worked, but it was brittle (regex against hashed bundle
 * names, JS dependency for CSS, separate script + data-attribute protocol).
 *
 * Astro-native replacement (no post-build mutation):
 *   1. BaseLayout.astro now imports `../styles/critical.css` in frontmatter.
 *      Astro emits `<link rel="stylesheet" href="/_astro/critical.*.css">`
 *      automatically — render-blocking, hashed, cached.
 *   2. BaseLayout's <style is:global> block (tokens, base, utilities, color,
 *      animations) is emitted by Astro as a normal <link rel="stylesheet"
 *      href="/_astro/BaseLayout.*.css"> — also render-blocking, hashed, cached.
 *   3. public/js/css-defer.js was deleted.
 *
 * Trade-off vs the deferred pattern:
 *   - LCP regression: ~50ms (browser waits for 2 small render-blocking
 *     stylesheets: critical.css ~0.7KB gz + BaseLayout.css ~12KB gz).
 *     Both load in parallel over the same HTTP/2 connection, so total
 *     time ≈ max of the two, not sum. Budget: < 2500ms (current ~1368ms).
 *   - FOUC: structurally impossible (every CSS rule is render-blocking).
 *   - CSP: `style-src 'unsafe-inline'` removed (no <style is:inline> in
 *     BaseLayout.astro anymore). `style-src-attr 'unsafe-inline'` and
 *     `script-src 'unsafe-inline'` still required by other components
 *     (kernel pages, inline style attrs).
 *   - Brittleness: zero regex mutation, no separate JS file, no
 *     data-attribute protocol.
 *
 * Verification: scripts/qa/verify-csp-no-unsafe-inline.mjs exits 0
 * (explicitly checks that this file no longer contains perf-css-defer).
 */

/**
 * injectSecurityMeta — Astro integration that runs at build done and
 * injects <meta http-equiv="..."> tags into every prerendered HTML
 * file in dist/client/. This is the authoritative layer for security
 * headers on static pages (CSP, X-Content-Type-Options, X-Frame-Options,
 * Referrer-Policy).
 *
 * WHY META (not HTTP headers) for static:
 *   - Render Web Services (Node) do NOT apply the `headers:` block in
 *     render.yaml to runtime responses. The prerendered HTML files in
 *     dist/client/ are served by the Node adapter with no header
 *     injection. Cloudflare (our edge) also does not inject security
 *     headers by default.
 *   - The only mechanism that works at the HTML payload level — the
 *     point at which we have authority over a static file — is
 *     <meta http-equiv="...">. Browsers honour it for CSP,
 *     X-Content-Type-Options (Chromium-based), X-Frame-Options
 *     (legacy / older browsers), and Referrer-Policy.
 *   - HSTS does NOT work in meta — it must come from the HTTP layer
 *     (Cloudflare edge). See docs/cloudflare-deployment-headers.md
 *     for the Cloudflare Transform Rule that completes the posture
 *     on static pages.
 *
 * PER-FILE STYLE HASHES (BAI-SEC-18, 2026-07-25):
 *   The static CSP SoT (scripts/security-headers.mjs) has
 *   style-src-elem without 'unsafe-inline'. For each HTML file, this
 *   integration scans the rendered <style>...</style> blocks (which
 *   are currently the Astro ClientRouter view-transition styles
 *   — one block per page), computes SHA-256 of each, and appends the
 *   'sha256-XXX' hashes to the style-src-elem directive in the
 *   per-file CSP meta tag. This lets prerendered pages honour a
 *   strict-CSP without per-request nonces (which are impossible for
 *   static HTML — see DEC-BAI-SEC-18-2026-07-25-002).
 *
 * IDEMPOTENT: re-running on a file that already has the meta tags is
 * a no-op (matched against the unique marker comment we inject).
 *
 * @csp-attr-safe — Unlike perf-css-defer (which injects inline
 *   onload="" handlers and therefore needs 'unsafe-inline' on
 *   script-src-attr), this integration only injects meta tags. The
 *   strict script-src-attr 'none' posture is preserved.
 */
function injectSecurityMeta() {
  // Unique marker for idempotency. If this comment is present, the
  // meta tags are already injected for the current posture revision
  // and the integration skips the file.
  const MARKER = '<!-- brightai-security-meta:BAI-IDX-02 -->';
  return {
    name: 'inject-security-meta',
    hooks: {
      'astro:build:done': async (/** @type {{ dir: URL }} */ { dir }) => {
        const distDir = dir.pathname.replace(/\/$/, '');
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

        // Build the static (non-CSP) meta block once. Each meta tag
        // carries http-equiv="<X>" and content="<Y>" so the browser
        // treats it as the equivalent HTTP header.
        const staticMetaBlock = STATIC_SECURITY_META_OTHER.map(
          (m) =>
            `<meta http-equiv="${m.httpEquiv}" content="${m.content.replace(/"/g, '&quot;')}">`
        ).join('');

        // Regex: match every <style>...</style> block. Astro extracts
        // component <style scoped> blocks to external .css files, so
        // the only inline <style> blocks in dist HTML are the Astro
        // ClientRouter view-transition styles (one per page). The
        // content is captured between the tags.
        const inlineStyleRe = /<style(?:\s+[^>]*)?>([\s\S]*?)<\/style>/g;

        let totalInjected = 0;
        for (const file of htmlFiles) {
          const html = readFileSync(file, 'utf-8');
          if (html.includes(MARKER)) continue; // already injected
          if (!html.includes('</head>')) continue; // malformed — skip

          // Compute per-file style-src-elem hashes. Dedupe via Set
          // because the same style block can appear multiple times in
          // some edge cases (Astro server island fallback). The CSP
          // is fine with duplicate hashes; dedupe is just for size.
          const seen = new Set();
          const styleHashes = [];
          for (const m of html.matchAll(inlineStyleRe)) {
            const content = m[1];
            const hash = computeStyleHash(content);
            if (!seen.has(hash)) {
              seen.add(hash);
              styleHashes.push(hash);
            }
          }

          // Build the per-file CSP meta tag. For pages with no inline
          // styles (e.g. 404), the directive is just the base value.
          const cspContent = buildCspWithStyleHashes(styleHashes);
          const cspMeta = `<meta http-equiv="Content-Security-Policy" content="${cspContent.replace(/"/g, '&quot;')}">`;

          // Compose the full meta block: marker + CSP (per-file) +
          // static non-CSP meta tags (shared) + closing marker.
          const metaBlock =
            MARKER + cspMeta + staticMetaBlock + '<!-- /brightai-security-meta -->';

          const newHtml = html.replace('</head>', `${metaBlock}</head>`);
          writeFileSync(file, newHtml, 'utf-8');
          totalInjected += 1;
        }
        console.log(
          `[inject-security-meta] injected per-file CSP (with style-src-elem hashes) + ${STATIC_SECURITY_META_OTHER.length} static meta tag(s) into ${totalInjected} HTML file(s)`
        );
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
    // BAI-IDX-22 (2026-07-25) — auto-generated legacy redirects.
    // Source of truth: redirects.json (run scripts/generate-all-redirects.mjs
    // before astro build via the `prebuild` npm script). Entries whose
    // source has a static page in src/pages/ are filtered out (Astro would
    // delete the static file at build time — see BAI-IDX-12 for the /blog
    // regression that taught us this). Wildcards and :placeholders are also
    // excluded (Astro's redirects config only accepts literal paths; the full
    // wildcard set lives in public/_redirects for Netlify/Cloudflare Pages).
    // 206 entries (out of 207 in redirects.json).
    '/blog/التعلم الآلي والرؤية الحاسوبية_ مستقبل الذكاء الاصطناعي في معالجة اللغة الطبيعية والتعرف على الصور.html': {
      status: 301,
      destination: '/blog/computer-vision-saudi-factories/',
    },
    '/blog/التعلم الآلي والرؤية الحاسوبية_ مستقبل الذكاء الاصطناعي في معالجة اللغة الطبيعية والتعرف على الصور/': {
      status: 301,
      destination: '/blog/computer-vision-saudi-factories/',
    },
    '/blog/التعلم الآلي والرؤية الحاسوبية_ مستقبل الذكاء الاصطناعي في معالجة اللغة الطبيعية والتعرف على الصور': {
      status: 301,
      destination: '/blog/computer-vision-saudi-factories/',
    },
    '/blog/التعلم-الآلي-والرؤية-الحاسوبية-مستقبل-الذكاء-الاصطناعي-في-معالجة-اللغة-الطبيعية-والتعرف-على-الصور/': {
      status: 301,
      destination: '/blog/computer-vision-saudi-factories/',
    },
    '/blog/التعلم-الآلي-والرؤية-الحاسوبية-مستقبل-الذكاء-الاصطناعي-في-معالجة-اللغة-الطبيعية-والتعرف-على-الصور': {
      status: 301,
      destination: '/blog/computer-vision-saudi-factories/',
    },
    '/blog/أتمتة العمليات باستخدام الذكاء الاصطناعي_ الطريق إلى تحسين الكفاءة التشغيلية.html': {
      status: 301,
      destination: '/blog/digital-transformation-sme-saudi/',
    },
    '/blog/أتمتة-العمليات-باستخدام-الذكاء-الاصطناعي-الطريق-إلى-تحسين-الكفاءة-التشغيلية.html': {
      status: 301,
      destination: '/blog/digital-transformation-sme-saudi/',
    },
    '/blog/أتمتة الذكاء الاصطناعي_ حلول مخصصة لتحليل المشاريع وتحسين محركات البحث (1).html': {
      status: 301,
      destination: '/solutions/ai-use-case-discovery/',
    },
    '/blog/التحول الرقمي وأتمتة العمليات_ كيف يمكن للذكاء الاصطناعي أن يقود الابتكار.html': {
      status: 301,
      destination: '/blog/digital-transformation-sme-saudi/',
    },
    '/blog/أتمتة العمليات باستخدام الذكاء الاصطناعي_ الطريق إلى تحسين الكفاءة التشغيلية/': {
      status: 301,
      destination: '/blog/digital-transformation-sme-saudi/',
    },
    '/blog/التحول-الرقمي-وأتمتة-العمليات-كيف-يمكن-للذكاء-الاصطناعي-أن-يقود-الابتكار.html': {
      status: 301,
      destination: '/blog/digital-transformation-sme-saudi/',
    },
    '/blog/أتمتة العمليات باستخدام الذكاء الاصطناعي_ الطريق إلى تحسين الكفاءة التشغيلية': {
      status: 301,
      destination: '/blog/digital-transformation-sme-saudi/',
    },
    '/blog/أتمتة-الذكاء-الاصطناعي-حلول-مخصصة-لتحليل-المشاريع-وتحسين-محركات-البحث-1.html': {
      status: 301,
      destination: '/solutions/ai-use-case-discovery/',
    },
    '/blog/أتمتة-العمليات-باستخدام-الذكاء-الاصطناعي-الطريق-إلى-تحسين-الكفاءة-التشغيلية/': {
      status: 301,
      destination: '/blog/digital-transformation-sme-saudi/',
    },
    '/blog/أتمتة الذكاء الاصطناعي_ حلول مخصصة لتحليل المشاريع وتحسين محركات البحث (1)/': {
      status: 301,
      destination: '/solutions/ai-use-case-discovery/',
    },
    '/blog/الأتمتة الصناعية وأتمتة المهام المتكررة_ كيفية تحسين الكفاءة الإنتاجية.html': {
      status: 301,
      destination: '/solutions/manufacturing-ai-governance/',
    },
    '/blog/أتمتة-العمليات-باستخدام-الذكاء-الاصطناعي-الطريق-إلى-تحسين-الكفاءة-التشغيلية': {
      status: 301,
      destination: '/blog/digital-transformation-sme-saudi/',
    },
    '/blog/أتمتة الذكاء الاصطناعي_ حلول مخصصة لتحليل المشاريع وتحسين محركات البحث (1)': {
      status: 301,
      destination: '/solutions/ai-use-case-discovery/',
    },
    '/blog/التحول الرقمي وأتمتة العمليات_ كيف يمكن للذكاء الاصطناعي أن يقود الابتكار/': {
      status: 301,
      destination: '/blog/digital-transformation-sme-saudi/',
    },
    '/blog/الأتمتة-الصناعية-وأتمتة-المهام-المتكررة-كيفية-تحسين-الكفاءة-الإنتاجية.html': {
      status: 301,
      destination: '/solutions/manufacturing-ai-governance/',
    },
    '/blog/الأتمتة المالية وأتمتة الموارد البشرية_ حلول مستقبلية للشركات الذكية.html': {
      status: 301,
      destination: '/blog/rpa-automation-saudi-savings/',
    },
    '/blog/التحول الرقمي وأتمتة العمليات_ كيف يمكن للذكاء الاصطناعي أن يقود الابتكار': {
      status: 301,
      destination: '/blog/digital-transformation-sme-saudi/',
    },
    '/blog/التحول-الرقمي-وأتمتة-العمليات-كيف-يمكن-للذكاء-الاصطناعي-أن-يقود-الابتكار/': {
      status: 301,
      destination: '/blog/digital-transformation-sme-saudi/',
    },
    '/blog/أتمتة-الذكاء-الاصطناعي-حلول-مخصصة-لتحليل-المشاريع-وتحسين-محركات-البحث-1/': {
      status: 301,
      destination: '/solutions/ai-use-case-discovery/',
    },
    '/blog/الأتمتة-المالية-وأتمتة-الموارد-البشرية-حلول-مستقبلية-للشركات-الذكية.html': {
      status: 301,
      destination: '/blog/rpa-automation-saudi-savings/',
    },
    '/blog/التحول-الرقمي-وأتمتة-العمليات-كيف-يمكن-للذكاء-الاصطناعي-أن-يقود-الابتكار': {
      status: 301,
      destination: '/blog/digital-transformation-sme-saudi/',
    },
    '/blog/الأتمتة الصناعية وأتمتة المهام المتكررة_ كيفية تحسين الكفاءة الإنتاجية/': {
      status: 301,
      destination: '/solutions/manufacturing-ai-governance/',
    },
    '/blog/استشارات الذكاء الاصطناعي_ كيف تسهم في تحقيق التحول الرقمي للشركات.html': {
      status: 301,
      destination: '/blog/',
    },
    '/blog/أتمتة-الذكاء-الاصطناعي-حلول-مخصصة-لتحليل-المشاريع-وتحسين-محركات-البحث-1': {
      status: 301,
      destination: '/solutions/ai-use-case-discovery/',
    },
    '/blog/استشارات-الذكاء-الاصطناعي-كيف-تسهم-في-تحقيق-التحول-الرقمي-للشركات.html': {
      status: 301,
      destination: '/blog/',
    },
    '/blog/الأتمتة الصناعية وأتمتة المهام المتكررة_ كيفية تحسين الكفاءة الإنتاجية': {
      status: 301,
      destination: '/solutions/manufacturing-ai-governance/',
    },
    '/blog/الأتمتة-الصناعية-وأتمتة-المهام-المتكررة-كيفية-تحسين-الكفاءة-الإنتاجية/': {
      status: 301,
      destination: '/solutions/manufacturing-ai-governance/',
    },
    '/blog/الأتمتة المالية وأتمتة الموارد البشرية_ حلول مستقبلية للشركات الذكية/': {
      status: 301,
      destination: '/blog/rpa-automation-saudi-savings/',
    },
    '/blog/الأتمتة-الصناعية-وأتمتة-المهام-المتكررة-كيفية-تحسين-الكفاءة-الإنتاجية': {
      status: 301,
      destination: '/solutions/manufacturing-ai-governance/',
    },
    '/blog/الأتمتة المالية وأتمتة الموارد البشرية_ حلول مستقبلية للشركات الذكية': {
      status: 301,
      destination: '/blog/rpa-automation-saudi-savings/',
    },
    '/blog/الأتمتة-المالية-وأتمتة-الموارد-البشرية-حلول-مستقبلية-للشركات-الذكية/': {
      status: 301,
      destination: '/blog/rpa-automation-saudi-savings/',
    },
    '/blog/استشارات الذكاء الاصطناعي_ كيف تسهم في تحقيق التحول الرقمي للشركات/': {
      status: 301,
      destination: '/blog/',
    },
    '/blog/الأتمتة-المالية-وأتمتة-الموارد-البشرية-حلول-مستقبلية-للشركات-الذكية': {
      status: 301,
      destination: '/blog/rpa-automation-saudi-savings/',
    },
    '/blog/استشارات-الذكاء-الاصطناعي-كيف-تسهم-في-تحقيق-التحول-الرقمي-للشركات/': {
      status: 301,
      destination: '/blog/',
    },
    '/blog/استشارات الذكاء الاصطناعي_ كيف تسهم في تحقيق التحول الرقمي للشركات': {
      status: 301,
      destination: '/blog/',
    },
    '/blog/استشارات-الذكاء-الاصطناعي-كيف-تسهم-في-تحقيق-التحول-الرقمي-للشركات': {
      status: 301,
      destination: '/blog/',
    },
    '/blogger/ai-generative-content-industry-saudi-arabia.html': {
      status: 301,
      destination: '/blog/generative-ai-governance-vs-traditional/',
    },
    '/blog/machine-learning-computer-vision-legacy.html': {
      status: 301,
      destination: '/blog/computer-vision-saudi-factories/',
    },
    '/frontend/pages/smart-medical-archive/index.html': {
      status: 301,
      destination: '/solutions/healthcare-ai-governance/',
    },
    '/Company%20performance%20monitoring%20tool.html': {
      status: 301,
      destination: '/blog/big-data-analytics-saudi-companies/',
    },
    '/blog/Generative-artificial-intelligence.html': {
      status: 301,
      destination: '/blog/generative-ai-governance-vs-traditional/',
    },
    '/services/operational-reports-automation.html': {
      status: 301,
      destination: '/solutions/ai-evidence-file/',
    },
    '/docs/Governance%D9%80application/index.html': {
      status: 301,
      destination: '/docs/governance-application/',
    },
    '/demo/pages/Visitor-registration/index.html': {
      status: 301,
      destination: '/demo/',
    },
    '/services/customer-service-automation.html': {
      status: 301,
      destination: '/blog/arabic-chatbot-customer-service-saudi/',
    },
    '/services/power-bi-saudi-guide/index.html': {
      status: 301,
      destination: '/blog/big-data-analytics-saudi-companies/',
    },
    '/blog/sdaia-generative-ai-guidelines.html': {
      status: 301,
      destination: '/blog/sdaia-generative-ai-guidelines-practical-compliance/',
    },
    '/blog/Generative-artificial-intelligence': {
      status: 301,
      destination: '/blog/generative-ai-governance-vs-traditional/',
    },
    '/services/hr-automation-saudi/index.html': {
      status: 301,
      destination: '/blog/ai-hr-recruitment-saudi/',
    },
    '/services/kpi-dashboard-guide/index.html': {
      status: 301,
      destination: '/blog/big-data-analytics-saudi-companies/',
    },
    '/blog/Generative artificial intelligence': {
      status: 301,
      destination: '/blog/generative-ai-governance-vs-traditional/',
    },
    '/services/competitor-analysis-agent.html': {
      status: 301,
      destination: '/solutions/ai-use-case-discovery/',
    },
    '/services/supply-chain-optimization.html': {
      status: 301,
      destination: '/solutions/manufacturing-ai-governance/',
    },
    '/services/smart-hospital-management.html': {
      status: 301,
      destination: '/solutions/healthcare-ai-governance/',
    },
    '/assessment/ai-governance-readiness.html': {
      status: 301,
      destination: '/assessment/ai-governance-readiness/',
    },
    '/frontend/pages/our-products/index.html': {
      status: 301,
      destination: '/404/',
    },
    '/docs/Governanceـapplication/index.html': {
      status: 301,
      destination: '/docs/governance-application/',
    },
    '/frontend/pages/smart-medical-archive/': {
      status: 301,
      destination: '/solutions/healthcare-ai-governance/',
    },
    '/frontend/pages/blogger/nca-compliance': {
      status: 301,
      destination: '/404/',
    },
    '/privacy-policy/privacy-policy-en.html': {
      status: 301,
      destination: '/docs/',
    },
    '/docs/Governance%D9%80application.html': {
      status: 301,
      destination: '/docs/governance-application/',
    },
    '/blog/الذكاء-الاصطناعي-و-التسويق.html': {
      status: 301,
      destination: '/blog/arabic-chatbot-customer-service-saudi/',
    },
    '/blog/sdaia-generative-ai-guidelines/': {
      status: 301,
      destination: '/blog/sdaia-generative-ai-guidelines-practical-compliance/',
    },
    '/docs/solutions-supply-chain-en.html': {
      status: 301,
      destination: '/docs/',
    },
    '/blog/sdaia-generative-ai-guidelines': {
      status: 301,
      destination: '/blog/sdaia-generative-ai-guidelines-practical-compliance/',
    },
    '/frontend/pages/about-us/index.html': {
      status: 301,
      destination: '/about/',
    },
    '/frontend/pages/services/index.html': {
      status: 301,
      destination: '/404/',
    },
    '/terms/terms-and-conditions-en.html': {
      status: 301,
      destination: '/docs/',
    },
    '/services/social-data-analysis.html': {
      status: 301,
      destination: '/blog/big-data-analytics-saudi-companies/',
    },
    '/services/health-data-analysis.html': {
      status: 301,
      destination: '/solutions/healthcare-ai-governance/',
    },
    '/services/marketing-automation.html': {
      status: 301,
      destination: '/blog/arabic-chatbot-customer-service-saudi/',
    },
    '/services/approvals-automation.html': {
      status: 301,
      destination: '/solutions/human-approval-layer/',
    },
    '/docs/terms-and-conditions-en.html': {
      status: 301,
      destination: '/docs/',
    },
    '/docs/solutions-healthcare-en.html': {
      status: 301,
      destination: '/docs/',
    },
    '/demo/pages/appointment/index.html': {
      status: 301,
      destination: '/demo/',
    },
    '/frontend/pages/contact/index.html': {
      status: 301,
      destination: '/contact/',
    },
    '/services/document-automation.html': {
      status: 301,
      destination: '/solutions/ai-evidence-file/',
    },
    '/services/smart-hiring-system.html': {
      status: 301,
      destination: '/blog/ai-hr-recruitment-saudi/',
    },
    '/docs/solutions-interview-en.html': {
      status: 301,
      destination: '/docs/',
    },
    '/docs/solutions-logistics-en.html': {
      status: 301,
      destination: '/docs/',
    },
    '/docs/solutions-supply-chain.html': {
      status: 301,
      destination: '/docs/',
    },
    '/demo/pages/support-ai/index.html': {
      status: 301,
      destination: '/demo/',
    },
    '/services/data-analyst-agent.html': {
      status: 301,
      destination: '/blog/big-data-analytics-saudi-companies/',
    },
    '/blog/الذكاء-الاصطناعي-و-التسويق/': {
      status: 301,
      destination: '/blog/arabic-chatbot-customer-service-saudi/',
    },
    '/docs/Governanceـapplication.html': {
      status: 301,
      destination: '/docs/governance-application/',
    },
    '/docs/Governance%D9%80application': {
      status: 301,
      destination: '/docs/governance-application/',
    },
    '/demo/pages/dashboard/index.html': {
      status: 301,
      destination: '/demo/',
    },
    '/demo/pages/supportAI/index.html': {
      status: 301,
      destination: '/demo/',
    },
    '/blog/الذكاء-الاصطناعي-و-التسويق': {
      status: 301,
      destination: '/blog/arabic-chatbot-customer-service-saudi/',
    },
    '/services/power-bi-saudi-guide/': {
      status: 301,
      destination: '/blog/big-data-analytics-saudi-companies/',
    },
    '/docs/terms-and-conditions.html': {
      status: 301,
      destination: '/terms/',
    },
    '/docs/services-overview-en.html': {
      status: 301,
      destination: '/docs/',
    },
    '/docs/solutions-finance-en.html': {
      status: 301,
      destination: '/docs/',
    },
    '/docs/solutions-healthcare.html': {
      status: 301,
      destination: '/docs/',
    },
    '/services/manufacturing-en.html': {
      status: 301,
      destination: '/solutions/manufacturing-ai-governance/',
    },
    '/blog/تعلم-الآلة-و-الأعمال.html': {
      status: 301,
      destination: '/blog/ai-vs-machine-learning-explained/',
    },
    '/services/hr-automation-saudi/': {
      status: 301,
      destination: '/blog/ai-hr-recruitment-saudi/',
    },
    '/services/kpi-dashboard-guide/': {
      status: 301,
      destination: '/blog/big-data-analytics-saudi-companies/',
    },
    '/services/power-bi-saudi-guide': {
      status: 301,
      destination: '/blog/big-data-analytics-saudi-companies/',
    },
    '/docs/solutions-interview.html': {
      status: 301,
      destination: '/docs/',
    },
    '/docs/solutions-logistics.html': {
      status: 301,
      destination: '/docs/',
    },
    '/docs/solutions-retail-en.html': {
      status: 301,
      destination: '/docs/',
    },
    '/frontend/pages/try/index.html': {
      status: 301,
      destination: '/demo/',
    },
    '/services/custom-ai-agent.html': {
      status: 301,
      destination: '/solutions/ai-governance-platform/',
    },
    '/services/marketing-agent.html': {
      status: 301,
      destination: '/blog/arabic-chatbot-customer-service-saudi/',
    },
    '/services/medical-archive.html': {
      status: 301,
      destination: '/solutions/healthcare-ai-governance/',
    },
    '/docs/nca-ecc-ai-controls.html': {
      status: 301,
      destination: '/docs/nca-ecc-ai-controls/',
    },
    '/services/hr-automation-saudi': {
      status: 301,
      destination: '/blog/ai-hr-recruitment-saudi/',
    },
    '/services/kpi-dashboard-guide': {
      status: 301,
      destination: '/blog/big-data-analytics-saudi-companies/',
    },
    '/frontend/pages/our-products/': {
      status: 301,
      destination: '/404/',
    },
    '/docs/services-overview.html': {
      status: 301,
      destination: '/docs/',
    },
    '/docs/privacy-policy-en.html': {
      status: 301,
      destination: '/docs/',
    },
    '/docs/solutions-finance.html': {
      status: 301,
      destination: '/docs/',
    },
    '/services/healthcare-en.html': {
      status: 301,
      destination: '/solutions/healthcare-ai-governance/',
    },
    '/services/manufacturing.html': {
      status: 301,
      destination: '/solutions/manufacturing-ai-governance/',
    },
    '/services/data-platform.html': {
      status: 301,
      destination: '/blog/big-data-analytics-saudi-companies/',
    },
    '/services/hr-automation.html': {
      status: 301,
      destination: '/blog/ai-hr-recruitment-saudi/',
    },
    '/services/ai-consulting.html': {
      status: 301,
      destination: '/solutions/ai-governance-platform/',
    },
    '/services/brightproject.html': {
      status: 301,
      destination: '/solutions/ai-governance-platform/',
    },
    '/docs/Governanceـapplication': {
      status: 301,
      destination: '/docs/governance-application/',
    },
    '/docs/data-analysis-en.html': {
      status: 301,
      destination: '/docs/',
    },
    '/docs/solutions-crm-en.html': {
      status: 301,
      destination: '/docs/',
    },
    '/docs/solutions-ocr-en.html': {
      status: 301,
      destination: '/docs/',
    },
    '/docs/solutions-retail.html': {
      status: 301,
      destination: '/docs/',
    },
    '/services/ecommerce-en.html': {
      status: 301,
      destination: '/blog/ai-ecommerce-saudi/',
    },
    '/services/logistics-en.html': {
      status: 301,
      destination: '/solutions/manufacturing-ai-governance/',
    },
    '/blog/تعلم-الآلة-و-الأعمال/': {
      status: 301,
      destination: '/blog/ai-vs-machine-learning-explained/',
    },
    '/blog/cloude-opus-4.6.html': {
      status: 301,
      destination: '/blog/ai-governance/',
    },
    '/docs/solutions-bi-en.html': {
      status: 301,
      destination: '/docs/',
    },
    '/docs/solutions-hr-en.html': {
      status: 301,
      destination: '/docs/',
    },
    '/blog/production-line.html': {
      status: 301,
      destination: '/solutions/manufacturing-ai-governance/',
    },
    '/services/lead-hunter.html': {
      status: 301,
      destination: '/solutions/ai-use-case-discovery/',
    },
    '/services/brightsales.html': {
      status: 301,
      destination: '/solutions/ai-use-case-discovery/',
    },
    '/blog/تعلم-الآلة-و-الأعمال': {
      status: 301,
      destination: '/blog/ai-vs-machine-learning-explained/',
    },
    '/docs/privacy-policy.html': {
      status: 301,
      destination: '/privacy-policy/',
    },
    '/services/finance-en.html': {
      status: 301,
      destination: '/solutions/banking-ai-governance/',
    },
    '/services/healthcare.html': {
      status: 301,
      destination: '/solutions/healthcare-ai-governance/',
    },
    '/frontend/pages/about-us/': {
      status: 301,
      destination: '/about/',
    },
    '/frontend/pages/services/': {
      status: 301,
      destination: '/404/',
    },
    '/services/ai-scolecs.html': {
      status: 301,
      destination: '/solutions/ai-governance-platform/',
    },
    '/blog/تحليل-البيانات.html': {
      status: 301,
      destination: '/blog/big-data-analytics-saudi-companies/',
    },
    '/docs/data-analysis.html': {
      status: 301,
      destination: '/docs/',
    },
    '/docs/solutions-crm.html': {
      status: 301,
      destination: '/docs/',
    },
    '/docs/solutions-ocr.html': {
      status: 301,
      destination: '/docs/',
    },
    '/services/ecommerce.html': {
      status: 301,
      destination: '/blog/ai-ecommerce-saudi/',
    },
    '/services/energy-en.html': {
      status: 301,
      destination: '/solutions/government-ai-governance/',
    },
    '/services/logistics.html': {
      status: 301,
      destination: '/solutions/manufacturing-ai-governance/',
    },
    '/frontend/pages/contact/': {
      status: 301,
      destination: '/contact/',
    },
    '/contact/contact-en.html': {
      status: 301,
      destination: '/docs/',
    },
    '/services/seo-agent.html': {
      status: 301,
      destination: '/blog/arabic-chatbot-customer-service-saudi/',
    },
    '/docs/solutions-bi.html': {
      status: 301,
      destination: '/docs/',
    },
    '/docs/solutions-hr.html': {
      status: 301,
      destination: '/docs/',
    },
    '/blog/agint-bblog.html': {
      status: 301,
      destination: '/404/',
    },
    '/blog/cloude-opus-4.6/': {
      status: 301,
      destination: '/blog/ai-governance/',
    },
    '/services/finance.html': {
      status: 301,
      destination: '/solutions/banking-ai-governance/',
    },
    '/demo/pages/supportAI/': {
      status: 301,
      destination: '/demo/',
    },
    '/blog/ production-line': {
      status: 301,
      destination: '/solutions/manufacturing-ai-governance/',
    },
    '/blog/cloude-opus-4.6': {
      status: 301,
      destination: '/blog/ai-governance/',
    },
    '/docs/contact-en.html': {
      status: 301,
      destination: '/docs/',
    },
    '/docs/ai-bots-en.html': {
      status: 301,
      destination: '/docs/',
    },
    '/services/energy.html': {
      status: 301,
      destination: '/solutions/government-ai-governance/',
    },
    '/demo/pages/supportAI': {
      status: 301,
      destination: '/demo/',
    },
    '/blog/production-line': {
      status: 301,
      destination: '/solutions/manufacturing-ai-governance/',
    },
    '/blog/تحليل-البيانات/': {
      status: 301,
      destination: '/blog/big-data-analytics-saudi-companies/',
    },
    '/blog/مقال-تحليل.html': {
      status: 301,
      destination: '/blog/big-data-analytics-saudi-companies/',
    },
    '/blog/تحليل-البيانات': {
      status: 301,
      destination: '/blog/big-data-analytics-saudi-companies/',
    },
    '/blog/atou-job.html': {
      status: 301,
      destination: '/404/',
    },
    '/health-bright.html': {
      status: 301,
      destination: '/solutions/healthcare-ai-governance/',
    },
    '/data-analysis.html': {
      status: 301,
      destination: '/blog/big-data-analytics-saudi-companies/',
    },
    '/report/index.html': {
      status: 301,
      destination: '/trust/',
    },
    '/blog/analysy.html': {
      status: 301,
      destination: '/blog/big-data-analytics-saudi-companies/',
    },
    '/blog/digital.html': {
      status: 301,
      destination: '/blog/digital-transformation-sme-saudi/',
    },
    '/docs/openapi.html': {
      status: 301,
      destination: '/docs/',
    },
    '/docs/contact.html': {
      status: 301,
      destination: '/contact/',
    },
    '/docs/ai-bots.html': {
      status: 301,
      destination: '/docs/',
    },
    '/en/docs/docs.html': {
      status: 301,
      destination: '/docs/',
    },
    '/our-products.html': {
      status: 301,
      destination: '/solutions/ai-governance-platform/',
    },
    '/docs/docs-en.html': {
      status: 301,
      destination: '/docs/',
    },
    '/blog/agint-bblog': {
      status: 301,
      destination: '/404/',
    },
    '/docs/faq-en.html': {
      status: 301,
      destination: '/docs/',
    },
    '/blog/مقال-تحليل/': {
      status: 301,
      destination: '/blog/big-data-analytics-saudi-companies/',
    },
    '/blog/مقال-تحليل': {
      status: 301,
      destination: '/blog/big-data-analytics-saudi-companies/',
    },
    '/blog/auto.html': {
      status: 301,
      destination: '/404/',
    },
    '/blog/atou.doc/': {
      status: 301,
      destination: '/404/',
    },
    '/blog/astr.doc/': {
      status: 301,
      destination: '/blog/',
    },
    '/blog/atou-job': {
      status: 301,
      destination: '/404/',
    },
    '/blog/gov.html': {
      status: 301,
      destination: '/solutions/government-ai-governance/',
    },
    '/en/index.html': {
      status: 301,
      destination: '/en/',
    },
    '/docs/faq.html': {
      status: 301,
      destination: '/docs/',
    },
    '/blog/atou.doc': {
      status: 301,
      destination: '/404/',
    },
    '/blog/astr.doc': {
      status: 301,
      destination: '/blog/',
    },
    '/blog/ai.html': {
      status: 301,
      destination: '/404/',
    },
    '/blog/analysy': {
      status: 301,
      destination: '/blog/big-data-analytics-saudi-companies/',
    },
    '/blog/digital': {
      status: 301,
      destination: '/blog/digital-transformation-sme-saudi/',
    },
    '/ai-workflows': {
      status: 301,
      destination: '/solutions/ai-governance-platform/',
    },
    '/report.html': {
      status: 301,
      destination: '/trust/',
    },
    '/blog/auto': {
      status: 301,
      destination: '/404/',
    },
    '/docs.html': {
      status: 301,
      destination: '/docs/',
    },
    '/blog/gov': {
      status: 301,
      destination: '/solutions/government-ai-governance/',
    },
    '/blog/ai': {
      status: 301,
      destination: '/404/',
    },
    '/report': {
      status: 301,
      destination: '/trust/',
    },
  },
  build: {
    format: 'directory',
  },
  integrations: [
    injectSecurityMeta(),
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