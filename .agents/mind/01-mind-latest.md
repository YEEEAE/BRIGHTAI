# Project Mind — BrightAI

- **2026-10-30 — توضيح مراجع الجهات والمعايير في الهيرو**
  - Changed: استبدلت رسوم TrustBadges بروابط نصية تفسيرية لمراجع SDAIA وNCA ECC وISO/IEC 42001 وSAMA؛ صححت صياغة PDPL في FAQ/Schema وعبارات امتثال القطاعات ووصف PWA، وعطلت أسماء SVG القديمة التي توحي بشهادة واستبعدت مجلدات شارات الجهات من image sitemap.
  - Evidence: طابقت الروابط بصفحات الجهات الرسمية؛ التزمت بإيضاح أن التطبيق النهائي للعميل يعتمد على نطاقه وبيئته وضوابطه وتقييم مستقل.
  - State: PARTIAL — الادعاءات التي جرى تحديدها في الواجهة الرئيسية ووصف PWA عولجت؛ بقية الموقع تحتوي إشارات تنظيمية ومحتوى تعليمي أوسع لم تُراجع دعوىً بدعوى.
  - Key files: `src/components/TrustBadges.astro`; `src/components/SplitHero.astro`; `src/pages/index.astro`; `public/manifest.webmanifest`; `scripts/generate-image-sitemap.mjs`; `public/sitemap-images.xml`.

## [2026-10-30] — مصالحة موافقة التحليلات ودلالات funnel

- Changed: أزلت gtag المبكر من layout legacy، وأصبحت أحداث `unknown` تُهمل ولا تُعاد بعد القبول؛ ترحيل `cookie-consent` صار ثنائي الاتجاه ويحمّل المزودين فقط عند grant.
- Changed: تقييد `page_location` إلى origin+path، وتأجيل قراءة/حفظ UTM حتى grant، وتطبيق allowlist وتنقية email/phone obvious values للعميل والسيرفر.
- Changed: `contact_submit` يخص `contact_main` و`home_cta` بعد قبول مزود FormSubmit وبالموافقة؛ `demo_submit` يخص `kernel_lead` بعد API acceptance ويحمل idempotency event ID. WhatsApp fallback يظل handoff.
- Changed: `lead_created` سيرفر فقط لصف Kernel جديد، مع موافقة header+cookie وGA client ID موجود؛ أزلت client ID الاصطناعي، وقيدت server params بالـallowlist.
- Evidence: `node --check` لملفات JavaScript المعدلة، TypeScript syntax check لـ`analytics.ts` و`ga4-server.ts` و`api/lead.ts`، و`git diff --check` PASS؛ لم تُشغّل suites أو build أو تحقق حساب/DebugView.
- State: PARTIAL — التغييرات محلية؛ قبول FormSubmit النهائي، GA4 config/DebugView وGSC يحتاج تحقق المالك. لا أرقام dashboard أو production موثقة.
- Key files: `public/js/analytics.js`, `src/lib/analytics.ts`, `src/pages/api/lead.ts`, `src/lib/ga4-server.ts`, `audit/seo-recovery/13-ANALYTICS-MEASUREMENT-PLAN.md`.

## [2026-10-30] — ضبط موافقة GA4 ودلالات funnel العملاء

- Changed: جعلت تحميل وتهيئة GA4 وClarity وgrowth providers بعد موافقة التحليلات فقط، مع ترحيل قرار `cookie-consent` legacy في الاتجاهين وإبقاء الإسناد الخالي من البريد/الهاتف.
- Changed: `demo_submit` و`contact_submit` أحداث قبول من المتصفح؛ `lead_created` من السيرفر عند إنشاء صف جديد ومع header موافقة فقط. أضفت `Idempotency-Key` ثابتًا عبر retry/refresh لنموذج Kernel، وأوقفت تسجيل WhatsApp fallback كتحويل.
- Changed: أزلت تهيئة GA4 غير المشروطة من الصفحات المستقلة/الإدارية و500، وأزلت ازدواج server `chat_completed` مع حدث المتصفح.
- Evidence: `node --check` لسكريبتات analytics وClarity وKernel form و`src/scripts/lead-form-handler.js`، و`git diff --check` PASS؛ `astro check` BLOCKED بسبب Corepack cache permission وغياب `@astrojs/check`؛ لم يُشغّل build أو suite أو تحقق GA4 حي.
- State: PARTIAL — التغييرات محلية؛ صلاحية الحساب وDebugView وGSC تحتاج مالك الحساب.
- Key files: `public/js/analytics.js`, `public/js/clarity-init.js`, `src/pages/api/lead.ts`, `public/js/kernel-lead-form.js`, `audit/seo-recovery/13-ANALYTICS-MEASUREMENT-PLAN.md`.

## [2026-10-30] — تقليل حفظ بيانات نماذج العملاء

### تم التنفيذ
- أزلت حفظ واستعادة قيم الحقول من `sessionStorage`؛ القيم تبقى ضمن النموذج أثناء الجلسة فقط.
- أضفت تنظيف مفتاح المسودة القديم الخاص بكل نموذج عند التهيئة وعند نجاح الإرسال.
- حصرت `landing_page` على المسار فقط، ورحّلت القيمة القديمة لإزالة query/hash، وخفّضت `referrer` إلى hostname.
- أبقيت حقول UTM المستقلة، وحالة تذكّر الإرسال، والتحقق، والموافقة، وعقد الإرسال دون تغيير.

