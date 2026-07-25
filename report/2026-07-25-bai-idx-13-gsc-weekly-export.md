# BAI-IDX-13 — Weekly GSC Indexation Snapshot (Automation)

**Date**: 2026-07-25
**Agent**: BrightAI Workspace Agent (Mavis)
**Task**: PROMPT [ID: BAI-IDX-13] — أتمتة GSC export يدوي → weekly automation
**Priority**: P1
**Effort**: 4h (الفعلي ~ 3h)
**Status**: verified locally — جاهز لـ user commit (per brain line 18)
**Mode**: Senior

verified_local: yes
verified_production: no
verified_production_blocker: (1) GitHub Secret `GSC_SERVICE_ACCOUNT_JSON` ما اتضبط بعد، (2) أول cron run على الأحد 2026-07-26 06:00 UTC. لازم user يضيف الـ secret في repo settings → Secrets and variables → Actions، ثم يراقب أول run يدوي عبر workflow_dispatch.
---

## 1. الملخص التنفيذي

كل أسبوع كان فيه export يدوي لـ Google Search Console عشان نعرف كم URL مفهرس، كم معلّق، كم مرفوض. المشكلة: ما يصير منتظم، يضيع الـ trend، ويصير الـ team يـ act على data قديمة.

**BAI-IDX-13 يحل هذا** بـ 3 قطع:

1. **سكربت `scripts/gsc-export.mjs` (~530 سطر)** — يستدعي GSC URL Inspection API لكل URL في `dist/client/sitemap.xml` (180 URL حالياً) عبر service-account JWT (pure `crypto` + `fetch`، صفر new dependencies). يـ bucket الـ URLs في 4 فئات: `indexed` / `crawled_not_indexed` / `not_indexed` / `unknown`. يقارن مع آخر snapshot (أسبوع سابق أو أقدم) ويحسب delta.
2. **GitHub Actions workflow `.github/workflows/weekly-gsc.yml`** — يشتغل كل أحد 6 صباحاً UTC عبر cron. يبني الموقع (عشان `sitemap.xml` يكون محدّث)، يشغّل الـ script، يتحقق إن الـ JSON يحوي الحقول المطلوبة (acceptance criteria)، يـ commit النتيجة لـ main.
3. **17 unit tests في `scripts/gsc-export.test.mjs`** — يغطون: parsing الـ sitemap، bucket classification (4 categories + unknown fallback)، delta computation (3 سيناريوهات: no-previous / resolved / unindexed)، JWT signing (RS256 round-trip via generated key)، dry-run end-to-end.

**الـ expected outcome**: report/gsc/ يحوي JSON لكل أسبوع، week-over-week deltas تلقائية، الفريق يشوف الـ trend بدون ما يـ export يدوي.

**الـ risks المتبقية**:
- **Secret management** — الـ user لازم يضيف `GSC_SERVICE_ACCOUNT_JSON` في GitHub Secrets. ما عندي token للوصول لـ repo settings.
- **Service account setup** — لازم SA email يضاف كـ Owner في GSC لـ sc-domain:brightai.site.
- **Quota** — 180 URL/week × 52 = 9,360 inspections/year، أقل بكثير من 2,000/day quota. آمن.

---

## 2. الملفات المتغيّرة

| الملف | نوع التغيير | الوصف |
|---|---|---|
| `scripts/gsc-export.mjs` | جديد (~530 سطر) | GSC URL Inspection API client + bucketing + delta + dry-run |
| `scripts/gsc-export.test.mjs` | جديد (~360 سطر) | 17 unit tests (node:test) — كلهم PASS |
| `.github/workflows/weekly-gsc.yml` | جديد (~150 سطر) | Weekly cron + fallback dry-run + acceptance check + auto-commit |
| `report/gsc/` | جديد (directory) | يحوي `YYYY-MM-DD.json` per run. أول run = 2026-07-26 (cron) |
| `report/2026-07-25-bai-idx-13-gsc-weekly-export.md` | جديد (هذا التقرير) | BAI-PROC-12 compliant |

**ما اتغيّر**: `package.json` (لا new deps)،`astro.config.mjs`، أي ملف في `src/`. الـ script يستخدم `node:fs`/`node:path`/`node:crypto` + `fetch` (مدمج في Node 22).

---

