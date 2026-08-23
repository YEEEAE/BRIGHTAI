# Gate 0 — حقيقة الإنتاج + خطوات الإصلاح (P0-A و P0-B)

> **التاريخ:** 2026-08-24 (فحص حي مباشر — curl/WebFetch لعناوين brightai.site)
> **الحالة:** PHASE 2 ما تبدأ توسّع كيان إلا بعد إغلاق هذين الـ P0
> **الالتزام:** لا يوجد أي تغيير إنتاجي من الوكيل — كل الخطوات الخارجية عليك

---

## الزبدة

الإنتاج الحالي **يقدّم الملفات الثابتة فقط** بدون طبقة سيرفر النود:

- المحتوى الثابت محدّث وشغال (آخر صفحة agentic منشورة، sitemap = 261 URL، كل الصفحات الاستراتيجية 200 ✅)
- لكن **طبقة سيرفر النود ميتة**: `/api/health/` يرجع 404، هيدر `x-brightai-build` غير موجود نهائيًا، وكل التحويلات القديمة 404
- و**كتلة Cloudflare المانعة لزواحف AI ما زالت حية** في robots.txt

الاثنين أسبابهم خارج الريبو (إعدادات لوحات)، والأدلة تحت.

---

## جدول الـ Drift (REPO vs LIVE vs EXPECTED)

| # | البند | REPO (المتوقع) | LIVE (المتحقق 2026-08-24) | ROOT CAUSE | الإصلاح |
|---|------|----------------|---------------------------|------------|---------|
| 1 | robots.txt | مفتوح بالكامل: `Allow: /` لكل الزواحف + `Content-Signal: ai-train=yes` (103 سطر، صفر Disallow) | **164 سطر** فيه كتلة `# BEGIN Cloudflare Managed content` تمنع 9 زواحف (GPTBot, ClaudeBot, Google-Extended, CCBot, Bytespider, Applebot-Extended, Amazonbot, meta-externalagent, CloudflareBrowserRenderingCrawler) + `Content-Signal: ai-train=no` متناقضة | إعداد **Cloudflare AI Crawl Control** يحقن الكتلة على مستوى الـ edge — مو من الريبو | خطوات P0-A تحت 👇 |
| 2 | التحويلات القديمة (209 قاعدة) | سيرفر النود يرجع 301 (متحقق محليًا: `/services/finance.html` → 301، `/services/kpi-dashboard-guide/` → 301) | `/about.html`, `/services/finance.html`, `/blog/cloude-opus-4.6.html`, `/blog/ai/`, `/services/kpi-dashboard-guide/` كلها **404** | **سيرفر النود ما هو شغال في الإنتاج** — يشوف #3 | خطوات P0-B تحت 👇 |
| 3 | `/api/health/` | **200 + JSON** فيه هوية البناء (متحقق محليًا) | **404** + يرجع صفحة 404.html | نفسه — الإنتاج static-only | خطوات P0-B 👇 |
| 4 | هيدر `x-brightai-build` | موجود على كل رد (من الـ listener المرقّع — BAI-DEPLOY-11) | **غير موجود نهائيًا** (فحصنا الرئيسية و404s) | نفسه | خطوات P0-B 👇 |
| 5 | llms.txt / ai.txt (الكيان) | النسخة الموحّدة (X + LinkedIn + GitHub، بدون TikTok/Crunchbase) | ✅ **النسخة الجديدة منشورة** (تحقق حي) | — | لا شيء |
| 6 | sitemap.xml | 261 URL | ✅ **261 URL** (يشمل agentic + tools + hub/security) | — | لا شيء |
| 7 | الصفحات الاستراتيجية الست + الجديدة | 200 | ✅ كلها **200** | — | لا شيء |
| 8 | canonical/دومين | `https://brightai.site/<path>/` | ✅ (www→apex وslash normalization = 301) | — | لا شيء |

**الاستنتاج الحاسم:** الـ dist المحلي (مبني من 6bbea1c6) سليم ومتحقق منه: `/api/health/` = 200 محليًا، التحويلات 301 محليًا، الهيدر موجود محليًا — بينما الإنتاج يعمل بـ static-only. يعني **الكود صح والإعداد الإنتاجي هو المخطئ**.

---

## 🔴 P0-A — خطوات Cloudflare (الروبوتات المانعة لزواحف AI)

**الهدف:** إزالة كتلة `Cloudflare Managed content` من robots.txt الحي + توحيد Content-Signal.

1. ادخل لوحة Cloudflare ← اختر نطاق **brightai.site**
2. من القائمة الجانبية: **AI Crawl Control** (تحت Security أو AI — حسب نسخة لوحتك، ممكن تحت "AI & Bots" أو "Security → Bots")
3. بتلاقي خيارين:
   - **AI Crawl Control / Managed robots.txt**: فعّل خيار السماح (أو عطّل الميزة كاملة) — المطلوب النهائي: **ما يحقن Cloudflare أي كتلة** في robots.txt
   - إذا فيه تبويب "AI training"/"AI search and foundation models": اختر **Allow** للاثنين (القرار الموثق عندك: فتح كامل — `SEO-CRAWLER-POLICY-002`)