### الملفات المتأثرة
- `src/scripts/lead-form-handler.js`
- `src/components/LeadForm.astro`

### التحقق
- `node --check src/scripts/lead-form-handler.js` PASS
- مراجعة يدوية لمواضع التخزين والقياس والإرسال؛ لم تُشغّل اختبارات آلية حسب نطاق المهمة.

### النتيجة
- **الحالة:** DONE محليًا؛ لا يثبت ذلك النشر أو تحققًا حيًا.
- **مختصر:** لا تُحفظ قيم حقول lead أو تُستعاد من تخزين المتصفح، وتُزال مسودة legacy الخاصة بالنموذج.

### ملاحظات / مشاكل مفتوحة
- لم يُنفذ commit أو push أو deploy.

---

## Current State / Invariants — 2026-09-18

- المشروع الحالي: الموقع `src/` و`packages/`، وهوية **BrightAI — Saudi AI Safety OS**، domain `https://brightai.live`، السوق السعودية واللغة الأساسية ar-SA. معلومات الأرشيف عن brightai.site أو apps لا تمثل الحالة الحالية.
- `apps/dashboard` و`apps/qc-task-manager` حُذفا بقرار المالك في2026-09-08. لا تستعد التطبيقات أو قواعد صلاحيات QC التاريخية من الأرشيف تلقائيًا.
- Node22.x، packageManager pnpm10.19.0؛ البيئة المقاسة Node22.22.3. Astro hybrid مع node standalone، وRender هدف النشر الحالي من render.yaml. لا تعديل إصدارات تلقائي.
- `PASS ≠ RELEASED`: التعديلات الأخيرة محلية؛ لا commit/push/merge/deploy إلا طلب صريح يغطي العملية. تغييرا AGENTS.md و.agents/AGENTS.md وunslop سابقان للمهمة ولم نعدلهما.

## SEO / Indexation / Language

- sitemap الحالي264 canonical URL؛ central generator مع lastmod مستمد منGit ومحتوى حقيقي، وليس وقت build. حافظ على percent encoding وtrailing slash. وجود URL في sitemap لا يثبت Google indexation.
- utilities العشرة خارج sitemap بقرار2026-09-10، مع بقاء index,follow فيHTML بقرار المالك. لا تضف noindex أوDisallow go لعلاج score. query-variant self canonicals في patch-server-entry قرار صريح محفوظ.
- سبعة أزواج hreflang حقيقية ar-SA/en-SA/x-default فقط؛ لا ترجمات أو أزواج EN وهمية. المدن غير الرياض Service فقط، لا فروع LocalBusiness مخترعة.
- مالك «شركات الذكاء الاصطناعي في السعودية» مقال `/blog/best-ai-companies-saudi-2026/`، والرئيسية SECONDARY كيان/governance. CANN-02/action queue والمولد تطابق القرار الآن.
- PDPL العام مالكه الموجود `/pdpl-statement/` محفوظ؛ live keyword intent informational وSERP cached2026-07-08 رشحا docs للمراجعة، لا لنقل الملكية بلا GSC. «إدارة المخاطر pdf» VALIDATE حتى وجود PDF مطابق فعليًا؛ لا وعد تنزيل وهمي.
- لا صفحات SEO أوmerge أوcanonical/title migrations في مهمة2026-09-18؛ إعادة استخدام المالكيـن الحاليين أساس الاستراتيجية.
- DocsLayout يوضح الجاهزية والمراجعة وحدود الادعاء بدل «توافق كامل» أوضمان شهادة/تدقيق؛ masking ليس encryption. لا تحول مواءمة أو استراتيجية تاريخية إلى اعتماد أو شراكة أوقدرة منتج مثبتة.

## Analytics / AI Search

- GA4 `G-9LMB4PGTWJ` ومزودو القياس المشروطون يُحمّلون بعد موافقة `granted` عبر `public/js/analytics.js`/`clarity-init.js`؛ legacy `cookie-consent` يهاجر إلى المفتاح المعتمد. يظل الوضع الحي/DebugView غير متحقق.
- سياق events يحفظ attribution ضمن sessionStorage وأولوية UTM، ويتعرف على chatgpt/perplexity/gemini/copilot/claude وmedium ai_referral عند غياب UTM وإسناد سابق؛ hostname فقط بلا conversation/query. source/medium event fields لا تعيد كتابة GA4 session source تلقائيًا.
- GA4 custom/session mapping وDebugView واكتساب AI الفعلي NOT VERIFIED؛ يجب التحقق بعد نشر مفوض. CTA/WhatsApp click وform attempt ليست lead؛ المتصفح يرسل form-specific accepted event، والسيرفر يرسل `lead_created` للصف الجديد فقط عند موافقة صريحة. لا تجمع الحدثين كتحويلين. PII allowlist محفوظة.
- robots: search/citation/user-fetch Allow مع api exclusions؛ training Disallow. Cloudflare account/WAF/managed overrides NOT VERIFIED. لا تعكس منع التدريب بناء على نتائجHTTP تاريخية.
- Keyword.com domain7692 موجود لكن0 prompts/0 executions؛ AI mention/citation rates=N/A،N=0. panel72prompt(64AR+8EN) فيaudit/seo-growth-2026/09؛NOT_RUN،مع بروتوكول ثابت ومقامات في10. لاAIrank مختلق.

