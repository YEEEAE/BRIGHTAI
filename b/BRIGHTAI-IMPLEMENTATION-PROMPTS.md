# برومبتات تنفيذ تدقيق BRIGHTAI

> جُمعت جميع البرومبتات التنفيذية الواردة في `BRIGHTAI-AUDIT-REPORT.md` في هذا الملف لتسهيل نسخها وتنفيذها بالتتابع. يُفضّل تنفيذ كل برومبت في فرع وcommit مستقلين، مع الالتزام بمعايير القبول والتحقق والتراجع المرفقة.

## ترتيب التنفيذ

1. **P0:** تثبيت خط الأساس، معالجة الفهرسة، القياس الفعلي، وتنظيف التقارير الثقيلة.
2. **P1:** إزالة الملفات المولدة، توحيد تعليمات الوكلاء، إزالة تكرار الأصول، وتصحيح حقيقة مزود Kernel.
3. **K1–K7:** تطوير تجربة Kernel تدريجياً بعد تثبيت خط الأساس.
4. **P2:** الروابط الداخلية و`hreflang` وCore Web Vitals.
5. **P3:** تنظيم السكربتات والجذر.

---

# أولاً: برومبتات Kernel

## K1 — عقد التجربة وبنية المعلومات

**الهدف:** تحويل `/kernel/` من مجموعة لوحات إلى رحلة مترابطة: اختيار قطاع ← سيناريو ← تشغيل آمن ← تفسير القرار ← evidence ← CTA.

**الملفات المستهدفة:**
- `src/pages/kernel/index.astro`
- `src/data/kernel.ts`
- `src/components/kernel/*`
- `src/layouts/KernelLayout.astro`

**البرومبت:**

```text
حلّل مسار Kernel الحالي دون حذف وظائف. صمّم بنية معلومات عربية RTL أولاً من خمس مراحل: onboarding، اختيار سيناريو سعودي، تشغيل تفاعلي، تفسير policy/evidence، ثم CTA للمبيعات. استخدم المكونات الحالية وافصل المحتوى التجريبي بوسم واضح. لا تدّع امتثالاً قانونياً كاملاً. أضف اختبارات browser للمسار الرئيسي والجوال.
```

**معايير القبول:**
- اكتمال الرحلة بلوحة المفاتيح ومن دون مسارات مسدودة.
- يحمل CTA القيم `scenario` و`sector` و`riskBand` دون PII.
- لا يوجد overflow عند عروض 320 و375 و544 و1024px.

**التحقق:**

```bash
pnpm build && pnpm seo:all && node scripts/playwright/<kernel-journey-test>.mjs
```

---

## K2 — ربط Live Sandbox بالـ API الحقيقي

**الهدف:** إزالة التناقض بين fake streaming و`/api/ai/chat`.

**الملفات المستهدفة:**
- `src/pages/kernel/chat.astro`
- `src/pages/api/ai/chat.ts`
- `src/data/kernel-system-prompts.ts`
- `src/lib/redis.ts`
- `src/lib/ratelimit.ts`
- `src/lib/usagetracker.ts`

**البرومبت:**

```text
اربط composer في src/pages/kernel/chat.astro بـ /api/ai/chat عبر SSE مع fallback بصيغة JSON. استخدم promptId من allowlist فقط، وsession UUID، وحالات loading وerror وdegraded، وإلغاء الطلب. لا تعرض provider ثابتاً؛ اعرض المزود من response metadata. ميّز seed/demo عن live، ولا تسجل النص أو PII.
```

**معايير القبول:**
- يعمل streaming بصورة صحيحة.
- لا يرسل Enter الرسالة أثناء CJK composition.
- حد 4000 حرف ظاهر للمستخدم.
- أخطاء 403 و429 و502 و503 لها رسائل آمنة.
- لا توجد secrets في client bundle.
- يعمل إلغاء الطلب.

**التحقق:**

```bash
pnpm test:chat-session && pnpm test:csrf && pnpm build
# ثم شغّل اختبار Playwright لمساري SSE وJSON.
```

