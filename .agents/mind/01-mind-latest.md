# Project Mind — BRIGHTAI / AIGAS

## Current State
- 2026-11-17 VERIFIED Windsor MCP: مضاف في `opencode.json` (مشروع، متتبَّع git) بمرجع سر خارجي `{file:~/.config/opencode/secrets/windsor-api-key}` chmod600؛ initialize200/v4.1.4؛ connectors: `googleanalytics4`(551941072 BRIGHT AI) و`searchconsole`(brightai.live) فقط بلامهام كتابة؛ يحتاج إعادة تشغيل العميل بعد أي تعديل.
- 2026-11-17 VERIFIED LOCAL Delta: `0034`–`0037` موجودة (self-service trial/closure v2/bootstrap/HG escalation)؛ `DELTA_ORDER` 23 خطوة تنتهي `0037`؛ مصفوفة RLS 84/84 على fresh (43 جدولًا/93 سياسة/0 منح عميل)؛ لا تطبيق على Staging أو Production؛ `Audit/tenant-isolation-2026-11-16/local-rls-matrix-0037.json`. 0035 رُوجعت كاملة؛ 0034/0036/0037 رؤوسها فقط.
- 2026-11-17 VERIFIED LOCAL contact/pricing/services: مسودةواحدةاختياريةونسخمحليوروابطقنواتثابتةبلاquery؛فتح≠إرسال≠استلام؛لاlead_received؛unit22/build64/Browser12+noJS+clipboardfailure PASS؛لاخادمأونشر؛ `audit/contact-journey-2026-11-17/REPORT.md`.
- 2026-11-17 VERIFIED LOCAL internal links: graphHTML71/2886anchors؛32دليلًا بعلاقاتتحريرية+أصل/منتج/قطاععندالحاجة؛حفظبحث/فهرس/عودةعبرlab/contact؛GET135كلها200بلاredirect/أقساممكسورة؛unit5/build64/Browser64+8sector+رحلتينPASS؛لانشر؛ `audit/internal-link-graph-2026-11-17/REPORT.md`.
- 2026-11-17 VERIFIED RESEARCH links: 4 فرص بصفحة وقناة مهنية + AMSA معلقة بالقناة؛5 مسودات بلا إرسال؛Ahrefs baseline BLOCKED بـInsufficient plan؛لا broken/unlinked مؤكدة؛إتاحة resources الحية NOT VERIFIED؛ `audit/link-opportunities-2026-11-17/REPORT.md`.
- 2026-11-17 VERIFIED LOCAL resources: /resources/ وثلاثةأصولعربيةHTML+MD/CSVوأمثلةاصطناعية/CC BY4.0/v1.0-2026-11-17/دونبريد؛build64/Browser8×390و1440/RTL/noJS/downloads/37links PASS؛لانشر؛ `audit/resources-2026-11-17/REPORT.md`.
- 2026-11-17 VERIFIED LOCAL answer units:3أسئلةGSCمباشرة+5وحداتموضوعية/7صفحاتقائمة؛40استعلامًامربوطًا؛build60/HTML/FAQparity/Browser14PASS؛مصدرأسئلةالجمهورغيرمتاح/الفهرسةالفعليةوالنشرNOT RUN؛ `audit/answer-units-2026-11-17/REPORT.md`.
- 2026-11-17 VERIFIED LOCAL editorial/schema:32دليلًا بسجلنشر/تحديثبحدث/اطلاع/مراجعةمستقلة؛4modifiedموثقةفقط؛Organizationمنمرجعالمالكبلاlegal/sameAs؛3authorsبدائلتوضحعدمالإثبات؛unit5/build60/HTML32/Browser500+1440و390×3PASS؛لامراجعشخصي معتمد/لانشر؛ `audit/editorial-schema-2026-11-17/SCHEMA-REPORT.md`.
- 2026-11-17 VERIFIED LOCAL guides4:حوكمة/PDPL/مخاطر/موظفين؛31ادعاءبمصدرونوعونسخةونطاق؛نقل1840/2024ومبادئP116v1مايو2025؛build57بـAstro6.4.8lockمطابق/Browser8×390و1440/tree5PASS؛نفاذحكوميمستقلغيرمثبت/لامراجعةقانونيةلواقعة/لانشر؛ `audit/guide-claims-2026-11-17/REPORT.md`.
- 2026-11-17 VERIFIED ANALYSIS intent map:311صفحة/32دليل/254إرث؛GSCwebfinal18أكتوبر–14نوفمبر9clicks/970impressions؛أولويةحكومة→صحة→مصارف→تنفيذ→استشارات؛49mergeتوصياتفقط/رياضتبقىمؤقتًا؛صونURLsالإرثقبلنشر57؛ `audit/intent-map-2026-11-17/REPORT.md`؛لاتعديلصفحاتأونشر.
- 2026-11-17 VERIFIED LOCAL GA4 attribution: موافقةالمالكGoogle/Bingأربعةexacthosts→originفقط؛التحريريمحجوبحتىاعتمادنطاقه؛unit45/Chrome20double-init/CSP PASS؛SDK/ingestion/account NOT VERIFIED؛لاتصحيحDirectتاريخي/لانشر؛ `audit/ga4-attribution-2026-11-17/REPORT.md`.
- 2026-11-17 VERIFIED LOCAL sitemap contract: سياسةAstro/buildموحدة؛57/57 GET+HEAD/canonical/index PASS،aliases138/276 وunit5/buildPASS؛404المباشرومفقود404؛حي sitemap.xml200/264يتضمنdemoمفهرس و404/200،current57PASS؛اتحاد311مفحوص؛لانشر/GSC؛ `audit/sitemap-contract-2026-11-17/REPORT.md` وخطةOPERATOR-PLAN.
- 2026-11-17 VERIFIED READONLY SEO/UX: HEAD eb1beded؛57/57 sitemap URLs حي200/metadata سليمة آليًا؛GSC18أكتوبر–14نوفمبر9clicks/970impressions مقابل7/688؛GA4 180sessions/Organic4؛privacy الحيةتنفيGA رغمتحميله؛GAيحذفexternalreferrer (أثرالإسناد NOT VERIFIED)؛Sentry0/PostHogلاeventsمرصودة30يومًا؛SemrushAPIunitsنفدت؛لا تنفيذ تحسينات/نشر.
- 2026-11-17 VERIFIED LOCAL SEO discovery+fixes: جرد492URL/مخطط؛57صفحةعامة/build/routesPASS وunit4؛READMEحُذف/demo6description/حارسHTML؛138aliasمحليPASS لكنحي77×200/61×404؛sitemapقديم264/حالي57؛235صفحةحيةبلامصدرحالي؛التسجيلحي404؛لا نشر؛ `audit/repository-seo-discovery-2026-11-17/REPORT.md`.
- 2026-11-17 VERIFIED build correction: lockfileAstro6.4.8+Node22.22.3 ينجح؛node_modulesالأصليAstro7.4.12غيرمطابق أظهرPDPLcompile/docs500؛لا تعتمد هذا الفشل كعيب فيbuildالعقدالحالي؛الاعتماداتالأصليةلمتُستبدل.
- 2026-11-17 PARTIAL LOCAL GA4: طلب المستخدم التتبع لجميع الصفحات؛ shared G-9LMB4PGTWJ في public/app/auth/demo/closed portal وCSP؛unit22/hash PASS؛build BLOCKED بخطأ article في pdpl-and-ai:448،Browser profile locks؛Windsor read يعمل؛لا نشر/collection حي؛ `audit/ga4-2026-11-17/REPORT.md`.
- 2026-11-17 PARTIAL LOCAL G-12: CSP موحدةNode+middleware/quotedhashes/externalmodules؛global monitoring kill؛privacy draft؛unit22/build57 PASS؛Chrome public2clear/auth+appZod eval issue؛لافرضحي/قانونية/retention/Auth حقيقي؛ `audit/csp-observability-2026-11-17/REPORT.md`.
- 2026-11-17 PARTIAL LOCAL Risk Assist G-10: OWNER/ADMIN+synthetic+tenant/product guard؛Groq registry مغلق/فارغ؛strict advisory JSON إلىوصفالسياقفقط؛core/acceptance بلا تغيير؛unit11/build PASS؛Browser فصلapp/demo PASS،Auth insertion/provider NOT VERIFIED؛ `Audit/risk-assist-2026-11-17/REPORT.md`.
- 2026-11-17 PARTIAL LOCAL Firewall G-09: 0037 جاهز/default-off؛ PENDING ذري metadata-only وSoD إلزامي/ربط القاعدة؛ output rules+protectText؛ advisory metadata عبرGroq غير حاكم؛ PG18 review5/HG1/unit20/build PASS؛ لا shared migration/Browser/provider resume؛ `Audit/firewall-escalation-2026-11-17/REPORT.md`.
- 2026-11-16 PARTIAL LOCAL Secure Chat: output Baseline+Firewall+Kernel قبلالعرض؛tenant/expiry registry gate؛quota emergency switch؛unit23/build وPG18ستةحدود/settlement/no-content PASS؛registryفارغ/liveSend NOT_VERIFIED؛.envفيهGroqkey/modelفقطبلامستأجرأوموافقات؛ `docs/SECURE-CHAT-DEVELOPMENT.md` خطواتالاعتماد.
- 2026-11-16 PARTIAL LOCAL Groq: بوابةموحدةوحجزتكلفةدائم/timeout15s/429محاولتان/concurrency5/circuit5×60s؛unit19/build/client-key-scan0 PASS؛registryفارغ؛يلزمسعران inputUsdPerMillion/outputUsdPerMillion وAIGAS_GROQ_BUDGET_FILE مشتركودائمومهيأ؛crash يحتفظبالحجز/slot للمصالحة؛الاتصالوتدويرالمفتاح NOT RUN؛القاطع503 دونتحويلحتميآلي.
- 2026-11-16 VERIFIED STAGING 0035/0036: ledger32/32 APPLIED/hash32مطابقة؛43جدولًا/93سياسة؛A→B guard403/write42501 وruntimeRLS=true؛reverse/owner503/finalposture NOT VERIFIED لاتصالمتقطع؛Production protected=false/PITR21600s بقراءةCLI؛لاكتابةإنتاج؛ `audit/production-hardening-2026-11-16/REPORT.md`.
- 2026-11-16 VERIFIED LOCAL isolation closure: 0035/0036؛ fresh/delta posture identical PG18.6؛ order6/RLS84 PASS؛ runtime bootstrap+invitation SQL مثبتان وdirect INSERT42501؛ HTTP invitation integration مفتوح؛ لا تطبيق خارجي؛ `audit/runtime-isolation-2026-11-16/REPORT.md`.
- 2026-11-16 PARTIAL UX release audit: HEAD `738520067de19ae3bb5380beb292cd4d44861b69` rebuilt;92 views/4sizes no overflow/45tests PASS؛Ledger embedded preset≠full demo؛live Trial/API404 publiccache؛serverpayloads/realAuth/INP NOT VERIFIED؛PUBLIC_DEMO/TRIAL_48H/ENTERPRISE NO-GO؛ `Audit/release-ux-2026-11-16/REPORT.md`.
- 2026-11-16 VERIFIED STAGING+LOCAL Trial: OTPبريدفعلي→Tenantمعزول/MEMBER/5منحقراءة100×48hوRiskSynthetic؛0034مطبقledger30/30بصماتمطابقة؛Home5/5 وBrowser390/1440،A→B403 وAI403؛انتهاءنافذةماضٍداخلrollbackPASSوليسمرور48h؛previewlocalhost:4428؛النشرNOT RUN؛ `Audit/self-service-trial-2026-11-16/REPORT.md`.
- 2026-11-16 VERIFIED LOCAL Kernel demo: Control Center أصل/سياسة→فحص→مراجعة→دليل؛ 6 Scenario IDs اصطناعية بين المختبرات وعودة بالسياق؛ لا هوية/tenant/نصوص؛ unit6/build57 وBrowser390/1440 PASS؛ app/kernel وguidance بلا تعديل؛ النشر/Auth الفعلي NOT RUN؛ `Audit/kernel-demo-2026-11-16/REPORT.md`.
- 2026-11-16 VERIFIED LOCAL Secure Chat demo: محرر/3سيناريوهات ALLOW-REDACT-BLOCK وردمحاكاة/قبل-بعد/نسخ/reset/loader؛ unit13/build57/Browser390+1440 PASS؛ لاخروجمتنمرصود؛Live NOT_VERIFIED وregistryفارغ،48hوسقفتكلفة/Auth/tenantغيرمثبتة؛ `Audit/secure-chat-demo-2026-11-16/REPORT.md`؛لانشر.
- 2026-11-16 VERIFIED LOCAL Risk demo: RiskWorkspace demo mode؛ أصلان خياليان/Matrix/معالجة/Inspector/قبول اصطناعي يُلغى بالتغيير/SyntheticJSON؛ unit5/build57/Browser390 PASS؛ لاAPIأوقبولمؤسسيأونشر؛ `Audit/risk-demo-2026-11-16/REPORT.md`.
- 2026-11-16 VERIFIED LOCAL Human Gate demo: Queue وPersona محلية فقط؛ lifecycle مطابق للخادم، SoD وقرار≠تنفيذ وإذن أحادي ورفض/إلغاء/مهلة/تفويض؛ توضيح ملاحظةPENDING؛ Firewall→fixture وLedger preview بلاAPI؛ unit6/build57/Browser390+1440 PASS؛ `Audit/human-gate-demo-2026-11-16/REPORT.md`؛ لا نشر.
- 2026-11-16 VERIFIED LOCAL Firewall demo: Workspace نصي حتمي demo-v1 بخمسة قرارات؛ لا API/مزود/حفظ نص؛ Human Gate رابط مثال افتراضي؛ unit6/Browser5+empty/long/loading/reset/redaction/build57 PASS؛ النشر NOT RUN.
- 2026-11-16 VERIFIED LOCAL Experience Hub: `/products/` خمس بطاقات+Kernel؛ `#lab` مختبر عام أولًا و48h→Auth معreturnTo؛ غلافRTL وتنقل مشترك للمختبر/التطبيق، حفظ اختيار محلي للجلسة؛ Hero/Constellation/logo/tokens بلا تغيير؛ التشغيل الحقيقي والنشر غير مثبتين.
- 2026-11-16 PARTIAL Node origin: HEAD `fa3884d4217b77b411598a2095858d5938cbfff9`+tree؛ JWKS/SHA readiness شُدّد؛ build57/unit11/runtime19PASS+1SKIP؛6/6SSR محليGET/HEAD200،API401JSON؛ DB/Auth الفعلي وBrowserغيرمثبتين؛ Renderread نجح: العامةstatic_site/dist/client وdeploy `dep-dbte0qe417fc738h1fsg` بنفسSHA؛ أصلRenderوالدومين6/6+health/API404؛ `Audit/node-origin-2026-11-16/REPORT.md` وخطة `docs/NODE-ORIGIN-OPERATOR-2026-11-16.md`؛ لا نشر/DNS.
- 2026-11-16 P01 drift: رأس البدايةf221ac4 ثمHEAD8b0aa3c بعمليةخارجالوكيل؛ لا فرق مصدر/اختبارات/إعدادات بينهما؛ رأسالتسليم264ملفًا/55مصدرًا، رأسالبداية245/55؛ `Audit/p01-delta-2026-11-16/final-delta.tsv`؛ آخرGitHubread=f221ac4،DeploySHA UNKNOWN.
- 2026-11-16 VERIFIED P01 audit: HEAD/GitHub `f221ac4177d63dad649bfaf892868b5c6d971a0d`؛ delta245=R10099/reports84/source55/context7؛ live ست أمثلة تعليمية ×390/1440 بلا overflow، CTA5→404 وhealth/API404 بكاش300ث؛ unit42PASS؛ `Audit/p01-delta-2026-11-16/REPORT.md` يحوي13فجوة وخريطةP02–P13؛ لا تشغيل منتج حي مثبت.
- 2026-11-11 PARTIAL D08: HEAD `38403763df2daf2baa60576def4d73215756f430`؛ Browser5routes×390/1440 RTL/overflow PASS؛ compassKeyboard/noJSdocs PASS؛ Hero baseline نص/روابط/أبعادمطابقة وصورة1440متطابقة؛ devLCP228ms/shift0.024تشخيصي؛ SR/INP/المصادق/المنشور NOT RUN؛ `Audit/d08-acceptance-2026-11-11/REPORT.md`؛ InternalNOTREADY/PublicCommercialNO-GO.
- 2026-11-11 PARTIAL D07: HEAD `b0c1bd415911aec4d24326a7c89dc5f3811c8ae8`؛ لا تعديل مصدر؛ wrapper301→docs200/query PASS وsearch3PASS؛ devdocs/article200 لكنdevaliasqueryغيرمحفوظ؛ artifactقديم؛ الحيknowledge404؛ BrowserBLOCKED/OpenSEO0/GSCNOTVERIFIED؛ `Audit/d07-knowledge-2026-11-11/REPORT.md`؛ InternalNOTREADY/PublicCommercialNO-GO.
- 2026-11-11 PARTIAL T03 execution: staging0033 APPLIED ledger29/29؛4Auth اصطناعية/مؤسستان/100browse لكلمنتج48h؛runtime LOGIN محدود SET ROLE مثبت؛esbuild أصلح؛Auth token wrapper أصلح؛unit7 PASS؛Browser النهائي NOT VERIFIED وDB اتصال متقطع؛ `Audit/t03-exploration-2026-11-11/EXECUTED.md`.
- 2026-11-11 PARTIAL LOCAL D06: HEAD `f05b17936809bf9a98acfbc75676ae6cc242d3af`+tree؛ خطوة تالية من الخادم ورسالة منتج للمشارك؛ unit13/compiler PASS؛ Browser BLOCKED بغياب esbuild الأصلي؛ قبول الدورين/T03/T01 NOT RUN؛ `Audit/d06-kernel-2026-11-11/REPORT.md`؛ Internal NOT READY/Public Commercial NO-GO.
- 2026-11-11 PARTIAL LOCAL D05: HEAD `e5473c63`+tree؛ hover/focus لأزرارCTA صار `#6f43e6` 5.80:1 بدل3.29، أزرارapp تعتيم داخلي12% 5.69 بدل4.24، `.kc-read` أبيض5.80 بدل2.19؛ docs group وkernel list أُصلحا؛ axe26صفحة0عداpricingaside؛ Hero/Firewallمستبعدان؛ SR/Escapeالمصادق/النشرNOT RUN؛ `Audit/d05-accessibility-2026-11-11/REPORT.md`؛InternalNOTREADY/PublicCommercialNO-GO.
- 2026-11-11 PARTIAL T06 recheck: HEAD `b0c1bd415911aec4d24326a7c89dc5f3811c8ae8`؛ لاتعديلمصدر؛unit19/Chromeصفرقياسخارجي/relayمعطل204 PASS؛Sentry0/PostHog720936؛retentionproject=null/default12m/default_period_deletes=false لايثبتحذفًا؛canary/alert NOT RUN؛ `Audit/t06-observability-2026-11-11/RECHECK.md`؛InternalNOTREADY/PublicCommercialNO-GO.
- 2026-11-11 VERIFIED LOCAL D04: HEAD `9bda61d288746c5392a2bdc0da8162910407a94b`+tree؛ section-compass داخل التدفق أسفلbreadcrumb لمنعحجبالمنتجات؛ Browser390×844/1440×770 بلاoverlap/overflow،Tab/Escape/headingfocus/action PASS؛safe-areaغيرصفريوالنشرNOT RUN؛ `Audit/d04-section-compass-2026-11-11/REPORT.md`.
- 2026-11-11 PARTIAL D03: HEAD `6452c17`؛ واجهات المنتجات الخمس منفذة أصلًا وعقود API مطابقة (32 مسارًا)؛ Browser 390/1440 ×5 بلا تجاوز أفقي وبيانات خاصة مخفية ورفض دخول صريح وتفاعل Ledger reload بلا نجاح زائف؛ لا تغيير مصدر؛ القبول الحي BLOCKED بـT01/T03؛ `Audit/d03-product-experiences-2026-11-11/REPORT.md`.
- 2026-11-11 PARTIAL LOCAL D02: HEAD `0baadba`+working tree؛ allowlist/returnTo بلا تغيير؛ وجهات المنتجات الخمس 200 محليًا وreturnTo صحيح ×5 ورفض الخارجي/المشفّر؛ فشل رمز المزود بلا جلسة صار «سجّل الدخول» بدل `HTTP 404`؛ Browser30/30 وunit3 وbuild57 PASS؛ الجلسة الحقيقية والنشر NOT RUN (T01/T03)؛ `Audit/d02-journey-2026-11-11/REPORT.md`.
- 2026-11-11 VERIFIED LOCAL D01: HEAD `cbd8d42df6e9`؛ أصل `/solutions/` أثر Static قديم (شعار400×400+`/assets`+`/js/sw-register.js`) لا ينتجه المصدر؛ أُضيف `src/pages/solutions/index.astro` بهويةPageShell وادعاءات تخطيط فقط، و19 تحويلًا قديمًا+2 alias إلى مسارات حالية بلا حلقات؛ build57/فحصURLs24/301×38 PASS؛ النشر وتحويل الحافة BLOCKED بتفويض مستقل؛ `Audit/d01-solutions-2026-11-11/REPORT.md`.
- 2026-11-11 PARTIAL T05: HEAD `dcd52eac9f14465a32cfc166a44b5387edf5a636`+tree؛ Chat يقيّمKernel/Firewallلكلturnويسجلقرارًاوصفيًا؛unit10/PG18سيناريو1 PASS؛Groqmodels200؛لاcompletion؛ `Audit/t05-secure-chat-2026-11-11/REPORT.md`.
- 2026-11-11 VERIFIED LOCAL T04: HEAD `48e0f4fe61a3e7b86bb752675d6148ede01c7a1d`+working tree؛ review binding v2 يفرضtenant/request/fingerprint؛unit7 وPG18.6 سيناريوأربعةمنتجات1 PASS؛ESCALATE409 فقط بلاadapter؛ `Audit/t04-products-2026-11-11/REPORT.md`؛رحلةفريقغيرمثبتة.
- 2026-11-11 VERIFIED LOCAL T03 recheck19:49: HEAD `f05b17936809bf9a98acfbc75676ae6cc242d3af`+D06tree؛ DB18.6 سيناريو1 PASS بلا تعديل مصدر؛ bootstrap/5قدرات/48h/quota/A→B/close/export مثبتة؛ Browser NOT RUN؛ `Audit/t03-exploration-2026-11-11/RECHECK.md`.
- 2026-11-11 VERIFIED LOCAL+STAGING T02: HEAD `95f12b9c1fff4717904d4602de86c441a7a56d22`+working tree؛ local RLS74/contracts75/order5/build56 PASS؛ Neon restricted LOGIN34/34 PASS،حُذف معfixtures؛ `Audit/t02-schema-rls-2026-11-11/REPORT.md`؛ T03 permanent pool/SSR غير مثبتة.
- 2026-11-11 VERIFIED LOCAL T01: HEAD `8a5f498`+working tree؛ Node22.22.2 build56/runtime19 (PG18 مؤقت؛ Auth probe SKIPPED)؛ `Audit/t01-node-ssr-2026-11-11/REPORT.md`؛ لا نشر.
- 2026-11-11 VERIFIED LOCAL: أزرار أسماء المنتجات أعلى«جرب المنتج اللي تحتاجه» تفتحKernel عبرproductEntryPath مثلزرالدخول، معreturnToلكلمنتج؛ أزيلscrollspyللـanchors؛ Browser5/5 وunit3 وbuild56/routes56/0broken؛ `Audit/local-trial-2026-11-11/PRODUCT-ENTRY-LINKS.md`.
- 2026-11-11 VERIFIED LOCAL: `npm run start:trial` يفتحPortal على127.0.0.1:4416 دون تغييرproduction gate؛ اختيار المستخدمGroq/qwen/qwen3.8-27b فيGROQ_MODEL وردupstream200/31tokens؛ ليس تشغيلSecureChat. قاعدة.env الخارجية بلاجداولTrial/Quota وبلاBRIGHT AI؛ registryفارغ وchat policy integrationمغلق؛ `Audit/local-trial-2026-11-11/REPORT.md`.
- 2026-11-10 VERIFIED LOCAL (P16/AR04): HEAD `9628162`؛ 4 حزم/12 advisory (critical AVIF واحد، 2 high)؛ `sharp` اختياري بلا أثر في `dist` و`esbuild` build-only؛ الحزمان القابلان للاستغلال في `@astrojs/node` (Host مشوّه ⇒ 500، backslash ⇒ 301 protocol-relative) أُغلقا في `scripts/server.mjs` وأُثبتا قبل/بعد؛ 11 استثناءً موقّعًا حتى `2027-02-08`؛ الحرجة بلا تنازل (تحتاج موافقة المؤسس)؛ `Audit/p16-dependency-security-2026-11-10/REPORT.md`.
- 2026-11-10 INVARIANT (P16): الإصلاح الجذري يحتاج ترقية رئيسية `astro ≥ 7.3.2` + `@astrojs/node ≥ 11.1.3` + Node `≥ 22.23.4` (المثبّت `22.22.2`)؛ إدخال `astro:assets`/`Image`/`avif` قبلها يُبطل استثناءات `sharp` والحرج؛ `scripts/verify-dependency-posture.mjs` يعيد إثبات الشروط.
- 2026-11-10 VERIFIED LOCAL (P14): HEAD `2eb45b7`+working tree؛ 56 صفحة مفهرسة (أُدخل `/kernel/`) و117 alias 301 (GET/HEAD، query محفوظ، صفر loop/chain) وcanonical/OG/alt/JSON-LD وصفر روابط مكسورة؛ أُزيل noindex للاستعلام الحساس، وArticle يحمل datePublished+image؛ noindex مقصور على `/auth/*` و`/app/*` و`/healthz/` و`/404/`؛ SE04 الحي BLOCKED على push؛ `Audit/p14-seo-links-2026-11-10/REPORT.md`.
- 2026-11-10 VERIFIED LOCAL (P12): تنقل موحد للمنتجات وreturnTo بقائمة سماح؛ الكتالوج بلا شارات إتاحة بتوجيه المستخدم، بتصميم تحريري ورسوم وحركة تدريجية؛ build55/routes55/unit17 وChrome360/390/768/1440 وreduced-motion/no-JS PASS؛ الرحلة المخولة والعمليات/الحصص والنشر NOT VERIFIED؛ `Audit/p12-product-journey-2026-11-10/REPORT.md`.
- 2026-11-10 VERIFIED LOCAL+STAGING-READONLY (P03): HEAD `9f70334`؛ مصفوفة RLS 69/69 محليًا (owner0 لـruntime، صفر منح عميل، A/B CRUD، GUC، COPY، DB07)؛ staging 9/9 قراءة (36 جدول/77 سياسة/25 دالة)؛ contracts36/36؛ دليل `Audit/p03-runtime-rls-2026-11-10/REPORT.md`.
- 2026-11-10 VERIFIED LOCAL: HEAD `60777c9739d5584360e57bd5238d3a075b06c09a` + working tree؛ AR02/AR03 (مقيسة على `5725727`): unit31/combined36 PASS،0 FAIL/0 SKIP؛ DB18.6 بخمس قواعد ودورruntime/NOBYPASSRLS؛ build/routes55 PASS؛ مرجع `Audit/ar02-ar03-2026-11-10/REPORT.md`؛ لا إطلاق.
- 2026-11-16 VERIFIED STAGING READONLY `lucky-salad-43566291`/`br-rough-wind-bdkmg13n`/`neondb`:42 جدولًا/90 سياسة وledger29 APPLIED؛ hashes0030–0033 مطابقة؛ exploration ودالةconsume موجودتان وruntime EXECUTE علىreadinessguard=false؛ لا اختبارA/B جديد أوcutover؛ يصحح لقطة41/89/28 السابقة؛ `Audit/p01-delta-2026-11-16/staging-hash-comparison.json`.
- العقد المحلي يتطلب `0028` لقفل العضوية/المنح دون صلاحيات تعديل إضافية، و`0029` لمنع مرجعLedger الاصطناعيnull؛ طُبقتا ضمن ledger28/28 على staging المعزول؛ أي تطبيق على الإنتاج يحتاج مراجعة وتفويضًا مستقلًا.
- التقرير له قارئHTML مستقل دون شبكة: `Audit/final-360-2026-11-10/FINAL-360-AUDIT.html`؛ يولد بـbuild-report.mjs؛76 متطلبًا و25 برومبتًا؛ Chromium360/390/768/1440 والبحث/النسخ/CSV وتهيئة الطباعة PASS؛ بيانات التدقيق لم تتغير.
- توجيه المستخدم2026-11-10: لا سقف15 لبرومبتات الإغلاق؛ الخطة الحالية25 بتقسيم تخصصي وتبعيات مفحوصة في `Audit/final-360-2026-11-10/EXECUTION-PROMPTS.md`؛ أرقام التدقيق وNO-GO دون تغيير.
- 2026-11-10 VERIFIED LOCAL (P06-A): HEAD `7d7be00`+working tree؛ دورة Trial خادمية بقناة مشغّل وبوابة جاهزية/حصة؛ contracts46/46، `0030` fresh+delta، build/routes55؛ التفعيل مغلق وP06-B BLOCKED؛ `Audit/p06-trial-2026-11-10/REPORT.md`.
- 2026-11-10 HISTORICAL LIVE CHECK: SHA `7b1f533f71c7b1f41884790366a4d5967c85a87b` طابق Render deploy `dep-dbpg8kgae00c73easjr0`؛ الخدمة `srv-d7m5bcjbc2fs73826v20` static_site/dist/client وapp/Auth/API404؛ لم يُعد فحصها بجولةAR02/AR03؛ Beta/Commercial NO-GO.
- تدقيق360 تاريخي: tests18 PASS/9 FAIL/5 SKIP تجاوزتها نتائجAR02/AR03 المحلية أعلاه؛ Firewall harness8/8 و55 صفحة حية200 دليل مؤرخ في `Audit/final-360-2026-11-10/FINAL-360-AUDIT.md`، دون عمليات منتج حية مثبتة.
- 2026-11-10 VERIFIED LOCAL (P04): HEAD `655a8b9` (ملفاتP04 مطابقة للمرجع `7b1f533`)؛ `/healthz/` عام 200/503 يفحص DB/schema/auth/portal بلا أسرار، و`dist/server/version.json`+readback يربطان service/deploy/SHA/artifact مع `consistent`؛ `healthCheckPath=/healthz/`؛ دليل `Audit/p04-node-ssr-2026-11-10/REPORT.md`.
- 2026-11-10 VERIFIED LOCAL+LIVE (P05): HEAD `7954bb6f` + working tree؛ إصلاح قفل الفاعل في `manageMember`/`policies` عبر `aigas_lock_member` ورفض self-role/revoke مبكرًا وتغليف 42501 في `createWorkspace`؛ contracts42/42 وbuild55 PASS؛ live Auth staging PASS (signup/login/restore/sign-out؛ JWT EdDSA/iss/ttl900؛ 5 هويات اصطناعية/0 جلسات/0 tenants)؛ دليل `Audit/p05-auth-identity-2026-11-10/REPORT.md`.
- 2026-11-10 STAGING FREE (Render): `brightai-staging-node`=`srv-dbpj8jajnfac739je6lg` خطة free/oregon، auto-deploy من `main`، بلا دومين؛ كشف أول نشر أن `scripts/server.mjs` يستمع على loopback ⇒ صار الافتراضي `0.0.0.0`. الخدمة المرجعية `srv-d7m5bcjbc2fs73826v20` ليست في workspace الـCLI (`tea-dade102fngtc739064v0`).
- 2026-11-10 PARTIAL (P13): HEAD `c5ef5547` + working tree؛ اختبارات المحولات 16/16 محليًا؛ مسودة URL غير معتمدة؛ لا وجهة أو ingestion؛ `Audit/p13-observability-2026-11-10/REPORT.md`؛ 2026-11-11: ثغرة `page_referrer` وطي المسارات الخاصة أُغلقتا (18/18) وبقيت الوجهة/canary مفتوحة.
- 2026-11-16 حزمة الإغلاق النشطة `Audit/prompts.md` v2.1 مشتقة من `Audit/BRIGHT-AI-2026-FINAL-360-AUDIT.html`: 16 برومبتًا/G-01…G-16/W1–W9؛ سجل 50 متطلبًا معلن غير مسرود؛ رأس التقرير `7385200` والرأس الحالي `cb9863f`؛ `Audit/final-360-2026-11-10/*` غير موجود على القرص.