## Testing / Evidence — 2026-09-18

- build/typecheck/seo:all/seo:gate/seo:schema/seo:hreflang/internal-links:audit/redirects:check/test PASS؛ unit16+29+38،AI referral4/4 وanalytics measurement4/4. rendered264/264؛problems المحددة0،broken0/orphans0/depth3/missingalt0. الدليل الحالي فيaudit/seo-growth-2026/evidence.
- ميزانيةgzip PASS: homepage31.71KB/CSS28.20KB/AstroJS40.49KB؛ ليستCWVأوإثبات سرعة الإنتاج. typecheckpackages ليسfullAstrocheck؛schemaبوابةالمشروعليسGoogleeligibility.
- المتصفح المدمج فتح دليل الموافقات المنشور القديم. عرض النسخة المعدلة محليًا على الجوال BLOCKED—timeout للعنوان المحلي؛ HTML النهائي فُحص. Live full-site HTTP/CWV/GSC inspection NOT VERIFIED.

## Open Issues / Access

- GSC Wizard payment_required؛Semrush no_api_units؛Ahrefs plan restriction؛SE Ranking projects[]؛لاGSC/GA4/backlink live. لاشراء أوتغيير حساب دون تفويض.
- baseline المستخدم87 impressions/0clicks،SA23/position35.52،US35/4.37،indexed207/notindexed76،أسباب59/4/7/3/3 بلا فترة أوURLs؛user-supplied undated،لاcurrentmetricclaim. لايمكن تعيين264URL لأسبابGSCبالتخمين.
- Ubersuggest geo2682=Saudi Arabia موثق؛2840=US. الاستدعاءcountrySA الأول أعادCTA2840 فُعزل. Saudi estimates موثقة باستدعاءاتexplicitlocId2682؛غيابmetricsNULL،صفرمزودليسno-demand. SERP governance/platform09-18fresh،PDPL07-08cached.
- Astro static route collision warnings بالbuild؛بواباتحاليةPASS لكنخطرترقيةيتطلبجردredirects/routes. CI workflows مازالتتشير إلىappsالمحذوفة؛لمتُغيرفيهذهالمهمة.
- لاlivebacklinkauthority أوAIresponsebaseline؛لاoutreachمرسل. يلزمexportGSC/GA4وinspectionومراجعةمختص وتفويضنشر ثمrecrawl لقياس الأثر.

## Recent Changes / Historical Ledger

- **2026-10-30 — Analytics consent and funnel semantics**
  - Changed: GA4 now loads after consent; browser owns accepted form events, while server `lead_created` fires once for a newly inserted row with explicit consent; Kernel retries reuse an idempotency key.
  - Evidence: targeted syntax checks and diff hygiene PASS; Astro check BLOCKED (Corepack cache permission; local `@astrojs/check` absent); GA4 account/DebugView and deployment remain NOT VERIFIED.
  - State: PARTIAL.
  - Key files: `public/js/analytics.js`; `src/pages/api/lead.ts`; `audit/seo-recovery/13-ANALYTICS-MEASUREMENT-PLAN.md`.

- **2026-09-18 — SEO-GROWTH-2026 / بحث سعودي وظهور AI**
  - Changed: assistant referral recognition،مصفوفةموافقاتوقالب،حدودclaimsفيDocsLayout،تصحيحCANN-02ومولده،17مخرجaudit و72prompt ثابتة.
  - Evidence: بواباتمحليةPASS؛rendered264/264؛AI/measurement8/8. قياسGSC/GA4/AIردودمتعذروغيرمختلق.
  - State: PARTIAL — التنفيذ المحلي DONE،القياسالخارجي BLOCKED.
  - Key files: audit/seo-growth-2026/FINAL-SEO-AEO-GEO-REPORT.md؛src/layouts/DocsLayout.astro؛public/js/analytics.js؛src/lib/analytics.ts.
- **2026-09-18 — MIND-ROLLOVER**: نقلت سجلات01 الأقدم من مجموعة09-10 إلى02 بعد التحقق من حفظها نصيًا؛دمجت القرارات الفعالة والمشاكل المفتوحة أعلاه. سجلات09-10 أدناه HISTORICAL،وأرقامفحوصها ليستfresh.

## [2026-09-10] — خطة الأصول القابلة للربط والعلاقات الرقمية (14)

### تم التنفيذ
- راجعت التداخل مع الأصول الحالية، وقررت تحسين 5 ملاك موجودين بدل إنشاء صفحات مكررة: خريطة SDAIA/NCA/PDPL، سجل مخاطر AI، سياسة استخدام AI، مصفوفة الموافقة البشرية، وISO/IEC 42001 readiness.
- أضفت لكل أصل owner canonical، المؤلف المؤسسي، تاريخ مراجعة 2026-09-10، مصادر أولية، شروط تنزيل، ربطًا داخليًا، ومسارًا تجاريًا غير إعلاني.
- أنشأت قائمة 15 prospect في السعودية والمنطقة مع نوع الجهة، الملاءمة، شرعية التحرير، قناة الاتصال، تطابق الأصل، وحالة عدم التواصل.
- أنشأت خطة Digital PR لمدة 90 يومًا بهدف أولي هو 10 referring domains مؤهلة بروابط مكتسبة تحريريًا، مع استبعاد PBNs وlink farms والروابط المدفوعة وsitewide.
- وثّقت أن أرقام `Authority ≈ 1/100` و`38 backlinks` و`0 dofollow` تاريخية غير مؤكدة؛ لم تتوفر صلاحية live backlink provider لإعادة القياس، لذلك لم تُقدّم كأرقام حالية.

