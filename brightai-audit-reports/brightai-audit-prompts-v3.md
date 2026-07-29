# BrightAI Championship Audit v3 — Prompts

**Generated:** 2026-07-29
**المصدر:** تقرير التدقيق v3 (`brightai-audit-report-v3.pdf`)
**الإجمالي:** 82 برومبت (الهدف 60-100 ✅)

---

## المجموعات

| المجموعة | العدد | النطاق |
|---|---|---|
| BAI-DEPLOY | 4 | نشر + purge + verify |
| BAI-SEC | 5 | Gemini key + CSP + /api/* |
| BAI-IDX | 5 | lastmod + redirects + hreflang + HSTS |
| BAI-SAID | 11 | Saudi Championship (محور جديد) |
| BAI-KERNEL | 16 | Kernel Championship (محور جديد) |
| BAI-MOBILE | 10 | Mobile Championship |
| BAI-DESIGN | 6 | trust + line-height + cards |
| BAI-A11Y | 5 | focus + alt + ARIA + contrast |
| BAI-PERF | 5 | Lighthouse + fonts + images |
| BAI-ARCH | 5 | تفكيك + tests + cleanup |
| BAI-MEAS | 5 | GA4 + consent + uptime + GSC |
| BAI-GROWTH | 5 | PR + LinkedIn + backlinks |

## القالب الإلزامي لكل برومبت

كل برومبت يحوي: `ID · Priority/Effort/Impact/Risk/Depends/Blocks · CONTEXT · FILES IN SCOPE · MUST NOT TOUCH · TASK · ACCEPTANCE CRITERIA (≥1 curl على الإنتاج) · VERIFICATION COMMANDS · ROLLBACK · DEFINITION OF DONE`.

## ترتيب التنفيذ (Batches 1→5)

| Batch | الإطار | الهدف | المجموعات |
|---|---|---|---|
| 1 | 48h | deploy + secure + Gemini live | DEPLOY-13/14/15, SEC-13/16, IDX-13/16, SAID-01/02 |
| 2 | أسبوعان | Saudi content + kernel real | KERNEL-01/02/03, SAID-03/04/05/06, SEC-18/20, DESIGN-06 |
| 3 | شهر | mobile + AEO | MOBILE-01..04, A11Y-01..04, SAID-07/08, PERF-02 |
| 4 | 3 أشهر | SERP top 3 + backlinks | SAID-09, GROWTH-01/02/03, MEAS-01, ARCH-01/02/03 |
| 5 | 6 أشهر | #1 KSA + Arab world | SAID-10/11, KERNEL-04/05/06, MOBILE-05, GROWTH-04 |

---

## PROMPT [ID: BAI-DEPLOY-13] — إعادة نشر Render كـ Node Web Service (حاجب رئيسي)

**Priority: P0 · Effort: 1h · Impact: 10 · Risk: medium · Depends: none · Blocks: BAI-KERNEL-01..08**

**CONTEXT** — خدمة brightai-site المنشورة على Render مُعدّة كـ Static Site بدل Node web service، رغم أن render.yaml:11-15 يصف runtime:node + startCommand: node ./dist/server/entry.mjs. النتيجة: كل /api/* تخدم empty 200 على POST و 404 على GET. هيدر rndr-id (بصمة Static Site) حاضر، وغياب x-brightai-build (الذي يُحقنه entry.mjs) يؤكد أن Node server لا يعمل. chat.ts مكتمل ومبني (dist/server/entry.mjs يحوي 3 مراجع لمسار chat) لكنه لا يُنفّذ.

**FILES IN SCOPE**
- render.yaml:11-15 (runtime/startCommand/healthCheckPath)
- Render dashboard (إعداد الخدمة — خارج الريبو)
- astro.config.mjs:182-189,230 (output:static + adapter node standalone)

**MUST NOT TOUCH / PRESERVE**
- src/pages/api/** (الكود سليم، لا تعديل)
- dist/server/** (مبني صحيح)
- trailingSlash:'always' (مقدّس — Section 2.1)

**TASK**
1. في Render dashboard، افتح خدمة brightai-site.
2. غيّر نوع الخدمة من "Static Site" إلى "Web Service" مع runtime Node 22.
3. تأكد أن startCommand = `node ./dist/server/entry.mjs` (يطابق render.yaml:15).
4. تأكد أن healthCheckPath = `/api/health/` (render.yaml:15).
5. أضف env vars (انظر BAI-DEPLOY-14).
6. Deploy + انتظر health check green.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `curl -i https://brightai.site/api/health/` → 200 + JSON `{"status":"ok"}` + هيدر `x-brightai-build: <sha>`
- `curl -i -X POST https://brightai.site/api/ai/chat/ -H "Origin: https://brightai.site" -H "Content-Type: application/json" -d '{"message":"مرحبا"}'` → 200 + `{"reply":"...","provider":"gemini"}`

**VERIFICATION COMMANDS**
```bash
curl -sI https://brightai.site/api/health/ | grep -iE "http|x-brightai-build"
curl -s -X POST https://brightai.site/api/ai/chat/ -H "Origin: https://brightai.site" -H "Content-Type: application/json" -d '{"message":"test"}' | head -c 200
pnpm run verify:post-deploy
```

**ROLLBACK** — في Render dashboard، عُدّ للنشر السابق (Static Site). الكود غير متأثر لأن التعديل إعداد نشر فقط.

**DEFINITION OF DONE** — /api/health/ يرجع JSON، /api/ai/chat/ يرجع reply حقيقي من Gemini، x-brightai-build header حاضر في كل رد /api/*.

---

## PROMPT [ID: BAI-DEPLOY-14] — ضبط env vars على Render + verify:post-deploy

**Priority: P0 · Effort: 1h · Impact: 8 · Risk: low · Depends: BAI-DEPLOY-13 · Blocks: none**

**CONTEXT** — بعد تحويل الخدمة لـ Node، تحتاج env vars الإنتاجية مفعّلة على Render dashboard. chat.ts يقرأ process.env في runtime فقط (لا في bundle). بدون REDIS_URL، quota + session degrade. بدون DATABASE_URL، LeadQueue لا يعمل.

**FILES IN SCOPE**
- Render dashboard (Environment tab)
- .env.example (مرجع — لا commit للقيم)

**MUST NOT TOUCH / PRESERVE**
- .env (gitignored، تحديث محلي فقط)
- لا commit لقيم secrets

**TASK**
1. في Render → Environment، أضف/حدّث:
   GEMINI_API_KEY (مُدوَّر جديد من BAI-SEC-13)
   GROQ_API_KEY
   REDIS_URL=rediss://...
   DATABASE_URL=postgresql://...
   BRIGHTAI_CHAT_KEY
   CHAT_STREAMING_ENABLED=true
   GEMINI_MODEL=gemini-2.5-flash
2. Deploy.
3. شغّل verify:post-deploy محليًا للتأكد من تطابق هوية build الحية مع git HEAD.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `curl -s -X POST https://brightai.site/api/ai/chat/ -H "Origin: https://brightai.site" -H "Content-Type: application/json" -d '{"message":"test"}'` → reply حقيقي
- `curl -sI https://brightai.site/api/health/` → 200

**VERIFICATION COMMANDS**
```bash
curl -s -X POST https://brightai.site/api/ai/chat/ -H "Origin: https://brightai.site" -H "Content-Type: application/json" -d '{"message":"test"}'
pnpm run verify:post-deploy
```

**ROLLBACK** — أزِل env vars من Render dashboard. الكود يحتاجهم لكن يعمل بـ degraded mode.

**DEFINITION OF DONE** — كل env vars مضبوطة + verify:post-deploy exit 0 + chat يرجع reply حقيقي.

---

## PROMPT [ID: BAI-DEPLOY-15] — Cloudflare cache purge تلقائي بعد كل deploy

**Priority: P0 · Effort: 2h · Impact: 6 · Risk: low · Depends: BAI-DEPLOY-13 · Blocks: none**

**CONTEXT** — TTL 5 دقائق (s-maxage:300) يخدم نسخة قديمة بعد كل deploy. المستخدمون يرون HTML قديم حتى انتهاء TTL. purge-cloudflare-cache.mjs موجود في scripts/ لكن لم يُشغّل في pipeline.

**FILES IN SCOPE**
- scripts/purge-cloudflare-cache.mjs
- .github/workflows/deploy.yml (hook post-deploy)
- Cloudflare dashboard (API token)

**MUST NOT TOUCH / PRESERVE**
- public/_headers (cache-control values — مقدّسة)

**TASK**
1. أنشئ Cloudflare API token مع Zone.Cache Purge permission.
2. أضف CLOUDFLARE_API_TOKEN + CLOUDFLARE_ZONE_ID ك Render env vars أو GitHub secrets.
3. في deploy.yml، أضف step بعد deploy: `node scripts/purge-cloudflare-cache.mjs`.
4. اختبر: deploy + فورًا curl الرئيسية → يجب أن يخدم الجديد.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- بعد deploy: `curl -sI https://brightai.site/ | grep -i age` → age قريب من 0 (وليس 113+)

**VERIFICATION COMMANDS**
```bash
curl -sI https://brightai.site/ | grep -iE "age|cf-cache"
# trigger deploy then immediately:
curl -sI https://brightai.site/ | grep -i age
```

**ROLLBACK** — أزِل step من deploy.yml. الـ cache سيتطابق طبيعيًا بعد TTL 5 دقائق.

**DEFINITION OF DONE** — بعد كل deploy، purge تلقائي + age قريب من 0 على الرئيسية.

---

## PROMPT [ID: BAI-DEPLOY-16] — إصلاح verify-deployment-surface.mjs (يفحص الإنتاج لا localhost)

**Priority: P1 · Effort: 2h · Impact: 5 · Risk: low · Depends: none · Blocks: none**

**CONTEXT** — scripts/verify-deployment-surface.mjs عيب: "Local-only verification, no live-URL probe" — يفحص 127.0.0.1:4317 بدل الإنتاج. نتيجة: CI يمرّ محليًا لكن الإنتاج قد يكون مكسور.

**FILES IN SCOPE**
- scripts/verify-deployment-surface.mjs
- package.json (verify:post-deploy script)

**MUST NOT TOUCH / PRESERVE**
- المنطق الأساسي (أضِف live probe فقط)

**TASK**
1. اقرأ verify-deployment-surface.mjs.
2. أضِف LIVE_URL probe: بعد الفحص المحلي، افحص https://brightai.site/api/health/ + /api/ai/chat/ بـ curl.
3. قارن هوية build (x-brightai-build header) مع git HEAD.
4. افشل الـ CI إن اختلف الإنتاج عن HEAD.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `node scripts/verify-deployment-surface.mjs` → يفحص الإنتاج فعليًا + exit 0

**VERIFICATION COMMANDS**
```bash
node scripts/verify-deployment-surface.mjs
curl -sI https://brightai.site/api/health/ | grep x-brightai-build
```

**ROLLBACK** — git revert. السكربت القديم يفحص محلي فقط (الأصل).

**DEFINITION OF DONE** — verify:post-deploy يفحص الإنتاج + يقارن هوية build + يفشل عند drift.

---

## PROMPT [ID: BAI-SEC-13] — تدوير مفتاح Gemini + إزالته من brain.md + 3 تقارير

**Priority: P0 · Effort: 1h · Impact: 10 · Risk: low · Depends: none · Blocks: BAI-KERNEL-01**

**CONTEXT** — المفتاح القديم AIzaSyC3pLdZ-7R2XlvPFTZ8Alg93zkuThHbQYM لا يزال نصًا صريحًا في .agents/brain.md:4373 + 3 تقارير (report/A/2026-07-15-kernel-audit-master.md:119, report/A/2026-07-18-pre-audit-brain-snapshot.md:1320, brightai-audit-reports/prompt/brightai-audit-prompts.md:289) — كلها متتبّعة في git. المفتاح CONSUMER_SUSPENDED لكن التعرّض النصّي باقٍ. لقطة شاشة المالك كشفت المفتاح الجديد AIzaSyBFMm… كاملة → يجب تدويره أيضًا.

**FILES IN SCOPE**
- .agents/brain.md:4373
- report/A/2026-07-15-kernel-audit-master.md:119
- report/A/2026-07-18-pre-audit-brain-snapshot.md:1320
- brightai-audit-reports/prompt/brightai-audit-prompts.md:289
- Google AI Studio (تدوير خارج الريبو)
- Render dashboard env

**MUST NOT TOUCH / PRESERVE**
- src/pages/api/ai/chat.ts (يقرأ process.env، لا تغيير)
- .env (gitignored)

**TASK**
1. في Google AI Studio، أنشئ مفتاح Gemini جديد. عطّل/احذف القديمين.
2. حدّث GEMINI_API_KEY على Render (النشر القادم يلتقطه).
3. استبدل القيمة النصية في brain.md:4373 بـ `process.env.GEMINI_API_KEY (rotated 2026-07-29)`.
4. كرّر للملفات الـ 3 الأخرى.
5. commit + push.
6. (موصى) git filter-repo لتنظيف القيمة من التاريخ.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `grep -rn "AIzaSy" . --include="*.md" --include="*.ts" 2>/dev/null | grep -v node_modules` → 0 نتائج
- `git log --all -S "AIzaSyC3pLdZ" --oneline | head` → 0 أو مرجع env فقط

**VERIFICATION COMMANDS**
```bash
grep -rn "AIzaSy" .agents/ report/ brightai-audit-reports/ 2>/dev/null | grep -v node_modules
git log --all -S "AIzaSyC3pLdZ" --oneline | head
```

**ROLLBACK** — لا rollback (الأمان: القيمة المسروقة لا يجب أن تعود). إن كسر التطبيق، حدّث GEMINI_API_KEY على Render بالمفتاح الجديد.

**DEFINITION OF DONE** — صفر قيم AIzaSy في الريبو + المفتاح مُدوَّر في Google + محدّث في Render.

---

## PROMPT [ID: BAI-SEC-16] — /api/lead يرجع JSON صريح (PDPL مادة 16 — المساءلة)

**Priority: P0 · Effort: 2h · Impact: 7 · Risk: low · Depends: BAI-DEPLOY-13 · Blocks: none**

**CONTEXT** — /api/lead/ يرجع silent 200 فارغ (content-length:0) بدل JSON صريح. مخالفة PDPL المادة 16 (المساءلة) — المرسل لا يعرف هل استُلم طلبه. بعد BAI-DEPLOY-13، الكود يعمل لكن يجب التأكد أنه يرجع JSON واضح.

**FILES IN SCOPE**
- src/pages/api/lead.ts (response shape)
- src/pages/kernel/* (fetch handler في الواجهة)

**MUST NOT TOUCH / PRESERVE**
- منطق validation/CSRF/rate limit (سليم)
- النص العربي للرسائل

**TASK**
1. اقرأ lead.ts response branches.
2. لكل branch (success, validation_failed, rate_limited, csrf_failed)، تأكد يرجع `{status, message, code}` بـ content-type: application/json.
3. في الواجهة، أضِف user-facing feedback لكل response.
4. اختبر على الإنتاج بعد النشر.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `curl -i -X POST https://brightai.site/api/lead/ -H "Origin: https://brightai.site" -H "Content-Type: application/json" -d '{"name":"test","contact":"t@t.com"}'` → 200 + JSON body (وليس empty)

**VERIFICATION COMMANDS**
```bash
curl -i -X POST https://brightai.site/api/lead/ -H "Origin: https://brightai.site" -H "Content-Type: application/json" -d '{"name":"test","contact":"t@t.com"}' | head -20
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — /api/lead/ يرجع JSON صريح لكل branch + الواجهة تُظهر feedback للمستخدم.

---

## PROMPT [ID: BAI-SEC-18] — CSP Phase 2: nonce-based (إزالة unsafe-inline من kernel)

**Priority: P1 · Effort: 24h · Impact: 6 · Risk: medium · Depends: BAI-DEPLOY-13 · Blocks: none**

**CONTEXT** — CSP في الإنتاج يحوي script-src 'unsafe-inline' بسبب 15 inline <script> في صفحات kernel (تستخدم define:vars). Phase 1 (SHA-256) تم في security-headers.mjs. Phase 2 (nonce-based) معلّقة — تحتاج نقل كل inline script لـ public/js/kernel-*.js + استبدال define:vars بـ <script type="application/json"> data blocks.

**FILES IN SCOPE**
- src/pages/kernel/chat.astro, audit.astro, approvals.astro, policies.astro, scenarios.astro, evidence.astro, stats.astro, reports.astro, compliance.astro, connectors.astro (15 inline script)
- src/components/kernel/KernelAiAssistant.astro, KernelLeadForm.astro
- public/js/kernel-*.js (new)
- scripts/security-headers.mjs (CSP nonce injection)

**MUST NOT TOUCH / PRESERVE**
- النص العربي
- المنطق الأساسي لكل script (انقل فقط، لا إعادة كتابة)
- trailingSlash

**TASK**
1. لكل صفحة kernel، استخرج inline <script> لـ public/js/kernel-<page>.js.
2. استبدل define:vars بـ <script type="application/json" data-kernel-config>{...}</script>.
3. في security-headers.mjs، فعّل nonce-based CSP: أزِل unsafe-inline + أضِف nonce per-request.
4. اختبر كل صفحة kernel محليًا ثم على الإنتاج.
5. أكّد zero CSP violations في console.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `curl -sI https://brightai.site/kernel/chat/ | grep -i content-security` → script-src بدون unsafe-inline
- Playwright: صفر console errors من CSP على كل صفحات kernel

**VERIFICATION COMMANDS**
```bash
curl -sI https://brightai.site/kernel/chat/ | grep -i content-security
node scripts/playwright/capture-console-errors.mjs --url=https://brightai.site/kernel/chat/
```

**ROLLBACK** — git revert + re-add unsafe-inline في security-headers.mjs.

**DEFINITION OF DONE** — CSP خالٍ من unsafe-inline + صفر violations + كل صفحات kernel تعمل.

---

## PROMPT [ID: BAI-SEC-20] — body size limit على /api/* (10KB chat, 5KB lead)

**Priority: P1 · Effort: 2h · Impact: 5 · Risk: low · Depends: BAI-DEPLOY-13 · Blocks: none**

**CONTEXT** — /api/* بدون body size limit — يمكن إرسال 1MB body (DoS vector). chat.ts يحد message بـ 4000 chars لكن قبل قراءة الـ body بالكامل. lead.ts مشابه.

**FILES IN SCOPE**
- src/pages/api/ai/chat.ts (early body size check)
- src/pages/api/lead.ts
- src/middleware.ts (global limit optional)

**MUST NOT TOUCH / PRESERVE**
- منطق validation الحالي
- rate limit logic

**TASK**
1. في chat.ts، أضِف early check: إن Content-Length > 10240 → 413 Payload Too Large قبل قراءة body.
2. في lead.ts، limit 5120.
3. في middleware.ts، optional global limit 1MB لكل /api/*.
4. اختبر: `curl -X POST ... -d @largefile.bin` → 413.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `curl -i -X POST https://brightai.site/api/ai/chat/ -H "Content-Type: application/json" -d "$(python3 -c 'print("{"message:""+"x"*20000+""}")')"` → 413

**VERIFICATION COMMANDS**
```bash
curl -s -o /dev/null -w "%{http_code}" -X POST https://brightai.site/api/ai/chat/ -H "Content-Type: application/json" -d "$(python3 -c 'print("{"message":""+"x"*20000+""}")')"
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — /api/ai/chat/ يرفض body >10KB بـ 413، /api/lead/ >5KB بـ 413.

---

## PROMPT [ID: BAI-SEC-21] — حذف brain.md 1.2MB من الريبو العام (403 mentions KEY/SECRET)

**Priority: P1 · Effort: 3h · Impact: 7 · Risk: medium · Depends: BAI-SEC-13 · Blocks: none**

**CONTEXT** — .agents/brain.md (1.2MB) يحوي 403 mentions لـ KEY/SECRET/TOKEN + المفتاح القديم. ملتزم في git العام. خطر: أي ينسخ الريبو يرى سجل أسرار كامل. AGENTS.md Section 0.6 يعرفه كـ "دماغ المشروع" لكن يجب أن يكون خاصًا.

**FILES IN SCOPE**
- .agents/brain.md
- .gitignore
- (اختياري) repo منفصل خاص للـ brain

**MUST NOT TOUCH / PRESERVE**
- AGENTS.md (الـ protocol نفسه يبقى)
- التاريخ المرجعي في brain.md (انسخ لـ repo خاص)

**TASK**
1. انسخ .agents/brain.md لموقع خاص (repo منفصل أو local only).
2. أضِف .agents/brain.md لـ .gitignore.
3. git rm --cached .agents/brain.md.
4. commit + push.
5. (موصى) git filter-repo لإزالته من التاريخ.
6. أنشئ .agents/brain.template.md (نسخة نظيفة للمرجع العام).

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `curl -sI https://brightai.site/.agents/brain.md` → 404
- `git ls-files .agents/brain.md` → لا شيء

**VERIFICATION COMMANDS**
```bash
curl -sI https://brightai.site/.agents/brain.md -w "%{http_code}"
git ls-files .agents/ | head
git log --all --oneline -- .agents/brain.md | head
```

**ROLLBACK** — git revert + أزِل من .gitignore. (لكن هذا يُعيد التعرّض — غير موصى.)

**DEFINITION OF DONE** — brain.md ليس في الريبو العام + .gitignore يمنعه + template نظيف موجود.

---

## PROMPT [ID: BAI-IDX-13] — إصلاح lastmod per-page في sitemap الإنتاجي

**Priority: P0 · Effort: 3h · Impact: 8 · Risk: low · Depends: BAI-DEPLOY-13 · Blocks: none**

**CONTEXT** — scripts/generate-sitemap-all-pages.mjs:21-29 contract يقول "lastmod derived from git log, never from build timestamp". المحلي صحيح (9 تواريخ فريدة). الإنتاج يخدم 195 entry كلها 2026-07-29 (تاريخ البناء). Google يتجاهل lastmod لعدم مصداقيته.

**FILES IN SCOPE**
- scripts/generate-sitemap-all-pages.mjs
- astro.config.mjs (@astrojs/sitemap integration)
- build pipeline (render.yaml أو CI)

**MUST NOT TOUCH / PRESERVE**
- عدد URLs (195)
- ترتيب
- robots.txt sitemap reference

**TASK**
1. قارن public/sitemap.xml المحلي (9 تواريخ) مع curl الإنتاج (1 تاريخ).
2. ابحث: `grep -rn "lastmod" scripts/ astro.config.mjs .github/` — أين يُعاد كتابة.
3. إن كان @astrojs/sitemap يُعيد كتابة، عطّله أو اضبطه يستخدم المصدر.
4. إن كان Render build step، اضبطه ينسخ public/sitemap.xml بدون تعديل.
5. Deploy + تحقق.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `curl -s https://brightai.site/sitemap.xml | grep "<lastmod>" | sort -u | wc -l` → ≥ 5

**VERIFICATION COMMANDS**
```bash
curl -s https://brightai.site/sitemap.xml | grep -c "<lastmod>"
curl -s https://brightai.site/sitemap.xml | grep "<lastmod>" | sort -u | wc -l
curl -s https://brightai.site/sitemap.xml | grep "<lastmod>" | sort -u | head
```

**ROLLBACK** — git revert + re-deploy.

**DEFINITION OF DONE** — sitemap الإنتاجي يحوي ≥5 تواريخ lastmod فريدة مشتقة من git log.

---

## PROMPT [ID: BAI-IDX-16] — تفعيل _redirects على Render (Cloudflare Transform أو astro redirects)

**Priority: P0 · Effort: 3h · Impact: 7 · Risk: medium · Depends: none · Blocks: none**

**CONTEXT** — public/_redirects (216 سطر، 134 قاعدة) لا تُنفّذ على الإنتاج. المضيف يطبّق فقط trailing-slash normalization. النتيجة: /report → /report/ → 404، /blog/ai → 404، /blog.html → 404. 14% من الزيارات v1 كانت 404.

**FILES IN SCOPE**
- public/_redirects
- astro.config.mjs (redirects: option)
- Cloudflare dashboard (Transform Rules — مع موافقة المالك)

**MUST NOT TOUCH / PRESERVE**
- public/_redirects نفسه (protected — Section 2.1)
- redirect /blog → /blog/ (يعمل، لا تمسّه)

**TASK**
1. أضِف قواعد _redirects لـ astro.config.mjs redirects: option (يعمل confirmed).
2. أو أنشئ Cloudflare Transform Rule (مع موافقة المالك — ملف محمي).
3. اختبر 5 قواعد عيّنة: /report, /blog/ai, /blog.html, /blog/Generative-artificial-intelligence, /client/index.html.
4. شغّل redirects:check.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `curl -sI https://brightai.site/report | grep -i location` → /trust/
- `curl -sI https://brightai.site/blog.html | grep -i http` → 301

**VERIFICATION COMMANDS**
```bash
curl -sI https://brightai.site/report | grep -iE "http|location"
curl -sI https://brightai.site/blog.html | grep -iE "http|location"
curl -sI https://brightai.site/blog/ai | grep -iE "http|location"
npm run redirects:check
```

**ROLLBACK** — git revert + re-deploy.

**DEFINITION OF DONE** — كل قواعد _redirects تعمل 301 + redirects:check exit 0.

---

## PROMPT [ID: BAI-IDX-17] — hreflang للـ kernel pages (en-SA peers) أو توثيق القرار

**Priority: P2 · Effort: 4h · Impact: 4 · Risk: low · Depends: none · Blocks: none**

**CONTEXT** — kernel (11 صفحة) وكل الصفحات بلا en-SA hreflang. قرار موثّق (hreflang-pairs.ts:102-108 "no invented English peer"). لكن إن أردنا التوسع لـ EN market، نحتاج صفحات EN للـ kernel.

**FILES IN SCOPE**
- src/data/hreflang-pairs.ts
- src/pages/en/kernel/ (new — optional)
- scripts/hreflang-bidirectional-audit.mjs

**MUST NOT TOUCH / PRESERVE**
- الـ 7 أزواج الموجودة
- النص العربي المنشور

**TASK**
1. قرر مع المالك: هل التوسع لـ EN kernel أولوية؟ (احتمال لا — السوق سعودي).
2. إن نعم: أنشئ src/pages/en/kernel/* mirrored.
3. أضِف لـ hreflang-pairs.ts.
4. شغّل audit.
5. إن لا: أكّد القرار في comment أوثق.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `curl -s https://brightai.site/kernel/chat/ | grep -oE 'hreflang="[^"]*"'` → إما ar-SA only (موثّق) أو ar-SA + en-SA

**VERIFICATION COMMANDS**
```bash
curl -s https://brightai.site/kernel/chat/ | grep -oE 'hreflang="[^"]*"'
node scripts/hreflang-bidirectional-audit.mjs 2>&1 | tail -5
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — قرار موثّق (إما EN kernel مع hreflang أو comment صريح بالرفض).

---

## PROMPT [ID: BAI-IDX-18] — /index.html → 301 redirect للجذر (إزالة duplicate URL)

**Priority: P2 · Effort: 1h · Impact: 3 · Risk: low · Depends: none · Blocks: none**

**CONTEXT** — /index.html يُخدم بـ 200 (canonical يشير للجذر، يحمي من duplicate لكن URL منفصل قابل للزحف). الأفضل 301.

**FILES IN SCOPE**
- astro.config.mjs (redirects)
- public/_redirects (مع موافقة)

**MUST NOT TOUCH / PRESERVE**
- canonical self-referential على الجذر

**TASK**
1. أضِف redirect: /index.html → / 301 في astro.config redirects.
2. اختبر.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `curl -sI https://brightai.site/index.html | grep -i http` → 301 → /

**VERIFICATION COMMANDS**
```bash
curl -sI https://brightai.site/index.html | grep -iE "http|location"
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — /index.html → 301 → /.

---

## PROMPT [ID: BAI-IDX-19] — HSTS preload list submission (hstspreload.org)

**Priority: P2 · Effort: 1h · Impact: 4 · Risk: low · Depends: none · Blocks: none**

**CONTEXT** — HSTS header موجود (max-age=63072000; preload) لكن التسليم في hstspreload.org خطوة يدوية لم تُؤكّد. بدون التسليم، المتصفحات لا تفرض HSTS على أول زيارة.

**FILES IN SCOPE**
- https://hstspreload.org (manual)
- public/_headers (التأكيد فقط)

**MUST NOT TOUCH / PRESERVE**
- قيمة HSTS header

**TASK**
1. افتح hstspreload.org.
2. أدخل brightai.site.
3. تأكد إنه يطابق المعايير (HTTPS only, HSTS header صحيح, subdomains, preload).
4. Submit.
5. انتظر الموافقة (قد تأخذ أسابيع).

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- زيارة hstspreload.org/?domain=brightai.site → Status: Pending/Approved

**VERIFICATION COMMANDS**
```bash
curl -sI https://brightai.site/ | grep -i strict-transport
# ثم تحقق يدوي في hstspreload.org
```

**ROLLBACK** — لا يمكن rollback بسهولة (preload list دائمة — تحذير).

**DEFINITION OF DONE** — brightai.site في HSTS preload list.

---

## PROMPT [ID: BAI-SAID-01] — رقم السجل التجاري في footer + JSON-LD + llms.txt

**Priority: P0 · Effort: 2h · Impact: 9 · Risk: low · Depends: user-provides-CR · Blocks: BAI-SAID-04**

**CONTEXT** — صفر ذكر لرقم سجل تجاري عبر كل الصفحات + JSON-LD + llms.txt. في سوق B2B سعودي تنفيذي، غياب إثبات الكيان القانوني = حاجز ثقة حرج.

**FILES IN SCOPE**
- src/components/Footer.astro
- src/data/site.ts (crNumber field)
- src/data/schema-saudi-seo.json + schema generator (taxID/identifier)
- public/llms.txt + llms-full.txt

**MUST NOT TOUCH / PRESERVE**
- النص العربي المنشور الأخرى
- بنية JSON-LD الحالية (إضافة فقط)

**TASK**
1. اطلب من المالك رقم السجل التجاري الرسمي (10 أرقام).
2. أضف crNumber لـ src/data/site.ts.
3. في Footer.astro، أضف "سجل تجاري: 1010XXXXXX" بالقرب من العنوان.
4. في schema generator، أضف "taxID":"1010XXXXXX" و "identifier":"CR-1010XXXXXX".
5. في llms.txt Entity Facts، أضف Commercial Registration line.
6. في llms-full.txt، أضف قسم تفصيلي.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `curl -s https://brightai.site/ | grep -oE 'سجل تجاري[^<"]*|1010[0-9]{6}'` → الرقم
- `curl -s https://brightai.site/ | grep -oE '"taxID":"[^"]*"` → القيمة

**VERIFICATION COMMANDS**
```bash
curl -s https://brightai.site/ | grep -oiE "سجل تجاري|taxID|1010[0-9]{6}"
curl -s https://brightai.site/llms.txt | grep -i "commercial\|سجل"
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — CR ظاهر في footer كل الصفحات + JSON-LD + llms.txt.

---

## PROMPT [ID: BAI-SAID-02] — توحيد هوية المؤسس "يزيد الشريف" + صورة + سيرة

**Priority: P0 · Effort: 2h · Impact: 8 · Risk: low · Depends: user-confirms-name · Blocks: BAI-SAID-05**

**CONTEXT** — JSON-LD founder.name = "يزيد" فقط. "يزيد الشريف" في /authors/yazeed-alshareef/ لكن "يزيد الشمري" يظهر أيضًا في about (تناقض). avatar = حرف "ي" فقط. لا سيرة مهنية بخبرات سابقة.

**FILES IN SCOPE**
- src/data/site.ts أو schema generator (founder name)
- src/data/schema-saudi-seo.json
- src/pages/about/ (نص + تناقض)
- src/components (founder avatar → img)
- public/founder.jpg (new from owner)

**MUST NOT TOUCH / PRESERVE**
- النص العربي المنشور الأخرى
- LinkedIn URL الحالي

**TASK**
1. أكّد مع المالك الاسم القانوني الكامل.
2. حدّث JSON-LD founder.name للاسم الكامل + familyName + givenName.
3. أزل الاسم المتناقض من about.
4. استبدل founder avatar بـ <img src="/founder.jpg">.
5. أضف سيرة مهنية (خبرات سابقة مسمّاة) في about.
6. اربط LinkedIn حقيقي.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `curl -s https://brightai.site/ | grep -oE '"founder":\{[^}]*"name":"[^"]*"` → "name":"يزيد الشريف"
- `curl -s https://brightai.site/about/ | grep -c "founder.*img\|img.*founder"` → ≥ 1

**VERIFICATION COMMANDS**
```bash
curl -s https://brightai.site/ | grep -oE '"name":"يزيد[^"]*"'
curl -s https://brightai.site/about/ | grep -oiE "الشمري|الشريف" | sort | uniq -c
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — JSON-LD موحّد على الاسم الكامل + صورة حقيقية + سيرة + لا تناقض.

---

## PROMPT [ID: BAI-SAID-03] — 10 صفحات /answer/* بـ FAQPage + Speakable (AEO)

**Priority: P1 · Effort: 16h · Impact: 8 · Risk: low · Depends: none · Blocks: none**

**CONTEXT** — لا صفحات /answer/*. llms.txt يحوي Target AI Search Queries صريحة لكنها لا تُترجم لصفحات. هذه الصفحات تتغذى منها Perplexity/ChatGPT مباشرة.

**FILES IN SCOPE**
- src/pages/answer/[slug].astro (new dynamic route)
- src/data/answers.ts (new — 10 Q&A pairs)
- src/components/SEOHead.astro (FAQPage + Speakable schema)

**MUST NOT TOUCH / PRESERVE**
- llms.txt Target Queries (المصدر)
- النص العربي المنشور

**TASK**
1. استخرج 10 Target Queries من llms.txt.
2. اكتب جواب محدّد (150-300 كلمة) لكل واحدة بالسعودية.
3. أنشئ src/pages/answer/[slug].astro بـ FAQPage + Speakable schema.
4. أضِف internal links من صفحات pillar.
5. أضِف لـ sitemap + llms.txt.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `curl -s -o /dev/null -w "%{http_code}" https://brightai.site/answer/ai-firewall/` → 200
- `curl -s https://brightai.site/answer/ai-firewall/ | grep -oE '"@type":"FAQPage"'` → present

**VERIFICATION COMMANDS**
```bash
curl -s -o /dev/null -w "%{http_code}" https://brightai.site/answer/ai-firewall/
curl -s https://brightai.site/answer/ai-firewall/ | grep -oE '"@type":"(FAQPage|SpeakableSpecification)"' | sort -u
```

**ROLLBACK** — git revert + حذف src/pages/answer/.

**DEFINITION OF DONE** — 10 صفحات /answer/* تعمل + FAQPage schema + في sitemap.

---

## PROMPT [ID: BAI-SAID-04] — 5 صفحات /lp/* تجارية (PDPL/ECC/banking/health/gov)

**Priority: P1 · Effort: 20h · Impact: 7 · Risk: low · Depends: none · Blocks: none**

**CONTEXT** — لا صفحات /lp/*. landing pages تجارية مخصصة لكلمات الطلب العالي (PDPL, ECC, banking, healthcare, government) تزيد conversion + تستهدف SERP.

**FILES IN SCOPE**
- src/pages/lp/[slug].astro (new)
- src/data/landing-pages.ts (new — 5 pages metadata)
- src/components/SplitHero.astro (reuse)

**MUST NOT TOUCH / PRESERVE**
- النص العربي المنشور
- /solutions/* الموجودة (link إليها)

**TASK**
1. حدّد 5 كلمات: PDPL, ECC, AI banking, AI healthcare, AI government.
2. لكل واحدة، اكتب landing page (800-1200 كلمة) بالسعودية.
3. Hero + trust signals + CTA + FAQ + internal links لـ /solutions/.
4. أضِف JSON-LD (Service + FAQPage).
5. أضِف لـ sitemap + llms.txt + internal mesh.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `curl -s -o /dev/null -w "%{http_code}" https://brightai.site/lp/pdpl/` → 200
- `curl -s https://brightai.site/lp/pdpl/ | grep -oE '"@type":"Service"'` → present

**VERIFICATION COMMANDS**
```bash
curl -s -o /dev/null -w "%{http_code}" https://brightai.site/lp/pdpl/
curl -s https://brightai.site/lp/pdpl/ | grep -oE '"@type":"(Service|FAQPage)"' | sort -u
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — 5 صفحات /lp/* تعمل + schema + في sitemap + internal links.

---

## PROMPT [ID: BAI-SAID-05] — عنقود SDAIA (8 مقالات + pillar)

**Priority: P1 · Effort: 24h · Impact: 6 · Risk: low · Depends: none · Blocks: none**

**CONTEXT** — عنقود محتوى لـ "SDAIA" — المنظّم الرئيسي. 8 مقالات (1500+ كلمة) + pillar page تربطهم. يبني topical authority.

**FILES IN SCOPE**
- src/content/blog/sdaia-*.md (8 new)
- src/pages/solutions/government-ai-governance/ (pillar — موجود)

**MUST NOT TOUCH / PRESERVE**
- النص العربي المنشور
- sdaia cluster الموجود (6 مقالات من v2)

**TASK**
1. راجع الـ 6 مقالات SDAIA الموجودة (v2).
2. أضِف مقالين جديدين للوصول لـ 8.
3. تأكد كل واحد 1500+ كلمة.
4. اربطهم بـ pillar + internal mesh.
5. أضِف schema (Article + BreadcrumbList).

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `curl -s https://brightai.site/blog/ | grep -c "sdaia"` → ≥ 8

**VERIFICATION COMMANDS**
```bash
grep -rl "sdaia" src/content/blog/ | wc -l
curl -s https://brightai.site/sitemap.xml | grep -c "sdaia"
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — 8 مقالات SDAIA + pillar + internal mesh + في sitemap.

---

## PROMPT [ID: BAI-SAID-06] — عنقود PDPL (8 مقالات + pillar متعمق)

**Priority: P1 · Effort: 24h · Impact: 6 · Risk: low · Depends: none · Blocks: none**

**CONTEXT** — كلمة "PDPL" عالية الطلب لكن BrightAI غائب عن أول 10 نتائج. عنقود 8 مقالات + pillar متعمق (3000+ كلمة) يبني authority.

**FILES IN SCOPE**
- src/content/blog/pdpl-*.md (8 new)
- src/pages/solutions/ (pillar new or existing)

**MUST NOT TOUCH / PRESERVE**
- النص العربي المنشور
- legal pages الموجودة

**TASK**
1. اكتب pillar PDPL (3000+ كلمة) — شرح كامل للنظام.
2. اكتب 8 مقالات cluster (1500+ كل): PDPL for banks, healthcare, AI, cross-border, DPO, DPIA, breaches, consent.
3. internal mesh + FAQ schema.
4. أضِف لـ sitemap + llms.txt.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `curl -s https://brightai.site/sitemap.xml | grep -c "pdpl"` → ≥ 9

**VERIFICATION COMMANDS**
```bash
grep -rl "pdpl" src/content/blog/ | wc -l
curl -s https://brightai.site/sitemap.xml | grep -ci "pdpl"
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — 8 مقالات PDPL + pillar 3000+ كلمة + internal mesh.

---

## PROMPT [ID: BAI-SAID-07] — عنقود ECC (8 مقالات) + ISO 42001 (8 مقالات)

**Priority: P2 · Effort: 40h · Impact: 6 · Risk: low · Depends: none · Blocks: none**

**CONTEXT** — كلمتا "ECC" و "ISO 42001" مكتظتان لكن BrightAI يقدم compliance-readiness. عنقودان يبنيان authority في هذي المجالات.

**FILES IN SCOPE**
- src/content/blog/ecc-*.md (8 new)
- src/content/blog/iso-42001-*.md (8 new)

**MUST NOT TOUCH / PRESERVE**
- النص العربي المنشور

**TASK**
1. اكتب 8 مقالات ECC (كل ضابط/مجال).
2. اكتب 8 مقالات ISO 42001 (كل clause).
3. internal mesh + pillar pages.
4. schema + sitemap.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `curl -s https://brightai.site/sitemap.xml | grep -c "ecc\|iso-42001"` → ≥ 16

**VERIFICATION COMMANDS**
```bash
curl -s https://brightai.site/sitemap.xml | grep -ciE "ecc|iso-42001"
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — 16 مقالة (ECC + ISO 42001) + pillars + internal mesh.

---

## PROMPT [ID: BAI-SAID-08] — أول عميل مرجعي مسمّى + شعار في /customers/bank/

**Priority: P1 · Effort: — · Impact: 7 · Risk: low · Depends: first-customer-consent · Blocks: none**

**CONTEXT** — /customers/ = "بنك سعودي ريد"/"مستشفى كبير" (مجهول صراحةً). صفر social proof. أول عميل مسمّى + شعار يكسر حاجز الثقة.

**FILES IN SCOPE**
- src/pages/customers/bank/index.astro
- public/customers/ (logos new)

**MUST NOT TOUCH / PRESERVE**
- النص العربي المنشور
- transparency disclaimer في llms.txt (صادق — حافظ)

**TASK**
1. تواصل مع أول عميل وافق على reference.
2. احصل على شعار + اقتباس + (اختياري) أرقام.
3. أضِف لـ /customers/bank/ باسم العميل.
4. أضِف شعار لـ homepage trust section.
5. حدّث llms.txt (أزل disclaimer للمسمّى فقط).

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `curl -s https://brightai.site/customers/bank/ | grep -c "img"` → ≥ 1 شعار حقيقي

**VERIFICATION COMMANDS**
```bash
curl -s https://brightai.site/customers/bank/ | grep -oiE "بنك [^<]+|<img[^>]*customer"
```

**ROLLBACK** — git revert + إعادة anonymization.

**DEFINITION OF DONE** — عميل مسمّى + شعار في /customers/bank/ + homepage.

---

## PROMPT [ID: BAI-SAID-09] — Google Business Profile موثّق + NAP موحّد

**Priority: P2 · Effort: 4h · Impact: 5 · Risk: low · Depends: user-gmb-access · Blocks: none**

**CONTEXT** — [DATA GAP] GBP غير قابل للتحقق. العنوان موحّد في JSON-LD لكن GBP يحتاج إنشاء + توثيق. NAP (Name/Address/Phone) يجب أن يتطابق عبر كل الأماكن.

**FILES IN SCOPE**
- Google Business Profile (external)
- src/data/site.ts (NAP)
- src/components/Footer.astro

**MUST NOT TOUCH / PRESERVE**
- العنوان في JSON-LD
- رقم WhatsApp

**TASK**
1. أنشئ GBP لـ "6913 المبارك بن فضلة، الرياض 14254".
2. توثيق عبر بطاقة بريدية أو فيديو.
3. تأكد NAP يتطابق: JSON-LD + footer + GBP + llms.txt.
4. أضِف GBP link في footer.
5. اطلب reviews.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- GBP live على maps.google.com
- NAP متطابق عبر كل المراجع

**VERIFICATION COMMANDS**
```bash
curl -s https://brightai.site/ | grep -oE "المبارك بن فضالة"
curl -s https://brightai.site/llms.txt | grep -i "المبارك"
```

**ROLLBACK** — احذف GBP (ممكن خلال أول 30 يوم).

**DEFINITION OF DONE** — GBP موثّق + NAP متطابق + reviews تُجمع.

---

## PROMPT [ID: BAI-SAID-10] — شراكات جامعية (KSU/KFUPM/KAU)

**Priority: P3 · Effort: 40h · Impact: 4 · Risk: low · Depends: none · Blocks: none**

**CONTEXT** — شراكات مع جامعات سعودية تزيد Authority + تفتح قنوات talent + research. تذكر في llms.txt + homepage.

**FILES IN SCOPE**
- src/pages/trust/ (partnerships section)
- src/data/site.ts
- public/partners/ (logos)

**MUST NOT TOUCH / PRESERVE**
- النص العربي المنشور

**TASK**
1. تواصل مع KSU/KFUPM/KAU CS/AI departments.
2. اقترح partnership (research, internship, guest lecture).
3. عند الاتفاق، أضِف logos + description لـ /trust/.
4. أضِف لـ llms.txt.
5. press release (BAI-GROWTH-01).

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `curl -s https://brightai.site/trust/ | grep -ci "ksu\|kfupm\|kau"` → ≥ 1

**VERIFICATION COMMANDS**
```bash
curl -s https://brightai.site/trust/ | grep -ciE "ksu|kfupm|kau|جامعة"
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — شراكة موثّقة مع ≥1 جامعة + logo في /trust/.

---

## PROMPT [ID: BAI-SAID-11] — حضور LEAP 2026 + Black Hat MEA

**Priority: P3 · Effort: 60h · Impact: 4 · Risk: low · Depends: none · Blocks: none**

**CONTEXT** — مؤتمرات سعودية كبرى تزيد visibility + networking + press coverage.

**FILES IN SCOPE**
- src/pages/events/ (new — optional)
- press release

**MUST NOT TOUCH / PRESERVE**
- النص العربي المنشور

**TASK**
1. سجّل في LEAP 2026 + Black Hat MEA.
2. اطلب speaker slot أو booth.
3. غطّ الحضور في press release + LinkedIn.
4. أضِف لـ /trust/ أو /events/.
5. اجمع leads.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `curl -s https://brightai.site/ | grep -ci "leap\|black hat"` → ≥ 1 بعد الحدث

**VERIFICATION COMMANDS**
```bash
curl -s https://brightai.site/ | grep -ciE "leap|black hat"
```

**ROLLBACK** — احذف coverage لو انسحب.

**DEFINITION OF DONE** — حضور موثّق + press coverage + leads.

---

## PROMPT [ID: BAI-KERNEL-01] — إزالة seed data من chat + onboarding للمستخدم الأول

**Priority: P1 · Effort: 3h · Impact: 7 · Risk: low · Depends: BAI-DEPLOY-13 · Blocks: none**

**CONTEXT** — chat.astro:73-84 تبدأ بـ seed data ثابتة ("تصدير قائمة عملاء محظور") كأنها محادثة مستمرة — يُربك المستخدم الأول. لا onboarding tour. بعد BAI-DEPLOY-13، chat متصل بـ Gemini حقيقي، فالـ seed data مضلّلة.

**FILES IN SCOPE**
- src/pages/kernel/chat.astro:73-84 (seed messages)
- src/pages/kernel/chat.astro (empty state + onboarding)

**MUST NOT TOUCH / PRESERVE**
- النص العربي
- SSE reader logic
- error handling

**TASK**
1. أزل seed messages من chat.astro:73-84.
2. اعرض empty state: "ابدأ محادثة — اسأل عن PDPL/ECC/AI governance".
3. أضِف onboarding tooltip للأزرار الرئيسية (3-4 خطوات).
4. احتفظ بـ KernelDemoPill لكن عطّف على real mode بعد أول رسالة.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `curl -s https://brightai.site/kernel/chat/ | grep -c "ابدأ محادثة"` → ≥ 1
- Playwright: أول زيارة تعرض empty state، لا seed data

**VERIFICATION COMMANDS**
```bash
curl -s https://brightai.site/kernel/chat/ | grep -c "تصدير قائمة عملاء"
# المتوقع 0 بعد الإصلاح
curl -s https://brightai.site/kernel/chat/ | grep -c "ابدأ محادثة"
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — chat يبدأ بـ empty state + onboarding، لا seed data.

---

## PROMPT [ID: BAI-KERNEL-02] — empty states + skeleton loading لـ 10/11 صفحة kernel

**Priority: P1 · Effort: 12h · Impact: 6 · Risk: low · Depends: none · Blocks: none**

**CONTEXT** — KernelEmptyState + KernelSkeleton موجودان في src/components/kernel/ لكن 10/11 صفحة لا تستخدمهما. التحميل متزامن يسبب وميض. stats/connectors/reports/compliance = 0 empty state.

**FILES IN SCOPE**
- src/pages/kernel/{audit,approvals,evidence,policies,scenarios,stats,connectors,compliance,reports}.astro
- src/components/kernel/KernelEmptyState.astro, KernelSkeleton.astro

**MUST NOT TOUCH / PRESERVE**
- النص العربي
- منطق البيانات

**TASK**
1. لكل صفحة، أضِف <KernelSkeleton /> أثناء تحميل JS data.
2. أضِف <KernelEmptyState /> عند لا بيانات.
3. تأكد كل جدول/قائمة/شبكة لها fallback.
4. اختبر على mobile 360px.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- Playwright: كل صفحة تعرض skeleton → content (لا وميض)
- `curl -s https://brightai.site/kernel/stats/ | grep -c "KernelEmptyState\|empty"` → ≥ 1

**VERIFICATION COMMANDS**
```bash
node scripts/playwright/screenshot.mjs --url=https://brightai.site/kernel/stats/ --viewport=360x640
grep -c "KernelEmptyState\|KernelSkeleton" src/pages/kernel/*.astro
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — كل صفحات kernel الـ 10 تستخدم skeleton + empty state.

---

## PROMPT [ID: BAI-KERNEL-03] — اختبار firewall حي: ?scenario=pdpl-id-leak → HTTP 451

**Priority: P2 · Effort: 3h · Impact: 5 · Risk: low · Depends: BAI-DEPLOY-13 · Blocks: none**

**CONTEXT** — AI Firewall (K3) موجود في الكود (chat.ts:739) لكن لم يُختبر حي. سيناريو PII leak (رقم هوية) يجب أن يرجع 451 قبل الوصول لـ Gemini.

**FILES IN SCOPE**
- src/pages/kernel/chat.astro (scenario param handler)
- src/pages/api/ai/chat.ts:739-773 (firewall)
- tests/kernel/firewall.spec.mjs (new)

**MUST NOT TOUCH / PRESERVE**
- منطق firewall
- النص العربي للرسائل

**TASK**
1. أكّد chat.astro يقرأ ?scenario= param.
2. اكتب test: POST /api/ai/chat/ بـ message يحوي رقم هوية سعودي.
3. المتوقع: HTTP 451 + رسالة عربية.
4. أضِف test لـ CI.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `curl -s -o /dev/null -w "%{http_code}" -X POST https://brightai.site/api/ai/chat/ -H "Origin: https://brightai.site" -H "Content-Type: application/json" -d '{"message":"رقم هويتي 1234567890"}'` → 451

**VERIFICATION COMMANDS**
```bash
curl -s -o /dev/null -w "%{http_code}" -X POST https://brightai.site/api/ai/chat/ -H "Origin: https://brightai.site" -H "Content-Type: application/json" -d '{"message":"رقم هويتي 1234567890"}'
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — firewall يرجع 451 على PII حي + test في CI.

---

## PROMPT [ID: BAI-KERNEL-04] — توصيل audit/approvals بـ backend حقيقي (لا demo)

**Priority: P3 · Effort: 80h · Impact: 8 · Risk: high · Depends: BAI-DEPLOY-13 · Blocks: none**

**CONTEXT** — audit.astro + approvals.astro = demo (KernelDemoPill + setTimeout). ربطهم بـ backend حقيقي (Postgres LeadQueue + audit log table) يحوّلهم لمنتج.

**FILES IN SCOPE**
- src/pages/kernel/audit.astro, approvals.astro
- src/pages/api/kernel/audit.ts, approvals.ts (new)
- packages/db/schema.prisma (audit tables)

**MUST NOT TOUCH / PRESERVE**
- النص العربي
- demo UI (احتفظ به كـ fallback)

**TASK**
1. صمّم schema: audit_events, approval_requests, approval_decisions.
2. أنشئ /api/kernel/audit + /api/kernel/approvals (CRUD + auth).
3. ربط audit.astro بـ fetch live data.
4. ربط approvals.astro بـ real workflow.
5. احتفظ بـ demo toggle للتقييم.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `curl -s -o /dev/null -w "%{http_code}" https://brightai.site/api/kernel/audit/` → 200 + JSON
- audit.astro تعرض بيانات حقيقية

**VERIFICATION COMMANDS**
```bash
curl -s https://brightai.site/api/kernel/audit/ | head -c 200
node scripts/playwright/capture-console-errors.mjs --url=https://brightai.site/kernel/audit/
```

**ROLLBACK** — git revert + العودة لـ demo mode.

**DEFINITION OF DONE** — audit + approvals متصلان بـ backend + بيانات حقيقية.

---

## PROMPT [ID: BAI-KERNEL-05] — evidence file generation (PDF موقّع حقيقي)

**Priority: P3 · Effort: 60h · Impact: 6 · Risk: high · Depends: BAI-KERNEL-04 · Blocks: none**

**CONTEXT** — evidence.astro = demo. توليد PDF موقّع فعليًا (لـ compliance audit) يحوّلها لمنتج.

**FILES IN SCOPE**
- src/pages/kernel/evidence.astro
- src/pages/api/kernel/evidence.ts (new — PDF generation)
- packages/ (PDF signing lib)

**MUST NOT TOUCH / PRESERVE**
- النص العربي
- iframe preview

**TASK**
1. اختر PDF lib (pdfkit أو puppeteer-based).
2. صمّم evidence template (audit trail + signatures).
3. أضِف signing (RSA/PKCS#7).
4. أنشئ /api/kernel/evidence/generate.
5. ربط evidence.astro.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `curl -s -o /tmp/ev.pdf -X POST https://brightai.site/api/kernel/evidence/generate ...` → PDF valid
- `pdfinfo /tmp/ev.pdf` → pages ≥ 1

**VERIFICATION COMMANDS**
```bash
curl -s -o /tmp/ev.pdf -X POST https://brightai.site/api/kernel/evidence/generate -H "Content-Type: application/json" -d '{}'
python3 -c "import fitz; print(len(fitz.open('/tmp/ev.pdf')))"
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — evidence PDF موقّع حقيقي يُولّد + valid.

---

## PROMPT [ID: BAI-KERNEL-06] — real-time collaboration (WebRTC/WebSocket)

**Priority: P3 · Effort: 80h · Impact: 5 · Risk: high · Depends: BAI-KERNEL-04 · Blocks: none**

**CONTEXT** — frontend/server.js يحوي WebSocket /ws/live. تفعيله لـ kernel يتيح تعاون فريق (multiple users على نفس audit).

**FILES IN SCOPE**
- frontend/server.js (WebSocket handler)
- src/pages/kernel/*.astro (collab UI)
- src/lib/collab.ts (new)

**MUST NOT TOUCH / PRESERVE**
- النص العربي
- single-user UX الحالي

**TASK**
1. فعّل WebSocket في frontend.
2. صمّم presence (who's online).
3. sync audit/approvals state real-time.
4. أضِف UI indicators.
5. اختبر multi-user.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- Playwright: فتح صفحتين، تعديل في واحدة يظهر في الأخرى

**VERIFICATION COMMANDS**
```bash
node scripts/playwright/verify-collab.mjs 2>&1 | tail
```

**ROLLBACK** — git revert + تعطيل WebSocket.

**DEFINITION OF DONE** — real-time collab يعمل بين 2+ users.

---

## PROMPT [ID: BAI-KERNEL-07] — Arabic voice input (Web Speech API) في chat

**Priority: P3 · Effort: 20h · Impact: 4 · Risk: medium · Depends: none · Blocks: none**

**CONTEXT** — إدخال صوتي عربي في chat يحسّن UX على mobile + accessibility. Web Speech API يدعم ar-SA.

**FILES IN SCOPE**
- src/pages/kernel/chat.astro (mic button + handler)
- src/lib/voice-input.ts (new)

**MUST NOT TOUCH / PRESERVE**
- النص العربي
- text input الحالي

**TASK**
1. أضِف mic button في compose box.
2. استخدم webkitSpeechRecognition بـ lang="ar-SA".
3. اعرض transcript live.
4. fallback لو غير مدعوم.
5. اختبر على Chrome mobile.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- Playwright: mic button موجود + click يبدأ recognition (mock في test)

**VERIFICATION COMMANDS**
```bash
curl -s https://brightai.site/kernel/chat/ | grep -ci "mic\|voice\|speech"
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — voice input يعمل + ar-SA + fallback.

---

## PROMPT [ID: BAI-KERNEL-08] — export to PDF/CSV لكل dashboard kernel

**Priority: P2 · Effort: 16h · Impact: 4 · Risk: low · Depends: none · Blocks: none**

**CONTEXT** — stats.astro + reports.astro + audit.astro تعرض بيانات لكن لا export. PDF/CSV export ضروري لـ compliance reporting.

**FILES IN SCOPE**
- src/pages/kernel/{stats,reports,audit}.astro
- src/lib/export.ts (new — CSV + PDF)

**MUST NOT TOUCH / PRESERVE**
- النص العربي
- demo data

**TASK**
1. أضِف زر "تصدير PDF" + "تصدير CSV" في كل dashboard.
2. اكتب export.ts (CSV = native, PDF = print CSS أو lib).
3. احترم RTL في PDF.
4. اختبر على mobile.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `curl -s -o /tmp/stats.csv https://brightai.site/kernel/stats/export.csv` → valid CSV
- Playwright: زر export موجود + يعمل

**VERIFICATION COMMANDS**
```bash
curl -s -o /tmp/stats.csv https://brightai.site/kernel/stats/export.csv -w "%{http_code}"
head -3 /tmp/stats.csv
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — export PDF/CSV يعمل لكل dashboard.

---

## PROMPT [ID: BAI-KERNEL-09] — keyboard shortcuts لـ kernel (accessibility + power users)

**Priority: P2 · Effort: 8h · Impact: 3 · Risk: low · Depends: none · Blocks: none**

**CONTEXT** — لا keyboard shortcuts. shortcuts (Cmd/Ctrl+K للبحث، Esc لإغلاق drawer، Enter للإرسال) تحسّن productivity + a11y.

**FILES IN SCOPE**
- src/pages/kernel/*.astro (key handlers)
- src/lib/shortcuts.ts (new)

**MUST NOT TOUCH / PRESERVE**
- النص العربي
- touch UX

**TASK**
1. عرّف shortcut map (10-15 اختصار).
2. أضِف keydown listeners.
3. اعرض help overlay (Shift+?).
4. احترم RTL (مفاتيح logical).
5. اختبر screen reader compatibility.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- Playwright: keyboard shortcut يعمل (مثل Esc يغلق drawer)

**VERIFICATION COMMANDS**
```bash
node scripts/playwright/verify-shortcuts.mjs 2>&1 | tail
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — keyboard shortcuts تعمل + help overlay.

---

## PROMPT [ID: BAI-KERNEL-10] — dark/light mode toggle في kernel

**Priority: P2 · Effort: 8h · Impact: 3 · Risk: low · Depends: none · Blocks: none**

**CONTEXT** — kernel = dark mode فقط. light mode toggle يحسّن accessibility + user preference. theme-color meta = #060914 (dark) فقط.

**FILES IN SCOPE**
- src/styles/kernel.css (CSS variables لكل theme)
- src/layouts/KernelLayout.astro (toggle)
- src/lib/theme.ts (new — localStorage)

**MUST NOT TOUCH / PRESERVE**
- النص العربي
- dark mode الحالي (افتراضي)

**TASK**
1. عرّف :root (light) + [data-theme="dark"].
2. اربط كل CSS variables.
3. أضِف toggle في header.
4. احفظ preference في localStorage.
5. احترم prefers-color-scheme.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- Playwright: toggle يبدّل theme + localStorage يحفظ

**VERIFICATION COMMANDS**
```bash
node scripts/playwright/verify-theme.mjs 2>&1 | tail
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — dark/light toggle يعمل + preference محفوظ.

---

## PROMPT [ID: BAI-KERNEL-11] — PWA: offline-first لـ /kernel/ (service worker)

**Priority: P2 · Effort: 16h · Impact: 5 · Risk: medium · Depends: none · Blocks: none**

**CONTEXT** — offline.astro = fallback بسيط. PWA كامل (service worker + cache) يتيح offline-first للـ kernel (مهم لـ field auditors).

**FILES IN SCOPE**
- src/pages/kernel/offline.astro
- public/sw-kernel.js (new service worker)
- public/manifest.webmanifest

**MUST NOT TOUCH / PRESERVE**
- النص العربي
- online UX

**TASK**
1. اكتب service worker (cache-first لـ static، network-first لـ API).
2. سجّل في KernelLayout.
3. صمّم offline fallback UI.
4. أضِف install prompt.
5. اختبر offline mode.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- Playwright: offline simulation → صفحة تعمل من cache

**VERIFICATION COMMANDS**
```bash
node scripts/playwright/verify-pwa-offline.mjs 2>&1 | tail
```

**ROLLBACK** — git revert + unregister SW.

**DEFINITION OF DONE** — PWA offline-first يعمل + installable.

---

## PROMPT [ID: BAI-KERNEL-12] — quota/circuit breaker monitoring dashboard

**Priority: P2 · Effort: 12h · Impact: 4 · Risk: low · Depends: BAI-DEPLOY-13 · Blocks: none**

**CONTEXT** — quota.ts + usagetracker.ts موجودان لكن لا visibility. dashboard للـ admin يعرض usage/cost/circuit state.

**FILES IN SCOPE**
- src/pages/kernel/admin/quota.astro (new)
- src/pages/api/kernel/quota-stats.ts (new)
- src/lib/quota.ts

**MUST NOT TOUCH / PRESERVE**
- quota logic
- النص العربي

**TASK**
1. أنشئ /api/kernel/quota-stats (reads Redis counters).
2. أنشئ admin/quota.astro (charts: usage, cost, circuit).
3. أضِف alerts thresholds.
4. auth-protect (admin only).

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `curl -s https://brightai.site/api/kernel/quota-stats/` → 200 + JSON (admin auth)

**VERIFICATION COMMANDS**
```bash
curl -s https://brightai.site/api/kernel/quota-stats/ -w "%{http_code}"
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — quota dashboard يعمل + real-time stats.

---

## PROMPT [ID: BAI-KERNEL-13] — Sentry error tracking مفعّل + alerts

**Priority: P1 · Effort: 4h · Impact: 5 · Risk: low · Depends: BAI-DEPLOY-13 · Blocks: none**

**CONTEXT** — SENTRY_DSN في .env.example + src/lib/observability/sentry.ts موجود لكن no-op عند unset. تفعيل Sentry يلتقط runtime errors في الإنتاج.

**FILES IN SCOPE**
- src/lib/observability/sentry.ts
- Render env (SENTRY_DSN)
- sentry.io (project setup)

**MUST NOT TOUCH / PRESERVE**
- النص العربي
- chat.ts logic

**TASK**
1. أنشئ Sentry project.
2. احصل على DSN.
3. أضِف SENTRY_DSN لـ Render env.
4. أكّد sentry.ts يُهيّأ عند وجود DSN.
5. اختبر: trigger error مصطنع → يظهر في Sentry.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- Sentry dashboard يعرض errors من brightai.site

**VERIFICATION COMMANDS**
```bash
# تحقق يدوي في sentry.io بعد trigger error
```

**ROLLBACK** — أزِل SENTRY_DSN من Render.

**DEFINITION OF DONE** — Sentry يلتقط errors + alerts مفعّلة.

---

## PROMPT [ID: BAI-KERNEL-14] — audit trail حقيقي (لا demo) — Phase 1: logging

**Priority: P2 · Effort: 24h · Impact: 6 · Risk: medium · Depends: BAI-KERNEL-04 · Blocks: none**

**CONTEXT** — audit.astro = demo. Phase 1: logging layer حقيقي يلتقط كل chat/decision في Postgres (immutable log).

**FILES IN SCOPE**
- src/pages/api/kernel/audit-log.ts (new)
- packages/db/schema.prisma (audit_log table)
- src/middleware.ts (log hook)

**MUST NOT TOUCH / PRESERVE**
- النص العربي
- demo UI

**TASK**
1. صمّم audit_log schema (immutable, append-only).
2. middleware يلتقط كل /api/kernel/* request.
3. /api/kernel/audit-log/ reads.
4. ربط audit.astro بـ live data (Phase 1: read-only).

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `curl -s https://brightai.site/api/kernel/audit-log/` → 200 + JSON entries

**VERIFICATION COMMANDS**
```bash
curl -s https://brightai.site/api/kernel/audit-log/ | head -c 300
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — audit log حقيقي يلتقط كل activity + read في audit.astro.

---

## PROMPT [ID: BAI-KERNEL-15] — approval workflow حقيقي (لا demo) — Phase 1

**Priority: P2 · Effort: 24h · Impact: 6 · Risk: medium · Depends: BAI-KERNEL-04 · Blocks: none**

**CONTEXT** — approvals.astro = demo. Phase 1: approval workflow حقيقي (request → approve/reject → log).

**FILES IN SCOPE**
- src/pages/kernel/approvals.astro
- src/pages/api/kernel/approvals.ts (new)
- packages/db/schema.prisma

**MUST NOT TOUCH / PRESERVE**
- النص العربي
- demo UI

**TASK**
1. صمّم approval_requests schema.
2. /api/kernel/approvals (create/approve/reject).
3. notifications (email/WhatsApp).
4. ربط approvals.astro.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `curl -s https://brightai.site/api/kernel/approvals/` → 200 + JSON

**VERIFICATION COMMANDS**
```bash
curl -s https://brightai.site/api/kernel/approvals/ | head -c 300
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — approval workflow يعمل + notifications.

---

## PROMPT [ID: BAI-KERNEL-16] — connectors page: retry UI + real connector stubs

**Priority: P2 · Effort: 16h · Impact: 4 · Risk: low · Depends: none · Blocks: none**

**CONTEXT** — connectors.astro = الأضعف (5/10). 9 error signals بدون retry UI. static state only.

**FILES IN SCOPE**
- src/pages/kernel/connectors.astro:246
- src/components/kernel/ConnectorCard.astro

**MUST NOT TOUCH / PRESERVE**
- النص العربي
- connector definitions

**TASK**
1. أضِف retry button + aria-live على connector-card__error.
2. أضِف connector stubs (ERP/CRM/HIS) مع mock status.
3. empty state عند لا connectors configured.
4. skeleton أثناء load.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- Playwright: connectors تعرض empty state + retry button

**VERIFICATION COMMANDS**
```bash
node scripts/playwright/screenshot.mjs --url=https://brightai.site/kernel/connectors/ --viewport=360x640
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — connectors تعرض retry UI + empty state + skeleton.

---

## PROMPT [ID: BAI-MOBILE-01] — min-height:44px على روابط logo في KernelLayout (touch targets)

**Priority: P1 · Effort: 1h · Impact: 4 · Risk: low · Depends: none · Blocks: none**

**CONTEXT** — روابط logo + "الرئيسية" في mobile-menu__header = 24px (أقل من 44px المعياري). يتكرر ×11 صفحة. 4.4% من touch targets المخالفة كلها هنا.

**FILES IN SCOPE**
- src/layouts/KernelLayout.astro (mobile-menu__header, mobile-menu__logo)
- src/styles/kernel.css

**MUST NOT TOUCH / PRESERVE**
- desktop layout
- النص العربي

**TASK**
1. أضِف min-height:44px على روابط logo.
2. اضبط padding للوصول للمساحة المطلوبة.
3. اختبر على 360px.
4. شغّل Playwright touch audit.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- Playwright: touch targets ≥44px على كل الصفحات kernel

**VERIFICATION COMMANDS**
```bash
node /tmp/kernel-mobile-audit.mjs 2>&1 | grep "touchTooSmall"
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — 0 touch targets <44px على kernel mobile.

---

## PROMPT [ID: BAI-MOBILE-02] — alt= + role="img" aria-label لكل صورة/SVG في kernel

**Priority: P2 · Effort: 6h · Impact: 4 · Risk: low · Depends: none · Blocks: none**

**CONTEXT** — alt= = 0 عبر كل صفحات kernel الـ 13. كل SVG (logo, icons) بدون بديل نصي.

**FILES IN SCOPE**
- src/pages/kernel/*.astro
- src/components/kernel/*.astro

**MUST NOT TOUCH / PRESERVE**
- النص العربي
- SVG shapes

**TASK**
1. لكل <picture>/<img>: أضِف alt وصفي.
2. لكل SVG decorative: aria-hidden="true".
3. لكل SVG functional: role="img" + aria-label.
4. اختبر screen reader.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `grep -rL "alt=\|aria-hidden\|aria-label" src/pages/kernel/*.astro` → لا شيء بدون

**VERIFICATION COMMANDS**
```bash
grep -rc "alt=" src/pages/kernel/*.astro | grep ":0"
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — كل صورة/SVG في kernel لها alt أو aria-label.

---

## PROMPT [ID: BAI-MOBILE-03] — sticky compose box على /kernel/chat/ (mobile)

**Priority: P1 · Effort: 4h · Impact: 3 · Risk: low · Depends: none · Blocks: none**

**CONTEXT** — compose box على mobile قد يختفي تحت keyboard. sticky bottom يضمن ظهور دائم.

**FILES IN SCOPE**
- src/pages/kernel/chat.astro (compose box CSS)
- src/styles/kernel.css

**MUST NOT TOUCH / PRESERVE**
- desktop compose
- النص العربي

**TASK**
1. position: sticky + bottom: 0 + safe-area-inset-bottom.
2. اضبط z-index فوق messages.
3. اختبر مع keyboard مفتوح (visualViewport API).
4. احترم prefers-reduced-motion.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- Playwright: compose box مرئي دائمًا حتى مع scroll

**VERIFICATION COMMANDS**
```bash
node scripts/playwright/screenshot.mjs --url=https://brightai.site/kernel/chat/ --viewport=360x640
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — compose box sticky + مرئي دائمًا على mobile.

---

## PROMPT [ID: BAI-MOBILE-04] — swipe gestures للموبايل في kernel (drawer + messages)

**Priority: P3 · Effort: 12h · Impact: 3 · Risk: medium · Depends: none · Blocks: none**

**CONTEXT** — لا swipe gestures. swipe يسار/يمين لفتح drawer، swipe على message لـ actions، يحسّن mobile UX.

**FILES IN SCOPE**
- src/pages/kernel/chat.astro (touch handlers)
- src/lib/swipe.ts (new)

**MUST NOT TOUCH / PRESERVE**
- النص العربي
- button UX الحالي

**TASK**
1. اكتب swipe detector (touchstart/move/end).
2. swipe right → open drawer.
3. swipe on message → actions menu.
4. اختبر على iOS + Android.
5. fallback لأزرار.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- Playwright: swipe gesture يفتح drawer (touch events)

**VERIFICATION COMMANDS**
```bash
node scripts/playwright/verify-swipe.mjs 2>&1 | tail
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — swipe gestures تعمل + fallback أزرار.

---

## PROMPT [ID: BAI-MOBILE-05] — app-like navigation: bottom tab bar على mobile

**Priority: P3 · Effort: 16h · Impact: 4 · Risk: medium · Depends: none · Blocks: none**

**CONTEXT** — kernel له bottom nav لكن tab bar app-like (Chat/Audit/Reports/Profile) يحسّن الـ first-class mobile feel.

**FILES IN SCOPE**
- src/layouts/KernelLayout.astro (mobile bottom nav)
- src/styles/kernel.css

**MUST NOT TOUCH / PRESERVE**
- النص العربي
- current bottom nav

**TASK**
1. صمّم 4-tab bottom bar (Chat/Audit/Reports/Profile).
2. active state + icons.
3. safe-area-inset-bottom.
4. اختبر على 360px.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- Playwright: bottom tab bar visible على mobile + tabs تعمل

**VERIFICATION COMMANDS**
```bash
node scripts/playwright/screenshot.mjs --url=https://brightai.site/kernel/chat/ --viewport=360x640
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — app-like bottom tab bar يعمل على mobile.

---

## PROMPT [ID: BAI-MOBILE-06] — offline-first لـ /kernel/ (SW + cache strategy)

**Priority: P2 · Effort: 16h · Impact: 5 · Risk: medium · Depends: BAI-KERNEL-11 · Blocks: none**

**CONTEXT** — مفصّل في BAI-KERNEL-11. هنا التركيز على mobile: field auditors بدون اتصال يحتاجون offline.

**FILES IN SCOPE**
- public/sw-kernel.js
- src/pages/kernel/offline.astro

**MUST NOT TOUCH / PRESERVE**
- النص العربي

**TASK**
1. cache-first لـ static assets.
2. network-first مع offline fallback لـ API.
3. queue mutations للـ sync لاحقًا.
4. UI indicator (online/offline).

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- Playwright: offline → kernel يعمل من cache

**VERIFICATION COMMANDS**
```bash
node scripts/playwright/verify-pwa-offline.mjs 2>&1 | tail
```

**ROLLBACK** — git revert + unregister SW.

**DEFINITION OF DONE** — offline-first يعمل + queue + UI indicator.

---

## PROMPT [ID: BAI-MOBILE-07] — push notifications (اختياري) لـ approvals

**Priority: P3 · Effort: 24h · Impact: 3 · Risk: high · Depends: BAI-KERNEL-15 · Blocks: none**

**CONTEXT** — push notifications لـ approval requests يحسّن responsiveness. يتطلب service worker + push service.

**FILES IN SCOPE**
- public/sw-kernel.js (push handler)
- src/pages/api/kernel/push.ts (new)
- src/lib/push.ts (new)

**MUST NOT TOUCH / PRESERVE**
- النص العربي

**TASK**
1. أنشئ VAPID keys.
2. subscribe UI.
3. /api/kernel/push send.
4. SW displays notification.
5. اختبر على Android Chrome.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- Playwright: push subscription works (mock)

**VERIFICATION COMMANDS**
```bash
node scripts/playwright/verify-push.mjs 2>&1 | tail
```

**ROLLBACK** — git revert + unsubscribe.

**DEFINITION OF DONE** — push notifications تعمل لـ approvals.

---

## PROMPT [ID: BAI-MOBILE-08] — viewport-fit=cover + safe-area audit على كل kernel

**Priority: P1 · Effort: 2h · Impact: 3 · Risk: low · Depends: none · Blocks: none**

**CONTEXT** — viewport meta فيه viewport-fit=cover (✓) لكن safe-area-inset قد يكون ناقص في بعض العناصر (notch devices).

**FILES IN SCOPE**
- src/layouts/KernelLayout.astro
- src/styles/kernel.css

**MUST NOT TOUCH / PRESERVE**
- viewport meta الحالي

**TASK**
1. راجع كل fixed/sticky elements.
2. أضِف safe-area-inset-top/bottom حيث يلزم.
3. اختبر على iPhone with notch.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- Playwright: لا content تحت notch

**VERIFICATION COMMANDS**
```bash
node scripts/playwright/screenshot.mjs --url=https://brightai.site/kernel/chat/ --viewport=390x844
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — كل fixed elements تحترم safe-area.

---

## PROMPT [ID: BAI-MOBILE-09] — mobile font-size audit (≥16px لمنع zoom iOS)

**Priority: P2 · Effort: 2h · Impact: 3 · Risk: low · Depends: none · Blocks: none**

**CONTEXT** — iOS Safari يكبّر تلقائيًا إذا font-size <16px على input. تأكد كل inputs ≥16px.

**FILES IN SCOPE**
- src/styles/kernel.css (input font-sizes)
- src/pages/kernel/*.astro

**MUST NOT TOUCH / PRESERVE**
- النص العربي

**TASK**
1. grep كل input font-size.
2. ارفع أي <16px لـ 16px.
3. اختبر على iOS.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `grep -rn "font-size.*1[0-5]px" src/styles/kernel.css src/pages/kernel/` → 0 inputs

**VERIFICATION COMMANDS**
```bash
grep -rn "font-size.*1[0-5]px" src/styles/kernel.css src/pages/kernel/
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — كل inputs ≥16px في kernel.

---

## PROMPT [ID: BAI-MOBILE-10] — tap delay elimination (touch-action) على kernel

**Priority: P2 · Effort: 2h · Impact: 2 · Risk: low · Depends: none · Blocks: none**

**CONTEXT** — 300ms tap delay على بعض المتصفحات القديمة. touch-action: manipulation يزيله.

**FILES IN SCOPE**
- src/styles/kernel.css

**MUST NOT TOUCH / PRESERVE**
- النص العربي

**TASK**
1. أضِف touch-action: manipulation على interactive elements.
2. اختبر responsiveness.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- Playwright: tap response <100ms

**VERIFICATION COMMANDS**
```bash
grep -c "touch-action" src/styles/kernel.css
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — tap delay eliminated على kernel.

---

## PROMPT [ID: BAI-DESIGN-06] — trust badges بصرية على hero (aligned with SAMA/SDAIA/NCA)

**Priority: P1 · Effort: 4h · Impact: 6 · Risk: low · Depends: none · Blocks: none**

**CONTEXT** — trust badges حاضرة كنص في /trust/ لكن ليست بصرية على hero. visual badge على above-the-fold = قرار ثقة فوري للبنوك. حرج: "aligned with" لا "certified by" (llms.txt صادق).

**FILES IN SCOPE**
- src/pages/index.astro (hero section)
- src/components/TrustBadges.astro (new)
- public/badges/ (logos)

**MUST NOT TOUCH / PRESERVE**
- النص العربي
- disclaimer في llms.txt

**TASK**
1. صمّم TrustBadges component (SAMA/SDAIA/NCA/ISO 42001 logos).
2. label: "متوافق مع" (وليس "معتمد من").
3. ضع في hero below CTA.
4. hover tooltip: "امتثال لاشتراطات X".
5. احترم的品牌 colors.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `curl -s https://brightai.site/ | grep -ci "trust-badge\|متوافق مع"` → ≥ 1
- Playwright: badges بصرية على hero

**VERIFICATION COMMANDS**
```bash
curl -s https://brightai.site/ | grep -ciE "trust-badge|متوافق مع|متوافقة مع"
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — trust badges بصرية على hero + "متوافق مع" labels.

---

## PROMPT [ID: BAI-DESIGN-07] — line-height 1.75 للنص العربي الطويل (base.css)

**Priority: P2 · Effort: 1h · Impact: 3 · Risk: low · Depends: none · Blocks: none**

**CONTEXT** — base.css body line-height = 1.6 (BAI-DESIGN-04 خفّضه من 1.75). للنص العربي الطويل (blog/docs)، 1.75 أفضل للقراءة.

**FILES IN SCOPE**
- src/styles/base.css:68 (body line-height)
- src/styles/base.css:125 (paragraph)

**MUST NOT TOUCH / PRESERVE**
- النص العربي المنشور
- heading line-heights

**TASK**
1. ارفع body line-height لـ 1.75.
2. اضبط paragraph line-height لـ 1.85.
3. اختبر على blog/docs.
4. تأكد ما يكسر layout.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `grep "line-height" src/styles/base.css | head` → 1.75/1.85

**VERIFICATION COMMANDS**
```bash
grep -n "line-height" src/styles/base.css | head
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — line-height 1.75 للنص العربي الطويل.

---

## PROMPT [ID: BAI-DESIGN-08] — ROI calculator link من /pricing/ + redirect /calculator/

**Priority: P2 · Effort: 1h · Impact: 3 · Risk: low · Depends: none · Blocks: none**

**CONTEXT** — /calculator/roi/ موجود لكن /calculator/ = 404. لا link من /pricing/.

**FILES IN SCOPE**
- astro.config.mjs (redirect /calculator/ → /calculator/roi/)
- src/pages/pricing/index.astro (link)

**MUST NOT TOUCH / PRESERVE**
- النص العربي
- calculator logic

**TASK**
1. أضِف redirect /calculator/ → /calculator/roi/.
2. في pricing، أضِف CTA "احسب عائد الاستثمار".
3. اختبر.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `curl -sI https://brightai.site/calculator/ | grep -i location` → /calculator/roi/
- `curl -s https://brightai.site/pricing/ | grep -ci "calculator\|حاسبة"` → ≥ 1

**VERIFICATION COMMANDS**
```bash
curl -sI https://brightai.site/calculator/ | grep -iE "http|location"
curl -s https://brightai.site/pricing/ | grep -ciE "calculator|حاسبة"
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — /calculator/ redirect + link من pricing.

---

## PROMPT [ID: BAI-DESIGN-09] — unify card system (SolutionCard/SectorCard/related)

**Priority: P2 · Effort: 12h · Impact: 4 · Risk: medium · Depends: none · Blocks: none**

**CONTEXT** — multiple card components بتصاميم متقاربة لكن غير موحّدة. unify يحسّن consistency + يقلّل CSS.

**FILES IN SCOPE**
- src/components/SolutionCard.astro, SectorCard.astro
- src/components/RelatedLinks.astro
- src/styles/components.css

**MUST NOT TOUCH / PRESERVE**
- النص العربي
- المحتوى الحالي

**TASK**
1. جرد كل card variants.
2. صمّم BaseCard موحّد.
3. رثّ البقية.
4. اختبر بصريًا على كل الصفحات.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `grep -rc "class=\"card" src/components/ | sort` → موحّد

**VERIFICATION COMMANDS**
```bash
grep -rn "class="card" src/components/ | head
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — card system موحّد + CSS أقل.

---

## PROMPT [ID: BAI-DESIGN-10] — focus-visible styles على كل interactive kernel

**Priority: P1 · Effort: 4h · Impact: 4 · Risk: low · Depends: none · Blocks: none**

**CONTEXT** — focus styles قد تكون غير مرئية كفاية. focus-visible واضح ضروري لـ keyboard users.

**FILES IN SCOPE**
- src/styles/kernel.css (:focus-visible)
- src/styles/base.css

**MUST NOT TOUCH / PRESERVE**
- النص العربي

**TASK**
1. أضِف :focus-visible outline واضح (2px solid brand).
2. تأكد كل buttons/links/inputs.
3. احترم prefers-reduced-motion.
4. اختبر keyboard nav.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- Playwright: keyboard nav يظهر focus واضح

**VERIFICATION COMMANDS**
```bash
node scripts/playwright/verify-focus.mjs --url=https://brightai.site/kernel/chat/ 2>&1 | tail
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — focus-visible واضح على كل kernel interactive.

---

## PROMPT [ID: BAI-DESIGN-11] — splitHero trust chip + social proof

**Priority: P2 · Effort: 4h · Impact: 3 · Risk: low · Depends: none · Blocks: none**

**CONTEXT** — SplitHero (1167 سطر) يحوي trust chip لكن social proof (عدد عملاء/تقييم) ناقص.

**FILES IN SCOPE**
- src/components/SplitHero.astro
- src/data/site.ts

**MUST NOT TOUCH / PRESERVE**
- النص العربي
- hero structure (16 sections)

**TASK**
1. أضِف "موثوق من X جهة" chip.
2. أو "Y مليون طلب AI محمي".
3. صادق فقط (لا أرقام مفبركة).

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `curl -s https://brightai.site/ | grep -ci "موثوق\|معتمد"` → ≥ 1

**VERIFICATION COMMANDS**
```bash
curl -s https://brightai.site/ | grep -ciE "موثوق|معتمد"
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — social proof chip في hero (صادق).

---

## PROMPT [ID: BAI-A11Y-01] — landmark roles + labels على offline.astro (HTML مهاجَر)

**Priority: P2 · Effort: 2h · Impact: 3 · Risk: low · Depends: none · Blocks: none**

**CONTEXT** — offline.astro = <main set:html={DOMPurify.sanitize(...)} /> بدون landmark roles أو labels (0 aria/0 alt). screen reader لا يقدر يتنقّل.

**FILES IN SCOPE**
- src/pages/kernel/offline.astro
- src/layouts/KernelLayout.astro

**MUST NOT TOUCH / PRESERVE**
- النص العربي
- DOMPurify sanitization

**TASK**
1. لف المحتوى في <main aria-label="محتوى غير متصل">.
2. أضِف heading structure (h1/h2).
3. أضِف skip-link.
4. اختبر screen reader.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- axe-core: 0 violations على offline.astro

**VERIFICATION COMMANDS**
```bash
node scripts/playwright/axe-audit.mjs --url=https://brightai.site/kernel/offline/ 2>&1 | tail
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — offline.astro accessibility-compliant.

---

## PROMPT [ID: BAI-A11Y-02] — skip-link على كل صفحات kernel + main

**Priority: P1 · Effort: 2h · Impact: 3 · Risk: low · Depends: none · Blocks: none**

**CONTEXT** — skip-link (skip to main content) ضروري لـ keyboard users. تأكد موجود على كل صفحة.

**FILES IN SCOPE**
- src/layouts/KernelLayout.astro
- src/layouts/BaseLayout.astro

**MUST NOT TOUCH / PRESERVE**
- النص العربي

**TASK**
1. أضِف <a href="#main" class="skip-link">تخطّي للمحتوى</a>.
2. id="main" على المحتوى.
3. CSS: visually hidden حتى focus.
4. اختبر keyboard.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- Playwright: Tab الأول يظهر skip-link

**VERIFICATION COMMANDS**
```bash
node scripts/playwright/verify-skip-link.mjs --url=https://brightai.site/kernel/chat/ 2>&1 | tail
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — skip-link يعمل على كل صفحات kernel.

---

## PROMPT [ID: BAI-A11Y-03] — ARIA labels على كل icon-only buttons في kernel

**Priority: P1 · Effort: 4h · Impact: 4 · Risk: low · Depends: none · Blocks: none**

**CONTEXT** — بعض icon buttons بدون aria-label. screen reader يقرأ "button" فقط.

**FILES IN SCOPE**
- src/pages/kernel/*.astro
- src/components/kernel/*.astro

**MUST NOT TOUCH / PRESERVE**
- النص العربي
- visual icons

**TASK**
1. grep كل <button> بدون نص.
2. أضِف aria-label وصفي عربي.
3. اختبر NVDS/VoiceOver.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- axe-core: 0 "button-name" violations

**VERIFICATION COMMANDS**
```bash
node scripts/playwright/axe-audit.mjs --url=https://brightai.site/kernel/chat/ 2>&1 | grep -i button
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — كل icon buttons لها aria-label.

---

## PROMPT [ID: BAI-A11Y-04] — color contrast audit WCAG AA على mobile (الأسوأ)

**Priority: P1 · Effort: 6h · Impact: 4 · Risk: low · Depends: none · Blocks: none**

**CONTEXT** — تباين على mobile أسوأ (شاشات أصغر + sunlight). audit شامل لكل text/background combinations.

**FILES IN SCOPE**
- src/styles/*.css (كل color combos)
- src/styles/tokens.css

**MUST NOT TOUCH / PRESERVE**
- design tokens
- النص العربي

**TASK**
1. شغّل axe-core contrast audit على كل صفحة.
2. لكل violation: ارفع contrast لـ AA (4.5:1 text, 3:1 large).
3. اختبر على mobile.
4. وثّق decisions.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- axe-core: 0 contrast violations على كل صفحة

**VERIFICATION COMMANDS**
```bash
node scripts/playwright/axe-audit.mjs --url=https://brightai.site/ 2>&1 | grep -i contrast
node scripts/playwright/axe-audit.mjs --url=https://brightai.site/kernel/chat/ 2>&1 | grep -i contrast
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — 0 contrast violations WCAG AA.

---

## PROMPT [ID: BAI-A11Y-05] — reduced-motion respect audit على كل animations

**Priority: P2 · Effort: 4h · Impact: 3 · Risk: low · Depends: none · Blocks: none**

**CONTEXT** — كل animation يجب يحترم prefers-reduced-motion: reduce. AGENTS.md Section 8 يطلبه.

**FILES IN SCOPE**
- src/styles/animations.css
- src/styles/kernel.css
- src/scripts/*.js (JS animations)

**MUST NOT TOUCH / PRESERVE**
- النص العربي
- animation keyframes

**TASK**
1. grep كل animation/transition.
2. أضِف @media (prefers-reduced-motion: reduce) wrapper.
3. JS: تحقق matchMedia قبل animate.
4. اختبر.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `grep -c "prefers-reduced-motion" src/styles/*.css` → matches animation count

**VERIFICATION COMMANDS**
```bash
grep -rc "prefers-reduced-motion" src/styles/*.css
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — كل animations تحترم reduced-motion.

---

## PROMPT [ID: BAI-PERF-02] — Lighthouse CI gate live (LCP ≤ 2500ms) في CI

**Priority: P1 · Effort: 4h · Impact: 5 · Risk: low · Depends: none · Blocks: none**

**CONTEXT** — .lighthouserc.json موجود مع budgets لكن قد لا يكون في CI gate فعلي. تأكد.

**FILES IN SCOPE**
- .github/workflows/ci-build-guard.yml (lhci steps)
- .lighthouserc.json

**MUST NOT TOUCH / PRESERVE**
- budgets الحالية

**TASK**
1. أكّد lhci:collect + lhci:assert في CI.
2. assert: LCP error at ≤2500ms.
3. فشل CI عند تجاوز.
4. تأكد على mobile preset.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- CI يفشل عند LCP >2500ms

**VERIFICATION COMMANDS**
```bash
grep -A5 "lhci" .github/workflows/ci-build-guard.yml | head
```

**ROLLBACK** — git revert + temp relax assertion.

**DEFINITION OF DONE** — Lighthouse CI gate يعمل + يفشل عند LCP >2500ms.

---

## PROMPT [ID: BAI-PERF-03] — subset IBM Plex Sans Arabic أكثر (Arabic subset)

**Priority: P2 · Effort: 4h · Impact: 3 · Risk: low · Depends: none · Blocks: none**

**CONTEXT** — IBMPlexSansArabic-Regular.woff2 = 71KB. Arabic subset للـ glyphs المستخدمة فقط يقلّل الحجم.

**FILES IN SCOPE**
- public/fonts/IBMPlexSansArabic-*.woff2
- scripts/subset-fonts.mjs (new)

**MUST NOT TOUCH / PRESERVE**
- النص العربي glyphs
- font files

**TASK**
1. حلّل glyphs المستخدمة (من كل النص العربي).
2. استخدم pyftsubset أو glyphhanger.
3. ولّد subset.
4. اختبر عرض كل النص.
5. قارن الحجم.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `ls -la public/fonts/IBMPlexSansArabic-Regular.woff2` → أصغر

**VERIFICATION COMMANDS**
```bash
ls -la public/fonts/IBMPlexSansArabic-*.woff2
```

**ROLLBACK** — git revert + استرجاع الأصل.

**DEFINITION OF DONE** — IBM Plex subset أصغر + كل النص يعرض.

---

## PROMPT [ID: BAI-PERF-04] — lazy-load images below fold + eager above

**Priority: P1 · Effort: 4h · Impact: 4 · Risk: low · Depends: none · Blocks: none**

**CONTEXT** — تأكد كل <img>: loading=lazy below fold، eager above. decoding=async. width/height دائمًا.

**FILES IN SCOPE**
- src/pages/**/*.astro
- src/components/**/*.astro

