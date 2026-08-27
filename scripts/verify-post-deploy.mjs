#!/usr/bin/env node
/**
 * scripts/verify-post-deploy.mjs — BAI-DEPLOY-11 (2026-07-25)
 *                            + BAI-PROC-12 (2026-07-25) — production content gate
 *
 * Post-deploy + content gate. Proves the live brightai.live reflects the
 * local git HEAD AND that critical production surfaces (hreflang, forbidden
 * paths, canonical, security headers) are still in place. Exits 0 only when
 * ALL probes pass; exits 1 on any failure with a clear diagnostic.
 *
 * BAI-DEPLOY-11 probes (drift detection):
 *   1. `git rev-parse HEAD` → local SHA
 *   2. HEAD `https://${HOST}/` response → x-brightai-build header
 *   3. GET `https://${HOST}/api/health/` → JSON with `commit` field
 *   4. Compare both to local SHA. Both must match.
 *
 * BAI-PROC-12 probes (production content gate, NEW 2026-07-25):
 *   5. hreflang on /en/ and / — bidirectional cluster must be present
 *      (en-SA=self, ar-SA=↗AR counterpart, x-default).
 *   6. Forbidden paths must return 404 (not 200):
 *        /frontend/        (legacy Express leak, BAI-SEC-10)
 *        /client/          (sync-dist-flat flat-copy leak, BAI-DEPLOY-11)
 *        /_archive/        (archived files, never published)
 *        /api/non-health/  (only /api/health/ is whitelisted)
 *   7. canonical on /, /en/, /solutions/ai-governance-platform/ must be
 *      self-referencing with absolute URL.
 *   8. Security headers on /: x-content-type-options=nosniff,
 *      x-frame-options=DENY, referrer-policy present.
 *
 * Why two probe groups (drift + content):
 *   - Drift probes (1-4) prove the live build matches local git. Without
 *     this, an uncommitted BAI-SEC-10 fix can pass locally but never reach
 *     production (the root cause of the 2026-07-25 deployment gap).
 *   - Content probes (5-8) prove the live build is what we intended:
 *     hreflang correct, no leaked artifacts, canonical stable, headers
 *     enforcing CSP posture. A fresh deploy with a broken hreflang pair
 *     would still pass drift probes but fail content probes.
 *
 * Configuration:
 *   - HOST     default: https://brightai.live
 *   - TIMEOUT  default: 15000ms (per request)
 *
 * Flags:
 *   --json              emit machine-readable JSON only
 *   --skip-drift        skip probes 1-4 (git SHA gate); only run content probes
 *   --skip-content      skip probes 5-8; only run drift probes (BAI-DEPLOY-11 behavior)
 *   --skip-forbidden    skip probe 6 (use when the host is staging w/o deployment surface)
 *   --host <url>        override the host (alternative to HOST env var)
 *
 * Usage:
 *   pnpm run verify:post-deploy             # drift + content (default)
 *   pnpm run verify:production             # alias for the default
 *   pnpm run verify:post-deploy --skip-content
 *   pnpm run verify:post-deploy --skip-drift --skip-forbidden
 *   HOST=https://staging.brightai.live pnpm run verify:post-deploy
 *   node scripts/verify-post-deploy.mjs --json
 *
 * Exit codes:
 *   0  — all probes pass (drift-free + content clean)
 *   1  — at least one probe failed
 *   2  — local environment error (no git, network failure, malformed JSON)
 *
 * Wired into:
 *   - pnpm run verify:post-deploy
 *   - pnpm run verify:production
 *   - .github/workflows/reports-gate.yml (BAI-PROC-12, NEW)
 *   - scripts/trigger-indexnow.mjs (post-deploy, soft-fail)
 *
 * Related: BAI-DEPLOY-11, BAI-SEC-10, BAI-SEO-003-S3, DEC-PROC-12-2026-07-25-001.
 */

import { execSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import process from 'node:process';

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '..');

const HOST = process.env.HOST || 'https://brightai.live';
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS || 15000);
const WANT_JSON = process.argv.includes('--json');
const SKIP_DRIFT = process.argv.includes('--skip-drift');
const SKIP_CONTENT = process.argv.includes('--skip-content');
const SKIP_FORBIDDEN = process.argv.includes('--skip-forbidden');
// BAI-IDX-CRAWL (2026-08-08): skip the crawler-access probe (e.g. when
// running against a host that has no Cloudflare edge, or in CI without
// external network). Default is to run it — crawling access is part of
// the production contract after the 2026-08-08 block incident.
const SKIP_CRAWLER = process.argv.includes('--skip-crawler');
const HOST_FLAG = (() => {
  const i = process.argv.indexOf('--host');
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : null;
})();
const EFFECTIVE_HOST = HOST_FLAG || HOST;

/* ---------- BAI-PROC-12 production content gate constants ---------- */

/**
 * Forbidden surface paths. Any 200 on these means a deployment-surface
 * regression (BAI-SEC-10, BAI-DEPLOY-11). We assert 404 on each.
 *
 * The list is intentionally small + specific. Adding a new entry here is
 * a contract change — the production server MUST block this path.
 */
const FORBIDDEN_PATHS = [
  { path: '/frontend/', reason: 'BAI-SEC-10 — legacy Express leak, deleted 2026-06-29' },
  { path: '/client/index.html', reason: 'BAI-DEPLOY-11 — sync-dist-flat flat-copy leak' },
  { path: '/_archive/', reason: 'BAI-SEC-10 — archived files must never serve' },
  { path: '/api/admin/', reason: 'BAI-SEC-10 — only /api/health/ is exposed publicly' },
  { path: '/api/chat/', reason: 'BAI-SEC-10 — only /api/health/ is exposed publicly' },
];

/**
 * Canonical expectations. Each is a {url, mustContain} tuple where
 * `mustContain` is a substring required in the HTML (the absolute
 * canonical URL). Self-canonical is the BrightAI invariant (DEC-001
 * trailingSlash).
 */
const CANONICAL_PAGES = [
  { url: '/', canonical: `${EFFECTIVE_HOST}/` },
  { url: '/en/', canonical: `${EFFECTIVE_HOST}/en/` },
  { url: '/solutions/ai-governance-platform/', canonical: `${EFFECTIVE_HOST}/solutions/ai-governance-platform/` },
];

/**
 * Hreflang expectations. Each is a {url, mustContainTags[]} where
 * `mustContainTags` is a list of substrings that MUST be present in
 * the HTML hreflang set. Implements the BAI-SEO-003-S3 contract.
 */
const HREFLANG_PAGES = [
  {
    url: '/en/',
    mustContain: [
      'hreflang="en-SA"',
      'hreflang="ar-SA"',
      'hreflang="x-default"',
      'href="https://brightai.live/en/"',
    ],
  },
  {
    url: '/',
    mustContain: [
      'hreflang="en-SA"',
      'hreflang="ar-SA"',
      'hreflang="x-default"',
      'href="https://brightai.live/en/"',
    ],
  },
];

/**
 * Security header expectations on the root response.
 * Required by BAI-SEC-10 (hardening) + render.yaml + Cloudflare posture.
 */
const REQUIRED_SECURITY_HEADERS = [
  { name: 'x-content-type-options', mustMatch: /nosniff/i },
  { name: 'x-frame-options', mustMatch: /DENY/i },
  { name: 'referrer-policy', mustMatch: /.+/.source },
];

/* ---------- helpers ---------- */

function log(msg) {
  if (!WANT_JSON) console.log(`[verify-post-deploy] ${msg}`);
}
function err(msg) {
  if (!WANT_JSON) console.error(`[verify-post-deploy] ${msg}`);
  else process.stderr.write(`${msg}\n`);
}

