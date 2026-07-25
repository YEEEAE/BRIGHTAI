---
file: spec
project: BrightAI — Saudi AI Safety OS
date: 2026-07-25
topic: BAI-IDX-14 — Hreflang Live Audit (production surface drift detection)
author: BrightAI Workspace Agent
status: draft (awaiting user review)
related_ticket: BAI-IDX-14
depends_on: BAI-SEO-003-S3 (bidirectional pair map), BAI-SEO-003-S1 (AR-only cleanup)
---

# Spec: Hreflang Live Audit (--live flag + CI Job 10)

## 1. Context

### The defect (BAI-IDX-14 ticket)

`/en/` على brightai.site ظهر defect في hreflang tags ما كان مكتشف في الـ local audit. الـ local audit (`scripts/hreflang-bidirectional-audit.mjs`) يقرأ `dist/client/**/*.html` فقط — يفحص بنية الـ HTML المُولّد، لكن **لا يفحص** ما يخدمه Render فعلاً. لو Render قدّم build قديم، أو Cloudflare يـ cache HTML خاطئ، أو `injectSecurityMeta` حقن meta tags مكسورة — الـ local audit يعدّي لكن production مكسور.

**AC 1**: كل صفحة لها self hreflang.
**AC 2**: كل صفحة لها return link للـ counterpart.
**AC 3**: x-default لا يشير إلى /en/.

### What's already there

- `scripts/hreflang-bidirectional-audit.mjs` (326 سطر) — 5 فحوصات: reciprocity + canonical self-match + x-default + EN page contract + AR-only invented en-SA. يشتغل على `dist/client/`.
- `scripts/sitemap-audit-utils.mjs` — `extractAlternateHreflangLinks(html)` + `extractCanonicalHref(html)` + `hasNoindexDirective(html)`. الـ parser لا يعتمد على source (filesystem vs HTTP).
- `src/data/hreflang-pairs.ts` — pair map bidirectionally keyed (BAI-SEO-003-S3). يضمن 7 pairs صحيحة في البناء.
- `package.json` → `seo:hreflang: node scripts/hreflang-bidirectional-audit.mjs` — مربوط بسلسلة `seo:all` بس، ما في CI workflow مخصص.
- `playwright@^1.61.1` — في devDeps بس. `chromium` يحتاج `npx playwright install chromium` (one-time).

### What's missing

- `--live` flag في السكربت
- CI job يـ run الـ live audit بشكل دوري
- الـ local audit يبقى default (no breaking change)

## 2. Goal

**Primary**: كشف hreflang defect في production خلال 24 ساعة (الـ next scheduled run) بدل انتظار user report.

**Secondary**: حماية regression في production بعد كل deploy.

**Tertiary**: تمكين user من تشغيل الـ live audit يدوياً (`workflow_dispatch`) للتحقق من staging environments.

## 3. Non-Goals

- **No API call** لـ brightai.site من production side (الـ audit server-side → brightai.site = same network trust boundary)
- **No new public page** على brightai.site (الـ audit reads existing public HTML)
- **No change** لـ scripts/hreflang-bidirectional-audit.mjs detection logic (نفس الـ 5 فحوصات، فقط الـ source يتغير)
- **No new package** (Playwright موجود)
- **No broken PR check** (local audit يبقى للـ PRs secrets-free)

## 4. Design

### 4.1 CLI surface

```bash
# Default (unchanged — local audit)
node scripts/hreflang-bidirectional-audit.mjs

# Live audit against production
node scripts/hreflang-bidirectional-audit.mjs --live --host=https://brightai.site

# Live audit with custom sample size + concurrency
node scripts/hreflang-bidirectional-audit.mjs --live --host=https://brightai.site --sample=50 --concurrency=5

# Help
node scripts/hreflang-bidirectional-audit.mjs --help
```

**Flag matrix**:

| Flag | Default | Description |
|---|---|---|
| `--live` | `false` | تبديل من filesystem → HTTP fetch عبر Playwright |
| `--host` | `https://brightai.site` | الـ base URL للـ live audit (staging support) |
| `--sample` | `200` | عدد الصفحات من sitemap للـ sample (1-N). `0` = all (لـ debug فقط) |
| `--concurrency` | `10` | عدد pages parallel عبر Playwright contexts (يتفادى DoS على origin) |
| `--timeout` | `15000` | per-page timeout بـ ms (default يكفي لـ static pages) |
| `--report` | `report/hreflang-live-<date>.json` | مسار تقرير JSON (لـ CI artifact upload) |

### 4.2 Detection logic (unchanged)

نفس الـ 5 فحوصات من السكربت الحالي:

1. **Reciprocity**: لكل `<link rel="alternate" hreflang="X" href="Y">` على page P، الـ page Y يجب أن تـ return بـ `<link rel="alternate" hreflang="Z" href="<P.canonical>">` (Z = اللغة المعاكسة). Self-references (`href === canonical`) تُستثنى.
2. **Canonical self-match**: الـ `<link rel="canonical">` يجب أن يطابق الـ `lang` self hreflang URL (literal equality).
3. **x-default sanity**: `<link rel="alternate" hreflang="x-default">` يجب ألا يشير إلى `/en/`. (الـ Arabic هو default per `src/data/hreflang-pairs.ts` xDefault field.)
4. **EN page contract**: كل EN page (canonical contains `/en/`) يجب أن:
   - يحتوي `en-SA=self`
   - يحتوي `ar-SA` alternative يشير إلى الـ AR counterpart
5. **AR-only invented en-SA**: كل AR page ما في pair map يجب ألا يحتوي `en-SA` (لا EN peer مُخترَع).

### 4.3 Source abstraction (--live path)

**Current (filesystem)**: `walkHtml(CLIENT_ROOT)` → `readFile(file, 'utf8')` → `extractAlternateHreflangLinks(html)`.

**New (--live path)**:
```javascript
async function fetchPageHtml(context, url) {
  const page = await context.newPage();
  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    if (!response || response.status() >= 400) {
      return { url, status: response?.status() ?? 0, html: null, error: 'http_error' };
    }
    const html = await page.content();
    return { url, status: response.status(), html, error: null };
  } finally {
    await page.close();
  }
}
```

**Concurrency control**: `Promise.allSettled` على chunks. كل chunk = N URLs. الـ default chunk size = `--concurrency` (10). نستخدم `Promise.allSettled` (مو `Promise.all`) عشان URL واحد يفشل ما يوقف الـ audit.

**Sampling**: `pages = sitemapUrls.slice(0, sample)`. الـ user يقدر يمرر `--sample=0` لـ all pages (debug only — يحذّر في الـ output).

**Static asset blocking**: نـ abort requests على `**/*.{css,js,woff2,png,jpg,svg,ico}` عبر `context.route()` — يـ save bandwidth + time. الـ page navigation يبقى.

### 4.4 Source abstraction (shared)

نستخرج `parsePage(html)` helper من `main()` الحالي → يعمل على `html` string. ثم نضيف wrapper `fetchPages(urls)` للـ live path. الـ detection logic (`checkReciprocity`, `checkCanonicalSelfMatch`, `checkXDefault`, `checkEnPageContract`, `checkArOnlyPageNoEnAlternate`) يبقى unchanged — يأخذ `Map<canonical, { file, alternates }>` كـ input، نمرر له `Map<canonical, { url, alternates }>` للـ live (نفس الـ shape، يختلف فقط الـ `file` property key).

### 4.5 Output format (live)

نفس format الـ current output + additions:

```
Hreflang bidirectional audit (live mode)
  Host:                https://brightai.site
  Pages sampled:       200 / 180
  Concurrency:         10
  Mode:                live
  ─────────────────────
  Missing return tags:    0
  Canonical mismatch:     0
  Missing x-default:      0
  EN page contract (S3):  0
  AR-only invented en:    0
  Non-200 responses:      0
  TOTAL ERRORS:           0

✅ All hreflang bidirectional checks passed (live).
```

**JSON report** (لـ CI artifact):
```json
{
  "host": "https://brightai.site",
  "sampledPages": 200,
  "totalPages": 180,
  "concurrency": 10,
  "timestamp": "2026-07-25T12:00:00.000Z",
  "errors": {
    "missingReturn": 0,
    "canonicalMismatch": 0,
    "missingXDefault": 0,
    "enPageContract": 0,
    "arOnlyInventedEn": 0,
    "non200Responses": 0
  },
  "violations": [
    {
      "url": "https://brightai.site/...",
      "type": "missing-return",
      "detail": "..."
    }
  ]
}
```

### 4.6 CI Job 10 — `hreflang-live`

**File**: `.github/workflows/ci-build-guard.yml` — نضيف job 10 + نضيفه للـ `ci-success` aggregator.

```yaml
hreflang-live:
  name: Hreflang Live Audit (production)
  runs-on: ubuntu-latest
  needs: [build-astro]
  if: github.event_name == 'push' || github.event_name == 'workflow_dispatch'
  timeout-minutes: 10
  strategy:
    fail-fast: false
    matrix:
      host: ['https://brightai.site']
  env:
    PROD_HOST: ${{ matrix.host }}
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
      with:
        run_install: false
    - uses: actions/setup-node@v4
      with:
        node-version: 22
        cache: 'pnpm'
    - run: pnpm install --frozen-lockfile
    - run: npx playwright install --with-deps chromium
    - name: Run live hreflang audit
      run: node scripts/hreflang-bidirectional-audit.mjs --live --host=${{ env.PROD_HOST }} --sample=200 --concurrency=10
      continue-on-error: false
    - name: Upload report
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: hreflang-live-report-${{ matrix.host }}
        path: report/hreflang-live-*.json
        retention-days: 30
```

**`ci-success` aggregator**:
- نضيف `hreflang-live` للـ `needs:` list
- نضيف `hreflang-live` للـ bash loop:
  ```bash
  echo "| $JOB_NAME | $CONCLUSION | $JOB_DISPLAY_NAME |" >> $GITHUB_STEP_SUMMARY
  ```
- تحديث الـ header comment list

**Schedule** (في نفس workflow، منفصل عن PR checks):
```yaml
on:
  schedule:
    - cron: '0 3 * * *'  # daily 03:00 UTC
  workflow_dispatch:
    inputs:
      host:
        description: 'Production host to audit'
        required: false
        default: 'https://brightai.site'
      sample:
        description: 'Number of pages to sample'
        required: false
        default: '200'
```

**Important**: الـ scheduled run على production لا يحتاج secrets (brightai.site public). الـ `workflow_dispatch` يقبل host override (staging environments). للـ PRs، الـ job **ما يـ run** (الـ `if:` يحدد `push` + `workflow_dispatch`، يستثني `pull_request`).

### 4.7 Local development

- `npx playwright install chromium` (one-time)
- `node scripts/hreflang-bidirectional-audit.mjs --live --host=https://brightai.site --sample=20 --concurrency=5` للـ sanity check

## 5. Files affected

| File | Change type | Description |
|---|---|---|
| `scripts/hreflang-bidirectional-audit.mjs` | modified | + 150 سطر (CLI parsing + Playwright wrapper + JSON report). Logic unchanged. |
| `.github/workflows/ci-build-guard.yml` | modified | + 50 سطر (job 10 + schedule + dispatch + aggregator update) |
| `package.json` | unchanged | `playwright@^1.61.1` already in devDeps |
| `docs/runbooks/hreflang-live-audit.md` | new | 50 سطر — how to run + troubleshoot (يخدم future agent) |

