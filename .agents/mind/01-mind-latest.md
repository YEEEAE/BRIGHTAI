## [2026-11-03] — مقال «مبادئ أخلاقيات الذكاء الاصطناعي في السعودية» في مركز المعرفة
### تم التنفيذ
- أُنشئ `/knowledge/saudi-ai-ethics-principles/` بتصميم زمردي مختلف (شبكة بطاقات قلابة، رادار SVG تفاعلي، جدول مبدأ/ضابط/دليل/مالك، أربع فئات مخاطر) وبطول 3293 كلمة على مقياس `scripts/count-words.mjs`.
- تحققت الوقائع من نسخة سدايا الرسمية المؤرخة مايو 2025 (SDAIA-P114E): سبعة مبادئ بمسمياتها، أربع فئات مخاطر، النطاق، دورة الحياة، والأدوار. أُضيف تحذير أن الأثر النظامي للمبادئ يحتاج مراجعة قانونية.
- أُضيفت بطاقة رقم 07 في `docs.astro` بقسم الحوكمة ونوع «مصفوفة تعليمية»؛ العدّاد صار 7 تلقائياً، والبحث والتصفية يعملان.
- أُضيفت 3 روابط عكسية سياقية من مقالات الحوكمة والمخاطر وإطار التبني، وسُجلت 11 رابطاً لمقالات لم تُنشأ بعد في `.agents/pending-links.md`.
### الملفات المتأثرة
- `src/pages/knowledge/saudi-ai-ethics-principles.astro` (جديد)، `src/pages/docs.astro`، `src/pages/knowledge/{ai-governance-saudi,ai-risk-assessment,sdaia-ai-adoption-framework}.astro`، `.agents/pending-links.md` (جديد).
### التحقق
- `npm run build`: PASS؛ 3293 كلمة داخل 2900–3300؛ H1 واحد؛ 5 كتل JSON-LD تُحلَّل وFAQ الخمسة مطابق حرفياً للنص الظاهر؛ 12 رابط مقال و4 روابط صفحات موقع داخل النص؛ sitemap/canonical/robots/og:locale: PASS.
- المتصفح (1280/360): لا تمرير أفقي؛ البطاقات القلابة والرادار وأعادة الضبط تعمل؛ `prefers-reduced-motion` يعطّل الانتقالات ويبقي المحتوى؛ لا أخطاء console.
### النتيجة
- **الحالة:** DONE محلياً؛ build ناجح، ولا commit/push/deploy.
### ملاحظات / مشاكل مفتوحة
- الأثر النظامي الملزم للمبادئ، وفتح آلية التسجيل/الشارات الاختيارية، يحتاجان مراجعة بشرية/قانونية مسجلة كـ`TODO-VERIFY` داخل الصفحة.

## [2026-11-03] — مقال «إطار تبني الذكاء الاصطناعي من سدايا» في مركز المعرفة
### تم التنفيذ
- أُنشئ مقال `/knowledge/sdaia-ai-adoption-framework/` بتصميم خاص (خارطة طريق SVG تُرسم بالتمرير، اختبار نضج من 6 أسئلة يعمل محلياً، جدول مقارنة، سلّم مستويات نضج) بطول 3291 كلمة على مقياس `scripts/count-words.mjs`.
- تحققت الوقائع من بيان وكالة الأنباء السعودية (1 ديسمبر 2024، إصدار سبتمبر 2024، الدعائم الثلاث، مستويات النضج الأربعة، مبادئ 2023) وليست من الذاكرة. الوثيقة الرسمية PDF لم تُفتح مباشرة (WAF) وتعذر التحقق الآلي منها.
- أُضيفت بطاقة رقم 06 في `docs.astro` بقسم «الحوكمة»، وحُوِّل ربط التصنيف من فهرس موضعي هش إلى حقل `topic` صريح لكل مقال؛ العدّاد صار 6 تلقائياً.
- أُضيفت روابط عكسية سياقية من مقالات الحوكمة والمخاطر والسياسة، وسُجلت 8 روابط لمقالات لم تُنشأ بعد في `.agents/pending-links.md`.
### الملفات المتأثرة
- `src/pages/knowledge/sdaia-ai-adoption-framework.astro` (جديد)، `src/pages/docs.astro`، `src/pages/knowledge/{ai-governance-saudi,ai-risk-assessment,ai-use-policy-employees}.astro`, `scripts/count-words.mjs` (جديد)، `.agents/pending-links.md` (جديد).
### التحقق
- `npm run build`: PASS؛ عدد الكلمات 3291 داخل 2900–3300؛ H1 واحد؛ 5 كتل JSON-LD تُحلَّل وFAQ مطابق حرفياً للنص الظاهر؛ sitemap وcanonical وrobots وog:locale: PASS؛ 11 رابطاً معرفياً كلها موجودة أو مسجلة.
- المتصفح (1280/768/360): لا تمرير أفقي (أُصلح تجاوز ناتج عن شبكة `.k1-body` مع جدول `min-inline-size`)؛ الاختبار يعمل ويتعامل مع الإجابة الناقصة؛ `prefers-reduced-motion` يرسم المسار كاملاً ويفعّل المحطات الست.
### النتيجة
- **الحالة:** DONE محلياً؛ build ناجح، ولا commit/push/deploy.
### ملاحظات / مشاكل مفتوحة
- رابط PDF الرسمي لسدايا محجوب على مستوى WAF من هذه الشبكة؛ أُدرج الرابط المنشور في البيان مع تنبيه في صفحة المراجع، ويلزم فتحه ومراجعة نص الوثيقة بشرياً قبل النشر النهائي.
- تعريف وصف كل مستوى نضج وترتيب محطات خارطة الطريق قراءة تبسيطية، موسومة بذلك داخل الصفحة.

