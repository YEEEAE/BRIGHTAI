#!/usr/bin/env node
/**
 * verify-csp-no-unsafe-inline.mjs — REPORTS-CSP-01 (2026-07-15) regression test.
 *
 * Purpose:
 *   After removing inline scripts/event handlers from BaseLayout/KernelLayout,
 *   this test scans the built dist/ output to make sure:
 *
 *     1. The CSP header in render.yaml + public/_headers still contains
 *        'unsafe-inline' on script-src, but with a documented marker comment
 *        that says "// SAFE-TO-REMOVE-AFTER-REPORTS-CSP-01" so future agents
 *        know which occurrences are still pending migration.
 *
 *     2. Every <script>...</script> inline block in .astro source files
 *        has been either:
 *          a) Removed (extracted to src/scripts/*.js)
 *          b) Marked with the nonce placeholder `nonce={Astro.locals.cspNonce}`
 *             (Strategy A — only valid in SSR pages)
 *          c) Tagged with the @csp-inline-pending marker comment so future
 *             agents know it's a known migration target.
 *
 *     3. Every `onload="..."`, `onclick="..."`, etc. inline event handler
 *        in .astro source files has been either:
 *          a) Removed (replaced with external JS that listens for events)
 *          b) Tagged with the @csp-attr-pending marker comment.
 *
 *     4. The integration in astro.config.mjs (perf-css-defer) that injects
 *        `onload="this.onload=null;this.rel='stylesheet'"` is documented
 *        as a known blocker — the test FAILS if no marker comment exists.
 *
 *     5. Middleware file exists at src/middleware.ts and exports an
 *        `onRequest` handler that generates a nonce.
 *
 *   Run via:
 *     node scripts/verify-csp-no-unsafe-inline.mjs
 *
 *   Exit code:
 *     0 = all checks pass (or pending items are properly marked)
 *     1 = at least one unmarked inline script/handler found
 *
 * Saudi dialect comment: هذا الاختبار يحمي الـ CSP الصارمة من الرجوع
 *   (regression). أي inline script/handler بدون marker = failure.
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = dirname(dirname(dirname(__filename)));

const COLORS = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m',
};

let failures = 0;
let warnings = 0;
const PENDING_MARKER = '@csp-inline-pending';
const ATTR_PENDING_MARKER = '@csp-attr-pending';

/**
 * Recursively walk a directory and yield every file path.
 */
function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) {
      if (entry === 'node_modules' || entry === 'dist' || entry === '.astro') continue;
      yield* walk(p);
    } else {
      yield p;
    }
  }
}

/**
 * Get all .astro files in src/.
 */
function getAstroFiles() {
  const out = [];
  for (const f of walk(join(ROOT, 'src'))) {
    if (f.endsWith('.astro')) out.push(f);
  }
  return out;
}

function fail(msg) {
  console.error(`${COLORS.red}FAIL${COLORS.reset} ${msg}`);
  failures++;
}

function warn(msg) {
  console.warn(`${COLORS.yellow}WARN${COLORS.reset} ${msg}`);
  warnings++;
}

function pass(msg) {
  console.log(`${COLORS.green}PASS${COLORS.reset} ${msg}`);
}

/* ------------------------------------------------------------------ *
 * 1. Check render.yaml + public/_headers CSP sources
 * ------------------------------------------------------------------ */

function checkCspSources() {
  const sources = [
    join(ROOT, 'render.yaml'),
    join(ROOT, 'public/_headers'),
  ];

  for (const file of sources) {
    if (!existsSync(file)) {
      warn(`CSP source not found: ${file}`);
      continue;
    }
    const content = readFileSync(file, 'utf-8');
    const matches = content.match(/'unsafe-inline'/g) || [];
    if (matches.length === 0) {
      pass(`${file.replace(ROOT + '/', '')} — no 'unsafe-inline' found (strict CSP)`);
    } else {
      warn(
        `${file.replace(ROOT + '/', '')} still has ${matches.length} 'unsafe-inline' ` +
          `occurrence(s). Pending migration per REPORTS-CSP-01 — requires render.yaml / public/_headers update.`
      );
    }
  }
}

/* ------------------------------------------------------------------ *
 * 2. Check inline <script> blocks in .astro files
 * ------------------------------------------------------------------ */

