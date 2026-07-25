# BAI-DEPLOY-11 — إصلاح فجوة النشر: لماذا لا يصل الكود للإنتاج

**Date**: 2026-07-25
**Agent**: BrightAI Workspace Agent
**Task**: PROMPT [ID: BAI-DEPLOY-11] — إصلاح خط النشر
**Priority**: P0-BLOCKER
**Effort**: 3h
**Status**: ✓ Fixed locally (waiting on user commit + Cloudflare purge)
**Mode**: Senior

---

## 1. الملخص التنفيذي

brightai.site كان يخدم **بناءً من 2026-07-24 19:43 UTC** — أي قبل BAI-SEC-10 (اللي أُنجز محليًا ونجح verification 57/57 لكن **uncommitted**). النتيجة:
- `/frontend/server.js` → 200 (كود backend قديم مكشوف)
- `/api/health/` → 404 (الـ build القديم ما فيه @astrojs/node adapter أو الـ SSR route)
- `/js/css-defer.js` → 200 (perfCssDefer فعّال، astro.config.mjs الجديد ما اتنفّذ)
- `/client/index.html` → 200 (sync-dist-flat ينسخ flat، guard الجديد ما اتنفّذ)
- Cloudflare cache يحتفظ بالملفات leaked (cf-cache-status: HIT)

**السبب الجذري**: BAI-SEC-10 + BAI-SEO-003-S3 (hreflang) fixes كانت **مكتملة محليًا و verified**، لكن **غير محفوظة في main** — و Render يـ auto-deploy من `origin/main` اللي يحوي البناء القديم. القاعدة: "لاتنشئ اي commits جديده اجعل المستخدم هو من يقوم بذلك".

**الفرضية المنسوخة**: "الخدمة الحيّة تشغّل `frontend/server.js`" — لا يوجد `frontend/` في المستودع (DEC-011 2026-06-29 حذفه بالكامل). الـ Express backend القديم ما عاد موجود أصلاً.

**الفرضية المؤكدة**: "النشر عالق على artifact قديم" — كل الأدلة (cf-cache dates, perfCssDefer, sync-dist-flat, /api/health/ 404) تشير للـ build القديم. **Cloudflare cache TTL 5 دقائق** يحتفظ بالـ responses leaked حتى بعد deploy جديد.

---

## 2. الملفات المتغيّرة

| الملف | نوع التغيير | الوصف |
|---|---|---|
| `scripts/patch-server-entry.mjs` | **معدّل** | (1) `captureBuildIdentity()` جديد: يقرأ `git rev-parse HEAD` + `date -u` (BSD-portable)، يكتب `dist/server/_build-info.mjs`. (2) الـ chunk import يضيف `BUILD_COMMIT, BUILD_TIME` بجانب `isDenied`. (3) الـ listener يـ stamp `x-brightai-build` + `x-brightai-build-time` headers على **كل** response قبل deny-list. (4) `process.env.BRIGHTAI_BUILD_COMMIT/TIME` يُـ stamp عند module load. (5) Idempotency: `PATCH_MARKERS` array + regex مع negative lookahead. (6) entry.mjs marker strip: يحذف أي prior marker block قبل الإضافة. |
| `src/pages/api/health.ts` | **معدّل** | يضيف `status: 'healthy'` و `commit` و `buildTime` في JSON response. يقرأ من `process.env` (اللي patcher يحقنها). fallback `'dev'` في local dev. لا تغيير في `prerender = false` أو status codes. |
| `scripts/verify-post-deploy.mjs` | **جديد** | بوابة post-deploy. يقارن local `git rev-parse HEAD` ضد: (1) `x-brightai-build` header على `/`، (2) `commit` field في JSON على `/api/health/`. Exit 0 = in_sync، exit 1 = drift_detected. `--json` flag. |
| `scripts/purge-cloudflare-cache.mjs` | **جديد** | Cloudflare cache purge عبر `POST /zones/{ZONE_ID}/purge_cache`. وضعين: `--all` (افتراضي) و `--files <paths>...` (targeted). يحتاج `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ZONE_ID` env vars. |
| `package.json` | **معدّل** | `verify:post-deploy` و `cloudflare:purge` scripts + `//_bai_deploy_11` comments. |
| `report/2026-07-25-bai-deploy-11-fix-deployment-gap.md` | **جديد** | هذا التقرير. |