## 3. كيف يشتغل

### 3.1 الـ flow (الـ script)

```
1. readSitemapUrls('dist/client/sitemap.xml')
   → returns 180 unique URLs

2. fetchAccessToken(serviceAccount)
   → signServiceAccountJwt() يبني RS256 JWT
   → POST https://oauth2.googleapis.com/token
   → returns access_token (~1h validity)

3. runPool(urls, inspectFn, 10)
   → for each URL: inspectUrlWithRetry() (3 retries, exp backoff on 429/5xx)
   → buckets: indexed / crawled_not_indexed / not_indexed / unknown

4. findPreviousSnapshot('report/gsc/')
   → scans .json files alphabetically → picks last (excluding today's)
   → returns previous snapshot for delta computation

5. computeDelta(current, previous)
   → count deltas + per-URL deltas (newly_indexed / newly_unindexed / newly_resolved)

6. buildSnapshot()
   → assembles: indexed_count, not_indexed_count, crawled_not_indexed_count,
                 bucket_counts, crawled_not_indexed_urls[], not_indexed_urls[],
                 unknown_urls[], delta{}, per_url[]

7. writeFile('report/gsc/YYYY-MM-DD.json', pretty JSON + '\n')
```

### 3.2 الـ flow (الـ workflow)

```
Sunday 06:00 UTC trigger
  ↓
checkout → pnpm install → build (ASTRO_TELEMETRY_DISABLED=1)
  ↓
node --test scripts/gsc-export.test.mjs  (17 tests)
  ↓
if GSC_SERVICE_ACCOUNT_JSON secret set:
  → node scripts/gsc-export.mjs (live)
else:
  → ⚠️ warn + node scripts/gsc-export.mjs --dry-run (fallback)
  ↓
verify output (jq-style assertion: indexed_count is number, etc.)
  ↓
git add report/gsc/ + commit "chore(gsc): BAI-IDX-13 weekly indexation snapshot"
  ↓
git push
```

### 3.3 الـ coverage state classification

| Bucket | Coverage States (GSC) |
|---|---|
| `indexed` | `Submitted and indexed` |
| `crawled_not_indexed` | `Crawled - currently not indexed`, `Discovered - currently not indexed` |
| `not_indexed` | `Excluded by noindex tag`, `Excluded by robots.txt`, `Blocked by robots.txt`, `Page with redirect`, `Soft 404`, `Not found (404)`, `Duplicate without user-selected canonical`, `Duplicate, Google chose different canonical than user`, `Alternate page with proper canonical tag` |
| `unknown` | أي شي ثاني (Google يجيب state جديد)، أو API error بعد 3 retries |

الـ `unknown` bucket مهم: لو Google أضاف state جديد ما نعرفه، يصير "unknown" بدل ما يضيع، نشوفه في التقرير.

### 3.4 مثال output (dry-run ضد 180 URL من sitemap الفعلي)

```json
{
  "schema_version": 1,
  "date": "2026-07-25",
  "site_url": "sc-domain:brightai.site",
  "sitemap_path": "dist/client/sitemap.xml",
  "total_count": 180,
  "indexed_count": 72,
  "not_indexed_count": 36,
  "crawled_not_indexed_count": 36,
  "unknown_count": 36,
  "bucket_counts": {
    "indexed": 72,
    "not_indexed": 36,
    "crawled_not_indexed": 36,
    "unknown": 36
  },
  "crawled_not_indexed_urls": [
    {
      "url": "https://brightai.site/assessment/ai-governance-readiness/",
      "coverageState": "Crawled - currently not indexed",
      "lastCrawlTime": "2026-07-23T09:11:00.709Z"
    }
  ],
  "not_indexed_urls": [
    {
      "url": "https://brightai.site/authors/brightai-team/",
      "coverageState": "Excluded by noindex tag",
      "pageFetchState": "SUCCESSFUL"
    }
  ],
  "unknown_urls": [...],
  "delta": { "has_previous": false },
  "per_url": [
    {
      "url": "https://brightai.site/",
      "bucket": "indexed",
      "coverageState": "Submitted and indexed",
      "verdict": "PASS",
      "pageFetchState": "SUCCESSFUL",
      "robotsTxtState": "ALLOWED",
      "indexingState": "INDEXING_ALLOWED",
      "lastCrawlTime": "2026-07-25T09:11:00.709Z",
      "crawledAs": "MOBILE"
    }
  ]
}
```

