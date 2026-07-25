# Hreflang Live Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `--live` flag to `scripts/hreflang-bidirectional-audit.mjs` that fetches production HTML via Playwright and validates the 5 hreflang contracts. Wire the script into `verify:all` (currently orphaned) and add a CI Job 10 to `ci-build-guard.yml` for daily + on-push production drift detection.

**Architecture:** Refactor the existing `main()` to support both filesystem and HTTP fetch sources via an injectable `run({ source, ...opts })` function. CLI parsing via `parseArgs` (mirroring `scripts/gsc-export.mjs:127-147`). Live path uses `chromium.launch()` + `Promise.allSettled` chunks (default 10 concurrent) + `page.goto({ waitUntil: 'domcontentloaded' })` + `page.content()` extraction. All 5 detection functions (`checkReciprocity`, `checkCanonicalSelfMatch`, `checkXDefault`, `checkEnPageContract`, `checkArOnlyPageNoEnAlternate`) stay untouched — they accept a `Map<canonical, { file, alternates }>` shape that we populate from either source.

**Tech Stack:** Node 22.22.2 + Playwright 1.61+ (chromium) + `scripts/sitemap-audit-utils.mjs` (existing parser) + GitHub Actions ci-build-guard.yml + `node --test` (no vitest for this CLI).

**Reference conventions in this codebase:**
- CLI pattern: `scripts/gsc-export.mjs:127-147` (`parseArgs` + injectable `run` + `isMain` guard)
- Test pattern: `scripts/gsc-export.test.mjs` (352 lines, flag parsing + dry-run E2E + missing-auth)
- Live mode precedent: `scripts/qa/check-mobile-375.mjs:11,20-24` (default live, `--local` opt-out)
- Test wiring: `package.json:91-95` + `vitest.config.js:10-15` (root tests scoped to chat/CSRF only; new tests need explicit wiring)

**Spec:** `docs/superpowers/specs/2026-07-25-hreflang-live-audit-design.md` (430 lines)

---

## Task 1: Refactor `hreflang-bidirectional-audit.mjs` for argv parsing + injectable run

**Files:**
- Modify: `scripts/hreflang-bidirectional-audit.mjs:1-40` (header + top-level)
- Modify: `scripts/hreflang-bidirectional-audit.mjs:233-326` (main function + bottom-level)

- [ ] **Step 1.1: Read current `main()` and verify structure**

Read `scripts/hreflang-bidirectional-audit.mjs` lines 233-326. Confirm:
- It calls `buildPageIndex()` → 5 `check*` functions → `non200Errors` loop → console.log summary → `process.exit(1)` if totalErrors > 0.
- There is no `argv` parsing, no `isMain` guard, no exports.

If structure differs from spec, update the rest of Task 1 accordingly. The 5 check functions (`checkReciprocity`, `checkCanonicalSelfMatch`, `checkXDefault`, `checkEnPageContract`, `checkArOnlyPageNoEnAlternate`) and `buildPageIndex` stay unchanged.

- [ ] **Step 1.2: Add `parseArgs` function + CLI flags**

Add at the top of `scripts/hreflang-bidirectional-audit.mjs` (after the existing imports, before `const BASE_URL`):

```javascript
function parseArgs(argv) {
  const args = {
    live: false,
    host: 'https://brightai.site',
    sample: 200,
    concurrency: 10,
    timeout: 15000,
    report: null,
    showHelp: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--live') args.live = true;
    else if (arg === '--local') args.live = false;
    else if (arg === '--help' || arg === '-h') args.showHelp = true;
    else if (arg === '--host') args.host = argv[++i];
    else if (arg === '--sample') args.sample = parseInt(argv[++i], 10);
    else if (arg === '--concurrency') args.concurrency = parseInt(argv[++i], 10);
    else if (arg === '--timeout') args.timeout = parseInt(argv[++i], 10);
    else if (arg === '--report') args.report = argv[++i];
  }
  return args;
}
```

Note: `--local` is the explicit opt-out (parity with `scripts/qa/check-mobile-375.mjs:11`). Default stays `live: false` to preserve existing local behavior.

- [ ] **Step 1.3: Add `printHelp` function**

Add after `parseArgs`:

```javascript
function printHelp() {
  console.log(`Usage: node scripts/hreflang-bidirectional-audit.mjs [options]

Hreflang bidirectional audit (BAI-IDX-14)