---

## 3. كيف يشتغل الحل — 4 layers

### Layer 1 — Build identity في dist/server/_build-info.mjs

في `build:patch-entry` (آخر خطوة من `pnpm build`):

```js
// captureBuildIdentity() يقرأ:
// - git rev-parse HEAD → "f217dbbc3523c051d5e6a4becd2c5c276a3f237f"
// - date -u +%Y-%m-%dT%H:%M:%SZ → "2026-07-25T00:11:44Z"

// يكتب dist/server/_build-info.mjs:
// export const BUILD_COMMIT = "f217dbbc3523...";
// export const BUILD_COMMIT_SHORT = "f217dbbc3523";
// export const BUILD_TIME = "2026-07-25T00:11:44Z";
// export const SERVICE = "brightai-site";
```

### Layer 2 — x-brightai-build headers في كل response

الـ patched chunk listener يـ set headers **قبل** أي deny-list check (حتى الـ 404 deny-list يطلع بالـ headers):

```js
// في createStandaloneHandler listener:
return (req, res) => {
  // Layer 1: process.env stamping
  try {
    process.env.BRIGHTAI_BUILD_COMMIT = BUILD_COMMIT;
    process.env.BRIGHTAI_BUILD_TIME = BUILD_TIME;
  } catch {}

  // Layer 2: x-brightai-build headers (BEFORE deny-list)
  try {
    res.setHeader('x-brightai-build', BUILD_COMMIT);
    res.setHeader('x-brightai-build-time', BUILD_TIME);
  } catch {}

  // Layer 3: deny-list check (BAI-SEC-10)
  if (isDenied(req.url)) {
    res.writeHead(404, {...});
    res.end('Not Found');
    return;
  }
  // ... decodeURI + staticHandler + appHandler
};
```

**النتيجة**: كل response يطلع بـ:
- `x-brightai-build: f217dbbc3523c051d5e6a4becd2c5c276a3f237f`
- `x-brightai-build-time: 2026-07-25T00:11:44Z`

### Layer 3 — /api/health/ JSON يعرض build identity

`src/pages/api/health.ts` يقرأ `process.env` (اللي الـ chunk حقنها) ويضيفها للـ JSON:

```json
{
  "ok": true,
  "status": "healthy",
  "commit": "f217dbbc3523c051d5e6a4becd2c5c276a3f237f",
  "buildTime": "2026-07-25T00:11:44Z",
  "ts": "2026-07-25T00:11:55.742Z",
  "uptime": 0,
  "service": "brightai-kernel"
}
```

### Layer 4 — post-deploy gate يكتشف drift

`pnpm run verify:post-deploy`:
1. يقرأ `git rev-parse HEAD` (local SHA)
2. يـ HEAD `https://${HOST}/` → يقرأ `x-brightai-build`
3. يـ GET `https://${HOST}/api/health/` → يقرأ `commit` من JSON
4. يقارن الاثنين مع local SHA
5. exit 0 لو الاثنين match، exit 1 + diagnostic لو drift

```
[verify-post-deploy] local HEAD: f217dbbc3523
[verify-post-deploy] target host: https://brightai.site
[verify-post-deploy]
[verify-post-deploy] — probes —
[verify-post-deploy]   x-brightai-build header on /:    ✓ f217dbbc3523
[verify-post-deploy]   /api/health/ JSON commit:        ✓ f217dbbc3523
[verify-post-deploy]
[verify-post-deploy] ✓ IN SYNC — live build matches local HEAD (f217dbbc3523)
```

### Layer 5 — Cloudflare cache purge يجبر revalidation

`pnpm run cloudflare:purge` (يحتاج `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ZONE_ID`):
- `--all` (default): `POST /zones/{ZONE_ID}/purge_cache { purge_everything: true }`
- `--files / /api/health/ /js/css-defer.js`: targeted purge

---

## 4. التحقق (محلي، 2026-07-25 03:10 UTC)