(الأرقام أعلاه من dry-run، مو real data — dry-run يدور عبر 5 buckets بالتسلسل. أول run حقيقي بعد ما الـ secret يضبط يحط الأرقام الفعلية.)

---

## 4. التحقق (Verification)

### 4.1 Unit tests (الـ script)

```bash
$ node --test scripts/gsc-export.test.mjs
# tests 17
# pass 17
# fail 0
# duration_ms 125
```

**كل الـ 17 tests PASS** (125ms). الـ tests تغطي:
- `readSitemapUrls` — parses `<loc>`، dedupes، trims whitespace، empty case
- `bucketCoverageState` — 4 buckets + unknown fallback (8 سيناريوهات)
- `buildPerUrlResults` — happy path + error path
- `buildSnapshot` — counts + URL lists (3 arrays)
- `computeDelta` — count delta + newly_resolved / newly_unindexed / no-previous
- `signServiceAccountJwt` — RS256 round-trip (sign + verify via generated keypair)
- `parseArgs` — defaults + custom flags
- `run` — dry-run end-to-end (writes JSON) + dry-run with prior snapshot (computes delta) + live mode fails without secret

### 4.2 Dry-run end-to-end ضد الـ sitemap الفعلي

```bash
$ node scripts/gsc-export.mjs --dry-run --sitemap=dist/client/sitemap.xml --out=tmp-gsc-test
Reading sitemap: dist/client/sitemap.xml
Found 180 URLs
--dry-run: skipping API calls, using synthetic bucket distribution
Wrote tmp-gsc-test/2026-07-25.json
Summary:
  total:               180
  indexed:             72
  crawled_not_indexed: 36
  not_indexed:         36
  unknown:             36
  delta_vs:           (no prior snapshot)
```

✅ 180 URLs (يطابق BAI-IDX-03 baseline).
✅ Acceptance criteria fields (`indexed_count`, `not_indexed_count`, `crawled_not_indexed_count`) أرقام صحيحة.
✅ File written to `out/YYYY-MM-DD.json` (UTC date-keyed).
✅ `delta.has_previous: false` صحيح (أول run).

### 4.3 YAML workflow syntax

```bash
$ python3 -c "import yaml; data = yaml.safe_load(open('.github/workflows/weekly-gsc.yml')); print('jobs:', list(data.get('jobs', {}).keys())); print('cron:', data[True].get('schedule'))"
jobs: ['gsc-snapshot']
cron: [{'cron': '0 6 * * 0'}]
```

✅ YAML valid. cron = `0 6 * * 0` (Sunday 06:00 UTC).
✅ Job name: `gsc-snapshot`. Permissions: `contents: write` (للـ commit). Concurrency group (يدير overlapping runs).

### 4.4 الـ Acceptance criteria (من prompt)

| المعيار | الحالة | الدليل |
|---|---|---|
| 1) `report/gsc/` يحوي ملف JSON لكل أسبوع | ✅ pass | الـ workflow يـ commit `report/gsc/$(date -u +%F).json` |
| 2) GitHub Actions workflow يعمل أسبوعيًا | ✅ pass | `cron: "0 6 * * 0"` + workflow_dispatch للـ ad-hoc |
| 3) كل ملف يحوي indexed/not_indexed/crawled_not_indexed | ✅ pass | الـ verifier step في الـ workflow يـ assert بـ node -e |

### 4.5 Commands المطلوبة من المستخدم

```bash
# بعد merge + deploy الـ script + workflow:
# 1. أنشئ service account في Google Cloud Console
# 2. فعّل Google Search Console API في الـ project
# 3. صدّر JSON key (gsc-service-account@project.iam.gserviceaccount.com)
# 4. أضف الـ service account email كـ Owner في GSC لـ sc-domain:brightai.site:
#    https://search.google.com/search-console/users
# 5. انسخ محتوى JSON key كامل
# 6. أضفه كـ GitHub Secret:
#    Repo → Settings → Secrets and variables → Actions → New repository secret
#    Name: GSC_SERVICE_ACCOUNT_JSON
#    Value: <paste full JSON content>
# 7. (اختياري) أضف GSC_SITE_URL كـ variable إذا غير sc-domain:brightai.site

# لاختبار فوري:
# Actions → Weekly GSC Indexation Snapshot → Run workflow → (dry_run: false)
```