**No protected files modified**:
- `astro.config.mjs` ✅ untouched
- `render.yaml` ✅ untouched
- `src/data/site.ts` ✅ untouched
- `src/data/hreflang-pairs.ts` ✅ unchanged (BAI-SEO-003-S3 contract preserved)

## 6. Verification

### 6.1 Local regression check (existing behavior)

```bash
node scripts/hreflang-bidirectional-audit.mjs
# Expected: 0 errors (BAI-SEO-003-S3 invariants)
```

### 6.2 Live happy path

```bash
node scripts/hreflang-bidirectional-audit.mjs --live --host=https://brightai.site --sample=20
# Expected: 0 errors, 20 pages audited, 0 non-200 responses
```

### 6.3 Negative test (simulate the defect from the ticket)

```bash
# Manually inject a defect in dist/, build, run local audit
node scripts/hreflang-bidirectional-audit.mjs
# Expected: 1+ errors (catches the defect)
```

### 6.4 CI workflow validation

```bash
# Locally via act (if available)
act -j hreflang-live

# Or via GitHub UI: Actions → CI Build Guard → Run workflow → host: https://brightai.site
# Expected: 0 errors, JSON report artifact uploaded
```

### 6.5 Cross-version compatibility

- The 5 detection functions (extractAlternateHreflangLinks, extractCanonicalHref, hasNoindexDirective) are imported from `scripts/sitemap-audit-utils.mjs` — they accept an `html: string` parameter. Both filesystem (`readFile`) and HTTP (`page.content()`) produce the same string shape. **No parser changes needed**.

## 7. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Playwright chromium cold start fails in CI | Low (existing playwright deps) | High (job fails) | `npx playwright install --with-deps chromium` في step منفصل. الـ error message واضح (timeout, OOM, network). |
| Production render is slow → 15s timeout per page | Medium (Cloudflare cache miss) | Medium (false negative — page missed but logged as `non_200_response`) | الـ errors تظهر في الـ output بوضوح. نزيد timeout في follow-up لو needed. الـ default `--sample=200` يحد من الـ scope. |
| `ci-build-guard.yml` syntax breaks | Low | High (CI fail) | YAML validated via `python3 yaml.safe_load()`. Local dry-run via `act` if available. |
| Sitemap size grows beyond sample | Low (180 today, scale 1.5x over 6 months) | Low | `--sample=0` option for full audit. Per-host matrix for staging. |
| New `<link rel="alternate">` lang code introduced | Low | Low | الـ 5 checks hardcode the known 7 pairs. Any new lang needs pair map update. Out of scope (BAI-SEO-003-S3). |

## 8. Rollback

Per the brief: "ROLLBACK — أزل --live flag".

**Atomic rollback steps** (3 commits max):

1. **Revert `scripts/hreflang-bidirectional-audit.mjs`**: `git revert <commit-hash>`. الـ CLI يبقى بدون `--live` flag. الـ local audit يبقى default. الـ existing `seo:hreflang` script ما يتأثر.
2. **Revert `.github/workflows/ci-build-guard.yml`**: `git revert <commit-hash>`. الـ workflow file يرجع للـ 9 jobs الأصلية. Job 10 يختفي. `ci-success` aggregator يرجع للـ 8 jobs.
3. **Delete `docs/runbooks/hreflang-live-audit.md`**: `git rm <file>`. Documentation فقط.

**Total time**: 5 minutes. **Impact**: zero (revert to exact previous state).

## 9. DEC (Decisions)

### DEC-HREFLANG-LIVE-001: Playwright over curl + cheerio for live audit