---

## K3 — Firewall قبل النموذج

**الهدف:** جعل وعد PII/policy قابلاً للإثبات قبل استدعاء provider.

**الملفات المستهدفة:**
- `packages/firewall-detectors/src/*`
- `src/pages/api/ai/chat.ts`
- `src/pages/kernel/chat.astro`
- `src/data/kernel-system-prompts.ts`

**البرومبت:**

```text
أدخل pipeline حقيقياً قبل Groq/Gemini بالترتيب التالي: normalize ثم PII detectors ثم policy decision ثم allow/redact/block/require_approval. أعد findings آمنة ومختصرة وtrace ID فقط. لا ترسل النص المحظور إلى provider. أضف اختبارات عربية وإنجليزية وحدوداً مضادة لـ prompt injection.
```

**معايير القبول:**
- لا يصل blocked payload إلى mock provider.
- تكون redaction حتمية وقابلة لإعادة الاختبار.
- تشمل اختبارات detectors رقم الهاتف السعودي والهوية الوطنية والبريد الإلكتروني.
- لا تحتوي logs على محتوى الرسائل.

**التحقق:**

```bash
pnpm --filter @brightai/firewall-detectors test && pnpm test:chat-session
```

---

## K4 — Sandbox isolation والحدود

**الهدف:** تقديم تجربة عامة آمنة وقابلة للبيع.

**الملفات المستهدفة:**
- `src/pages/api/ai/chat.ts`
- `src/lib/ratelimit.ts`
- `src/lib/redis.ts`
- `packages/config/src/*`
- الاختبارات تحت `scripts/` أو workspace المناسب.

**البرومبت:**

```text
طبّق quota يومية لكل IP/session مع sliding window موزع، وcap للتكلفة/tokens، وTTL، وcircuit breaker، وabuse signals، وRetry-After. لا تستخدم in-memory كضمان إنتاجي صامت؛ اعرض degraded state وأوقف العمليات المكلفة عند غياب Redis في production.
```

**معايير القبول:**
- الحدود متسقة عبر replicas.
- يوجد اختبار race.
- لا تنمو المفاتيح دون حد.
- تستخدم كل الاستجابات `no-store`.
- يوجد rollback flag موثق.

**التحقق:**

```bash
pnpm test:chat-session && pnpm verify:all
```

---

## K5 — Evidence story ونتيجة قابلة للمشاركة

**الهدف:** نقل المستخدم من «محادثة» إلى «قيمة حوكمة».

**الملفات المستهدفة:**
- `src/pages/kernel/evidence.astro`
- `src/pages/kernel/audit.astro`
- `src/pages/kernel/reports.astro`
- `src/components/kernel/*`
- `src/data/kernel.ts`

**البرومبت:**

```text
أنشئ summary بعد كل تجربة يتضمن القرار، والمخاطر، والبيانات المحجوبة، والسياسة، وprovider، وlatency، وtrace chain. أضف export آمناً redacted ومشاركة URL غير قابلة للتخمين وذات TTL، دون PII. اجعل report مثالاً واضحاً لا شهادة امتثال.
```

**معايير القبول:**
- trace متسق بين chat وaudit وevidence.
- لا يحتوي export على prompt الخام.
- إمكانية الوصول وRTL صحيحان.

**التحقق:**

```bash
pnpm build && node scripts/playwright/<kernel-evidence-flow>.mjs
```

---

## K6 — Analytics وqualified CTA

**الهدف:** قياس activation دون انتهاك الخصوصية.

**الملفات المستهدفة:**
- `src/components/MarketingScripts.astro`
- `src/components/kernel/KernelLeadForm.astro`
- `src/pages/api/lead.ts`
- `src/pages/kernel/*.astro`

**البرومبت:**

```text
عرّف event taxonomy تشمل kernel_started وscenario_selected وmessage_allowed وmessage_blocked وevidence_viewed وlead_submitted. أرسل metadata غير حساسة فقط. اربط lead بالسياق المجمع لا بالنص. أضف consent gating وdedupe.
```

