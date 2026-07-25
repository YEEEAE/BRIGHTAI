/**
 * src/server/deny-list.mjs
 *
 * BAI-SEC-10 (2026-07-25) — defense in depth against /frontend/** style
 * surface leaks. هذا الملف هو المصدر الوحيد لقائمة الممنوعات اللي
 * تتنفذ في طبقة الخادم (Node standalone) — قبل أي قراءة من القرص.
 *
 * Why a deny-list at the Node layer (and not just .dockerignore / build
 * filter):
 *   1. .dockerignore / build filter تمنع الملف من الوصول إلى dist/.
 *   2. لكن لو revert قديم أو build error أو accident أنتج dist/client/frontend/
 *      أو dist/client/client/ (we have seen this in production on 2026-07-25),
 *      الـ Node server يخدم أي ملف موجود في dist/client/ كأنه static — وبدون
 *      هذا الـ deny-list يطلع 200 مع كود مصدري حساس.
 *   3. deny-list على مستوى الـ handler يضمن إن أي طلب يطابق النمط → 404 فوراً،
 *      قبل أي fs.read / createReadStream، حتى لو الملف موجود فعلياً.
 *
 * Why 404 (not 403):
 *   - 403 يؤكد الوجود (Forbidden = أنا أعرف إنك سألت، بس ممنوع).
 *   - 404 ينكر الوجود (Not Found = ما عندي هذا). المهاجم ما يقدر يفرق بين
 *     "محجوب عمداً" و"موجود أصلاً" — يقلل الـ surface area للاستكشاف.
 *
 * Pattern syntax:
 *   - كل عنصر = RegExp يختبر على الـ URL path فقط (بعد strip query/hash).
 *   - null patterns (matching nothing) = allow by default.
 *   - نحتفظ بالنمط كـ string + compile إلى RegExp وقت التحميل.
 *
 * Public surface (the one in public/ and src/pages/) MUST NOT match any
 * pattern here. قائمة المسارات العامة محفوظة في
 * scripts/verify-deployment-surface.mjs (sample public checks).
 *
 * The compiled module lives at `dist/server/_deny-list.mjs` after build —
 * it is a sibling of `dist/server/entry.mjs`. The patcher
 * `scripts/patch-server-entry.mjs` rewrites `entry.mjs` to wrap the
 * exported `handler` with `withDenyList(astroHandler)`.
 *
 * No external dependencies. No runtime state.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * DENY_LIST_PATTERNS — the canonical list. Each entry is a string regex
 * source (we store as source + flags for stability + debuggability).
 *
 * Categories (in order of criticality):
 *   A. Backend source code that was historically leaked:
 *      /frontend/*  — Express server (chat, gemini, groq, demo, kernel, aiGateway, db)
 *      /client/*    — public/ symlink to a Vite-era client bundle (leaked)
 *      /server/*    — would be Astro server bundle (leaked, only if mis-deployed)
 *   B. Build + repo metadata that should never be served:
 *      /scripts/, /src/, /packages/, /apps/, /.agents/, /report/
 *   C. Sensitive config files at the root:
 *      /.env*, /package.json, /astro.config.mjs, /render.yaml,
 *      /Dockerfile, /docker-compose.yml, /AGENTS.md, /CLAUDE.md,
 *      /tsconfig.json, /pnpm-lock.yaml
 *   D. Legacy client metadata (decoy paths from Next.js era):
 *      /_next/, /next.config.*  (defensive — we do not use Next.js)
 *   E. Astro internals (private, do not expose):
 *      /_astro-internals/
 *
 * The pattern source uses ^/... and (\\/|$) to anchor the prefix — we
 * match /frontend/ AND /frontend-anything AND /frontend (no trailing).
 */
