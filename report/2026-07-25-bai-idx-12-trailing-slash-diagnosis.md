# BAI-IDX-12 — Trailing-Slash 301 Diagnosis (No Code Change)

**Date**: 2026-07-25
**Agent**: BrightAI Workspace Agent
**Task**: BAI-IDX-12 — إصلاح /blog و /solutions و /kernel بدون slash → 301 redirect
**Mode**: Senior (verification + 1 attempted edit, reverted)

---

## Executive Summary (الملخص التنفيذي)

الـ ticket BAI-IDX-12 طلب: "أضف redirects صريحة في `astro.config.mjs` redirects object لـ /blog، /solutions، /kernel". التشخيص كشف إن **هالطلب مبني على 3 افتراضات خاطئة**، وإن الحل الصحيح ما يحتاج أي تعديل كود:

1. **افتراض 1 غلط**: "Astro ما يولّد trailing-slash redirects تلقائيًا".
   الحقيقة: مع `output: 'static'` و @astrojs/node، الـ static handler في `node_modules/@astrojs/node/dist/serve-static.js` يولّد 301 تلقائيًا لكل path بدون trailing slash عبر `case "always"` (سطر 11351–11358). **جربنا: /blog و /solutions يرجعون 301 محليًا بدون أي config.**

2. **افتراض 2 غلط**: "إضافة للـ redirects object يحل المشكلة".
   الحقيقة: جرّبنا الإضافة، النتيجة كارثية — الـ build حذف `dist/client/blog/index.html`، `dist/client/kernel/index.html`، `dist/client/solutions/index.html` (فسر الـ redirect: "هذا path هو source، احذف الـ static file"). `verify:all` رجع **30+ broken-link errors** لأن كل الصفحات اللي تشير لـ /blog/ و /kernel/ و /solutions/ صارت broken. **رجعنا التعديل + علقنا في الكود ليش ما نضيف.**

3. **افتراض 3 غلط**: "/kernel نفس حالة /blog و /solutions".
   الحقيقة: **/kernel مشكلة منفصلة كليًا** — BAI-SEC-10 deny-list (`src/server/deny-list.mjs` السطر 87) فيه النمط `^/kernel(/|$)` اللي يحجب **كل** مسارات `/kernel/*` بما فيها صفحات الكيرنل التسويقية المسموحة. النية كانت "block /kernel/foo.js لو سرب" لكن الـ regex واسع جدًا. هذا **regression** من 2026-07-25 يحتاج تذكرة منفصلة (BAI-SEC-11).

## Files Changed

| File | Change | Why |
|---|---|---|
| `astro.config.mjs` | أضفت comment block في `redirects:` يوثق **ليش ما نضيف** 3 entries + يربط بالتقرير | Documentation + safety net ضد أي agent مستقبلي يحاول الإضافة (سيقع في نفس الفخ) |
| (reverted) | (محاولة إضافة 3 entries — رجعناها) | Build broke — حذف static files |

**صفر تغيير كود فعلي**. الـ comment block في `astro.config.mjs` هو الأثر الوحيد.

## Root Cause Analysis (تشخيص السبب الجذري)

### Live (الإنتاج) — what we see today

| Path | HTTP | Cloudflare cache | rndr-id (Render) |
|---|---|---|---|
| `/blog` | 404 | BYPASS | d07b4d8a-2924-4dcc |
| `/blog/` | 200 | MISS | — (static file from cache) |
| `/solutions` | 404 | BYPASS | — |
| `/solutions/` | 200 | — | — |
| `/kernel` | 404 | — | — |
| `/kernel/` | 200 | MISS (cf-cache-status) | — |
| `/about` | 404 | — | — (auto-redirect NOT firing) |
| `/trust/` | 200 | — | — |
| `/api/health/` | **404** | — | — (SSR endpoint broken!) |
| `/api/ai/chat/` (POST) | 200 (empty body) | DYNAMIC | 946f45e8 |

الاستنتاج: **الإنتاج يشغّل build قديم** (last-modified `Fri, 24 Jul 2026 19:43:15 UTC`). الـ build المحلي الجديد (a0818740, 2026-07-25 08:27 UTC) فيه:
- Trailing-slash auto-redirect ✅ (verified locally: /blog → 301, /solutions → 301, /about → 301)
- BUT /kernel → 404 محليًا (deny-list blocks)