## Ledger (الأحدث أولًا)

## [2026-11-17] — مراجعة الهوية وإرث `/en/`
- **تم:** توحيد صفحة «عنّا» حول الاسم المتداول BRIGHT AI والعلامة BRIGHTAI ومجال AIGAS دون إثبات قانوني أو ادعاءات تشغيلية؛ حفظ مراجعة سبع صفحات إنجليزية ومسودات اعتماد خارجية.
- **التحقق:** PASS — مراجعة GET/HTML ونتائج بحث مقتطفة؛ `git diff --check` وفحص تغطية المسارات PASS؛ build BLOCKED بـNode 22.22.2 دون تغيير البيئة.
- **الحالة:** PARTIAL — توصيات الإزالة/الدمج/الترجمة لا تُطبق على الحي قبل مراجعة واعتماد.
- **ملفات:** `src/pages/about.astro`، `Audit/outhers/identity-and-en-review-2026-11-17/REPORT.md`.

## [2026-11-17] — تسجيل 0037 في Delta وإعادة المصفوفة
- **تم:** `'0037'` أُضيف إلى `DELTA_ORDER` بعد `0036`؛ توقعات `tests/migration-order.test.mjs` صارت pending `0030`–`0037` وsuffix أخير أربعة ملفات.
- **تم:** تصحيح خطة Delta: الرأس 23 خطوة تنتهي `0037`، وG4/G5 يطابقان 43 جدولًا/93 سياسة.
- **التحقق:** PASS — migration-order 6/6؛ `verify-runtime-rls` 84/84 على قاعدة fresh؛ dry-run delta 23 خطوة بلا baseline.
- **الحالة:** DONE محليًا؛ أي تطبيق على بيئة NOT RUN.
- **ملفات:** `scripts/migration-order.mjs`, `tests/migration-order.test.mjs`, `docs/AIGAS-DELTA-MIGRATION-PLAN-2026-11-16.md`.