function readLocalSha() {
  try {
    const out = execSync('git rev-parse HEAD', {
      cwd: root,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (!/^[0-9a-f]{40}$/.test(out)) {
      throw new Error(`unexpected SHA format: ${out}`);
    }
    return out;
  } catch (e) {
    err(`FATAL: could not read local git HEAD: ${e.message}`);
    process.exit(2);
  }
}

function shortSha(sha) {
  return sha && sha.length >= 12 ? sha.slice(0, 12) : sha;
}

async function fetchWithTimeout(url, init = {}) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ac.signal, redirect: 'manual' });
  } finally {
    clearTimeout(t);
  }
}

/* ---------- main ---------- */

const localSha = SKIP_DRIFT ? null : readLocalSha();
const localShort = localSha ? shortSha(localSha) : '—';
log(`local HEAD: ${localShort}`);
log(`target host: ${EFFECTIVE_HOST}`);
log(
  `mode: ${SKIP_DRIFT && SKIP_CONTENT ? 'no-op' : SKIP_DRIFT ? 'content-only' : SKIP_CONTENT ? 'drift-only' : 'full (drift + content)'}${SKIP_FORBIDDEN ? ' (forbidden skipped)' : ''}`,
);

const probes = {
  header: { ok: false, value: null, error: null, skipped: SKIP_DRIFT },
  json:   { ok: false, value: null, error: null, skipped: SKIP_DRIFT },
  hreflang: { ok: false, value: null, error: null, skipped: SKIP_CONTENT, perPage: [] },
  forbidden: { ok: false, value: null, error: null, skipped: SKIP_CONTENT || SKIP_FORBIDDEN, perPath: [] },
  canonical: { ok: false, value: null, error: null, skipped: SKIP_CONTENT, perPage: [] },
  securityHeaders: { ok: false, value: null, error: null, skipped: SKIP_CONTENT, perHeader: [] },
  // BAI-IDX-CRAWL (2026-08-08): crawler-access probe. Runs the dedicated
  // monitor as a subprocess so the crawler list + sitemap count live in
  // exactly one place (scripts/verify-crawler-access.mjs).
  crawler: { ok: false, value: null, error: null, skipped: SKIP_CONTENT || SKIP_CRAWLER },
};

/* Probe 1 — x-brightai-build header on the root path. (BAI-DEPLOY-11) */
if (!SKIP_DRIFT) {
  try {
    const res = await fetchWithTimeout(`${EFFECTIVE_HOST}/`, { method: 'HEAD' });
    const hdr = res.headers.get('x-brightai-build');
    if (hdr && /^[0-9a-f]{40}$/.test(hdr)) {
      probes.header.value = hdr;
      probes.header.ok = hdr === localSha;
      if (!probes.header.ok) probes.header.error = `header SHA ${shortSha(hdr)} != local ${localShort}`;
    } else {
      probes.header.error = `no x-brightai-build header (or invalid format): ${hdr}`;
    }
  } catch (e) {
    probes.header.error = `request failed: ${e.message}`;
  }
}

/* Probe 2 — /api/health/ JSON commit field. (BAI-DEPLOY-11) */
if (!SKIP_DRIFT) {
  try {
    const res = await fetchWithTimeout(`${EFFECTIVE_HOST}/api/health/`, { method: 'GET' });
    if (res.status === 200) {
      const body = await res.text();
      let parsed;
      try {
        parsed = JSON.parse(body);
      } catch (e) {
        probes.json.error = `/api/health/ returned non-JSON: ${body.slice(0, 120)}`;
      }
      if (parsed) {
        const commit = parsed.commit;
        if (commit && /^[0-9a-f]{40}$/.test(commit)) {
          probes.json.value = commit;
          probes.json.ok = commit === localSha;
          if (!probes.json.ok) probes.json.error = `JSON commit ${shortSha(commit)} != local ${localShort}`;
        } else {
          probes.json.error = `/api/health/ JSON missing/invalid commit field: ${JSON.stringify(parsed).slice(0, 200)}`;
        }
      }
    } else {
      probes.json.error = `/api/health/ returned HTTP ${res.status}`;
    }
  } catch (e) {
    probes.json.error = `request failed: ${e.message}`;
  }
}