## [2026-11-03] — تقوية ترويسات الاستجابة والحركة والوصول محليًا
### تم التنفيذ
- أضيفت ترويسات أمنية موحّدة في `src/middleware.ts` لكل الاستجابات (nosniff، منع التأطير، referrer، permissions، HSTS عند HTTPS مؤكد)، مع إبقاء `no-store` و`noindex` و`Vary` للبوابة ومنع تكرار `Vary`.
- أضيف حد كتابة بسيط في الذاكرة لمسارات Kernel الإدارية (60/دقيقة لكل مستخدم ومسار) مع `Retry-After`، دون ادعاء أنه حصة دائمة أو تفويض.
- صُلب اتصال القاعدة: مستمع أخطاء للمسبح، `query_timeout`، وROLLBACK لا يطمس الخطأ الأصلي. وأضيف `Referrer-Policy` لاستجابات Secure Chat و`Retry-After` لحد الاستخدام.
- أُزيل ازدواج مراقبة الظهور بين `MotionController` و`InteriorMotion` داخل الصفحات الداخلية، وأُغلقت المراقبات والاستماعات، واحتُرم `prefers-reduced-motion` للعناوين والتمرير، ومنع شريط تقدّم قراءة مزدوجًا.
- تحسينات وصول محدودة: `tabindex="-1"` لأهداف التخطي، `aria-busy` لنموذج Secure Chat، رسائل شبكة/JSON عربية، وإخفاء السهم الزخرفي عن قارئ الشاشة.
### الملفات المتأثرة
- `src/middleware.ts`, `src/server/kernel/{http,db}.mjs`, `src/server/secure-chat/service.mjs`, `src/components/{MotionController.astro,PageShell.astro}`, `src/scripts/{interior-motion,secure-chat}.ts`, `src/layouts/AppLayout.astro`, `src/styles/{experience,site}.css`, `render.yaml`.
### التحقق
- `node --check` لملفات `.mjs` المعدلة و`git diff --check`: PASS. build/lint/typecheck/tests/runtime/headers الفعلية: NOT RUN حسب طلب المهمة.
### النتيجة
- **الحالة:** PARTIAL / تعديل محلي غير متحقق تشغيليًا.
### ملاحظات / مشاكل مفتوحة
- لم تُضف سياسة CSP كاملة بالنونس لأن الصفحات تحتوي سكربتات inline حالية؛ المضافة تقتصر على `frame-ancestors`. يلزم التحقق من الترويسات على Render قبل الإطلاق ومن اعتماد تشغيل البوابة/المزود.

## [2026-11-03] — صدق تجربة 48 ساعة والاستحقاقات التجارية محليًا
### تم التنفيذ
- وُحدت صلاحية المنحة `ADMIN_NON_BILLED` للمنتجات الخمسة بين حارس Kernel واللوحة والتمكين؛ بداية الموافقة المستقبلية والنوع/المدد غير الصالحة لا تمنح وصولًا. استُكمل الحد نفسه في تكامل Ledger وفحص Human Gate النهائي.
- فُصلت تواريخ الإتاحة الإدارية عن `trialDetails.activated_at/expires_at` الفارغتين؛ الاشتراك والرخصة والتجربة `NOT_CONFIGURED`، ومدة 172800 ثانية متطلب وليست عدادًا عاملًا. لا مصدر استحقاق تجاري أو تفعيل تجربة أو دفع أُضيف.
- أضيف ملخص أول/آخر حدث محفوظ للمؤسسة من سجل Kernel فقط؛ ليس نافذة تجربة أو تقرير PoV أو دليل نجاح منتج. رسائل التسعير والتواصل والمواصفات تميز mailto عن طلب محفوظ، وPoV عن Pilot، ونماذج النشر المستهدفة عن الإتاحة.
- وُضحت الأهلية الاصطناعية، وشرط الموافقة المكتوبة والبيئة المعتمدة للبيانات الحقيقية، واستقلال No-Training عن موافقة التشغيل؛ الهيرو وConstellation لم يُعدلا.
### الملفات المتأثرة
- `src/server/kernel/{access,administration,service}.mjs`, `src/server/ledger/writer.mjs`, `src/server/human-gate/service.mjs`, `src/pages/{pricing,contact}.astro`, صفحة/سكربت/تنسيق Kernel.
- `docs/{KERNEL-DEVELOPMENT,ENTERPRISE-TRIAL-POLICY,PRICING-AND-LICENSING}.md`, مواصفتا تجربة Firewall وSecure Chat.
### التحقق
- قراءة المصدر والـdiff فقط؛ الاختبارات/build/lint/typecheck/المتصفح والتدقيق المنفصل: NOT RUN حسب الطلب. لا Neon أو migrations أو commit/push/deploy.
### النتيجة
- **الحالة:** PARTIAL / محلي فقط، التشغيل NOT VERIFIED.
### ملاحظات / مشاكل مفتوحة
- تشغيل تجربة فعلية بمهلة 48 ساعة وإنفاذها يتطلب مسار موافقة وتهيئة وإصدار استحقاق موثق لم يُنفذ هنا؛ لا تُحوّل المنحة الإدارية إلى تجربة. يلزم اعتماد الحصص والمعالجة والمزود والعقد والترخيص والنشر، وإعداد profiles المحلية/المعزولة قبل إتاحتها.

