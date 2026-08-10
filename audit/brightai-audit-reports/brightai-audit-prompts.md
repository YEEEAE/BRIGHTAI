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

---

# BAI-PERF — Performance


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