## [2026-11-17] — بيانات التحرير والهوية
- **تم:** مصدرمشتركللتواريخوالناشر؛إزالةmodifiedالثابتوادعاءالمراجعة؛مراجعمرتبطباعتمادونسخةونطاق؛بدائلauthorsتحفظالمساراتوتوضحعدمالإثبات.
- **التحقق:** PASS — unit5/build60/HTML32/Browser17؛390فعلي×3؛src/lockمطابقانلبناءمعزولAstro6.4.8.
- **الحالة:** DONE محليًا؛المؤلفونالقدامىحيًالمتُغيرصفحاتهم؛لامراجعةتخصصيةفعليةأونشر.
- **ملفات:** `docs/EDITORIAL-EVIDENCE.md`،`audit/editorial-schema-2026-11-17/SCHEMA-REPORT.md`.

## [2026-11-17] — مراجعة أربعة أدلة
- **تم:** إجابات وخطوات وأمثلةاصطناعيةوحدودومختص؛إحالات31ادعاءًونوعالمرجعونسخته؛تصحيحاستنتاجالمعالجالتلقائيومسوغالموافقة.
- **التحقق:** PASS — lockfilebuild57/source5/HTML4/Browser8/tree5+back/reset؛NodeالجذربلاوافقAstro7فاستُخدماعتماد6.4.8معزولمطابق.
- **الحالة:** DONE محليًا؛لانشرأودمجURLأواعتمادواقعة؛تاريخنفاذP116مستقلغيرمثبتومعلن.
- **ملفات:** `audit/guide-claims-2026-11-17/REPORT.md`،`audit/guide-claims-2026-11-17/claim-register.csv`.