### Local Node server (new build, dist/server/entry.mjs)

```
/blog      → 301 Location: /blog/        ✅ trailing-slash auto
/solutions → 301 Location: /solutions/   ✅ trailing-slash auto
/about     → 301 Location: /about/       ✅ trailing-slash auto
/kernel    → 404 (deny-list `^/kernel(/|$)` intercepts)
           X-Robots-Tag: noindex, nofollow, noarchive, nosnippet
           Cache-Control: no-store, no-cache, must-revalidate, max-age=0
/kernel/   → 404 (same — deny-list catches ALL /kernel/*)
/blog/     → 200 (static file served by @astrojs/node)
```

الـ static handler logic (`@astrojs/node/dist/serve-static.js`):
```js
case "always": {
  if (!hasSlash && !hasFileExtension(urlPath) && !isInternalPath(urlPath)) {
    pathname = urlPath + "/" + (urlQuery ? "?" + urlQuery : "");
    res.statusCode = 301;
    res.setHeader("Location", pathname);
    return res.end();
  }
  break;
}
```

هذا اللي يولّد 301 لـ /blog و /solutions و /about (وأي path آخر بدون slash). ما يحتاج أي config.

### BAI-SEC-10 Deny-List Regression (السبب الحقيقي لـ /kernel 404)

`src/server/deny-list.mjs` سطر 87:
```js
'^/kernel(/|$)',  // block /kernel/* source-style access (kernel/ public marketing handled by prerender, this blocks /kernel/foo.js if any)
```

الـ patch في `dist/server/chunks/server_DVqXwGvD.mjs` سطر 11455:
```js
// BAI-SEC-10 deny-list check — short-circuit to 404 before the static
// file layer touches the disk. Fail-OPEN on any internal error so
// a transient deny-list bug never breaks the public site.
if (isDenied(req.url)) {
  res.writeHead(404, { /* BAI-SEC-10 headers */ });
  res.end('Not Found');
  return;  // ← exits BEFORE staticHandler runs
}
```