export const DENY_LIST_PATTERNS = [
  // ─── A. Backend source / historical leaks (BAI-SEC-10, 2026-07-25) ───
  '^/frontend(/|$)',
  '^/client(/|$)',
  '^/server(/|$)',

  // ─── B. Repo metadata that must never be served ───
  '^/scripts(/|$)',
  '^/src(/|$)',
  '^/packages(/|$)',
  '^/apps(/|$)',
  '^/\\.agents(/|$)',
  // BAI-IDX-22 (2026-07-25): /report is a legacy URL that the runtime
  // middleware (src/middleware.ts → src/lib/legacy-redirects.mjs) 301s
  // to /trust/. The old pattern `^/report(/|$)` blocked /report and
  // /report/ before the middleware could see them, sending both to 404.
  // The narrow pattern `^/report/.+` only blocks paths WITH content
  // after /report/ — i.e. leaked source files like
  // /report/2026-06-29-some-file.md. The bare /report and /report/ paths
  // fall through to the legacy-redirect middleware and get a 301.
  '^/report/.+',
  '^/kernel(/|$)',          // block /kernel/* source-style access (kernel/ public marketing handled by prerender, this blocks /kernel/foo.js if any)

  // ─── C. Sensitive config files at the root ───
  '^/\\.env(\\.[a-z0-9]+)?$',
  '^/package\\.json$',
  '^/package-lock\\.json$',
  '^/pnpm-lock\\.yaml$',
  '^/pnpm-workspace\\.yaml$',
  '^/astro\\.config\\.mjs$',
  '^/render\\.yaml$',
  '^/Dockerfile$',
  '^/docker-compose\\.yml$',
  '^/AGENTS\\.md$',
  '^/CLAUDE\\.md$',
  '^/tsconfig\\.json$',
  '^/opencode\\.json$',
  '^/\\.clinerules(/|$)',
  '^/\\.opencode(/|$)',
  '^/\\.qoder(/|$)',
  '^/\\.hermes(/|$)',
  '^/\\.roo(/|$)',

  // ─── D. Legacy Next.js / Vite client metadata (defensive) ───
  '^/_next(/|$)',
  '^/next\\.config\\.',
  '^/vite\\.config\\.',

  // ─── E. Astro internals (defensive) ───
  '^/_astro-internals(/|$)',
];

// Compile once at module load.
const COMPILED = DENY_LIST_PATTERNS.map((source) => new RegExp(source, 'i'));

/**
 * Test whether a URL path should be denied.
 *
 * @param {string} url — the raw request URL (may include query/hash).
 * @returns {boolean} — true if the URL matches any deny pattern.
 */
export function isDenied(url) {
  if (typeof url !== 'string' || url.length === 0) return false;
  // Strip query + hash. Keep the leading slash.
  const path = url.split('?')[0].split('#')[0];
  for (const re of COMPILED) {
    if (re.test(path)) return true;
  }
  return false;
}

/**
 * withDenyList(handler) — wrap an Astro Node handler so that any request
 * whose URL matches the deny-list is short-circuited to a 404 response
 * before the handler ever reads a file from disk.
 *
 * The wrapper is shape-compatible with the @astrojs/node handler:
 *   (req, res, next) => Promise<void>
 *
 * It:
 *   1. Reads req.url (Node IncomingMessage).
 *   2. Calls isDenied(req.url). If true → write 404 + safety headers + end.
 *   3. Otherwise → forwards to the original handler unchanged.
 *
 * Errors inside the deny check (e.g. malformed req) fall through to the
 * original handler — fail-OPEN, because false-positive 404s on real
 * pages are worse than a transient over-serve.
 *
 * @param {(req: any, res: any, next?: any) => any} handler — the Astro handler to wrap.
 * @returns {(req: any, res: any, next?: any) => any} — the wrapped handler.
 */
export function withDenyList(handler) {
  if (typeof handler !== 'function') {
    throw new TypeError('withDenyList(handler) requires a function handler');
  }
  return function deniedHandler(req, res, next) {
    try {
      const url = req && typeof req.url === 'string' ? req.url : '/';
      if (isDenied(url)) {
        // Set a hardened response. We do NOT echo the URL or path to
        // avoid leaking which pattern matched (defense in depth).
        if (res && typeof res.setHeader === 'function') {
          try {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
            res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          } catch {
            // Ignore header write errors (e.g. headers already sent)
          }
        }
        if (res && typeof res.statusCode !== 'undefined') {
          try { res.statusCode = 404; } catch { /* ignore */ }
        }
        if (res && typeof res.end === 'function') {
          try { res.end('Not Found'); } catch { /* ignore */ }
        }
        return;
      }
    } catch {
      // Any internal error → fall through to the original handler. Better
      // to serve a real page than to 404 spuriously.
    }
    return handler(req, res, next);
  };
}