## [2026-11-17] — خريطة نوايا المحتوى
- **تم:** خريطة311صفحةوخطةتحرير؛تخصيصhubللمرجع/docsللتنفيذ/servicesللنطاقوحفظالقطاعاتالمنشورة؛لاURLsجديدة.
- **التحقق:** PASS — اكتمال32دليل/254إرث/وجهاتدمجموجودةبلاسلاسل؛GSCفعلي/5صفحاتحية؛backlinksوأثرالتنافسغيرمقاسين.
- **الحالة:** DONE للتحليل؛49دمجًااقتراحاتبشرطنقلالفريدوفحصالمصدر؛لانشر.
- **ملفات:** `audit/intent-map-2026-11-17/REPORT.md`.

## [2026-11-17] — إسناد GA4 بأقل إفصاح
- **تم:** Google/Bing origin-only بموافقةمحليةصريحة؛حارسinitواحدومزامنةgate/CSPوإشعارالخصوصية؛التحريرييبقىمحجوبًا.
- **التحقق:** PASS — unit45/Chrome20/compile2؛أدلةpayloadقبل/بعد؛SDKوالحساب NOT VERIFIED.
- **الحالة:** DONE محليًا؛لانشرأوتعديلحسابأوتصحيحالتقاريرالتاريخية.
- **ملفات:** `audit/ga4-attribution-2026-11-17/REPORT.md`.

