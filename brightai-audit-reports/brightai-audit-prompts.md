# BrightAI Production-First Audit — MiniMax Code M3 Prompts

**Total:** 79 prompts across 12 areas  
**Date:** 2026-07-25  
**Source:** `/home/z/my-project/download/brightai-audit-report.pdf` §4  
**Usage:** كل برومبت = تغيير ذرّي قابل للمراجعة والتحقق والتراجع في PR واحد. كل برومبت يحوي CONTEXT, FILES IN SCOPE, MUST NOT TOUCH, TASK, ACCEPTANCE CRITERIA (واحد على الأقل قابلة للتحقق آليًا بالـ curl على الإنتاج), VERIFICATION COMMANDS, ROLLBACK, DEFINITION OF DONE.

## جدول المحتويات

- BAI-DEPLOY — Deployment Forensics (7 برومبت)
- BAI-SEC — Security & PDPL (10 برومبت)
- BAI-IDX — Indexation & Crawling (11 برومبت)
- BAI-LINK — Internal Linking (6 برومبت)
- BAI-CONTENT — Content Quality (8 برومبت)
- BAI-SCHEMA — Schema.org (5 برومبت)
- BAI-DESIGN — Design/UX (8 برومبت)
- BAI-A11Y — Accessibility (5 برومبت)
- BAI-PERF — Performance (5 برومبت)
- BAI-ARCH — Architecture (5 برومبت)
- BAI-MEAS — Measurement (4 برومبت)
- BAI-GROWTH — Growth (5 برومبت)

---



---

# BAI-SEC — Security & PDPL




---
## PROMPT [ID: BAI-SEC-16] — /api/lead يرجع JSON صريح (إصلاح PDPL silent 200)

**Priority:** P0 |
**Effort:** 0.5h |
**Impact:** +5% على Security |
**Risk:** L |
**Depends on:** BAI-DEPLOY-12 |
**Blocks:** —

**CONTEXT** — src/pages/api/lead.ts:283-288 يرجع JSON صحيح: {ok, mode, idempotencyKey, message}. لكن الإنتاج يرجع 200 بـ body فارغ (silent). هذا مخالفة PDPL المادة 16 (المساءلة).

**FILES IN SCOPE** — src/pages/api/lead.ts (no change — موجود), src/pages/api/csrf-token.ts (no change)

**MUST NOT TOUCH / PRESERVE** — lead.ts handler logic، Zod schema

**TASK** — 1) بعد BAI-DEPLOY-12 deploy، /api/lead سيخدم الكود الجديد. 2) اختبر: curl -X POST /api/lead -H 'Origin: https://brightai.site' -d '{}' (يجب 400 validation_failed). 3) اختبر: curl -X POST /api/lead -H 'Origin: https://brightai.site' + CSRF token + valid body → 200 JSON.

**ACCEPTANCE CRITERIA** — 1) curl -X POST /api/lead -d '{}' → 400 + JSON {error: 'csrf_invalid'}. 2) curl /api/csrf-token/ → 200 + {token: '...'}. 3) curl -X POST /api/lead -H 'X-CSRF-Token: ' -d '{valid body}' → 200 + JSON {ok: true, mode, message: 'تم استلام طلبك...'}

**VERIFICATION COMMANDS**
```bash
curl -sX POST https://brightai.site/api/lead -H 'Origin: https://brightai.site' -d '{}' | head -c 300
curl -s https://brightai.site/api/csrf-token/ | head -c 300
```

**ROLLBACK** — `git revert HEAD (لكن سيرجع silent 200)`

**DEFINITION OF DONE** — /api/lead يرجع JSON صريح (validation_failed أو ok=true)، مُتحقَّق بـ curl -X POST.

---
## PROMPT [ID: BAI-SEC-17] — Consent Mode v2 مفعّل (gtag consent update)

**Priority:** P1 |
**Effort:** 4h |
**Impact:** +5% على Security/PDPL |
**Risk:** M |
**Depends on:** BAI-DEPLOY-12 |
**Blocks:** —

**CONTEXT** — src/components/CookieConsent.astro + public/js/analytics.js يطبّقان consent محليًا فقط. لا يوجد gtag('consent', 'update', {ad_storage, analytics_storage, ad_user_data, ad_personalization}). مخالفة لـ Google Consent Mode v2.

**FILES IN SCOPE** — public/js/analytics.js (setConsent function), public/js/gtag-init.js, src/components/CookieConsent.astro

**MUST NOT TOUCH / PRESERVE** — current setConsent() logic على الـ queue

**TASK** — 1) في analytics.js setConsent(): أضف window.gtag('consent', 'update', {ad_storage: next === 'granted' ? 'granted' : 'denied', analytics_storage: next === 'granted' ? 'granted' : 'denied', ad_user_data: 'denied', ad_personalization: 'denied'}). 2) في gtag-init.js: أضف default consent 'denied' قبل تحميل gtag.js. 3) في CookieConsent.astro: تأكد أن setConsent يُستدعى فور accept/decline. 4) اختبر بـ GA4 DebugView.

**ACCEPTANCE CRITERIA** — 1) curl / | grep 'gtag(\'consent\' → يجب أن يحوي 'default' + 'update'. 2) GA4 DebugView: بعد accept، event 'consent_update'. 3) قبل accept: لا events تُرسل.

**VERIFICATION COMMANDS**
```bash
curl -s https://brightai.site/ | grep -oE "gtag\('consent'[^)]*\)" | head -3
```

**ROLLBACK** — `أزل gtag('consent', 'update') من analytics.js`

**DEFINITION OF DONE** — gtag('consent', 'update', {...}) يعمل عند accept/decline، مُتحقَّق بـ GA4 DebugView.

---
## PROMPT [ID: BAI-SEC-18] — إزالة unsafe-inline بـ nonce-based CSP (Phase 2)

**Priority:** P2 |
**Effort:** 16h |
**Impact:** +8% على Security |
**Risk:** H |
**Depends on:** BAI-SEC-17 |
**Blocks:** —

**CONTEXT** — CSP الحالية تحوي 'unsafe-inline' على script-src (kernel pages use ) و style-src-elem (Astro ClientRouter view-transition styles) و style-src-attr (65+ components use inline style=). nonce-based CSP يلزم إعادة كتابة ~30 ملف.

**FILES IN SCOPE** — scripts/security-headers.mjs, src/middleware.ts (generate nonce per request), src/layouts/BaseLayout.astro, src/components/KernelAiAssistant.astro + كل صفحات kernel

**MUST NOT TOUCH / PRESERVE** — current CSP values، CSP SoT structure

**TASK** — 1) src/middleware.ts: أضف generateNonce() في onRequest وحقن  بـ nonce في response. 2) BaseLayout.astro: اقرأ nonce من Astro.locals.requestNonce ومرّره لكل . 3) security-headers.mjs: استبدل 'unsafe-inline' في script-src بـ 'nonce-'. 4) أضف  للـ view-transition styles. 5) لكل inline style= في 65+ components: انقل لـ CSS classes.

**ACCEPTANCE CRITERIA** — 1) curl -I /api/health/ → Content-Security-Policy يحوي 'nonce-' لا 'unsafe-inline' على script-src. 2) curl / | grep 'nonce=' → يحوي nonce على كل script. 3) console في المتصفح: 0 CSP violations.

**VERIFICATION COMMANDS**
```bash
curl -sI https://brightai.site/api/health/ | grep -oE "script-src '[^']*'" | head -3
curl -s https://brightai.site/ | grep -oE 'nonce="[^"]+"' | head -3
```

**ROLLBACK** — `git revert HEAD + أعد 'unsafe-inline' في CSP`

**DEFINITION OF DONE** — CSP بدون 'unsafe-inline' على script-src، مُتحقَّق بـ curl -I + console browser.

---
## PROMPT [ID: BAI-SEC-19] — HSTS preload (submit to hstspreload.org)

**Priority:** P2 |
**Effort:** 2h |
**Impact:** +3% على Security |
**Risk:** L |
**Depends on:** BAI-SEC-15 |
**Blocks:** —

**CONTEXT** — حاليًا hstspreload.org/api/v2/status?domain=brightai.site = {status: unknown}. بعد BAI-SEC-15، HSTS مفعّل. التسجيل في preload list يلزم كل browser بحظر HTTP للموقع.

**FILES IN SCOPE** — https://hstspreload.org (submit form), scripts/security-headers.mjs (no change — HSTS value)

**MUST NOT TOUCH / PRESERVE** — HSTS value (max-age=63072000; includeSubDomains; preload)

**TASK** — 1) تأكد BAI-SEC-15 مفعّل: curl -I / → Strict-Transport-Security موجود. 2) اذهب https://hstspreload.org/?domain=brightai.site. 3) اضغط 'Submit'. 4) انتظر تأكيد (قد يأخذ أسابيع). 5) افحص: curl 'https://hstspreload.org/api/v2/status?domain=brightai.site' → status: pending.

**ACCEPTANCE CRITERIA** — 1) curl 'https://hstspreload.org/api/v2/status?domain=brightai.site' → status: pending أو preload. 2) لا يوجد HTTP غير HTTPS للموقع.

**VERIFICATION COMMANDS**
```bash
curl -s 'https://hstspreload.org/api/v2/status?domain=brightai.site' | jq .
```

**ROLLBACK** — `غير ممكن (preload list لا يدعم removal سريع)`

**DEFINITION OF DONE** — hstspreload.org status = pending أو preload، مُتحقَّق بـ curl API.

---
## PROMPT [ID: BAI-SEC-20] — تصليب /api/* (auth على /api/ai/chat، rate limit per-IP، body size limit 10KB)

**Priority:** P1 |
**Effort:** 4h |
**Impact:** +6% على Security |
**Risk:** M |
**Depends on:** BAI-DEPLOY-12 |
**Blocks:** —

**CONTEXT** — /api/ai/chat يطبّق Origin + BRIGHTAI_CHAT_KEY (chat.ts:53-61). لكن لا يوجد body size limit صريح — يمكن إرسال 1MB body. /api/lead يطبّق rate limit 5/min/IP لكن لا حدّ حجم. /api/ai/chat rate limit 10/min/IP.

**FILES IN SCOPE** — src/pages/api/ai/chat.ts, src/pages/api/lead.ts, src/middleware.ts (أضف body size limit)

**MUST NOT TOUCH / PRESERVE** — existing Origin allowlist، BRIGHTAI_CHAT_KEY logic

**TASK** — 1) في src/middleware.ts: أضف check على Content-Length header، لو >10KB ارجع 413. 2) في chat.ts: فعّل BRIGHTAI_CHAT_KEY check بشكل إلزامي (لو غير مضبوط، ارجع 503). 3) في lead.ts: أضف max body size 5KB. 4) اختبر: curl -X POST /api/ai/chat -d @large-file.json → 413.

**ACCEPTANCE CRITERIA** — 1) curl -X POST /api/ai/chat -d $(python3 -c 'print("x"*11000)') → 413. 2) curl -X POST /api/lead -d $(python3 -c 'print("x"*6000)') → 413. 3) curl /api/ai/chat بدون Origin و بدون BRIGHTAI_CHAT_KEY → 403.

**VERIFICATION COMMANDS**
```bash
curl -sX POST https://brightai.site/api/ai/chat -H 'Content-Type: application/json' -d "{\"message\":\"$(python3 -c 'print(\"x\"*11000)')\"}" -o /dev/null -w '%{http_code}'
curl -sX POST https://brightai.site/api/lead -H 'Content-Type: application/json' -d "{\"x\":\"$(python3 -c 'print(\"x\"*6000)')\"}" -o /dev/null -w '%{http_code}'
```

**ROLLBACK** — `أزل body size check من middleware`