## [2026-11-03] — توحيد حدود Kernel وتبعيات المنتجات محليًا
### تم التنفيذ
- أضيفت حالات التبعية الموحدة `available/not configured/access denied/expired/temporarily unavailable` لحدود الإتاحة ومخرجات تكاملات Firewall وSecure Chat؛ بقيت العضوية ومنحة Kernel شرط الوصول للمنتج.
- صارت سجلات Kernel لأحداث Firewall وHuman Gate وRisk Engine وSecure Chat تحمل ارتباطًا محدودًا (tenant/actor موجودان، correlation UUID، نسخة سياسة، ومفتاح idempotency) دون متن الطلب؛ التكرار بنفس المفتاح يعيد السجل ذاته ويرفض التعارض.
- أضيف ترحيل محلي `0017_aigas_kernel_audit_context.sql` لحقول السياق وفهرس idempotency. فشل Ledger الاختياري يُعزل داخل savepoint مع تسجيل حالة التبعية، والمتطلب المعتمد يظل fail-closed.
- لم تُطبق أي تغييرات على Neon، ولم تُشغّل اختبارات أو build أو lint أو typecheck حسب الطلب.
### الملفات المتأثرة
- `src/server/kernel/{core,access,service,http}.mjs`, `src/server/ledger/{writer,http}.mjs`, `src/server/firewall/{provider,escalation,guard,service,http}.mjs`, `src/server/human-gate/{service,http}.mjs`, `src/server/risk-engine/{service,http}.mjs`, `src/server/secure-chat/{adapter,requests,service}.mjs`, `migrations/0017_aigas_kernel_audit_context.sql`
### التحقق
- مراجعة المصدر والـdiff يدويًا: تم؛ الاختبارات/build/lint/typecheck/runtime: NOT RUN حسب الطلب.
### النتيجة
- **الحالة:** PARTIAL / تعديل محلي غير متحقق تشغيليًا.
### ملاحظات / مشاكل مفتوحة
- التطبيق يتطلب اعتماد وتطبيق `0017` على بيئة معتمدة قبل تشغيل نسخة الكود؛ لا SQL أو migration production نُفّذ.

## [2026-11-03] — Secure Chat: حصة رموز المستخدم وحالة النموذج الصريحة
### تم التنفيذ
- قائمة النماذج ترجع فقط النماذج المعتمدة والمهيأة؛ غياب النموذج أو إعداد الموصل/دليل No-Training يعرض `NO_APPROVED_MODEL`، بلا إرسال أو fallback.
- أضيف حد رموز يومي للمستخدم مع حصة المؤسسة الحالية؛ يتطلب دالة تجميع جديدة محمية في ترحيل محلي `0016`.
- أضيف حد إدخال محافظ حسب bytes/overhead للنموذج؛ usage المزود المفقود أو المتجاوز للسقف لا يُقبل كرد ناجح.
- أُبقيت المحادثات مؤقتة، وسجل Kernel metadata دون متن؛ تحديث مواصفة التجربة وحالة الميزات يميزان المصدر المحلي عن التشغيل المعتمد.
### الملفات المتأثرة
- `src/server/secure-chat/{adapter,models,policy,requests,service}.mjs`, `src/scripts/secure-chat.ts`, `migrations/0016_aigas_sc_user_token_quota.sql`, `docs/products/secure-chat/{48H-TRIAL-SPEC.md,FEATURE-STATUS.yaml}`
### التحقق
- قراءة المصدر والتعديل: تمت؛ build/tests/lint/typecheck/Neon: NOT RUN حسب الطلب.
### النتيجة
- **الحالة:** PARTIAL / محلي فقط، التشغيل NOT VERIFIED.
### ملاحظات / مشاكل مفتوحة
- `0016` لم يُطبق؛ يلزم اعتماد حدود الاستخدام ومراجعة ملكية الدالة ومنح EXECUTE في بيئة معتمدة. لا يوجد نموذج مزود معتمد ومهيأ؛ الإرسال الحقيقي يظل موقوفًا.

## [2026-11-03] — استكمال شريحة Risk Engine محليًا
### تم التنفيذ
- أضيفت حقول سياق البيانات والمزوّد/النموذج وحالة اعتماد وصفية، وأرشفة غير هدّامة بإصدار جديد تحفظ السجل؛ أضيفت استعادة النسخة كتعديل جديد لا يعيد كتابة التاريخ.
- وسّع التقييمات المحفوظة لتضمين سياق الأصل، وأضيف وصف الخطر المتبقي لكل إصدار معالجة؛ HIGH يتطلب مراجعة بشرية ولا يمنح تصريح تشغيل.
- بطلب صريح لاحق، طُبق ترحيل `0015` على فرع `production` في مشروع Neon `young-frog-60183055`/قاعدة `neondb` بمعاملة واحدة؛ لم يُنشأ فرع. بقيت الجداول/السجلات السابقة محفوظة.
### الملفات المتأثرة
- `src/server/risk-engine/{core,service,http}.mjs`, `src/scripts/risk-engine.ts`, `src/components/RiskWorkspace.astro`, API أرشفة الأصل، `migrations/0015_*.sql`, وثائق Risk Engine.
### التحقق
- فحص مخطط Neon بعد التطبيق أكد الحقول والـdefaults وقيود CHECK: PASS. اختبارات/build/lint/typecheck/browser: NOT RUN حسب الطلب؛ السلوك التشغيلي غير متحقق.
### النتيجة
- **الحالة:** ترحيل Neon مطبق ومخططه متحقق؛ الكود المحلي PARTIAL / NOT RUNTIME VERIFIED. لا commit/push/deploy.
### ملاحظات / مشاكل مفتوحة
- يلزم التحقق من RLS/runtime/session بعد نشر/تشغيل معتمد. اعتماد الحالة التنظيمي وتكامل بوابة نشر خارج النطاق.