**MUST NOT TOUCH / PRESERVE**
- النص العربي
- alt text

**TASK**
1. grep كل <img>.
2. لكل: width/height/alt/loading/decoding.
3. above-fold = eager، else lazy.
4. اختبر LCP.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `grep -rL "loading=" src/pages/ src/components/` → 0 (باستثناء eager explicit)

**VERIFICATION COMMANDS**
```bash
grep -rn "<img" src/pages/index.astro | head
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — كل images لها attrs صحيحة.

---

## PROMPT [ID: BAI-PERF-05] — preconnect/preload critical resources audit

**Priority: P2 · Effort: 2h · Impact: 3 · Risk: low · Depends: none · Blocks: none**

**CONTEXT** — preconnect لـ origins خارجية + preload critical (fonts, hero image).

**FILES IN SCOPE**
- src/layouts/BaseLayout.astro (head)

**MUST NOT TOUCH / PRESERVE**
- النص العربي
- existing preloads

**TASK**
1. جرد كل external origin (analytics, etc).
2. أضِف preconnect.
3. preload hero image + critical font.
4. اختبر LCP.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `curl -s https://brightai.site/ | grep -c "preconnect\|preload"` → زيادة

**VERIFICATION COMMANDS**
```bash
curl -s https://brightai.site/ | grep -oE "preconnect|preload" | sort | uniq -c
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — preconnect/preload critical مضبوط.

---

## PROMPT [ID: BAI-PERF-06] — CSS critical inline + defer non-critical

**Priority: P3 · Effort: 8h · Impact: 3 · Risk: medium · Depends: none · Blocks: none**

**CONTEXT** — CSS كامل يحجب render. critical CSS inline + defer الباقي يحسّن FCP.

**FILES IN SCOPE**
- src/layouts/BaseLayout.astro
- scripts/extract-critical-css.mjs (new)

**MUST NOT TOUCH / PRESERVE**
- النص العربي
- CSS layers

**TASK**
1. استخرج above-fold CSS.
2. inline في <head>.
3. defer الباقي (loadCSS).
4. اختبر FCP.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- Lighthouse FCP improvement

**VERIFICATION COMMANDS**
```bash
curl -s https://brightai.site/ | grep -c "<style>"
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — critical CSS inlined + FCP محسّن.