## [2026-11-17] — Sitemap contract و404
- **تم:** توحيد سياسة الفهرسة وتشديدcanonical/redirect؛404حقيقي صريح؛خطةأصل/حافةمستقلة.
- **التحقق:** PASS محلي57/57 وunit5 وaliases276؛حي311URLفريدًا،demoمخالف والخريطةالقديمةوsoft404باقيان.
- **الحالة:** DONE محليًا؛لانشرأوSearchConsole.
- **ملفات:** `audit/sitemap-contract-2026-11-17/REPORT.md`،`audit/sitemap-contract-2026-11-17/OPERATOR-PLAN.md`.

## [2026-11-17] — برومبتات السلطة والبحث وتجربة المستخدم
- **تم:** مراجعة مصدر موجّهة وجرد آلي؛GSC/GA4/Firecrawl/Browser وقراءةSentry/PostHog/Linear؛حزمة توصيات للمستخدم فقط.
- **التحقق:** PASS — public57HTTP/metadata وunit10؛sitemapقديم264/حالي57 والتسجيل404 والخصوصيةGAمتناقضة حيًا؛mobileطلب390أعاد500 فلايُدّعىقبول390.
- **الحالة:** DONE للتحليل المحدد؛backlinks/fieldCWV/قبولUXشامل NOT VERIFIED؛Similarwebلميُستعلم.