/* Probe 3 — hreflang on /en/ and /. (BAI-PROC-12 — BAI-SEO-003-S3 contract) */
if (!SKIP_CONTENT) {
  for (const spec of HREFLANG_PAGES) {
    const entry = { url: spec.url, ok: false, missing: [], error: null };
    try {
      const res = await fetchWithTimeout(`${EFFECTIVE_HOST}${spec.url}`, { method: 'GET' });
      if (res.status !== 200) {
        entry.error = `HTTP ${res.status}`;
      } else {
        const body = await res.text();
        for (const needle of spec.mustContain) {
          if (!body.includes(needle)) entry.missing.push(needle);
        }
        entry.ok = entry.missing.length === 0 && !entry.error;
      }
    } catch (e) {
      entry.error = `request failed: ${e.message}`;
    }
    probes.hreflang.perPage.push(entry);
  }
  probes.hreflang.ok = probes.hreflang.perPage.every((p) => p.ok);
  const bad = probes.hreflang.perPage.filter((p) => !p.ok);
  if (bad.length) {
    probes.hreflang.error = `${bad.length} page(s) failed hreflang contract — see perPage`;
  }
}

/* Probe 4 — Forbidden paths must 404. (BAI-PROC-12 — BAI-SEC-10 + BAI-DEPLOY-11) */
if (!SKIP_CONTENT && !SKIP_FORBIDDEN) {
  for (const spec of FORBIDDEN_PATHS) {
    const entry = { path: spec.path, ok: false, status: null, reason: spec.reason, error: null };
    try {
      const res = await fetchWithTimeout(`${EFFECTIVE_HOST}${spec.path}`, {
        method: 'GET',
        redirect: 'manual',
      });
      entry.status = res.status;
      // 404 or 403 are both acceptable (some configs return 403 for forbidden prefixes).
      // 200 means the file leaked — failure. 3xx means a redirect snuck it back in.
      entry.ok = res.status === 404 || res.status === 403;
      if (!entry.ok) {
        entry.error = `expected 404/403, got ${res.status} (leak!)`;
      }
    } catch (e) {
      entry.error = `request failed: ${e.message}`;
    }
    probes.forbidden.perPath.push(entry);
  }
  probes.forbidden.ok = probes.forbidden.perPath.every((p) => p.ok);
  const bad = probes.forbidden.perPath.filter((p) => !p.ok);
  if (bad.length) {
    probes.forbidden.error = `${bad.length} path(s) leaked: ${bad.map((b) => `${b.path} → ${b.status}`).join(', ')}`;
  }
}

/* Probe 5 — Canonical self-reference on /, /en/, /solutions/ai-governance-platform/. */
if (!SKIP_CONTENT) {
  for (const spec of CANONICAL_PAGES) {
    const entry = { url: spec.url, ok: false, found: null, error: null };
    try {
      const res = await fetchWithTimeout(`${EFFECTIVE_HOST}${spec.url}`, { method: 'GET' });
      if (res.status !== 200) {
        entry.error = `HTTP ${res.status}`;
      } else {
        const body = await res.text();
        // Look for <link rel="canonical" href="..."> — accept either attribute order.
        const match = body.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)
          || body.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);
        if (match) {
          entry.found = match[1];
          entry.ok = entry.found === spec.canonical;
          if (!entry.ok) entry.error = `expected ${spec.canonical}, got ${entry.found}`;
        } else {
          entry.error = 'no <link rel="canonical"> tag found';
        }
      }
    } catch (e) {
      entry.error = `request failed: ${e.message}`;
    }
    probes.canonical.perPage.push(entry);
  }
  probes.canonical.ok = probes.canonical.perPage.every((p) => p.ok);
  const bad = probes.canonical.perPage.filter((p) => !p.ok);
  if (bad.length) {
    probes.canonical.error = `${bad.length} page(s) have wrong canonical — see perPage`;
  }
}

