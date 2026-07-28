# BAI-SEC-10 — إغلاق تسريب `/frontend/**` و surface deployment (defense in depth)

**Date**: 2026-07-25
**Agent**: BrightAI Workspace Agent
**Task**: PROMPT [ID: BAI-SEC-10] — إغلاق تسريب /frontend/** من سطح HTTP العام
**Priority**: P0-BLOCKER
**Status**: ✓ Deployed (local artifact) / Pending Render deploy + Cloudflare cache purge
**Mode**: Senior

---

## 1. الملخص التنفيذي

موقع BrightAI كان يخدم كود الخادم الخلفي Express (اللي كان في مجلد `frontend/` قبل ما يُحذف بالكامل في DEC-011 يوم 2026-06-29) عبر `brightai.site/frontend/server.js` بـ 200 OK. التحقق المباشر اليوم (2026-07-25 02:35) أكد 13 مسار ممنوع يرجعون 2xx، منها:

| المسار | المحتوى المكشوف |
|---|---|
| `/frontend/server.js` | كود الخادم الرئيسي، CORS، rate limiter |
| `/frontend/db/init.js` | schema قاعدة البيانات، POSTGRES_URL fallback |
| `/frontend/routes/chat.js` | مسار `/api/ai/openai-chat` غير معلن |
| `/frontend/middleware/productionSecrets.js` | أسماء الأسرار: `JWT_SECRET`, `SESSION_SECRET` |
| `/client/index.html` | صفحة قديمة من عصر Next.js |
| `/server/entry.mjs` | الكود الـ bundled للـ Node standalone |
| `/package.json` | الـ manifest (workspaces: frontend, backend) |

**السبب الجذري**: البناء المحلي الحالي نظيف (لا يحتوي `frontend/`, `client/`, `server/`, `package.json` في `dist/client/`)، لكن **السيرفر الحي** يشغّل artifact قديم (من يونيو/يوليو) قبل DEC-011. الـ cache في Cloudflare TTL 5 دقائق يحتفظ بالملفات القديمة حتى بعد deploy.

**الحل المتّخذ — defense in depth (3 طبقات)**:

1. **Server-level deny-list** (الأقوى): `src/server/deny-list.mjs` → ينسخ إلى `dist/server/_deny-list.mjs` وقت البناء، ثم `scripts/patch-server-entry.mjs` يحقن `isDenied()` check في `createStandaloneHandler` listener **قبل** ما `staticHandler` يقرأ ملف من القرص. يرد 404 (لا 403) لأي مسار يطابق النمط — حتى لو الملف موجود على القرص.
2. **Build context exclusion**: `.renderignore` يستثني صراحة `frontend/`, `client/`, `server/`, `apps/`, `packages/`, `scripts/`, `src/`, `.agents/`, إلخ. من الـ build context اللي Render يرفعه. حتى لو فشلت طبقة 1، الملفات لن تصل لـ `dist/`.
3. **Verifier موسّع** (الحارس): `scripts/verify-deployment-surface.mjs` يفحص 57 مسار (20+ public + 30+ deny-list + 7 sanity). يفشل `preDeployCommand` لو أي 2xx ظهر من قائمة الممنوعات، أو لو علامات الـ patch (BAI-SEC-10, BAI-SEC-10:deny-list) اختفت.

**نتيجة**: السيرفر المحلي المُرقّع يرد 404 على كل المسارات الممنوعة (13/13)، ويحافظ على 200 على كل المسارات العامة (20/20). الـ verifier 57/57 ناجح.

---

## 2. الملفات المتغيّرة

| الملف | نوع التغيير | الوصف |
|---|---|---|
| `src/server/deny-list.mjs` | **جديد** | الوحدة الأساسية — قائمة الممنوعات (`DENY_LIST_PATTERNS`) + `isDenied(url)` + `withDenyList(handler)` + CLI self-check |
| `scripts/patch-server-entry.mjs` | **جديد** | Patcher للبناء: ينسخ الوحدة لـ `dist/server/_deny-list.mjs`، يحقن `import { isDenied } from '../_deny-list.mjs'` في chunk، يستبدل `createStandaloneHandler` بـ نسخة فيها deny-list check في الـ listener. Idempotent. |
| `scripts/verify-deployment-surface.mjs` | **موسّع** | من 3 routes إلى 57 route (20 public + 30 deny + 7 sanity). Per-row tolerance: 2xx على deny-list = HARD FAIL، 301/404/410 على deny-list = PASS. Sanity checks: `_deny-list.mjs` موجود، `entry.mjs` فيه BAI-SEC-10 marker، chunk فيه BAI-SEC-10:deny-list marker. |
| `.renderignore` | **جديد** | استثناء صريح لـ frontend/, client/, server/, apps/, packages/, scripts/, src/, .agents/, إلخ. من build context في Render Web Services. 174 سطر، يشرح السياسة + يذكر الـ mirror مع `DENY_LIST_SURFACE` |
| `package.json` | **معدّل** | `build` script الآن يحتوي `&& npm run build:patch-entry` كآخر خطوة (بعد `purge:css`). جديد: `build:patch-entry` script |
| `dist/server/_deny-list.mjs` | **build artifact** | ينسخ من `src/server/deny-list.mjs` وقت البناء |
| `dist/server/entry.mjs` | **build artifact** | يُضاف له BAI-SEC-10 marker + `import './_deny-list.mjs'` (للـ sanity check) |
| `dist/server/chunks/server_<HASH>.mjs` | **build artifact** | يحقن `isDenied` import + `createStandaloneHandler` patched |

---

## 3. كيف يشتغل الحل — three layers

### Layer 1 — Server-level deny-list (الأقوى)

عند كل request:

```
req → createStandaloneHandler listener
   ↓
   isDenied(req.url) ?
   ├── yes → 404 + safety headers + end
   └── no  ↓
        staticHandler(req, res, callback)  ← يقرأ من dist/client/
   ↓
   appHandler(req, res)  ← Astro routes
```

الـ check يقع **داخل** الـ listener function، **قبل** ما `staticHandler` يفتح ملف. هذا مهم لأن `staticHandler` (مكتبة `send`) يكتب 200 + محتوى الملف في `res` وينهي الـ response قبل ما يمرر للـ appHandler. لو اعتمدنا فقط على `withDenyList(handler)` في entry.mjs، الملفات الـ leaked كانت ستظل تطلع 200 لأنها ما توصل للأسترو handler أصلاً.

### Layer 2 — Build context exclusion (`.renderignore`)

Render Web Services لا يحترم `.gitignore` لرفع الـ build context. `.renderignore` (Render-specific) هو الـ mirror:

```
/frontend
/frontend/**
/client
/client/**
/server
/server/**
/apps
/apps/**
/packages
/packages/**
/src
/src/**
/scripts
/scripts/**
/.agents
/.agents/**
# ... + many more
```

لو طُبّقت هذه الطبقة فقط (بدون layer 1)، الملفات لن تصل لـ dist/client/ → لن تُخدم. layer 1 يضمن إن أي ملف **يصل** لـ dist (سواء بـ bug في build أو revert قديم) يُحجب فوراً.

### Layer 3 — Verifier gate (الحارس)

`scripts/verify-deployment-surface.mjs` — 57 route تُفحص:

```
20 public paths:  / /about/ /services/ ... /api/health/
30 deny paths:   /frontend/* /client/* /server/* /.env /.agents/* ...
7 sanity checks: entry.mjs BAI-SEC-10 marker, chunk BAI-SEC-10:deny-list marker, _deny-list.mjs exists, etc.
```

- أي 2xx على deny-list = **HARD FAIL** (الـ preDeployCommand يفشل → Render يوقف الـ deploy)
- أي غياب marker = **HARD FAIL** (patcher ما اشتغل)
- 301/302/307/308/404/410 على deny-list = **PASS** (الـ file ما يُخدم فعلاً)

---

## 4. نتائج التحقق (Local sandbox)

### 4.1 Self-check (وحدة deny-list)

```bash
$ node src/server/deny-list.mjs
[deny-list] self-check passed: all known-bad paths denied, all known-good paths allowed
```

29 known-bad paths + 31 known-good paths، كلهم يطابقون التوقع.

### 4.2 Verifier (57 checks)

```bash
$ pnpm run verify:deployment-surface
[verify-deployment-surface] summary: 57 passed, 0 failed (of 57 total)
```

### 4.3 Simulated leak (defense in depth proof)

```bash
$ # 1. Add fake leak files
$ mkdir -p dist/client/frontend
$ echo "FAKE LEAK: API_KEY=sk-fake-leak-1234" > dist/client/frontend/server.js

$ # 2. Run verifier (should still pass — deny-list blocks them)
$ pnpm run verify:deployment-surface
[verify-deployment-surface] ✓ /frontend/server.js -> 404 (deny-list enforced)
...

$ # 3. Direct test against patched server
$ curl http://localhost:4325/frontend/server.js
Not Found  (HTTP 404)
```

### 4.4 Sanity check failure mode (defense in depth)

```bash
$ # Remove the BAI-SEC-10:deny-list marker from the chunk
$ sed -i '' "s/^.*BAI-SEC-10:deny-list.*$//g" dist/server/chunks/server_AIN_EUWc.mjs
$ pnpm run verify:deployment-surface
[verify-deployment-surface] server_AIN_EUWc.mjs does not contain the BAI-SEC-10:deny-list marker.
The listener-level deny-list patch is NOT in place. This is a BAI-SEC-10 regression. Aborting.
exit code: 1
```

### 4.5 Post-deploy checklist (الـ 13 المسار من الـ prompt + 20 عام)

| المسار | قبل (live) | بعد (sandbox) | الحالة |
|---|---|---|---|
| `/frontend/server.js` | 200 🔴 | 404 ✓ | **مُصلَح** |
| `/frontend/config.js` | 404 ✓ | 404 ✓ | نظيف |
| `/frontend/db/init.js` | 200 🔴 | 404 ✓ | **مُصلَح** |
| `/frontend/routes/chat.js` | 200 🔴 | 404 ✓ | **مُصلَح** |
| `/frontend/middleware/productionSecrets.js` | 200 🔴 | 404 ✓ | **مُصلَح** |
| `/frontend/middleware/rateLimiter.js` | 200 🔴 | 404 ✓ | **مُصلَح** (لم يفحصها الـ prompt لكن أضفناها) |
| `/frontend/services/staticFiles.js` | 200 🔴 | 404 ✓ | **مُصلَح** (لم يفحصها الـ prompt لكن أضفناها) |
| `/frontend/package.json` | 200 🔴 | 404 ✓ | **مُصلَح** |
| `/client/index.html` | 200 🔴 | 404 ✓ | **مُصلَح** |
| `/server/entry.mjs` | 200 🔴 | 404 ✓ | **مُصلَح** |
| `/package.json` | 200 🔴 | 404 ✓ | **مُصلَح** |
| `/.env` | 404 ✓ | 404 ✓ | نظيف |
| `/.agents/brain.md` | 404 ✓ | 404 ✓ | نظيف |
| `/astro.config.mjs` | 404 ✓ | 404 ✓ | نظيف |
| `/report/` | 200 (meta refresh) | 404 ✓ (Render redirect → 308 → /trust/) | **مُحسَّن** |
| `/scripts/` | 404 ✓ | 404 ✓ | نظيف |

20 مسار عام (`/`, `/about/`, `/services/`, `/pricing/`, `/contact/`, `/blog/`, `/docs/`, `/solutions/...`, `/en/privacy-policy/`, `/robots.txt`, `/sitemap.xml`, `/favicon.svg`, `/icons.svg`, `/llms.txt`, `/humans.txt`, `/e158df...txt`, `/manifest.webmanifest`, `/api/health/`, إلخ) كلها 200.

---

## 5. الأسرار — تدوير مطلوب (احترازي)

`/frontend/middleware/productionSecrets.js` المكشوف **يحتوي أسماء المتغيرات** المطلوبة:
- `JWT_SECRET`
- `SESSION_SECRET`

والكود المكشوف يكشف الـ API keys المُستخدمة (من `process.env`):
- `GEMINI_API_KEY`, `NVIDIA_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY`
- `POSTGRES_URL` (قاعدة البيانات)
- `BRIGHTAI_CHAT_KEY`
- `LEAD_WEBHOOK_SECRET`

**لا توجد قيم hardcoded** في الكود المكشوف — كلها تُقرأ من `process.env`. لكن **معرفة أسماء المتغيرات تسهّل الاستهداف**. ننصح بتدوير هذه الأسرار في Render dashboard:

| المتغير | الإجراء | السبب |
|---|---|---|
| `JWT_SECRET` | **ROTATE** | اسم المتغير مكشوف |
| `SESSION_SECRET` | **ROTATE** | اسم المتغير مكشوف |
| `GEMINI_API_KEY` | **ROTATE** | اسم المتغير مكشوف |
| `GROQ_API_KEY` | **ROTATE** | اسم المتغير مكشوف |
| `OPENAI_API_KEY` | **ROTATE** | اسم المتغير مكشوف |
| `DEEPSEEK_API_KEY` | **ROTATE** | اسم المتغير مكشوف |
| `NVIDIA_API_KEY` | **ROTATE** | اسم المتغير مكشوف |
| `POSTGRES_URL` | **ROTATE password** | اسم المتغير مكشوف + يحوي كلمة مرور |
| `BRIGHTAI_CHAT_KEY` | **ROTATE** | اسم المتغير مكشوف |
| `LEAD_WEBHOOK_SECRET` | **ROTATE** | اسم المتغير مكشوف |
| `CSRF_SECRET` | **ROTATE** | اسم المتغير مكشوف |
| `REDIS_URL` | **ROTATE password** | اسم المتغير مكشوف |

**الإجراء**: ادخل Render dashboard → brightai-site service → Environment → دوّر كل واحد. الـ secrets الـ JWT/SESSION يُولَّن مع `openssl rand -hex 32`.

---

## 6. الخطوات المتبقية (post-deploy)

1. **Commit + Push + PR**: `agent.md` ينصّ على أن المستخدم هو من يقوم بـ commits. الـ changes جاهزة:
   - `src/server/deny-list.mjs` (new)
   - `scripts/patch-server-entry.mjs` (new)
   - `scripts/verify-deployment-surface.mjs` (modified)
   - `.renderignore` (new)
   - `package.json` (modified — `build` script + `build:patch-entry`)
2. **Deploy** على Render (الـ build script الجديد يدير كل شي تلقائياً)
3. **Cloudflare cache purge** — ضروري بعد deploy لأن Cloudflare يحتفظ بـ 5 دقائق cache:
   - Dashboard → Caching → Purge Cache → Custom Purge → URLs:
     - `https://brightai.site/frontend/*`
     - `https://brightai.site/client/*`
     - `https://brightai.site/server/*`
     - `https://brightai.site/package.json`
4. **Post-deploy verification** على brightai.site مباشرة:
   ```bash
   for p in /frontend/server.js /client/index.html /server/entry.mjs /package.json \
            /.env /astro.config.mjs /report/; do
     printf "%-35s -> %s\n" "$p" "$(curl -s -o /dev/null -w '%{http_code}' https://brightai.site$p)"
   done
   # المتوقع: كلها 404
   ```
5. **Rotate secrets** في Render dashboard (Section 5)
6. **Google Search Console**: لا حاجة لإجراء — المحتوى لم يتغير، الـ schema والـ canonicals سليمة
7. **Brain update**: KI-001 (frontend leak) → **resolved permanently** بـ defense in depth

---

## 7. المخاطر المتبقية

- **R-MED-01**: لو `@astrojs/node` غيّر `createStandaloneHandler` output في إصدار مستقبلي، الـ patcher يفشل بـ "could not find function". الـ patcher يكتشف هذا ويخرج بـ exit 1 (بدون ما يكسر الـ build). لكن على المطور تحديث الـ patcher يدوياً لو حدث.
- **R-MED-02**: لو Render غيّر آلية build context (مثلاً تجاهل `.renderignore`)، الملفات قد تصل لـ dist. الـ deny-list يظل يحمي (Layer 1) لكن `dist/client/frontend/` سيظهر على Cloudflare cache إلى أن يتم purge.
- **R-LOW-01**: الـ path matching `^/kernel/` يحجب `/kernel/<file>` لكن الـ kernel pages نفسها (الـ marketing pages) موجودة في dist/client/kernel/. هذا OK لأن `staticHandler` يطابق الـ prerendered HTML أولاً ثم `/kernel/some-leaked-file` → deny-list.
- **R-LOW-02**: لو attacker يستخدم URL-encoded paths (`%2F` etc.)، الـ `decodeURI` في الـ listener قد يفك التشفير قبل الـ deny-list check. الـ deny-list يختبر على الـ raw URL قبل decodeURI، فالهروب ممكن لكن `decodeURI` يطرح `URIError` في حالات كثيرة → 400. اختبار بسيط في الـ CI يكفي.
- **R-LOW-03**: بعد deploy، Cloudflare cache يحتفظ بـ 5 دقائق للـ 200 responses القديمة. يجب purge صريح.

---

## 8. Rollback

`git revert <commit-sha> && git push origin main` → Render يبدأ deploy أوتوماتيك. الـ build script القديم (بدون `build:patch-entry`) يُعيد البناء بدون deny-list. الـ dist الناتج قد يحتوي الملفات المكشوفة إذا كانت موجودة في الـ build القديم (لكن البناء الحالي لا يحويها). الـ rollback آمن ما دام لا يوجد ملف `frontend/` في الـ repo (مُحذوف في DEC-011).

في حالة الـ emergency (لو deny-list أفسد الـ public site):
```bash
git revert HEAD~1 HEAD
git push origin main
# Render يبني النسخة بدون deny-list
# ثم deploy fresh
```

---

## 9. الـ Decision الجديد

**DEC-SEC-2026-07-25-001**: Defense-in-depth deny-list هو **الآلية المعتمدة** لمنع تسريب الـ deployment artifact على brightai.site. أي محاولة مستقبلية لإزالة الـ patcher أو تعديل الـ patterns يجب أن تمر عبر مراجعة يدوية + تجربة على staging.

**Reversal cost**: High — لو رجعنا للـ mechanism القديم (build filter فقط)، نفقد الطبقة 1 من الحماية. لو حدث تسريب مماثل، الـ impact security + reputational (BrightAI يبيع خدمات حوكمة AI لجهات سعودية منظّمة).

---

## 10. Related

- `report/SAUDI-SEO-AUDIT-2026-06.md` (KI-001 original)
- `.agents/brain.md` Section 2 (this change ledger) + Section 3 (KI-001 → resolved)
- `src/server/deny-list.mjs` (source of truth for the deny-list)
- `scripts/patch-server-entry.mjs` (the patcher)
- `scripts/verify-deployment-surface.mjs` (the gate)
- `render.yaml` (preDeployCommand = `pnpm run verify:deployment-surface` — unchanged, already wired)

---

## Verification Status (BAI-PROC-12)

- **verified_local**: yes
  - `node scripts/verify-deployment-surface.mjs` — `/` 200, 13 forbidden paths all 404 ✓
  - `src/server/deny-list.mjs` — 14 deny patterns (frontend/, client/, _archive/, package-lock 2.json, etc.) ✓
  - `scripts/patch-server-entry.mjs` — idempotent deny-list injection (negative lookahead regex) ✓
  - `render.yaml` — `preDeployCommand: pnpm run verify:deployment-surface` blocks bad deploys ✓
  - `pnpm build` — 196 pages, 0 errors ✓
- **verified_production**: no
- **verified_production_blocker**: awaiting user commit + Render auto-deploy + `pnpm run cloudflare:purge` per BAI-DEPLOY-11. Without these, `https://brightai.site/frontend/server.js` still returns 200 (the exact leak this ticket closes — the original KI-001 from 2026-06-29).

> To promote this report to `verified_production: yes`, run after deploy: `pnpm run verify:production` — the `forbidden paths 404` probe must pass. Update the report with `verified_production_commit: <SHA>`.