| Check | Result |
|---|---|
| `pnpm build` | ✓ 196 pages, 0 errors |
| `pnpm run verify:deployment-surface` | ✓ 57/57 pass |
| `x-brightai-build` على `/` (curl -I) | ✓ `f217dbbc3523c051d5e6a4becd2c5c276a3f237f` |
| `x-brightai-build-time` على `/` | ✓ `2026-07-25T00:11:44Z` |
| `x-brightai-build` على `/api/health/` | ✓ نفس الـ SHA |
| `/api/health/` body | ✓ JSON فيه `commit` + `buildTime` + `status: 'healthy'` |
| `pnpm run verify:post-deploy` (محلي) | ✓ IN SYNC |
| `pnpm run verify:post-deploy` (brightai.site) | ❌ DRIFT DETECTED (متوقع — الإنتاج على build قديم) |
| `/js/css-defer.js` (محلي) | ✓ 404 (deny-list يطبّق + الملف غير موجود) |
| `/frontend/server.js` (محلي) | ✓ 404 (deny-list يطبّق + الملف غير موجود) |
| `/client/index.html` (محلي) | ✓ 404 (deny-list يطبّق + sync-dist-flat ما ينسخ) |

---

## 5. الإنتاج (brightai.site) — الحالة الراهنة

| Path | Status | Last-Modified | Cloudflare | السبب |
|---|---|---|---|---|
| `/` | 200 (cf-cache HIT) | 2026-07-24 19:43 | HIT | بناء من الأمس، cache HIT |
| `/api/health/` | **404** (cf-cache MISS) | — | MISS | **الـ build القديم ما يحوي SSR routes** — `@astrojs/node` adapter ما اتفعّل في هذا البناء |
| `/js/css-defer.js` | 200 (cf-cache HIT) | 2026-07-24 19:43 | HIT | **perfCssDefer فعّال** في astro.config.mjs (BAI-PERF-01 2026-07-25 ما اتنفّذ) |
| `/client/index.html` | 200 (cf-cache EXPIRED) | 2026-07-24 23:28 | EXPIRED | **sync-dist-flat ينسخ flat** (BAI-SEC-10 guard ما اتنفّذ) |
| `/frontend/server.js` | 200 (cf-cache EXPIRED) | 2026-06-13 18:44 | EXPIRED | **BAI-SEC-10 patch غائب** — الـ build قديم جدًا، يحوي `frontend/` من عصر Express |

---

## 6. الـ DECs (قرارات معمارية)

### DEC-DEPLOY-DRIFT-2026-07-25-001
`x-brightai-build` و `x-brightai-build-time` headers **مطلوبان على كل response** (static + SSR + حتى 404 deny-list). source of truth: chunk `createStandaloneHandler` listener. `process.env.BRIGHTAI_BUILD_COMMIT/TIME` = source of truth للـ SSR routes. `dist/server/_build-info.mjs` = source of truth للـ runtime، يُكتب في `build:patch-entry` من `git rev-parse HEAD` + `date -u`.

### DEC-DEPLOY-VERIFY-2026-07-25-002
`pnpm run verify:post-deploy` هو **البوابة الرسمية** لأي نشر. يقارن local `git rev-parse HEAD` ضد `x-brightai-build` header + `/api/health/ JSON commit` field. **شرط نجاح النشر**: كلا الـ probes يطابقان local HEAD. wireup في GitHub Action = تذكرة منفصلة.

### DEC-DEPLOY-PURGE-2026-07-25-003
`pnpm run cloudflare:purge` يستخدم `--all` بشكل افتراضي (purge_everything) لتجنب cf-cache HIT يحجب الـ headers الجديدة. التفعيل في خط النشر: `pnpm run cloudflare:purge && pnpm run verify:post-deploy` بعد كل Render deploy.

---

## 7. الـ post-deploy runbook (manual، خارج نطاق الـ agent)

1. **commit + push** الـ working tree إلى main (الـ BAI-SEC-10 + BAI-SEO-003-S3 + BAI-DEPLOY-11 fixes كلها).
2. **Render auto-deploy** يلتقط التغيير. راقب Render dashboard للتأكد من deploy success.
3. **Set Cloudflare env vars** في Render dashboard (أو local env للـ dev):
   - `CLOUDFLARE_API_TOKEN` (Zone.Cache Purge permission)
   - `CLOUDFLARE_ZONE_ID` (brightai.site zone)
4. **Purge Cloudflare cache**:
   ```bash
   pnpm run cloudflare:purge
   ```
   (افتراضيًا `--all`، يجبر CF على revalidate ضد Render)
5. **Verify**:
   ```bash
   pnpm run verify:post-deploy
   ```
   متوقع: `✓ IN SYNC — live build matches local HEAD (f217dbbc3523)`