/* Probe 6 — Security headers on /. (BAI-PROC-12 — BAI-SEC-10 hardening) */
if (!SKIP_CONTENT) {
  try {
    const res = await fetchWithTimeout(`${EFFECTIVE_HOST}/`, { method: 'HEAD' });
    for (const spec of REQUIRED_SECURITY_HEADERS) {
      const entry = { name: spec.name, ok: false, value: null, error: null };
      const val = res.headers.get(spec.name);
      if (val) {
        entry.value = val;
        if (spec.mustMatch.test(val)) {
          entry.ok = true;
        } else {
          entry.error = `value "${val}" does not match ${spec.mustMatch}`;
        }
      } else {
        entry.error = `header missing`;
      }
      probes.securityHeaders.perHeader.push(entry);
    }
    probes.securityHeaders.ok = probes.securityHeaders.perHeader.every((h) => h.ok);
    const bad = probes.securityHeaders.perHeader.filter((h) => !h.ok);
    if (bad.length) {
      probes.securityHeaders.error = `${bad.length} header(s) missing/wrong: ${bad.map((b) => b.name).join(', ')}`;
    }
  } catch (e) {
    probes.securityHeaders.error = `request failed: ${e.message}`;
  }
}

/* Probe 7 — Crawler access. (BAI-IDX-CRAWL — 2026-08-08 incident guard)
 * Delegates to scripts/verify-crawler-access.mjs so the crawler list +
 * sitemap-URL floor live in one place. Fails if any search-engine / AI
 * crawler gets non-200, or if /sitemap.xml is unreachable to Googlebot,
 * or if the <loc> count drops below the floor. This is the synthetic
 * monitor that would have caught the 2026-08-08 Cloudflare block on the
 * first request, instead of silently degrading indexing for days. */