## [2026-11-03] — تثبيت ModLens في DSH desktop
### تم التنفيذ
- ثُبّتت `@liustack/modlens@3.27.2` على بروفايل Harness `desktop` وفُعّلت؛ لم تُعدّل ملفات التطبيق.
- ظهرت أداة `modlens_read_image` ضمن أدوات الوكيل بعد التثبيت.
### التحقق
- Plugin Manager: `application: applied` بلا warnings؛ الحزمة مؤكدة مثبتة ومفعّلة.
- إعداد محرك الرؤية واختبار قراءة صورة: NOT RUN؛ يلزم إعداد محرك في ModLens.
### النتيجة
- **الحالة:** DONE للتثبيت؛ استخدام الرؤية يعتمد على إعداد محرك.

## [2026-11-03] — Human Gate: إلغاء وتفويض مؤقت وإذن تنفيذ واحد
### تم التنفيذ
- أضيفت حالة `CANCELLED` ومسار إلغاء مخول بسبب، ويُبطل إذن التنفيذ النشط؛ القرارات المتأخرة والانتقالات غير المصرح بها ممنوعة في الخدمة وفي حارس SQL الجديد.
- رُبط الطلب بالمورد `provider_ref` وبصمة v3، وأصبحت السياسة تحدد `review_level` و`separation_of_duties` و`delegation_enabled`. التفويض محدد العملية والمستوى والمدة على الخادم، ولا يتجاوز دور المفوّض الحالي ولا يلغي فصل المهام.
- الموافقة تصدر `aigas_hg_grants` مرتبطًا بالبصمة والنسخة والهدف؛ `/execute` يعيد فحص السياسة والهدف وصلاحية المراجع والمفوّض ويستهلك الإذن مرة واحدة داخل معاملة واحدة.
- أضيفت واجهة ومسارات API للإلغاء وإدارة التفويضات وعرض سبب الرفض/الإلغاء وحالة الإذن وسجل الطلب، مع تمييز إيقاف Kernel الأساسي (`REQUEST_APPROVAL`/`ESCALATE`) عن إضافة Human Gate.
- أضيف `0014_aigas_human_gate_cancellation_delegation_and_grant.sql` محليًا **غير مطبق**؛ لم تُنفذ تغييرات Neon أو نشر أو build/tests.
### الملفات المتأثرة
- `src/server/human-gate/{core,service,http}.mjs`, `src/server/kernel/core.mjs`, `src/pages/app/api/human-gate/` (cancel/delegations)، صفحة/سكربت/تنسيق Human Gate.
- `migrations/0014_aigas_human_gate_cancellation_delegation_and_grant.sql` (جديد)، `docs/HUMAN-GATE-DEVELOPMENT.md`, `docs/products/human-gate/{PRODUCT-SPEC.md,FEATURE-STATUS.yaml}`.
### التحقق
- `node --check` لملفات `.mjs` المعدلة و`git diff --check` وYAML: PASS. build/tests/lint/typecheck/DB/متصفح/جلسة حقيقية: NOT RUN بطلب المهمة.
### النتيجة
- **الحالة:** PARTIAL / LOCAL IMPLEMENTED NOT RUNTIME VERIFIED؛ لا commit/push/deploy ولا SQL إنتاجي.
### ملاحظات / مشاكل مفتوحة
- يلزم اعتماد `0014` وتطبيقه على هدف معتمد ثم مراجعة runtime grants/RLS والتحقق من جلسة فعلية. مسار الإيقاف الأساسي في Kernel لم يُعدّل، لكن تشغيله لم يُختبر هنا.