- **Date**: 2026-07-25
- **Context**: BAI-IDX-14. خياران للـ live fetch: (A) `fetch` + `cheerio.load(html)`, (B) Playwright + `page.content()`. كلاهما يعطي `html: string` للـ parser. الـ difference: Playwright يـ render JS (catches any JS-injected hreflang) + handles cookies/redirects/Cloudflare challenges. curl + cheerio أسرع (5-10x) لكن لا يـ render JS.
- **Decision**: Playwright (per user choice in Q1).
- **Rationale**: Production fidelity > speed. الـ hreflang tags عادة static، لكن `injectSecurityMeta` integration في `astro.config.mjs` يحقن meta tags (CSP, security headers) — لو تغيّر الـ integration وكسر hreflang، Playwright يكشف. الـ speed penalty مقبول: 200 page × 1s/page = 200s ≈ 3.3 minutes (within `timeout-minutes: 10`).
- **Reversal cost**: Low. نقدر نضيف `--no-render` flag (uses fetch + cheerio) later if speed becomes a constraint.
- **Do not reverse** without explicit user approval.

### DEC-HREFLANG-LIVE-002: Job 10 in ci-build-guard.yml (secrets-free public URLs)

- **Date**: 2026-07-25
- **Context**: BAI-IDX-14. خياران للـ CI wireup: (A) workflow منفصل `.github/workflows/hreflang-live.yml`, (B) job 10 في `ci-build-guard.yml`. الـ difference: job في workflow منفصل أوضح في الـ PR UI، job في ci-build-guard يـ group كل الـ checks.
- **Decision**: Job 10 في ci-build-guard.yml (per user choice in Q2).
- **Rationale**: يـ group كل الـ SEO/security gates في workflow واحد. الـ user يقدر يفتح Actions → CI Build Guard ويشوف كل الـ audit states. **Important caveat**: Job 10 ما يـ run على PRs (`if: github.event_name == 'push' || 'workflow_dispatch'`). الـ local audit (`seo:hreflang` في PRs) يبقى default — secrets-free.
- **Reversal cost**: Low. حذف job 10 + revert aggregator. الـ 9 jobs الأصلية تبقى شغّالة.

## 10. Follow-up suggestions (out of scope)

1. **Staging environment support**: `--host=https://staging.brightai.site` (if/when staging exists). الـ workflow_dispatch يقبل `host` input.
2. **Slack notification**: `integrations/slack` على workflow_dispatch fail → alert on-call. Out of scope.
3. **Daily trend report**: `scripts/hreflang-drend.mjs` يفصل الـ JSON reports الـ 7 أيام → detect gradual drift. Out of scope.
4. **CSP + security headers check**: extension لـ job 10 (similar pattern, Playwright can capture all headers). Out of scope.
5. **Smoke test after deploy** (vs. scheduled): في `.github/workflows/deploy.yml` بعد `pnpm run cloudflare:purge`، شغّل `node scripts/hreflang-bidirectional-audit.mjs --live --host=${{ env.HOST }} --sample=50` للتحقق post-deploy. Out of scope (BAI-DEPLOY-12 follow-up).
6. **Per-host matrix**: `strategy.matrix.host: ['https://brightai.site', 'https://staging.brightai.site']` when staging exists. Out of scope.

## 11. Acceptance criteria

- [x] AC 1: Every page has self hreflang → enforced by `checkCanonicalSelfMatch`.
- [x] AC 2: Every page has return link to counterpart → enforced by `checkReciprocity` (with self-reference skip per BAI-SEO-003-S3).
- [x] AC 3: x-default does not point to /en/ → enforced by `checkXDefault` (already in current script).

**Verification commands** (per brief):
```bash
node scripts/hreflang-bidirectional-audit.mjs --live # 0 violations
node scripts/hreflang-bidirectional-audit.mjs       # 0 violations (regression)
curl /en/ | grep 'hreflang="en-SA"'                 # self exists (curl evidence)
```

**Definition of done**: `hreflang-bidirectional-audit.mjs --live` يفحص production ويفشل عند defect، مُتحقَّق بـ node + CI workflow validation.

---

**End of spec. الرجاء المراجعة قبل التنفيذ.**