**معايير القبول:**
- لا يرسل analytics أي prompt أو PII.
- تُرسل الأحداث مرة واحدة.
- يمكن حساب funnel report.
- يظهر CTA بعد لحظة القيمة لا قبلها.

**التحقق:**

```bash
# شغّل Playwright intercept لطلبات analytics، ثم:
pnpm test:csrf && pnpm build
```

---

## K7 — بوابة إصدار Mobile وAccessibility وPerformance

**الهدف:** تقديم تجربة عالمية على الجوال.

**الملفات المستهدفة:**
- `kernel/assets/css/kernel.css`
- `kernel/assets/css/pages/*.css`
- `src/pages/kernel/*.astro`
- `.lighthouserc.json`

**البرومبت:**

```text
اختبر وأصلح عروض 320 و375 و544 و768 و1024px، وkeyboard/focus/ARIA، وmixed bidi، وإعلانات streaming لقارئات الشاشة، وreduced motion، وأهداف اللمس بحجم لا يقل عن 44px. لا تغيّر budgets لكي تنجح الاختبارات؛ أصلح السبب.
```

**معايير القبول:**
- لا يوجد horizontal overflow.
- لا توجد مشكلات axe بدرجتي serious أو critical.
- `LCP ≤ 2.5s`.
- `INP ≤ 200ms`.
- `CLS ≤ 0.1`.
- JavaScript المنقول لا يتجاوز 200KB وفق budget المشروع.

**التحقق:**

```bash
pnpm build
# ثم شغّل Lighthouse CI على dist الصحيح، وPlaywright screenshots، وaxe.
```

---

# ثانياً: برومبتات الإصلاح والتنظيف حسب الأولوية

## P0-1 — تثبيت baseline ومنع الحذف الخاطئ

**البرومبت:**

```text
أنشئ branch تنفيذية. سجّل git status وgit ls-files وhashes والأحجام. شغّل pnpm install --frozen-lockfile وpnpm build وpnpm seo:all وpnpm verify:all وpnpm typecheck وpnpm test. لا تبدأ التنظيف قبل تثبيت baseline. خزّن outputs كـ CI artifacts لا كملفات متتبعة في git.
```

**معايير القبول:**
- جدول pass/fail يحتوي exit codes.
- لا توجد تغييرات generated غير مفهومة.