## [2026-11-17] — Repository SEO discovery وإصلاح محلي
- **تم:** جدول492صفًا وأدلةقبل/بعد؛إزالةREADMEالعامالفارغ،وصفdemo6،حارسمعلوماتHTML؛المستخدمأجازالإصلاحاتالمحليةبعدطلبتشخيصي.
- **التحقق:** PASS — lockfilebuild57،unit4،routes57/3304reference/276redirect؛snapshotالمصدرمطابق؛OpenSEO50صفحةفقط.
- **الحالة:** DONE محليًا؛اختلافاتالأصلالحيواعتمادالمراجعوالتحريرمفتوحة؛لانشر.
- **ملفات:** `audit/repository-seo-discovery-2026-11-17/REPORT.md`،`scripts/seo-build.mjs`.

## [2026-11-17] — SEO authority audit
- **تم:** جرد505صفوف للمسارات و16موضوعًا و15issue وخطةمحلية؛لا تعديل مصدر أو نشر.
- **التحقق:** baseline build/routes و6tests PASS؛live449؛mobileLAB CLS6/8 وLCP7/8 فوقالحد؛field/INP NOT VERIFIED.
- **الحالة:** PARTIAL — HEAD تغيّر خارجيًا وفشل بناؤه؛ التنفيذ ينتظر اعتماد الخطة.
- **ملفات:** `audit/seo-authority-2026-11-17/REPORT.md`، `audit/seo-authority-2026-11-17/PLAN.md`.