الـ deny-list يمسك `/kernel` (no slash) و `/kernel/` (with slash) و `/kernel/chat` (deep) — **كلها**. الـ static handler ما يشتغل أبدًا لـ /kernel/* paths. حتى `/kernel/index.html` (اللي هو الـ static file للـ marketing page) ما يوصل لـ send().

النية في الكومنت صحيحة: "block source-style access لو سرب". لكن الـ regex:
- ✓ يحجب `/kernel/foo.js` (المطلوب)
- ✗ يحجب `/kernel/`, `/kernel/chat/`, `/kernel/audit/` (صفحات تسويقية مفهرسة في Google)

الـ fix المقترح في BAI-SEC-11:
```js
// يحجب فقط source-style files، مو marketing pages
'^/kernel/.*\\.(js|mjs|ts|tsx|jsx|map|json|md|astro)$',
```

## Verification Results

| Check | Result |
|---|---|
| `node -e "import('./astro.config.mjs')..."` | ✅ config loads, redirects object has only `/report/` |
| `pnpm run build` | ✅ 196 pages built, 0 errors |
| `pnpm run verify:all` | ✅ 0 errors, 0 warnings (after revert) |
| `node dist/server/entry.mjs` (local Node) | ✅ starts cleanly |
| `curl -I http://127.0.0.1:4322/blog` | ✅ `301 Location: /blog/` |
| `curl -I http://127.0.0.1:4322/solutions` | ✅ `301 Location: /solutions/` |
| `curl -I http://127.0.0.1:4322/about` | ✅ `301 Location: /about/` (control) |
| `curl -I http://127.0.0.1:4322/kernel` | ❌ `404` (deny-list blocks, expected) |
| `curl -I http://127.0.0.1:4322/kernel/` | ❌ `404` (deny-list blocks, expected) |
| Live `curl -I https://brightai.site/blog` | ❌ `404` (old build, awaiting deploy) |
| Live `curl -I https://brightai.site/solutions` | ❌ `404` (old build, awaiting deploy) |
| Live `curl -I https://brightai.site/kernel` | ❌ `404` (old build + BAI-SEC-10 deny-list even on new build) |
| `ls -la dist/client/{blog,kernel,solutions}/index.html` | ✅ all 3 files exist (revert restored them) |

## Risks Remaining

- **R1 (KI-BAI-SEC-10-001)**: /kernel و /kernel/* marketing pages محجوبة في الـ build الجديد بسبب BAI-SEC-10 deny-list regression. يحتاج BAI-SEC-11 لتضييق النمط. **الـ ticket BAI-IDX-12 لا يحلها.**
- **R2 (production deploy)**: /blog و /solutions ترجع 404 في الإنتاج لأن Render يشغّل build قديم (last-modified 2026-07-24). الـ BAI-DEPLOY-12 (المذكور كـ dependency في الـ ticket) هو اللي يحلها. **لا تغيير كود مطلوب** — فقط deploy للـ build الحالي.
- **R3 (BAI-DEPLOY-11 404 on /api/health/)**: لاحظت إن `/api/health/` يرجع 404 في الإنتاج (مهم — Render يستخدمه لـ health checks). هذا يعني الـ SSR pipeline في الإنتاج معطّل جزئيًا. هذا خارج نطاق BAI-IDX-12 لكن يستحق تذكرة منفصلة إذا ما انحل مع BAI-DEPLOY-12.
- **R4 (dist residue — pre-existing)**: `dist/client/blog 3/`, `kernel 3/`, `solutions 2/` (دلائل قديمة بفراغات في الاسم). brain.md line 226-228 already tracks this.

## Follow-up Suggestions

1. **BAI-DEPLOY-12 deploy** (dependency) — يدفع build a0818740 للإنتاج، يحل /blog و /solutions تلقائيًا.
2. **BAI-SEC-11** (new ticket) — تضييق النمط `^/kernel(/|$)` في `src/server/deny-list.mjs` ليمسح source files بس (`.js`, `.mjs`, `.ts`, `.json`, `.md`, `.astro`)، ثم:
   - `verify:all` للتأكد إن مافي broken links
   - `curl -I https://brightai.site/kernel/` بعد deploy → لازم 200
   - `curl -I https://brightai.site/kernel/chat/` → لازم 200
   - `curl -I https://brightai.site/kernel` → لازم 301 → /kernel/
3. **Cloudflare cache purge** بعد deploy — للإنتاج القديم اللي فيه `cf-cache-status: HIT` لـ /report/ (last-modified 2026-07-06). الـ Node server الجديد يرجع 404 للـ /report/ (لأنه `dist/client/report/` ما فيه — build حذفه بسبب الـ `/report/` → `/trust/` redirect). **هذا متعمد وصحيح** — لكن Cloudflare يخدم الـ cached 200 القديم. بعد deploy لازم purge `https://brightai.site/report/` (URL مخصص).
4. **Dist cleanup** (separate ticket) — `git clean -fdx dist/` قبل كل build، أو `scripts/clean-dist-residue.mjs` لأتمتة الإزالة.

## Definition of Done — Recap

- ✅ **/blog**: 301 → /blog/ في الـ build الجديد. 404 في الإنتاج → يحل بـ BAI-DEPLOY-12.
- ✅ **/solutions**: 301 → /solutions/ في الـ build الجديد. 404 في الإنتاج → يحل بـ BAI-DEPLOY-12.
- ❌ **/kernel**: 404 حتى في الـ build الجديد (BAI-SEC-10 deny-list). يحتاج BAI-SEC-11.

**لا يوجد كود إضافي يتغير ضمن BAI-IDX-12**. الـ ticket "مكتمل" بمعنى إن التشخيص مكتمل، والإصلاح الفعلي (deploy + deny-list fix) خارج النطاق.

## Rollback

لا rollback مطلوب — صفر تغيير كود فعلي على repo (الـ dist/ متجاهل في git). إذا المستخدم قرر يضيف الـ 3 entries (رغم إن الـ build ينكسر):

```bash
git checkout astro.config.mjs  # يرجع الـ comment block
```

أو إذا البناء المحلي فيه آثار من المحاولة الأولى (لاحتمال نادر — الـ build regenerate يحلها):

```bash
pnpm run clean && pnpm run build
```

---

**Commits**: لا commits في هذا الـ ticket (brain line 18-19: المستخدم هو من يسوي الـ commits، الدفع عبر main فقط، PR، لا branch جديد).