4. راجع صفحة **Robots.txt** (حسب النسخة: Caching → Configuration أو SEO tools) لو فيه إعدادات Managed إضافية — عطّلها
5. **Purge cache**: Caching ← Configuration ← Purge Everything (كتلة robots تتحفّظ على الـ edge ~4 ساعات — بدون purge ممكن تشوف النسخة القديمة فترة)
6. التحقق (سويه بعد 5 دقائق):
   ```bash
   curl -s https://brightai.site/robots.txt | grep -c "Cloudflare Managed"
   # المطلوب: 0
   curl -s https://brightai.site/robots.txt | grep "ai-train"
   # المطلوب: ai-train=yes فقط (سطر واحد — حقنا)
   ```

> **ليش مهم:** هذي أقوى تفسير موثق لغياب الموقع عن ChatGPT/Claude/Gemini grounding — الزواحف ممنوعة صراحةً. بدون إغلاقها، أي شغل GEO/AI citation ما له معنى.

---

## 🔴 P0-B — خطوات Render (سيرفر النود ما هو شغال)

**الهدف:** رجوع الإنتاج لتشغيل `node ./dist/server/entry.mjs` (كما في render.yaml) بدل التقديم static-only.

**الدليل:** الردود الحية فيها `rndr-id` (من Render) لكن **بدون** `x-brightai-build` وبدون `/api/health/` — يعني الخدمة الفعالة تقدّم `dist/client` كملفات ثابتة، مو سيرفر النود.render.yaml بالريبو ما تغيّر (diff فارغ منذ إصلاح التحويلات) — يعني التغيير صار **مستوى لوحة Render**.

1. ادخل لوحة **Render** ← شوف الخدمات المرتبطة بنطاق **brightai.site**
2. تأكد إن النطاق مربوط بخدمة **Web Service** نوعها Node، وstartCommand:
   ```
   node ./dist/server/entry.mjs
   ```
3. الحالات الشائعة اللي تسبب اللي نشوفه — دوّر على أي واحدة منها:
   - خدمة **Static Site** منفصلة (publish directory = `dist/client`) مربوط فيها النطاق ← النطاق لازم ينتقل للـ Web Service
   - الـ Web Service موجودة لكن النطاق متعلق بها **قديمًا** والحين مخصص لخدمة ثانية
   - startCommand تغيّر من لوحة Render لأمر ثابت (مثل `npx serve`) ← رجّعه `node ./dist/server/entry.mjs`
4. بعد أي تعديل: **Manual Deploy ← Deploy latest commit** (تأكد إن الـ deploy ينجح كامل — عندكم `preDeployCommand: pnpm run verify:deployment-surface`)
5. التحقق بعد الـ deploy:
   ```bash
   curl -s https://brightai.site/api/health/ | head -c 200
   # المطلوب: JSON فيه service/build — مو صفحة 404
   curl -sI https://brightai.site/ | grep -i x-brightai-build
   # المطلوب: x-brightai-build: <commit>
   curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" https://brightai.site/services/finance.html
   # المطلوب: 301 /solutions/banking-ai-governance/
   ```

> **تنبيه:** إذا كان قرارك الاستراتيجي البقاء static-only (أسرع/أرخص)، فالتحويلات لازم تنتقل لطبقة Cloudflare (Bulk Redirects/Redirect Rules) — بس هذا يقتل `/api/*` كاملة (chat, lead, health) ويفقدكم الشغلات الحية. التوصية: رجّعوا سيرفر النود.

> **ملاحظة عن `/about.html` تحديدًا:** حتى بعد تشغيل السيرفر، `/about.html` نفسه بيرجع 404 لأنه **مو ضمن redirects.json** (القواعد الموجودة: `/frontend/pages/about-us/...` → `/about/`). إذا كان `/about.html` URL قديم حقيقي واصلته روابط خارجية، يحتاج قاعدة تضاف للخريطة — قرار منفصل.

---

## ✅ اللي سليم حيًا (ما يحتاج شي)

- الرئيسية + المحاور الست الاستراتيجية + `/hub/agentic-ai-governance/` + `/tools/ai-risk-register/` كلها 200
- sitemap.xml حي = 261 URL مطابق للمحلي
- llms.txt/ai.txt بالكيان الموحّد الجديد (بدون TikTok/Crunchbase)
- www→apex وhttp→https وslash normalization كلها 301 صح
- هيدرات الأمان (HSTS/CSP/permissions-policy) حاضرة على الردود

---

## ترتيب التنفيذ المقترح

1. **P0-A أولًا** (5 دقائق) — فتح الزواحف هو الأعلى أثرًا على AI Search
2. **P0-B ثانيًا** (10–15 دقيقة) — رجوع سيرفر النود يشفي 209 تحويلات + الـ API
3. أعلمني لما تخلّص وأعيد التحقق الحي وأقفل الـ P0s بالتقرير الرئيسي