## [2026-11-03] — Ledger: حالة تحقق صريحة وتصدير مثبّت الإصدار وترحيل ترقية محلي
### تم التنفيذ
- أضيفت حالة مشتقة واحدة `VERIFIED/BLOCKED/UNVERIFIED` مع أسباب مقيدة لكل حدث ولكل سلسلة؛ لا تُعلن السلامة عند تطابق حدث واحد إذا كانت البادئة غير مكتملة أو متجاوزة الحد أو بها رابط مكسور أو تسلسل ناقص.
- حزمة التصدير تسجل المصادر ونسخ السياسة و`hash_profile` وإصدار الفاحص المستقل؛ الفاحص يرفض المطابقة عند اختلاف الإصدار المسجل ويعيد `INDETERMINATE/VERIFIER_VERSION_MISMATCH`، ويظهر `verifier.pinned` و`warnings` عند غياب الإصدار في حزمة قديمة.
- البيانات الوصفية لا تخرج من الخادم إلا بعد المرور بعقد المصدر الحالي؛ الصفوف غير المطابقة تُعرض ببيانات وصفية فارغة وحالة غير محسومة بدل metadata خام. أضيف تحقق أن القيم scalar، ورفض مبكر لنسخة السياسة/مفتاح التكرار غير الصالحين.
- أضيف ترحيل ترقية محلي `0013_aigas_ledger_five_state_and_chain_guard.sql` (غير مطبق): يوائم قيد `aigas_ld_events` مع حالات Firewall الخمس و`request_fingerprint` كـ`NOT VALID` دون إعادة كتابة أدلة مختومة، ويضيف trigger يرفض فجوة التسلسل أو `previous_hash` الخاطئ عند الإدراج. حُدّث `0003` كتثبيت جديد فقط.
- واجهة Ledger تعرض الحالة والأسباب لكل حدث/سلسلة، وتُظهر الحالة المحجوبة أو غير المتحققة بدل نجاح ضمني، مع RTL وحالات focus القائمة.
### الملفات المتأثرة
- `src/server/ledger/{core,writer,service}.mjs`, `src/scripts/ledger.ts`, `src/pages/app/ledger/index.astro`, `src/styles/ledger.css`, `public/downloads/aigas-ledger-verifier.mjs`
- `migrations/0003_aigas_ledger.sql`, `migrations/0013_aigas_ledger_five_state_and_chain_guard.sql` (جديد)، `docs/products/ledger/ACCEPTANCE-AND-EVIDENCE.md`
### التحقق
- `node --check` لملفات `.mjs` المعدلة و`git diff --check`: PASS. بناء/اختبارات/lint/typecheck/متصفح/معاينة Node: NOT RUN بطلب المهمة.
- فحص Neon قراءة فقط عبر MCP: جداول `aigas_ld_events` و`aigas_ld_evidence_requirements` موجودة، لكن قيد metadata ما زال ثلاثي الحالات ولا يسمح بـ`request_fingerprint`؛ أي لا يثبت تطبيق `0013`.
### النتيجة
- **الحالة:** PARTIAL / LOCAL IMPLEMENTED NOT RUNTIME VERIFIED؛ لا commit/push/deploy ولا SQL تغييري.
### ملاحظات / مشاكل مفتوحة
- حتى يُراجع ويُطبق `0013` على بيئة معتمدة، أي دليل Ledger لحدث Firewall بحالة `WARN/ESCALATE/DENY` أو ببصمة تنفيذ `GUARD` قد يرفضه قيد production الحالي. التطبيق يحتاج تفويضًا مستقلًا.
- runtime grants/RLS وجلسة فعلية وتصدير/فاحص على بيئة معتمدة وبناء الواجهة: NOT VERIFIED.

## [2026-11-03] — ترحيل Firewall وهرمية السياسات على Neon production
### تم التنفيذ
- فحص Neon أظهر أن جداول Firewall موجودة بمخطط قديم ثلاثي (`ALLOW/BLOCK/REDACT` و`RULE_BLOCK`) وأن `0011` لا ينطبق؛ أُضيف `0012_aigas_firewall_five_state_upgrade.sql` يحوّل `BLOCK→DENY` و`RULE_BLOCK→RULE_DENY`، ويضيف قيود الحالات الخمس و`policy_version`/`request_fingerprint` (فحص وجود البصمة `NOT VALID` للصفوف القديمة).
- طُبّق `0012` ثم `0010` داخل معاملتين على `production` بتفويض صريح من المالك؛ أصبح عدد جداول public 31 مع جداول هرمية السياسات وRLS والـtriggers. لم يُطبّق `0011` لأنه غير لازم.
- القاعدة كانت وما زالت بلا مؤسسات أو قواعد أو قرارات أو سياسات (0)؛ لم تُنشأ أو تُحوّل أو تُحذف بيانات تطبيق.
### الملفات المتأثرة
- `migrations/0012_aigas_firewall_five_state_upgrade.sql` (جديد)، وسم 0002، `docs/FIREWALL-DEVELOPMENT.md`، `docs/products/firewall/ACCEPTANCE-AND-EVIDENCE.md`
### التحقق
- استعلامات كتالوج بعد الترحيل للأعمدة والقيود والدوال والـtriggers وRLS: PASS؛ عدّ البيانات 0: PASS. build/tests/typecheck/تشغيل التطبيق: NOT RUN.
### النتيجة
- **الحالة:** DONE للترحيل على production؛ runtime role/RLS وجلسة فعلية والنشر NOT VERIFIED.
### ملاحظات / مفتوحة
- التنفيذ الخارجي يبقى محجوبًا: لا سياسة Enterprise ALLOW منشورة (أي GUARD يعود DENY/KERNEL_POLICY_DENIED) ولا مزود معتمد ولا تكامل Human Gate. يلزم التحقق من صلاحيات دور runtime واختبار تطبيق فعلي.