**التحقق:**

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm seo:all
pnpm verify:all
pnpm typecheck
pnpm test
# بعد كل أمر يفترض أن يكون للقراءة فقط:
git diff --exit-code
```

**التراجع:** استخدم `git restore` للملفات المولدة فقط وبعد مراجعة diff.

---

## P0-2 — تصحيح indexability المتعارضة

**البرومبت:**

```text
راجع src/pages/thank-you/index.astro وsrc/pages/kernel/offline.astro وsrc/pages/offline/index.astro وsrc/pages/customers/{bank,hospital,pharma}/index.astro وsrc/pages/design/*.astro وredirects.json وrender.yaml وastro.config.mjs. عرّف لكل route حالة واحدة: index أو noindex أو redirect. اجعل thank-you وoffline بقيمة noindex، واجعل utility design بقيمة noindex ما لم يوجد هدف بحثي مثبت. أصلح /en/index.html ليحوّل إلى /en/ إن كان المسار الإنجليزي مقصوداً.
```

**معايير القبول:**
- لا يوجد URL في sitemap يحمل `noindex` أو redirect.
- لا توجد redirect chains.
- كل route يعيد status صحيحاً.

**التحقق:**

```bash
pnpm build && pnpm seo:all && pnpm redirects:check
```

**التراجع:** اعكس commit واحداً مخصصاً لتغييرات indexability.

---

## P0-3 — تدقيق SEO على الناتج الفعلي لكل dynamic route

**البرومبت:**

```text
بعد build، ازحف إلى كل HTML في dist/client، بما يشمل 33 صفحة blog و30+ صفحة docs وsolution sector/city/slug وصفحات authors/categories/hub. احسب uniqueness لكل من title وdescription، وافحص canonical وhreflang reciprocity وschema وword count وinternal depth وsitemap. لا تحكم على [slug].astro بالنص الخام فقط.
```

**معايير القبول:**
- حفظ CSV/Markdown artifact خارج git.
- لا توجد canonical مكررة.
- لا توجد صفحة indexable يتيمة.
- كل hreflang target يعيد 200 ويملك self-canonical.

**التحقق:**

```bash
pnpm build && pnpm seo:all && pnpm seo:hreflang && pnpm seo:link-graph
```

**التراجع:** لا تعدّل الملفات في مرحلة القياس؛ نفّذ إصلاح كل page family في commit مستقل.

---

## P0-4 — تنظيف التقارير الثقيلة

**البرومبت:**

```text
انقل report/A/perf/*.report.{html,json} وaudit/evidence/a11y-report.json وaudit/INTERNAL-LINKS.csv والـ screenshots الكبيرة إلى CI/release storage. أبقِ summaries صغيرة فقط. وحّد report/ وreports/ و_reports/ وaudit/ في سياسة retention موثقة.
```

**معايير القبول:**
- انخفاض tracked bytes بنسبة لا تقل عن 50% دون فقد generator أو summary.
- لا يعتمد build أو SEO على الملفات المنقولة.

**التحقق:**

```bash
# افحص كل path باستخدام git grep قبل النقل، ثم:
pnpm verify:all && pnpm build
```

**التراجع:** أنشئ tag قبل النقل وmanifest بقيم SHA-256، ثم اختبر استعادة artifact واحدة على الأقل.

---

## P1-1 — إزالة generated files من git

**البرومبت:**

```text
افحص .astro/* وsitemap.xml وpublic/sitemap.xml. اختر مصدراً واحداً للـ sitemap يطابق deployment. استخدم git rm --cached للملفات المولدة فقط، وحدّث .gitignore وbuild script. لا تحذف sitemap المنشور من output.
```

**معايير القبول:**
- يولّد clean checkout ملف sitemap يضم 176 URL أو العدد المتوقع الجديد.
- تعمل روابط sitemap في robots.txt.

**التحقق:**

```bash
pnpm sitemap:generate && pnpm build && pnpm seo:all
```

**التراجع:** استعد الملفات من commit السابق وأعد tracking عند الحاجة.

---

## P1-2 — brain v3 المختصر

**البرومبت:**

```text
أعد بناء .agents/brain.md وفق الأقسام العشرة المحددة في تقرير التدقيق. حوّل AGENTS.md وCLAUDE.md و.agents/AGENTS.md و.clinerules/H.md و.roo/rules/y.md إلى adapters قصيرة. انقل worklog التاريخي إلى archive index. لا تفقد أي قاعدة فريدة؛ أنشئ source-to-target matrix.
```

**معايير القبول:**
- حجم hot context لا يتجاوز 230KB.
- لا توجد قواعد متعارضة.
- كل adapter يشير إلى brain.
- تكرارات hash تساوي صفراً لهذه المجموعة.

**التحقق:**

```bash
# شغّل script يقارن inventory العناوين والقواعد، ثم:
pnpm verify:all
```

**التراجع:** احتفظ بـ snapshot نصي فقط وcommit مستقل؛ لا تضف tarball إلى git.

---

## P1-3 — إزالة تكرار الأصول

**البرومبت:**

```text
استخدم مجموعات SHA-256 لتوحيد OG وlogo وfont وfavicon. حدّث كل مراجع src وCSS وschema وmanifest إلى canonical paths قبل حذف النسخ. لا تغيّر الأبعاد أو format دون اختبار CLS.
```

**معايير القبول:**
- لا توجد مراجع مكسورة.
- أزيلت النسخ الزائدة في مجموعات التكرار.
- visual snapshots ثابتة.

**التحقق:**

```bash
pnpm build && pnpm seo:all && pnpm links:dist
```

**التراجع:** استخدم commit مستقلاً للأصول مع إمكانية استعادة المسارات السابقة.

---

## P1-4 — Kernel provider truth

**البرومبت:**

```text
أصلح التعارض بين NVIDIA الثابت في src/pages/kernel/chat.astro وGroq/Gemini في src/pages/api/ai/chat.ts. اختر source of truth واحداً من response metadata؛ لا تعرض configured أوmodel أوmode بصورة وهمية. حدّث kernel/README.md ليصف الحالة الحالية فقط.
```

**معايير القبول:**
- يطابق UI المزود الفعلي.
- المحتوى التجريبي موسوم بوضوح.
- لا تظهر secrets.
- لا تشير الوثائق إلى ملفات محذوفة على أنها حالية.

**التحقق:**

```bash
pnpm test:chat-session && pnpm build
# ثم اختبر التدفق في browser.
```

**التراجع:** استخدم feature flag يعيد UI إلى read-only دون تعطيل endpoint.

---

## P2-1 — إصلاح الروابط الداخلية صفحةً صفحة

**البرومبت:**

```text
عالج الصفحات ذات الروابط المصدرية القليلة: legal وevents وnewsletter وصفحات kernel الفرعية وsales-deck. أضف روابط سياقية طبيعية لا sitewide spam، وأضف Breadcrumb صالحاً. افحص أن crawl depth لا يتجاوز ثلاث نقرات للصفحات التجارية.
```

**معايير القبول:**
- لا توجد صفحات يتيمة.
- لكل صفحة تجارية ثلاثة روابط واردة ذات صلة على الأقل.
- لا يوجد تكرار مصطنع في anchor text.

**التحقق:**

```bash
pnpm internal-links:audit && pnpm seo:link-graph
```

---

## P2-2 — سياسة hreflang السعودية

**البرومبت:**

```text
وثّق ما إذا كانت الإنجليزية en-SA أم en. طبّق reciprocal pairs فقط عند وجود ترجمة مكافئة، وأضف x-default للصفحات المناسبة. لا تربط صفحة إنجليزية بصفحة عربية غير مكافئة.
```

**معايير القبول:**
- تحقق reciprocity بنسبة 100% لكل الأزواج المعلنة.
- تعيد جميع targets حالة 200.
- canonical الخاص بكل locale صحيح.

**التحقق:**

```bash
pnpm seo:hreflang && pnpm seo:all
```

**التراجع:** اعكس commit الخاص بـ `hreflang` فقط.

---

## P2-3 — دليل Core Web Vitals حقيقي

**البرومبت:**

```text
أصلح .lighthouserc.json ليشير إلى output الصحيح في dist/client ولا تستخدم staticDistDir بقيمة نقطة. شغّل قياسات lab على representative templates، واستخدم PSI/CrUX إن توفرت حركة مرور كافية. افصل نتائج lab عن field data.
```

**معايير القبول:**
- `LCP ≤ 2.5s`.
- `INP ≤ 200ms`.
- `CLS ≤ 0.1` عند p75 حيث تتوفر field data.
- لا تستخدم FID في القياس أو التقرير.

**التحقق:**

```bash
# شغّل Lighthouse CI، ثم agent-browser vitals أو PSI واحفظ الناتج كـ artifact.
```

**التراجع:** لا تخفّض thresholds؛ اعكس تغيير الإعداد إذا كان output path غير صحيح.

---

## P3-1 — تنظيم scripts والجذر

**البرومبت:**

```text
صنّف 177 ملفاً في scripts/ إلى production وCI وmigration وone-off وarchived. انقل qa-*.mjs إلى scripts/qa/. لا تحذف script لمجرد عدم استيراده؛ افحص package.json وGitHub Actions والوثائق واستدعاءات shell.
```

**معايير القبول:**
- لكل script مالك وغرض وentrypoint موثق.
- الجذر خالٍ من ملفات QA المؤقتة.
- لا يوجد command مكسور.

**التحقق:**

```bash
# استخرج كل script المشار إليه في package.json وCI، ثم شغّل smoke matrix عليها.
```

**التراجع:** حافظ على التاريخ باستخدام `git mv` ونفّذ النقل في commit واحد.