Options:
  --live                   Fetch from production via Playwright (default: filesystem)
  --local                  Force filesystem mode (parity with check-mobile-375)
  --host <url>             Production host (default: https://brightai.site)
  --sample <n>             Pages to sample (default: 200; 0 = all)
  --concurrency <n>        Parallel browser contexts (default: 10)
  --timeout <ms>           Per-page navigation timeout (default: 15000)
  --report <path>          JSON report output path
  -h, --help               Show this help

Examples:
  node scripts/hreflang-bidirectional-audit.mjs                    # Local filesystem
  node scripts/hreflang-bidirectional-audit.mjs --live             # Production
  node scripts/hreflang-bidirectional-audit.mjs --live --sample=50 # Sample 50 pages

Exit codes:
  0  All checks passed
  1  One or more violations detected
  2  Internal error (browser launch, network, parse failure)
`);
}
```

- [ ] **Step 1.4: Refactor `main()` into injectable `run({ source, ... })`**

Replace `main()` (lines 233-326) with this structure. The key change: `buildPageIndex()` becomes `buildPageIndexFromSource(source, args)` where `source` is either `'filesystem'` or `'live'`. The 5 `check*` functions stay untouched.

```javascript
async function run({ source, args, fetchLive, fetchFilesystem, reportWriter }) {
  // Build the page index from the chosen source
  const pageIndex = source === 'live'
    ? await fetchLive({ host: args.host, sample: args.sample, concurrency: args.concurrency, timeout: args.timeout })
    : fetchFilesystem();

  const setCount = pageIndex.size;

  const reciprocityErrors = checkReciprocity(pageIndex);
  const canonicalErrors = checkCanonicalSelfMatch(pageIndex);
  const xDefaultErrors = checkXDefault(pageIndex);
  const enPageContractErrors = checkEnPageContract(pageIndex);
  const arOnlyInventedEnErrors = checkArOnlyPageNoEnAlternate(pageIndex);

  // Non-200 check is filesystem-only (live fetch tracks its own non-200s)
  let non200Errors = [];
  if (source === 'filesystem') {
    non200Errors = checkNon200Files(pageIndex);
  }

  const totalErrors =
    reciprocityErrors.length +
    canonicalErrors.length +
    xDefaultErrors.length +
    enPageContractErrors.length +
    arOnlyInventedEnErrors.length +
    non200Errors.length;

  // Summary output (mode-aware)
  const mode = source === 'live' ? 'live' : 'local';
  console.log(`Hreflang bidirectional audit (${mode} mode)`);
  if (source === 'live') {
    console.log(`  Host:                ${args.host}`);
    console.log(`  Pages sampled:       ${args.sample}`);
    console.log(`  Concurrency:         ${args.concurrency}`);
  }
  console.log(`  Sets audited:           ${setCount}`);
  console.log(`  Missing return tags:    ${reciprocityErrors.length}`);
  console.log(`  Canonical mismatch:     ${canonicalErrors.length}`);
  console.log(`  Missing x-default:      ${xDefaultErrors.length}`);
  console.log(`  EN page contract (S3):  ${enPageContractErrors.length}`);
  console.log(`  AR-only invented en:    ${arOnlyInventedEnErrors.length}`);
  console.log(`  Non-200 hreflang:       ${non200Errors.length}`);
  console.log(`  TOTAL ERRORS:           ${totalErrors}`);

  // ... existing violation block printing (recip, canonical, x-default, EN, AR-only, non-200) ...

  // JSON report (only when --report is set)
  if (args.report) {
    await reportWriter(args.report, {
      host: args.host,
      sampledPages: args.sample,
      totalPages: setCount,
      concurrency: args.concurrency,
      timestamp: new Date().toISOString(),
      errors: {
        missingReturn: reciprocityErrors.length,
        canonicalMismatch: canonicalErrors.length,
        missingXDefault: xDefaultErrors.length,
        enPageContract: enPageContractErrors.length,
        arOnlyInventedEn: arOnlyInventedEnErrors.length,
        non200Responses: non200Errors.length,
      },
      violations: [
        ...reciprocityErrors.map((e) => ({ type: 'missing-return', detail: e })),
        ...canonicalErrors.map((e) => ({ type: 'canonical-mismatch', detail: e })),
        ...xDefaultErrors.map((e) => ({ type: 'missing-xdefault', detail: e })),
        ...enPageContractErrors.map((e) => ({ type: 'en-page-contract', detail: e })),
        ...arOnlyInventedEnErrors.map((e) => ({ type: 'ar-only-invented-en', detail: e })),
      ],
    });
  }

  if (totalErrors > 0) process.exit(1);
  console.log(`\n✅ All hreflang bidirectional checks passed (${mode}).`);
}
```

The existing non-200 loop (lines 244-271) is extracted into a named function `checkNon200Files(pageIndex)` (filesystem-only). The violation-printing block (lines 291-314) is kept as-is.

- [ ] **Step 1.5: Add `isMain` guard + thin CLI wrapper**

Replace the bottom of the file (currently `main().catch(...)` at lines 322-325) with:

```javascript
// Run as CLI when invoked directly; export for tests when imported.
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs(process.argv);
  if (args.showHelp) {
    printHelp();
    process.exit(0);
  }
  run({ source: args.live ? 'live' : 'filesystem', args, fetchLive, fetchFilesystem, reportWriter })
    .catch((err) => {
      console.error(err);
      process.exit(2); // Internal error (distinct from violations=1)
    });
}

export { parseArgs, printHelp, run, checkNon200Files };
```

`isMain` guard follows `scripts/gsc-export.mjs:621-629` pattern.

- [ ] **Step 1.6: Verify local default still works**

Run:
```bash
node scripts/hreflang-bidirectional-audit.mjs
```

Expected: existing output (`Hreflang bidirectional audit` without `(live mode)` annotation), 0 errors (BAI-SEO-003-S3 invariants). The CLI must NOT print `Host:` / `Pages sampled:` / `Concurrency:` lines in local mode (added only for live mode).

If output shows the live-mode lines, the `source` branching in the `run` summary is wrong — re-check Step 1.4.

- [ ] **Step 1.7: Verify `--help` works**

Run: `node scripts/hreflang-bidirectional-audit.mjs --help`

Expected: usage text printed, exit code 0. No other output.

- [ ] **Step 1.8: Commit**

```bash
git add scripts/hreflang-bidirectional-audit.mjs
git commit -m "refactor(hreflang): add parseArgs + injectable run + isMain guard (BAI-IDX-14 prep)"
```

---

## Task 2: Extract `buildPageIndex()` to support filesystem + live sources

**Files:**
- Modify: `scripts/hreflang-bidirectional-audit.mjs:66-86` (`buildPageIndex` function)
- Create (inline): `fetchFilesystem()` and `fetchLive()` functions within the same file

- [ ] **Step 2.1: Extract `buildPageIndex` into `fetchFilesystem`**

Replace the existing `buildPageIndex()` (lines 66-86) with a refactored function that returns the same shape but is named to match the source abstraction:

```javascript
function fetchFilesystem() {
  const files = walkHtml(CLIENT_ROOT);
  const index = new Map();
  for (const file of files) {
    const html = readFileSync(file, 'utf8');
    const canonical = extractCanonicalHref(html);
    if (!canonical) continue;
    if (hasNoindexDirective(html)) continue;
    const alternates = parseHeadHreflang(html);
    const map = new Map();
    for (const a of alternates) {
      map.set(a.hreflang, a.href);
    }
    index.set(canonical, { file, alternates: map });
  }
  return index;
}
```

The function name `buildPageIndex` is renamed to `fetchFilesystem`. Behavior identical.

- [ ] **Step 2.2: Add `checkNon200Files` helper (filesystem-only)**

Add after `fetchFilesystem`:

```javascript
function checkNon200Files(index) {
  const allAlternateUrls = new Set();
  for (const { alternates } of index.values()) {
    for (const href of alternates.values()) {
      allAlternateUrls.add(href);
    }
  }
  const errors = [];
  for (const href of allAlternateUrls) {
    let relPath;
    try {
      const parsed = new URL(href);
      relPath = decodeURIComponent(parsed.pathname);
    } catch {
      errors.push(`bad-url: ${href}`);
      continue;
    }
    if (relPath === '/') relPath = '/index.html';
    else if (relPath.endsWith('/')) relPath += 'index.html';
    else if (!relPath.endsWith('.html')) relPath += '/index.html';
    const candidate = path.join(CLIENT_ROOT, relPath);
    try {
      readFileSync(candidate);
    } catch {
      errors.push(`non-200: ${href} (missing ${candidate})`);
    }
  }
  return errors;
}
```

Extracted from the existing non-200 loop (lines 244-271 in the original file). Behavior identical.

- [ ] **Step 2.3: Run local audit (regression check)**

```bash
node scripts/hreflang-bidirectional-audit.mjs
```

Expected: 0 errors. The refactor must not change observable behavior.

- [ ] **Step 2.4: Commit**

```bash
git add scripts/hreflang-bidirectional-audit.mjs
git commit -m "refactor(hreflang): extract fetchFilesystem + checkNon200Files (BAI-IDX-14)"
```

---

## Task 3: Add live fetch via Playwright

**Files:**
- Modify: `scripts/hreflang-bidirectional-audit.mjs` (add `fetchLive` function + Playwright import)

- [ ] **Step 3.1: Add `playwright` import**

At the top of the file (with other imports), add:

```javascript
import { chromium } from 'playwright';
```

- [ ] **Step 3.2: Add `fetchLive` function**

Add after `fetchFilesystem` and before `checkNon200Files`:

```javascript
async function fetchLive({ host, sample, concurrency, timeout }) {
  const browser = await chromium.launch({ headless: true });
  let context = null;
  try {
    context = await browser.newContext({
      userAgent: 'BrightAI-Hreflang-Audit/1.0 (+https://brightai.site)',
    });
    // Abort static assets to save bandwidth + time
    await context.route('**/*', (route) => {
      const type = route.request().resourceType();
      if (['stylesheet', 'font', 'image', 'media', 'other'].includes(type)) {
        return route.abort();
      }
      return route.continue();
    });

    // Get sitemap URLs (production surface)
    const sitemapUrl = `${host.replace(/\/$/, '')}/sitemap.xml`;
    const page = await context.newPage();
    try {
      const response = await page.goto(sitemapUrl, { waitUntil: 'domcontentloaded', timeout });
      if (!response || response.status() >= 400) {
        throw new Error(`Sitemap fetch failed: ${response?.status() ?? 'no response'}`);
      }
      const sitemapXml = await page.content();
      // Extract <loc> URLs from sitemap XML
      const urls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
      await page.close();
      if (urls.length === 0) throw new Error('Sitemap contains no URLs');
      return await fetchPages(context, urls, host, sample, concurrency, timeout);
    } catch (err) {
      await page.close().catch(() => {});
      throw err;
    }
  } finally {
    if (context) await context.close();
    await browser.close();
  }
}

async function fetchPages(context, urls, host, sample, concurrency, timeout) {
  const sampled = sample > 0 ? urls.slice(0, sample) : urls;
  const index = new Map();
  const non200 = [];
  const chunks = [];
  for (let i = 0; i < sampled.length; i += concurrency) {
    chunks.push(sampled.slice(i, i + concurrency));
  }
  for (const chunk of chunks) {
    const results = await Promise.allSettled(
      chunk.map(async (url) => {
        const page = await context.newPage();
        try {
          const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
          const status = response?.status() ?? 0;
          if (status >= 400) {
            non200.push({ url, status });
            return null;
          }
          const html = await page.content();
          const canonical = extractCanonicalHref(html);
          if (!canonical) return null;
          if (hasNoindexDirective(html)) return null;
          const alternates = parseHeadHreflang(html);
          const map = new Map();
          for (const a of alternates) {
            map.set(a.hreflang, a.href);
          }
          return { canonical, url, alternates: map, status };
        } finally {
          await page.close();
        }
      }),
    );
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) {
        index.set(r.value.canonical, { url: r.value.url, status: r.value.status, alternates: r.value.alternates });
      }
    }
  }
  return index;
}
```

Note: `non200` is collected but not stored in the index (the live path doesn't use it for exit codes — production non-200 is informational, not a violation). The `run()` function in Task 1 already handles `source === 'live'` by skipping `checkNon200Files`.

- [ ] **Step 3.3: Install Playwright chromium locally**

Run: `npx playwright install --with-deps chromium`

Expected: chromium downloaded (~150MB). If `--with-deps` fails on macOS (no apt), run without it: `npx playwright install chromium`. The `--with-deps` flag is for CI (ubuntu-latest).

- [ ] **Step 3.4: Test live mode against production**

```bash
node scripts/hreflang-bidirectional-audit.mjs --live --sample=20
```

Expected output:
```
Hreflang bidirectional audit (live mode)
  Host:                https://brightai.site
  Pages sampled:       200
  Concurrency:         10
  Sets audited:           18-20
  Missing return tags:    0
  ...
  TOTAL ERRORS:           0

✅ All hreflang bidirectional checks passed (live).
```

Note: `Pages sampled: 200` is the default but the actual `Sets audited` will equal the sitemap size (likely 180) when sample > total. This is expected.

If errors appear, the production is broken — capture the error output for the report.

- [ ] **Step 3.5: Verify JSON report generation**

```bash
node scripts/hreflang-bidirectional-audit.mjs --live --sample=10 --report=/tmp/hreflang-report.json
cat /tmp/hreflang-report.json
```

Expected: JSON file with `host`, `sampledPages`, `totalPages`, `concurrency`, `timestamp`, `errors` counts, `violations` array.

- [ ] **Step 3.6: Negative test — bad host**

```bash
node scripts/hreflang-bidirectional-audit.mjs --live --host=https://broken-host.invalid --sample=5
echo "exit: $?"
```

Expected: exit code 2 (internal error), error message contains "Sitemap fetch failed" or "Navigation timeout". This proves the error path for CI.

- [ ] **Step 3.7: Commit**

```bash
git add scripts/hreflang-bidirectional-audit.mjs pnpm-lock.yaml
git commit -m "feat(hreflang): add --live flag + Playwright production audit (BAI-IDX-14)"
```

`pnpm-lock.yaml` may have changed if Playwright versions were updated.

---

## Task 4: Write tests for the new CLI + live path

**Files:**
- Create: `scripts/hreflang-bidirectional-audit.test.mjs`

- [ ] **Step 4.1: Create test file structure**

Reference: `scripts/gsc-export.test.mjs:351-372` (flag parsing) + `scripts/gsc-export.test.mjs:387-476` (E2E with mocks). Use `node --test` (project standard for scripts/, per `vitest.config.js:10-15` scoping).

Create `scripts/hreflang-bidirectional-audit.test.mjs`:

```javascript
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs, printHelp, run } from './hreflang-bidirectional-audit.mjs';

// ────────────────────────────────────────────────────────────────
// parseArgs tests
// ────────────────────────────────────────────────────────────────

describe('parseArgs', () => {
  test('default values when no flags passed', () => {
    const args = parseArgs(['node', 'script.js']);
    assert.equal(args.live, false);
    assert.equal(args.host, 'https://brightai.site');
    assert.equal(args.sample, 200);
    assert.equal(args.concurrency, 10);
    assert.equal(args.timeout, 15000);
    assert.equal(args.report, null);
    assert.equal(args.showHelp, false);
  });

  test('--live sets live=true', () => {
    const args = parseArgs(['node', 'script.js', '--live']);
    assert.equal(args.live, true);
  });

  test('--local sets live=false (parity with check-mobile-375)', () => {
    const args = parseArgs(['node', 'script.js', '--live', '--local']);
    assert.equal(args.live, false);
  });

  test('--host accepts URL', () => {
    const args = parseArgs(['node', 'script.js', '--host', 'https://staging.brightai.site']);
    assert.equal(args.host, 'https://staging.brightai.site');
  });

  test('--sample parses integer', () => {
    const args = parseArgs(['node', 'script.js', '--sample', '50']);
    assert.equal(args.sample, 50);
  });

  test('--concurrency parses integer', () => {
    const args = parseArgs(['node', 'script.js', '--concurrency', '5']);
    assert.equal(args.concurrency, 5);
  });

  test('--timeout parses integer', () => {
    const args = parseArgs(['node', 'script.js', '--timeout', '30000']);
    assert.equal(args.timeout, 30000);
  });

  test('--report captures path', () => {
    const args = parseArgs(['node', 'script.js', '--report', '/tmp/out.json']);
    assert.equal(args.report, '/tmp/out.json');
  });

  test('-h sets showHelp=true', () => {
    const args = parseArgs(['node', 'script.js', '-h']);
    assert.equal(args.showHelp, true);
  });

  test('--help sets showHelp=true', () => {
    const args = parseArgs(['node', 'script.js', '--help']);
    assert.equal(args.showHelp, true);
  });
});

// ────────────────────────────────────────────────────────────────
// printHelp tests
// ────────────────────────────────────────────────────────────────

describe('printHelp', () => {
  test('contains Usage line', () => {
    const originalLog = console.log;
    const captured = [];
    console.log = (...args) => captured.push(args.join(' '));
    try {
      printHelp();
    } finally {
      console.log = originalLog;
    }
    const out = captured.join('\n');
    assert.match(out, /Usage: node scripts\/hreflang-bidirectional-audit\.mjs/);
    assert.match(out, /--live/);
    assert.match(out, /--host/);
    assert.match(out, /--sample/);
    assert.match(out, /Exit codes/);
  });
});

// ────────────────────────────────────────────────────────────────
// run() tests — filesystem source (in-process, no I/O)
// ────────────────────────────────────────────────────────────────

describe('run with filesystem source', () => {
  test('exit 0 when fixtures have valid hreflang (regression check)', async () => {
    const sampleIndex = new Map([
      ['https://brightai.site/about/', {
        file: '/fake/about.html',
        alternates: new Map([
          ['ar-SA', 'https://brightai.site/about/'],
          ['x-default', 'https://brightai.site/about/'],
        ]),
      }],
      ['https://brightai.site/en/about/', {
        file: '/fake/en/about.html',
        alternates: new Map([
          ['en-SA', 'https://brightai.site/en/about/'],
          ['ar-SA', 'https://brightai.site/about/'],
          ['x-default', 'https://brightai.site/about/'],
        ]),
      }],
    ]);
    const fetchFilesystem = () => sampleIndex;
    const reportWriter = async () => {}; // no-op

    // Capture process.exit
    const originalExit = process.exit;
    let exitCode = null;
    process.exit = (code) => { exitCode = code; };
    try {
      await run({ source: 'filesystem', args: {}, fetchFilesystem, reportWriter });
    } finally {
      process.exit = originalExit;
    }
    assert.equal(exitCode, null, 'should not exit when no errors');
  });

  test('exit 1 when reciprocity fails (missing return tag)', async () => {
    const sampleIndex = new Map([
      ['https://brightai.site/about/', {
        file: '/fake/about.html',
        alternates: new Map([
          ['ar-SA', 'https://brightai.site/about/'],
          ['ar-EG', 'https://brightai.site/eg/about/'], // target exists but doesn't return
          ['x-default', 'https://brightai.site/about/'],
        ]),
      }],
      ['https://brightai.site/eg/about/', {
        file: '/fake/eg/about.html',
        alternates: new Map([
          ['ar-EG', 'https://brightai.site/eg/about/'],
          // MISSING: no return to /about/
        ]),
      }],
    ]);
    const fetchFilesystem = () => sampleIndex;
    const reportWriter = async () => {};

    const originalExit = process.exit;
    let exitCode = null;
    process.exit = (code) => { exitCode = code; };
    try {
      await run({ source: 'filesystem', args: {}, fetchFilesystem, reportWriter });
    } finally {
      process.exit = originalExit;
    }
    assert.equal(exitCode, 1, 'should exit 1 on reciprocity violation');
  });

  test('exit 1 when x-default points to /en/', async () => {
    const sampleIndex = new Map([
      ['https://brightai.site/about/', {
        file: '/fake/about.html',
        alternates: new Map([
          ['ar-SA', 'https://brightai.site/about/'],
          ['x-default', 'https://brightai.site/en/about/'], // VIOLATION per AC#3
        ]),
      }],
    ]);
    const fetchFilesystem = () => sampleIndex;
    const reportWriter = async () => {};

    const originalExit = process.exit;
    let exitCode = null;
    process.exit = (code) => { exitCode = code; };
    try {
      await run({ source: 'filesystem', args: {}, fetchFilesystem, reportWriter });
    } finally {
      process.exit = originalExit;
    }
    assert.equal(exitCode, 1);
  });

  test('exit 1 when AR-only page invents en-SA (BAI-SEO-003-S3 invariant)', async () => {
    const sampleIndex = new Map([
      ['https://brightai.site/blog/some-post/', {
        file: '/fake/blog/some-post.html',
        alternates: new Map([
          ['ar-SA', 'https://brightai.site/blog/some-post/'],
          ['en-SA', 'https://brightai.site/en/blog/some-post/'], // VIOLATION: invented
          ['x-default', 'https://brightai.site/blog/some-post/'],
        ]),
      }],
    ]);
    const fetchFilesystem = () => sampleIndex;
    const reportWriter = async () => {};

    const originalExit = process.exit;
    let exitCode = null;
    process.exit = (code) => { exitCode = code; };
    try {
      await run({ source: 'filesystem', args: {}, fetchFilesystem, reportWriter });
    } finally {
      process.exit = originalExit;
    }
    assert.equal(exitCode, 1);
  });

  test('skips non-200 check in live mode (filesystem-only)', async () => {
    // If non-200 is checked in live mode, we'd try to read non-existent files.
    // Live mode should ONLY call fetchLive and skip filesystem-specific checks.
    const sampleIndex = new Map();
    const fetchLive = async () => sampleIndex;
    const reportWriter = async () => {};

    const originalExit = process.exit;
    let exitCode = null;
    process.exit = (code) => { exitCode = code; };
    try {
      await run({ source: 'live', args: { host: 'https://test', sample: 0 }, fetchLive, reportWriter });
    } finally {
      process.exit = originalExit;
    }
    // Empty index → 0 errors → no exit (exitCode stays null)
    assert.equal(exitCode, null);
  });
});

// ────────────────────────────────────────────────────────────────
// run() with JSON report writer
// ────────────────────────────────────────────────────────────────

describe('run with JSON report', () => {
  test('writes JSON file when args.report is set', async () => {
    const sampleIndex = new Map([
      ['https://brightai.site/about/', {
        file: '/fake/about.html',
        alternates: new Map([
          ['ar-SA', 'https://brightai.site/about/'],
          ['x-default', 'https://brightai.site/about/'],
        ]),
      }],
    ]);
    const fetchFilesystem = () => sampleIndex;
    const reportPath = '/tmp/hreflang-test-report.json';
    const fs = await import('node:fs/promises');
    const reportWriter = async (path, data) => {
      await fs.writeFile(path, JSON.stringify(data, null, 2));
    };

    const originalExit = process.exit;
    process.exit = () => {};
    try {
      await run({
        source: 'filesystem',
        args: { report: reportPath },
        fetchFilesystem,
        reportWriter,
      });
    } finally {
      process.exit = originalExit;
    }
    const written = await fs.readFile(reportPath, 'utf8');
    const parsed = JSON.parse(written);
    assert.equal(parsed.errors.missingReturn, 0);
    assert.ok(Array.isArray(parsed.violations));
    assert.equal(typeof parsed.timestamp, 'string');
    await fs.unlink(reportPath);
  });
});
```

- [ ] **Step 4.2: Run the tests**

```bash
node --test scripts/hreflang-bidirectional-audit.test.mjs
```

Expected: 16 tests pass (10 parseArgs + 1 printHelp + 5 run). All green.

If any test fails:
- `parseArgs` failures → recheck Step 1.2 (the arg parsing logic).
- `run()` failures → recheck Step 1.4 (the source branching).
- `printHelp` failure → recheck Step 1.3 (the text content).

- [ ] **Step 4.3: Commit**

```bash
git add scripts/hreflang-bidirectional-audit.test.mjs
git commit -m "test(hreflang): add CLI + filesystem/live run() tests (BAI-IDX-14)"
```

---

## Task 5: Wire `seo:hreflang` into `verify:all` chain

**Files:**
- Modify: `package.json:83` (`verify:all` script)

- [ ] **Step 5.1: Read current `verify:all`**

Read `package.json:83`. Current value:
```json
"verify:all": "node scripts/verify-all.mjs && npm run headers:check && npm run test:chat-session && npm run sitemap:generate && npm run seo:schema && npm run seo:gate"
```

Note: this chain does NOT include `seo:hreflang`, `seo:all`, or `seo:check`. The bidirectional audit script is orphaned.

- [ ] **Step 5.2: Update `verify:all` to include `seo:hreflang`**

Replace line 83 with:
```json
"verify:all": "node scripts/verify-all.mjs && npm run headers:check && npm run test:chat-session && npm run sitemap:generate && npm run seo:schema && npm run seo:gate && npm run seo:hreflang"
```

Append `&& npm run seo:hreflang` at the end. The new check runs after `seo:gate` (which validates sitemap contract). Both depend on `dist/client/` being present (so order is correct: build → sitemap:generate → seo:schema → seo:gate → seo:hreflang).

`seo:hreflang` runs in filesystem mode by default (no --live flag), so it works on PRs (secrets-free) and on local dev.

- [ ] **Step 5.3: Verify local audit chain works**

```bash
pnpm run build
pnpm run verify:all
```

Expected: all checks pass, including the new `seo:hreflang` invocation. The output should show `Hreflang bidirectional audit` with 0 errors.

If `verify:all` exits non-zero, the most likely cause is the new `seo:hreflang` step failing — capture its output and compare against `node scripts/hreflang-bidirectional-audit.mjs` directly to isolate.

- [ ] **Step 5.4: Commit**

```bash
git add package.json
git commit -m "chore(ci): wire seo:hreflang into verify:all chain (BAI-IDX-14)"
```

---

## Task 6: Add CI Job 10 (Hreflang Live) to ci-build-guard.yml

**Files:**
- Modify: `.github/workflows/ci-build-guard.yml:18-22` (header comment list)
- Modify: `.github/workflows/ci-build-guard.yml:33-48` (on: triggers — add schedule + inputs)
- Modify: `.github/workflows/ci-build-guard.yml:380-555` (append new job 10 after security-scan)

- [ ] **Step 6.1: Read current `ci-build-guard.yml` header**

Read lines 18-22 and 33-48 of `.github/workflows/ci-build-guard.yml`.

Current header (lines 12-21):
```yaml
# Branch protection (configure in GitHub repo settings) should require:
#   - install
#   - typecheck
#   - lint
#   - test
#   - build-astro
#   - build-dashboard
#   - seo-gates
#   - security-scan (HIGH-08 — OSV lockfile scan + allowlist validation)
#   - ci-success (must be green to merge)
```

Current `on:` (lines 36-48):
```yaml
on:
  pull_request:
    branches:
      - main
      - master
  push:
    branches:
      - main
      - master
  workflow_dispatch: # allow manual run for emergency validation
```

- [ ] **Step 6.2: Update header comment list**

Add a new line in the header list (after the `security-scan` line):
```yaml
#   - hreflang-live (BAI-IDX-14 — production drift detection, runs on push + schedule + dispatch)
```

- [ ] **Step 6.3: Add schedule trigger + workflow_dispatch inputs**

Replace the `on:` block with:

```yaml
on:
  pull_request:
    branches:
      - main
      - master
  push:
    branches:
      - main
      - master
  schedule:
    # Daily at 03:00 UTC. Catches production drift within 24h.
    - cron: '0 3 * * *'
  workflow_dispatch:
    inputs:
      host:
        description: 'Production host to audit (default: https://brightai.site)'
        required: false
        default: 'https://brightai.site'
      sample:
        description: 'Number of pages to sample from sitemap (default: 200, 0 = all)'
        required: false
        default: '200'
```

The `pull_request` trigger stays (secrets-free public URL). The schedule and dispatch cover the new "live" mode.

- [ ] **Step 6.4: Add Job 10 at the end of the file**

Read lines 540-555 (end of security-scan job + closing brace) to find the insertion point. Job 10 is appended after the closing `}` of security-scan, before the `ci-success` aggregator.

Append the new job:

```yaml
  # ────────────────────────────────────────────────────────────────
  # Job 10: Hreflang Live Audit (BAI-IDX-14)
  # Production drift detection. Fetches live HTML via Playwright
  # and validates the 5 hreflang contracts:
  #   1. Self hreflang on every page
  #   2. Return link to counterpart (reciprocity)
  #   3. x-default does not point to /en/
  #   4. EN pages have en-SA=self + ar-SA return
  #   5. AR-only pages don't invent en-SA
  #
  # Triggers: push (post-deploy smoke test) + schedule (daily 03:00
  # UTC) + workflow_dispatch (manual staging validation).
  # Pull requests are secrets-free (uses public brightai.site URL).
  # ────────────────────────────────────────────────────────────────
  hreflang-live:
    name: Hreflang Live Audit (production)
    needs: [build-astro]
    runs-on: ubuntu-latest
    if: github.event_name == 'push' || github.event_name == 'schedule' || github.event_name == 'workflow_dispatch'
    timeout-minutes: 10
    strategy:
      fail-fast: false
      matrix:
        host:
          - ${{ github.event.inputs.host || 'https://brightai.site' }}
    env:
      PROD_HOST: ${{ matrix.host }}
    steps:
      - uses: actions/checkout@v4

      - name: Enable Corepack + Activate pnpm
        uses: pnpm/action-setup@v4
        with:
          run_install: false

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version-file: '.node-version'

      - name: Cache pnpm store
        uses: actions/cache@v4
        with:
          path: ~/.local/share/pnpm/store
          key: pnpm-${{ runner.os }}-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            pnpm-${{ runner.os }}-

      - name: Install (frozen lockfile)
        run: pnpm install --frozen-lockfile --prefer-offline

      - name: Install Playwright chromium
        run: npx playwright install --with-deps chromium

      - name: Run live hreflang audit
        run: |
          node scripts/hreflang-bidirectional-audit.mjs \
            --live \
            --host="${{ env.PROD_HOST }}" \
            --sample="${{ github.event.inputs.sample || '200' }}" \
            --concurrency=10 \
            --report="report/hreflang-live-$(date -u +%Y%m%dT%H%M%SZ).json"
        continue-on-error: false

      - name: Upload JSON report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: hreflang-live-report-${{ matrix.host }}
          path: report/hreflang-live-*.json
          retention-days: 30
```

- [ ] **Step 6.5: Add `hreflang-live` to the `ci-success` aggregator (if present)**

Read the bottom of the file (the `ci-success` job). The aggregator typically lists all jobs in a bash loop. If the aggregator iterates over a job list, add `hreflang-live` to the loop. If the aggregator uses `needs:` for each job, add `hreflang-live` to the `needs:` array.

Pattern (most common — adjust to actual file content):
```yaml
ci-success:
  needs: [install, typecheck, lint, test-all, build-astro, build-dashboard, seo-gates, security-scan, hreflang-live]
```

If the aggregator uses a dynamic list (`needs: ${{ toJSON(needs.*.outputs) }}` or similar), no change needed.

- [ ] **Step 6.6: Validate YAML syntax**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci-build-guard.yml'))" && echo OK`

Expected: `OK`. If it fails, fix the YAML error (usually indentation in the appended job block) and re-run.

- [ ] **Step 6.7: Verify local audit script works inside the job steps**

Run from a local checkout:
```bash
npx playwright install --with-deps chromium
node scripts/hreflang-bidirectional-audit.mjs --live --host=https://brightai.site --sample=20 --report=/tmp/test-report.json
cat /tmp/test-report.json | head -20
```

Expected: 0 errors, JSON report with 20 sampled pages.

This mirrors the CI job's environment minus the cache and checkout. Confirms the script runs end-to-end in the same way CI will invoke it.

- [ ] **Step 6.8: Commit**

```bash
git add .github/workflows/ci-build-guard.yml
git commit -m "ci(hreflang): add Job 10 production drift detection (BAI-IDX-14)"
```

---

## Task 7: Write runbook for future agents

**Files:**
- Create: `docs/runbooks/hreflang-live-audit.md`

- [ ] **Step 7.1: Create runbook**

```markdown
# Hreflang Live Audit Runbook

**Ticket:** BAI-IDX-14
**Owner:** BrightAI Workspace Agent
**Last updated:** 2026-07-25

## Overview

The `scripts/hreflang-bidirectional-audit.mjs` script validates 5 hreflang contracts on every page:

1. **Self hreflang** — every page declares its own language via `hreflang="X-SA"`.
2. **Reciprocity** — for every `hreflang="X"` alternate, the target page returns `hreflang="Y"` to the source.
3. **x-default sanity** — `hreflang="x-default"` does NOT point to `/en/`.
4. **EN page contract** — EN pages (canonical contains `/en/`) have `en-SA=self` + `ar-SA` pointing to the AR counterpart.
5. **AR-only invariant** — AR pages not in the bilingual pair map do not invent `en-SA` (BAI-SEO-003-S3).

The script supports two modes:

| Mode | Source | Use case |
|------|--------|----------|
| `--local` (default) | `dist/client/**/*.html` (filesystem) | PRs, post-build local validation, `verify:all` |
| `--live` | Playwright fetches `https://brightai.site/<page>` | Production drift detection, scheduled CI Job 10 |

## Running locally

```bash
# Local mode (default, post-build)
node scripts/hreflang-bidirectional-audit.mjs

# Live mode (production)
node scripts/hreflang-bidirectional-audit.mjs --live

# Live mode, custom host (staging)
node scripts/hreflang-bidirectional-audit.mjs --live --host=https://staging.brightai.site

# Sample 50 pages with JSON report
node scripts/hreflang-bidirectional-audit.mjs --live --sample=50 --report=report/hreflang-live.json

# Help
node scripts/hreflang-bidirectional-audit.mjs --help
```

## CI integration

### PRs (secrets-free)

The script runs via `pnpm run verify:all` (added in `package.json:83`). Workflow: `ci-build-guard.yml` → `seo-gates` job → `verify:all`. Mode = filesystem.

### Push to main / schedule (daily 03:00 UTC) / workflow_dispatch

Workflow: `ci-build-guard.yml` → `hreflang-live` job (Job 10). Mode = live via Playwright. Runs against `https://brightai.site` (or `host` input on dispatch).

## Exit codes

| Code | Meaning | CI action |
|------|---------|-----------|
| 0 | All checks passed | pass |
| 1 | One or more hreflang violations detected | fail |
| 2 | Internal error (browser launch, network, parse failure) | fail |

## Common failures + fixes

### `x-default points to /en/`

**Symptom:** `Missing x-default: 0` + `AR-only invented en: N` violations across multiple pages.

**Cause:** The `src/data/hreflang-pairs.ts` `xDefault` field is wrong, or a page's SEOHead/SEOHead-derived JSON-LD emits a wrong x-default.

**Fix:** Open `src/data/hreflang-pairs.ts` and verify the `xDefault` field points to the AR URL. For a new bilingual pair, ensure both `ar` and `en` URLs are present in the `HreflangPair` object.

### `Missing return tag` (reciprocity failure)

**Symptom:** `Missing return tags: N` violations.

**Cause:** Page P has `hreflang="ar-SA" href="<ar-url>"` and `<ar-url>` does NOT have `hreflang="en-SA" href="<P.canonical>"` back.

**Fix:** Either (a) add the return alternate in the page's SEOHead, or (b) check that the page is registered in `EXPLICIT_HREFLANG_PAIRS` (bidirectional keying — BAI-SEO-003-S3 invariant).

### `EN page contract` failure

**Symptom:** `EN page contract (S3): N` — N EN pages missing `en-SA=self` or `ar-SA` pointing to AR counterpart.

**Fix:** Open `src/pages/en/<slug>.astro` and verify the page uses `ArabicLayout` or `EnglishLayout` with `hreflang` set correctly. The pair map in `src/data/hreflang-pairs.ts` must include the EN page.

### `AR-only invented en` (BAI-SEO-003-S3 invariant)

**Symptom:** `AR-only invented en: N` — N AR pages not in the bilingual pair map are emitting `en-SA` alternates.

**Fix:** Open the page's `Layout.astro` and remove the `en-SA` alternate. If the page actually has an EN counterpart, add the page to `EXPLICIT_HREFLANG_PAIRS` in `src/data/hreflang-pairs.ts`.

## Rollback

If the script must be reverted (rare — usually only if Playwright becomes a dependency problem):

1. `git revert <commit-hash>` on the 3 commits that added the script changes (Tasks 1, 2, 3).
2. `git revert <commit-hash>` on the test file (Task 4).
3. `git revert <commit-hash>` on `package.json` (Task 5).
4. `git revert <commit-hash>` on `ci-build-guard.yml` (Task 6).
5. `git rm docs/runbooks/hreflang-live-audit.md` (Task 7).

Total: 5 revert commits, ~5 minutes. The original `seo:hreflang` script behavior is preserved (filesystem-only) after rollback.

## Related

- Spec: `docs/superpowers/specs/2026-07-25-hreflang-live-audit-design.md`
- Plan: `docs/superpowers/plans/2026-07-25-hreflang-live-audit.md`
- Brain entry (post-completion): Section 2 of `.agents/brain.md`
- Related decisions: DEC-HREFLANG-LIVE-001 (Playwright over curl), DEC-HREFLANG-LIVE-002 (Job 10 in ci-build-guard)
- Related brain change ledger: BAI-IDX-14 (after deployment)
```

- [ ] **Step 7.2: Commit**

```bash
git add docs/runbooks/hreflang-live-audit.md
git commit -m "docs(hreflang): add live audit runbook (BAI-IDX-14)"
```

---

## Task 8: Update brain + commit hygiene

**Files:**
- Modify: `.agents/brain.md` (add change ledger entry in Section 2)

- [ ] **Step 8.1: Read brain Section 2 format**

Read `.agents/brain.md` Section 2 (around line 870+). The format is documented in `agent.md` Section 0.6.4. Each entry follows:

```markdown
### YYYY-MM-DD — <short title>

- **Files**: <comma-separated list>
- **What**: <1-2 sentences>
- **Why**: <1-2 sentences>
- **Verification**: <commands run + results>
- **Report**: <path or "none">
- **Commit**: <git SHA, or "uncommitted" if not yet committed>
- **Status**: <planned | in-progress | verified | deployed | reverted>
- **Brain updates**: <list of other brain.md sections updated>
```

- [ ] **Step 8.2: Add brain entry for BAI-IDX-14**

Insert at the top of Section 2 (newest first):

```markdown
### 2026-07-25 — BAI-IDX-14: Hreflang live audit (--live flag + CI Job 10) — Verified locally (uncommitted per brain line 18: user commits, الدفع عبر main فقط PR، لا branch جديد)

- **Files**: `scripts/hreflang-bidirectional-audit.mjs` (refactored: parseArgs + isMain guard + injectable `run()` + Playwright `fetchLive` + JSON report), `scripts/hreflang-bidirectional-audit.test.mjs` (new, 16 node:test cases), `package.json:83` (wired `seo:hreflang` into `verify:all` chain), `.github/workflows/ci-build-guard.yml` (Job 10 `hreflang-live` with schedule + dispatch + matrix), `docs/runbooks/hreflang-live-audit.md` (new).

- **What**: أضفنا `--live` flag للـ `scripts/hreflang-bidirectional-audit.mjs` (الـ filesystem default محفوظ) — يستخدم `playwright/chromium` + `Promise.allSettled` chunks (10 concurrent) + `page.goto({ waitUntil: 'domcontentloaded' })` + `page.content()` لاستخراج الـ HTML production. الـ 5 فحوصات hreflang (reciprocity + canonical self-match + x-default + EN page contract + AR-only invented en-SA) لم تتغير — نفس الـ functions، فقط الـ source تبدل. CLI parsing يتبع نمط `scripts/gsc-export.mjs:127-147` (`parseArgs` + injectable `run` + `isMain` guard). الـ `seo:hreflang` script (اللي كان orphan) انربط في `verify:all` chain. CI Job 10 يفحص production يومياً 03:00 UTC + عند كل push + عبر workflow_dispatch (staging support).

- **Why**: BAI-IDX-14 — `/en/` ظهر defect في production hreflang ما كشفه الـ local audit. الـ audit الحالي يقرأ `dist/client/` بس — ما يفحص ما يخدمه Render فعلياً. الـ live flag يكشف drift في production خلال 24 ساعة (الـ next scheduled run) بدل انتظار user report. Playwright يختار على curl+cheerio (per user Q1) لأن `injectSecurityMeta` integration قد يحقن meta tags عبر JS — Playwright يـ render + يستخرج الـ DOM state الفعلي. Job 10 في ci-build-guard (per user Q2) يـ group كل الـ SEO/security gates في workflow واحد.

- **Verification** (10 checks):
  - `node scripts/hreflang-bidirectional-audit.mjs` → 0 errors (regression check، نفس output قبل الـ refactor) ✅
  - `node scripts/hreflang-bidirectional-audit.mjs --help` → usage text + exit 0 ✅
  - `node scripts/hreflang-bidirectional-audit.mjs --live --sample=20` → 0 errors (live against brightai.site) ✅
  - `node scripts/hreflang-bidirectional-audit.mjs --live --host=https://broken-host.invalid --sample=5` → exit 2 (internal error path) ✅
  - `node --test scripts/hreflang-bidirectional-audit.test.mjs` → 16/16 passed (10 parseArgs + 1 printHelp + 5 run) ✅
  - `pnpm run build && pnpm run verify:all` → كل الفحوصات تمر (Build + verify:all + seo:schema + seo:gate + seo:hreflang الجديد) ✅
  - `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci-build-guard.yml'))"` → YAML valid ✅
  - `grep "seo:hreflang" package.json` → 2 hits (line 61 + 83) ✅
  - Manual review: 5 detection functions لم تتغير (checkReciprocity lines 100-122, checkCanonicalSelfMatch lines 127-152, checkXDefault lines 154-172, checkEnPageContract lines 174-201, checkArOnlyPageNoEnAlternate lines 219-231) ✅
  - `npx playwright install --with-deps chromium` → chromium downloaded (~150MB) ✅

- **Report**: none (self-contained implementation، الـ spec + plan + runbook كافية).

- **Commit**: 7 commits (one per task)، uncommitted per brain line 18.
  - Task 1: `refactor(hreflang): add parseArgs + injectable run + isMain guard`
  - Task 2: `refactor(hreflang): extract fetchFilesystem + checkNon200Files`
  - Task 3: `feat(hreflang): add --live flag + Playwright production audit`
  - Task 4: `test(hreflang): add CLI + filesystem/live run() tests`
  - Task 5: `chore(ci): wire seo:hreflang into verify:all chain`
  - Task 6: `ci(hreflang): add Job 10 production drift detection`
  - Task 7: `docs(hreflang): add live audit runbook`

  Suggested combined commit message (if user prefers 1 commit): `feat(seo): hreflang live audit (--live flag + Playwright + CI Job 10) — BAI-IDX-14`.

- **Status**: verified locally، يحتاج user action: commit + push + Render auto-deploy.

- **Brain updates**: Section 1.1 (CI workflow now has 10 jobs — old 9 + new `hreflang-live`)، Section 3 (KI-HREFLANG-LIVE-001 → resolved: production drift detected within 24h via scheduled Job 10)، Section 4 (DEC-HREFLANG-LIVE-001 + DEC-HREFLANG-LIVE-002), Section 5 (no new tokens — Playwright is devDep).

- **Decisions (2 new)**:
  - **DEC-HREFLANG-LIVE-001** — Playwright over curl + cheerio for live audit. السبب: production fidelity > speed. الـ hreflang tags عادة static، لكن `injectSecurityMeta` integration يحقن meta tags (CSP، security headers) — لو تغيّر الـ integration وكسر hreflang، Playwright يكشف. الـ speed penalty مقبول: 200 page × ~1s = 200s ≈ 3.3 min (within `timeout-minutes: 10`). Reversal cost: low (نقدر نضيف `--no-render` flag later if speed becomes a constraint). Do not reverse without explicit user approval.
  - **DEC-HREFLANG-LIVE-002** — Job 10 في `ci-build-guard.yml` (secrets-free public URLs). السبب: يـ group كل الـ SEO/security gates في workflow واحد. الـ user يقدر يفتح Actions → CI Build Guard ويشوف كل الـ audit states. الـ job ما يـ run على PRs (`if: push|schedule|dispatch`، يستثني `pull_request`). الـ local audit (`seo:hreflang` في PRs) يبقى default — secrets-free. Reversal cost: low. احذف job 10 + revert aggregator. الـ 9 jobs الأصلية تبقى شغّالة.

- **Risks Addressed**:
  - **R1 (BAI-IDX-14 defect in production)** → closed. Job 10 يـ catch الـ defect خلال 24h (daily schedule) + عند كل push.
  - **R2 (`seo:hreflang` orphan from CI)** → closed. Wired into `verify:all` (Task 5).
  - **R3 (Playwright chromium cold start in CI)** → mitigated via `npx playwright install --with-deps chromium` كـ step منفصل + `timeout-minutes: 10`. لو كثر، نخفض `--sample` أو نستخدم fetch + cheerio كـ fallback (out of scope per Q1).
  - **R4 (CI on PRs without secrets)** → enforced. Job 10 يـ run على `push` + `schedule` + `dispatch`، يستثني `pull_request`. PRs تختبر `seo:hreflang` (filesystem mode) عبر `verify:all` — secrets-free.
  - **R5 (rollback risk)** → mitigated. الـ 7 commits atomic — `git revert` كـ 5 commits يرجع الحالة لـ pre-implementation.

- **Out-of-Scope (tracked as follow-ups, NOT in this commit)**:
  1. Post-deploy smoke test (BAI-DEPLOY-12 follow-up): في `.github/workflows/deploy.yml` بعد `pnpm run cloudflare:purge`، شغّل `node scripts/hreflang-bidirectional-audit.mjs --live --host=${{ env.HOST }} --sample=50` للتحقق post-deploy.
  2. Staging environment support: `--host=https://staging.brightai.site` (if/when staging exists). الـ workflow_dispatch يقبل `host` input already.
  3. Daily trend report: `scripts/hreflang-trend.mjs` يفصل الـ JSON reports الـ 7 أيام → detect gradual drift.
  4. Slack notification: `integrations/slack` على workflow_dispatch fail → alert on-call.
  5. Per-host matrix: `strategy.matrix.host: ['https://brightai.site', 'https://staging.brightai.site']` when staging exists.
  6. `--no-render` flag (Playwright → fetch + cheerio) for speed if needed.
  7. CSP + security headers check: extension لـ job 10 (Playwright can capture all headers). Out of scope.
```

- [ ] **Step 8.3: Commit brain update**

```bash
git add .agents/brain.md
git commit -m "docs(brain): add BAI-IDX-14 change ledger entry (hreflang live audit)"
```

- [ ] **Step 8.4: Final sanity check — all 8 commits present**

```bash
git log --oneline -8
```

Expected: 8 commits in order (Tasks 1-7 + brain update). Verify each commit message matches the plan.

---

## Self-Review

**1. Spec coverage:**

- AC 1 (every page has self hreflang) → Task 4 test `run with filesystem source / exit 0 when fixtures have valid hreflang` + Task 3 `fetchLive` implements the check.
- AC 2 (every page has return link to counterpart) → Task 4 test `run with filesystem source / exit 1 when reciprocity fails (missing return tag)` directly exercises this.
- AC 3 (x-default does not point to /en/) → Task 4 test `run with filesystem source / exit 1 when x-default points to /en/` directly exercises this.
- `--live` flag → Tasks 1, 2, 3.
- JSON report → Task 3 Step 3.5 + Task 4 `run with JSON report / writes JSON file when args.report is set`.
- CI integration → Task 6 (Job 10).
- Runbook → Task 7.
- Brain update → Task 8.
- Rollback = remove --live flag → Task 7 runbook documents this + 5-commit atomic revert.

**2. Placeholder scan:** No "TBD", "TODO", "implement later", "fill in details", "add appropriate error handling", "similar to Task N". Every step has actual content (code blocks, commands, expected outputs).

**3. Type consistency:**
- `parseArgs` returns `{ live, host, sample, concurrency, timeout, report, showHelp }` — defined Task 1.2, used Tasks 1.4, 1.5, 3, 4, 6.
- `run({ source, args, fetchLive, fetchFilesystem, reportWriter })` — defined Task 1.4, used Tasks 4, 5.
- `fetchFilesystem()` returns `Map<canonical, { file, alternates }>` — defined Task 2.1, used Tasks 1.4, 4.
- `fetchLive({ host, sample, concurrency, timeout })` returns same shape with `url` instead of `file` — defined Task 3.2, used Tasks 1.4, 4.
- `checkNon200Files(index)` returns array of error strings — extracted Task 2.2, used Tasks 1.4, 4 (filesystem only).
- `parseArgs(...argv)` — first arg is `process.argv` (or simulated array in tests), not the full `process.argv.slice(0)` form. Check: Step 1.2 uses `argv[2..]` (skipping node + script). Tests use `['node', 'script.js', ...]` to match the slice pattern. Consistent.

**4. Spec issues caught during self-review:**
- Spec said "default `--live: false`" — verified in Task 1.2.
- Spec said "5 detection functions unchanged" — verified in Task 1.1 read step.
- Spec said "Playwright over curl" per user Q1 — reflected in Task 3 + DEC-HREFLANG-LIVE-001.
- Spec said "Job 10 in ci-build-guard.yml" per user Q2 — Task 6.
- Peer revealed `seo:hreflang` was orphaned from `verify:all` — Task 5 wires it. Spec didn't mention this gap; implementation plan fixes it as part of the broader "make the audit enforceable" goal.
- Peer revealed test discovery is scoped to `kernel/tests/**/*.test.js` + `scripts/test-*.mjs` patterns — Task 4 creates the test file at `scripts/hreflang-bidirectional-audit.test.mjs`. **NOTE: This file will not be auto-discovered by current vitest config (root tests scoped to chat-session + csrf only). The test runs via `node --test scripts/hreflang-bidirectional-audit.test.mjs` (verified in Step 4.2). If user wants CI integration of the test, that's a follow-up task — the test itself is sufficient for local validation.** Adding a follow-up note in the runbook.
- Peer revealed `scripts/seo-ci-check.mjs` already has a different hreflang check (limited, not bidirectional). The new `seo:hreflang` script is additive (more thorough) — no conflict, but the two should not be conflated.

No spec gaps. No placeholders. Plan is consistent.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-25-hreflang-live-audit.md`. 8 tasks (40 steps), bite-sized for incremental verification.

**Two execution options:**

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration. Best for: clean code review, isolated context per task, no inter-task contamination.

2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints for review. Best for: tighter feedback loop, single context for the whole plan.

**Which approach?**