### الملفات المتأثرة
- `15-LINKABLE-ASSET-PLAN.md`
- `16-BACKLINK-PROSPECTS.csv`
- `17-DIGITAL-PR-PLAN.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- فحص يدوي للتداخل عبر مصادر `src/content/blog`, `src/content/docs`, `src/pages` و`sitemap.xml` ✅
- تحقق حي من `https://brightai.live/sitemap.xml` و`https://brightai.live/robots.txt` ✅؛ sitemap الحي يعرض 264 URL حسب آخر سجل.
- تحقق حي محدود من SDAIA وNCA وMCIT وKAUST وWamda وMENAbytes؛ بعض المسارات/النطاقات لم تُقَس تحليليًا، و`Arab News /technology` أعاد 404 في الفحص ✅ موثق في الخطة.
- CSV parsing ✅ — 15 صفًا و16 عمودًا؛ و`git diff --check` ✅.
- `pnpm build` لم يُشغّل: التغيير وثائق/CSV فقط ولم يلمس كود الموقع أو صفحات Astro.

### النتيجة
- **الحالة:** نجح محليًا كخطة وتوثيق؛ لم يتم إنشاء أو نشر أصول HTML جديدة ولم يتم التواصل مع أي جهة.
- **مختصر:** صار عند BrightAI backlog منظم لأصول linkable موجودة أصلًا، prospect list قابلة للتنفيذ، وبوابة جودة تمنع تعويض ضعف السلطة بروابط رديئة.

### ملاحظات / مشاكل مفتوحة
- لا يوجد قياس حي موثوق للـ backlinks أو authority أو traffic في هذه البيئة؛ يلزم إعادة القياس من مزود محدد بعد نشر تحسينات الأصول.
- يلزم تنفيذ تحسينات الأصول الخمسة داخل الموقع في مهمة لاحقة قبل بدء outreach.
- لا commit ولا push ولا deploy.

## [2026-09-10] — توحيد قياس GA4 والإسناد والتحويلات (13)

### تم التنفيذ
- وحّدت أحداث التحويل الأساسية إلى `demo_submit` و`contact_submit` و`lead_created`، مع الأحداث المطلوبة للتسعير وواتساب والتقييم والنشرة والتنزيلات والشركاء.
- أضفت allowlist مشتركة للخصائص مع تنقية PII **قبل** إثراء السياق أو إرسال الحدث إلى providers؛ وأصلحت bug كان يسمح بمرور مفاتيح غير مسموحة بعد التنقية.
- أضفت attribution على مستوى session (`brightai:analytics:attribution`) مع UTM/referrer fallback، ومنعت احتساب honeypot كتحويل، وربطت consent الافتراضي بـ `unknown` ورفض صريح.
- حدّثت التقييم إلى `assessment_started` و`assessment_completed`، وربطت server-side lead tracking بـ `lead_created` بدل الأسماء القديمة.
- أنشأت خطة القياس وrunbook الإعداد اليدوي، وأضافت اختبارات static تمنع رجوع taxonomy/PII/consent وازدواجية التحويل.

### الملفات المتأثرة
- `src/lib/analytics.ts`
- `public/js/analytics.js`
- `src/lib/lead-tracker.ts`
- `src/scripts/lead-form-handler.js`
- `src/components/CookieConsent.astro`
- `public/js/ai-governance-readiness.js`
- `src/pages/api/lead.ts` و`src/lib/ga4-server.ts`
- `audit/seo-recovery/13-ANALYTICS-MEASUREMENT-PLAN.md`
- `audit/seo-recovery/14-GA4-MANUAL-CONFIGURATION.md`
- `scripts/analytics-measurement.test.mjs`

### التحقق
- `pnpm build` ✅ — اكتمل مسار البناء النهائي، sitemap = 264 URL.
- `pnpm build:client` ✅ و`pnpm typecheck` ✅ — صفر أخطاء TypeScript.
- `pnpm test` ✅ — chat 16/16، CSRF 29/29، PII 38/38؛ تحذيرات البيئة `DATABASE_URL` و`GA4_API_SECRET` متوقعة.
- اختبارات analytics + assessment ✅ — 9/9.
- `node --check` لسكريبتات analytics/forms ✅ و`git diff --check` ✅.

### النتيجة
- **الحالة:** نجح محليًا؛ إعدادات GA4 داخل لوحة Google وDebugView ما زالت خطوة يدوية بعد النشر.
- **مختصر:** صار عند المشروع taxonomy موحّد، إسناد session-scoped، consent واضح، حماية PII قبل dispatch، وتوثيق قابل للتنفيذ بدون أسرار.