**DEFINITION OF DONE** — /api/* ترجع 413 عند body > 10KB، مُتحقَّق بـ curl -X POST.

---
## PROMPT [ID: BAI-SEC-21] — حذف .agents/brain.md من الريبو العام (أو جعله private)

**Priority:** P0 |
**Effort:** 1h |
**Impact:** +8% على Security |
**Risk:** M |
**Depends on:** BAI-SEC-13 |
**Blocks:** —

**CONTEXT** — .agents/brain.md حجمه 1.1MB يحوي 403 mentions لـ KEY/SECRET/TOKEN + مفتاح Gemini (بعد BAI-SEC-13 يحوي reference فقط). حتى لو السرّ حُذِف، الـ 1.1MB يحوي notes قرارات حساسة.

**FILES IN SCOPE** — .agents/brain.md, .agents/AGENTS.md, .gitignore

**MUST NOT TOUCH / PRESERVE** — —

**TASK** — خيار 1 (مُختصَر): احذف .agents/brain.md من git history بـ git filter-branch أو BFG Repo-Cleaner. خيار 2 (أبسط): انقل .agents/ إلى repo منفصل خاص (.agents-private). خيار 3: أضف .agents/ إلى .gitignore.

**ACCEPTANCE CRITERIA** — 1) grep -r 'AIza' .agents/ → 0. 2) ls -la .agents/brain.md → file غير موجود أو في repo منفصل. 3) git log --all --source -- .agents/brain.md → لا history.

**VERIFICATION COMMANDS**
```bash
grep -rn 'AIza' .agents/ 2>/dev/null | wc -l  # 0
ls .agents/brain.md 2>&1 | head -1
```

**ROLLBACK** — `git revert (لو حذف) أو git checkout HEAD~1 .agents/brain.md`

**DEFINITION OF DONE** — .agents/brain.md غير موجود في الريبو العام، مُتحقَّق بـ ls + grep.

---

---

# BAI-IDX — Indexation & Crawling

## PROMPT [ID: BAI-IDX-12] — إصلاح /blog و /solutions بدون slash → 301 redirect

**Priority:** P0 |
**Effort:** 1h |
**Impact:** +5% على Indexation |
**Risk:** L |
**Depends on:** BAI-DEPLOY-12 |
**Blocks:** —

**CONTEXT** — astro.config.mjs:186 يقول trailingSlash: 'always'. لكن الإنتاج يرجع 404 على /blog و /solutions (no slash) بدل 301 redirect. هذا يكسر روابط داخلية كثيرة.

**FILES IN SCOPE** — astro.config.mjs (no change — trailingSlash: 'always' موجود), src/middleware.ts (لا يدخل)

**MUST NOT TOUCH / PRESERVE** — astro.config.mjs trailingSlash value

**TASK** — 1) بعد BAI-DEPLOY-12 deploy، Astro سينتج redirects تلقائيًا. 2) اختبر: curl -I /blog → 301. 3) curl -I /solutions → 301. 4) curl -I /kernel → 301. 5) لو لم يحدث، أضف redirects صريحة في astro.config.mjs redirects object.

**ACCEPTANCE CRITERIA** — 1) curl -I /blog → 301 Location: /blog/. 2) curl -I /solutions → 301 Location: /solutions/. 3) curl -I /kernel → 301 Location: /kernel/.

**VERIFICATION COMMANDS**
```bash
curl -sI https://brightai.site/blog | head -5
curl -sI https://brightai.site/solutions | head -5
curl -sI https://brightai.site/kernel | head -5
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — /blog و /solutions و /kernel (no slash) ترجع 301 إلى الـ slash version، مُتحقَّق بـ curl -I.

---
## PROMPT [ID: BAI-IDX-13] — إصلاح hreflang على /en/ (نشر الكود الموجود)

**Priority:** P0 |
**Effort:** 0h |
**Impact:** +5% على Indexation |
**Risk:** L |
**Depends on:** BAI-DEPLOY-12 |
**Blocks:** —

**CONTEXT** — src/pages/en/index.astro:31-35 يحوي hreflang الصحيح: {en-SA: self, ar-SA: /, x-default: /}. لكن الإنتاج يخدم نسخة قديمة تحوي hreflang مكسور (self = ar-SA، x-default = /en/).

**FILES IN SCOPE** — src/pages/en/index.astro (no change — موجود), src/pages/index.astro (no change — hreflang صحيح)

**MUST NOT TOUCH / PRESERVE** — hreflang structure في en/index.astro

**TASK** — 1) بعد BAI-DEPLOY-12 deploy، الإنتاج سيخدم الكود الجديد. 2) اختبر: curl /en/ | grep hreflang → self = en-SA، x-default = /.

**ACCEPTANCE CRITERIA** — 1) curl /en/ | grep 'hreflang="en-SA"' → href = https://brightai.site/en/. 2) curl /en/ | grep 'hreflang="ar-SA"' → href = https://brightai.site/. 3) curl /en/ | grep 'hreflang="x-default"' → href = https://brightai.site/.

**VERIFICATION COMMANDS**
```bash
curl -s https://brightai.site/en/ | grep -oE '<link rel="alternate" hreflang="[^"]+" href="[^"]+"' | head -5
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — hreflang على /en/ صحيح (self = en-SA، x-default = /)، مُتحقَّق بـ curl + grep.

---
## PROMPT [ID: BAI-IDX-14] — noindex على /404, /500, /design/*, /sitemap/

**Priority:** P1 |
**Effort:** 1h |
**Impact:** +3% على Indexation |
**Risk:** L |
**Depends on:** BAI-DEPLOY-12 |
**Blocks:** —

**CONTEXT** — صفحات النظام (/404, /500) وصفحات التصميم (/design/*) وصفحة /sitemap/ يجب أن تحوي . حاليًا قد تكون مفهرسة، تخفّض جودة sitemap.

**FILES IN SCOPE** — src/pages/404.astro, src/pages/design/*.astro, src/pages/sitemap/index.astro, src/layouts/BaseLayout.astro (noindex prop)

**MUST NOT TOUCH / PRESERVE** — current robots meta logic

**TASK** — 1) أضف  لكل صفحة من الـ 4. 2) أو مرّر prop noindex=true لـ BaseLayout. 3) اختبر: curl /404 | grep robots → noindex. 4) curl /design/buttons | grep robots → noindex.

**ACCEPTANCE CRITERIA** — 1) curl /404 | grep 'noindex' → موجود. 2) curl /design/buttons | grep 'noindex' → موجود (لو صفحة design موجودة). 3) curl /sitemap/ | grep 'noindex' → موجود.

**VERIFICATION COMMANDS**
```bash
curl -s https://brightai.site/404 | grep -i 'noindex'
curl -s https://brightai.site/sitemap/ | grep -i 'noindex'
```

**ROLLBACK** — `أزل  من الصفحات`

**DEFINITION OF DONE** — /404 و /sitemap/ يحويان noindex، مُتحقَّق بـ curl + grep.

---
## PROMPT [ID: BAI-IDX-15] — lastmod صادق per-page (من git log)

**Priority:** P1 |
**Effort:** 3h |
**Impact:** +5% على Indexation |
**Risk:** M |
**Depends on:** BAI-DEPLOY-12 |
**Blocks:** —

**CONTEXT** — sitemap.xml الحالي يحوي 8 تواريخ فقط لـ 180 صفحة (119 صفحة بنفس lastmod 2026-07-18). scripts/generate-sitemap-all-pages.mjs موجود ويستخرج lastmod من git log، لكن غير منشور.

**FILES IN SCOPE** — scripts/generate-sitemap-all-pages.mjs (no change — موجود), package.json sitemap:generate (no change)

**MUST NOT TOUCH / PRESERVE** — lastmod derivation logic

**TASK** — 1) بعد BAI-DEPLOY-12 deploy، sitemap.xml سيخدم النسخة الجديدة. 2) اختبر: curl /sitemap.xml | grep '' | sort | uniq -c → يجب أن يحوي تواريخ متعددة (واحد لكل صفحة تقريبًا). 3) لو لا يزال موحَّد، افحص git log --format=%cs -- src/pages/.astro.

**ACCEPTANCE CRITERIA** — 1) curl /sitemap.xml | grep '' | sort | uniq -c → عدد التواريخ > 20. 2) curl /sitemap.xml | grep -c '' → 180.

**VERIFICATION COMMANDS**
```bash
curl -s https://brightai.site/sitemap.xml | grep -oE '[^' | sort -u | wc -l  # > 20
curl -s https://brightai.site/sitemap.xml | grep -c ''  # 180
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — sitemap.xml يحوي > 20 lastmod مختلف (واحد per-page من git log)، مُتحقَّق بـ curl + grep.

---
## PROMPT [ID: BAI-IDX-16] — سايت ماب واحد في robots.txt (حذف التكرار)

**Priority:** P0 |
**Effort:** 0.5h |
**Impact:** +2% على Indexation |
**Risk:** L |
**Depends on:** BAI-DEPLOY-12 |
**Blocks:** —

**CONTEXT** — public/robots.txt في main يصرّح Sitemap: واحد فقط (line 147). لكن الإنتاج يخدم robots.txt قديم يحوي 4 سايت ماب. هذا يستهلك crawl budget.

**FILES IN SCOPE** — public/robots.txt (no change — موجود)

**MUST NOT TOUCH / PRESERVE** — Sitemap: declaration

**TASK** — 1) بعد BAI-DEPLOY-12 deploy، robots.txt سيخدم النسخة الجديدة. 2) اختبر: curl /robots.txt | grep -c '^Sitemap:' → 1. 3) curl /robots.txt | grep '^Sitemap:' → sitemap.xml فقط.

**ACCEPTANCE CRITERIA** — 1) curl /robots.txt | grep -c '^Sitemap:' → 1. 2) curl /robots.txt | grep '^Sitemap:' → Sitemap: https://brightai.site/sitemap.xml.

**VERIFICATION COMMANDS**
```bash
curl -s https://brightai.site/robots.txt | grep -c '^Sitemap:'  # 1
curl -s https://brightai.site/robots.txt | grep '^Sitemap:'
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — robots.txt يحوي Sitemap: واحد فقط (sitemap.xml)، مُتحقَّق بـ curl + grep.

---
## PROMPT [ID: BAI-IDX-17] — حذف ازدواج /client/* (منع publish)

**Priority:** P0 |
**Effort:** 1h |
**Impact:** +5% على Indexation |
**Risk:** L |
**Depends on:** BAI-DEPLOY-12 |
**Blocks:** —

**CONTEXT** — /client/index.html يُخدَم في الإنتاج (172KB). يجب منع publish من sync-dist-flat.mjs.

**FILES IN SCOPE** — scripts/sync-dist-flat.mjs (أضف exclude patterns), scripts/verify-deployment-surface.mjs (no change)

**MUST NOT TOUCH / PRESERVE** — sync-dist-flat.mjs logic

**TASK** — 1) في sync-dist-flat.mjs: أضف exclude patterns لـ /client/, /frontend/, /server/, /package.json, /render.yaml, /_headers, /_redirects, /CNAME. 2) اختبر: بعد deploy، curl /client/index.html → 404.

**ACCEPTANCE CRITERIA** — 1) curl /client/index.html → 404. 2) curl /frontend/server.js → 404. 3) curl /server/entry.mjs → 404.

**VERIFICATION COMMANDS**
```bash
curl -s -o /dev/null -w '%{http_code}' https://brightai.site/client/index.html  # 404
curl -s -o /dev/null -w '%{http_code}' https://brightai.site/frontend/server.js  # 404
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — /client/index.html و /frontend/server.js و /server/entry.mjs ترجع 404، مُتحقَّق بـ curl.

---
## PROMPT [ID: BAI-IDX-18] — IndexNow (Bing/Yandex) مفعّل تلقائيًا بعد deploy

**Priority:** P2 |
**Effort:** 2h |
**Impact:** +3% على Indexation |
**Risk:** L |
**Depends on:** BAI-DEPLOY-12 |
**Blocks:** —

**CONTEXT** — scripts/trigger-indexnow.mjs موجود + package.json postbuild:indexnow (line 70). لكن --soft-fail يعني أنه لا يفشل البناء عند الخطأ. يجب تفعيله كـ post-deploy step.

**FILES IN SCOPE** — scripts/trigger-indexnow.mjs (no change — موجود), .github/workflows/deploy.yml (أضف post-deploy step)

**MUST NOT TOUCH / PRESERVE** — indexnow key location

**TASK** — 1) تأكد أن public/.txt موجود (افحص: ll public/*.txt). 2) أضف post-deploy step: 'Run trigger-indexnow.mjs --soft-fail'. 3) اختبر: بعد deploy، Bing Webmaster → IndexNow → يجب أن يظهر آخر submit.

**ACCEPTANCE CRITERIA** — 1) curl /.txt → 200 + key value. 2) Bing Webmaster → URLs submitted > 0.

**VERIFICATION COMMANDS**
```bash
curl -s https://brightai.site/$(grep -oE '[a-z0-9]{32}' public/*.txt | head -1).txt | head -c 50
```

**ROLLBACK** — `احذف post-deploy step من workflow`

**DEFINITION OF DONE** — IndexNow submit يعمل تلقائيًا بعد كل deploy، مُتحقَّق بـ Bing Webmaster UI.

---
## PROMPT [ID: BAI-IDX-19] — اختبار انحدار يمسك hreflang defect بعينه (cheerio)

**Priority:** P1 |
**Effort:** 3h |
**Impact:** +3% على Indexation |
**Risk:** M |
**Depends on:** BAI-IDX-13 |
**Blocks:** —

**CONTEXT** — hreflang defect على /en/ ظهر لأنه لم يكن هناك اختبار آلي. يجب اختبار يجمع HTML من الإنتاج ويفحص hreflang patterns.

**FILES IN SCOPE** — scripts/hreflang-bidirectional-audit.mjs (no change — موجود), package.json seo:hreflang (no change)

**MUST NOT TOUCH / PRESERVE** — existing hreflang audit logic

**TASK** — 1) حدّث scripts/hreflang-bidirectional-audit.mjs ليفحص: (a) كل صفحة لها self hreflang. (b) كل صفحة لها return link للصفحة الأخرى. (c) x-default لا يشير إلى /en/. 2) أضف CLI flag --live ليفحص الإنتاج. 3) شغّل في CI.

**ACCEPTANCE CRITERIA** — 1) node scripts/hreflang-bidirectional-audit.mjs --live → 0 violations. 2) curl /en/ | grep 'hreflang="en-SA"' → self موجود.

**VERIFICATION COMMANDS**
```bash
node scripts/hreflang-bidirectional-audit.mjs --live
node scripts/hreflang-bidirectional-audit.mjs
```

**ROLLBACK** — `أزل --live flag`

**DEFINITION OF DONE** — hreflang-bidirectional-audit.mjs --live يفحص الإنتاج ويفشل عند defect، مُتحقَّق بـ node.

---
## PROMPT [ID: BAI-IDX-20] — خط أساس فهرسة موثّق (GSC export أسبوعي)

**Priority:** P1 |
**Effort:** 4h |
**Impact:** +5% على Indexation |
**Risk:** M |
**Depends on:** — |
**Blocks:** —

**CONTEXT** — GSC export يدوي. يجب أتمتة أسبوعية لتتبّع تقدّم الفهرسة.

**FILES IN SCOPE** — scripts/gsc-export.mjs (جديد), .github/workflows/weekly-gsc.yml (جديد), report/gsc/ (جديد)

**MUST NOT TOUCH / PRESERVE** — —

**TASK** — 1) أنشئ scripts/gsc-export.mjs يستدعي GSC API (يتطلب service account JSON). 2) يوم الأحد 6am UTC: شغّل السكربت. 3) اكتب الناتج إلى report/gsc/YYYY-MM-DD.json. 4) قارن بالأسبوع السابق.

**ACCEPTANCE CRITERIA** — 1) report/gsc/ يحوي ملف JSON لكل أسبوع. 2) GitHub Actions workflow يعمل أسبوعيًا. 3) كل ملف يحوي: indexed count, not_indexed count, crawled_not_indexed URLs.

**VERIFICATION COMMANDS**
```bash
ls report/gsc/ | wc -l  # > 0 بعد أسبوع
cat report/gsc/$(date -I -d 'last sunday').json | jq '.indexed'
```

**ROLLBACK** — `احذف workflow`

**DEFINITION OF DONE** — report/gsc/ يحوي JSON لكل أسبوع، مُتحقَّق بـ ls + jq.

---
## PROMPT [ID: BAI-IDX-21] — تصفير سلاسل redirect (إصلاح /blog no-slash → 301)

**Priority:** P1 |
**Effort:** 2h |
**Impact:** +3% على Indexation |
**Risk:** M |
**Depends on:** BAI-IDX-12 |
**Blocks:** —

**CONTEXT** — GSC يُظهر 7 صفحات 'Redirect error'. هذه سلاسل redirects طويلة (3+ hops) لا يتبعها Googlebot.

**FILES IN SCOPE** — scripts/check-redirect-destinations.mjs (no change — موجود), public/_redirects (no change — documentation only)

**MUST NOT TOUCH / PRESERVE** — existing redirect chain logic

**TASK** — 1) شغّل scripts/check-redirect-destinations.mjs على كل URLs في sitemap. 2) احصر كل redirect chain > 2 hops. 3) اطبّق 301 مباشر بدل التسلسل. 4) اختبر: curl -IL /old-path → final URL في ≤ 2 hops.

**ACCEPTANCE CRITERIA** — 1) scripts/check-redirect-destinations.mjs يخرج 0 chains > 2. 2) GSC: 0 'Redirect error' بعد أسبوع.

**VERIFICATION COMMANDS**
```bash
node scripts/check-redirect-destinations.mjs
curl -sIL https://brightai.site/ | grep -E '^(HTTP|Location)'
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — 0 redirect chains > 2 hops، مُتحقَّق بـ curl -IL + GSC.

---
## PROMPT [ID: BAI-IDX-22] — إصلاح الصفحات اليتيمة (orphan pages)

**Priority:** P1 |
**Effort:** 4h |
**Impact:** +5% على Indexation |
**Risk:** M |
**Depends on:** BAI-DEPLOY-12 |
**Blocks:** —

**CONTEXT** — scripts/qa/orphan-pages-audit.mjs موجود لكن غير مفعّل. صفحات يتيمة = في sitemap لكن بدون روابط داخلية.

**FILES IN SCOPE** — scripts/qa/orphan-pages-audit.mjs (no change — موجود), package.json internal-links:audit (no change)

**MUST NOT TOUCH / PRESERVE** — existing orphan detection logic

**TASK** — 1) شغّل pnpm run internal-links:audit. 2) احصر كل orphan pages. 3) لكل orphan: أضف رابط من footer أو احذف الصفحة. 4) اختبر: بعد deploy، scripts/qa/orphan-pages-audit.mjs → 0 orphans.

**ACCEPTANCE CRITERIA** — 1) node scripts/qa/orphan-pages-audit.mjs → 0 orphans. 2) كل صفحة في sitemap لها ≥ 2 روابط داخلية واردة.

**VERIFICATION COMMANDS**
```bash
node scripts/qa/orphan-pages-audit.mjs --strict
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — 0 orphan pages في dist/client/، مُتحقَّق بـ orphan-pages-audit.mjs.

---

---

# BAI-LINK — Internal Linking

## PROMPT [ID: BAI-LINK-01] — هيكل hub-and-spoke (الرئيسية hub، /blog/ و/solutions/ و/docs/ spokes)

**Priority:** P1 |
**Effort:** 8h |
**Impact:** +5% على Indexation |
**Risk:** M |
**Depends on:** BAI-IDX-22 |
**Blocks:** —

**CONTEXT** — الموقع حاليًا flat: 180 صفحة بلا هرمية واضحة. hub-and-spoke يربط الرئيسية بـ 3 spokes رئيسية، كل spoke يربط بصفحاته الفرعية.

**FILES IN SCOPE** — src/pages/index.astro (أضف 'Explore more' section), src/pages/blog/index.astro, src/pages/solutions/index.astro, src/pages/docs/index.astro

**MUST NOT TOUCH / PRESERVE** — existing navigation structure

**TASK** — 1) أضف 'Explore more' section في أسفل index.astro بـ 3 cards (Blog, Solutions, Docs). 2) في كل spoke index: أضف 'Back to home' + 'Related' sections. 3) في كل صفحة فرعية: أضف breadcrumb + 'Back to '.

**ACCEPTANCE CRITERIA** — 1) curl / | grep 'Explore more' → موجود. 2) curl /blog/ | grep 'Back to home' → موجود. 3) كل صفحة فرعية لها breadcrumb.

**VERIFICATION COMMANDS**
```bash
curl -s https://brightai.site/ | grep -c 'Explore more'
curl -s https://brightai.site/blog/ | grep -c 'Back to home'
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — هيكل hub-and-spoke موجود (3 cards على الرئيسية + back links على spokes)، مُتحقَّق بـ curl + grep.

---
## PROMPT [ID: BAI-LINK-02] — إنهاء الصفحات اليتيمة (ربط من footer أو حذف)

**Priority:** P1 |
**Effort:** 4h |
**Impact:** +3% على Indexation |
**Risk:** M |
**Depends on:** BAI-IDX-22 |
**Blocks:** —

**CONTEXT** — بعد BAI-IDX-22، قائمة اليتيمة محدودة. لكل صفحة: ربط من footer أو حذف.

**FILES IN SCOPE** — src/components/Footer.astro, src/pages/* (احذف اليتيمة غير الضرورية)

**MUST NOT TOUCH / PRESERVE** — footer structure

**TASK** — 1) لكل orphan page: أضف رابط في footer أو احذف الصفحة. 2) اختبر: scripts/qa/orphan-pages-audit.mjs → 0 orphans.

**ACCEPTANCE CRITERIA** — 1) node scripts/qa/orphan-pages-audit.mjs → 0. 2) كل صفحة في sitemap لها ≥ 2 روابط داخلية.

**VERIFICATION COMMANDS**
```bash
node scripts/qa/orphan-pages-audit.mjs
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — 0 orphan pages، مُتحقَّق بـ orphan-pages-audit.mjs.

---
## PROMPT [ID: BAI-LINK-03] — breadcrumbs + schema على كل صفحة

**Priority:** P1 |
**Effort:** 6h |
**Impact:** +5% على Indexation |
**Risk:** M |
**Depends on:** BAI-LINK-01 |
**Blocks:** —

**CONTEXT** — src/components/Breadcrumbs.astro موجود لكن غير مستخدم على كل صفحة. Schema.org BreadcrumbList مطلوب.

**FILES IN SCOPE** — src/components/Breadcrumbs.astro, src/layouts/BaseLayout.astro (أضف breadcrumb slot), src/components/seo/Schema.astro (أضف BreadcrumbList)

**MUST NOT TOUCH / PRESERVE** — existing Breadcrumbs component

**TASK** — 1) في BaseLayout.astro: أضف  فوق h1. 2) لكل صفحة: أضف . 3) في Schema.astro: أضف BreadcrumbList JSON-LD. 4) اختبر: schema.org validator.

**ACCEPTANCE CRITERIA** — 1) curl /blog// | grep 'BreadcrumbList' → موجود. 2) curl /solutions// | grep 'BreadcrumbList' → موجود. 3) schema.org/validator → 0 errors.

**VERIFICATION COMMANDS**
```bash
curl -s https://brightai.site/blog/sdaia-generative-ai-guidelines-practical-compliance/ | grep -c 'BreadcrumbList'
curl -s https://brightai.site/solutions/ai-firewall/ | grep -c 'BreadcrumbList'
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — BreadcrumbList schema على كل صفحة (ما عدا الرئيسية)، مُتحقَّق بـ curl + grep.

---
## PROMPT [ID: BAI-LINK-04] — anchor عربي متنوع (تجنب 'اقرأ المزيد' المتكرر)

**Priority:** P2 |
**Effort:** 4h |
**Impact:** +2% على Indexation |
**Risk:** L |
**Depends on:** BAI-LINK-01 |
**Blocks:** —

**CONTEXT** — 'اقرأ المزيد' مكرر في 20+ مكان — يقلل قيمة anchor text لـ SEO.

**FILES IN SCOPE** — src/pages/blog/index.astro, src/pages/solutions/index.astro, src/components/RelatedPosts.astro, src/components/RelatedLinks.astro

**MUST NOT TOUCH / PRESERVE** — —

**TASK** — 1) استبدل 'اقرأ المزيد' بـ anchors وصفية: 'اقرأ دليل SDAIA الكامل' / 'تعرّف على ضوابط ECC' / 'كيف نطبّق PDPL'. 2) كل anchor يجب أن يصف الصفحة الهدف. 3) اختبر: grep 'اقرأ المزيد' src/ → ≤ 5 نتائج.

**ACCEPTANCE CRITERIA** — 1) grep -r 'اقرأ المزيد' src/ | wc -l → ≤ 5. 2) كل anchor وصفية.

**VERIFICATION COMMANDS**
```bash
grep -rn 'اقرأ المزيد' src/ | wc -l
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — ≤ 5 occurrences لـ 'اقرأ المزيد' في src/، مُتحقَّق بـ grep.

---
## PROMPT [ID: BAI-LINK-05] — cross-links بين /blog/* و /solutions/* (hub-and-spoke vertical)

**Priority:** P1 |
**Effort:** 4h |
**Impact:** +3% على Indexation |
**Risk:** M |
**Depends on:** BAI-LINK-01 |
**Blocks:** —

**CONTEXT** — كل blog post يجب أن يربط لـ solution ذات صلة، وكل solution يجب أن يربط لـ blog posts ذات صلة.

**FILES IN SCOPE** — src/pages/blog/[...slug].astro (أضف RelatedSolutions), src/pages/solutions/[slug].astro (أضف RelatedBlogPosts), src/data/cross-links.ts (جديد)

**MUST NOT TOUCH / PRESERVE** — —

**TASK** — 1) أنشئ src/data/cross-links.ts يحوي خريطة blog_post ↔ solution. 2) في blog/[...slug].astro: أضف 'حلول ذات صلة' section. 3) في solutions/[slug].astro: أضف 'مقالات ذات صلة' section. 4) اختبر: curl /blog/sdaia-guidelines/ | grep 'حلول ذات صلة'.

**ACCEPTANCE CRITERIA** — 1) curl /blog/sdaia-generative-ai-guidelines-practical-compliance/ | grep 'حلول ذات صلة' → موجود. 2) curl /solutions/ai-firewall/ | grep 'مقالات ذات صلة' → موجود.

**VERIFICATION COMMANDS**
```bash
curl -s https://brightai.site/blog/sdaia-generative-ai-guidelines-practical-compliance/ | grep -c 'حلول ذات صلة'
curl -s https://brightai.site/solutions/ai-firewall/ | grep -c 'مقالات ذات صلة'
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — cross-links بين blog و solutions موجود على كل صفحة، مُتحقَّق بـ curl + grep.

---
## PROMPT [ID: BAI-LINK-06] — internal link audit CI gate (linkinator)

**Priority:** P1 |
**Effort:** 2h |
**Impact:** +2% على Indexation |
**Risk:** L |
**Depends on:** BAI-LINK-02 |
**Blocks:** —

**CONTEXT** — package.json links:dist (line 97) موجود لكن غير مفعّل في CI.

**FILES IN SCOPE** — .github/workflows/ci-build-guard.yml (أضف links:dist step), package.json links:dist (no change)

**MUST NOT TOUCH / PRESERVE** — existing linkinator config

**TASK** — 1) أضف step في CI: 'pnpm run links:dist'. 2) اجعله required check. 3) اختبر: بعد commit، CI يعمل linkinator ويفشل عند broken links.

**ACCEPTANCE CRITERIA** — 1) CI workflow يحوي 'links:dist' step. 2) linkator reports 0 broken internal links.

**VERIFICATION COMMANDS**
```bash
pnpm run links:dist 2>&1 | tail -10
```

**ROLLBACK** — `احذف step من CI`

**DEFINITION OF DONE** — linkinator يفحص dist/ ويفشل CI عند broken internal links، مُتحقَّق بـ CI UI.

---

---

# BAI-CONTENT — Content Quality

## PROMPT [ID: BAI-CONTENT-01] — إعادة كتابة 10 مقالات blog الأعلى مشاهدةً (1500+ كلمة)

**Priority:** P1 |
**Effort:** 40h |
**Impact:** +15% على Indexation |
**Risk:** M |
**Depends on:** BAI-DEPLOY-12 |
**Blocks:** —

**CONTEXT** — GA4 top 10 pages:BrightAI | منصة حوكمة (43 view, 84% bounce) + 404 (38 view) + الرئيسية (35 view) + PDPL (23 view) + solutions (21 view) + Saudi AI Safety OS (21 view) + chat (15 view) + Kernel (13 view) + about (12 view, 87.5% bounce) + pricing (11 view, 78% bounce). متوسط الكلمات الحالي ~600، المطلوب 1500+.

**FILES IN SCOPE** — src/content/blog/*.md (10 مقالات), src/pages/blog/[...slug].astro (no change)

**MUST NOT TOUCH / PRESERVE** — canonical URLs، titles الحالية

**TASK** — 1) لكل مقال: حدّد الكلمة المستهدفة (من report/semrush/). 2) اكتب 1500+ كلمة بنية: مقدمة (200), مشكلة (300), حل (500), حالة سعودية (300), FAQ (200). 3) أضف author byline (BAI-CONTENT-08). 4) أضف schema Article. 5) أضف cross-links لـ solutions. 6) أضف breadcrumb. 7) اختبر: curl /blog// | wc -w → > 1500.

**ACCEPTANCE CRITERIA** — 1) لكل مقال: curl /blog// | wc -w → > 1500. 2) GSC بعد 30 يوم: impressions +50%.

**VERIFICATION COMMANDS**
```bash
for slug in sdaia-generative-ai-guidelines-practical-compliance pdpl-compliance-guide-saudi-companies nca-ecc-ai-controls-guide iso-42001-saudi-implementation-guide; do
  echo "$slug: $(curl -s https://brightai.site/blog/$slug/ | wc -w) words"
done
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — 10 مقالات blog تحوي 1500+ كلمة، مُتحقَّق بـ curl + wc -w.

---
## PROMPT [ID: BAI-CONTENT-02] — دمج /customers/* (3 صفحات قوالب → 1 صفحة بحالات حقيقية)

**Priority:** P1 |
**Effort:** 4h |
**Impact:** +5% على Indexation |
**Risk:** M |
**Depends on:** BAI-DEPLOY-12 |
**Blocks:** —

**CONTEXT** — /customers/bank/, /customers/hospital/, /customers/pharma/ — 3 صفحات بدون أسماء عملاء، GA4: 0-2 views لكل صفحة. near-duplicate content. الخيار: احذف أو وثّق بـ 3 حالات حقيقية.

**FILES IN SCOPE** — src/pages/customers/bank/index.astro, src/pages/customers/hospital/index.astro, src/pages/customers/pharma/index.astro, src/pages/customers/index.astro

**MUST NOT TOUCH / PRESERVE** — existing URL structure

**TASK** — خيار 1 (احذف): احذف الـ 4 صفحات + أضف noindex. خيار 2 (وثّق): لكل صفحة، أضف: اسم العميل (حتّى لو anonymous 'leading Saudi bank')، شعار، تحدّي، حل BrightAI، نتيجة كمية، اقتباس. اختيار: خيار 1 لو لا توجد حالات حقيقية. خيار 2 لو المؤسس يوفّر تفاصيل.

**ACCEPTANCE CRITERIA** — 1) curl /customers/bank/ → إما 404 (محذوف) أو يحوي 'case study' + quantitative results. 2) GA4 بعد 30 يوم: 0 views على /customers/ (لو محذوف) أو 5+ views (لو موثّق).

**VERIFICATION COMMANDS**
```bash
curl -s -o /dev/null -w '%{http_code}' https://brightai.site/customers/bank/
curl -s https://brightai.site/customers/bank/ | grep -c 'case study'
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — /customers/* إما محذوف (404) أو موثّق بأرقام + شعار، مُتحقَّق بـ curl + grep.

---
## PROMPT [ID: BAI-CONTENT-03] — إعادة كتابة العناوين والأوصاف بنية سعودية

**Priority:** P1 |
**Effort:** 8h |
**Impact:** +5% على Indexation |
**Risk:** M |
**Depends on:** BAI-DEPLOY-12 |
**Blocks:** —

**CONTEXT** — العناوين الحالية جيدة لكن الأوصاف (meta description) قصيرة وبدون نية سعودية واضحة.

**FILES IN SCOPE** — src/pages/*.astro (لكل صفحة: title + description), src/content/blog/*.md (frontmatter)

**MUST NOT TOUCH / PRESERVE** — canonical URLs، titles الحالية

**TASK** — 1) لكل صفحة: اكتب title 50-60 chars يحوي كلمة سعودية (PDPL, NCA, SDAIA, السعودية). 2) اكتب description 150-160 chars تحوي CTA + benefit + keyword. 3) اختبر: curl / | grep '' → 50-60 chars. 4) curl / | grep '<meta name="description"' → 150-160 chars.

**ACCEPTANCE CRITERIA** — 1) لكل صفحة: title 50-60 chars، description 150-160 chars. 2) GSC بعد 30 يوم: CTR +20%.

**VERIFICATION COMMANDS**
```bash
curl -s https://brightai.site/ | grep -oE '[^' | head -c 70
curl -s https://brightai.site/ | grep -oE '<meta name="description" content="[^"]+"' | head -c 180
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — كل صفحة تحوي title 50-60 + description 150-160 chars، مُتحقَّق بـ curl + grep.

---
## PROMPT [ID: BAI-CONTENT-04] — عناقيد مواضيعية: PDPL cluster (8 articles + 1 pillar)

**Priority:** P2 |
**Effort:** 16h |
**Impact:** +8% على Indexation |
**Risk:** M |
**Depends on:** BAI-CONTENT-01 |
**Blocks:** —

**CONTEXT** — PDPL cluster حاليًا: /pdpl-statement/ (23 view) + /blog/pdpl-compliance-guide-saudi-companies/ + few others. يجب تنظيمها كـ pillar + cluster articles.

**FILES IN SCOPE** — src/pages/pdpl-statement/index.astro (pillar), src/content/blog/pdpl-*.md (8 articles), src/data/cross-links.ts

**MUST NOT TOUCH / PRESERVE** — existing PDPL content

**TASK** — 1) حدّث /pdpl-statement/ كـ pillar page: يحوي 3000+ كلمة + links لـ 8 cluster articles. 2) لكل cluster article: اكتب 1500+ كلمة على جانب فرعي من PDPL. 3) أضف cross-links bidirectional. 4) أضف schema Article + BreadcrumbList. 5) اختبر: curl /pdpl-statement/ | grep -c '/blog/pdpl-' → 8.

**ACCEPTANCE CRITERIA** — 1) curl /pdpl-statement/ | wc -w → > 3000. 2) curl /pdpl-statement/ | grep -c '/blog/pdpl-' → 8. 3) كل cluster article يربط لـ pillar.

**VERIFICATION COMMANDS**
```bash
curl -s https://brightai.site/pdpl-statement/ | wc -w
curl -s https://brightai.site/pdpl-statement/ | grep -c '/blog/pdpl-'
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — PDPL pillar page يحوي 3000+ كلمة + 8 cluster articles cross-linked، مُتحقَّق بـ curl + grep.

---
## PROMPT [ID: BAI-CONTENT-05] — عناقيد مواضيعية: NCA ECC cluster (8 articles + 1 pillar)

**Priority:** P2 |
**Effort:** 16h |
**Impact:** +8% على Indexation |
**Risk:** M |
**Depends on:** BAI-CONTENT-01 |
**Blocks:** —

**CONTEXT** — NCA ECC cluster حاليًا: /blog/nca-ecc-ai-controls-guide/ + few others. يجب تنظيمها.

**FILES IN SCOPE** — src/pages/solutions/government-ai-governance/index.astro (pillar candidate), src/content/blog/nca-ecc-*.md (8 articles)

**MUST NOT TOUCH / PRESERVE** — existing NCA content

**TASK** — مثل BAI-CONTENT-04 لكن لـ NCA ECC. Pillar = /solutions/government-ai-governance/ (3000+ كلمة + 8 cluster articles).

**ACCEPTANCE CRITERIA** — 1) curl /solutions/government-ai-governance/ | wc -w → > 3000. 2) curl /solutions/government-ai-governance/ | grep -c '/blog/nca-ecc-' → 8.

**VERIFICATION COMMANDS**
```bash
curl -s https://brightai.site/solutions/government-ai-governance/ | wc -w
curl -s https://brightai.site/solutions/government-ai-governance/ | grep -c '/blog/nca-ecc-'
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — NCA ECC pillar page يحوي 3000+ كلمة + 8 cluster articles، مُتحقَّق بـ curl + grep.

---
## PROMPT [ID: BAI-CONTENT-06] — عناقيد مواضيعية: SDAIA cluster (8 articles + 1 pillar)

**Priority:** P2 |
**Effort:** 16h |
**Impact:** +8% على Indexation |
**Risk:** M |
**Depends on:** BAI-CONTENT-01 |
**Blocks:** —

**CONTEXT** — SDAIA cluster حاليًا: /blog/sdaia-generative-ai-guidelines-practical-compliance/ (15 view, 40% bounce — أفضل صفحة).

**FILES IN SCOPE** — src/pages/solutions/government-ai-governance/index.astro (pillar), src/content/blog/sdaia-*.md (8 articles)

**MUST NOT TOUCH / PRESERVE** — existing SDAIA content

**TASK** — مثل BAI-CONTENT-04 لكن لـ SDAIA. Pillar = /solutions/government-ai-governance/ أو صفحة سدايا مستقلة.

**ACCEPTANCE CRITERIA** — 1) كل SDAIA article 1500+ كلمة. 2) pillar يربط لـ 8 articles. 3) GSC بعد 90 يوم: 5 articles في top 20 لـ 'sdaia' keywords.

**VERIFICATION COMMANDS**
```bash
curl -s https://brightai.site/blog/sdaia-generative-ai-guidelines-practical-compliance/ | wc -w
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — SDAIA cluster يحوي 8 articles 1500+ كلمة + pillar، مُتحقَّق بـ curl + wc.

---
## PROMPT [ID: BAI-CONTENT-07] — عناقيد مواضيعية: ISO 42001 cluster (8 articles + 1 pillar)

**Priority:** P2 |
**Effort:** 16h |
**Impact:** +8% على Indexation |
**Risk:** M |
**Depends on:** BAI-CONTENT-01 |
**Blocks:** —

**CONTEXT** — ISO 42001 cluster حاليًا: /blog/iso-42001-saudi-implementation-guide/.

**FILES IN SCOPE** — src/pages/services/index.astro (pillar candidate), src/content/blog/iso-42001-*.md (8 articles)

**MUST NOT TOUCH / PRESERVE** — existing ISO 42001 content

**TASK** — مثل BAI-CONTENT-04 لكن لـ ISO 42001. Pillar = /services/ أو صفحة ISO مستقلة.

**ACCEPTANCE CRITERIA** — 1) كل ISO 42001 article 1500+ كلمة. 2) pillar يربط لـ 8 articles. 3) GSC بعد 90 يوم: 5 articles في top 20 لـ 'ISO 42001 Saudi'.

**VERIFICATION COMMANDS**
```bash
curl -s https://brightai.site/blog/iso-42001-saudi-implementation-guide/ | wc -w
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — ISO 42001 cluster يحوي 8 articles 1500+ كلمة + pillar، مُتحقَّق بـ curl + wc.

---
## PROMPT [ID: BAI-CONTENT-08] — مؤلفون حقيقيون بأسماء كاملة (الي: 'يزيد الشريف' بدل 'يزيد')

**Priority:** P0 |
**Effort:** 2h |
**Impact:** +5% على E-E-A-T |
**Risk:** L |
**Depends on:** BAI-DEPLOY-12 |
**Blocks:** —

**CONTEXT** — src/data/schema-helpers.ts:68 → name: 'يزيد' (اسم أول فقط). /authors/ يحوي 4 صفحات، اسم واحد فقط كامل (yazeed-alshareef).

**FILES IN SCOPE** — src/data/schema-helpers.ts (line 68), src/pages/authors/*.astro, src/content/blog/*.md (frontmatter author)

**MUST NOT TOUCH / PRESERVE** — existing author structure

**TASK** — 1) في schema-helpers.ts:68: غيّر name: 'يزيد' → name: 'يزيد الشريف' + أضف familyName: 'الشريف'. 2) أضف image field (URL لصورة المؤسس). 3) أضف description field (سيرة ذاتية مختصرة 100-200 كلمة). 4) في كل blog frontmatter: حدّث author لـ 'yazeed-alshareef'. 5) أضف نفس المؤلف لـ /authors/yazeed-alshareef/. 6) اختبر: schema.org/validator.

**ACCEPTANCE CRITERIA** — 1) curl / | grep -oE '"name":"[^"]+"' | head -3 → يحوي 'يزيد الشريف'. 2) schema.org validator → familyName + image + description موجودون.

**VERIFICATION COMMANDS**
```bash
curl -s https://brightai.site/ | grep -oE '"name":"[^"]+"' | head -5
curl -s https://brightai.site/authors/yazeed-alshareef/ | grep -c 'يزيد الشريف'
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — schema.org founder.name = 'يزيد الشريف' + familyName + image + description، مُتحقَّق بـ curl + schema validator.

---

---

# BAI-SCHEMA — Schema.org

## PROMPT [ID: BAI-SCHEMA-01] — تنظيف @graph في JSON-LD على /

**Priority:** P1 |
**Effort:** 2h |
**Impact:** +3% على Indexation |
**Risk:** L |
**Depends on:** BAI-DEPLOY-12 |
**Blocks:** —

**CONTEXT** — src/pages/index.astro يحوي JSON-LD بـ @graph يحوي Organization + WebSite + LocalBusiness + Person (founder 'يزيد' فقط بالاسم الأول).

**FILES IN SCOPE** — src/pages/index.astro (JSON-LD block), src/data/schema-helpers.ts (no change)

**MUST NOT TOUCH / PRESERVE** — existing @graph structure

**TASK** — 1) احذف التكرار بين Organization في FoundationSchema و Organization في index.astro @graph. 2) أضف familyName + image لـ founder. 3) تأكد كل @id فريد. 4) اختبر: schema.org/validator → 0 warnings.

**ACCEPTANCE CRITERIA** — 1) curl / | grep -c 'schema.org' → JSON-LD موجود. 2) schema.org/validator → 0 errors. 3) curl / | python3 -c 'import json,sys,re; html=sys.stdin.read(); m=re.search(r"(.*?)", html, re.S); print(json.loads(m.group(1)) if m else "no schema")' → valid JSON.

**VERIFICATION COMMANDS**
```bash
curl -s https://brightai.site/ | grep -c 'application/ld+json'
curl -s https://brightai.site/ | grep -oE '"name":"[^"]+"' | head -10
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — schema.org @graph على / نظيف (0 warnings) + founder.name كامل، مُتحقَّق بـ curl + schema validator.

---
## PROMPT [ID: BAI-SCHEMA-02] — فحص وإصلاح كل sameAs (6 روابط)

**Priority:** P0 |
**Effort:** 1h |
**Impact:** +5% على E-E-A-T |
**Risk:** M |
**Depends on:** BAI-DEPLOY-12 |
**Blocks:** —

**CONTEXT** — src/data/schema-helpers.ts:113-120 يحوي 6 روابط sameAs. يجب فحص كل واحد بـ curl: linkedin.com/company/brightai-site, x.com/BrightAISite, youtube.com/@BrightAiSaudi, tiktok.com/@bright1ai, github.com/YEEEAE/BRIGHTAI, crunchbase.com/organization/brightai.

**FILES IN SCOPE** — src/data/schema-helpers.ts (lines 113-120)

**MUST NOT TOUCH / PRESERVE** — existing sameAs array

**TASK** — 1) لكل رابط: curl -I للتحقق 200 (توقّع: 401/403 لـ LinkedIn/X لكن URL صالح). 2) احذف أي رابط 404 أو غير رسمي. 3) أضف روابط جديدة حقيقية (GitHub README، Crunchbase profile). 4) اختبر: schema.org/validator.

**ACCEPTANCE CRITERIA** — 1) كل sameAs رابط يعود 200 (أو 403 للـ LinkedIn/X الحقيقيين). 2) لا روابط 404. 3) schema.org/validator → 0 warnings على sameAs.

**VERIFICATION COMMANDS**
```bash
for url in 'https://linkedin.com/company/brightai-site' 'https://x.com/BrightAISite' 'https://www.youtube.com/@BrightAiSaudi' 'https://www.tiktok.com/@bright1ai' 'https://github.com/YEEEAE/BRIGHTAI' 'https://crunchbase.com/organization/brightai'; do
  echo "$url → $(curl -sI -L -o /dev/null -w '%{http_code}' $url)"
done
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — كل sameAs روابط حيّة (0 404s)، مُتحقَّق بـ curl loop.

---
## PROMPT [ID: BAI-SCHEMA-03] — Article schema على كل blog post

**Priority:** P1 |
**Effort:** 4h |
**Impact:** +5% على Indexation |
**Risk:** M |
**Depends on:** BAI-CONTENT-01 |
**Blocks:** —

**CONTEXT** — src/pages/blog/[...slug].astro يجب أن يحوي Article JSON-LD لكل blog post.

**FILES IN SCOPE** — src/pages/blog/[...slug].astro (أضف Article JSON-LD), src/data/schema-helpers.ts (helper)

**MUST NOT TOUCH / PRESERVE** — existing blog schema

**TASK** — 1) في blog/[...slug].astro: أضف Article JSON-LD يحوي: @type=Article, headline, author (Person with @id), datePublished, dateModified, image, publisher (@id to Organization). 2) أضف speakable schema للفقرة الافتتاحية. 3) اختبر: schema.org/validator على /blog/sdaia-guidelines/.

**ACCEPTANCE CRITERIA** — 1) curl /blog/sdaia-generative-ai-guidelines-practical-compliance/ | grep -c 'Article' → 1+. 2) schema.org/validator → 0 errors.

**VERIFICATION COMMANDS**
```bash
curl -s https://brightai.site/blog/sdaia-generative-ai-guidelines-practical-compliance/ | grep -c '"@type":"Article"
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — Article JSON-LD على كل blog post، مُتحقَّق بـ curl + grep + schema validator.

---
## PROMPT [ID: BAI-SCHEMA-04] — FAQ schema على كل صفحة بها FAQ

**Priority:** P1 |
**Effort:** 2h |
**Impact:** +3% على Indexation |
**Risk:** L |
**Depends on:** BAI-DEPLOY-12 |
**Blocks:** —

**CONTEXT** — src/pages/index.astro يحوي FAQPage JSON-LD (line 77-88). لكن /pricing/ و /kernel/ قد تحوي FAQs بدون schema.

**FILES IN SCOPE** — src/pages/pricing/index.astro, src/pages/kernel/index.astro, src/pages/contact/index.astro (FAQ sections)

**MUST NOT TOUCH / PRESERVE** — existing FAQPage schema على /

**TASK** — 1) لكل صفحة فيها FAQ: أضف FAQPage JSON-LD. 2) تأكد كل Question تحوي acceptedAnswer. 3) اختبر: schema.org/validator.

**ACCEPTANCE CRITERIA** — 1) curl /pricing/ | grep -c 'FAQPage' → 1+. 2) curl /kernel/ | grep -c 'FAQPage' → 1+. 3) schema.org/validator → 0 errors.

**VERIFICATION COMMANDS**
```bash
curl -s https://brightai.site/pricing/ | grep -c 'FAQPage'
curl -s https://brightai.site/kernel/ | grep -c 'FAQPage'
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — FAQPage schema على كل صفحة فيها FAQ، مُتحقَّق بـ curl + grep.

---
## PROMPT [ID: BAI-SCHEMA-05] — Service schema على كل /solutions/* و /kernel/*

**Priority:** P1 |
**Effort:** 4h |
**Impact:** +5% على Indexation |
**Risk:** M |
**Depends on:** BAI-DEPLOY-12 |
**Blocks:** —

**CONTEXT** — src/pages/solutions/[slug].astro و src/pages/kernel/[slug].astro يجب أن تحوي Service schema.

**FILES IN SCOPE** — src/pages/solutions/[slug].astro, src/pages/kernel/[slug].astro, src/data/schema-helpers.ts (helper)

**MUST NOT TOUCH / PRESERVE** — existing solution/kernel schema

**TASK** — 1) لكل صفحة: أضف Service JSON-LD يحوي: @type=Service, serviceType, provider (@id to Organization), areaServed (SA), offers. 2) اختبر: schema.org/validator.

**ACCEPTANCE CRITERIA** — 1) curl /solutions/ai-firewall/ | grep -c 'Service' → 1+. 2) curl /kernel/chat/ | grep -c 'Service' → 1+.

**VERIFICATION COMMANDS**
```bash
curl -s https://brightai.site/solutions/ai-firewall/ | grep -c '"@type":"Service'
curl -s https://brightai.site/kernel/chat/ | grep -c '"@type":"Service'
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — Service schema على كل /solutions/* و /kernel/*، مُتحقَّق بـ curl + grep.

---

---

# BAI-DESIGN — Design/UX

## PROMPT [ID: BAI-DESIGN-01] — توكنز موحّدة (أنشئ src/styles/tokens.css بمصدر واحد)

**Priority:** P1 |
**Effort:** 8h |
**Impact:** +5% على Design |
**Risk:** M |
**Depends on:** BAI-DEPLOY-12 |
**Blocks:** —

**CONTEXT** — rgba(255,255,255,0.1) مكرر في 3 مواضع (src/styles/pages.css:3512, src/styles/utilities.css:386, src/styles/utilities.css:417). أرقام سحرية مثل padding: 24px بدل var(--space-md).

**FILES IN SCOPE** — src/styles/tokens.css (no change — موجود)، لكن أضف lint rule يمنع raw hex/raw px

**MUST NOT TOUCH / PRESERVE** — existing token values

**TASK** — 1) أنشئ scripts/lint-tokens.mjs يفحص CSS و Astro لـ raw hex (#xxxxxx) و raw px خارج var(). 2) أضفه كـ CI step. 3) استبدل raw values بـ tokens في 3 مواضع.pages.css:3512, utilities.css:386, utilities.css:417. 4) استبدل padding: 24px بـ var(--space-6).

**ACCEPTANCE CRITERIA** — 1) node scripts/lint-tokens.mjs → 0 violations. 2) grep -rn 'rgba(255,255,255,0.1)' src/ → ≤ 1 (in tokens.css).

**VERIFICATION COMMANDS**
```bash
node scripts/lint-tokens.mjs
grep -rn 'rgba(255,255,255,0.1)' src/ | wc -l  # ≤ 1
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — 0 raw hex/raw px في src/styles/*.css خارج tokens.css، مُتحقَّق بـ lint-tokens.mjs.

---
## PROMPT [ID: BAI-DESIGN-02] — تباين AA (رفع rgba(255,255,255,0.4) إلى #94a3b8)

**Priority:** P1 |
**Effort:** 4h |
**Impact:** +5% على Design |
**Risk:** L |
**Depends on:** BAI-DEPLOY-12 |
**Blocks:** —

**CONTEXT** — rgba(255,255,255,0.4) = 3.8:1 على bg-base: #060914 — مكسور AA. المواضع: src/components/LeadForm.astro, src/components/SplitHero.astro, + مواضع أخرى.

**FILES IN SCOPE** — src/components/LeadForm.astro, src/components/SplitHero.astro, src/styles/*.css (ابحث عن rgba(255,255,255,0.4))

**MUST NOT TOUCH / PRESERVE** — existing rgba values

**TASK** — 1) grep -rn 'rgba(255,255,255,0.4)' src/ → احصر كل المواضع. 2) استبدل كل واحد بـ var(--text-secondary) = #94a3b8 (6.8:1 PASS AA + AAA). 3) اختبر: axe scan على / و /pricing/.

**ACCEPTANCE CRITERIA** — 1) grep -rn 'rgba(255,255,255,0.4)' src/ | wc -l → 0. 2) axe scan → 0 contrast violations.

**VERIFICATION COMMANDS**
```bash
grep -rn 'rgba(255,255,255,0.4)' src/ | wc -l  # 0
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — 0 occurrences لـ rgba(255,255,255,0.4) في src/، مُتحقَّق بـ grep + axe scan.

---
## PROMPT [ID: BAI-DESIGN-03] — Trust Badges من SDAIA/NCA على hero

**Priority:** P2 |
**Effort:** 4h |
**Impact:** +8% على Design (B2B trust) |
**Risk:** L |
**Depends on:** BAI-DEPLOY-12 |
**Blocks:** —

**CONTEXT** — الموقع يبيع للبنوك السعودية لكن بدون trust badges. hero يجب أن يحوي 3 badges: 'متوافق مع PDPL'، 'معتمد من NCA ECC'، 'مبني حسب SDAIA'.

**FILES IN SCOPE** — src/components/SplitHero.astro, src/components/TrustBadges.astro (جديد), public/icons/badges/*.svg

**MUST NOT TOUCH / PRESERVE** — existing hero structure

**TASK** — 1) أنشئ src/components/TrustBadges.astro يحوي 3 SVG badges. 2) في SplitHero.astro: أضف  تحت CTA. 3) اختبر: curl / | grep -c 'badge' → 3+.

**ACCEPTANCE CRITERIA** — 1) curl / | grep -c 'TrustBadge' أو 'badge' → 3+. 2) Visual: 3 badges تحت CTA على hero.

**VERIFICATION COMMANDS**
```bash
curl -s https://brightai.site/ | grep -c 'badge'
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — 3 trust badges على hero، مُتحقَّق بـ curl + grep.

---
## PROMPT [ID: BAI-DESIGN-04] — طباعة عربية (line-height 1.75)

**Priority:** P1 |
**Effort:** 3h |
**Impact:** +3% على Design |
**Risk:** L |
**Depends on:** BAI-DEPLOY-12 |
**Blocks:** —

**CONTEXT** — tokens.css:115 يحوي --leading-relaxed: 1.75 لكن معظم المكونات تستخدم --leading-normal: 1.5. العربي يحتاج 1.7+ للتشكيل.

**FILES IN SCOPE** — src/styles/base.css (default line-height), src/styles/tokens.css (no change)

**MUST NOT TOUCH / PRESERVE** — existing line-height values

**TASK** — 1) في src/styles/base.css: غيّر body line-height من 1.5 إلى 1.75. 2) في كل CSS class يستخدم --leading-normal: غيّر إلى --leading-relaxed. 3) اختبر بصريًا على / و /blog/.

**ACCEPTANCE CRITERIA** — 1) curl / | grep -c 'line-height: 1.75' → 1+. 2) Visual: النصوص العربية أكثر قراءة.

**VERIFICATION COMMANDS**
```bash
curl -s https://brightai.site/ | grep -oE 'line-height:\s*[0-9.]+' | sort | uniq -c
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — body line-height = 1.75 على كل الصفحات، مُتحقَّق بـ curl + grep.

---
## PROMPT [ID: BAI-DESIGN-05] — Logical properties (استبدال left/right بـ inline-start/end)

**Priority:** P2 |
**Effort:** 8h |
**Impact:** +4% على Design |
**Risk:** M |
**Depends on:** BAI-DEPLOY-12 |
**Blocks:** —

**CONTEXT** — src/components/MobileNav.astro:248-249 physical right:0; left:auto. src/components/LeadForm.astro:349 physical left:-9999px. ~30 ملف يحوي physical left/right.

**FILES IN SCOPE** — src/components/*.astro (~30 ملف), src/styles/*.css

**MUST NOT TOUCH / PRESERVE** — existing physical properties

**TASK** — 1) grep -rnE '\b(left|right):\s' src/ → احصر كل المواضع. 2) استبدل: left → inset-inline-start، right → inset-inline-end. margin-left → margin-inline-start. padding-left → padding-inline-start. 3) اختبر: LTR viewport يعرض صحيح.

**ACCEPTANCE CRITERIA** — 1) grep -rnE '\b(left|right):' src/components/ src/styles/ | wc -l → ≤ 5 (fallback positions only).

**VERIFICATION COMMANDS**
```bash
grep -rnE '\b(left|right):' src/components/ src/styles/ | wc -l  # ≤ 5
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — ≤ 5 occurrences لـ physical left/right في src/، مُتحقَّق بـ grep.

---
## PROMPT [ID: BAI-DESIGN-06] — حالات المكوّنات (Button: hover/focus-visible/active/disabled/loading)

**Priority:** P1 |
**Effort:** 4h |
**Impact:** +5% على Design |
**Risk:** M |
**Depends on:** BAI-DEPLOY-12 |
**Blocks:** —

**CONTEXT** — src/components/ui/Button.astro يحوي hover + active + disabled لكن لا .is-loading. src/components/LeadForm.astro لا focus trap.

**FILES IN SCOPE** — src/components/ui/Button.astro, src/components/LeadForm.astro, src/components/KernelAiAssistant.astro

**MUST NOT TOUCH / PRESERVE** — existing Button states

**TASK** — 1) في Button.astro: أضف .is-loading class + aria-busy="true" prop + spinner SVG. 2) في LeadForm.astro: أضف focus trap (TrapFocus component). 3) أضف .is-loading على submit button عند POST. 4) اختبر: keyboard nav + screen reader.

**ACCEPTANCE CRITERIA** — 1) curl /contact/ | grep -c 'aria-busy' → 1+. 2) axe scan → 0 violations على form.

**VERIFICATION COMMANDS**
```bash
curl -s https://brightai.site/contact/ | grep -c 'aria-busy'
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — Button.astro + LeadForm.astro يحويان .is-loading + aria-busy + focus trap، مُتحقَّق بـ curl + axe.

---
## PROMPT [ID: BAI-DESIGN-07] — موبايل 360px (touch targets 44px)

**Priority:** P2 |
**Effort:** 4h |
**Impact:** +3% على Design |
**Risk:** L |
**Depends on:** BAI-DEPLOY-12 |
**Blocks:** —

**CONTEXT** — Button.astro به min-height: 44px. لكن chips وروابط صغيرة في Header.astro قد تكون <44px.

**FILES IN SCOPE** — src/components/Header.astro, src/components/Footer.astro, src/components/SplitHero.astro, src/components/ui/*.astro

**MUST NOT TOUCH / PRESERVE** — existing touch target sizes

**TASK** — 1) grep -rn 'min-height' src/components/ | grep -v 44 → احصر المواضع. 2) لكل interactive element (button, link, chip): أضف min-height: 44px (أو min-width: 44px). 3) اختبر على viewport 360px.

**ACCEPTANCE CRITERIA** — 1) كل interactive elements في / و /pricing/ لها min-height ≥ 44px. 2) Lighthouse mobile: tap targets ≥ 90%.

**VERIFICATION COMMANDS**
```bash
grep -rn 'min-height' src/components/ | grep -v 'min-height: 44' | wc -l  # ≤ 5
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — كل interactive elements لها min-height ≥ 44px، مُتحقَّق بـ grep + Lighthouse.

---
## PROMPT [ID: BAI-DESIGN-08] — مسار التحويل (إضافة lead confirmation message)

**Priority:** P1 |
**Effort:** 4h |
**Impact:** +5% على Design (CRO) |
**Risk:** M |
**Depends on:** BAI-SEC-16 |
**Blocks:** —

**CONTEXT** — src/pages/api/lead.ts:283-288 يرجع JSON message لكن LeadForm.astro قد لا يعرضه. يجب أن يعرض confirmation واضح بعد النجاح.

**FILES IN SCOPE** — src/components/LeadForm.astro, src/pages/api/lead.ts (no change)

**MUST NOT TOUCH / PRESERVE** — existing LeadForm submit logic

**TASK** — 1) في LeadForm.astro: عند نجاح POST، اعرض رسالة: 'تم استلام طلبك بنجاح. فريق الحوكمة سيتواصل معك خلال 24 ساعة.' 2) أضف visual cue (✓ icon). 3) أضف WhatsApp alt CTA. 4) أضف GA4 event 'generate_lead'.

**ACCEPTANCE CRITERIA** — 1) بعد POST /api/lead: LeadForm يعرض confirmation message. 2) GA4 DebugView: event 'generate_lead' fired.

**VERIFICATION COMMANDS**
```bash
curl -s -X POST https://brightai.site/api/lead -H 'Origin: https://brightai.site' -d '{}' | head -c 300
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — LeadForm يعرض confirmation + GA4 event generate_lead fired، مُتحقَّق بـ curl + GA4 DebugView.

---

---

# BAI-A11Y — Accessibility

## PROMPT [ID: BAI-A11Y-01] — إصلاح كل مخالفات axe critical/serious من a11y-report.html

**Priority:** P1 |
**Effort:** 8h |
**Impact:** +5% على Design |
**Risk:** M |
**Depends on:** BAI-DEPLOY-12 |
**Blocks:** —

**CONTEXT** — a11y-report.html يُظهر 0 مخالفات على 13 صفحة في main. لكن الإنتاج قد يحوي مخالفات. يجب فحص الإنتاج بعد deploy.

**FILES IN SCOPE** — src/components/*.astro, src/pages/*.astro (حسب نتائج axe على الإنتاج)

**MUST NOT TOUCH / PRESERVE** — —

**TASK** — 1) بعد BAI-DEPLOY-12 deploy، شغّل pnpm run a11y:scan على brightai.site (افحص scripts/axe-scan.mjs). 2) احصر كل critical/serious violations. 3) أصلح كل واحد. 4) اختبر: axe scan = 0 violations.

**ACCEPTANCE CRITERIA** — 1) axe scan على / و /pricing/ و /kernel/chat/ → 0 critical + 0 serious. 2) Lighthouse a11y score ≥ 95 على كل صفحة.

**VERIFICATION COMMANDS**
```bash
node scripts/axe-scan.mjs --url https://brightai.site/
node scripts/axe-scan.mjs --url https://brightai.site/pricing/
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — 0 critical/serious axe violations على الإنتاج، مُتحقَّق بـ axe-scan.mjs.

---
## PROMPT [ID: BAI-A11Y-02] — focus-visible واضح على كل interactive elements

**Priority:** P1 |
**Effort:** 3h |
**Impact:** +3% على Design |
**Risk:** L |
**Depends on:** BAI-DEPLOY-12 |
**Blocks:** —

**CONTEXT** — src/styles/global.css يحوي :focus-visible لكن قد لا يكون كافٍ لكل elements.

**FILES IN SCOPE** — src/styles/global.css (focus styles), src/components/ui/*.astro

**MUST NOT TOUCH / PRESERVE** — existing focus-visible styles

**TASK** — 1) في global.css: أضف :focus-visible { outline: 2px solid var(--interactive-primary); outline-offset: 2px; } لكل interactive elements. 2) اختبر: keyboard nav على / و /contact/.

**ACCEPTANCE CRITERIA** — 1) axe scan → 0 focus violations. 2) Manual test: Tab key → كل focused element يحوي outline واضح.

**VERIFICATION COMMANDS**
```bash
node scripts/axe-scan.mjs --url https://brightai.site/  # focus checks
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — كل interactive elements تحوي :focus-visible outline، مُتحقَّق بـ axe + manual keyboard nav.

---
## PROMPT [ID: BAI-A11Y-03] — alt text على كل صور

**Priority:** P1 |
**Effort:** 2h |
**Impact:** +2% على Design |
**Risk:** L |
**Depends on:** BAI-DEPLOY-12 |
**Blocks:** —

**CONTEXT** — بعض الصور قد تحوي alt='' (decorative) لكن البعض قد تحوي alt ناقص.

**FILES IN SCOPE** — src/components/*.astro, src/pages/*.astro (كل )

**MUST NOT TOUCH / PRESERVE** — existing alt attributes

**TASK** — 1) grep -rn '<img' src/ | grep -v 'alt=' → احصر الصور بدون alt. 2) لكل صورة: أضف alt وصفية (أو alt='' للـ decorative). 3) اختبر: axe scan → 0 image-alt violations.

**ACCEPTANCE CRITERIA** — 1) grep -rn '<img' src/ | grep -v 'alt=' | wc -l → 0. 2) axe scan → 0 image-alt violations.

**VERIFICATION COMMANDS**
```bash
grep -rn '<img' src/ | grep -v 'alt=' | wc -l  # 0
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — 0  بدون alt في src/، مُتحقَّق بـ grep + axe.

---
## PROMPT [ID: BAI-A11Y-04] — ARIA labels على كل icon-only buttons

**Priority:** P1 |
**Effort:** 2h |
**Impact:** +2% على Design |
**Risk:** L |
**Depends on:** BAI-DEPLOY-12 |
**Blocks:** —

**CONTEXT** — بعض الأزرار في Header.astro (search, menu) قد تحوي أيقونة فقط بدون aria-label.

**FILES IN SCOPE** — src/components/Header.astro, src/components/MobileNav.astro, src/components/Footer.astro

**MUST NOT TOUCH / PRESERVE** — existing aria-label usage

**TASK** — 1) grep -rn '<button' src/ | grep -v 'aria-label' → احصر الأزرار بدون aria-label. 2) لكل زر يحوي أيقونة فقط: أضف aria-label وصفية. 3) اختبر: axe scan → 0 button-name violations.

**ACCEPTANCE CRITERIA** — 1) axe scan → 0 button-name violations. 2) Manual test: screen reader يقرأ كل زر.

**VERIFICATION COMMANDS**
```bash
node scripts/axe-scan.mjs --url https://brightai.site/  # button-name checks
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — 0 icon-only buttons بدون aria-label، مُتحقَّق بـ axe + screen reader.

---
## PROMPT [ID: BAI-A11Y-05] — skip-to-content link على كل صفحة

**Priority:** P2 |
**Effort:** 1h |
**Impact:** +2% على Design |
**Risk:** L |
**Depends on:** BAI-DEPLOY-12 |
**Blocks:** —

**CONTEXT** — src/layouts/BaseLayout.astro يجب أن يحوي skip-to-content link كأول عنصر في body.

**FILES IN SCOPE** — src/layouts/BaseLayout.astro, src/styles/global.css (skip link styles)

**MUST NOT TOUCH / PRESERVE** — existing BaseLayout structure

**TASK** — 1) في BaseLayout.astro: أضف تخطَّ إلى المحتوى الرئيسي كأول عنصر. 2) في main content: أضف id="main". 3) في global.css: أضف .skip-link styles (off-screen حتى focus).

**ACCEPTANCE CRITERIA** — 1) curl / | grep 'skip-link' → موجود. 2) axe scan → 0 bypass violations.

**VERIFICATION COMMANDS**
```bash
curl -s https://brightai.site/ | grep -c 'skip-link'
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — skip-to-content link على كل صفحة، مُتحقَّق بـ curl + axe.

---

---

# BAI-PERF — Performance

## PROMPT [ID: BAI-PERF-02] — استضافة الخطوط محليًا (Self-host IBM Plex Sans Arabic)

**Priority:** P1 |
**Effort:** 4h |
**Impact:** +5% على Performance |
**Risk:** M |
**Depends on:** BAI-DEPLOY-12 |
**Blocks:** —

**CONTEXT** — BaseLayout.astro يحوي . هذا يسبب FOUT + privacy + availability risks.

**FILES IN SCOPE** — src/layouts/BaseLayout.astro, public/fonts/ (جديد), src/styles/tokens.css (font path), scripts/security-headers.mjs (CSP: remove fonts.googleapis.com)

**MUST NOT TOUCH / PRESERVE** — existing font URLs

**TASK** — 1) حمّل IBMPlexSansArabic-{Regular,Bold}.ttf من GitHub. 2) ضعها في public/fonts/. 3) في tokens.css: --font-sans: 'IBM Plex Sans Arabic', system-ui, sans-serif; + @font-face declaration. 4) في BaseLayout.astro: احذف . 5) في security-headers.mjs: احذف fonts.googleapis.com من style-src + fonts.gstatic.com من font-src. 6) أضف preload لـ fonts. 7) اختبر: curl / | grep -c 'fonts.googleapis.com' → 0.

**ACCEPTANCE CRITERIA** — 1) curl / | grep -c 'fonts.googleapis.com' → 0. 2) curl /css/... | grep 'IBM Plex Sans Arabic' → @font-face موجود. 3) LCP -200ms.

**VERIFICATION COMMANDS**
```bash
curl -s https://brightai.site/ | grep -c 'fonts.googleapis.com'  # 0
curl -s https://brightai.site/ | grep -c '@font-face'
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — 0 references لـ fonts.googleapis.com في src/، مُتحقَّق بـ curl + grep.

---
## PROMPT [ID: BAI-PERF-03] — تشديد ميزانيات Lighthouse (LCP < 2500ms enforced)

**Priority:** P1 |
**Effort:** 8h |
**Impact:** +8% على Performance |
**Risk:** H |
**Depends on:** BAI-PERF-02 |
**Blocks:** —

**CONTEXT** — .lighthouserc.json يحوي budget: 2500ms (LCP) لكن CI لا يفحص. LCP الحالي 8.6s على mobile = 3.4× الميزانية.

**FILES IN SCOPE** — .lighthouserc.json (no change), .github/workflows/ci-build-guard.yml (أضف lhci assert step)

**MUST NOT TOUCH / PRESERVE** — existing budget values

**TASK** — 1) في CI: أضف step 'pnpm run lhci:assert' بعد build. 2) اجعله required check. 3) اختبر: CI يفشل عند LCP > 2500ms. 4) أصلح الأسباب: Google Fonts (BAI-PERF-02)، unused CSS، large images.

**ACCEPTANCE CRITERIA** — 1) CI workflow يحوي 'lhci:assert' step. 2) Lighthouse mobile: LCP < 2500ms على / و /kernel/ و /pricing/.

**VERIFICATION COMMANDS**
```bash
pnpm run lhci:assert 2>&1 | tail -20
cat report/A/perf/home-mobile.summary.json | jq '.cwv.LCP_ms'
```

**ROLLBACK** — `احذف step من CI`

**DEFINITION OF DONE** — CI يفشل عند LCP > 2500ms، و LCP mobile < 2500ms، مُتحقَّق بـ CI + Lighthouse.

---
## PROMPT [ID: BAI-PERF-04] — lazy-load Microsoft Clarity

**Priority:** P2 |
**Effort:** 2h |
**Impact:** +3% على Performance |
**Risk:** L |
**Depends on:** BAI-DEPLOY-12 |
**Blocks:** —

**CONTEXT** — public/js/clarity-init.js يحمّل Microsoft Clarity (third-party). يجب lazy-load.

**FILES IN SCOPE** — public/js/clarity-init.js, src/layouts/BaseLayout.astro

**MUST NOT TOUCH / PRESERVE** — existing Clarity init

**TASK** — 1) في clarity-init.js: استخدم requestIdleCallback (fallback setTimeout 3000ms) لتأخير تحميل Clarity. 2) اختبر: PageView قبل Clarity. 3) Lighthouse: TBT -50ms.

**ACCEPTANCE CRITERIA** — 1) curl / | grep 'clarity-init' → موجود. 2) Lighthouse TBT < 100ms.

**VERIFICATION COMMANDS**
```bash
curl -s https://brightai.site/ | grep -c 'clarity-init'
cat report/A/perf/home-mobile.summary.json | jq '.cwv.TBT_ms'
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — Clarity lazy-loaded + Lighthouse TBT < 100ms، مُتحقَّق بـ curl + Lighthouse.

---
## PROMPT [ID: BAI-PERF-05] — تصغير DOM size على /

**Priority:** P2 |
**Effort:** 4h |
**Impact:** +3% على Performance |
**Risk:** M |
**Depends on:** BAI-DEPLOY-12 |
**Blocks:** —

**CONTEXT** — home.html حجمه 173KB. عدد عناصر DOM قد يكون > 1500 (افحص). DOM كبير يبطّئ INP.

**FILES IN SCOPE** — src/pages/index.astro, src/components/*.astro (split, lazy-render)

**MUST NOT TOUCH / PRESERVE** — existing home structure

**TASK** — 1) curl / | grep -oE ' 1500: قسّم index.astro إلى lazy-render sections (IntersectionObserver). 3) احذف العناصر غير الضرورية. 4) اختبر: DOM size ≤ 1500.

**ACCEPTANCE CRITERIA** — 1) curl / | grep -oE '<[a-z]+' | wc -l → ≤ 1500. 2) Lighthouse INP < 200ms.

**VERIFICATION COMMANDS**
```bash
curl -s https://brightai.site/ | grep -oE '<[a-z]+' | wc -l
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — DOM size على / ≤ 1500 element، مُتحقَّق بـ curl + grep.

---
## PROMPT [ID: BAI-PERF-06] — AVIF variants على كل صور

**Priority:** P2 |
**Effort:** 2h |
**Impact:** +2% على Performance |
**Risk:** L |
**Depends on:** BAI-DEPLOY-12 |
**Blocks:** —

**CONTEXT** — scripts/generate-avif-variants.mjs موجود لكن قد لا يولّد لكل صور.

**FILES IN SCOPE** — scripts/generate-avif-variants.mjs (no change), public/assets/images/* (افحص)

**MUST NOT TOUCH / PRESERVE** — existing AVIF generation

**TASK** — 1) شغّل pnpm run avif:generate. 2) افحص public/assets/images/ يحوي .avif بجانب .webp/.jpg. 3) في BaseLayout.astro: استخدم  مع . 4) اختبر: curl /assets/images/.avif → 200.

**ACCEPTANCE CRITERIA** — 1) find public/assets/images/ -name '*.avif' | wc -l → > 0. 2) curl /assets/images/.avif → 200.

**VERIFICATION COMMANDS**
```bash
find public/assets/images/ -name '*.avif' | wc -l
curl -s -o /dev/null -w '%{http_code}' https://brightai.site/assets/images/hero.avif
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — كل الصور لها AVIF variants +  tags، مُتحقَّق بـ find + curl.

---

---

# BAI-ARCH — Architecture

## PROMPT [ID: BAI-ARCH-01] — تفعيل ESLint (lint:legacy ≠ echo)

**Priority:** P2 |
**Effort:** 4h |
**Impact:** +5% على Code/Arch |
**Risk:** M |
**Depends on:** BAI-DEPLOY-12 |
**Blocks:** —

**CONTEXT** — package.json:55-56: lint:legacy + lint:fix = echo 'Linting skipped for static site'. eslint.config.mjs يتجاهل 80% من الكود (scripts/, dist/, .agents/, kernel/, public/).

**FILES IN SCOPE** — package.json (أزل lint:legacy + lint:fix), eslint.config.mjs (وسّع files)

**MUST NOT TOUCH / PRESERVE** — existing ESLint config

**TASK** — 1) أزل lint:legacy + lint:fix من package.json. 2) في eslint.config.mjs: أزل scripts/** من ignores. 3) شغّل pnpm lint → احصر الأخطاء. 4) أصلح الأخطاء. 5) أضف pnpm lint لـ CI كـ required check.

**ACCEPTANCE CRITERIA** — 1) package.json لا يحوي lint:legacy. 2) pnpm lint → 0 errors. 3) CI يحوي 'lint' required.

**VERIFICATION COMMANDS**
```bash
grep -E '"lint:legacy"|"lint:fix"' package.json  # empty
pnpm lint 2>&1 | tail -5
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — lint:legacy غير موجود + pnpm lint = 0 errors + CI required، مُتحقَّق بـ grep + pnpm lint.

---
## PROMPT [ID: BAI-ARCH-02] — تشغيل RLS isolation test في CI

**Priority:** P2 |
**Effort:** 4h |
**Impact:** +5% على Code/Arch |
**Risk:** M |
**Depends on:** BAI-DEPLOY-12 |
**Blocks:** —

**CONTEXT** — packages/db/tests/rls-isolation.test.ts موجود لكن لا يُشغَّل في CI. يتطلب Docker + Postgres + Prisma migrate.

**FILES IN SCOPE** — .github/workflows/ci-build-guard.yml (أضف services: postgres + step), packages/db/tests/rls-isolation.test.ts (no change)

**MUST NOT TOUCH / PRESERVE** — existing test logic

**TASK** — 1) في CI workflow: أضف services.postgres image postgres:16. 2) أضف step: 'pnpm db:setup && pnpm --filter @brightai/db db:rls:test'. 3) اجعله required check.

**ACCEPTANCE CRITERIA** — 1) CI workflow يحوي postgres service + RLS test step. 2) RLS test → pass. 3) Branch protection: 'rls-test' required.

**VERIFICATION COMMANDS**
```bash
gh workflow list | grep ci-build-guard
gh run list --workflow=ci-build-guard.yml --limit=3
```

**ROLLBACK** — `احذف step من CI`

**DEFINITION OF DONE** — RLS isolation test يعمل في CI + required، مُتحقَّق بـ GitHub Actions UI.

---
## PROMPT [ID: BAI-ARCH-03] — تنظيف scripts/ (215 → ~50)

**Priority:** P2 |
**Effort:** 16h |
**Impact:** +5% على Code/Arch |
**Risk:** M |
**Depends on:** BAI-DEPLOY-12 |
**Blocks:** —

**CONTEXT** — scripts/ يحوي 215 ملف. scripts/INVENTORY.md يُصنّفها: 38 Production + 13 Library + الباقي qa/playwright/migration/archived.

**FILES IN SCOPE** — scripts/ (احذف archived/, ادمج qa/ في scripts/، احذف playwright/ المكررة)

**MUST NOT TOUCH / PRESERVE** — existing scripts/ structure

**TASK** — 1) احذف scripts/archived/. 2) ادمج scripts/qa/ في scripts/ (أعد تسمية بـ qa- prefix). 3) احذف scripts/playwright/ المكررة (احتفظ بـ scripts/qa/playwright/). 4) ادمج scripts/migration/ في scripts/ (migration- prefix). 5) تحديث package.json scripts. 6) اختبر: pnpm run build + verify:all.

**ACCEPTANCE CRITERIA** — 1) find scripts/ -type f | wc -l → ≤ 60. 2) pnpm run build → success. 3) pnpm run verify:all → success.

**VERIFICATION COMMANDS**
```bash
find scripts/ -type f | wc -l  # ≤ 60
pnpm run build 2>&1 | tail -5
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — scripts/ ≤ 60 ملف + build + verify:all يعملان، مُتحقَّق بـ find + pnpm.

---
## PROMPT [ID: BAI-ARCH-04] — تفكيك blog/[...slug].astro و chat.ts

**Priority:** P2 |
**Effort:** 16h |
**Impact:** +5% على Code/Arch |
**Risk:** M |
**Depends on:** BAI-DEPLOY-12 |
**Blocks:** —

**CONTEXT** — src/pages/blog/[...slug].astro = 590 سطرًا. src/pages/api/ai/chat.ts = 1290 سطرًا (SSE + chat-session + quota + firewall + usage tracking).

**FILES IN SCOPE** — src/pages/blog/[...slug].astro (split into components), src/pages/api/ai/chat.ts (split into modules)

**MUST NOT TOUCH / PRESERVE** — existing logic + URL structure

**TASK** — 1) blog/[...slug].astro: استخرج TOC, RelatedPosts, ShareButtons, FAQ section إلى components. 2) chat.ts: استخرج SSE handler, chat-session, quota check, firewall call, usage tracking إلى modules. 3) اختبر: pnpm run build + curl /api/ai/chat.

**ACCEPTANCE CRITERIA** — 1) wc -l src/pages/blog/[...slug].astro → ≤ 300. 2) wc -l src/pages/api/ai/chat.ts → ≤ 300. 3) curl /api/ai/chat POST → 200.

**VERIFICATION COMMANDS**
```bash
wc -l src/pages/blog/\[...slug\].astro src/pages/api/ai/chat.ts
curl -sX POST https://brightai.site/api/ai/chat -H 'Origin: https://brightai.site' -d '{"message":"test"}' | head -c 100
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — blog/[...slug].astro و chat.ts ≤ 300 سطر، مُتحقَّق بـ wc + curl.

---
## PROMPT [ID: BAI-ARCH-05] — حماية main + PR إلزامي + Conventional Commits

**Priority:** P1 |
**Effort:** 1h |
**Impact:** +5% على Code/Arch |
**Risk:** L |
**Depends on:** — |
**Blocks:** —

**CONTEXT** — لا يمكن معرفة حماية main بدون GitHub API. يجب: branch protection + required reviews + required status checks + Conventional Commits format.

**FILES IN SCOPE** — .github/branch-protection.rules (جديد أو عبر gh CLI), .github/COMMIT_CONVENTION.md (جديد)

**MUST NOT TOUCH / PRESERVE** — —

**TASK** — 1) gh api repos/YEEEAE/BRIGHTAI/branches/main/protection -X PUT --data '{required_status_checks: [...], enforce_admins: true, required_pull_request_reviews: {required_approving_review_count: 1}}'. 2) أضف commitlint لـ Conventional Commits. 3) أضف husky pre-commit hook. 4) اختبر: git push direct إلى main → يجب أن يُرفض.

**ACCEPTANCE CRITERIA** — 1) gh api repos/YEEEAE/BRIGHTAI/branches/main/protection → JSON يحوي required_status_checks. 2) git push direct إلى main → rejected. 3) PR مع commit message غير conventional → rejected.

**VERIFICATION COMMANDS**
```bash
gh api repos/YEEEAE/BRIGHTAI/branches/main/protection | jq .
git push origin main  # should fail
```

**ROLLBACK** — `gh api repos/YEEEAE/BRIGHTAI/branches/main/protection -X DELETE`

**DEFINITION OF DONE** — main محمي + PR إلزامي + Conventional Commits enforced، مُتحقَّق بـ gh API + git push.

---

---

# BAI-MEAS — Measurement

## PROMPT [ID: BAI-MEAS-01] — أحداث GA4 (lead, chat_started, chat_completed, demo_opened)

**Priority:** P1 |
**Effort:** 4h |
**Impact:** +5% على Code/Arch |
**Risk:** M |
**Depends on:** BAI-SEC-17 |
**Blocks:** —

**CONTEXT** — GA4 events الحالية = 1130/28 يومًا، لكن 38 منها على صفحة 404. لا يوجد clear event tracking لـ lead/chat/demo.

**FILES IN SCOPE** — public/js/analytics.js (أضف track() calls), src/components/LeadForm.astro, src/components/KernelAiAssistant.astro, src/pages/demo/index.astro

**MUST NOT TOUCH / PRESERVE** — existing analytics.js structure

**TASK** — 1) في LeadForm.astro: عند submit، analytics.track('lead_started'). 2) عند نجاح POST: analytics.track('lead_completed', {mode}). 3) في KernelAiAssistant.astro: عند إرسال message: analytics.track('chat_started'). 4) عند reply: analytics.track('chat_completed'). 5) في /demo/: عند فتح demo: analytics.track('demo_opened').

**ACCEPTANCE CRITERIA** — 1) GA4 DebugView: كل event fired عند appropriate action. 2) GA4 Events report: 4 events مع count > 0.

**VERIFICATION COMMANDS**
```bash
GA4 DebugView:
1. افتح /contact/، املأ النموذج، submit → يجب أن يظهر 'lead_completed' event
2. افتح /kernel/chat/، أرسل message → 'chat_started' + 'chat_completed'
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — 4 events (lead, chat_started, chat_completed, demo_opened) fired في GA4، مُتحقَّق بـ GA4 DebugView.

---
## PROMPT [ID: BAI-MEAS-02] — lead tracking (server-side GA4 Measurement Protocol)

**Priority:** P1 |
**Effort:** 4h |
**Impact:** +3% على Code/Arch |
**Risk:** M |
**Depends on:** BAI-MEAS-01 |
**Blocks:** —

**CONTEXT** — src/pages/api/lead.ts لا يستدعي GA4 Measurement Protocol. لو client fetch فشل، الـ event يُفقد. يجب server-side event.

**FILES IN SCOPE** — src/pages/api/lead.ts (أضف server-side GA4 call), src/lib/ga4-measurement.ts (جديد)

**MUST NOT TOUCH / PRESERVE** — existing lead.ts handler

**TASK** — 1) أنشئ src/lib/ga4-measurement.ts يحوي sendEvent({client_id, events}). 2) في lead.ts بعد enqueue: sendEvent({events: [{name: 'generate_lead', params: {source: lead.source, page: lead.page}}]}). 3) يتطلب GA4_MEASUREMENT_SECRET + GA4_API_SECRET. 4) اختبر: GA4 DebugView → event 'generate_lead' fired server-side.

**ACCEPTANCE CRITERIA** — 1) GA4 DebugView: event 'generate_lead' fired server-side (مع parameter source). 2) GA4 Events: 'generate_lead' count > 0.

**VERIFICATION COMMANDS**
```bash
GA4 DebugView:
1. افتح /contact/، املأ النموذج، submit
2. يجب أن يظهر 'generate_lead' event مع parameters source + page
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — GA4 event 'generate_lead' fired server-side لكل /api/lead success، مُتحقَّق بـ GA4 DebugView.

---
## PROMPT [ID: BAI-MEAS-03] — ربط GSC (sitemaps submission)

**Priority:** P2 |
**Effort:** 1h |
**Impact:** +3% على Indexation |
**Risk:** L |
**Depends on:** BAI-DEPLOY-12 |
**Blocks:** —

**CONTEXT** — GSC يعرف عن 180 URL (sitemap: كل الصفحات المعروفة) لكن لم يُ submit sitemap-index.xml.

**FILES IN SCOPE** — Google Search Console dashboard (manual), public/robots.txt (no change)

**MUST NOT TOUCH / PRESERVE** — existing sitemap URL

**TASK** — 1) اذهب GSC → Sitemaps. 2) اضغط 'Add new sitemap'. 3) أدخل: https://brightai.site/sitemap.xml. 4) انتظر تأكيد (ساعة). 5) افحص: GSC → Sitemaps → Status = Success.

**ACCEPTANCE CRITERIA** — 1) GSC → Sitemaps → https://brightai.site/sitemap.xml → Status = Success. 2) Discovered URLs = 180.

**VERIFICATION COMMANDS**
```bash
GSC dashboard:
1. Sitemaps → https://brightai.site/sitemap.xml → Status: Success
2. Discovered URLs: 180
```

**ROLLBACK** — `احذف sitemap من GSC`

**DEFINITION OF DONE** — GSC Sitemaps status = Success لـ sitemap.xml، مُتحقَّق بـ GSC UI.

---
## PROMPT [ID: BAI-MEAS-04] — uptime + تنبيهات (UptimeRobot + Slack webhook)

**Priority:** P2 |
**Effort:** 2h |
**Impact:** +3% على Code/Arch |
**Risk:** L |
**Depends on:** BAI-DEPLOY-12 |
**Blocks:** —

**CONTEXT** — لا يوجد uptime monitoring خارج Render. Render health check يفحص /api/health/ فقط.

**FILES IN SCOPE** — UptimeRobot dashboard (manual), Slack webhook (manual)

**MUST NOT TOUCH / PRESERVE** — —

**TASK** — 1) اذهب UptimeRobot → Add Monitor. 2) URL: https://brightai.site/api/health/. 3) Interval: 5 min. 4) Alert via Slack webhook. 5) اختبر: اوقف Render service → Slack alert خلال 5 min.

**ACCEPTANCE CRITERIA** — 1) UptimeRobot dashboard يحوي monitor لـ /api/health/. 2) Slack #alerts channel يستقبل alerts.

**VERIFICATION COMMANDS**
```bash
UptimeRobot dashboard:
1. Monitor: https://brightai.site/api/health/ → Status: Up
2. Slack #alerts channel: آخر alert = none
```

**ROLLBACK** — `احذف monitor من UptimeRobot`

**DEFINITION OF DONE** — UptimeRobot monitor + Slack alerts مفعّل، مُتحقَّق بـ UptimeRobot UI + Slack.

---

---

# BAI-GROWTH — Growth

## PROMPT [ID: BAI-GROWTH-01] — Google Business Profile للعنوان

**Priority:** P1 |
**Effort:** 2h |
**Impact:** +8% على Saudi Visibility |
**Risk:** L |
**Depends on:** BAI-DEPLOY-12 |
**Blocks:** —

**CONTEXT** — schema يحوي العنوان '6913 المبارك بن فضالة، حي الفيحاء، الرياض، 14254' لكن لا يوجد GBP. GBP يربط الموقع بـ Saudi SERP.

**FILES IN SCOPE** — Google Business Profile dashboard (manual), src/data/schema-helpers.ts (no change)

**MUST NOT TOUCH / PRESERVE** — existing address in schema

**TASK** — 1) اذهب google.com/business. 2) Add business → فئة 'Information technology company'. 3. أدخل NAP من schema: Name=BrightAI، Address=6913 المبارك بن فضالة...، Phone=+966538229013. 4. تحقّق via postcard/SMS. 5. بعد التحقق: أضف 3 photos + 5 posts + Q&A.

**ACCEPTANCE CRITERIA** — 1) GBP للعنوان موجود + مُتحقَّق. 2) NAP يطابق schema. 3) GBP Insights بعد 30 يوم: impressions > 0.

**VERIFICATION COMMANDS**
```bash
GBP dashboard:
1. Business name: BrightAI
2. Address: 6913 المبارك بن فضالة، حي الفيحاء، الرياض، 14254
3. Phone: +966538229013
4. Status: Verified
```

**ROLLBACK** — `احذف GBP`

**DEFINITION OF DONE** — GBP مُتحقَّق للعنوان + NAP يطابق schema، مُتحقَّق بـ GBP UI.

---
## PROMPT [ID: BAI-GROWTH-02] — 5 صفحات هبوط بنية تجارية (/lp/*)

**Priority:** P2 |
**Effort:** 16h |
**Impact:** +8% على Saudi Visibility |
**Risk:** M |
**Depends on:** BAI-DEPLOY-12 |
**Blocks:** —

**CONTEXT** — لا توجد /lp/* في sitemap. صفحات هبوط تجارية ترفع conversion + SEO لـ keywords تجارية.

**FILES IN SCOPE** — src/pages/lp/pdpl-assessment/index.astro (جديد), src/pages/lp/iso-42001-readiness/index.astro (جديد), src/pages/lp/nca-ecc-audit/index.astro (جديد), src/pages/lp/ai-firewall-demo/index.astro (جديد), src/pages/lp/banking-ai-governance/index.astro (جديد)

**MUST NOT TOUCH / PRESERVE** — —

**TASK** — 1) لكل /lp/: اكتب 1500+ كلمة focused على commercial keyword. 2) CTA prominent (form + WhatsApp). 3) Schema Service + FAQ. 4) أضف لـ sitemap. 5) أضف cross-links من /solutions/ المقابلة. 6) اختبر: curl /lp/pdpl-assessment/ → 200.

**ACCEPTANCE CRITERIA** — 1) curl /lp/pdpl-assessment/ → 200. 2) sitemap.xml يحوي 5 /lp/* URLs. 3) GSC بعد 30 يوم: 3 /lp/* crawled.

**VERIFICATION COMMANDS**
```bash
curl -s -o /dev/null -w '%{http_code}' https://brightai.site/lp/pdpl-assessment/
curl -s https://brightai.site/sitemap.xml | grep -c '/lp/'
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — 5 صفحات /lp/* في sitemap + 200 OK، مُتحقَّق بـ curl + sitemap.xml.

---
## PROMPT [ID: BAI-GROWTH-03] — LinkedIn company page + 3 منشورات أسبوعية

**Priority:** P2 |
**Effort:** 24h |
**Impact:** +5% على Saudi Visibility |
**Risk:** M |
**Depends on:** BAI-DEPLOY-12 |
**Blocks:** —

**CONTEXT** — schema sameAs يحوي linkedin.com/company/brightai-site لكن يجب التحقق + بناء content calendar.

**FILES IN SCOPE** — LinkedIn dashboard (manual), src/data/schema-helpers.ts (no change)

**MUST NOT TOUCH / PRESERVE** — existing LinkedIn URL

**TASK** — 1) اذهب linkedin.com/company/new. 2. أنشئ Company Page: BrightAI + logo + description. 3. حدّث schema-helpers.ts sameAs لـ LinkedIn URL الصحيح. 4. أنشئ content calendar: 3 posts/week (Monday: PDPL tip, Wednesday: SDAIA news, Friday: case study). 5. بعد 30 يوم: analytics followers > 100.

**ACCEPTANCE CRITERIA** — 1) LinkedIn Company Page موجود + URL يطابق schema. 2. 3 posts/week. 3. Followers > 100 بعد 30 يوم.

**VERIFICATION COMMANDS**
```bash
LinkedIn dashboard:
1. Company: BrightAI
2. URL: linkedin.com/company/brightai-site
3. Followers: > 100
4. Posts/week: 3
```

**ROLLBACK** — `احذف Company Page`

**DEFINITION OF DONE** — LinkedIn Company Page + 3 posts/week + followers > 100، مُتحقَّق بـ LinkedIn UI.

---
## PROMPT [ID: BAI-GROWTH-04] — صفحات إجابات مباشرة لمحركات الذكاء الاصطناعي (/answer/*)

**Priority:** P2 |
**Effort:** 16h |
**Impact:** +5% على Saudi Visibility |
**Risk:** M |
**Depends on:** BAI-DEPLOY-12 |
**Blocks:** —

**CONTEXT** — llms.txt + ai.txt موجودان. لكن لا توجد صفحات /answer/* مُحسَّنة لـ AI answer engines (Perplexity, ChatGPT, Gemini).

**FILES IN SCOPE** — src/pages/answer/what-is-ai-governance-saudi/index.astro (جديد), src/pages/answer/how-to-comply-with-pdpl/index.astro (جديد), src/pages/answer/what-are-nca-ecc-controls/index.astro (جديد), src/pages/answer/sdaia-generative-ai-guidelines/index.astro (جديد), src/pages/answer/iso-42001-saudi/index.astro (جديد)

**MUST NOT TOUCH / PRESERVE** — —

**TASK** — 1) لكل /answer/: اكتب 800-1200 كلمة بصيغة Q&A مباشرة. 2) الفقرة الأولى (40-50 كلمة) تحوي الإجابة المباشرة (quote-able). 3) Schema FAQPage + Speakable. 4) أضف لـ sitemap. 5) أضف cross-links لـ /blog/ و /solutions/ المقابلة. 6) اختبر: curl /answer/what-is-ai-governance-saudi/ → 200.

**ACCEPTANCE CRITERIA** — 1) curl /answer/what-is-ai-governance-saudi/ → 200. 2) sitemap.xml يحوي 5 /answer/* URLs. 3) كل صفحة تحوي FAQPage + Speakable schema.

**VERIFICATION COMMANDS**
```bash
curl -s -o /dev/null -w '%{http_code}' https://brightai.site/answer/what-is-ai-governance-saudi/
curl -s https://brightai.site/answer/what-is-ai-governance-saudi/ | grep -c 'FAQPage'
curl -s https://brightai.site/sitemap.xml | grep -c '/answer/'
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — 5 صفحات /answer/* مع FAQPage + Speakable schema + 200 OK، مُتحقَّق بـ curl + grep.

---
## PROMPT [ID: BAI-GROWTH-05] — NAP موحّد (في footer + schema + GBP)

**Priority:** P1 |
**Effort:** 2h |
**Impact:** +3% على Saudi Visibility |
**Risk:** L |
**Depends on:** BAI-GROWTH-01 |
**Blocks:** —

**CONTEXT** — schema يحوي NAP لكن footer قد لا يحوي NAP كامل. GBP (بعد BAI-GROWTH-01) يجب أن يطابق.

**FILES IN SCOPE** — src/components/Footer.astro, src/data/schema-helpers.ts (no change)

**MUST NOT TOUCH / PRESERVE** — existing NAP in schema

**TASK** — 1) في Footer.astro: أضف NAP block: BrightAI، 6913 المبارك بن فضالة، حي الفيحاء، الرياض، 14254، +966538229013. 2) أضف رابط Google Maps. 3) تأكد NAP يطابق schema + GBP. 4) اختبر: curl / | grep '6913 المبارك' → موجود.

**ACCEPTANCE CRITERIA** — 1) curl / | grep -c '6913 المبارك' → 1+. 2) NAP يطابق schema + GBP.

**VERIFICATION COMMANDS**
```bash
curl -s https://brightai.site/ | grep -c '6913 المبارك'
```

**ROLLBACK** — `git revert HEAD`

**DEFINITION OF DONE** — NAP في footer يطابق schema + GBP، مُتحقَّق بـ curl + grep.

---

---

# Execution Order — Batches 1→4

| Batch | البرومبتات | الجهد h | الأثر التراكمي | المدة |
|-------|-----------|---------|----------------|-------|
| **Batch 1 — P0** (deploy + secure + index) | BAI-DEPLOY-12, 13, 17, 18 + BAI-SEC-12, 13, 14, 15, 16, 21 + BAI-IDX-12, 13, 16, 17 | ~12h | 15% → ~40% | 48 ساعة |
| **Batch 2 — P0/P1** (CI gates + content + UX) | BAI-DEPLOY-14..16 + BAI-SEC-17, 20 + BAI-IDX-14..22 + BAI-LINK-01..06 + BAI-CONTENT-01..03, 08 + BAI-SCHEMA-01..05 + BAI-DESIGN-01..08 + BAI-A11Y-01..05 + BAI-PERF-02 + BAI-ARCH-05 + BAI-MEAS-01..03 + BAI-GROWTH-01, 05 | ~200h | 40% → ~60% | أسبوعان |
| **Batch 3 — P2** (clusters + perf + arch) | BAI-CONTENT-04..07 + BAI-DESIGN-03, 05, 07 + BAI-PERF-03..06 + BAI-ARCH-01..04 + BAI-SEC-18, 19 + BAI-MEAS-04 + BAI-GROWTH-02..04 | ~200h | 60% → ~80% | 90 يومًا |
| **Batch 4 — مراقبة** (تuning أسبوعي) | إعادة BAI-MEAS-* + BAI-IDX-20 + tuning بناءً على GSC | ~10h/أسبوع | 80% → 85% (السقف) | مستمر |

**ملاحظة:** البرومبتات مُرتَّبة بـ (الأثر × الثقة) ÷ الجهد، لكن التبعيات تفرض ترتيبًا: BAI-DEPLOY-12 أولًا (يحرّر كل الإصلاحات الأخرى)، BAI-SEC-13 (تدوير مفتاح Gemini) قبل أي deploy آخر، BAI-DEPLOY-13 (Cloudflare purge) بعد BAI-DEPLOY-12.