if (!SKIP_CONTENT && !SKIP_CRAWLER) {
  try {
    const monitor = execFileSync(
      process.execPath,
      [path.join(root, 'scripts', 'verify-crawler-access.mjs')],
      { env: { ...process.env, HOST: EFFECTIVE_HOST }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    );
    probes.crawler.value = monitor.split('\n').filter((l) => l.includes('PASS')).pop() || 'PASS';
    probes.crawler.ok = true;
  } catch (e) {
    // e.stdout holds the monitor's partial output even on failure.
    const detail = (e.stdout || e.stderr || '').split('\n').filter(Boolean).slice(-3).join(' | ');
    probes.crawler.error = `crawler-access monitor failed: ${e.message}${detail ? ` — ${detail}` : ''}`;
  }
}

/* ---------- result ---------- */

const failedProbes = Object.entries(probes).filter(
  ([, p]) => !p.skipped && p.ok === false,
);
const drift = !SKIP_DRIFT && (!probes.header.ok || !probes.json.ok);
const contentFail = !SKIP_CONTENT && (
  !probes.hreflang.ok || !probes.forbidden.ok || !probes.canonical.ok || !probes.securityHeaders.ok || !probes.crawler.ok
);
const anyFail = drift || contentFail;

if (WANT_JSON) {
  const out = {
    local: localSha ? { sha: localSha, short: localShort } : null,
    host: EFFECTIVE_HOST,
    flags: {
      skipDrift: SKIP_DRIFT,
      skipContent: SKIP_CONTENT,
      skipForbidden: SKIP_FORBIDDEN,
    },
    probes,
    drift,
    contentFail,
    anyFail,
    verdict: anyFail ? 'fail' : 'pass',
  };
  process.stdout.write(JSON.stringify(out, null, 2) + '\n');
  process.exit(anyFail ? 1 : 0);
}

log('');
log('— probes —');
const fmt = (ok, skipped) => skipped ? '⏭️  skipped' : (ok ? '✅' : '❌');

if (!SKIP_DRIFT) {
  log(`  x-brightai-build header on /:    ${fmt(probes.header.ok, false)} ${probes.header.value ? shortSha(probes.header.value) : '—'}${probes.header.error ? '   ' + probes.header.error : ''}`);
  log(`  /api/health/ JSON commit:        ${fmt(probes.json.ok, false)} ${probes.json.value ? shortSha(probes.json.value) : '—'}${probes.json.error ? '   ' + probes.json.error : ''}`);
}
if (!SKIP_CONTENT) {
  log(`  hreflang contract:               ${fmt(probes.hreflang.ok, SKIP_CONTENT)} ${probes.hreflang.perPage.length} page(s) checked${probes.hreflang.error ? '   ' + probes.hreflang.error : ''}`);
  for (const p of probes.hreflang.perPage) {
    if (!p.ok) {
      const detail = p.missing.length ? `missing: ${p.missing.join(', ')}` : p.error;
      log(`      ❌ ${p.url}  ${detail}`);
    }
  }
  if (!SKIP_FORBIDDEN) {
    log(`  forbidden paths 404:             ${fmt(probes.forbidden.ok, false)} ${probes.forbidden.perPath.length} path(s) checked${probes.forbidden.error ? '   ' + probes.forbidden.error : ''}`);
    for (const p of probes.forbidden.perPath) {
      if (!p.ok) log(`      ❌ ${p.path}  status=${p.status}  (${p.reason})`);
    }
  }
  log(`  canonical self-reference:        ${fmt(probes.canonical.ok, SKIP_CONTENT)} ${probes.canonical.perPage.length} page(s) checked${probes.canonical.error ? '   ' + probes.canonical.error : ''}`);
  for (const p of probes.canonical.perPage) {
    if (!p.ok) {
      log(`      ❌ ${p.url}  ${p.found ? `got ${p.found}` : p.error}`);
    }
  }
  log(`  security headers:                ${fmt(probes.securityHeaders.ok, SKIP_CONTENT)} ${probes.securityHeaders.perHeader.length} header(s) checked${probes.securityHeaders.error ? '   ' + probes.securityHeaders.error : ''}`);
  for (const h of probes.securityHeaders.perHeader) {
    if (!h.ok) log(`      ❌ ${h.name}  ${h.error}`);
  }
  log(`  crawler access:                  ${fmt(probes.crawler.ok, SKIP_CONTENT || SKIP_CRAWLER)} search + AI crawlers${probes.crawler.error ? '   ' + probes.crawler.error : ''}`);
}
log('');

if (anyFail) {
  err(`❌ PRODUCTION VERIFICATION FAILED — ${failedProbes.length} probe group(s) failed.`);
  if (drift) {
    err(`  drift: local HEAD ${localShort} does not match live build.`);
    if (probes.header.value) err(`  live header: ${shortSha(probes.header.value)}`);
    if (probes.json.value)   err(`  live JSON:   ${shortSha(probes.json.value)}`);
    err(`  Possible causes:`);
    err(`    - Render is still running the old build (auto-deploy lag)`);
    err(`    - A previous deploy failed silently and the old service is still up`);
    err(`    - Cloudflare is serving a cached version of the old HTML (cf-cache HIT)`);
    err(`  Next step: run \`pnpm run cloudflare:purge\` + re-run this script.`);
  }
  if (contentFail) {
    err(`  content: at least one production contract is broken.`);
    err(`  See per-probe details above. Investigate before declaring success.`);
  }
  process.exit(1);
} else {
  log(`✅ ALL PROBES PASS — live build matches local HEAD (${localShort}) and content contracts hold.`);
  process.exit(0);
}