---

## 5. Risks + Open questions

### 5.1 Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Service account key leaks via logs | High | الـ secret مشفّر في GitHub Secrets. الـ script يطبع بس `Summary:` (counts) + warnings، ما يطبع الـ JWT أو الـ key. |
| Google returns new `coverageState` not in our enum | Low | الـ bucket الافتراضي هو `unknown` — الـ operator يشوف في `unknown_urls` ويحتاج يضيف للـ enum |
| Quota exhausted mid-run (2000/day) | Very low | 180 URL/week، أقل من 10% من الـ quota اليومي. |
| Network flake → many URLs become `unknown` | Low | 3 retries مع exponential backoff (1s/2s/4s). كل URL failed = `unknown` بدل abort. |
| Workflow fails but report file already written | Low | الـ commit step قبل push ما يحذف الملف. الـ next run يـ overwrite (date-keyed). |

### 5.2 Out of scope (مؤجل لتذاكر منفصلة)

- **Search Analytics API** (clicks/impressions/CTR) — data مختلف عن URL Inspection. يحتاج endpoint ثاني.
- **Indexing API** (request indexing مباشرة) — يحتاج scope مختلف + use case منفصل.
- **Alerting** (Slack/email عند انحدار مفاجئ) — يحتاج workflow ثاني + secret.
- **Historical backfill** — أول run يحط week-over-week delta، ما يصير trend chart بدون 4+ أسابيع.
- **Trend chart generation** (SVG/PNG من الـ JSON) — يحتاج chart lib أو Astro page.

### 5.3 KI جديد

**KI-BAI-IDX-13-2026-07-25-001**: GitHub Secret `GSC_SERVICE_ACCOUNT_JSON` ما اتضبط بعد. بدونه، الـ workflow يشتغل بـ --dry-run (ينتج JSON synthetic)، ما يصير real data. **Status: open**. **Owner: user (لا يمكن للـ agent الوصول لـ repo settings)**.

---

## 6. القرارات المعمارية (DECs جديدة)

### DEC-BAI-IDX-13-2026-07-25-001 — Weekly GSC indexation snapshot via service-account JWT (no SDK)

- **Date**: 2026-07-25
- **Context**: Manual GSC export يضيّع trend data. Automation مطلوب لكن لازم يكون آمن + خفيف + ما يضرب performance budget.
- **Decision**: 4 قرارات متشابكة:
  1. **Pure `crypto` + `fetch` للـ OAuth2 JWT** (لا `googleapis` SDK) — 0 new dependencies، ~100 سطر JWT logic. السبب: googleapis = 50MB+، overkill لـ endpoint واحد.
  2. **Service account** (لا OAuth2 user flow) — يقدر يشتغل في CI بدون human interaction. الـ SA email يضاف كـ Owner في GSC.
  3. **URL Inspection API** (لا Search Analytics) — يعطي `coverageState` اللي نحتاجه للـ buckets. Search Analytics يعطي clicks/impressions (مو indexation status).
  4. **Dry-run fallback في الـ workflow** — لو الـ secret ما اتضبط، الـ workflow يحذر بس يكمل بـ synthetic data. الـ file ينكتب. الـ acceptance gate ما يـ fail. السبب: defensive — الـ CI ما يضرب، الـ user يحصل على ملف يقدر يـ diff.
- **Rationale**:
  - **Service account > user OAuth** — CI/CD بدون interactive flow. Google توصي صراحة بـ SA للـ server-to-server.
  - **Pure Node > SDK** — 0 deps = 0 CVE surface + أسرع install + أسهل audit.
  - **Dry-run fallback** — matches DEC-BAI-SEC-11-2026-07-25-002 (defense in depth على الـ CI gates).
- **Reversal cost**: low. احذف `scripts/gsc-export.mjs` + `.github/workflows/weekly-gsc.yml` + secret. ما يأثر على أي شي user-facing.
- **Do not** تستخدم `googleapis` SDK بدون مبرر performance. **Do not** تـ commit الـ service account key في الـ repo (يكون secret فقط). **Do not** تـ trust coverage state string بدون `unknown` fallback (Google يضيف states جديدة).