## [2026-11-17] — Risk Assist
- **تم:** صياغة استشارية مقيدة دون درجة أو قبول أو حفظ آلي؛ المختبر العام مستبعد.
- **التحقق:** PASS — unit11/build وفصل app/demo؛ رحلة Auth/provider NOT VERIFIED.
- **الحالة:** PARTIAL — سجل النماذج المعتمدة فارغ؛ الإدراج المصادق غير مفحوص.
- **ملفات:** `Audit/risk-assist-2026-11-17/REPORT.md`.

## [2026-11-17] — Firewall escalation
- **تم:** محول PENDING ذري، metadata-only وSoD إلزامي، وفلترة مخرجات؛ 0037 default-off.
- **التحقق:** PASS — PG18 مراجعة5/HG1 وunit20/build؛ Browser/المزود NOT RUN.
- **الحالة:** PARTIAL — استئناف التنفيذ وتفسير النص الغامض غير مكتملين؛ لا ترحيل مشترك.
- **ملفات:** `Audit/firewall-escalation-2026-11-17/REPORT.md`.

## [2026-11-16] — حزمة برومبتات H v2.1
- **تم:** `Audit/prompts.md` مزامَنة مع `Audit/BRIGHT-AI-2026-FINAL-360-AUDIT.html`: الأحكام الثلاثة، 22 مقياسًا، مسار P-01…P-16، سجل عدم اليقين 8%، وموجات W1–W9.
- **تم:** مخطط بطاقة ثابت، خطوات بمخرجات، تحقق قبل التعديل، سجل فجوات G-01…G-16 بدليل ملف:سطر، وبوابات G1–G9.
- **التحقق:** PASS — 16/16 بطاقة مكتملة، 0 خطأ جداول، 0 تعارض تبعيات، `HEAD=cb9863f` مقابل رأس التقرير `7385200`.
- **الحالة:** DONE (مستندي؛ لا برومبت منفّذ).
- **ملفات:** `Audit/prompts.md`.

## [2026-11-16] — Verified-email trial
- **تم:** تهيئةذاتيةلمشاركفقطببريدموثق،بياناتSyntheticومنحقراءةمحدودة؛0034علىStagingفقط.
- **التحقق:** PASS — unit13/PG18/Browser5منتجاتوعزل403؛انتهاءبـrollback؛poolerيرفضstartuproleفاستُخدماتصالمباشرaigas_runtime.
- **الحالة:** DONE للنطاقالمحدودعلىStagingبأصلمحلي؛النشرومرور48hفعليًاوOTPعودةمنفصلNOT RUN.
- **ملفات:** `Audit/self-service-trial-2026-11-16/REPORT.md`.

## [2026-11-16] — Experience Hub
- **تم:** تقديم التجربة العامة وفصل مسارها عن التفعيل التشغيلي؛ التفاصيل في `Audit/experience-hub-2026-11-16/REPORT.md`.
- **التحقق:** PASS — build57/navigation3؛ Browser36 مقاسًا بلا overflow، حفظ5، hover64≥5.8:1، keyboard/reduced-motion/noJS/storage-blocked.
- **الحالة:** DONE محليًا؛ النشر وAuth الفعلي NOT RUN.