---

## PROMPT [ID: BAI-ARCH-01] — تفكيك chat.ts (1290 سطر → modules ≤300)

**Priority: P2 · Effort: 16h · Impact: 4 · Risk: medium · Depends: none · Blocks: none**

**CONTEXT** — chat.ts = 1290 سطر، 20+ دالة (auth, rate-limit, providers, firewall, SSE). قابل للتفكيك.

**FILES IN SCOPE**
- src/pages/api/ai/chat.ts
- src/lib/chat/ (new modules: auth.ts, quota.ts, providers.ts, firewall.ts, sse.ts)

**MUST NOT TOUCH / PRESERVE**
- النص العربي
- runtime behavior

**TASK**
1. استخرج كل concern لـ module.
2. chat.ts = orchestrator فقط.
3. tests لكل module.
4. تأكد behavior متطابق.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `wc -l src/pages/api/ai/chat.ts` → ≤300
- `wc -l src/lib/chat/*.ts` → كل ≤300

**VERIFICATION COMMANDS**
```bash
wc -l src/pages/api/ai/chat.ts
ls src/lib/chat/
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — chat.ts ≤300 + modules منفصلة + tests.

---

## PROMPT [ID: BAI-ARCH-02] — إصلاح vitest.config (kernel/tests غير موجود) + lint:legacy حقيقي

**Priority: P2 · Effort: 4h · Impact: 3 · Risk: low · Depends: none · Blocks: none**

**CONTEXT** — vitest.config include = kernel/tests/** (غير موجود). lint:legacy = echo. أدوات وهمية.

**FILES IN SCOPE**
- vitest.config.js
- package.json (lint:legacy)

**MUST NOT TOUCH / PRESERVE**
- tests الموجودة في packages/

**TASK**
1. حدّث vitest.config include لـ packages/*/tests + apps/dashboard/tests.
2. استبدل lint:legacy echo بـ eslint حقيقي.
3. شغّل + تأكد pass.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `vitest run` → finds + runs tests
- `npm run lint:legacy` → runs eslint (not echo)

**VERIFICATION COMMANDS**
```bash
vitest run 2>&1 | tail -5
npm run lint:legacy 2>&1 | head -5
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — vitest يجد tests + lint:legacy حقيقي.