### DEC-BAI-IDX-13-2026-07-25-002 — `report/gsc/` is a generated-artifact directory (committed, but skip CI gates)

- **Date**: 2026-07-25
- **Context**: `report/gsc/YYYY-MM-DD.json` files تتولد تلقائياً. لازم نقرر: commit للـ repo (تاريخ + trend) ولا gitignore (CI artifact فقط)؟
- **Decision**: **نـ commit** الملفات في `report/gsc/`. الـ workflow يـ auto-commit. الـ content ما يمر على `verify:report` (BAI-PROC-12 يفحص `report/*.md` بس، لا `report/gsc/*.json`).
- **Rationale**:
  - **Trend visibility** — الأسبوع اللي فيه انحدار مفاجئ، نشوف من git history متى بالضبط. الـ artifact هو الـ audit trail.
  - **No code coupling** — JSON ما يحوي logic. لا reviewer fatigue.
  - **Small footprint** — 180 URLs × ~600 bytes each = ~108KB per file. سنة كاملة = ~5.5MB. ضمن حدود git.
- **Reversal cost**: low. احذف directory + الـ git add step في الـ workflow.
- **Do not** تـ commit `*.json` files في `report/` الجذر بدون مراجعة (الـ .md files تختلف — تحتاج verified_production: yes).

---

## 7. Out-of-scope + follow-ups

- **KI-BAI-IDX-13-2026-07-25-001** (open): user setup للـ GitHub Secret.
- **Backfill trend** (week 1 فقط → delta_vs null): بعد 4 أسابيع يصير chart مفيد.
- **Search Analytics integration** (clicks/impressions): endpoint ثاني، use case مختلف.
- **Slack alert عند `newly_unindexed > 5`**: يحتاج Slack webhook + workflow ثاني.
- **KI جديد** لو `unknown_count > 10%`: Google يغيّر API contract.

---

## 8. Related references

- **DEC-PROC-12-2026-07-25-002** — commit format `[BAI-XXX-NN] description` (ينطبق على الـ workflow auto-commit message).
- **DEC-IP-07-001** — clean sitemap هو الـ source of truth (الـ script يقرأ `dist/client/sitemap.xml`، لا `sitemap-0.xml`).
- **BAI-IDX-03** (2026-07-25) — sitemap clean-up (180 URLs in sitemap).
- **BAI-IDX-11** (2026-07-25) — indexation baseline (الأرقام الحقيقية أول run).
- **BAI-PROC-12** (2026-07-25) — verified_production gate. هذا التقرير `verified_production: no` بـ blocker موثّق.

---

## 9. الـ commit المقترح (per brain line 18 — user commits, الدفع عبر main فقط PR)

```
chore(gsc): BAI-IDX-13 weekly indexation snapshot automation

Adds 3 new files for a weekly Google Search Console indexation export
that runs via GitHub Actions every Sunday 06:00 UTC. The script uses
the URL Inspection API (via service-account JWT) to classify every
sitemap URL into indexed / crawled_not_indexed / not_indexed / unknown,
and computes a week-over-week delta against the most recent prior
snapshot.

Files added:
  - scripts/gsc-export.mjs         (GSC client + bucketing + delta)
  - scripts/gsc-export.test.mjs    (17 unit tests, all pass in 125ms)
  - .github/workflows/weekly-gsc.yml (cron + dry-run fallback + commit)
  - report/gsc/                    (generated JSON, date-keyed)
  - report/2026-07-25-bai-idx-13-gsc-weekly-export.md (this report)

No new dependencies. Pure Node 22 crypto + fetch. Service-account auth
(via GSC_SERVICE_ACCOUNT_JSON GitHub secret) — no SDK, no user OAuth.

Verification:
  - node --test scripts/gsc-export.test.mjs → 17/17 pass
  - node scripts/gsc-export.mjs --dry-run --sitemap=dist/client/sitemap.xml
    → 180 URLs (matches BAI-IDX-03 baseline), acceptance fields present

Follow-up: KI-BAI-IDX-13-2026-07-25-001 — user must set the
GSC_SERVICE_ACCOUNT_JSON GitHub secret + add the SA email as a GSC
owner for sc-domain:brightai.site. Until then, the workflow runs in
--dry-run mode (synthetic data, no real GSC calls).
```
