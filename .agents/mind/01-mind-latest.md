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