## [2026-11-03] — Firewall: ربط قرار التنفيذ وبصمة الطلب وتكامل المراجعة المغلق
### تم التنفيذ
- فُصل المساران صراحةً: `/evaluate/` تقييم نظري `LAB` لا ينفذ، و`/guarded-executions/` وحده `GUARD`. كل قرار GUARD يُحفظ مع `policy_version` (مرجع مجمّع لنسخ/بصمات سياسات Kernel) و`request_fingerprint` = SHA-256 على المؤسسة والفاعل ومعرّف الطلب UUID ونسخة السياسة ونتيجة القرار، دون النص أو بصمته.
- الـguard يعيد حساب مرجع السياسة والبصمة من أدلة السياسة الفعلية ويرفض `EXECUTION_BINDING_MISMATCH`، ويتطلب Kernel `ALLOW` وربطًا صالحًا قبل البحث عن مزود؛ المزود ما زال registry فارغًا فيرجع `PROVIDER_NOT_CONFIGURED`، ومهلة 15s افتراض محلي غير معتمد.
- idempotency: فحص مسبق تحت قفل المؤسسة؛ إعادة نفس البصمة ترجع 409 `REQUEST_ALREADY_EVALUATED`، وإعادة استخدام UUID لقرار مختلف ترجع 409 `REQUEST_ID_CONFLICT`، ولا يُعاد التنفيذ في الحالتين.
- `ESCALATE` يوقف قبل المزود؛ سجل تكامل Human Gate فارغ عمدًا (لا عملية معتمدة ولا عقد حمولة للمراجعة) فترجع 409 `HUMAN_GATE_NOT_CONFIGURED` دون إنشاء طلب، مع مسار 202 `REVIEW_PENDING` محفوظ لتكامل معتمد مستقبلي. دليل Ledger الإلزامي ما زال داخل نفس المعاملة قبل أي إرسال.
- أضيف `migrations/0011_aigas_firewall_execution_binding.sql` كترحيل ترقية محلي غير مطبق، وحُدّث 0002 fresh-install بالعمودين؛ لم يُنفّذ SQL أو build/tests/typecheck أو نشر.
### الملفات المتأثرة
- `src/server/firewall/{binding,guard,provider,service,escalation,core}.mjs`, `src/server/ledger/core.mjs`, `src/scripts/firewall.ts`, `src/pages/app/firewall/index.astro`
- `migrations/{0002_aigas_firewall,0011_aigas_firewall_execution_binding}.sql`, `docs/FIREWALL-DEVELOPMENT.md`, `docs/products/firewall/ACCEPTANCE-AND-EVIDENCE.md`
### التحقق
- `node --check` لملفات `.mjs` المعدلة و`git diff --check`: PASS. build/tests/lint/typecheck/DB/متصفح: NOT RUN بطلب المهمة.
### النتيجة
- **الحالة:** PARTIAL / LOCAL IMPLEMENTED NOT RUNTIME VERIFIED؛ لا commit/push/deploy ولا تطبيق Neon.
### ملاحظات / مشاكل مفتوحة
- تفعيل الإرسال يحتاج مزودًا معتمدًا (نموذج/منطقة/عدم تدريب/مرجع اعتماد) ومراجعة مهلة، وتفعيل ESCALATE يحتاج عملية Human Gate معتمدة وعقد حمولة لا يخزن النص. ترحيل 0011 و0002 وruntime grants/RLS غير متحققين.

## [2026-11-03] — Firewall: خمس حالات قرار وإدارة قواعد كاملة محليًا
### تم التنفيذ
- وُحّدت حالات القرار إلى `ALLOW/WARN/REDACT/ESCALATE/DENY` بترتيب دفاعي `DENY>ESCALATE>REDACT>WARN>ALLOW`؛ `WARN` و`ESCALATE` لا يمرران في مسار الإنفاذ، وسياسة Kernel غير `ALLOW` تصبح `DENY/KERNEL_POLICY_DENIED`. `ESCALATE` يقابل `REQUEST_APPROVAL` و`DENY` يقابل `BLOCK` في وصف المنتج.
- أضيف نسخ القاعدة (اسم خادمي فريد، نسخة معطّلة) وحذفها مع منع حذف القوالب التأسيسية أو أي قاعدة مذكورة في قرارات محفوظة؛ كل قراءة/كتابة تعيد التحقق من الهوية والعضوية والمؤسسة والمنحة.
- أضيف حد 60 تقييمًا/دقيقة لكل مؤسسة فوق حماية UUID، وأصبحت واجهة «جرب فحصًا» تعرض المدخل والقرار ومعرّف القاعدة والسبب ووقت التقييم والحالة، وتعرض «التهيئة غير مكتملة» بدل قرار عند غياب الجداول.
- لا يعيد API نص `DENY/ESCALATE/WARN`؛ السجل يحفظ metadata فقط (بلا نص أو أسرار). القوالب الثلاثة باقية، و`prohibited` صار `DENY`.
### الملفات المتأثرة
- `src/server/firewall/{core,service,http,guard}.mjs`, `src/server/ledger/core.mjs`, `src/pages/app/{firewall,api/firewall}/`, `src/scripts/firewall.ts`, `src/styles/firewall.css`
- `migrations/0002_aigas_firewall.sql` (مراجعة fresh-install، غير مطبقة), `docs/FIREWALL-DEVELOPMENT.md`, `docs/products/firewall/{PRODUCT-SPEC.md,API-CONTRACT.yaml}`
### التحقق
- مراجعة diff و`git diff --check` و`node --check` لملفات `.mjs`: PASS. build/tests/lint/typecheck/متصفح: NOT RUN بطلب المهمة.
### النتيجة
- **الحالة:** PARTIAL / LOCAL IMPLEMENTED NOT RUNTIME VERIFIED؛ لا commit/push/deploy ولا تطبيق على Neon.
### ملاحظات / مشاكل مفتوحة
- 0002 رُوجع كـfresh-install بخمس حالات ولم يُطبّق؛ أي قاعدة بيانات طبّقت النسخة السابقة تحتاج ترحيل ترقية مراجعًا بدل هذا الملف. اختبارات `tests/firewall*.mjs` لم تُعدّل/تُشغّل وما زالت تعكس العقد الثلاثي السابق. تفعيل `ESCALATE` تشغيليًا يحتاج مسار موافقة معتمدًا، وإرسال `ALLOW/REDACT` يحتاج مزودًا معتمدًا.