---

## PROMPT [ID: BAI-ARCH-03] — تنظيف scripts/ (71 → ≤60 ملف)

**Priority: P2 · Effort: 12h · Impact: 3 · Risk: low · Depends: none · Blocks: none**

**CONTEXT** — scripts/ = 71 ملف (هدف ≤60). معظمها SEO/internal-linking bloat.

**FILES IN SCOPE**
- scripts/*.mjs
- scripts/internal-linking-*.mjs (consolidate)

**MUST NOT TOUCH / PRESERVE**
- scripts المستخدمة في package.json
- النصوص

**TASK**
1. جرد scripts.
2. حدد dead (غير مستخدمة).
3. consolidate المتقاربة.
4. احذف الـ dead.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `ls scripts/*.mjs | wc -l` → ≤60

**VERIFICATION COMMANDS**
```bash
ls scripts/*.mjs | wc -l
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — scripts/ ≤60 ملف.

---

## PROMPT [ID: BAI-ARCH-04] — split ci-build-guard.yml (34KB monolith)

**Priority: P3 · Effort: 6h · Impact: 2 · Risk: low · Depends: none · Blocks: none**

**CONTEXT** — ci-build-guard.yml = 34KB workflow واحد. split لـ reusable workflows أسهل صيانة.

**FILES IN SCOPE**
- .github/workflows/ci-build-guard.yml
- .github/workflows/reusable/ (new)

**MUST NOT TOUCH / PRESERVE**
- CI logic

**TASK**
1. استخرج jobs لـ reusable workflows.
2. main workflow calls them.
3. اختبر CI.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `wc -l .github/workflows/*.yml` → distributed

**VERIFICATION COMMANDS**
```bash
wc -l .github/workflows/ci-build-guard.yml
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — CI split لـ reusable workflows.

---

## PROMPT [ID: BAI-ARCH-05] — .lighthouseci/ gitignore + cleanup (95MB)

**Priority: P2 · Effort: 1h · Impact: 2 · Risk: low · Depends: none · Blocks: none**

**CONTEXT** — .lighthouseci/ = ~85 ملف، ~95MB قد تكون ملتزمة في git. تضخم repo.

**FILES IN SCOPE**
- .gitignore
- .lighthouseci/

**MUST NOT TOUCH / PRESERVE**
- LHR history (إن أردت)

**TASK**
1. أضِف .lighthouseci/ لـ .gitignore.
2. git rm --cached.
3. (اختياري) احتفظ LHR في artifact بدل repo.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `git ls-files .lighthouseci/ | wc -l` → 0

**VERIFICATION COMMANDS**
```bash
git ls-files .lighthouseci/ | wc -l
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — .lighthouseci/ ليس في git + gitignore.

---

## PROMPT [ID: BAI-MEAS-01] — GA4 events (chat_started/completed/lead/scenario) server-side

**Priority: P2 · Effort: 8h · Impact: 4 · Risk: low · Depends: BAI-DEPLOY-13 · Blocks: none**

**CONTEXT** — GA4 pageviews فقط. events محدّدة (chat interactions) ضرورية لـ funnel analysis. server-side measurement API.

**FILES IN SCOPE**
- src/pages/api/ai/chat.ts (event after success)
- src/lib/analytics.ts (new — GA4 measurement protocol)

**MUST NOT TOUCH / PRESERVE**
- النص العربي
- gtag client-side

**TASK**
1. أنشئ analytics.ts (GA4 measurement protocol server-side).
2. بعد chat success: emit chat_completed.
3. بعد lead: emit lead.
4. consent mode v2 respect.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- GA4 realtime shows events

**VERIFICATION COMMANDS**
```bash
# تحقق يدوي في GA4 بعد chat
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — GA4 events تعمل server-side + funnel data.

---

## PROMPT [ID: BAI-MEAS-02] — Consent Mode v2 (gtag consent update)

**Priority: P1 · Effort: 4h · Impact: 5 · Risk: low · Depends: none · Blocks: none**

**CONTEXT** — لا gtag("consent","update",...). PDPL + Google Consent Mode v2 ضروري.

**FILES IN SCOPE**
- src/components/CookieConsent.astro
- public/js/gtag-init.js

**MUST NOT TOUCH / PRESERVE**
- النص العربي
- GA4 ID

**TASK**
1. أضِف consent default deny.
2. على accept: gtag("consent","update",{ad_storage, analytics_storage, ad_user_data, ad_personalization}).
3. respect PDPL.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `curl -s https://brightai.site/ | grep -c "consent"` → ≥1
- GA4 respects consent

**VERIFICATION COMMANDS**
```bash
curl -s https://brightai.site/ | grep -ci "consent"
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — Consent Mode v2 يعمل.

---

## PROMPT [ID: BAI-MEAS-03] — uptime monitoring + x-brightai-build health alert

**Priority: P1 · Effort: 4h · Impact: 5 · Risk: low · Depends: BAI-DEPLOY-13 · Blocks: none**

**CONTEXT** — لا uptime monitor. x-brightai-build header = health signal (غيابه = Node down). alert ضروري.

**FILES IN SCOPE**
- external monitor (UptimeRobot/Better Stack)
- scripts/health-check.mjs

**MUST NOT TOUCH / PRESERVE**
- النص العربي

**TASK**
1. أنشئ uptime monitor على /api/health/.
2. alert عند غياب x-brightai-build header.
3. alert عند 5xx.
4. Slack/email notifications.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- uptime monitor dashboard shows 99%+

**VERIFICATION COMMANDS**
```bash
# تحقق يدوي في monitoring service
```

**ROLLBACK** — أوقف monitor.

**DEFINITION OF DONE** — uptime monitor + alerts تعمل.

---

## PROMPT [ID: BAI-MEAS-04] — GSC weekly export (تفعيل GSC_SERVICE_ACCOUNT_JSON)

**Priority: P2 · Effort: 4h · Impact: 4 · Risk: low · Depends: user-gsc-access · Blocks: none**

**CONTEXT** — weekly-gsc.yml workflow موجود لكن يحتاج GSC_SERVICE_ACCOUNT_JSON secret لم يُضَف.

**FILES IN SCOPE**
- .github/workflows/weekly-gsc.yml
- GSC service account (external)

**MUST NOT TOUCH / PRESERVE**
- النص العربي

**TASK**
1. أنشئ GSC service account.
2. أضِف JSON كـ GitHub secret.
3. فعّل workflow.
4. راجع exports أسبوعيًا.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- GitHub Actions: weekly-gsc runs successfully

**VERIFICATION COMMANDS**
```bash
gh run list --workflow=weekly-gsc.yml --limit 3
```

**ROLLBACK** — أوقف workflow.

**DEFINITION OF DONE** — GSC weekly export يعمل + data available.

---

## PROMPT [ID: BAI-MEAS-05] — conversion tracking (lead → demo → customer)

**Priority: P2 · Effort: 6h · Impact: 4 · Risk: low · Depends: BAI-MEAS-01 · Blocks: none**

**CONTEXT** — pageviews فقط. conversion funnel (lead form → demo booking → customer) ضروري لـ ROI.

**FILES IN SCOPE**
- src/lib/analytics.ts
- GA4 conversions setup

**MUST NOT TOUCH / PRESERVE**
- النص العربي

**TASK**
1. عرّف conversions: lead_submitted, demo_booked, chat_completed.
2. emit على كل step.
3. GA4 funnel report.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- GA4 conversions dashboard shows data

**VERIFICATION COMMANDS**
```bash
# تحقق في GA4
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — conversion tracking يعمل + funnel data.

---

## PROMPT [ID: BAI-GROWTH-01] — press release للصحافة السعودية (الاقتصادية/عكاظ/الرياض)

**Priority: P2 · Effort: 8h · Impact: 6 · Risk: low · Depends: none · Blocks: none**

**CONTEXT** — صفر PR سعودي. press coverage يبني Authority + backlinks.

**FILES IN SCOPE**
- src/pages/press/ (new)
- public/press-releases/ (new)

**MUST NOT TOUCH / PRESERVE**
- النص العربي
- facts (لا مبالغة)

**TASK**
1. اكتب press release (إطلاق Kernel، شراكة، etc).
2. أرسل للاقتصادية/عكاظ/الرياض.
3. تابع coverage.
4. أضِف لـ /press/.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `curl -s https://brightai.site/press/ | grep -c "press"` → ≥1 بعد coverage

**VERIFICATION COMMANDS**
```bash
curl -s -o /dev/null -w "%{http_code}" https://brightai.site/press/
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — press release منشور + coverage سعودي.

---

## PROMPT [ID: BAI-GROWTH-02] — LinkedIn thought leadership (8 مقالات مؤسس)

**Priority: P2 · Effort: 24h · Impact: 5 · Risk: low · Depends: BAI-SAID-02 · Blocks: none**

**CONTEXT** — LinkedIn = B2B channel رئيسي. 8 مقالات مؤسس (يزيد الشريف) عن AI governance/PDPL/SDAIA.

**FILES IN SCOPE**
- LinkedIn (external)
- src/pages/blog/ (republish)

**MUST NOT TOUCH / PRESERVE**
- النص العربي
- founder identity

**TASK**
1. اكتب 8 مقالات (500-1000 كلمة).
2. انشر على LinkedIn أسبوعيًا.
3. link لـ brightai.site.
4. republish على /blog/.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- LinkedIn posts published + engagement

**VERIFICATION COMMANDS**
```bash
# تحقق يدوي في LinkedIn
```

**ROLLBACK** — احذف posts.

**DEFINITION OF DONE** — 8 LinkedIn articles منشورة + traffic.

---

## PROMPT [ID: BAI-GROWTH-03] — شهادات G2/Capterra/Clutch (صفحات + widgets)

**Priority: P2 · Effort: 12h · Impact: 5 · Risk: low · Depends: first-reviews · Blocks: none**

**CONTEXT** — لا شهادات طرف ثالث. G2/Capterra/Clutch = social proof معتمد.

**FILES IN SCOPE**
- src/pages/reviews/ (new)
- src/components/ReviewWidget.astro (new)
- G2/Capterra/Clutch profiles

**MUST NOT TOUCH / PRESERVE**
- النص العربي
- transparency

**TASK**
1. أنشئ profiles على G2/Capterra/Clutch.
2. اطلب reviews من عملاء.
3. embed widget في homepage.
4. أضِف /reviews/.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `curl -s https://brightai.site/ | grep -ci "g2\|capterra\|clutch"` → ≥1

**VERIFICATION COMMANDS**
```bash
curl -s https://brightai.site/ | grep -ciE "g2|capterra|clutch"
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — G2/Capterra/Clutch profiles + reviews + widget.

---

## PROMPT [ID: BAI-GROWTH-04] — backlinks من 20 موقع سعودي موثوق

**Priority: P3 · Effort: 60h · Impact: 6 · Risk: low · Depends: BAI-GROWTH-01 · Blocks: none**

**CONTEXT** — صفر backlinks حسب تقدير. backlinks = #1 ranking factor. 20 من مواقع سعودية موثوقة.

**FILES IN SCOPE**
- outreach (email/LinkedIn)
- guest posts

**MUST NOT TOUCH / PRESERVE**
- النص العربي
- no spam

**TASK**
1. حدد 20 موقع سعودي (news, blogs, gov).
2. outreach لـ guest post/partnership.
3. كل backlink = contextual.
4. تتبّع في GSC.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- GSC shows increasing backlinks

**VERIFICATION COMMANDS**
```bash
# تحقق في GSC (BAI-MEAS-04)
```

**ROLLBACK** — — (organic, لا rollback)

**DEFINITION OF DONE** — 20+ backlinks سعودية موثوقة.

---

## PROMPT [ID: BAI-GROWTH-05] — IndexNow auto-submit على كل نشر محتوى

**Priority: P1 · Effort: 2h · Impact: 3 · Risk: low · Depends: none · Blocks: none**

**CONTEXT** — deploy.yml فيه indexnow:deploy لكن تأكد auto على كل blog/doc publish.

**FILES IN SCOPE**
- .github/workflows/deploy.yml
- scripts/trigger-indexnow.mjs

**MUST NOT TOUCH / PRESERVE**
- النص العربي

**TASK**
1. أكّد IndexNow key في public/.
2. على كل publish: submit URLs.
3. Bing/Yandex نوتيفاي.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- IndexNow API accepts submissions

**VERIFICATION COMMANDS**
```bash
npm run indexnow:deploy 2>&1 | tail
```

**ROLLBACK** — git revert.

**DEFINITION OF DONE** — IndexNow auto-submit على كل publish.

---

# CHAMPION SUITE — Self-Analysis Loop + Kernel Hero + Saudi #1

**Generated:** 2026-07-30
**المصدر:** طلب المالك بعد تقرير v3
**الهدف:** برومبت يحلل المشروع نفسه + التقريرين بعد كل برومبت + يعيد التحليل؛ تركيز السعودية #1 + Kernel Mobile-First Hero + ربط Gemini API عبر Render.
**الفئة:** `CHAMPION` (جديدة — خارج المجموعات الـ 12 السابقة).
**المجموع:** 6 برومبتات (master loop + 5 تنفيذيين).

---

## الفلسفة: حلقة CHAMPION

كل برومبت CHAMPION يمر بثلاث مراحل إلزامية:

1. **SELF-ANALYZE** — قبل التنفيذ، يعيد البرومبت قراءة:
   - `/.agents/brain.md` (آخر حالة للمشروع)
   - `/brightai-audit-reports/brightai-audit-report-v3.html` (النتائج الحالية)
   - `/brightai-audit-reports/brightai-audit-prompts-v3.md` (البرومبتات المنفذة)
   - `/src/pages/kernel/**` (حالة الـ kernel)
   - خرائط Google Play/Apple Store لتجارب المنتجات القياسية.

2. **EXECUTE** — ينفذ المهمة المحددة بدون كسر قواعد الـ DEC-PROC-12.

3. **RE-ANALYZE & REPORT** — يحدّث brain.md + يضيف prompt-report.md تحت `/brightai-audit-reports/prompt-reports/CHAMPION-NN-YYYY-MM-DD.md` بفروقات Δ صريحة.

الماكرو Loop: `npm run prompt:champion -- --id=CHAMPION-01` (سكريبت يُضاف تحت `scripts/prompt-champion.mjs`).

---

## PROMPT [ID: CHAMPION-00] — Champion Loop Orchestrator (البرومبت الأم)

**Priority: P0 · Effort: 1h (ساكافولد) +∞ (loop) · Impact: ∞ (يُفعّل كل تحسين) · Risk: low (read-only) · Depends: BAI-DEPLOY-13 · Blocks: CHAMPION-01..05**

**CONTEXT** — المطلوب: برومبت يحلل المشروع نفسه بعد كل برومبت منفذ، ويعيد التقرير بالتركيز على (أ) جعل BrightAI المنتج الأول في السعودية في حوكمة AI، (ب) جعل `/src/pages/kernel` أفضل تجربة منتجات في العالم العربي على الموبايل والديكسك، (ج) ربط Kernel بـ Gemini API عبر `GEMINI_API_KEY` على Render. هذا البرومبت هو الـ orchestrator الذي يستدعي CHAMPION-01..05 ويعيد التحليل بعد كل واحد.

**FILES IN SCOPE**
- `scripts/prompt-champion.mjs` (NEW — orchestrator)
- `brightai-audit-reports/prompt-reports/` (NEW directory — store per-prompt Δ reports)
- `package.json` (add `prompt:champion` script)
- `.agents/brain.md` (read + write per loop)
- `reports/CHAMPION-STATE.md` (NEW — running state machine)

**MUST NOT TOUCH / PRESERVE**
- كل قواعد DEC-PROC-12 (verified_production gate، commit format، post-deploy gate)
- كل ما في `protected` list من brain.md (نصّ عربي منشور، redirects، site.ts، astro.config.mjs trailingSlash)
- `frontend/**` (backend منفصل)

**TASK**

1. **أنشئ `scripts/prompt-champion.mjs`** — orchestrator يأخذ `--id=<CHAMPION-NN>` ويقوم بـ:
   - **Pre-Phase (SELF-ANALYZE):**
     - يقرأ `/.agents/brain.md` ويستخرج baseline للأرقام:
       - build page count, JS/CSS bundle size, LCP, CLS, INP, Lighthouse (mobile).
       - حالة `src/pages/kernel/*` (demo vs live).
       - نتيجة `curl -sI https://brightai.site/api/ai/chat/` (هل Gemini ميت؟).
     - يقرأ `brightai-audit-report-v3.html` ويستخرج Top 15 killers + 11 درجة.
     - يقرأ `brightai-audit-prompts-v3.md` ويستخرج IDs المنفذة (مسجلة في brain.md).
     - يقرأ `src/pages/kernel/{chat,audit,approvals,evidence,policies,scenarios,stats,connectors,compliance,reports}.astro` ويقيّم:
       - empty state حاضر؟ skeleton مشحون؟ mobile-first؟ touch ≥44px؟ RTL logical properties؟
     - يكتب baseline JSON في `reports/CHAMPION-STATE.md` تحت `## BASELINE — <timestamp>`.

2. **Run-Phase (EXECUTE):**
   - يستدعي الـ prompt المحدد (`CHAMPION-0N`).
   - يلتقط stdout/stderr + diff + verification results.
   - يلتقط `screenshots/` عبر Playwright قبل/بعد (mobile 360×640 + desktop 1440×900).

3. **Post-Phase (RE-ANALYZE & REPORT):**
   - يعيد قياس baseline (نفس القياسات).
   - يحسب Δ (قبل/بعد) لكل metric.
   - يكتب `brightai-audit-reports/prompt-reports/CHAMPION-NN-YYYY-MM-DD.md` بالقالب:
     ```
     # CHAMPION-NN — <title> — <date>
     ## What Changed
     - Files modified:
     - New files:
     - Deleted files:
     - LOC delta: +X / -Y
     ## Self-Analysis (Before)
     - Kernel pages: 13 (demo: 11, real: 0)
     - Mobile score: 0-10
     - Empty state coverage: 1/11
     - Gemini live: 0
     - Bundle size: X KB
     - LCP: X.Xs
     - CLS: X.XX
     - Saudi SERP position: <keyword>: <num>
     ## Execution Summary
     - Verifications run: <list>
     - Pass/fail per verification
     - Screenshots: <list>
     ## Re-Analysis (After)
     - Kernel pages: 13 (demo: X, real: X)
     - Mobile score: 0-10
     - Empty state coverage: X/11
     - Gemini live: 1
     - Bundle size: Y KB
     - LCP: Y.Ys
     - CLS: Y.YY
     - Saudi SERP position: <keyword>: <num>
     ## Δ (Diff)
     - Kernel championship: +X pts
     - Mobile championship: +X pts
     - Saudi championship: +X pts
     - Overall: X% → Y%
     ## Risks Remaining
     - <list>
     ## Next Champion
     - <CHAMPION-0(N+1)>
     ```
   - يحدّث `brain.md` تحت `## 2. Change Ledger`: entry جديد بفروقات Δ.
   - يحدّث `reports/CHAMPION-STATE.md` تحت `## RUNS — <id>`.
   - يقترح commit message `[BAI-CHAMPION-NN] <title>`.

4. **Schedule loop:**
   - المؤقت الأول: كل prompt يُنفَّذ ثم يمر بـ loop كامل.
   - الـ aggregate: بعد تنفيذ CHAMPION-01..05 → run نهائي يجمع كل Δ ويصدر `brightai-audit-report-v4-champion.html`.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `node scripts/prompt-champion.mjs --id=CHAMPION-00` → يكتب `reports/CHAMPION-STATE.md` + يفحص التبعيات (Brain file، v3 report، v3 prompts، kernel pages)
- `node scripts/prompt-champion.mjs --id=CHAMPION-01` → ينفّذ + يكتب prompt-report + يحدّث brain.md
- `node scripts/prompt-champion.mjs --aggregate` → يصدر `brightai-audit-report-v4-champion.html` بدرجات Δ مجمّعة

**VERIFICATION COMMANDS**
```bash
node scripts/prompt-champion.mjs --id=CHAMPION-00
node scripts/prompt-champion.mjs --id=CHAMPION-01
node scripts/prompt-champion.mjs --aggregate
ls brightai-audit-reports/prompt-reports/
cat reports/CHAMPION-STATE.md
```

**ROLLBACK** — احذف `scripts/prompt-champion.mjs` + `reports/CHAMPION-STATE.md` + `brightai-audit-reports/prompt-reports/`. brain.md يستخدم `git revert` على commit الإضافة.

**DEFINITION OF DONE** — Orchestrator يعمل + Self-Analysis (Pre/Post) + Re-Report يكتب Δ + brain.md يحدّث + verification commands exit 0.

---

## PROMPT [ID: CHAMPION-01] — Self-Analysis (Kernel + Saudi) ثم تنفيذ Kernel Mobile-First Hero

**Priority: P0 · Effort: 24h · Impact: 25 (Kernel: +15, Mobile: +10) · Risk: high (UI rewrite) · Depends: CHAMPION-00, BAI-DEPLOY-13 · Blocks: CHAMPION-02**

**CONTEXT** — `/src/pages/kernel/chat.astro` (1720 سطر) هو قلب المنتج. حالياً: seed data + 3-pane desktop تنطوي على drawers تحت 1024px + no empty state + no skeleton + no voice. المطلوب: أفضل تجربة منتجات في العالم العربي على mobile 360×640 + desktop. التحليل الذاتي يجب أن يطابق تقرير v3 (chat = 8.0/10، connectors = 5.0/10، لا voice، لا RTL audit per page). الـ output: chat.astro + 6 صفحات kernel (audit/approvals/evidence/policies/scenarios/stats) → first-class mobile + empty/skeleton + voice (ar-SA) + screenshot diff.

**FILES IN SCOPE**
- `src/pages/kernel/chat.astro` (hero rewrite)
- `src/pages/kernel/audit.astro, approvals.astro, evidence.astro, policies.astro, scenarios.astro, stats.astro, reports.astro, compliance.astro, connectors.astro` (mobile-first)
- `src/components/kernel/KernelEmptyState.astro, KernelSkeleton.astro, KernelSeoSection.astro` (تحديث)
- `src/components/kernel/KernelVoiceInput.astro` (NEW — Web Speech API ar-SA)
- `src/styles/kernel.css` (mobile-first rethink)
- `scripts/prompt-champion.mjs` (run loop)

**MUST NOT TOUCH / PRESERVE**
- النص العربي المنشور (Saudi dialect — لا تبدّله)
- `src/components/kernel/KernelDemoPill.astro` (شفاف، حافظ على contract)
- `src/data/kernel-system-prompts.ts` (نظام prompts الخادم)
- `src/pages/api/ai/chat.ts` (backend logic — لا تعدل)
- `src/lib/quota.ts, src/lib/redis.ts` (security/cost layer)
- trailingSlash + 16 sections في homepage

**SELF-ANALYZE (PRE)** — `node scripts/prompt-champion.mjs --id=CHAMPION-01` يكتب baseline قبل ما يبدأ. الرئيسية يقيس:
- `src/pages/kernel/chat.astro` lines = 1720
- empty state components usage: index.astro فقط (1/11)
- skeleton components usage: index.astro فقط (1/11)
- touch targets <44px: 4.4% (في mobile-menu__header)
- voice input: 0
- mobile screenshots: قبل (baseline)
- `curl -sI https://brightai.site/api/ai/chat/` (هل Gemini ميت؟)

**TASK**

1. **Kernel Mobile-First Hero (chat.astro)**
   - 3-pane → 1-pane مع bottom-sheet drawers (ليس panes منزلق).
   - Compose box: `position: sticky; bottom: 0; safe-area-inset-bottom: 8px; z-index: 100`.
   - Empty state عند أول زيارة: "ابدأ محادثة — اسأل عن PDPL/ECC/AI governance" بدل seed data.
   - Skeleton loading على البيانات (threads list).
   - Voice input button (mic) في compose box:
     - Web Speech API: `webkitSpeechRecognition` + `lang="ar-SA"`.
     - Fallback: اعرض inline hint "المتصفح ما يدعم الإدخال الصوتي".
   - Onboarding tour (3 خطوات): highlight compose + highlight scenarios + highlight sessions.
   - إزالة `seedMessages` (data:73-84) من SSR.
   - Streaming SSE يحترم visualViewport (keyboard مفتوح).

2. **Empty + Skeleton لكل صفحات kernel (10/11)**
   - لكل audit/approvals/evidence/policies/scenarios/stats/reports/compliance/connectors:
     - إضافة `<KernelSkeleton />` فوق components.
     - إضافة `<KernelEmptyState />` كـ fallback.
   - إزالة `setTimeout` dummy في `${name}.astro` (الـ 7 demo states).

3. **Mobile-First CSS Rethink (kernel.css)**
   - mobile-first (default) → @media (min-width: 768px) → @media (min-width: 1366px).
   - تستبدل القياسات الثابتة بـ tokens.
   - الحفاظ على RTL عبر logical properties فقط.
   - safe-area-inset-bottom/top.
   - touch targets ≥44px (force عبر CSS `min-height: 44px` على buttons).

4. **A11y Polish**
   - skip-link على KernelLayout.
   - aria-label على كل icon-only buttons.
   - focus-visible outline 2px solid brand-400.
   - reduced-motion respect.

5. **Voice Input Component (KernelVoiceInput.astro)**
   - SSR-safe (الـ API client-side فقط).
   - اعرض transcript live.
   - تأكد RTL/Ara (خط TheYearofTheCamel أو IBM Plex Sans Arabic).

**ACCEPTANCE CRITERIA** (واحد على الأقل curl/playwright على الإنتاج)
- `curl -s https://brightai.site/kernel/chat/ | grep -c "ابدأ محادثة"` → ≥ 1
- `curl -s https://brightai.site/kernel/chat/ | grep -c "تصدير قائمة عملاء"` → 0
- Playwright على 360×640: compose box يظهر sticky + empty state أول زيارة + voice button visible
- Playwright: 0 touch targets <44px على 11/11 kernel pages
- Mobile Lighthouse (Chromium, Slow 4G) score: ≥ 90

**VERIFICATION COMMANDS**
```bash
node scripts/prompt-champion.mjs --id=CHAMPION-01
node scripts/playwright/mobile-audit-kernel.mjs --device=mobile-360
node scripts/playwright/screenshot.mjs --url=https://brightai.site/kernel/chat/ --viewport=360x640 --output=qa-screenshots/kernel-chat-after.png
diff qa-screenshots/kernel-chat-before.png qa-screenshots/kernel-chat-after.png
curl -s https://brightai.site/kernel/chat/ | grep -c "KernelSkeleton\|KernelEmptyState"
pnpm run verify:all
```

**ROLLBACK** — `git revert` على commit CHAMPION-01. لا rollback لـ backend (chat.ts unchanged).

**DEFINITION OF DONE** — chat.astro mobile-first + empty/skeleton universal + voice input + Lighthouse mobile ≥ 90 + 0 touch targets <44px + brain.md updated.

---

## PROMPT [ID: CHAMPION-02] — ربط Kernel بـ Gemini API عبر Render env `GEMINI_API_KEY`

**Priority: P0 · Effort: 3h · Impact: 30 (Kernel: real vs demo) · Risk: medium (backend live) · Depends: BAI-DEPLOY-13, CHAMPION-01 · Blocks: CHAMPION-03**

**CONTEXT** — `src/pages/api/ai/chat.ts:369` يقرأ `process.env.GEMINI_API_KEY` في runtime (ARCH-2 fix). الـ `render.yaml:11-15` يصف `runtime: node` + `startCommand: node ./dist/server/entry.mjs` + `healthCheckPath: /api/health/`. لكن الإنتاج فعلياً يخدم static (حسب v3 audit). المطلوب: تأكيد أن `GEMINI_API_KEY` في Render env متاح + chat يرجع رد حقيقي + لا يخدم `FAKE_RESPONSES` الثابتة.

**FILES IN SCOPE**
- `render.yaml` (تأكيد env vars)
- Render dashboard (إضافة env vars: GEMINI_API_KEY, GROQ_API_KEY, REDIS_URL, DATABASE_URL, BRIGHTAI_CHAT_KEY, CHAT_STREAMING_ENABLED)
- `src/pages/api/ai/chat.ts` (تأكيد انه يقرأ env runtime فقط)
- `src/lib/quota.ts` (Redis quota)
- `src/lib/redis.ts` (Redis session)

**MUST NOT TOUCH / PRESERVE**
- كل الـ runtime logic (chat.ts صحيح من ناحية الكود)
- `dist/server/entry.mjs` (built artifact)
- لا commit لأي قيمة key

**SELF-ANALYZE (PRE)** — يقيس:
- `curl -sI https://brightai.site/api/health/` → هل هو JSON أم HTML 404
- `curl -sI -X POST https://brightai.site/api/ai/chat/` → Content-Length: 0 (ميت) أو reply
- `grep -n "GEMINI_API_KEY" src/pages/api/ai/chat.ts` → موقع الـ reads
- `node scripts/prompt-champion.mjs --id=CHAMPION-02` يكتب baseline

**TASK**

1. **تأكيد Render env vars (يدوي، المالك ينفّذ من Dashboard)**
   - `GEMINI_API_KEY=<value>` (المفتاح الجديد المُدوَّر — خارج الريبو)
   - `GROQ_API_KEY=<value>` (fallback provider)
   - `REDIS_URL=rediss://...` (Redis Cloud / Upstash / Render KV)
   - `DATABASE_URL=postgresql://...` (إن وُجد)
   - `BRIGHTAI_CHAT_KEY=<32-byte hex>` (Origin whitelist bypass — `openssl rand -hex 32`)
   - `CHAT_STREAMING_ENABLED=true`
   - `GEMINI_MODEL=gemini-2.5-flash`
   - `TRUSTED_PROXY_COUNT=1`
   - `NODE_ENV=production`

2. **تأكيد chat.ts يقرأ env runtime**
   - `grep -n "process.env.GEMINI_API_KEY" src/pages/api/ai/chat.ts` → 4 مواضع (369, 373, 416, fallback).
   - تأكد `import.meta.env` غير مستخدم (كان ARCH-2 fix لتجنب التسريب).

3. **تأكيد deployment type = web service (ليس static)**
   - Render dashboard: type = web, runtime = node.

4. **Deploy + verify**
   - `pnpm run verify:post-deploy` (يضمّ drift probe + content probe).
   - `curl -i https://brightai.site/api/health/` → JSON + `x-brightai-build` header.
   - `curl -i -X POST https://brightai.site/api/ai/chat/ -H "Origin: https://brightai.site" -H "Content-Type: application/json" -d '{"message":"مرحبا، ما هي BrightAI؟"}'` → 200 + JSON `{"reply":"...","provider":"gemini"}`.

5. **Brain.md update**
   - تسجيل: `GEMINI_API_KEY live` في Section 1 Project State.
   - تسجيل: `Kernel live: 1/11` (chat يرتبط بـ Gemini، باقي demo).

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `curl -i https://brightai.site/api/health/` → 200 + JSON + `x-brightai-build: <sha>` header
- `curl -i -X POST https://brightai.site/api/ai/chat/ -H "Origin: https://brightai.site" -H "Content-Type: application/json" -d '{"message":"ما حوكمة الذكاء الاصطناعي؟"}'` → 200 + JSON `{"reply":"حوكمة الذكاء الاصطناعي تعني...","provider":"gemini"}`
- `curl -i -N -X POST https://brightai.site/api/ai/chat/ -H "Origin: https://brightai.site" -H "Accept: text/event-stream" -H "Content-Type: application/json" -d '{"message":"اشرح PDPL"}'` → SSE stream يبدأ بـ `event: token`
- `curl -s https://brightai.site/kernel/chat/ | grep -o "KernelDemoPill"` → حاضر (شفاف)

**VERIFICATION COMMANDS**
```bash
node scripts/prompt-champion.mjs --id=CHAMPION-02
curl -sI https://brightai.site/api/health/ | grep -iE "http|x-brightai-build"
curl -s -X POST https://brightai.site/api/ai/chat/ -H "Origin: https://brightai.site" -H "Content-Type: application/json" -d '{"message":"test"}' | head -c 200
curl -N -X POST https://brightai.site/api/ai/chat/ -H "Origin: https://brightai.site" -H "Accept: text/event-stream" -H "Content-Type: application/json" -d '{"message":"explain PDPL"}' | head -c 400
pnpm run verify:post-deploy
```

**ROLLBACK** — لا rollback لأن المفتاح في Render env فقط (لا في الريبو). لو فشلت، أزل env vars و ارجع للـ deploy السابق.

**DEFINITION OF DONE** — `GEMINI_API_KEY` في Render env + `/api/ai/chat/` يرجع رد حقيقي + رد ليس empty 200 + SSE streaming يشتغل + brain.md updated.

---

## PROMPT [ID: CHAMPION-03] — Saudi #1 Authority Pack (E-E-A-T + Local SEO + AEO)

**Priority: P0 · Effort: 16h · Impact: 20 (Saudi: +15, Trust: +5) · Risk: low (محتوى) · Depends: BAI-SAID-01/02/03/04 · Blocks: CHAMPION-04**

**CONTEXT** — حسب v3 audit: BrightAI يتصدر كلمتين ناشئتين ("حوكمة الذكاء الاصطناعي السعودية"، "AI Firewall السعودية") لكن غائب عن PDPL/ECC/البنوك. E-E-A-T ضعيف: اسم المؤسس "يزيد" فقط + لا CR + لا عملاء مسمّين + لا badges بصرية. المطلوب: حزمة Authority ترفع BrightAI إلى SERP top 3 لـ 5 كلمات سعودية + SERP top 1 لـ "حوكمة AI للبنوك" + SERP top 1 لـ "AI governance Saudi Arabia" (EN).

**FILES IN SCOPE**
- `src/components/Footer.astro` (CR + founder complete)
- `src/data/site.ts` (crNumber, founder full name, foundedYear)
- `src/data/schema-saudi-seo.json` (taxID, identifier, founder familyName)
- `public/llms.txt, llms-full.txt, ai.txt` (Entity Facts تفصيل)
- `src/pages/answer/[slug].astro` (NEW — 10 FAQ pages)
- `src/pages/lp/[slug].astro` (NEW — 5 landing pages)
- `src/content/blog/{pdpl,ecc,iso-42001,sama,sdaia}-*.md` (8 cluster per topic)
- `src/components/TrustBadges.astro` (NEW — SAMA/SDAIA/NCA/ISO 42001)
- `src/pages/index.astro` (Trust badges في hero)

**MUST NOT TOUCH / PRESERVE**
- النص العربي المنشور (Saudi dialect — لا تبدّله)
- `src/data/i18n-pairs.ts` (5 legal pairs موجودة)
- `public/_redirects` (protected)

**SELF-ANALYZE (PRE)** — يقيس:
- `grep -rn "تاكيد الكيان" src/data/site.ts` → هل CR number حاضر
- `grep -rn "founder" src/data/schema-saudi-seo.json` → هل full name
- `curl -s https://brightai.site/ | grep -oE "سجل تجاري"` → 0
- `curl -s https://brightai.site/ | grep -c "answer/"` → 0
- `wc -l src/content/blog/pdpl-*.md` → هل 8 cluster
- `node scripts/prompt-champion.mjs --id=CHAMPION-03` يكتب baseline

**TASK**

1. **E-E-A-T (الكيان القانوني)**
   - المالك يؤكد: CR + اسم المؤسس الكامل + سنة التأسيس + LinkedIn URL.
   - `src/data/site.ts` يحدّث:
     - `crNumber: '1010XXXXXX'`
     - `founder: { name: 'يزيد', familyName: 'الشريف', linkedIn: 'https://...', bio: '...' }`
   - `src/data/schema-saudi-seo.json` يضيف:
     - `taxID: '1010XXXXXX'`
     - `identifier: 'CR-1010XXXXXX'`
     - `founder.familyName`
     - `foundingDate: '2026-01-01'`
   - `Footer.astro` يضيف سطر "سجل تجاري: 1010XXXXXX" + "المؤسس: يزيد الشريف" + LinkedIn icon.
   - `llms.txt` يضيف `Commercial Registration: 1010XXXXXX, Founder: يزيد الشريف (since 2026)`.

2. **AEO / Answer Pages (10)**
   - `src/pages/answer/[slug].astro` (dynamic route):
     - 10 FAQ pages لكلمات: ai-firewall, pdpl-compliance, ecc-controls, ai-banking, ai-healthcare, ai-governance-framework, nca-compliance, sama-ai, sdaia-guidelines, iso-42001.
     - FAQPage + SpeakableSpecification schema.
     - 150-300 كلمة لكل إجابة، Saudi dialect.
     - internal links من pillar pages.
     - في sitemap + llms.txt.

3. **Landing Pages (5) — `/lp/*`**
   - `src/pages/lp/[slug].astro` (dynamic route):
     - 5 keywords: pdpl, ecc, banking, healthcare, government.
     - 800-1200 كلمة كل واحدة.
     - Hero + Trust signals + CTA + FAQ + internal links.
     - Service + FAQPage schema.
     - في sitemap + llms.txt.

4. **Trust Badges (Hero)**
   - `src/components/TrustBadges.astro` (NEW):
     - 4 logos: SAMA, SDAIA, NCA, ISO 42001.
     - label: "متوافق مع" (لا "معتمد من").
     - hover tooltip "امتثال لاشتراطات X".
     - ضع تحت CTA في hero.
   - Responsive: scrollable على mobile.

5. **Content Cluster (8 مقالات × 4 عنقود = 32)**
   - PDPL cluster (8 مقالات): pdpl-for-banks, pdpl-for-healthcare, pdpl-cross-border, dpo-role, dpia, pdpl-breach, pdpl-consent, pdpl-ai.
   - ECC cluster (8): ecc-2-2024, ecc-assess, ecc-ai-mapping, ecc-vs-iso27001, ecc-incident, ecc-audit, ecc-supply-chain, ecc-mobile.
   - ISO 42001 cluster (8): iso-42001-intro, iso-42001-clauses, iso-42001-audit, iso-42001-vs-iso27001, iso-42001-ai-policy, iso-42001-risk, iso-42001-control, iso-42001-saudi.
   - SAMA cluster (8): sama-ai, sama-banking, sama-cyber, sama-cloud, sama-open, sama-ai-risk, sama-ai-governance, sama-ai-implementation.
   - كل مقال: 1500+ كلمة + intra-cluster links + schema.

6. **GBP + Local SEO**
   - Google Business Profile (يدوي المالك).
   - NAP موحّد: JSON-LD + Footer + GBP + llms.txt.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `curl -s https://brightai.site/ | grep -oE "سجل تجاري|1010[0-9]{6}"` → ≥ 1
- `curl -s https://brightai.site/ | grep -oE '"founder":\{[^}]*"name":"[^"]*"'`
- `curl -s -o /dev/null -w "%{http_code}" https://brightai.site/answer/ai-firewall/` → 200
- `curl -s -o /dev/null -w "%{http_code}" https://brightai.site/lp/pdpl/` → 200
- `curl -s https://brightai.site/ | grep -ci "trust-badge"` → ≥ 1
- `grep -l "pdpl" src/content/blog/*.md | wc -l` → ≥ 8
- `grep -l "ecc" src/content/blog/*.md | wc -l` → ≥ 8
- `grep -l "iso-42001" src/content/blog/*.md | wc -l` → ≥ 8
- `grep -l "sama" src/content/blog/*.md | wc -l` → ≥ 8

**VERIFICATION COMMANDS**
```bash
node scripts/prompt-champion.mjs --id=CHAMPION-03
curl -s https://brightai.site/ | grep -oE "سجل تجاري|فاوندر|founder" | sort -u
curl -s -o /dev/null -w "%{http_code}" https://brightai.site/answer/ai-firewall/
curl -s -o /dev/null -w "%{http_code}" https://brightai.site/lp/pdpl/
curl -s https://brightai.site/sitemap.xml | grep -ciE "answer|lp"
curl -s https://brightai.site/llms.txt | grep -i "commercial registration"
grep -l "pdpl" src/content/blog/*.md | wc -l
```

**ROLLBACK** — `git revert` على commit. لا تأثير على قاعدة البيانات.

**DEFINITION OF DONE** — CR + founder كامل + 10 answer pages + 5 lp pages + 32 blog posts + trust badges + GBP + brain.md updated.

---

## PROMPT [ID: CHAMPION-04] — Champion Re-Analysis Loop (يُعيد تشغيل التحليل + التقرير v4)

**Priority: P0 · Effort: 8h · Impact: 15 (الكشف عن الفجوات) · Risk: low (read-mostly) · Depends: CHAMPION-01..03 · Blocks: CHAMPION-05**

**CONTEXT** — المطلوب من المالك: "برومبت يقوم بتحليل المشروع نفسه... ويعيد التحليل والتقرير ويركز على جعل المشروع يكون الأول في السعودية". هذا البرومبت يلبّي ذلك: بعد كل CHAMPION prompt، يجمع Δ ويُصدر `brightai-audit-report-v4-champion.html`. الـ v4 يكون شامل بعد CHAMPION-01..03 + يركز على kernel + Saudi #1.

**FILES IN SCOPE**
- `scripts/generate-audit-report-v4.mjs` (NEW — يقرأ prompt-reports/* + ينشئ HTML)
- `scripts/brightai-audit-report-v4-champion.html` (NEW)
- `brightai-audit-reports/prompt-reports/*.md` (المدخلات)
- `package.json` (add `audit:v4` script)

**MUST NOT TOUCH / PRESERVE**
- `brightai-audit-report-v3.html` (محفوظ للتاريخ)
- `brightai-audit-prompts-v3.md` (محفوظ)
- brain.md + state baseline

**SELF-ANALYZE (PRE)** — `node scripts/prompt-champion.mjs --id=CHAMPION-04`:
- اقرأ كل `brightai-audit-reports/prompt-reports/CHAMPION-*.md`.
- استخرج Δ metrics.
- قارن بـ v3 baseline.

**TASK**

1. **اكتب `scripts/generate-audit-report-v4.mjs`**
   - يقرأ `prompt-reports/*.md`.
   - يستخرج لكل prompt: baseline → execution → after → Δ.
   - ينشئ `brightai-audit-report-v4-champion.html` بنفس ستايل v3:
     - Cover مع Championship badge.
     - Executive Summary (3 paragraphs Saudi dialect).
     - جدول Δ per CHAMPION prompt.
     - Top 15 Killers (مُحدّث).
     - خارطة طريق kernel + Saudi (P0/P1/P2/P3).
     - جدول تحقق curl لكل prompt.
     - "ما يجب ألا يُلمس" (نفس قائمة v3).

2. **خارطة Championship Roadmap (90 يوم)**
   - Phase 1 (48h): CHAMPION-02 (Gemini live) + CHAMPION-01 (mobile-first kernel).
   - Phase 2 (أسبوعان): CHAMPION-03 (Authority Pack) + CHAMPION-05 (Conversion) + CHAMPION-04 متابعة.
   - Phase 3 (شهر): kernel real-data integration + Saudi SERP catch-up.
   - Phase 4 (3 أشهر): #1 SERP + backlinks + press.
   - Phase 5 (6 أشهر): regional #1 + real-time collab.

3. **Compile + commit + reopen**:
   - `node scripts/generate-audit-report-v4.mjs` → يكتب HTML.
   - `git add scripts/generate-audit-report-v4.mjs brightai-audit-report-v4-champion.html`.
   - commit: `[BAI-CHAMPION-04] aggregate v4 champion report`.

4. **Brain.md update**:
   - Section 1 Project State: degrees (Kernel: 45% → 80%, Saudi: 56% → 75%, Mobile: 82% → 95%).
   - Section 2 Change Ledger: entry لكل CHAMPION prompt.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `node scripts/generate-audit-report-v4.mjs` → ينشئ `brightai-audit-report-v4-champion.html`
- `grep -c "CHAMPION" brightai-audit-report-v4-champion.html` → ≥ 50
- `grep -c "Δ" brightai-audit-report-v4-champion.html` → ≥ 20
- `grep -c "السعودية" brightai-audit-report-v4-champion.html` → ≥ 10

**VERIFICATION COMMANDS**
```bash
node scripts/prompt-champion.mjs --id=CHAMPION-04
node scripts/generate-audit-report-v4.mjs
ls -la brightai-audit-report-v4-champion.html
grep -c "CHAMPION" brightai-audit-report-v4-champion.html
wc -l brightai-audit-report-v4-champion.html
```

**ROLLBACK** — احذف `brightai-audit-report-v4-champion.html` + `scripts/generate-audit-report-v4.mjs`. الـ v3 يبقى.

**DEFINITION OF DONE** — v4 champion report يصدر + كل Δ مُجمّع + Roadmap محدّث + brain.md updated.

---

## PROMPT [ID: CHAMPION-05] — Conversion + Telemetry Pack (يحول kernel لاستخدام منتجي)

**Priority: P1 · Effort: 12h · Impact: 12 (Conversion: +7, Measurement: +5) · Risk: low (analytics) · Depends: CHAMPION-01, CHAMPION-02, BAI-MEAS-01..03 · Blocks: none**

**CONTEXT** — يحوّل kernel من demo إلى منتج: rate limit metrics + cost + circuit breaker visibility + GA4 events + conversion funnel. هذا يكمل CHAMPION-01 (UX) + CHAMPION-02 (Gemini) بمنتج قابل للقياس.

**FILES IN SCOPE**
- `src/pages/kernel/admin/quota.astro` (NEW — quota dashboard)
- `src/pages/api/kernel/quota-stats.ts` (NEW — reads Redis counters)
- `src/lib/analytics.ts` (NEW — GA4 measurement protocol server-side)
- `src/pages/api/ai/chat.ts` (emit event on success)
- `src/pages/api/lead.ts` (emit event on success)
- `src/lib/observability/sentry.ts` (activate Sentry)

**MUST NOT TOUCH / PRESERVE**
- النص العربي
- quota logic الأصلي
- chat logic

**SELF-ANALYZE (PRE)** — يقيس:
- `grep -n "ga4\|mixpanel\|gtag" src/pages/api/ai/chat.ts` → لا server-side events
- `grep -rn "sentry" src/lib/observability/` → Sentry no-op
- `curl -s https://brightai.site/api/kernel/quota-stats/` → 404 (لا يوجد)

**TASK**

1. **Quota Dashboard**
   - `src/pages/api/kernel/quota-stats.ts` (NEW):
     - GET → `{ usage, cost, circuit: { provider: 'open' | 'closed' }, ts }`.
     - Reads from `src/lib/quota.ts` counters.
     - Auth: admin-only (BRIGHTAI_ADMIN_KEY env).
   - `src/pages/kernel/admin/quota.astro` (NEW):
     - Charts: usage/day, cost/day, circuit state.
     - Date-range filter.
     - Auth gate.

2. **GA4 Server-Side Events**
   - `src/lib/analytics.ts` (NEW):
     - GA4 Measurement Protocol (server-side).
     - Functions: `trackChatStart`, `trackChatCompleted`, `trackLeadSubmitted`, `trackScenarioTriggered`.
   - في `chat.ts`: بعد success → `trackChatCompleted({ sessionId, provider, tokens, latencyMs })`.
   - في `lead.ts`: بعد success → `trackLeadSubmitted({ email, source })`.

3. **Sentry Activation**
   - `SENTRY_DSN` يضاف لـ Render env.
   - `src/lib/observability/sentry.ts` يهيّأ Sentry عند وجود DSN.
   - Captures: API errors + frontend errors + chat failures.

4. **Conversion Funnel**
   - GA4 funnel: page_view → kernel_land → chat_started → chat_completed → lead_form_view → lead_submitted.
   - Track via `track*` functions.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl على الإنتاج)
- `curl -s -o /dev/null -w "%{http_code}" https://brightai.site/api/kernel/quota-stats/` → 200 (with admin key)
- `curl -s -o /dev/null -w "%{http_code}" https://brightai.site/kernel/admin/quota/` → 200
- GA4 Realtime يعرض events بعد chat
- Sentry dashboard يعرض errors

**VERIFICATION COMMANDS**
```bash
node scripts/prompt-champion.mjs --id=CHAMPION-05
curl -s -o /dev/null -w "%{http_code}" https://brightai.site/api/kernel/quota-stats/ -H "x-brightai-admin-key: $ADMIN_KEY"
curl -s -o /dev/null -w "%{http_code}" https://brightai.site/kernel/admin/quota/
# تحقق يدوي في GA4 Realtime + Sentry
```

**ROLLBACK** — `git revert` + حذف env vars.

**DEFINITION OF DONE** — quota dashboard live + GA4 events streaming + Sentry active + conversion funnel measurable.

---

## PROMPT [ID: CHAMPION-06] — Mobile-First UX Polish (الهاتف أولاً، ثم الديسك)

**Priority: P0 · Effort: 16h · Impact: 18 (Mobile: +10, UX: +8) · Risk: medium (تعديل CSS) · Depends: CHAMPION-01 · Blocks: CHAMPION-04**

**CONTEXT** — `src/styles/kernel.css` (475 سطر) يستخدم desktop-first implicit + يحتوي 4.4% touch targets <44px. المطلوب: mobile-first CSS rewrite + touch targets ≥44px + safe-area-inset + tap-delay elimination + app-like bottom tab bar + onboarding tour.

**FILES IN SCOPE**
- `src/styles/kernel.css` (mobile-first rewrite)
- `src/layouts/KernelLayout.astro` (tab bar + safe-area)
- `src/pages/kernel/chat.astro` (onboarding flow)
- `src/components/kernel/KernelOnboarding.astro` (NEW — 3-step tour)

**MUST NOT TOUCH / PRESERVE**
- النص العربي
- v3 tokens (في tokens.css)
- chat SSE logic

**SELF-ANALYZE (PRE)** — يقيس:
- `grep -n "min-height\|min-height: 44px" src/styles/kernel.css` → 0
- `grep -n "touch-action" src/styles/kernel.css` → 0
- `grep -n "safe-area" src/styles/kernel.css` → 0
- Playwright mobile audit baseline (<44px count)

**TASK**

1. **CSS Mobile-First**
   - mobile-first (default 360px) → @media (min-width: 768px) → @media (min-width: 1366px).
   - يحل محل كل `@media (max-width: ...)` بـ mobile-first.
   - استخدام `clamp()` للـ typography fluid.

2. **Touch Targets ≥44px**
   - `button, a, [role="button"]` `{ min-height: 44px; min-width: 44px; }` كقاعدة.
   - استثناءات موثّقة inline.

3. **Safe Area Insets**
   - bottom nav: `padding-bottom: env(safe-area-inset-bottom);`
   - topbar: `padding-top: env(safe-area-inset-top);`

4. **Tap Delay Elimination**
   - `body { touch-action: manipulation; }`
   - `* { -webkit-tap-highlight-color: transparent; }` (اختياري).

5. **App-Like Bottom Tab Bar**
   - 4 tabs: Chat / Audit / Reports / Profile.
   - icons + active state.
   - safe-area-inset-bottom.
   - visible على mobile فقط (< 768px).

6. **Onboarding Tour (KernelOnboarding.astro)**
   - 3-step tour:
     - Step 1: highlight compose box.
     - Step 2: highlight scenarios في sidebar.
     - Step 3: highlight sessions.
   - Skip button.
   - localStorage يحفظ "tour done".

7. **Voice Input Polish (CHAMPION-01 extension)**
   - تأكد ar-SA + transcript + fallback.

**ACCEPTANCE CRITERIA** (واحد على الأقل curl/playwright على الإنتاج)
- Playwright mobile 360×640: 0 touch targets <44px على 11/11 kernel pages
- Playwright: bottom tab bar visible + safe-area respected
- Playwright: onboarding tour يظهر مرة واحدة على first visit
- `grep -c "safe-area\|touch-action" src/styles/kernel.css` → ≥ 3

**VERIFICATION COMMANDS**
```bash
node scripts/prompt-champion.mjs --id=CHAMPION-06
node scripts/playwright/mobile-audit-kernel.mjs --device=mobile-360
node scripts/playwright/screenshot.mjs --url=https://brightai.site/kernel/chat/ --viewport=360x640 --output=qa-screenshots/kernel-chat-mobile.png
grep -c "safe-area\|touch-action\|min-height: 44px" src/styles/kernel.css
```

**ROLLBACK** — `git revert`. CSS-only، تأثير محدود.

**DEFINITION OF DONE** — mobile-first CSS + touch targets ≥44px + safe-area + tap-delay + bottom tab bar + onboarding tour + brain.md updated.

---

## CHAMPION Loop Schedule

| Run | الإطار | Prompt | الأثر المتوقع |
|---|---|---|---|
| 1 | 48h | CHAMPION-02 (Gemini live) | +30 Kernel |
| 2 | 48h | CHAMPION-01 (mobile-first kernel) | +25 Kernel + Mobile |
| 3 | أسبوع | CHAMPION-03 (Saudi #1) | +20 Saudi |
| 4 | أسبوع | CHAMPION-06 (mobile polish) | +18 Mobile |
| 5 | أسبوع | CHAMPION-05 (telemetry) | +12 Conversion |
| 6 | نصف شهر | CHAMPION-04 (v4 report) | +15 (measurement) |

**الإجمالي:** Kernel 45% → 90%، Saudi 56% → 88%، Mobile 82% → 98%، Overall 47.5% → 88%.

---

## القالب الإلزامي (CHAMPION يحافظ على نفس DEC-PROC-12)

كل prompt:
- يبدأ بـ `node scripts/prompt-champion.mjs --id=<id>`.
- يكتب baseline في `reports/CHAMPION-STATE.md`.
- ينفّذ TASK مع `[BAI-CHAMPION-NN]` commit format.
- يكتب prompt-report في `brightai-audit-reports/prompt-reports/CHAMPION-NN-YYYY-MM-DD.md`.
- يحدّث brain.md ledger.
- يتأكد `pnpm run verify:post-deploy` (production gate).
- VERIFICATION COMMANDS exit 0.
- يقدّم DEC-PROC-12-001 verified_production field.

---

## الربط مع التقارير الحالية

- `brightai-audit-report-v3.html` (التقرير الأصلي) — يبقى مرجع historical.
- `brightai-audit-report-v3-prompts.md` (البرومبتات الأصلية) — يبقى.
- `brightai-audit-report-v4-champion.html` (يولّد في CHAMPION-04) — يعرض Δ مجمّع.
- `reports/CHAMPION-STATE.md` — state machine.
- `brightai-audit-reports/prompt-reports/*.md` — per-prompt Δ.

كل ملف يخدم غرض مختلف. الـ DEC-PROC-12-001 verified_production gate يُطبَّق على كل تقرير جديد بدءاً من 2026-07-25.

---

**Generated:** 2026-07-30 · **Author:** BrightAI Workspace Agent · **Mode:** Mid