/**
 * Self-check — verifies the deny-list catches a curated set of known-leak
 * paths and does NOT match a curated set of public paths. Used by
 * `scripts/patch-server-entry.mjs` after writing the module to
 * `dist/server/`, and as an entrypoint for ad-hoc manual validation.
 *
 * Exit code 0 = pass. Exit code 1 = a known-bad path matched allow OR a
 * known-good path matched deny.
 *
 * @param {string} [thisFile] — path to the file that should contain DENY_LIST_PATTERNS.
 *   If provided, used only for error reporting — the function works without it.
 * @returns {{ok: boolean, badMatches: string[], goodMatches: string[]}}
 */
export function selfCheck() {
  const SHOULD_DENY = [
    '/frontend/server.js',
    '/frontend/config.js',
    '/frontend/db/init.js',
    '/frontend/routes/chat.js',
    '/frontend/middleware/productionSecrets.js',
    '/frontend/middleware/rateLimiter.js',
    '/client/index.html',
    '/server/entry.mjs',
    '/package.json',
    '/.env',
    '/.env.local',
    '/.env.production',
    '/.agents/brain.md',
    '/.agents/skills/README.md',
    '/astro.config.mjs',
    '/render.yaml',
    '/AGENTS.md',
    '/CLAUDE.md',
    '/scripts/',
    '/src/',
    '/packages/',
    '/apps/',
    // BAI-IDX-22: /report/ is no longer denied — the runtime middleware
    // 301s it to /trust/. Only paths with content after /report/ are
    // denied (e.g. a leaked source file).
    '/report/2026-06-29-some-file.md',
    '/Dockerfile',
    '/docker-compose.yml',
    '/tsconfig.json',
    '/pnpm-lock.yaml',
    '/_next/static/foo.js',
    '/next.config.mjs',
  ];
  const SHOULD_ALLOW = [
    '/',
    '/about/',
    '/services/',
    '/pricing/',
    '/contact/',
    '/blog/',
    '/docs/',
    '/solutions/ai-governance-platform/',
    '/solutions/banking-ai-governance/riyadh/',
    '/en/privacy-policy/',
    '/blog/big-data-analytics-saudi-companies/',
    '/robots.txt',
    '/sitemap.xml',
    '/sitemap-images.xml',
    '/sitemap-index.xml',
    '/favicon.svg',
    '/icons.svg',
    '/manifest.webmanifest',
    '/llms.txt',
    '/llms-full.txt',
    '/humans.txt',
    '/e158df443f2742d281a02c4aeecb4a60.txt',
    '/_astro/critical.1234.css',
    '/_astro/ClientRouter.foo.js',
    '/js/font-async-loader.js',
    '/assets/images/og/brightai-og-1200x630.png',
    '/assets/fonts/TheYearofTheCamel-Medium.woff2',
    '/fonts/ibm-plex-sans-arabic.woff2',
    '/api/health/',
    '/api/ai/chat/',
    '/api/lead/',
    '/api/csrf-token',
    '/api/csp-report',
  ];

  const badMatches = SHOULD_DENY.filter((p) => !isDenied(p));
  const goodMatches = SHOULD_ALLOW.filter((p) => isDenied(p));

  return { ok: badMatches.length === 0 && goodMatches.length === 0, badMatches, goodMatches };
}

// CLI: `node src/server/deny-list.mjs` → run selfCheck and exit.
if (import.meta.url === `file://${process.argv[1]}`) {
  const result = selfCheck();
  if (result.ok) {
    console.log('[deny-list] self-check passed: all known-bad paths denied, all known-good paths allowed');
    process.exit(0);
  } else {
    if (result.badMatches.length > 0) {
      console.error('[deny-list] FAILED: these known-bad paths were NOT denied:');
      for (const p of result.badMatches) console.error('  - ' + p);
    }
    if (result.goodMatches.length > 0) {
      console.error('[deny-list] FAILED: these known-good paths WERE denied:');
      for (const p of result.goodMatches) console.error('  - ' + p);
    }
    process.exit(1);
  }
}