## [2026-11-03] — إعداد Neon للأيجنت: CLI والمهارات وخادم MCP
### تم التنفيذ
- ثُبّت Neon CLI `8.17.0` عالميًا؛ فشل npm cache/EPERM عولج بمخزن مؤقت بدل `sudo chown`، والحساب مسجّل مسبقًا (`zezo--270@hotmail.com`) فلم يُشغّل `neon login`.
- مهارات Neon في `.agents/skills/neon*` كانت مثبتة يدويًا وخارج تتبّع `neon skills update`؛ أُضيفت `neon-realtime` الناقصة عبر `neon skills -s neon-realtime -y`.
- أُنشئت حزمة إعداد فقط `plugins/neon-mcp` تربط `@deepseek-ai/dsh-mcp-client` بخادم `https://mcp.neon.tech/mcp?projectId=young-frog-60183055` عبر streamable-http؛ DSH غير مدعوم في أوامر Neon لذلك كان الربط يدويًا.
- مفتاح Neon API محدود بالمشروع (`dsh-neon-mcp-20261103`, id 3492946) وُضع في تجاوز سطر `neon-mcp` داخل `~/.dsh/profiles/desktop/cordis.patch.yml` فقط مع نسخة احتياطية؛ المستودع بلا سر.
- `.env` يطابق قيم Neon المعطاة (pooled/unpooled، `production`، Auth URLs) فلم يُعدّل.
### الملفات المتأثرة
- `plugins/neon-mcp/{package.json,cordis.patch.yml,locale/*.json,icon.svg,README.md}`, `.agents/skills/neon-realtime`, `~/.dsh/profiles/desktop/cordis.patch.yml`
### التحقق
- `neon me` و`neon projects list`: PASS؛ تثبيت الحزمة `application: applied`؛ نداء `mcp__neon__list_branches` أعاد `production` / `br-young-bird-b43proeb`: PASS.
- build والاختبارات: NOT RUN — لا تغيير في كود التطبيق.
### النتيجة
- **الحالة:** DONE للإعداد والاتصال؛ لا commit/push/deploy ولا ترحيل أو تعديل بيانات.
### ملاحظات / مشاكل مفتوحة
- المفتاح يمنح صلاحية كاملة داخل المشروع فقط (لا مشاريع أخرى ولا إنشاء مفاتيح)؛ يُلغى بـ`neon api-keys revoke 3492946`.
- المهارات المثبتة يدويًا لا يحدّثها `neon skills update`؛ التحديث يحتاج إعادة تثبيت صريحة.

## [2026-11-03] — قناة EAC في dsh-our-free-model: star مطلوب
### تم التنفيذ
- سبب فشل «This turn failed» عند اختيار نموذج EAC هو بوّابة الإضافة `dsh-our-free-model@2.8.0` (مركّبة من `github:ebony-vinyl/dsh-our-free-model`): نماذج EAC لا تعمل قبل تسجيل دخول GitHub وstar للمستودع.
- من الكود: الـstar يُفحص في جهة الخادم عبر `auth/poll` على بوّابة المزوّد، والمستودع الافتراضي `Ebony-Vinyl/dsh-our-free-model`؛ التوكن المحفوظ محليًا هو توكن البوّابة لا توكن GitHub.
- نُفّذ الـstar بحساب المالك عبر `gh api -X PUT /user/starred/Ebony-Vinyl/dsh-our-free-model` وتأكّد بـ204.
- يبقى تسجيل الدخول عبر GitHub من لوحة EAC في الإضافة؛ لا يُنفّذ نيابة عن المالك لأنها موافقة OAuth.
### الملفات المتأثرة
- `~/.dsh/profiles/desktop/{package.json,pnpm-lock.yaml,node_modules/dsh-our-free-model}`
### التحقق
- `PUT /user/starred/...`: PASS (204)، و`GET` بعده يعيد 204.
- تشغيل نموذج EAC فعليًا: NOT RUN — يحتاج OAuth من المتصفح.
### النتيجة
- **الحالة:** DONE للـstar؛ تفعيل قناة EAC PARTIAL حتى يكمل المالك تسجيل الدخول.
### ملاحظات / مشاكل مفتوحة
- قناة EAC تمرّر المحادثات عبر بوّابة طرف ثالث تتحقق من الـstar؛ تُعامل كسطح ثقة خارجي ولا تُرسل إليها بيانات حساسة. إزالة الـstar تُبطل الوصول بحسب تصميم الإضافة.

## [2026-11-03] — أساس تنفيذ هرمية سياسات Kernel محليًا
### تم التنفيذ
- أُضيف ترحيل محلي للإدارات وعضوياتها وتفويض اعتماد محدود ونسخ السياسات وسجل اعتماد/قرارات append-only مع RLS وPUBLIC revokes؛ بلا سياسات أو عضويات مزروعة.
- أُضيف API خادمي للمسودات ودورة المراجعة والنشر والإيقاف، بفصل المنشئ عن المعتمد والناشر، وتفويض ADMIN للاعتماد فقط بقرار OWNER محدد المدة.
- رُبط التقييم قبل تمرير Firewall المحمي: Enterprise ALLOW إلزامي، والحظر لا تخففه المستويات الأدنى، والسياق/المخطط/الالتزامات غير المدعومة توقف المسار.
- أضيفت لوحة لإعداد المسودات وإدارة الإدارات وعضوياتها والتفويض المحدود وإجراءات دورة النشر؛ تحرير النسخ/التاريخ التفصيلي API-only، وبقية المنتجات غير موصولة.
### الملفات المتأثرة
- `migrations/0010_aigas_kernel_policy_hierarchy.sql`, `src/server/kernel/policies.mjs`, `src/server/firewall/`, لوحة Kernel، `docs/KERNEL-DEVELOPMENT.md`
### التحقق
- مراجعة المصدر والـdiff: PASS؛ build والاختبارات وlint/typecheck والمتصفح: NOT RUN حسب طلب التنفيذ.
### النتيجة
- **الحالة:** PARTIAL / LOCAL IMPLEMENTATION NOT RUNTIME VERIFIED؛ لم يُطبق الترحيل على Neon ولم يحدث نشر.
### ملاحظات / مشاكل مفتوحة
- يلزم مراجعة grants/RLS والتطبيق على بيئة معتمدة والتحقق التشغيلي، وإكمال تحرير النسخ/عرض تاريخها وربط المنتجات الأربعة الأخرى.