### ملاحظات / مشاكل مفتوحة
- يلزم تنفيذ `14-GA4-MANUAL-CONFIGURATION.md` يدويًا في GA4: custom dimensions، key events، Consent Mode، cross-domain، واختبارات DebugView.
- لا commit ولا push ولا deploy.

## [2026-09-10] — ترقية صفحات P0 التجارية ومراجعة صفحات الإجابات (12)

### تم التنفيذ
- رقّيت صفحات `/partners/` و`/newsletter/` و`/referral/` بإجابة مباشرة، خطوات عملية، فوائد واضحة، وروابط داخلية سياقية.
- زاد النص المرندر تقريبًا من 340→680 كلمة للشراكات، 216→611 للنشرة، و282→628 للإحالات.
- أزلت صياغة غير مثبتة عن «آلاف المختصين»، واستبدلت ادعاء استخدام بيانات النشرة بصياغة تشير لسياسة الخصوصية.
- أنشأت `12-CONTENT-UPGRADE-LOG.csv`، وحدّثت P0 queue بعلامات الإنجاز، وأنشأت `13-ANSWER-PAGE-REVIEW.md`.
- راجعت 15 صفحة إجابة: كلها KEEP؛ وقرارا redirect السابقان (`nca-compliance` و`sama-ai`) مثبتان ولا حاجة لقرار جديد.

### الملفات المتأثرة
- `src/pages/partners/index.astro`
- `src/pages/newsletter/index.astro`
- `src/pages/referral/index.astro`
- `audit/seo-recovery/05-SEO-ACTION-QUEUE.md`
- `audit/seo-recovery/12-CONTENT-UPGRADE-LOG.csv`
- `audit/seo-recovery/13-ANSWER-PAGE-REVIEW.md`

### التحقق
- `pnpm build` ✅ — اكتمل؛ sitemap = 264 URL، مع تحذيرات legacy route collision معروفة.
- `pnpm internal-links:audit` ✅ — 0 orphan، 0 broken في acceptance architecture، depth ≤3؛ بقي عطلان CSS قديمان في demos (`%23n`).
- `pnpm seo:gate` ✅ — 264 sitemap، 49,312 مرجعًا، 0 أخطاء و0 تحذيرات.
- `node scripts/qa/check-word-count.mjs` ✅ — 4/4 PASS.
- `pnpm seo:schema` ✅ — schema لـ64 صفحة وSpeakable لـ268 صفحة.
- `pnpm seo:hreflang` ✅ — 275 مجموعة، 0 أخطاء.
- `pnpm test` ✅ — chat 16/16، CSRF 29/29، PII 38/38؛ ظهرت تحذيرات بيئة `DATABASE_URL` و`GA4_API_SECRET` المتوقعة في الاختبارات.

### النتيجة
- **الحالة:** نجح محليًا.
- **مختصر:** اكتملت موجة P0 للصفحات التجارية الثلاث، وسُجلت قرارات صفحات الإجابات بدون اختراع دمج أو noindex جديد.

### ملاحظات / مشاكل مفتوحة
- لا يوجد تحقق حي من GSC أو ترتيب SERP.
- عطلان `%23n` في demos الخاصة بمهارة `scroll-world-storytelling` خارج نطاق صفحات الموقع ويحتاجان مهمة مستقلة إن أُريد تصفير التقرير العام.
- لا commit ولا push ولا deploy.

## [2026-09-10] — إعادة بناء الربط الداخلي حول السلطة الموضوعية (10/11)

### تم التنفيذ
- رسمت خريطة الربط من dist (روابط المحتوى بدون nav/footer): الركائز تربط للأسفل أصلًا، والفجوة كانت بالتدفق الصاعد (37 صفحة داعمة بدون رابط للمالك).
- أضفت 39 رابطًا هرميًا واحدًا لكل صفحة بصيغ متنوعة (PDPL×10 وNCA×10 وSDAIA×7 ومخاطر×3 ومنتجات×5 وقطاعات×4) بدون بلوكات محقونة أو تكرار sitewide.
- تحققت من 39/39 بالـ dist (الرابط حاضر والهدف مبني = 200 عند النشر).
- أنشأت `10-INTERNAL-LINK-GRAPH.csv` (41 صفًا: المصدر والهدف والنص والعنقود والغرض وقديم/جديد) و`11-TOPICAL-AUTHORITY-MAP.md` (9 عناقيد بالهرم الكامل).

### الملفات المتأثرة
- 10 مقالات PDPL + 8 مقالات ECC + إجابة NCA + مدونة NCA (روابط صعود)
- 6 مقالات SDAIA + دليل sdaia-generative + 3 مقالات مخاطر (روابط صعود)
- أدلة firewall/approval/audit/evidence/platform/governance-application (روابط منتجات)
- مقالا SAMA (الركيزة + حل البنوك) + `audit/seo-recovery/10 + 11` (جديدان)

### التحقق
- `pnpm build` ✅ — sitemap 264 ثابتة
- روابط مضافة 39/39 ✅ + `seo:gate` ✅ 0/0 + `internal-links` ✅ 0 orphans وعمق ≤3
- `schema` ✅ 64 + `hreflang` ✅ + `test` ✅ 38/38

### النتيجة
- **الحالة:** نجح
- **مختصر:** التدفق الهرمي اكتمل (داعم→مالك→تجاري→تقييم/تواصل) بروابط سياقية متنوعة وموثقة.