## Open Issues / Blockers
- 2026-11-11 PARTIAL D05: عيبHero يبقى استثناءً مفتوحًا؛ pricing `<aside class=quote-scope>` landmark moderate خارج نطاق D05؛ قارئ شاشة فعلي وEscape في Ledger المصادق NOT RUN؛ لا شهادة WCAG شاملة.
- 2026-11-11 PARTIAL D02: المصدر محليًا مغلق؛ الرحلة الحية محجوبة بنشر Node SSR (T01) وبجلسة/عضويات/منح حقيقية (T03)؛InternalNOTREADY/PublicCommercialNO-GO.
- 2026-11-16 D01: `/solutions/` الحي200 بالمركز الجديد؛ أُغلق وصف الأثر القديم لهذا المسار بقراءة اليوم؛ تحويلات19 وSW لم تُعد فحوصها، فتظل NOT VERIFIED؛ `Audit/p01-delta-2026-11-16/http.json`.
- 2026-11-11 T05: المالكحددBRIGHT AI/5طلبات+30000توكنيوميًاللمؤسسة/48h؛وثيقةخصوصيةغائبة؛exacttenantغيرموجودباتصال.envالمقروء؛registryفارغوAIGAS_SCغيرمهيأ؛Identity/DBAللنطاقوAI Systems/Privacyلاعتمادالموصل؛InternalNOTREADY/PublicCommercialNO-GO.
- 2026-11-17 PARTIAL T04/G-09: محول PENDING محلي خلف firewall_escalation_enabled (0037 غير مطبق خارجيًا)؛ اعتماد المالك والترحيل وتفعيل المؤسسة وBrowser مفتوحة؛ لا مهايئ provider resume معتمد؛ انظر `Audit/firewall-escalation-2026-11-17/REPORT.md`.
- 2026-11-11 PARTIAL T03: Neon Staging0033 مطبق ومشغل اصطناعي ومنح اختبار موجودة؛ Identity/Kernel للتحقق من pool ورحلةAuth النهائية؛ DevOpsNode للنشر؛ close لا يبطلAuthsessions؛ purge ينتظرالاحتفاظ؛ InternalNOTREADY/PublicCommercialNO-GO.
- 2026-11-10 OPEN (P16): استثناء `GHSA-26w7-cxv4-gfx2` (critical، غير قابل للوصول) يحتاج موافقة المؤسس صراحةً قبل إدراجه؛ الترقية الرئيسية ورفع Node وتطبيق allowlist الآلي (`.github/workflows/ci-build-guard.yml` غير موجود) واعية؛ التحقق الحي لحراسة `Host` ينتظر push.
- 2026-11-10 BLOCKED (P06-B): التفعيل التجريبي يحتاج نتيجة readiness PASS لكل منتج لنفس SHA/البيئة واعتماد الحصص/المدة/الاحتفاظ ونجاح P07–P11؛ لا صفوف جاهزية/حصة ولا مشغّل في أي بيئة؛ `0030` طُبق علىStagingفيT02 مع0031/0032 دون اعتمادجاهزيةأوحصص.
- 2026-11-11 BLOCKED T01: الخدمة العامة static_site/dist/client/pnpm؛ deploy `dep-dbpsb5ss728c738pbpmg` مطابق لـ`8a5f498`؛ app/health/API404 وكاش GET عام300ث؛ يحتاج تفويض نشر معزول وT02/T03، لا إعادة رفع مصدر P04.
- 2026-11-11 VERIFIED Render MCP يعمل قراءة في `tea-d7m59qbeo5us73ekdu80`؛ staging `srv-dbpj8jajnfac739je6lg` أعاد404 فيه؛ افحص workspace التاريخية `tea-dade102fngtc739064v0` قبل إنشاء بديل؛ يصحح unauthorized التاريخي.
- 2026-11-10 BLOCKED (P05): AU03/AU04 نجاحًا يحتاجان قناة P19؛ تحت runtime `createWorkspace`/`accept` يفشلان 503، ودعوات invited غير مرئية قبل bootstrap. 5 هويات staging اصطناعية بلا جلسات؛ حذفها يحتاج تفويضًا مستقلًا.
- 2026-11-10 INVARIANT: `healthCheckPath=/healthz/` في blueprint؛ نشر بلا DB/Auth صالحين لا يصبح healthy (مقصود). `AIGAS_HEALTH_AUTH_PROBE=true` هو الفحص الوحيد الذي يخرج من الخدمة.
- 2026-11-11 VERIFIED READONLY T02: production غيرمحمي31/RLS31/policies2/authenticated grants124؛runtime/ledgerغائبان؛snapshots=[]؛يوجدفرعp08-restore-20261110 التاريخي،لااستعادةحاليةمعتمدةلنافذةالتغيير؛لاكتابةإنتاج.
- 2026-11-10 VERIFIED: الفرع الحي على `0001`–`0012`+`0015` فقط؛ `aigas_ld_events_chain_guard` (دالة+trigger) غائب فسلسلة Ledger غير مفروضة في DB؛ يحتاج `0013`+`0024`.
- 2026-11-10 CLOSED B9: `0018`/`0025` لم تعد تفشل 42704 — حُرست بـ`to_regrole`، وكذلك `0028` الذي كشفه اختبار `client_roles_absent`. ثلاث hashes أصبحت `MODIFIED_AFTER_REFERENCE`؛ لم يتغيّر أي منح.
- 2026-11-10 TARGET: `aigas-staging`=`lucky-salad-43566291` / `br-rough-wind-bdkmg13n`، PG18.6، Neon Auth `better_auth` (9 جداول)، غير محمي (حد الخطة)، بلا scale-to-zero (412)، CU≤1، حصص مضبوطة.
- 2026-11-10 PREREQ: أي بيئة جديدة تفشل على `0001` بـ`3F000 schema "neon_auth" does not exist` إن لم تُهيّأ Neon Auth أولًا؛ متطلب غير موثق في migrations، يجب أن ينتقل إلى runbook النشر.
- 2026-11-10 GOTCHA: منصة Neon تمنح الأدوار المُنشأة `ADMIN TRUE/INHERIT FALSE/SET FALSE` من `cloud_admin` ⇒ `SET ROLE` يفشل 42501 رغم `pg_has_role`; يلزم `GRANT … WITH SET TRUE` **بعد** الترحيلات (يتكرر بعد كل `CREATE ROLE`). الإنتاج يستلمها من `neon_service` بـSET TRUE.
- 2026-11-10 INFO: بين `0018` و`0025` تُنشئ `0023` دالتي trigger تحصلان على `EXECUTE` لـPUBLIC (`authenticated_can_execute=true`)؛ `0025` تسحبهما. أي توقف عند `0024` يترك النافذة مفتوحة.
- 2026-11-10 VERIFIED: إعادة `0025` على `aigas_runtime` موجود تفشل `42501` عند `ALTER ROLE … NOSUPERUSER` بلا superuser؛ مسار `CREATE ROLE` الأول سليم. لا تُعدّل الترحيل المطبّق؛ أصلح في ملف لاحق/runbook.
- 2026-11-11 APPROVED CONDITIONAL T02: المالكاعتمدDataAPIخيارA(تعطيلالإنتاج)بشرطاستيفاءبوابةالاستعادة؛التنفيذNOT RUN؛productionمازالactive/public/anonymous/aggregates=true،Staging404؛HEAD3×400بلامتنليسإغلاقًا؛ `docs/DATA-API-EXPOSURE-DECISION.md`.
- 2026-11-10 BLOCKED (P13): لا وجهة معتمدة — Sentry صفر مشاريع، وPostHog مشروع واحد `720936` على حد الخطة (free، أحداث 0/1M) وإعداداته (IP غير مجهول/console/perf/retention12m) غير معتمدة؛ P21 بلا وثيقة URL؛ لا ingestion/تنبيهات (P22).
- 2026-11-10 OPEN: Bootstrap/RLS وtrial/purge وموافقات المزودين والـUAT ما زالت مفتوحة.