## [2026-11-03] — توضيح حالة متطلب هرمية سياسات Kernel
### تم التنفيذ
- روجع `docs/AIGAS-KERNEL-POLICY-HIERARCHY-AND-ENFORCEMENT.md`: الهرمية وحد عدم تخفيف القيود العليا متطلبان معتمدان؛ تفاصيل المخطط والعقد التنفيذي فيه مقترحة، وحالة التنفيذ الموثقة NOT IMPLEMENTED / NOT VERIFIED.
- أكد فحص HEAD `0d9ed44b` عدم وجود مخطط أو خدمة/واجهات لهرمية الإدارات والسياسات؛ الموجود قواعد منتج منفردة وبوابة إتاحة Kernel.
- لم يُنفذ تغيير كود أو قاعدة بيانات أو نشر؛ ملف المتطلبات موجود محليًا وغير متعقّب.
### الملفات المتأثرة
- `.agents/mind/01-mind-latest.md`
### التحقق
- قراءة المستند ومراجعة المصدر: PASS؛ build والاختبارات: NOT RUN.
### النتيجة
- **الحالة:** DONE لتوضيح الفرق بين اعتماد المتطلب وتنفيذه.
### ملاحظات / مشاكل مفتوحة
- اعتماد التصميم المقترح والتنفيذ والتحقق التشغيلي ما زالت مفتوحة.

## [2026-11-03] — إصلاح فشل بناء Render لاستيراد Better Auth
### تم التنفيذ
- أزيل استيراد `better-auth/client/plugins` غير المعلن من `workspace-context.ts`؛ عميل Neon Auth المعلن يوفّر أصلًا نوع `VanillaBetterAuthClient` مع دعم Organization.
- استُخدم نوع SDK المصدري وأُبقي امتداد `getJWTToken()` الذي تعتمد عليه مساحة العمل.
### الملفات المتأثرة
- `src/scripts/workspace-context.ts`
### التحقق
- `npm run build`: PASS محليًا؛ ظهرت تحذيرات Rollup قائمة في ملفات Zod.
### النتيجة
- **الحالة:** DONE محليًا؛ بناء Render السابق على commit `2d49f24` فشل قبل التعديل، ولا يوجد نشر جديد أو commit.
### ملاحظات / مشاكل مفتوحة
- نجاح البناء المحلي لا يثبت نجاح Render بعد رفع التغيير أو حالة الموقع المنشور.

## [2026-11-03] — إكمال ربط حالة Kernel وسياسة الإتاحة الأساسية
### تم التنفيذ
- وسّع فحص الحالة العام بحالات `ready/degraded/blocked/unconfigured` ووقت تحديث ورموز خطأ محدودة، مع إبقاءه مجهولًا بلا DSN أو أسماء جداول/مؤسسات أو stack traces.
- أظهر لوحة Kernel اتصال Auth/DB وعضوية المؤسسة وتوقيت بياناتها وتوفر كل منتج، مع حالات الشبكة وإعادة المحاولة.
- وثّق أولوية الإتاحة الفعلية: العضوية والتمكين والمنحة السارية ومخطط المنتج؛ لا توجد طبقات سياسات مركزية موحدة بين Enterprise/Department/Product/User.
- فصل سجل Kernel الأساسي عن Ledger؛ أحداثه تحفظ tenant والفاعل والإجراء والوقت داخل معاملة الإدارة دون اشتراط المنتج المدفوع.
### الملفات المتأثرة
- `src/pages/app/kernel/index.astro`, `src/pages/app/api/kernel/health.ts`, `src/scripts/kernel.ts`, `src/styles/kernel.css`, `src/server/kernel/service.mjs`, `docs/KERNEL-DEVELOPMENT.md`
### التحقق
- مراجعة المصدر والـdiff: PASS. Build والاختبارات والمتصفح: NOT RUN حسب الطلب.
### النتيجة
- **الحالة:** PARTIAL محليًا؛ الواجهة والفحص وسجل Kernel الأساسي محدثة، دون تحقق تشغيل.
### ملاحظات / مشاكل مفتوحة
- هرمية السياسات المركزية غير موجودة في المصدر الحالي؛ تطبيقها يحتاج نموذج بيانات وواجهات/إنفاذ معتمد. Auth الفعلي، runtime DB grants/RLS، الترحيلات والإنتاج غير متحققة ولم تُغيّر.

## [2026-11-03] — إصلاح استخراج JWT في Kernel
### تم التنفيذ
- استُبدل الوصول إلى `session.token` باستخدام `auth.getJWTToken()` في طلبات Kernel وقراءة الأعضاء؛ `getSession()` نوعه لا يضمن وجود `token`.
### التحقق
- `pnpm build`: PASS على Node 24.20.0 (المتطلب Node 22.x)؛ تحذيرات Rollup من Zod.
### النتيجة
- **الحالة:** DONE محليًا؛ لا commit أو نشر.