### ملاحظات / مشاكل مفتوحة
- روابط UX (تنقل/فوتر/CTA) لم تُمس عمدًا.
- لا commit ولا push ولا deploy.

## [2026-09-10] — إصلاح Schema والفحوص التقنية من المولدات (09)

### تم التنفيذ
- فحصت JSON-LD محليًا (274 صفحة): مشاكل Organization absنت موثقة كغير موجودة، وأكملت Article الناقص (عملاء×3 + بيان PDPL) بقيم حقيقية فقط (صورة OG + مؤلف Organization + تواريخ git) مع تأطير توضيحي لقصص العملاء.
- أصلحت مولد `getLocalBusinessLd`: عنوان الرياض للرياض فقط، والمدن الخمس صارت Service عادي (كانت تحمل شارع الرياض = فروع مختلقة)، وحذفت حقول تجارية غير مؤكدة (ساعات/أسعار/دفع) من المولد الأساسي + about (عقدة الرياض فقط) + قالب المدن.
- أثبت عدم وجود مشكلة alt (819 صورة كلها بـ alt) وعدم اختراع مكاتب بصفحات المدن، وأضفت OG/Twitter/favIcon لقالب الإجابات الـ15.
- أنشأت `09-TECHNICAL-SEO-FIXES.md` (7 ملفات + أدلة التحقق).

### الملفات المتأثرة
- `src/components/seo/Schema.astro` و`src/data/schema-helpers.ts` (المولدان)
- `src/pages/about/index.astro` و`src/pages/solutions/[sector]/[city].astro`
- `src/pages/customers/*/index.astro` (3) و`src/pages/pdpl-statement/index.astro`
- `src/pages/answer/[slug].astro` (وسوم المشاركة)
- `audit/seo-recovery/09-TECHNICAL-SEO-FIXES.md` (جديد)

### التحقق
- `pnpm build` ✅ — sitemap 264 + `typecheck` ✅ صفر أخطاء
- فاحص JSON-LD المحلي ✅ صفر مشاكل (كانت 7 + 59) + فحص alt ✅ 819/819 + فحص head ✅
- `seo:gate` ✅ + `schema` ✅ 64 + `speakable` ✅ 268 + `hreflang` ✅ + روابط ✅ + `word-count` ✅ + `redirects` ✅ + `test` ✅ 38/38

### النتيجة
- **الحالة:** نجح
- **مختصر:** الـ structured data صار مطابقًا للمحتوى المرئي الحقيقي بدون اختراع، بإصلاحات مولد واحدة.

### ملاحظات / مشاكل مفتوحة
- إبقاء LocalBusiness الرياض بالصفحات قرار موثق (كيان HQ واحد حقيقي) وليس عيبًا.
- لا commit ولا push ولا deploy.

## [2026-09-10] — تدقيق الرئيسية ومالكي P0/P1 ونقل نية القائمة للمقال (08)

### تم التنفيذ
- حسمت نية شركات الذكاء الاصطناعي: الاستعلام بصيغة الجمع يتوقع قائمة/مقارنة، فالمالك PRIMARY صار المقال (4162 كلمة: 6 أنواع + جدول + معايير + FAQ) والرئيسية SECONDARY بذكر طبيعي؛ عنوان الرئيسية الجديد حوكمة (45 حرفًا) وH1 مطابق للنية.
- أعدت تأطير دراسة الحالة المفبركة بالمقال كسيناريو توضيحي معلن (حُذفت الاقتباسات والأرقام الدقيقة وادعاء اعتماد سدايا)، وأصلحت anchor مضللًا.
- أصلحت 3 عناوين مقطوعة لمالكين (NCA وFirewall وLandscape) وقصّرت وصفين طوال (Services 177→117 وPDPL 165→134).
- اكتشفت وأصلحت سببًا جذريًا: BlogLayout يضيف العلامة تلقائيًا فأي عنوان مصدر >48 حرفًا يُقطع بأنبوب مزدوج — شمل 4 مقالات + قالب المؤلفين (علامة مكررة) + عنوان authors + عنوان kernel.
- أنشأت `08-METADATA-BEFORE-AFTER.csv` (16 صفًا بالأدلة وعدد الأحرف) وحدّثت مالك شركات في `02`.

### الملفات المتأثرة
- `src/pages/index.astro` و`src/components/SplitHero.astro` (نية الحوكمة)
- `src/content/blog/best-ai-companies-saudi-2026.md` (الملكية + التأطير الصادق)
- `src/pages/services/index.astro` و`src/pages/pdpl-statement/index.astro` (وصفان)
- `src/data/solutions.ts` و5 مقالات و`authors/[slug].astro` و`authors/index.astro` و`kernel.ts` و`kernel-datasets.md` و`blog.ts` (عناوين)
- `audit/seo-recovery/08-METADATA-BEFORE-AFTER.csv` (جديد) و`02` (مالك واحد منقول)

### التحقق
- `pnpm build` ✅ — sitemap 264 ثابتة
- انحدار التكرار عبر dist ✅ — صفر عناوين مكررة وصفر أنابيب مزدوجة/معلقة (كانت 7) والتكرار الوحيد NONE×6 (stubs غير مفهرسة)
- `seo:gate` ✅ 0/0 + `hreflang` ✅ 0 + `schema` ✅ 64 + `internal-links` ✅ + `word-count` ✅ + `test` ✅ 38/38