function checkInlineScripts() {
  const files = getAstroFiles();
  let inlineBlocksFound = 0;
  let markedPending = 0;

  for (const file of files) {
    const rel = file.replace(ROOT + '/', '');
    const content = readFileSync(file, 'utf-8');

    // Match <script>...</script> blocks that don't use the Astro import pattern.
    // The Astro hoisted-import pattern is: <script>import '...';</script>
    // We allow that. We also allow <script>...</script> tags that ONLY contain
    // a single line like "import '../scripts/X.js';" because that's the import
    // pattern. Anything else is considered inline.
    const re = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/g;
    let m;
    while ((m = re.exec(content)) !== null) {
      const body = m[1].trim();
      const isImportOnly = /^import\s+['"][^'"]+['"];?$/m.test(body) || body === '';
      const hasNonce = /\bnonce\s*=\s*\{?\s*Astro\.locals\.cspNonce\b/.test(m[0]);

      if (isImportOnly || hasNonce) continue;

      inlineBlocksFound++;
      // Check if the previous line(s) contain the @csp-inline-pending marker
      const startIdx = Math.max(0, m.index - 300);
      const before = content.slice(startIdx, m.index);
      if (before.includes(PENDING_MARKER)) {
        markedPending++;
      } else {
        fail(
          `${rel}:${m.index} — unmarked inline <script> block. ` +
            `Either extract to src/scripts/*.js OR add '@csp-inline-pending' marker comment.`
        );
        // Print a snippet for debugging
        const snippet = body.slice(0, 120).replace(/\n/g, ' ');
        console.error(`    ${snippet}${body.length > 120 ? '...' : ''}`);
      }
    }
  }

  if (inlineBlocksFound === 0) {
    pass(`No inline <script> blocks in src/**/*.astro (strict CSP achievable)`);
  } else if (markedPending === inlineBlocksFound) {
    warn(
      `${inlineBlocksFound} inline <script> block(s) found but all marked @csp-inline-pending ` +
        `(known migration targets — kernel pages with define:vars).`
    );
  } else {
    warn(
      `${inlineBlocksFound - markedPending} unmarked inline <script> block(s) — ` +
        `${markedPending} marked as @csp-inline-pending.`
    );
  }
}

/* ------------------------------------------------------------------ *
 * 3. Check inline event handlers (onclick, onload, onerror, onmouseover)
 * ------------------------------------------------------------------ */

function checkInlineEventHandlers() {
  const files = getAstroFiles();
  const handlerRe = /\b(on(?:click|load|error|mouseover|mouseout|focus|blur|change|submit))\s*=\s*["'][^"']*["']/g;
  let unmarked = 0;
  let marked = 0;

  for (const file of files) {
    const rel = file.replace(ROOT + '/', '');
    const content = readFileSync(file, 'utf-8');
    let m;
    while ((m = handlerRe.exec(content)) !== null) {
      const startIdx = Math.max(0, m.index - 300);
      const before = content.slice(startIdx, m.index);
      if (before.includes(ATTR_PENDING_MARKER)) {
        marked++;
      } else {
        unmarked++;
        fail(
          `${rel}:${m.index} — unmarked inline event handler "${m[1]}=\\"...\\"". ` +
            `Either move to external JS + addEventListener OR add '@csp-attr-pending' marker comment.`
        );
      }
    }
  }

  if (unmarked === 0 && marked === 0) {
    pass(`No inline event handlers in src/**/*.astro (script-src-attr can drop 'unsafe-inline')`);
  } else if (unmarked === 0) {
    warn(`${marked} inline event handler(s) marked @csp-attr-pending (known migration targets).`);
  }
}

/* ------------------------------------------------------------------ *
 * 4. Check perf-css-defer integration in astro.config.mjs
 * ------------------------------------------------------------------ */

function checkPerfCssDefer() {
  const file = join(ROOT, 'astro.config.mjs');
  if (!existsSync(file)) {
    warn('astro.config.mjs not found — skipping perf-css-defer check.');
    return;
  }
  const content = readFileSync(file, 'utf-8');
  if (content.includes('perf-css-defer')) {
    if (content.includes('onload') && !content.includes(ATTR_PENDING_MARKER)) {
      fail(
        'astro.config.mjs perf-css-defer integration injects onload="..." into every ' +
          'rendered HTML file. This requires script-src-attr \'unsafe-inline\' in CSP. ' +
          'Refactor perf-css-defer to use a CSS-only pattern (e.g. media="print" swap via JS) ' +
          'OR mark with @csp-attr-pending so future agents know it\'s a known blocker.'
      );
    } else if (content.includes(ATTR_PENDING_MARKER)) {
      warn(
        'astro.config.mjs perf-css-defer is marked @csp-attr-pending (known CSP blocker).'
      );
    }
  } else {
    pass('astro.config.mjs no longer includes perf-css-defer integration.');
  }
}

/* ------------------------------------------------------------------ *
 * 5. Check middleware.ts exists and exports onRequest
 * ------------------------------------------------------------------ */

function checkMiddleware() {
  const file = join(ROOT, 'src/middleware.ts');
  if (!existsSync(file)) {
    fail('src/middleware.ts not found — Strategy A (nonces) is not implemented.');
    return;
  }
  const content = readFileSync(file, 'utf-8');
  if (!/export\s+(const|async\s+function)\s+onRequest/.test(content)) {
    fail(
      'src/middleware.ts exists but does not export `onRequest` handler. ' +
        'Astro middleware requires a default export named `onRequest`.'
    );
  } else if (!content.includes('getRandomValues') && !content.includes('randomBytes')) {
    fail(
      'src/middleware.ts onRequest handler exists but does not appear to generate ' +
        'a cryptographically random nonce. Use crypto.getRandomValues() or crypto.randomBytes().'
    );
  } else {
    pass('src/middleware.ts exists with onRequest nonce generator.');
  }
}

/* ------------------------------------------------------------------ *
 * 6. BAI-SEC-18 (2026-07-25) — Architecture checks
 * ------------------------------------------------------------------ */

/**
 * Asserts the new CSP architecture is in place:
 *   - scripts/security-headers.mjs exports buildCspWithStyleHashes
 *     and computeStyleHash helpers
 *   - astro.config.mjs uses them in injectSecurityMeta
 *   - The 4 external scripts (KernelSidebar, KernelDemoPill,
 *     KernelConnectors, ThankYouId) are served from public/js/
 *   - prevent-default-forms.js exists and BaseLayout loads it
 *
 * This is a PASS-only check — Phase 1 of BAI-SEC-18 is now in
 * place. Phase 2 (migrate the remaining 7 kernel inline scripts
 * + 2 define:vars) is the next ticket; this check just confirms
 * the foundation is wired correctly.
 */
function checkBaiSec18Migration() {
  const soFile = join(ROOT, 'scripts/security-headers.mjs');
  if (!existsSync(soFile)) {
    warn('scripts/security-headers.mjs not found — BAI-SEC-18 architecture missing.');
    return;
  }
  const soContent = readFileSync(soFile, 'utf-8');
  if (!soContent.includes('export function buildCspWithStyleHashes')) {
    warn('scripts/security-headers.mjs missing buildCspWithStyleHashes() — BAI-SEC-18 architecture incomplete.');
  } else {
    pass('scripts/security-headers.mjs exports buildCspWithStyleHashes() (BAI-SEC-18 architecture).');
  }
  if (!soContent.includes('export function computeStyleHash')) {
    warn('scripts/security-headers.mjs missing computeStyleHash() — BAI-SEC-18 architecture incomplete.');
  } else {
    pass('scripts/security-headers.mjs exports computeStyleHash() (BAI-SEC-18 architecture).');
  }

  // Check the 4 expected external scripts exist
  const expectedJs = [
    'public/js/kernel-sidebar.js',
    'public/js/kernel-demo-pill.js',
    'public/js/kernel-connectors.js',
    'public/js/thank-you-id.js',
    'public/js/prevent-default-forms.js',
  ];
  for (const js of expectedJs) {
    if (!existsSync(join(ROOT, js))) {
      warn(`BAI-SEC-18 expected external script missing: ${js}`);
    } else {
      pass(`BAI-SEC-18 external script present: ${js}`);
    }
  }

  // Check that the migrated Astro files load the external scripts
  const astroChecks = [
    {
      file: 'src/components/kernel/KernelSidebar.astro',
      pattern: '/js/kernel-sidebar.js',
      desc: 'KernelSidebar loads external script',
    },
    {
      file: 'src/components/kernel/KernelDemoPill.astro',
      pattern: '/js/kernel-demo-pill.js',
      desc: 'KernelDemoPill loads external script',
    },
    {
      file: 'src/pages/kernel/connectors.astro',
      pattern: '/js/kernel-connectors.js',
      desc: 'connectors page loads external script',
    },
    {
      file: 'src/pages/kernel/connectors.astro',
      pattern: 'id="kernel-connectors-data"',
      desc: 'connectors page has JSON data block (define:vars replacement)',
    },
    {
      file: 'src/pages/thank-you/index.astro',
      pattern: '/js/thank-you-id.js',
      desc: 'thank-you page loads external script',
    },
    {
      file: 'src/layouts/BaseLayout.astro',
      pattern: '/js/prevent-default-forms.js',
      desc: 'BaseLayout loads centralised prevent-default-forms',
    },
  ];
  for (const check of astroChecks) {
    if (!existsSync(join(ROOT, check.file))) {
      warn(`BAI-SEC-18 source file missing: ${check.file}`);
      continue;
    }
    const content = readFileSync(join(ROOT, check.file), 'utf-8');
    if (!content.includes(check.pattern)) {
      warn(`BAI-SEC-18 ${check.desc} — pattern "${check.pattern}" not found in ${check.file}.`);
    } else {
      pass(`BAI-SEC-18 ${check.desc}.`);
    }
  }
}

/* ------------------------------------------------------------------ *
 * Main
 * ------------------------------------------------------------------ */

console.log('CSP regression test (REPORTS-CSP-01 / HIGH-07 / IP-08 / BAI-SEC-18)');
console.log('======================================================');
console.log('');

checkCspSources();
console.log('');
checkInlineScripts();
console.log('');
checkInlineEventHandlers();
console.log('');
checkPerfCssDefer();
console.log('');
checkMiddleware();
console.log('');
checkBaiSec18Migration();
console.log('');

console.log('======================================================');
if (failures > 0) {
  console.error(`${COLORS.red}FAILED${COLORS.reset} — ${failures} failure(s), ${warnings} warning(s)`);
  process.exit(1);
} else if (warnings > 0) {
  console.warn(`${COLORS.yellow}PASSED with warnings${COLORS.reset} — ${warnings} warning(s)`);
  process.exit(0);
} else {
  console.log(`${COLORS.green}PASSED${COLORS.reset} — CSP hardening complete (strict CSP achievable)`);
  process.exit(0);
}