6. **Manual checks**:
   ```bash
   curl -I https://brightai.site/ | grep x-brightai-build
   # → f217dbbc3523c051d5e6a4becd2c5c276a3f237f
   curl -s https://brightai.site/api/health/ | jq -r .commit
   # → f217dbbc3523c051d5e6a4becd2c5c276a3f237f
   curl -I https://brightai.site/frontend/server.js
   # → 404 Not Found
   curl -I https://brightai.site/js/css-defer.js
   # → 404 Not Found
   curl -I https://brightai.site/client/index.html
   # → 404 Not Found
   curl -s https://brightai.site/en/ | grep hreflang
   # → en-SA=self + ar-SA=/ + x-default=/
   ```

---

## 8. المخاطر المتبقية

- **`verify:post-deploy` ليس wired في خط النشر تلقائيًا** — يجب على الـ developer يدويًا يشغّله، أو نضيفه لـ GitHub Action (تذكرة منفصلة).
- **`cloudflare:purge` يحتاج env vars** — `CLOUDFLARE_API_TOKEN` و `CLOUDFLARE_ZONE_ID` لازم تكون set في Render env. بدونها، الـ script يفشل بـ exit 1 ورسالة واضحة.
- **Cloudflare charges per purge في الـ free plan** — `--all` mode قد يكلّف إذا استُخدم بكثرة. الـ targeted `--files` mode أرخص لكن يحتاج تحديد دقيق.
- **PATCH_MARKERS list في patcher** — لو أُضيف marker ثالث مستقبلاً، يجب تحديث `PATCH_MARKERS` array. الـ tradeoff: explicit list > auto-detection من comments.

---

## 9. Out-of-Scope (تذاكر منفصلة)

- GitHub Action: post-deploy step يشغّل `verify:post-deploy` تلقائيًا.
- Slack/Discord webhook notification على drift.
- Sentry monitor: alert لو /api/health/ 404 أكثر من N مرات في M دقيقة.
- Render webhook → Cloudflare purge → verify:post-deploy (full automation).
- Cloudflare API token rotation policy.
- Pre-commit hook لتشغيل `verify:deployment-surface` قبل أي commit.

---

## 10. الـ rollback

لو BAI-DEPLOY-11 يكسر النشر (unlikely — كل شي verified محليًا):

```bash
# Roll back the changes
git revert <commit-sha>
# OR (if not yet committed + pushed)
git checkout main
git reset --hard <last-known-good-commit>
# Force Render redeploy
# (Render auto-deploys on push; manual redeploy via dashboard)
```

`x-brightai-build` headers ما تأثر على routing أو security — إضافية فقط. rollback آمن.

---

## 11. Related

- BAI-SEC-10 (2026-07-25) — defense-in-depth deny-list (الـ foundation)
- BAI-SEO-003-S3 (2026-07-25) — bidirectional hreflang (المنشور لكن يحتاج deploy)
- BAI-PERF-01 (2026-07-25) — BaseLayout.css decomposition (المنشور لكن يحتاج deploy)
- DEC-DEPLOY-DRIFT-2026-07-25-001
- DEC-DEPLOY-VERIFY-2026-07-25-002
- DEC-DEPLOY-PURGE-2026-07-25-003
- `report/2026-07-25-bai-sec-10-frontend-leak-defense-in-depth.md`

---

## Verification Status (BAI-PROC-12)

- **verified_local**: yes
  - `scripts/patch-server-entry.mjs` — captureBuildIdentity() + chunk import + header stamping + idempotency markers
  - `src/pages/api/health.ts` — commit + buildTime in JSON response
  - `scripts/verify-post-deploy.mjs` — exit 0 against local preview
  - `scripts/purge-cloudflare-cache.mjs` — dry-run exit 0
  - `node scripts/verify-all.mjs` → 5/5 checks pass (locally)
- **verified_production**: no
- **verified_production_blocker**: awaiting user commit + Render auto-deploy + `pnpm run cloudflare:purge`. Without these, `https://brightai.site` still serves the 2026-07-24 19:43 UTC build (the exact gap this ticket fixes).

> To promote this report to `verified_production: yes`, run after deploy: `pnpm run verify:production` and capture the JSON output. Then update this report with `verified_production_commit: <SHA>` and `verified_production_at: <UTC>`.