### النتيجة
- **الحالة:** نجح
- **مختصر:** كل مالكي P0/P1 بعناوين وأوصاف سليمة غير مقطوعة، والنية القائمية للمالك الصحيح، وآلية الانحدار توثق الصفر.

### ملاحظات / مشاكل مفتوحة
- عناوين طويلة أخرى تُقطع عند حد الكلمة بشكل نظيف (47) — مقبولة ومتروكة عمدًا لتجنب التغيير الواسع.
- لا commit ولا push ولا deploy.

## [2026-09-10] — تنفيذ استهداف الكلمات P0/P1 بمواصفات طبيعية (07)

### تم التنفيذ
- فحصت 26 كلمة P0/P1 ضد HTML المبني: عشرة مالكين مغطاة بالكامل (title+H1+أول 100+عناوين) بدون تغيير، وأربعة احتاجت تدخلًا.
- أصلحت تكرار H1 بالرئيسية (في السعودية في السعودية) بحذف spans الزائدة، ونظفت حشو Services (ثلاثية EN + اتمتة جدة + عناوين مكدسة) مع إبقاء ذكر واحد طبيعي.
- حسمت قائمة التحقق: شركات AI السعودية PRIMARY مؤكد، شركة أتمتة واستشارات التحول SECONDARY، وثلاثية automation الإنجليزية EXCLUDED مع حذف كل مواضعها (4 كانت محصورة بالخدمات).
- قصّرت عنوان NCA المقطوع (69→40 حرفًا) بدون مساس بمحتوى 6438 كلمة، وأضفت رابط الركيزة التعليمية في صفحة المنصة (ربط ثنائي تجاري↔تعليمي).
- أنشأت `07-KEYWORD-IMPLEMENTATION-MAP.csv` (13 مالكًا × 18 عمودًا: المواصفة + قبل/بعد) وحدّثت `02` للقرارات الستة.

### الملفات المتأثرة
- `src/components/SplitHero.astro` (إصلاح H1)
- `src/pages/services/index.astro` (إزالة الحشو)
- `src/content/blog/nca-cybersecurity-requirements-saudi.md` (تقصير العنوان)
- `src/pages/solutions/[slug].astro` (رابط Hub)
- `audit/seo-recovery/02-KEYWORD-OWNERSHIP.csv` (27/4/17/11/21)
- `audit/seo-recovery/07-KEYWORD-IMPLEMENTATION-MAP.csv` (جديد)
- `audit/seo-recovery/00-BASELINE.md` و`05-SEO-ACTION-QUEUE.md` (مزامنة الأرقام)

### التحقق
- `pnpm build` ✅ — sitemap 264 ثابتة
- `seo:gate` ✅ 0/0 + `hreflang` ✅ 0 + `schema` ✅ 64 + `speakable` ✅ 268
- `internal-links` ✅ 0 orphans + `redirects` ✅ بدون chains + `word-count` ✅ + `test` ✅ 38/38
- قياس dist بعد التنفيذ ✅ — H1 نظيف وعنوان NCA 49 حرفًا وصفر EN-stacking والربط الثنائي حاضر

### النتيجة
- **الحالة:** نجح
- **مختصر:** الاستهداف صار نية-كاملة بدل كثافة تكرار: إصلاحان للحشو الموروث، و5 قرارات تحقق موثقة، و13 مواصفة بأدلة قبل/بعد.

### ملاحظات / مشاكل مفتوحة
- نية pdf غير مستهدفة عمدًا (لا ملف حقيقي = لا PDF وهمي).
- مصطلحات EN العامة تحتاج محتوى EN قبل أي استهداف مستقبلي.
- لا commit ولا push ولا deploy.

## [2026-09-10] — تقليص السطح القابل للفهرسة (consolidation: sitemap 274→264)

### تم التنفيذ
- فحصت كل عناقيد التداخل (حوكمة AI وPDPL وNCA ECC وSDAIA وSAMA وISO وFirewall والمخاطر وحوكمة البيانات + hub/blog/answer/docs/solutions/lp/city/category) صفحة بصفحة: كلها KEEP متمايز (تجاري vs تعليمي vs أداة vs حملة) — صفر دمج بدون دليل GSC.
- أخرجت 10 utility من sitemap على مستوى المولد فقط (`500/offline/kernel/offline/thank-you/go/whatsapp/design×5`) مع بقاء `index, follow` في HTML بقرار المالك؛ `robots.txt` و`redirects.json` بدون تغيير.
- أصلحت 4 مخالفات hreflang المسجلة مسبقًا (`/500/` + `/go/whatsapp/`: self ar-SA وx-default) + special-case `/500.html` في الفاحص.
- أصلحت orphan الوحيد (`tools/ai-governance-controls`) برابط سياقي واحد من ركيزة الحوكمة.
- حدّثت `03` (أعمدة resolution لكل 13 مجموعة) و`04` (274 صفًا: 229 KEEP و35 IMPROVE و10 REMOVE_FROM_SITEMAP) وأنشأت `06-CONSOLIDATION-CHANGELOG.md`.

### الملفات المتأثرة
- `scripts/generate-sitemap-all-pages.mjs` (استبعاد utility من groupRelPath)
- `src/pages/go/whatsapp.astro` و`public/500.html` (hreflang ذاتي فقط)
- `scripts/hreflang-bidirectional-audit.mjs` (special-case `/500.html`)
- `src/components/hub/AiGovernancePillar.astro` (رابط واحد للأداة)
- `audit/seo-recovery/00..06` (توليد + overlay + سجل الدمج)
- `public/sitemap.xml` و`sitemap.xml` (264 loc)

### التحقق
- `pnpm build` ✅ exit 0 — sitemap 264 وصفر utility داخلها
- `seo:gate` ✅ 0/0 (49,234 مرجعًا) + `hreflang` ✅ 0 (كانت 4 مسبقة) + `schema` ✅ 64 + `speakable` ✅ 268
- `redirects:check` ✅ (صفر chains/cycles) + `internal-links` ✅ (0 orphans بعد الإصلاح، depth ≤3)
- `check-word-count` ✅ 4/4 + `pnpm test` ✅ 38/38
- canonicals ذاتية ✅ ومالكو PRIMARY كلهم indexable ✅

### النتيجة
- **الحالة:** نجح
- **مختصر:** السطح القابل للفهرسة صار 264 canonical فقط، وكل التداخلات محسومة KEEP موثق، وكل البوابات خضرا.

### ملاحظات / مشاكل مفتوحة
- `MASTER-BASELINE-AUDIT.md` فيها تعديل ضخم من جلسة موازية — ليست من هذه المهمة ولم تُلمس.
- `docs/nca-ecc-ai-governance` (630w) تحتاج IMPROVE تحريري لاحقًا؛ والـ 24 VALIDATE تنتظر GSC ومحتوى EN.
- لا commit ولا push ولا deploy.

## [2026-09-10] — تأسيس SEO control plane (audit/seo-recovery) بدون صفحات جديدة

### تم التنفيذ
- بنيت `scripts/generate-seo-recovery-control-plane.mjs` يولّد كل المخرجات من المصدر الفعلي (sitemap + pages + content + data + robots + redirects + CSV) بدون أي استدعاء حي.
- جردت 274 URL من `public/sitemap.xml` (83 Astro + 97 blog + 50 docs + 15 answer + solutions/hub) مع title/H1/words تقريبية وinbound/outbound وschema وcanonical/hreflang وGSC=N/A.
- عالجت 80 كلمة بتطبيع نية token-based (بدون `\b` العربي): PRIMARY=29 وSECONDARY=2 وREFERENCE=17 وEXCLUDED=8 وVALIDATE=24، بمالك واحد لكل نية مميزة.
- اكتشفت 9 صفحات noindex-allowlist داخل sitemap (500 + design×5 + offline + kernel/offline + thank-you) مع hreflang — وصنفتها REMOVE_FROM_SITEMAP بدل NOINDEX.
- أنشأت 13 مجموعة cannibalization من target/alternative في CSV + عناقيد تجارية، و274 صف خطة فهرسة، وقائمة إجراءات P0-P3 بدون MERGE/REDIRECT جديد (بلا دليل GSC).

### الملفات المتأثرة
- `scripts/generate-seo-recovery-control-plane.mjs` (جديد)
- `audit/seo-recovery/00-BASELINE.md`
- `audit/seo-recovery/01-URL-INVENTORY.csv` (274 صفًا)
- `audit/seo-recovery/02-KEYWORD-OWNERSHIP.csv` (80 صفًا)
- `audit/seo-recovery/03-CANNIBALIZATION-MATRIX.csv` (13 مجموعة)
- `audit/seo-recovery/04-INDEXATION-PLAN.csv` (274 صفًا)
- `audit/seo-recovery/05-SEO-ACTION-QUEUE.md`

### التحقق
- `node scripts/generate-seo-recovery-control-plane.mjs` ✅ — CONSISTENT (01==sitemap==04 بكل dispositions)
- فحص CSV ✅ — 274/80/13/274 صفًا، وsitemap كلها YES، وGSC كلها N/A، و26 عمودًا للجرد
- `pnpm build` لم يُشغّل: الموجة audit artifacts فقط ولم تمس صفحات أو مسارات الموقع
- فحص يدوي ✅ — الـ 9 REMOVE_FROM_SITEMAP مثبتة بـ grep في sitemap، وصفر تداخل redirect-vs-sitemap

### النتيجة
- **الحالة:** نجح
- **مختصر:** صار عند المشروع control plane مبني على أدلة وقابل لإعادة التوليد: 221 KEEP و36 IMPROVE و8 REVIEW و9 REMOVE_FROM_SITEMAP و0 MERGE/REDIRECT/NOINDEX، مع 29 مالكًا أساسيًا و8 مرفوضة و24 غامضة تحتاج تحققًا قبل الاستهداف.

### ملاحظات / مشاكل مفتوحة
- لا GSC/PSI/CrUX حية — قرارات الدمج والتوجيه النهائية مشروطة بـ 28 يومًا بعد النشر.
- word counts من المصدر تقريبية وتحتاج تأكيد HTML مبني عبر check-word-count.
- لا commit ولا push ولا deploy.
