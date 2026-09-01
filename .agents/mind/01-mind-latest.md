## [2026-09-02] — QC-100-BASELINE-001: تجميد الحقيقة الحالية قبل المعالجة

### تم التنفيذ
- جمدت الحالة على HEAD `05ae8fbab78eacf7bc8363a3d75177f849a835de`، الفرع `main`، مع إبقاء تعديل المستخدم الوحيد في `audit/qc/QC-Task-Manager/prompt10.md` بدون لمس.
- أعدت جرد تطبيق QC من المصدر: 487 ملفًا متتبعًا، 116 route file، 36 API file، 39 migration، 365 skill، 65 canonical unit/integration suite، و28 canonical E2E suite.
- شغّلت التحقق الحالي: typecheck/build/full unit/manifest/routes/schema/migrations/parity/security/deployment/production-operations/UI/responsive؛ كلها نجحت، و`e2e:acceptance` نجح بصلاحية localhost بـ30/30 و3059+ assertion وrestart persistence.
- أنشأت scorecard من 173 معيارًا ثنائيًا: `125/173` مثبتة حاليًا؛ لم أساوِ بين وجود الكود وبين إثبات الإنتاج أو UAT أو AT اليدوي أو restore التشغيلي.
- وثقت الفجوات الحاجبة: لا live staging/production evidence، لا UAT موظفين حقيقيين، لا VoiceOver/NVDA/disabled-user evidence، ولا production/off-site restore أو RUM performance.

### الملفات المتأثرة
- `audit/qc/QC-Task-Manager/100-PERCENT-BASELINE.md`
- `audit/qc/QC-Task-Manager/100-PERCENT-GAP-MATRIX.md`
- `audit/qc/QC-Task-Manager/100-PERCENT-EVIDENCE-MATRIX.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `pnpm --dir apps/qc-task-manager test` ✅ — 65 canonical suites.
- `pnpm --dir apps/qc-task-manager e2e:acceptance` ✅ بصلاحية localhost — 30/30؛ `3059+` assertions؛ responsive `648/0`؛ a11y `86/0`.
- `typecheck/build/manifest/route/schema/migrations/parity/security/deployment/production-operations/UI` ✅.
- `git -c core.fsmonitor=false status --short --branch` ✅ — التعديل السابق بقي محفوظًا؛ لا commit ولا push ولا deploy.

### النتيجة
- **الحالة:** جزئي — baseline التقني المحلي قابل لإعادة التنفيذ، لكن 100% والتشغيل الفعلي غير مثبتين.
- **مختصر:** ملفات baseline وgap/evidence matrix تثبت الوضع الحالي بلا تنفيذ remediation، وتفصل الأدلة الآلية عن الأدلة البشرية والخارجية المطلوبة.

### ملاحظات / مشاكل مفتوحة
- فشل التشغيل الأول لـE2E داخل sandbox كان `listen EPERM` بيئيًا، ثم نجح نفس الاختبار بعد السماح بالـlocalhost؛ محاولة سكربت a11y غير موجودة سُجلت كخطأ أمر لا كفشل منتج.
- لا يجوز استخدام أي نسبة أو PASS تاريخي بدل مصفوفة الأدلة الحالية.

## [2026-09-01] — QC-PILOT-UAT-EXECUTION-BLOCKED-001: التحقق من جاهزية UAT البشري

### تم التنفيذ
- قرأت `apps/qc-task-manager/docs/PILOT-UAT.md` كاملًا وحددت أنه runbook لجلسات موظفين حقيقيين، وليس تقرير نتائج.
- راجعت تعليمات اختبار الوصول اليدوي؛ نتائج VoiceOver/NVDA والكيبورد لا تُستنتج من الاختبارات الآلية.
- تحققت من أدوات المتصفح؛ الصفحة الوحيدة المفتوحة `about:blank`، ولا توجد جلسة موظف أو بيئة staging موصولة.
- تحققت من وثائق التشغيل؛ حسابات `admin`/`manager`/`supervisor`/`employee` المتاحة محلية/demo وليست موظفين QC حقيقيين.
- لم أسجل نتائج success/time/assistance/errors/recovery/confusion/comments، ولم أنشئ وثيقة موقعة أو أدّعي UAT مكتملًا.

### الملفات المتأثرة
- `.agents/mind/01-mind-latest.md`

### التحقق
- قراءة `PILOT-UAT.md` وتعليمات الوصول ✅
- فحص جلسة المتصفح ✅ — لا توجد جلسة بشرية
- فحص وثائق الأدوار وحسابات التشغيل ✅
- automated tests ❌ لم تُستخدم كبديل عن UAT البشري

### النتيجة
- **الحالة:** جزئي — متوقف بانتظار مشاركين وبيئة تشغيل وتفويض توقيع.
- **مختصر:** لم تُنفذ جلسات UAT فعلية، لذلك لا توجد نتائج صالحة للرفع أو التوقيع.

### ملاحظات / مشاكل مفتوحة
- المطلوب خارجيًا: مشارك QC حقيقي واحد على الأقل لكل دور، رابط staging أو جلسة مشتركة، بيانات اختبار غير إنتاجية، وهوية صاحب التوقيع.
- لا يجوز اعتماد حسابات demo أو أي اختبار آلي كنتيجة UAT.

## [2026-09-01] — QC-STAGING-READINESS-EVIDENCE-001: تحقق provenance والهجرة والـUI والتصدير والتدقيق وتشغيل SQLite محليًا

### تم التنفيذ
- لم أنشئ WI pages 2/3 أو 3/3، ولم أغيّر سياسة أو semantics المعايرة؛ المصدر الحالي يثبت فقط 33 صفًا مضبوطًا للصفحة 1 ويرفض الصفحات غير الموردة.
- شغّلت provenance/conflicts والهجرة: `test:migrations` نجح، وembedded migration parity تحقق `39/39` byte-identical.
- شغّلت فحوص WI UI والتصدير والتدقيق والمعايرة؛ فحوص `lab-documents`, `lab-reports`, `lab-audit`, `lab-calibration`, و`audit-integrity` نجحت مع RBAC وsafe CSV وimmutability.
- نفذت `test:production-operations` طازجًا؛ restore drill وbackup verification وintegrity/FK/migrations/audit chains وdeployment contract نجحت.
- شغّلت acceptance في runner يسمح بـlocalhost: `30/30`، و`3059+` assertion، وresponsive `648/0`، وa11y `86/0`، مع التصدير وRBAC وrestart persistence.
- شغّلت خادمًا محليًا مع SQLite مؤقتة؛ `/api/health` و`/api/readiness` أعادا HTTP 200، وreadiness أكد `schemaVersion=39`، ثم نُظفت البيئة.

### الملفات المتأثرة
- `audit/qc/QC-Task-Manager/STAGING-READINESS-EVIDENCE-2026-09-01.md`
- `apps/qc-task-manager/_reports/qa/acceptance-20260901/e2e-acceptance.log`
- `.agents/mind/01-mind-latest.md`

### التحقق
- migration/provenance ✅؛ embedded parity `39/39` ✅
- WI UI `test:lab-documents` ✅؛ calibration `97/0` ✅؛ reports `196/0` ✅؛ audit `60/0` ✅
- `test:production-operations` ✅؛ deployment contract `22` checks ✅
- `pnpm e2e:acceptance` ✅ — `30/30`; `3059+`; restart persistence ناجح
- health/readiness smoke ✅ — HTTP `200`، schema `39`
- `git -c core.fsmonitor=false diff --check` ✅
- لا commit ولا push ولا deploy ولا production mutation ✅

### النتيجة
- **الحالة:** جزئي — البوابات المحلية ناجحة، لكن staging الحقيقي والـpersistent disk والـoperator restore read-back غير مثبتة لأنها تحتاج operator deploy.
- **مختصر:** كل الفحوص المحلية المطلوبة مثبتة بأدلة جديدة؛ النشر الخارجي بقي محجوبًا حسب التفويض.

### ملاحظات / مشاكل مفتوحة
- المصدر المضبوط لـWI pages 2/3 و3/3 ما زال غير مورّد؛ لا يجوز ملء النقص أو استنتاج الصفحات.
- direct `e2e-backup.mjs` بدون `QC_DATABASE_PATH` أعاد خطأ إعداد متوقع؛ acceptance backup suite نجحت `13/0`.
- لا يوجد staging deployment evidence أو operator UAT أو production mutation.

## [2026-09-01] — QC-TEST-MANIFEST-E2E-ACCEPTANCE-001: تحقق manifest وكل E2E في runner يسمح بـlocalhost

### تم التنفيذ
- راجعت `apps/qc-task-manager/scripts/test-manifest.mjs` و`test-manifest-guard.mjs` و`e2e-registry.mjs` و`e2e-acceptance.mjs`، وجردت كل ملفات `e2e-*.mjs`؛ لا يوجد suite orphan أو registry drift.
- شغّلت `pnpm test:manifest` في `apps/qc-task-manager`: اجتاز الحارس 65 canonical unit suites و28 canonical E2E suites، exit code 0.
- شغّلت `pnpm e2e:acceptance` في runner يسمح للـAstro production server بالـbind على `127.0.0.1`; الـbuild اكتمل ثم نفّذ 28 workflow suites مع SQLite وport معزولين، إضافة إلى create/verify restart persistence.
- كل الـworkflow suites نجحت: 3,059 assertion ناجحة و0 فاشلة، بدون timeout؛ مرحلتا restart persistence نجحتا وتحققتا من بقاء ملف PDF وتنزيل نفس bytes بعد إعادة تشغيل السيرفر.
- راجعت السويتات كاملة عبر registry والتنفيذ الفعلي وجرد line/assertion markers؛ شملت `a11y` (keyboard/focus/ARIA/axe) و`responsive` (360/390/768/1024/1440) و`reports` وباقي عائلات auth/task/lab.
- لم يحصل أي تعديل على assertions أو كود المنتج؛ ما كان فيه فشل يبرر إصلاحًا جذريًا.

### الملفات المتأثرة
- `apps/qc-task-manager/scripts/test-manifest.mjs`
- `apps/qc-task-manager/scripts/test-manifest-guard.mjs`
- `apps/qc-task-manager/scripts/e2e-registry.mjs`
- `apps/qc-task-manager/scripts/e2e-acceptance.mjs`
- `apps/qc-task-manager/scripts/e2e-*.mjs` (فحص وتنفيذ كامل، بدون تعديل)
- `apps/qc-task-manager/_reports/qa/acceptance-20260901/test-manifest.log`
- `apps/qc-task-manager/_reports/qa/acceptance-20260901/e2e-acceptance.log`

### الأرقام
- Manifest: `65` canonical unit suites، `28` canonical E2E suites، exit `0`.
- Acceptance: `30/30` executions ناجحة (28 workflow + مرحلتا persistence)، exit `0`.
- Assertions القابلة للعد من الـworkflow output: `3059 passed / 0 failed`.
- Persistence: `2/2` operational checks ناجحة؛ السكربت ما يطبع صيغة رقمية، لذلك orchestrator سجّل aggregate بصيغة `3059+ passed / parsability incomplete` بدل ادعاء رقم غير مطبوع.
- الزمن الكلي المسجل: `250979ms`.
- HEAD وقت التشغيل: `269e207ad4a717d33f8dd47abade83e5ba468c09`؛ الشجرة كانت نظيفة.

### القرارات
- استخدمت runner بصلاحية bind محلي لأن sandbox العادي كان معروفًا أنه يمنع `listen`؛ هذا غيّر بيئة التشغيل فقط وما غيّر الاختبارات.
- أبقيت تحذيرات Vite الخاصة بالـdynamic/static imports كما هي؛ البناء نجح ولا يوجد دليل أنها سبب خلل في acceptance.
- لم أعتبر logs المتوقعة لمسارات الرفض (`404/405` ومحاولة retest غير مؤهلة) فشلًا؛ الـassertions الخاصة بها نجحت.

### التحقق
- `pnpm test:manifest` ✅ exit 0 — manifest guard passed.
- `pnpm e2e:acceptance` ✅ exit 0 — build + 30 executions، 0 failed، 0 timeout.
- `a11y` E2E ✅ `86/0`؛ axe critical/serious/moderate/minor كلها `0`.
- `responsive` E2E ✅ `648/0` عبر المقاسات المسجلة.
- `git -c core.fsmonitor=false status --short` ✅ قبل تحديث mind كانت الشجرة نظيفة؛ التغيير النهائي الوحيد هو سجل هذا الملف.
- لا commit ولا push ولا deploy ✅.

### النتيجة
- **الحالة:** نجح.
- **مختصر:** manifest وكل acceptance suites اجتازت في runner قادر على localhost binding، بدون إضعاف assertions أو الحاجة لإصلاح كود؛ السجل الكامل محفوظ في logs المذكورة.

### ملاحظات / مشاكل مفتوحة
- `e2e-acceptance.mjs` لا يفسر مخرجات persistence الرقمية، فبقي aggregate الرسمي `3059+ / parsability incomplete` رغم نجاح المرحلتين؛ هذه ملاحظة reporting وليست فشل اختبار، ولم أغيّر runner لأن الطلب كان فحصًا لا إعادة تصميم صيغة العد.
- نجاح `a11y` الآلي لا يغني عن manual expert testing أو UAT مع مستخدمين ذوي إعاقة.
- لا يوجد فشل مفتوح من هذه المهمة.

## [2026-09-01] — BAI-SECTION-UNIFICATION-001: توحيد إيقاع الأقسام وسلامة ظهور البطاقات

### تم التنفيذ
- أنشأت جردًا تنفيذيًا لـ185 ملف Astro و450 قسمًا، ووثقت انقسام padding بين `home-section--padded` و`inner-section` وخطة التوحيد الآمنة في `_reports/section-unification-audit.md`.
- وحّدت عقد التباعد إلى 64px على الجوال و128px من 1024px عبر `section--padded` مع إبقاء الاسمين السابقين aliases توافقية؛ وأزلت آخر قيم Tailwind اليدوية من أقسام الرئيسية.
- حسّنت قابلية قراءة العناوين والأوصاف فوق الفيديو: حد subtitle صار `65ch`، ظل نص محافظ، وإضافة فحص صريح لتباين عنوان/eyebrow/وصف القسم في `calc-contrast`.
- فعّلت `SectionHeading` في أربعة أقسام نصية مناسبة في hub الحلول مع `id` للوصول؛ أبقيت البطاقات الغنية على markup القائم لحماية عقود CTA و`data-*` وعدم فقد slots أو روابط مركبة.
- أصلحت انحدار ظهور: بطاقات `.feature-card` و`.card--feature` و`.inner-card` لم تعد تبدأ مخفية عبر reveal؛ فحص Chromium النهائي جعل `/solutions/` بلا محتوى غير مرئي في الجوال والديسكتوب.
- لم تُمس `SiteBackground.astro` أو أصول `brightai-background*`، ولم تتغير روابط أو خصائص التحليلات أو النصوص المحمية.

### الملفات المتأثرة
- `_reports/section-unification-audit.md`
- `src/styles/{components,animations}.css`
- `src/components/ui/SectionHeading.astro`
- `src/pages/{index,solutions/index}.astro`
- `scripts/calc-contrast.mjs`
- `download/qa/global-bg-audit/section-unification-final-20260901/`

### الأرقام
- 185 ملف Astro، 450 `<section>`، و121 استخدامًا لـ`inner-section` في 37 ملفًا جُردت.
- التباين المحافظ: title `13.42:1`، eyebrow `8.57:1`، subtitle `5.73:1`.
- فحص Chromium النهائي: 4/4 على `/` و`/solutions/` بمقاسي 360×800 و1440×1000؛ صفر overflow/escapees/big voids/bare text on media/CSS مفقود، و`/solutions/` صفر محتوى مخفي.

### القرارات
- الخلفيات ambient تبقى opt-in للأسطح التسويقية فقط؛ لا تعميم للـdocs أو القانوني أو Kernel لأن هذا يضيف طبقات بصرية بلا معنى للمحتوى المرجعي.
- `Card.astro` يبقى primitive اختياريًا، ولا يُرحّل عليه markup البطاقات الغني حتى يدعم تمرير عقود attributes وslots بأمان.

### التحقق
- `pnpm build` ✅ (تحذيرات تصادم مسارات Astro قديمة فقط).
- `pnpm typecheck` ✅.
- `pnpm test` ✅ — 38 اختبارًا.
- `pnpm contrast:verify` و`node scripts/calc-contrast.mjs` ✅.
- `git diff --check` ✅.
- فحص بصري Chromium 360px و1440px ✅.
- `pnpm lint` ❌ بسبب خطأين قائمين خارج نطاق المهمة في `apps/dashboard/lib/observability/logger.ts:81` (`no-explicit-any`).

### النتيجة
- **الحالة:** جزئي.
- **مختصر:** توحيد الأقسام وقراءة النص وظهور البطاقات اكتمل محليًا وتحقق بصريًا؛ تسليم lint الكامل متوقف على خطأي dashboard القائمين غير المرتبطين بالتغييرات.

### ملاحظات / مشاكل مفتوحة
- بقيت إشارتا Chromium في الرئيسية لعناصر مقصودة خارج تدفق القراءة: chip متحرك وtooltip مخفي حتى hover؛ لا تظهر في `/solutions/` ولا تمثل محتوى مفقودًا.
- لا commit ولا push ولا deploy.

## [2026-09-01] — تحليل شامل وصياغة برومبت تحسين أقسام ومحتوى BRIGHTAI

### تم التنفيذ
- حللت عقل المشروع والجرد الحالي وتقارير التصميم السابقة وتغييرات أسطح القراءة المحلية غير الملتزمة، بدون تعديل كود المنتج.
- فحصت صور المستخدم الأصلية والنسخة الحية `brightai.live` داخل Chrome على 1440×1000 و360×800، مع فصل محتوى الصفحة عن تعليمات المهمة.
- وثقت مشاكل مثبتة: قص H1 عند `x=-28px` على الجوال، هيرو بطول ~2743px، أقسام متكررة بارتفاع 728–1056px، نصوص عارية فوق الفيديو، أهداف لمس صغيرة، وفقرات صفحة الحلول بعرض يصل 1176px وطول 372 حرفًا.
- أنشأت برومبت تنفيذي مخصص لـGPT-5.6 Terra يحافظ على عقد الخلفية حرفيًا، ويبني أسطح قراءة محلية دلالية، ويحسن بنية الأقسام والنصوص عبر عائلات المسارات الثلاثة.
- ضمّنت معايير قبول رقمية للتباين والاستجابة والوصول وSEO والبناء، مع إلزام Chrome وroute inventory وlayout-audit والتغطية الكاملة بدل اللقطات الانتقائية.

### الملفات المتأثرة
- `docs/audits/BRIGHTAI-GLOBAL-SECTIONS-CONTENT-PROMPT.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- قراءة `.agents/mind/01-mind-latest.md` كاملة على دفعات ✅
- قراءة مهارات `redesign-existing-projects` و`accessible-content-rewrite` ومراجعها ✅
- Chrome حي: الرئيسية 1440×1000 و360×800 + صفحة الحلول 1440×1000 ✅
- مطابقة البرومبت مع جرد 369 مسارًا / 176 قالبًا ومع عقد الخلفية 95/95 ✅
- `git diff --check` ✅
- لم يُشغّل build/tests: المهمة تحليلية وتوثيقية ولم تعدّل كود المنتج.

### النتيجة
- **الحالة:** نجح
- **مختصر:** البرومبت النهائي جاهز للتنفيذ داخل Codex 5.6 Terra، مبني على المصدر المحلي والصور وفحص Chrome الحي، ويمنع تغيير الخلفية أو الاكتفاء بتعتيم عام.

### ملاحظات / مشاكل مفتوحة
- انقطع اتصال Chrome بعد فحص الرئيسية والحلول؛ لم أستبدله بمتصفح آخر التزامًا بطلب المستخدم، وبقية العائلات مغطاة من جرد المصدر وتقارير Chromium المحلية ويُلزم البرومبت بإعادة فحصها حيًا أثناء التنفيذ.
- تغييرات `RDX-CONTRAST-ON-MEDIA` المحلية تخص المستخدم وبقيت محفوظة بدون تعديل.

## [2026-09-01] — نقل مخرجات تدقيق QC إلى audit/qc/QC-Task-Manager

### تم التنفيذ
- نقلت 9 ملفات من مخرجات التدقيق الأخيرة من `apps/qc-task-manager/docs/` إلى `audit/qc/QC-Task-Manager/`.
- شملت الملفات التقرير النهائي، سجل الأدلة، تغطية الملفات والمسارات وقاعدة البيانات والاختبارات، مصفوفة المهارات، إجراءات الإغلاق، وprompts الإغلاق.
- لم أكتب فوق أي ملف موجود مسبقًا في المجلد الهدف؛ ملف `CLAIMS-VS-REALITY.md` لم يكن موجودًا بالمصدر، لذلك لم يُنقل.
- حدّثت مراجع المسارات داخل التقرير الرئيسي لتشير للموقع الجديد.

### الملفات المتأثرة
- `audit/qc/QC-Task-Manager/`
- `audit/qc/QC-Task-Manager/ULTIMATE-SYSTEM-AUDIT.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- تحقق من اختفاء الملفات التسعة من المصدر ووجودها غير فارغة في الهدف ✅
- تحقق من عدم وجود تعارض مع ملفات الهدف الموجودة ✅
- لم يُنفذ commit أو push ✅

### النتيجة
- **الحالة:** نجح
- **مختصر:** نُقلت مخرجات التدقيق المطلوبة للمجلد المحدد، مع الحفاظ على الملفات السابقة وتحديث مرجع التقرير الرئيسي.

### ملاحظات / مشاكل مفتوحة
- `CLAIMS-VS-REALITY.md` غير موجود بالمصدر الحالي، لذلك بقي بدون نقل.

## [2026-09-01] — QC-ULTIMATE-INDEPENDENT-AUDIT-001: تدقيق جنائي مستقل طازج للنظام كاملًا

### تم التنفيذ
- جمدت baseline على HEAD `77bf18b6592dbb91ddace645347b4e893efbabea`، وراجعت حالة الشجرة بدون commit أو push أو deploy.
- أعدت جرد QC من المصدر: 489 ملفًا متتبعًا، 116 route file، 36 API file، 39 migration، 365 skill، 65 canonical test suite، و28 canonical E2E.
- نفذت typecheck/build/manifest/route-manifest/schema-reference/embedded-parity/security-hygiene/deployment-contract/production-operations/badge-contrast طازجًا؛ نفذت `pnpm test` كاملًا و`e2e:acceptance` كاملًا في runner مسموح.
- تحققت من قاعدة SQLite مؤقتة معزولة: schema 39، 39/39 checksum، WAL وforeign keys، integrity وforeign-key checks PASS.
- أنشأت تقارير التدقيق والتغطية وسجل الأدلة ومصفوفة المهارات وادعاءات مقابل الواقع وإجراءات الإغلاق وprompts الإغلاق؛ لم أعدل سلوك المنتج.
- صححت نتيجة سابقة: `skills-lock.json` الحالي 365/365 exact و`test:schema-reference` PASS؛ لا يوجد دليل حالي على drift القديم المذكور في تقارير سابقة.

### الملفات المتأثرة
- `apps/qc-task-manager/docs/ULTIMATE-SYSTEM-AUDIT.md`
- `apps/qc-task-manager/docs/FINAL-EVIDENCE-LEDGER.md`
- `apps/qc-task-manager/docs/{FILE-COVERAGE,ROUTE-COVERAGE,DB-COVERAGE,TEST-COVERAGE,SKILL-USAGE-MATRIX,CLAIMS-VS-REALITY,MANUAL-CLOSURE-ACTIONS}.md`
- `apps/qc-task-manager/docs/ULTIMATE-CLOSING-PROMPTS.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `pnpm --dir apps/qc-task-manager typecheck` ✅ 0 errors / 0 warnings / 27 hints.
- `pnpm --dir apps/qc-task-manager build` ✅ exit 0.
- `pnpm --dir apps/qc-task-manager test` ✅ 65 canonical suites.
- `pnpm --dir apps/qc-task-manager e2e:acceptance` ✅ كل الأجنحة + restart persistence في runner مسموح؛ sandbox وحده فشل `listen EPERM` قبل التشغيل.
- `test:manifest` ✅ 65 unit + 28 E2E؛ `test:route-manifest` ✅ 116/25/6؛ migration parity ✅ 39/39؛ schema reference ✅ 165 objects.
- `test:deployment-contract` ✅ 22؛ `test:production-operations` ✅؛ security hygiene ✅؛ badge contrast ✅.
- `git diff --check` ✅ بعد إنشاء التقارير؛ لا commit ولا push ولا deploy.

### النتيجة
- **الحالة:** جزئي — التقنية والاختبارات الطازجة ناجحة، لكن جاهزية الشركة مشروطة.
- **مختصر:** الحكم الحالي `CONDITIONAL GO` بسبب credential محلي يحتاج تدوير، غياب live deployment evidence وUAT بشري، ونقص مصدر WI pages 2/3 و3/3. لا يوجد P0 مثبت.

### ملاحظات / مشاكل مفتوحة
- `RUNTIME USER UAT REQUIRED` لكل الأدوار؛ الأتمتة ليست بديلًا.
- credential محلي غير متتبع في `.claude/settings.local.json` يحتاج revoke/rotate وتنظيفًا من مالك البيئة؛ لم تُسجل قيمته.
- لا يوجد نشر حي أو restore drill على staging/production مثبت ضمن هذه المهمة.
- عدّ الدستور «67 skill» متقادم مقابل الواقع 365؛ يحتاج prompt توثيقي.
- قسم mind تجاوز حد الحجم التاريخي؛ الأرشفة للقسم 2 ما زالت قرارًا مستقلًا ولم تُنفذ.

## [2026-08-29] — BAI-BG-VIDEO-001: تعميم خلفية 9.mp4 على كل الواجهات + إصلاح انحدار توصيل CSS + تدقيق شامل

### تم التنفيذ
- **اكتشفت وأصلحت انحدار P0 في توصيل CSS:** 52 من 273 مسارًا في الموقع الرئيسي كانت تُشحن بدون `components.css` (105KB) و`pages.css` (164KB)، لأن `ArabicLayout` هو الوحيد اللي يستوردهم و`index.astro` و`en/*` و`kernel/*` تستخدم `BaseLayout` مباشرة. نقلت الاستيرادين إلى `BaseLayout` بنفس ترتيب الـlayers. **هذا سبب الصور اللي أرسلها المستخدم** (شبكات منهارة، أزرار كروابط، بطاقات بلا أسطح، فقرة مقصوصة من اليسار).
- **اكتشفت وأصلحت إخفاء محتوى P0:** `.gsap-fade` كانت `opacity: 0` وتُكشف بـ`[data-revealed]` — سمة **ما يضبطها أي شي في المستودع** (GSAP محذوف من المشروع)، فشبكة `k-unit-card` في `/kernel/` كانت مخفية كليًا. وحالة الدخول لـ`.card--feature` وعائلتها صارت مشروطة بـ`html.reveal-ready` اللي يضبطها `scroll-reveal.js` كأول إجراء، فلو ما اشتغل السكربت يبقى المحتوى ظاهرًا.
- **عمّمت `9.mp4`** كخلفية طبقة الصفحة الوحيدة: `SiteBackground.astro` في `BaseLayout`، مكوّن React في `apps/dashboard/app/layout.tsx`، تركيب مستقل في الـ3 صفحات اللي تملك `<html>` خاص، وعقد مضمّن يدويًا في `public/500.html`. نسخة واحدة مُلتزمة + `scripts/sync-background-media.mjs` ينسخ ويتحقق SHA-256 في `prebuild`، والنسخ المولّدة في `.gitignore` (صفر MB إضافية في git).
- **اكتشفت أن الفيديو كان يحمّل ولا يشتغل:** `paused: true` في 2184/2184 على الموقع مقابل 0/424 على QC. السبب: `ClientRouter` يعيد إدراج عقد `<body>` و Chromium يحترم `autoplay` فقط للعنصر المُدرج وقت التحليل. أضفت `play()` صريح في الثلاثة (`BAI-BG-VIDEO-002`) مع تجاهل الرفض عمدًا لأن الـposter هو البديل المصمم.
- **أزلت طبقة الخلفية القديمة:** `DottedBackground` (6 طبقات)، canvas الهيرو + 4 beams + spotlight + vignette + سكربت rAF + الاستيراد الديناميكي لـ`dotted-surface.js` (321 سطر)، طبقة noise الثابتة `body::before` (كان `mix-blend-mode: overlay` بيغيّر لون الفيديو)، تعارض اسم `.dotted-bg` في `components.css:3047`، و`BackgroundGrid` من 26 ملفًا (كان يرسم div بلا أي CSS في المستودع).
- **بنيت أدوات قياس:** `route-inventory.mjs` (369 مسارًا، 176 قالبًا، 62 endpoint مستبعدًا)، `layout-audit.mjs` (harness في Chromium حقيقي)، `verify-background-contract.mjs` (95 فحصًا)، `qc-login-state.mjs`.
- **شغّلت مدققًا مستقلًا** على التقارير، ولقى 4 ادعاءات غير مدعومة في المسودة الأولى — صحّحتها كلها وسجّلت التصحيحات صراحةً داخل التقارير نفسها.

### الملفات المتأثرة
- `src/layouts/{BaseLayout,ArabicLayout}.astro` · `src/components/{SiteBackground.astro,SplitHero.astro}`
- `src/styles/{base.css,components.css}` · `public/js/scroll-reveal.js` · `public/500.html`
- `src/pages/{answer/[slug],lp/[slug],kernel/admin/quota}.astro` + 26 ملفًا أُزيل منها `BackgroundGrid`
- `apps/dashboard/{app/layout.tsx,components/SiteBackground.{tsx,module.css},styles/globals.css,app/page.module.css,app/(app|auth|onboarding)/layout.module.css}`
- `scripts/sync-background-media.mjs` · `scripts/qa/{route-inventory,layout-audit,verify-background-contract,qc-login-state}.mjs`
- `docs/audits/{GLOBAL-VIDEO-BACKGROUND-IMPLEMENTATION-REPORT.md,REPOSITORY-DESIGN-UX-AUDIT.md,REPOSITORY-DESIGN-UX-AUDIT.json,REPOSITORY-DESIGN-EXECUTION-PROMPTS.md}`
- `package.json` (`bg:sync`, `bg:verify`, `prebuild`) · `.gitignore`

### الأرقام
- **الجرد:** 369 مسارًا مرئيًا (موقع 273، QC 76، dashboard 20)، 176 قالبًا، 62 endpoint مستبعدًا.
- **الخلفية:** `noVideo` من **2184/2184 → 0/2184**، فيديو واحد بالضبط في كل الـ2184 run، صفر مخالفة بنيوية للعقد، صفر scrim، صفر تحميل مكرر. `9.mp4` = 1600×1200، 7,958,354B، `2ea48871…bb97`، والنسخ الأربع متطابقة byte-for-byte.
- **CSS:** الرئيسية 562 → **1509** قاعدة · `/en/*` 388 → **1350** · `/kernel/*` 1781 → **2743** · المجموعة الضابطة `/about/` 1366 → 1345 (−21 كلها CSS ميت محذوف). `lostCss` 416 → 192 (والـ192 = 24 مسارًا يملك `<html>` خاصًا وما استخدم `pages.css` أصلًا — سليم مو عيب).
- **ارتفاع `/kernel/`:** 29,712px → **9,875px** (شبكة البطاقات رجعت grid).
- **QC:** 53 قالبًا × 8 مقاسات = **424 run** مصادَقة — صفر overflow/escapee/clip/scrim/مخالفة عقد.
- **التغطية:** موقع 273/273 و80/80 = **100%**. QC 53/76 = **69.7%** (مسار وقالب). dashboard **0/20**. الإجمالي: مسارات 88.3%، قوالب 75.6%.
- **درجة التدقيق:** **54.3%** — 126.0 من 232 نقطة منطبقة. **Evidence Confidence 33.3%** (4 من 12). **Human Validation 0%**.

### القرارات
- **إزالة طبقة الصفحة فقط** (قرار المستخدم): أسطح الأقسام والبطاقات تبقى كسطح محلي للتباين، فما فيه overlay عام فوق الفيديو ولا إعادة تصميم للموقع العام.
- **نسخة واحدة + نسخ وقت البناء:** يضمن تطابق SHA-256 بالبناء مو بالفحص اليدوي، ويمنع +16MB في تاريخ git.
- **ما لمست `next.config.mjs` للـdashboard:** إصلاح `serverExternalPackages` يخرج عن نطاق مهمة بصرية؛ كتبت له برومبت `RDX-P0-DASH-BUILD` بدل التنفيذ.
- **ما حذفت أي ملف من القرص:** `DottedBackground.astro` و`dotted-surface.js` و`BackgroundGrid.astro` و`BaseLayout.astro.noapp` غير مركّبة بس باقية، والحذف يحتاج تأكيد المستخدم.

### التحقق
- `pnpm build` (الموقع) ✅ exit 0 · `pnpm --dir apps/qc-task-manager build` ✅ exit 0
- `verify-background-contract.mjs` ✅ 95/95 · `pnpm bg:verify` ✅ 7 أصول متطابقة
- `pnpm test` ✅ 38/38 · QC `test:ui-consistency` ✅ 207/207 · QC `typecheck` ✅ 0 errors
- `pnpm headers:check` ✅ لا drift · `git diff --check` ✅ نظيف
- Chromium فعلي: **2184 run** (موقع) + **424** (QC) + **640×4** conditions (default / reduced-motion / print / zoom 200%)
- تشغيل الفيديو بعد الإصلاح ✅ — `/about/` `currentTime 1.48`، `/500.html` `1.68`، QC `/login` `0.95`
- ❌ `pnpm lint:tokens` — **فشل سابق للمهمة**، مُثبت: `src/pages/tools/ai-risk-register/index.astro` مطابق byte-for-byte لـ`HEAD`
- ❌ `astro check` (الموقع) — 126 خطأ، نمط سابق؛ سكربت `typecheck` الجذري ما يشغّله أصلًا
- ❌ `apps/dashboard` build — **فشل سابق للمهمة**: `node:crypto` UnhandledSchemeError عبر `@sentry/nextjs → @opentelemetry/instrumentation → require-in-the-middle`. مُثبت بالتوقيتات وبأن الملفات الست المعدلة كلها CSS/layout خارج سلسلة الاستيراد
- لم يُشغّل: `e2e:acceptance`، `a11y:scan`، `seo:gate`، Lighthouse، LCP/INP/CLS

### النتيجة
- **الحالة:** جزئي
- **مختصر:** الخلفية تعمل وتشتغل فعليًا على 349 من 369 مسارًا مرئيًا بعقدها الكامل وصفر مخالفة، وانحدارَي CSS وإخفاء المحتوى انحلّا بأدلة مقاسة. الـ20 مسار المتبقية في `apps/dashboard` منفَّذة في المصدر وغير متحقَّقة تشغيليًا لأن التطبيق ما يبني — وهو خلل سابق للمهمة. الحكم في التدقيق: **CONDITIONAL GO**.

### ملاحظات / مشاكل مفتوحة
- **P0 مفتوح:** بناء `apps/dashboard` (`RDX-P0-DASH-BUILD`) — سطر واحد في `serverExternalPackages`.
- **P0 مفتوح:** معمارية الـreveal — 170 من 640 run لسه فيها محتوى مخفي (9,581 عقدة) بعد بوابة `html.reveal-ready`. **مو خلل قياس** — الـharness ينتظر البوابة 6 ثوان ثم يمشي الصفحة كاملة. الحل: الحركة تبدأ من حالة ظاهرة (`RDX-P0-REVEAL-ARCH`).
- **P1:** zoom 200% يتدهور بحدة (123 escapee / 88 clipped مقابل 20/30) — WCAG 1.4.4 + 1.4.10.
- **انحدار معلن:** `groupSplits` 41 → 43 في الزوج المتماثل؛ المقياس المصحّح يقول 10 لكنه كُتب بعد التعديل فما فيه رقم "before" مصحّح.
- **الأداء:** 7.96MB = 3.79× ميزانية الصفحة على كل مسار. استثناء مقصود بأمر المستخدم، وأثره على LCP **لم يُقس** — `RDX-PERF-001`.
- **حارس ضعيف:** `verify-background-contract.mjs` يشتق مقامه من الفحوص المنفذة وأغلبه string-presence — `RDX-P0-GUARD-STRENGTH`.
- **ملفات متروكة:** `src/layouts/ArabicLayout 2.astro` (2026-08-05) لسه فيه الاستيرادين القديمين — فخ للقارئ التالي.
- `public/sitemap.xml` و`sitemap.xml` أعاد كتابتهما `sitemap:generate` (إعادة ترتيب، 1200 داخل/1200 خارج).
- **حجم هذا الملف 412KB** — فوق حد 150KB في الدستور. يلزم نقل أقدم السجلات إلى القسم 2، وما نفّذته بدون إذن.
- لم يحدث commit ولا push ولا deploy.

## [2026-08-28] — QC-SYSTEM-VIDEO-BACKGROUND-002: استبدال الخلفية بـ9.mp4 بألوانها وأبعادها الأصلية

### تم التنفيذ
- استبدلت فيديو الخلفية السابق بملف `9.mp4` نفسه حرفيًا؛ تطابق SHA-256 بين المصدر والأصل المنشور داخل التطبيق.
- ثبّتُّ الفيديو في منتصف الـviewport بأبعاده الطبيعية `1600×1200` بدون `cover` أو scale أو أي تغيير حجم.
- أزلت شفافية الفيديو والفلتر والـscrim بالكامل؛ العرض الآن `opacity: 1` و`filter: none` ويحافظ على اللون الأسود واللمعان الأصليين.
- ولّدت poster جديدًا من الفيديو نفسه بأبعاد `1600×1200` لحالة التحميل المبكر و`prefers-reduced-motion`.
- تحققت أن تسجيل الدخول يستخدم `BaseLayout` نفسه وأن الخلفية تظهر فيه، بدون تصغير حاويات الصفحات لأن عرض المحتوى الحالي `1152px` أصغر من عرض الفيديو الطبيعي.
- وسعت حارس اتساق الواجهة ليفشل إذا عاد `cover` أو scrim أو شفافية/فلتر، أو خرج الفيديو عن أبعاده الطبيعية.

### الملفات المتأثرة
- `apps/qc-task-manager/public/media/qc-system-background.mp4`
- `apps/qc-task-manager/public/media/qc-system-background-poster.jpg`
- `apps/qc-task-manager/src/components/SystemBackground.astro`
- `apps/qc-task-manager/scripts/test-ui-consistency.mjs`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `pnpm run test:ui-consistency` ✅ — 207/207.
- `pnpm run typecheck` ✅ — 0 errors و0 warnings؛ 27 hints قديمة.
- `pnpm run build` ✅ — Complete؛ تحذيرا Vite المعروفان فقط.
- Chrome فعلي على `/dashboard` و`/login` ✅ — الفيديو `1600×1200`، opacity=1، filter=none، scrim غير موجود، position=fixed.
- Chrome على 1200×742 و360×800 ✅ — لا overflow أفقي، وتسجيل الدخول يعرض الخلفية والبطاقة داخل الشاشة.
- `cmp` + SHA-256 ✅ — ملف التطبيق مطابق حرفيًا لـ`9.mp4` (`2ea48871471a43fe59773356bfa548679053e9075263f91a0feef04bf5f4bb97`).
- `git diff --check` ✅.

### النتيجة
- **الحالة:** نجح
- **مختصر:** الخلفية الجديدة تظهر في كل الصفحات وتسجيل الدخول بلونها الطبيعي، ثابتة وبمقاسها الأصلي، بدون طبقة شفافة أو تغيير حجم.

### ملاحظات / مشاكل مفتوحة
- الملف الأصلي حجمه 7.6MB؛ أُبقي حرفيًا بدون ضغط أو تغيير بناءً على طلب المستخدم بعدم تغيير حجمه.
- لم يحدث commit أو push أو deploy.

## [2026-08-28] — QC-AUTH-RECOVERY-001: مسار استرجاع كلمة مرور admin عبر CLI (بدل إلغاء المصادقة)

### تم التنفيذ
- المستخدم طلب أول الأمر إلغاء اشتراط كلمة المرور في `https://qc-task-manager.onrender.com/login` (دخول باسم `admin` فقط)، ورفضتُ التنفيذ المباشر لأنه إزالة مصادقة على رابط عام لتطبيق فيه e-signature وaudit chain وRBAC، ثم اختار المستخدم بديل «كلمة مرور تعرفها».
- أضفت سكربت `scripts/reset-user-password.mjs` يعيد تعيين كلمة مرور أي حساب على قاعدة البيانات المنشورة، ويقرأ الكلمة من `QC_NEW_PASSWORD` (مو من argv) حتى ما تدخل shell history أو قائمة العمليات.
- السكربت يستخدم `resetPassword()` نفسها اللي يستخدمها `/admin/users` — فيتحقق من السياسة (8 أحرف)، يفك قفل brute-force، يكتب صفًا في سلسلة تدقيق المستخدمين، ويعيد رفع `must_change_password = 1`.
- أضفت أمر `auth:reset-password` في `package.json`.
- وثّقت المسار في `docs/DEPLOYMENT.md` تحت قسم جديد «Recovering a service nobody can sign in to»، وشرحت ليش `ADMIN_DEFAULT_PASSWORD` ما ينفع لقاعدة بيانات فيها حسابات (يُقرأ فقط لما جدول `users` فارغ).
- ما كتبتُ أي كلمة مرور داخل الكود أو الوثائق أو العقل — الكلمة المؤقتة أُعطيت للمستخدم في المحادثة فقط.

### الملفات المتأثرة
- `apps/qc-task-manager/scripts/reset-user-password.mjs` (جديد)
- `apps/qc-task-manager/package.json`
- `apps/qc-task-manager/docs/DEPLOYMENT.md`
- `.agents/mind/01-mind-latest.md`

### القرارات
- **رفض إلغاء كلمة المرور:** الخدمة منشورة على رابط عام، وإلغاء المصادقة يفتح صلاحيات admin كاملة (حذف/موافقات/تصدير) لأي أحد، ويفرّغ التوقيع الإلكتروني وسلسلة التدقيق من معناها، ويكسر 3 حزم اختبار مصادقة قائمة.
- **إبقاء `must_change_password = 1` بعد الاسترجاع:** الكلمة المؤقتة مرّت عبر قناة محادثة، فلازم تُستبدل من صاحب الحساب في أول دخول.
- **الكلمة من متغير بيئة مو من argv:** منع تسريبها في history وقائمة العمليات على مضيف مشترك.

### التحقق
- تشغيل فعلي على قاعدة مؤقتة (`/tmp`) بعد `db:init` ✅ — الهاش الجديد يطابق، `admin123` صار غير صالح، `must_change_password=1`، `failed_login_attempts=0`، `locked_until=null`، وصف `USER_PASSWORD_RESET` مكتوب في `qc_audit_log`.
- `pnpm run test:auth-password-lifecycle` ✅ — 23/23.
- `pnpm run test:manifest` ✅ — 65 suite + 28 E2E.
- `pnpm run test:deployment-contract` ✅ — 22 فحصًا.
- `node scripts/verify-security-hygiene.mjs` ✅.
- `pnpm run typecheck` ✅ — 0 errors، 0 warnings، 27 hints قديمة.
- حذفت ملفات الاختبار المؤقتة من `/tmp` ✅.

### النتيجة
- **الحالة:** نجح
- **مختصر:** صار فيه مسار استرجاع دخول موثّق ومختبر بدون إضعاف المصادقة، لكنه ما يسري على الخدمة المنشورة إلا بعد commit + push + deploy من المستخدم (وكيل ما يدفع ولا ينشر).

### ملاحظات / مشاكل مفتوحة
- **قاعدة البيانات المحلية `apps/qc-task-manager/db/qc_tasks.db` فيها checksum drift على migration `011_lab_core_master_data.sql`** — ظهر عند فتحها بالسكربت، وهو خلل سابق مستقل عن هذه المهمة ولم أعالجه. أي أداة تفتح هالقاعدة محليًا بترمي `MigrationError`.
- لم يحدث commit ولا push ولا deploy.

## [2026-08-28] — QC-UX-RESEARCH-PROGRAM-001: تجهيز برنامج أبحاث UX تشغيلي حسب الأدوار

### تم التنفيذ
- أنشأت برنامج بحث موحّد لتطبيق `apps/qc-task-manager` يغطي أسئلة البحث، معايير المشاركين، السكربت، السيناريوهات، المقاييس، نموذج الملاحظة، synthesis، severity، وimpact readout.
- فصلت شرائح Employee وSupervisor وManager وLab operator/reviewer وAdmin، مع هدف 5–8 مشاركين لكل شريحة عند الحاجة، ومنعت خلط النتائج بين الأدوار.
- غطيت رحلات create/save/resume/submit/review/reject-rework/approve/search/investigate failure/calibration/report-export، وربطت كل مهمة بنتيجة قابلة للملاحظة بدون تغيير business rules.
- أضفت SEQ بعد كل مهمة وSUS القياسي بعد الجلسة، مع تعريف task success/time/errors/assistance/recovery وقواعد التقرير حسب الدور.
- ثبّتُّ أن النتائج البشرية وbaseline/comparison غير موجودة قبل تنفيذ الجلسات، وأن الاختبارات الآلية لا تكفي لإعلان UX success؛ baseline telemetry يستمر وفق عقد الخصوصية ومدته 14 يومًا.
- ربطت الخطة المختصرة الحالية بالبرنامج الكامل، مع بقاء `PILOT-UAT.md` و`UX-MEASUREMENT.md` مصادر تشغيلية مكملة.

### الملفات المتأثرة
- `apps/qc-task-manager/docs/UX-RESEARCH-PROGRAM.md`
- `apps/qc-task-manager/docs/UX-USABILITY-TEST-PLAN.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `pnpm --dir apps/qc-task-manager run test:lab-ux-presentation` ✅ — 14/14.
- `pnpm --dir apps/qc-task-manager run test:ux-telemetry` ✅.
- `git -c core.fsmonitor=false diff --check` ✅.
- لم يُشغّل build/typecheck: التغيير وثائقي فقط ولا يلمس كود التطبيق.

### النتيجة
- **الحالة:** نجح
- **مختصر:** برنامج البحث جاهز للتنفيذ الفعلي، بدون اختلاق نتائج أو إعلان نجاح UX قبل جلسات المشاركين وتحليلها حسب الدور.

### ملاحظات / مشاكل مفتوحة
- UAT البشري، VoiceOver، baseline الفعلي، ونتائج المشاركين ما زالت مطلوبة ولم تُنفّذ في هذه الدفعة.
- بقي حذف غير متعلق ظاهرًا في `audit/brightai-sa-keyword-research.csv` كما هو ولم ألمسه.
- لم يحدث commit أو push أو deploy.

## [2026-08-28] — إنشاء إضافة BRIGHTAI SEO لأبحاث السعودية وGEO

### تم التنفيذ
- أنشأت إضافة Codex شخصية باسم `brightai-seo` ضمن `~/plugins/brightai-seo`.
- أضفت أربع مهارات تشغيلية: `saudi-keyword-research` و`seo-audit` و`topical-authority` و`ai-visibility`.
- ربطت الإضافة بالـ marketplace الشخصي `personal` مع سياسة تثبيت `AVAILABLE` ومصادقة `ON_INSTALL`.
- صممت المهارات لتستخدم نطاق BRIGHTAI المعتمد `https://brightai.live`، وتستفيد من DataForSEO MCP الموجود في إعداد المشروع بدون تخزين أسرار.
- غطت المهارات بحث الكلمات السعودية، التدقيق الشامل، خريطة السلطة الموضوعية، وقياس ظهور BRIGHTAI في منصات الذكاء مع فصل القياس الفعلي عن الاستنتاج.

### الملفات المتأثرة
- `/Users/yzydalshmry/plugins/brightai-seo/.codex-plugin/plugin.json`
- `/Users/yzydalshmry/plugins/brightai-seo/skills/saudi-keyword-research/SKILL.md`
- `/Users/yzydalshmry/plugins/brightai-seo/skills/seo-audit/SKILL.md`
- `/Users/yzydalshmry/plugins/brightai-seo/skills/topical-authority/SKILL.md`
- `/Users/yzydalshmry/plugins/brightai-seo/skills/ai-visibility/SKILL.md`
- `/Users/yzydalshmry/.agents/plugins/marketplace.json`

### التحقق
- `validate_plugin.py /Users/yzydalshmry/plugins/brightai-seo` ✅
- فحص JSON للـmanifest والـmarketplace ✅
- عدد المهارات المنشأة: 4 ✅
- لا توجد أسرار أو بيانات اعتماد داخل الإضافة ✅
- لم يُنفذ build للمشروع؛ الإضافة مستقلة عن كود الموقع ✅

### النتيجة
- **الحالة:** نجح
- **مختصر:** الإضافة جاهزة للاستخدام في Codex كحزمة SEO/GEO متخصصة لـBRIGHTAI، والـcommit أو push غير منفذين.

### ملاحظات / مشاكل مفتوحة
- تشغيل DataForSEO الفعلي يحتاج وجود `DATAFORSEO_LOGIN` و`DATAFORSEO_PASSWORD` في البيئة وإعادة تشغيل Codex إذا لم يظهر الخادم.

## [2026-08-28] — QC-AI-SECURITY-UX-001: توضيح حدود AI وحالات الجلسة والصلاحيات

### تم التنفيذ
- وحّدت عرض `AiReviewPanel` بإضافة مؤشر ثابت يوضح أن AI advisory فقط.
- فصلت نتيجة AI بصريًا إلى `System data` و`AI suggestion` و`User decision`، مع إبقاء تفاصيل JSON داخل disclosure قابل للفتح.
- أضفت حالة آمنة لانتهاء الجلسة (401) مع رابط تسجيل دخول، وحالة صلاحية (403) تمنع إعادة المحاولة العمياء وتشرح مسار طلب الوصول.
- أبقيت حالة مزود AI غير المهيأ منفصلة، بحيث يتعطل تشغيل AI فقط وتستمر مسارات QC الأساسية يدويًا.
- أضفت حراسة UX Writing تمنع رجوع حدود القرار البشري ورسائل الاسترجاع الأساسية.

### الملفات المتأثرة
- `apps/qc-task-manager/src/components/AiReviewPanel.tsx`
- `apps/qc-task-manager/scripts/test-ux-writing.mjs`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `pnpm --dir apps/qc-task-manager run test:ux-writing` ✅ — 14/14.
- `pnpm --dir apps/qc-task-manager run test:interaction-feedback` ✅ — 25/25.
- `pnpm --dir apps/qc-task-manager run test:ai-foundation` ✅.
- `pnpm --dir apps/qc-task-manager run test:ai-features` ✅.
- `pnpm --dir apps/qc-task-manager run test:ai-lab` ✅.
- `pnpm --dir apps/qc-task-manager run typecheck` ✅ — 0 errors، 0 warnings، 27 hints قديمة.
- `NODE_ENV=production pnpm --dir apps/qc-task-manager run build` ✅ — Complete؛ تحذيرات Vite الديناميكية المعروفة فقط.
- `git -c core.fsmonitor=false diff --check` ✅.

### النتيجة
- **الحالة:** نجح
- **مختصر:** صار AI أوضح كاقتراح غير ملزم، مع مسارات استرجاع آمنة لانتهاء الجلسة وفشل الصلاحية، بدون تغيير API أو RBAC أو workflow أو قرار QC بشري.

### ملاحظات / مشاكل مفتوحة
- ما زال فحص UAT البشري وVoiceOver على أجهزة فعلية مطلوبًا؛ لم يُجرَ في هذه الدفعة.
- لم يحدث commit أو push أو deploy.

## [2026-08-28] — SEO-DOMAIN-CANONICAL-002: قرار النطاق المعتمد brightai.live + بناء ملف الكلمات عليه

### تم التنفيذ
- المستخدم حسم القرار: **`brightai.live` هو النطاق المعتمد والوحيد** — أي تحليل سابق افترض `brightai.site` كنطاق تجاري ظاهر أُلغي.
- تحققت قراءةً فقط أن المصدر مبني بالفعل على `brightai.live` (`astro.config.mjs: site: 'https://brightai.live'` + كل إدخالات kernel/سايت ماب) — **صفر تعديل مطلوب في المصدر**.
- حدّثت `target_url` في CSV الكلمات من مسارات نسبية إلى روابط مطلقة على `https://brightai.live/...` — 45/45 صف، و0 ذكر لـ`brightai.site`.
- لم أتلمس أي ملف مشروع آخر — لا build ولا إعدادات ولا صفحات، بالأمر الصريح من المستخدم.

### الملفات المتأثرة
- `download/seo/brightai-sa-keyword-research.csv`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `grep -c 'https://brightai.live'` = 45 ✅ و`grep -c 'brightai.site'` = 0 ✅
- `pending_credentials` = 45 (أعمدة DataForSEO محفوظة كما هي) ✅
- قراءة `astro.config.mjs` ✅ — النطاق `brightai.live` مؤكد من المصدر

### النتيجة
- **الحالة:** نجح
- **مختصر:** ملف الكلمات صار مبنيًا صراحةً على النطاق المعتمد `brightai.live`، والمصدر أصلًا متوافق معه — ظهور `brightai.site` في نتائج البحث مسألة إشارات خارجية (فهرسة/ملكية النطاق الثاني عند Google) مو تعارض داخل الكود.

### ملاحظات / مشاكل مفتوحة
- أُغلق سؤال النطاق P1 المسجل في SEO-KEYWORD-RESEARCH-001 بقرار المستخدم.
- بقي مفتوحًا (خارج نطاق اليوم): تعامل محركات البحث مع `brightai.site` (إعادة توجيه 301 أو إزالة فهرسته) — يُنفّذ فقط إذا طلب المستخدم.
- DataForSEO ما زال `pending_credentials` (45 صفًا) — ترتيب الأولوية بالـvolume ينتظر تفعيل الاعتماد.


## [2026-08-28] — SEO-KEYWORD-RESEARCH-001: تحليل الصفحات الأساسية وتجهيز CSV لكلمات السعودية

### تم التنفيذ
- حللت الصفحات الأساسية محليًا: الرئيسية، `about`, `services`, `solutions`, صفحة الحل، `trust`, `contact`, `blog`, `pricing`, وتقييم جاهزية حوكمة AI.
- قارنت إشارات المصدر مع نتائج البحث الحية؛ النطاق الظاهر للجمهور هو `brightai.site` بينما المصدر يضع `brightai.live` في `astro.config.mjs` وcanonical وsitemap، وسُجّلت كنقطة P1 قبل الاعتماد على إشارات البحث.
- راجعت إشارات المحتوى الحالية: حوكمة AI، AI Firewall، PDPL، NCA ECC، SDAIA، ISO 42001، ملفات الأدلة، الموافقات البشرية، القطاعات والمدن السعودية.
- أنشأت CSV يضم 45 فرصة كلمات مفتاحية عربية/إنجليزية، مع التجميع، نية البحث، صفحة الهدف، مرحلة القمع، الأولوية، long-tail، وطريقة السيطرة المقترحة.
- امتنعت عن اختلاق volume أو CPC أو competition؛ كل أعمدة DataForSEO موسومة `pending_credentials` لأن أداة DataForSEO غير ظاهرة كأداة MCP قابلة للاستدعاء في الجلسة وبيئتا `DATAFORSEO_LOGIN` و`DATAFORSEO_PASSWORD` غير موجودتين.

### الملفات المتأثرة
- `download/seo/brightai-sa-keyword-research.csv`
- `.agents/mind/01-mind-latest.md`

### التحقق
- فحص CSV ✅ — 45 صف بيانات + رأس الملف.
- `git -c core.fsmonitor=false diff --check` — لم يُنفّذ بعد هذا السجل؛ فحص Git العادي تأثر بخطأ بيئي في `fsmonitor_ipc`.
- تحليل حي عبر نتائج البحث ✅ — تم التحقق من ظهور `brightai.site` وصفحة الحل الرئيسية.
- DataForSEO API ⚠️ — لم يُنفّذ بسبب غياب الأداة القابلة للاستدعاء والاعتمادات، بدون طباعة أو تخزين أسرار.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** تحليل الصفحات وCSV الاستراتيجي جاهزان، لكن ترتيب الكلمات حسب أعلى volume ومؤشرات السوق السعودية ينتظر تفعيل DataForSEO بعد توفير الاعتمادات وإعادة تحميل MCP.

### ملاحظات / مشاكل مفتوحة
- يلزم توحيد النطاق canonical بين `brightai.site` و`brightai.live` قبل ضخ بيانات الكلمات في قرارات الصفحات أو بناء الروابط.
- يلزم تشغيل DataForSEO على بذور CSV نفسها، ثم ملء `monthly_searches_sa`, `competition`, و`cpc_sar` وإعادة ترتيب الأولوية بالبيانات الفعلية.

## [2026-08-28] — DATAFORSEO-MCP-001: ربط خادم DataForSEO الرسمي بإعداد Codex المحلي

### تم التنفيذ
- أضفت خادم MCP الرسمي `dataforseo-mcp-server@latest` إلى إعداد المشروع عبر بروتوكول stdio.
- ضبطت التشغيل ليقرأ `DATAFORSEO_LOGIN` و`DATAFORSEO_PASSWORD` من بيئة العملية فقط.
- امتنعت عن كتابة بيانات الدخول أو أي secret داخل المستودع أو ملف العقل أو إعداد MCP.
- تحققت من صحة صيغة TOML وظهور خادمي MCP: `caveman-shrink` و`dataforseo`.

### الملفات المتأثرة
- `.codex/config.toml`
- `.agents/mind/01-mind-latest.md`

### التحقق
- تحليل TOML ✅ — `TOML_OK`.
- فحص `git diff --check` ✅.
- لم يُشغّل اتصال API فعليًا: متغيرات الاعتماد لم تُخزّن أو تُطبع حفاظًا على السرية.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** إعداد DataForSEO MCP صار مربوطًا محليًا، ويبقى تفعيل الاعتماد وإعادة تشغيل Codex بمتغيرات البيئة، ثم اختبار `api_request`.

### ملاحظات / مشاكل مفتوحة
- بيانات الدخول التي أُرسلت في المحادثة يُفضّل تدويرها من لوحة DataForSEO بعد التحقق.
- لا يوجد commit أو push.

## [2026-08-28] — QC-UX-WRITING-001: توحيد لغة المنتج والـmicrocopy

### تم التنفيذ
- أضفت عقد UX Writing موحّدًا يغطي النبرة، قاموس المصطلحات، الأفعال، الأخطاء، الحالات الفارغة، الصلاحيات، AI، التوطين، وإمكانية الوصول.
- عرّفت المصطلحات التشغيلية الأساسية: Save draft، Submit for review، Approve، Reject، Return for changes، Reopen task، Complete task، Pass/Fail/Hold، وRetest required.
- حسّنت رسائل `OperationalState` لتشرح الحالة والخطوة التالية بدون لوم المستخدم أو كشف تفاصيل داخلية.
- حسّنت رسائل أخطاء وإجراءات `TaskLifecycle` و`CommentBox` و`AttachmentUploader` لتوضح ما حدث وما الإجراء التالي، ووضحت تسميات evidence وoverride.
- وضحت في `AiReviewPanel` أن المخرجات اقتراحات advisory فقط، وأن AI لا يعتمد أو يرفض أو يقرر نتائج QC.
- وضحت `ReviewDeleteRequestDialog` أن الإجراء هو الموافقة على الحذف الدائم، مع صياغة أوضح لسبب الرفض.
- أضفت حارس `test:ux-writing` وربطته بالـmanifest، وحدّثت عقد interaction feedback بعد إزالة عبارات recovery القديمة.

### الملفات المتأثرة
- `apps/qc-task-manager/docs/UX-WRITING.md`
- `apps/qc-task-manager/scripts/test-ux-writing.mjs`
- `apps/qc-task-manager/scripts/test-interaction-feedback.mjs`
- `apps/qc-task-manager/scripts/test-manifest.mjs`
- `apps/qc-task-manager/package.json`
- `apps/qc-task-manager/src/components/{OperationalState,TaskLifecycle,CommentBox,AttachmentUploader,AiReviewPanel,ReviewDeleteRequestDialog}`

### التحقق
- `pnpm run test:ux-writing` ✅ — 10/10.
- `pnpm run test:interaction-feedback` ✅ — 25/25.
- `pnpm run test:ui-consistency` ✅ — 181/181.
- `pnpm run test:manifest` ✅ — 64 canonical suites و28 canonical E2E.
- `pnpm run typecheck` ✅ — 0 errors، 0 warnings، 26 hints قديمة.
- `NODE_ENV=production pnpm run build` ✅ — Complete؛ تحذيرات Vite الديناميكية المعروفة فقط.
- `git diff --check` ✅.

### النتيجة
- **الحالة:** نجح
- **مختصر:** توحّدت لغة العمليات والرسائل الحساسة للمستخدم في الأسطح المشتركة، مع توثيق قاموس قابل للتوسع وحراسة تمنع رجوع المصطلحات القديمة، بدون تغيير RBAC أو workflows أو business rules أو API contracts.

### ملاحظات / مشاكل مفتوحة
- يلزم UAT بشري للتأكد من أن المصطلحات الإنجليزية الحالية تطابق لغة فرق QC، وفحص VoiceOver على الأجهزة الفعلية حسب السجلات السابقة.
- توجد تغييرات مستخدم سابقة في الشجرة وتم الحفاظ عليها؛ لم يحدث commit أو push.

## [2026-08-28] — QC-MOTION-DIGITAL-ART-001: توحيد لغة الحركة التشغيلية في QC Task Manager

### تم التنفيذ
- أزلت حركة رفع البطاقات (`hover:-translate-y`) من dashboard وLab Management، وأبقيت feedback بصريًا عبر shadow transition صريح.
- استبدلت الانتقالات العامة بخصائص محددة مع `duration-qc-standard` و`ease-qc-standard` في بطاقات dashboard وLab وdocuments وnotifications.
- أزلت `transition-all` من نقاط الرسوم التفاعلية؛ تغيّر نصف قطر الدائرة صار فوريًا بدل تحريك خاصية غير مطلوبة تشغيليًا.
- أضفت حراسة مصدرية للحركة تمنع `transition-all` وgeneric transitions وhover translate/scale داخل التطبيق، مع استمرار حراسة reduced motion العامة.
- وثّقت motion language: 120ms للحركة السريعة، 180ms للحركة القياسية، حد تشغيلي 240ms، ورفض page entrance/parallax/loops/KPI animation والـ decorative art في الشاشات الحرجة.

### الملفات المتأثرة
- `apps/qc-task-manager/src/pages/dashboard.astro`
- `apps/qc-task-manager/src/pages/lab/{index,management}.astro`
- `apps/qc-task-manager/src/pages/lab/documents/index.astro`
- `apps/qc-task-manager/src/components/{DashboardCharts,LabDashboardCharts}.tsx`
- `apps/qc-task-manager/src/components/NotificationCard.astro`
- `apps/qc-task-manager/src/components/lab/LabFailRateChart.tsx`
- `apps/qc-task-manager/scripts/test-lab-ux-performance.mjs`
- `apps/qc-task-manager/docs/UI-DESIGN-SYSTEM.md`

### التحقق
- `pnpm run test:lab-ux-performance` ✅ — 9/9.
- `pnpm run test:ui-consistency` ✅ — 181/181، و`test:manifest` ✅ — 63 canonical و28 E2E.
- `pnpm run test:badge-contrast` ✅ — 13/13، و`test:responsive-e2e-contract` ✅.
- `pnpm test` ✅ — 63 canonical suites بدون فشل.
- `NODE_ENV=production pnpm build` ✅ — Complete؛ تحذيرات Vite الديناميكية المعروفة فقط.
- `pnpm run e2e:acceptance` ✅ — 30/30 suite، 3047+ assertion، وresponsive 648/0 وa11y 86/0.
- `git -c core.fsmonitor=false diff --check` ✅، وmotion inventory بعد التعديل بلا violations مستهدفة.

### النتيجة
- **الحالة:** نجح
- **مختصر:** صارت الحركة في واجهة QC مقصودة ومحدودة لدعم فهم الحالة، بدون حركة زخرفية أو تغيير في RBAC أو workflows أو database أو business rules أو dependencies.

### ملاحظات / مشاكل مفتوحة
- ما زال UAT البشري على أجهزة حقيقية وVoiceOver مطلوبًا؛ الاختبارات الآلية لا تستبدله.
- مهارة `motion-and-zoom` المطلوبة غير متاحة في جلسة التنفيذ؛ تم تطبيق المهارات المتاحة ذات الصلة.
- لم يحدث commit أو push أو deploy.

## [2026-08-28] — QC-INTERACTION-FEEDBACK-001: توحيد حالات التفاعل والتغذية الراجعة

### تم التنفيذ
- أضفت `ActionFeedback` مشتركًا لمناطق live ثابتة، مع أدوار مختلفة للأخطاء والتحديثات الروتينية، ونبرات semantic متوافقة مع نظام التصميم.
- وحّدت feedback المحلي في التعليقات، المرفقات، مراجعة AI، الإشعارات، طلبات الحذف، وتحديث المهمة، مع رسائل نجاح وفشل تشرح الخطوة التالية وتحافظ على المدخلات.
- أضفت `aria-busy` وحالات loading محلية، ووضّحت labels أثناء التنفيذ، وحسّنت أزرار الإجراءات بحالات focus-visible وpressed وهدف لمس لا يقل عن 44px.
- أضفت حراسة مصدرية `test-interaction-feedback` وربطتها بالـ manifest لضمان وجود feedback قابل للاسترجاع في الـ React islands الحرجة.
- حدّثت `AppButton` ليعرض حالة pressed بوضوح عبر الـ variants الحالية، بدون إضافة dependency أو تغيير endpoint أو workflow أو RBAC.

### الملفات المتأثرة
- `apps/qc-task-manager/src/components/ui/ActionFeedback.tsx`
- `apps/qc-task-manager/src/components/ui/AppButton.astro`
- `apps/qc-task-manager/src/components/{CommentBox,AttachmentUploader,AiReviewPanel,MarkReadButton,MarkAllReadButton,DeleteRequestDialog,TaskUpdatePanel}.tsx`
- `apps/qc-task-manager/scripts/test-interaction-feedback.mjs`
- `apps/qc-task-manager/package.json`
- `apps/qc-task-manager/scripts/test-manifest.mjs`

### التحقق
- `pnpm --dir apps/qc-task-manager test:interaction-feedback` ✅ — 25/25.
- `pnpm typecheck` ✅ — 0 errors، 0 warnings، و26 hints غير حاجبة موجودة مسبقًا.
- `pnpm test` ✅ — 63 canonical suites بدون فشل.
- `pnpm build` ✅ — Complete؛ تحذيرات Astro/Vite الديناميكية المعروفة فقط.
- `pnpm e2e:acceptance` ✅ — 30/30 suite، 3047+ assertion، مع اختبار restart persistence؛ احتاج تشغيل الخادم المحلي خارج sandbox بعد فشل EPERM قبل بدء الاختبارات.
- `pnpm test:ui-consistency` ✅ — 181/181، و`git diff --check` ✅.

### النتيجة
- **الحالة:** نجح
- **مختصر:** صار عند المستخدم feedback متوقع ومباشر للأفعال المحلية عالية التكرار والحساسية، مع recovery واضح، بدون المساس بقواعد المجال أو سلامة التدقيق.

### ملاحظات / مشاكل مفتوحة
- ما زال UAT البشري على أجهزة حقيقية وVoiceOver مطلوبًا حسب سجل المشروع؛ الاختبارات الآلية لا تستبدله.
- لم يحدث commit أو push أو deploy.

## [2026-08-28] — QC-ADVANCED-FORM-UX-001: رحلة أقسام آمنة ومراجعة صريحة لنموذج اختبارات المختبر

### تم التنفيذ
- حسّنت `LabTestForm` بعقد حالات حفظ صريحة (`saved`, `unsaved`, `saving`, `failed`) مع رسالة حالة live واضحة وحماية فقدان التعديلات القائمة.
- صححت تنقل الأقسام ليطابق ترتيب النموذج الفعلي من 1 إلى 8، ويعرض نص الحالة `Not started` / `In progress` / `Complete` / `Error` بدل الاعتماد على رمز أو لون فقط.
- أضفت خطوة مراجعة قابلة للتركيز قبل إرسال اختبار عالي الأثر إلى طابور المراجعة، مع ملخص المنتج وعدد العينات والنتيجة، وإرجاع التركيز إلى زر الإرسال عند اختيار `Keep editing`.
- حسّنت ملخص أخطاء الإرسال ليكون focusable، وربطت أخطاء الحقول المطلوبة المجاورة بالـ controls عبر `aria-describedby`، وجعلت رابط أخطاء شبكة العينات يركز أول control قابل للاستخدام داخل القسم.
- ثبّتُّ أن تغيير Connector Type يسجل أن المستخدم لمس الحقل، فلا يعيد Product Master الكتابة فوق اختياره.
- حدّثت اختبار E2E لنموذج المختبر ليؤكد خطوة `Confirm and send for review`، وأضافت حراسة form productivity لعقد المراجعة وحالات الحفظ وحالات الأقسام.

### الملفات المتأثرة
- `apps/qc-task-manager/src/components/lab/LabTestForm.tsx`
- `apps/qc-task-manager/scripts/e2e-lab-form.mjs`
- `apps/qc-task-manager/scripts/test-form-productivity.mjs`

### التحقق
- `pnpm run test:form-productivity` ✅ — 20/20.
- `pnpm run test:lab-form` ✅ — 72/72.
- `pnpm run test:lab-ux-presentation` ✅ — 14/14.
- `pnpm run test:ui-consistency` ✅ — 181/181.
- `pnpm run test:responsive-e2e-contract` ✅.
- `pnpm run typecheck` ✅ — 0 errors، 0 warnings، 26 hints غير حاجبة.
- `NODE_ENV=production pnpm run build` ✅ — Complete؛ تحذيرات Vite الديناميكية المعروفة فقط.
- `pnpm run e2e:acceptance` ✅ — 30/30 suite، 3047+ assertion، و`lab-form` 141/0 وresponsive 648/0 وa11y 86/0.
- `pnpm test` ✅ — 62 canonical suites، بدون فشل.
- `git diff --check` ✅.

### النتيجة
- **الحالة:** نجح
- **مختصر:** صار نموذج اختبار المختبر يوجّه المستخدم عبر أقسام صحيحة، يحافظ على سياقه عند الخطأ، ويطلب تأكيدًا صريحًا قبل الإرسال، بدون تغيير قواعد المجال أو RBAC أو CSRF أو schema.

### ملاحظات / مشاكل مفتوحة
- مهارة `zeigarnik-effect` غير متاحة في جلسة التنفيذ؛ تم تطبيق مبادئ chunking/progressive disclosure من المهارات المتاحة.
- ما زال فحص UAT البشري الفعلي على أجهزة حقيقية وVoiceOver مطلوبًا حسب سجل المشروع؛ الاختبارات الآلية لا تستبدله.
- لم يحدث commit أو push أو deploy.

## [2026-08-28] — QC-CORE-UI-CONSOLIDATION-001: توحيد headers/actions/alerts/empty states في الأسطح عالية الاستخدام

### تم التنفيذ
- رحّلت header صفحة `/dashboard` و`/search` إلى `PageHeader` مع eyebrow ووصف وaction row متجاوب، بدون تغيير المسارات أو محتوى التشغيل.
- رحّلت actions الأساسية في dashboard (فتح التقارير، تطبيق الفلاتر، المسح) وعمليات التصدير/حفظ الفلاتر في البحث إلى `AppButton` مع ترتيب primary/secondary واضح.
- رحّلت أزرار CTA في `EmptyState` إلى `AppButton`، فصار نمط الحالة الفارغة يعتمد على نفس focus/height/semantic token contract.
- استبدلت focus ring اليدوي في روابط تنقل أقسام dashboard بعقد `qc-focus`، مع إبقاء روابط الأقسام والـanchors كما هي.
- وحّدت خطأ dashboard مع `Banner` بحالة error وعنوان واضح، بدل alert markup محلي.
- وسّعت `test-ui-consistency` ليحرس استخدام `PageHeader` في dashboard/search.

### الملفات المتأثرة
- `apps/qc-task-manager/src/pages/dashboard.astro`
- `apps/qc-task-manager/src/pages/search.astro`
- `apps/qc-task-manager/src/components/EmptyState.astro`
- `apps/qc-task-manager/scripts/test-ui-consistency.mjs`

### التحقق
- `pnpm --filter @brightai/qc-task-manager test:ui-consistency` ✅ — 181/181.
- `pnpm --filter @brightai/qc-task-manager test:responsive-e2e-contract` ✅.
- `pnpm --filter @brightai/qc-task-manager test:badge-contrast` ✅ — كل الأزواج ضمن WCAG 2.2 AA.
- `pnpm --filter @brightai/qc-task-manager typecheck` ✅ — 0 errors، 0 warnings، 26 hints قديمة.
- `NODE_ENV=production pnpm --filter @brightai/qc-task-manager build` ✅ — Complete؛ تحذيرات Vite الديناميكية المعروفة فقط.
- `git -c core.fsmonitor=false diff --check` ✅.

### النتيجة
- **الحالة:** نجح
- **مختصر:** توحّدت أعلى أنماط العرض تكرارًا في dashboard/search وEmptyState باستخدام primitives الحالية، مع بقاء server-side filtering وRBAC وPOST/GET contracts وسلوك workflow بدون تغيير.

### ملاحظات / مشاكل مفتوحة
- بقيت بعض raw controls وcard/action markup في dashboard/search، إضافةً إلى صفحات الإدارة، ضمن الترحيل التدريجي route-sized؛ لم يتم اختراع abstraction عام جديد لها.
- لم يتم تشغيل full `pnpm test` أو `pnpm e2e:acceptance` في هذا workstream؛ تم تشغيل البوابات المتأثرة مباشرة وbuild/typecheck.
- لم يحدث commit أو push أو deploy.

## [2026-08-28] — QC-IA-NAV-WAYFINDING-001: تنظيم IA وتحسين التنقل والـ breadcrumbs

### تم التنفيذ
- وثّقت inventory فعلي للمسارات، التنقل العام والمحلي للمختبر، تنقل الأدوار، روابط الأدوات، والعلاقات التشغيلية بين السجلات في وثيقة IA مستقلة.
- ربطت نموذج التنقل بالمهام الفعلية ومسارات `Task → Finding → CAPA → Evidence` و`Product → Test → Review → Retest → Report` وغيرها، مع تثبيت أن RBAC على الخادم هو المصدر authoritative.
- أضفت breadcrumbs مشتركة لصفحات تفاصيل Tasks وFindings مع الحفاظ على الروابط الحالية وسلوك الرجوع الخاص بالدور.
- حسّنت أهداف اللمس وحالات التركيز في مكوّن Breadcrumbs لتناسب الجوال ولوحة المفاتيح.
- أضفت حراسة consistency تمنع رجوع صفحات تفاصيل Tasks وFindings بدون Breadcrumbs.
- أصلحت تباين أزرار Pagination المعطّلة في السطح المحايد، بعد ما كشف فحص الوصول الحالة المشتركة في `/lab/documents` و`/lab/search`.

### الملفات المتأثرة
- `apps/qc-task-manager/docs/INFORMATION-ARCHITECTURE.md`
- `apps/qc-task-manager/src/components/Breadcrumbs.astro`
- `apps/qc-task-manager/src/pages/tasks/[id].astro`
- `apps/qc-task-manager/src/pages/findings/[id].astro`
- `apps/qc-task-manager/src/components/ui/Pagination.astro`
- `apps/qc-task-manager/scripts/test-ui-consistency.mjs`

### التحقق
- `node scripts/test-ui-consistency.mjs` ✅ — 179/179
- `node scripts/architecture-guard.mjs` ✅
- `node scripts/test-lab-ux-presentation.mjs` ✅ — 14/14
- `node scripts/test-responsive-e2e-contract.mjs` ✅
- `node scripts/verify-badge-contrast.mjs` ✅
- `astro check` ✅ — 0 errors، 0 warnings، 26 hints موجودة مسبقًا
- `NODE_ENV=production astro build` ✅
- `node scripts/e2e-acceptance.mjs` ✅ — 30/30 suites، 3047+ assertions parsed، و86/86 accessibility و648/648 responsive
- `git diff --check` ✅

### النتيجة
- **الحالة:** نجح
- **مختصر:** اكتمل workstream تنظيم IA والـ wayfinding بدون تغيير URLs أو RBAC أو workflows أو DB أو CSRF، مع اجتياز بوابة القبول الكاملة.

### ملاحظات / مشاكل مفتوحة
- ما تم تنفيذ جلسة card sort/tree testing بشرية ولا فحص VoiceOver كامل أو اختبار zoom بنسبة 200%؛ تبقى ضمن UAT اليدوي.
- ما صار `git commit` ولا `git push`؛ التغييرات المحلية جاهزة للمراجعة.

## [2026-08-28] — QC-STATUS-SEMANTICS-001: توحيد دلالات الحالات في QC Task Manager

### تم التنفيذ
- وحّدت أدوار العرض إلى `neutral`, `info`, `pending`, `warning`, `success`, `danger`, و`blocked` داخل `statusTones.ts`، مع إبقاء aliases قديمة معلنة للتوافق فقط.
- أضفت adapters مستقلة لـ Tasks وFindings وCAPA وEvidence وLab Tests وDocuments وEquipment وCalibration وMaintenance وRetests وNotifications وAccount وAI، بدون تغيير raw enums أو قواعد المجال.
- حوّلت `StatusBadge` و`QcStatusBadge` و`LabDocumentStatusBadge` إلى wrappers فوق `StatusPill`؛ خرائط المختبر القديمة صارت تشتق classes من الطبقة المركزية.
- جعلت fallback للحالات غير المعروفة label مقروءًا بدل عرض raw enum فقط، مع بقاء النص دائمًا حاضرًا والإشارة البصرية decorative.
- ربطت notification severity بالـsemantic tokens، وأضفت `test:status-semantics` لحراسة adapters، delegation، fallback labels، ومنع raw status colors في wrappers.
- وثقت inventory كاملًا وقواعد الترحيل والتوافق في `docs/STATUS-SEMANTICS.md` وحدّثت وثائق design-system وmigration.

### الملفات المتأثرة
- `apps/qc-task-manager/src/components/ui/statusTones.ts`
- `apps/qc-task-manager/src/components/ui/{StatusPill,labBadgeClasses,notificationPresentation}.astro` / `.ts`
- `apps/qc-task-manager/src/components/{StatusBadge,QcStatusBadge,NotificationCard}.astro`
- `apps/qc-task-manager/src/components/lab/LabDocumentStatusBadge.astro`
- `apps/qc-task-manager/src/pages/admin/templates/index.astro`
- `apps/qc-task-manager/scripts/test-status-semantics.mjs`
- `apps/qc-task-manager/{package.json,scripts/test-manifest.mjs}`
- `apps/qc-task-manager/docs/{STATUS-SEMANTICS,UI-DESIGN-SYSTEM,DESIGN-SYSTEM-MIGRATION}.md`

### الأرقام
- أدوار العرض: 8 مسميات قديمة/مختلطة → 7 أدوار semantic canonical.
- الاختبارات: 62 canonical suites كاملة بدون فشل.
- typecheck: 0 errors، 0 warnings، 26 hints قديمة.

### القرارات
- فصل raw domain enums عن presentation semantics؛ السبب الحفاظ على RBAC والـworkflow والـdatabase integrity مع توحيد المعنى البصري.
- إبقاء compatibility adapters مؤقتًا بدل حذف imports دفعة واحدة؛ السبب ترحيل آمن route-sized ومنع كسر الشاشات القديمة.

### التحقق
- `pnpm test` ✅ — 62/62 canonical suites.
- `pnpm typecheck` ✅ — 0 أخطاء، 0 تحذيرات، 26 hints قائمة.
- `NODE_ENV=production pnpm build` ✅ — Complete؛ تحذيرات Vite الديناميكية المعروفة فقط.
- `pnpm test:status-semantics` ✅؛ `test:ui-consistency` ✅؛ `test:badge-contrast` ✅؛ `test:manifest` ✅.
- اختبارات `test:lab-tests` و`test:lab-documents` و`test:lab-calibration` ✅ — calibration 97/0.
- `git diff --check` ✅؛ لم يحدث commit أو push.

### النتيجة
- **الحالة:** نجح
- **مختصر:** صار عند التطبيق عقد semantic موحّد للحالات مع adapters واضحة وحراسة regression، بدون تعديل قواعد العمل أو الصلاحيات أو بيانات SQLite.

### ملاحظات / مشاكل مفتوحة
- ما زالت بعض الشاشات الطرفية تستخدم raw status markup أو خرائط محلية خارج wrappers؛ ترحيلها هو المرحلة التالية حسب المخاطر.
- الفحص اليدوي الكامل لقارئ الشاشة والـprint/ألوان الوضع الداكن يحتاج UAT مستقل؛ الاختبارات المصدرية والتباين الآلي نجحت.

## [2026-08-28] — QC-DESIGN-SYSTEM-FOUNDATION-001: تأسيس طبقة التوكنز والعقود المشتركة

### تم التنفيذ
- أضفت semantic design tokens للألوان في `global.css` وربطتها بـ Tailwind aliases للـsurface/content/accent/focus وحالات success/warning/danger/info.
- أضفت vocabulary مقيّدًا للـspacing (`qc-*`)، radius، motion، وأدوار typography المسماة، مع عقد `qc-focus` موحّد.
- حدّثت `AppButton` و`Banner` و`PageHeader` و`Pagination` و`StatusPill` و`formPresets` لاستهلاك التوكنز semantic بدل قيم المظهر المباشرة، مع الحفاظ على اللغة والشكل الحاليين.
- أبقيت adapters القديمة مثل `LabActionButton` وstatus badges متوافقة، ووثقت ownership/deprecation وخطة ترحيل تدريجية بدون حذف أو rewrite واسع.
- أضفت حارسًا داخل `test-ui-consistency` يثبت وجود semantic tokens في الـprimitives ويمنع رجوع `focus:ring-*` داخلها.

### الملفات المتأثرة
- `apps/qc-task-manager/tailwind.config.mjs`
- `apps/qc-task-manager/src/styles/global.css`
- `apps/qc-task-manager/src/components/ui/{AppButton,Banner,ContextualHelp,PageHeader,Pagination,StatusPill,formPresets,statusTones}`
- `apps/qc-task-manager/src/layouts/BaseLayout.astro`
- `apps/qc-task-manager/docs/{UI-DESIGN-SYSTEM,DESIGN-SYSTEM-MIGRATION}.md`
- `apps/qc-task-manager/scripts/test-ui-consistency.mjs`

### التحقق
- `pnpm --filter @brightai/qc-task-manager typecheck` ✅ — 0 أخطاء و0 تحذيرات، 26 hints قديمة.
- `test:ui-consistency` ✅ — 177/177.
- `test:badge-contrast` ✅ — كل أزواج WCAG AA ناجحة.
- `test:architecture` ✅ — 114 route، وarchitecture guard ناجح.
- `test:responsive-e2e-contract` ✅؛ `test:lab-ux-presentation` ✅ — 14؛ `test:lab-ux-performance` ✅ — 7.
- `pnpm --filter @brightai/qc-task-manager test` ✅ — 61 canonical suites بدون فشل.
- `NODE_ENV=production pnpm --filter @brightai/qc-task-manager build` ✅ — Complete؛ تحذيرات Vite الديناميكية المعروفة فقط.
- `git diff --check` ✅؛ ما صار commit أو push.

### النتيجة
- **الحالة:** نجح
- **مختصر:** صار عند التطبيق أساس semantic موحّد وعقود واضحة للـprimitives عالية الاستخدام، مع ترحيل آمن تدريجي للشاشات بدل تغيير قواعد المجال أو البنية.

### ملاحظات / مشاكل مفتوحة
- بقيت الشاشات الطرفية التي تستخدم raw Tailwind classes خارج نطاق الترحيل الأول؛ ترحيلها يكون route-sized حسب الخطة والاختبارات.
- الفحص اليدوي الفعلي على 360/1440 وقارئ الشاشة يحتاج UAT مستقل؛ اختبارات responsive العقدية نجحت.

## [2026-08-28] — QC-DB-HYGIENE-025: تغطية ملفات SQLite المتتبعة في تطبيق QC

### تم التنفيذ
- وسّعت `.gitignore` الخاص بتطبيق `apps/qc-task-manager` ليغطي `*.db` و`*.db-wal` و`*.db-shm` بأي عمق.
- أضفت نمط `db/e2e_*.db*` لحماية قواعد الاختبارات وملفاتها الجانبية، مع بقاء `db/schema.sql` غير متأثر لأنه SQL.
- وسّعت `verify-security-hygiene.mjs` ليفشل صراحةً عند تتبع أي `.db` أو `.db-wal` أو `.db-shm` تحت تطبيق QC بأي عمق.
- لم أحذف أي قاعدة محلية غير متتبعة؛ قواعد `db/qc_tasks.db` و`db/e2e_*.db*` بقيت على القرص ومهملة من Git.

### الملفات المتأثرة
- `apps/qc-task-manager/.gitignore`
- `apps/qc-task-manager/scripts/verify-security-hygiene.mjs`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `node apps/qc-task-manager/scripts/verify-security-hygiene.mjs` ✅ — Security hygiene passed.
- `git check-ignore -v` ✅ — الجذر، WAL، SHM، و`db/e2e_*.db*` طابقت الأنماط الجديدة.
- `pnpm test` ✅ — 60 canonical suites، بدون فشل، exit 0.
- `git status --short` ✅ — لا يظهر `.db` غير مقصود؛ ملفات DB المحلية مهملة.
- `git diff --check` ✅.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** حماية التجاهل وحارس hygiene مكتملان والاختبارات خضراء. الحذفان المرحّلان المذكوران في سياق المهمة غير موجودين حاليًا في الـ index أو HEAD، لذلك لم أعد staging أو حذفًا من عندي.

### ملاحظات / مشاكل مفتوحة
- لا توجد staged deletions حاليًا عند التحقق عبر `git diff --cached`؛ يلزم مراجعة جلسة/حالة Git السابقة إذا كان المطلوب استعادتهما كحذفين مرحّلين.

## [2026-08-28] — OP-01: إزالة مفتاح تقييم خاص من الملفات المتتبعة وتشديد فحص hygiene

### تم التنفيذ
- استبدلت قيمة `EVAL_CERT_SIGNING_KEY_RING` الخاصة في `README.md` بمثال public-only يستخدم placeholder التوليد.
- أزلت بيانات اتصال قاعدة البيانات المكتوبة بصيغة credentials من README واستبدلتها بقيم تعليمية placeholder.
- وثّقت للمالك توليد المفتاح محليًا، حفظ المفتاح الخاص خارج الملفات المتتبعة، وخطوة التدوير الخارجي عند الاشتباه بالتسريب.
- أضفت إلى فحص QC مسحًا لمحتوى كل ملف متتبع يرفض أي marker لمادة private key، مع إبقاء تقرير الفشل مقتصرًا على المسار دون القيمة.
- عدّلت regex في أداة تدقيق النشر لتفادي تطابق `git grep` مع كود الكاشف نفسه.

### الملفات المتأثرة
- `README.md`
- `apps/qc-task-manager/scripts/verify-security-hygiene.mjs`
- `.agents/skills/publish-project-to-github/scripts/audit_public_project.sh`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `node apps/qc-task-manager/scripts/verify-security-hygiene.mjs` ✅ — Security hygiene passed.
- `node --check apps/qc-task-manager/scripts/verify-security-hygiene.mjs` ✅
- فحص Git للـ private-key marker ✅ — لا نتائج حالية.
- `git diff --check` ✅
- فحص تاريخي بدون طباعة قيم ✅ — بقيت واقعة التسريب التاريخي معروفة؛ التدوير الخارجي ما زال إلزاميًا.

### النتيجة
- **الحالة:** نجح
- **مختصر:** لا توجد مادة private-key في الملفات المتتبعة حاليًا، والمثال التعليمي صار public-only مع فحص regression دائم.

### ملاحظات / مشاكل مفتوحة
- وجود المفتاح في تاريخ Git لا يُلغى بتعديل الملفات الحالية؛ يلزم تدوير/إبطال المفتاح خارجيًا وفق OP-01.

## [2026-08-28] — CP-01: تحديث تأكيدات بحث المختبر وإخضرار بوابة القبول

### تم التنفيذ
- استبدلت التأكيدات الثلاثة المتقادمة في سيناريو E داخل `e2e-lab-search.mjs` بتأكيد على section حالة `OperationalState` التي تحتوي heading `No search results`.
- أبقيت تحقق عزل RBAC فعليًا بإضافة شرط عدم وجود أي صفوف `tbody tr` لكل بحث موظف عن اختبار/عينة/lot مملوك لموظف آخر.
- لم أعدّل `src/lib/lab/search.ts` أو نص الواجهة، وأبقيت إصلاح locators الموجود في `e2e-lab-form.mjs` كما هو.

### الملفات المتأثرة
- `apps/qc-task-manager/scripts/e2e-lab-search.mjs`
- `.agents/mind/01-mind-latest.md`

### الأرقام
- `test:manifest`: 60 suite canonical و28 suite E2E، خلال 0.40 ثانية.
- `e2e:acceptance`: 28 suite workflow + مرحلتا restart-persistence = 30/30 مرحلة ناجحة.
- التأكيدات: `3047+` ناجحة حسب ملخص runner؛ `lab-search` = 21/21.
- المدة: 166.804 ثانية داخل runner، و178.20 ثانية للعميلة كاملةً شاملًا البناء.

### التحقق
- `pnpm test:manifest` ✅
- `pnpm e2e:acceptance` ✅ — exit 0، وكل suites والـ persistence ناجحة.
- `astro build` ضمن بوابة القبول ✅ — تحذيرات Vite الديناميكية المعروفة فقط.
- فحص عدم لمس منطق العزل ✅ — التغيير محصور في سكربت E2E.

### النتيجة
- **الحالة:** نجح
- **مختصر:** بوابة القبول صارت خضراء بالكامل، مع بقاء تحقق عدم ظهور نتائج الموظف الآخر بدل تخفيف السيناريو إلى مجرد فتح الصفحة.

### ملاحظات / مشاكل مفتوحة
- لا يوجد ضمن نطاق CP-01؛ ما فيه commit أو push أو deploy.

## [2026-08-28] — QC-ARCH-UIUX-REVIEW-024: تدقيق معماري وواجهة وتجربة كامل لتطبيق QC Task Manager

### تم التنفيذ
- نفذت تدقيقًا تحليليًا فقط للمصدر الحالي تحت `apps/qc-task-manager/` بدون تعديل كود المنتج أو refactor أو commit أو push.
- قرأت العقل الحي وتعليمات المشروع وREADME/config/skills المناسبة، ثم راجعت بنية Astro SSR، الصفحات، layouts، React islands، UI primitives، domain libs، APIs، middleware، DB، الاختبارات والوثائق.
- تحققت من التشغيل الفعلي عبر production build وأداة screenshots على 60 شاشة/دور بعروض 390/768/1440؛ لا overflow على مستوى الصفحة ولا أخطاء H1 في العينة.
- وثقت 14 finding مرتبة: أبرزها طول dashboard، كثافة LabTestForm، hydration عالمي لـ Navbar، تكرار status/action systems، touch targets أصغر من 44px، وdrift بين PageHeader الموثق والمستخدم فعليًا.
- ولدت 8 implementation prompts مستقلة تغطي P1/P2 وبعض P3، بدون تنفيذ أي prompt.

### الملفات المتأثرة
- `apps/qc-task-manager/docs/FULL-ARCHITECTURE-UI-UX-REVIEW.md`
- `.agents/mind/01-mind-latest.md` (هذا السجل)

### التحقق
- `pnpm --filter @brightai/qc-task-manager typecheck` ✅ — 0 errors، 26 hints.
- `pnpm --filter @brightai/qc-task-manager test:architecture` ✅ — route manifest + architecture guard.
- `pnpm --filter @brightai/qc-task-manager test:ui-consistency` ✅ — 164/164.
- `pnpm --filter @brightai/qc-task-manager test:responsive-e2e-contract` ✅.
- `pnpm --filter @brightai/qc-task-manager test:badge-contrast` ✅ — 13/13.
- `pnpm --filter @brightai/qc-task-manager test:lab-ux-presentation` ✅ — 14 checks.
- `pnpm --filter @brightai/qc-task-manager test:lab-ux-performance` ✅ — 7 checks.
- `NODE_ENV=production pnpm --filter @brightai/qc-task-manager build` ✅ — build نجح مع تحذيرات Vite عن dynamic imports غير القابلة للتقسيم.
- `node scripts/ui-screenshots.mjs` بصلاحية تشغيل localhost ✅ — 60 screenshot/route checks على 390/768/1440، بدون page overflow أو H1 failures في التقرير.

### النتيجة
- **الحالة:** نجح
- **مختصر:** التقرير التحليلي مكتمل ومبني على المصدر الحالي والتشغيل الفعلي؛ الحكم هو CONDITIONAL GO للاستمرار، مع أولوية لمعالجة كثافة العمل والـdesign-system drift قبل أي refactor واسع.

### ملاحظات / مشاكل مفتوحة
- لم تُنفذ أي إصلاحات؛ الـimplementation prompts للتنفيذ اللاحق فقط.
- الفحص اليدوي الكامل لقارئ الشاشة، 200% zoom، high-contrast، وقيم القياس/النصوص المختلطة القصوى ما زال يحتاج UAT مركزًا.
- بقيت حالة الشجرة السابقة كما هي: تعديل `e2e-lab-form.mjs`، حذف ملفات DB المرحّل، وتقارير ULTIMATE والـfixtures غير المتتبعة؛ لم ألمسها.

## [2026-08-28] — QC-ULTIMATE-AUDIT-023: تدقيق جنائي شامل ثالث (ULTIMATE) — CONDITIONAL GO مع تبرئة RBAC بحث المختبر وإثبات أن بوابة القبول معطلة بسبب اختبار متقادم

### تم التنفيذ
- جمّدت الواقع: HEAD `3b25585b` على `main`، شجرة dirty (تعديل `e2e-lab-form.mjs` المعلق + حذف staged لملفي DB + `scripts/__fixtures__/` غير متتبع).
- شغّلت 17 بوابة/أمر بأكواد خروج موثقة في `/tmp/qc-gates{,2,5,6}.log`: typecheck ✅ · manifest ✅ (60/28) · route-manifest ✅ (114/25/6) · parity ✅ (38/38) · migrations ✅ · architecture ✅ · ui-consistency ✅ (164) · full-test ✅ (60/60) · build ✅ · db-doctor ✅ · production-operations ✅ (restore/restart/integrity/FK/chains) · deployment-contract ✅ (21) · performance ✅ · security-hygiene ✅ · e2e-reports ✅ (standalone) · e2e-responsive ✅ (648/648) — و**e2e:acceptance ❌ exit 1** (26/29 suite قبل التوقف).
- **P1-001 بجذر جديد موثق:** فشل القبول سببه 3 تأكيدات متقادمة في `e2e-lab-search.mjs:282,287,292` تنتظر نص `No matching laboratory records found` بينما الفعلي `No search results` (OperationalState.astro:8). **عزل RBAC نفسه بُرّئ تشغيليًا** بمسبار مباشر على `searchLab()`: موظف→اختبار/عينة/lot زميله = 0 نتائج؛ مدير = يراها (شرط tested_by/created_by في search.ts:192-195 يعمل).
- **P1-002 مُعاد التحقق مستقلًا:** `README.md:33` يحوي Ed25519 **خاص** حقيقي (تحقق برمجي بلا طباعة القيمة) — الإزالة كودية + التدوير فعل مشغّل.
- اكتشافات جديدة: skills-lock.json منهار (164/164 هاش لا يطابق، 11 مدخلًا ميتًا، 201 غير مسجل مقابل 364 مجلدًا سليمة ذاتيًا) · schema.sql ينقصه 11 كائنًا حيًا (ai_audit_log + 7 فهارس + uq_notifications_dedupe_key) · .gitignore لا يغطي .db بجذر التطبيق (سبب تسرب `qc_tasks 3.db` أصلًا) · مسار ميت `/api/tasks/suggestions` بلا مستهلك · مثال DEPLOYMENT.md schemaVersion:10≠38 · إحالات مهارات ميتة في design-pipeline.
- وكلاء التدقيق المتوازيون الستة فشلوا جميعًا (Provider authentication failed) — نفّذت التدقيق كاملًا بالجلسة الرئيسية (فحوص ساكنة + مسبار RBAC + مقارنة schema + مسح sha256 للمهارات).
- أنشأت 4 ملفات: `docs/ULTIMATE-EVIDENCE-LEDGER.md` (كل الأدلة/الأوامر/الأكواد) · `docs/ULTIMATE-SYSTEM-AUDIT.md` (الدرجات) · `docs/ULTIMATE-SKILL-COVERAGE.md` (364 مهارة كاملة) · `docs/ULTIMATE-CLOSING-PROMPTS.md` (10 مولدة من النتائج: CP-01..06 + OP-01..03 + CG-01 + مصفوفة تتبع صفر يتيمة).

### الملفات المتأثرة
- `apps/qc-task-manager/docs/ULTIMATE-EVIDENCE-LEDGER.md`
- `apps/qc-task-manager/docs/ULTIMATE-SYSTEM-AUDIT.md`
- `apps/qc-task-manager/docs/ULTIMATE-SKILL-COVERAGE.md`
- `apps/qc-task-manager/docs/ULTIMATE-CLOSING-PROMPTS.md`
- `.agents/mind/01-mind-latest.md` (هذا السجل)

### الأرقام
- البوابات: 16 ✅ / 1 ❌ (القبول — اختباري لا أمني) | P0=0 · P1=2 · P2=4 · P3=6
- المهارات: 364 مجلدًا (تطابق name=100%) مقابل 175 مدخل سجل منهار | APPLIED=38 · NOT_APPLICABLE=326 · مراجع ميتة=2
- الدرجات: Technical Completeness **92%** · Company Pilot Readiness **80%** · Overall **92%**

### القرارات
- **تصنيف CONDITIONAL GO** (لا P0؛ الحجب: إخضار القبول CP-01، تدوير المفتاح OP-01، UAT بشري OP-02، نشر حي OP-03).
- فصل برومبتات الإصلاح عن أفعال المشغّل: كل ما هو خارج قدرة الوكيل (تدوير/نشر/UAT/توريد WI) صار حزم OP صريحة — لا ادعاء تنفيذ آلي لها.

### التحقق
- 17 أمرًا بتواريخ بداية/نهاية وأكواد خروج في سجلات /tmp qc-gates*.log.
- مسبار RBAC على قاعدة /tmp مؤقتة عبر الدالة الحقيقية (نُظفت بعد الفحص) — القاعدة الحقيقية `db/qc_tasks.db` لم تُلمس (mtime سابق لأي إقلاع خادم).
- مسح sha256 برمجي كامل للمهارات + مقارنة sqlite_master لقاعدة طازجة ضد schema.sql.

### النتيجة
- **الحالة:** نجح (التدقيق مكتمل بالأدلة) — حكم النظام: **CONDITIONAL GO**
- **مختصر:** كل البوابات خضراء ما عدا بوابة قبول معطلة بتأكيد نصي متقادم (إصلاحها سطر واحد CP-01) ومفتاح خاص بانتظار التدوير؛ لا يوجد أي P0.

### ملاحظات / مشاكل مفتوحة
- إصلاح `e2e-lab-form.mjs` الموجود في شجرة العمل تحقق ضمن هذا التدقيق (141/141) ويبقى غير ملتزم — الالتزام على المستخدم.
- حذف ملفي DB المُرحّل (staged) ينتظر commit المستخدم.
- WI ما زال SOURCE-BLOCKED (صفحات 2/3 و3/3) وسياسة حجب/تحذير المعايرة المنتهية قرار إدارة.
- UAT البشري والنشر الحي غير منجزين — شرطان للترقية إلى GO.

## [2026-08-28] — COPY-SKILLS-002: نسخ `.agents/skills` إلى دليل المستخدم المنزلي

### تم التنفيذ
- نسخت مجلد `.agents/skills` كاملًا (متكررًا بـ`cp -R`) من جذر المشروع إلى `/Users/yzydalshmry/.agents/skills`.
- الوجهة (`/Users/yzydalshmry/.agents/`) كانت موجودة وفيها `.skill-lock.json` و`AGENTS.md` و`plugins/` — لكن ما كان فيها `skills/`؛ أُنشئ الآن.
- لم ألمس الملفات الأصلية في المشروع، ولا عدّلت `.skill-lock.json` أو `AGENTS.md` المنزلي.

### الملفات المتأثرة
- `/Users/yzydalshmry/.agents/skills/` (الوجهة الجديدة، ~366 مهارة/مجلد فرعي)
- `.agents/mind/01-mind-latest.md` (هذا السجل)

### التحقق
- عدد المجلدات: المصدر 755 = الوجهة 755 ✅
- عدد الملفات: المصدر 1384 = الوجهة 1384 ✅
- `diff -rq` بين المجلدين: **صفر اختلافات** (نسخة مطابقة حرفيًا) ✅

### النتيجة
- **الحالة:** نجح
- **مختصر:** نُسخ مجلد المهارات كاملًا إلى دليل المستخدم المنزلي وهوي مطابق للمصدر بنسبة 100%.

### ملاحظات / مشاكل مفتوحة
- لا يوجد. (النسخة المنطوقة/الأرقام لم تتغير؛ مجرد نسخ ملفات خارج الريبو.)

## [2026-08-28] — SUPERPOWERS-AGY-INSTALL-001: التحقق من أمر تثبيت obra/superpowers على Antigravity

### تم التنفيذ
- قرأت تعليمات `plugin-creator` وعقل المشروع قبل التعامل مع الطلب.
- تحققت من تعليمات المستودع الرسمي؛ أمر Antigravity الصحيح هو `agy plugin install https://github.com/obra/superpowers`.
- تحققت محليًا من وجود `agy`، ولم يكن مثبتًا في البيئة الحالية.
- لم تُعدّل ملفات المشروع ولم تُنفّذ عملية تثبيت جزئية.

### الملفات المتأثرة
- `.agents/mind/01-mind-latest.md`

### التحقق
- مرجع التثبيت الرسمي في مستودع `obra/superpowers` ✅
- `command -v agy` — غير موجود في البيئة ⚠️

### النتيجة
- **الحالة:** جزئي
- **مختصر:** أمر التثبيت الصحيح محدد، لكن تنفيذه محجوب لأن Antigravity CLI (`agy`) غير مثبت على الجهاز.

### ملاحظات / مشاكل مفتوحة
- يلزم تثبيت Antigravity CLI أو تشغيل الأمر من جهاز/بيئة فيها `agy`.

## [2026-08-28] — QC-POST-IMPLEMENTATION-MASTER-AUDIT-022: تدقيق جنائي مستقل شامل بعد التنفيذ — CONDITIONAL GO مع اكتشاف بوابة القبول مكسورة فعليًا

### تم التنفيذ
- جمدت الواقع: HEAD `b51504b7` على `main`، Node v22.22.3، pnpm 10.19.0؛ الشجرة فيها بس العقل المعدّل + تقرير untracked — **ما فيه كود تنفيذ غير ملتزم** (لا reproducibility finding).
- شغلت كل البوابات بتحقق طازج: typecheck ✅، manifest ✅ (60/28)، route-manifest ✅ (114/25/6)، parity ✅ (38/38)، migrations ✅، full test chain ✅ (60/60)، production build ✅ — **وe2e:acceptance ❌ exit 1** (P1-001).
- **اكتشاف جوهري P1-001:** سويت `e2e-lab-form` تنهار — نص ContextualHelp المضاف في QC-PILOT-UAT-019 (`lab/tests/new.astro:154`) يحتوي "Save Draft"/"Submit for Review" حرفيًا فيكسر 8 تأكيدات sticky-bar (count()===1) و`page.click('text=Save Draft')` يحل لـ3 عناصر (أولها فقرة مساعدة مخفية) → Timeout غير مُلتقط → `e2e-acceptance.mjs:148` ترمي وتوقف البوابة؛ 12 سويت عدّت (823 assertion) و15 سويت + مرحلتا persistence **ما نُفذت** هذا التدقيق. ادعاء 021 أن القبول خضراء = STALE/FALSE على نفس HEAD.
- فحص DB جنائي على قواعد مؤقتة: init نظيف (schema v38، 51 جدول)، db-doctor PASS (integrity/FK/checksum/parity)، ودريل معزول backup→mutate→restore→restart→chains→deployment-contract **PASS** بنسخ حقيقية 856KB.
- تدقيق أمني شامل (وكيل + مسح ثابت): SQLi/XSS/CSRF/IDOR/redirects/path-traversal نظيفة (36/36 API محمية، CSP بلا unsafe-inline/eval، renderer الوثائق escape-only)؛ **P1-002: مفتاح Ed25519 خاص حقيقي مضمّن في `README.md:33`** (ROTATION REQUIRED) + token شبه حي في `.claude/settings.local.json` (untracked).
- أكدت باغات hygiene وdrift: الملفان `qc_tasks.db` و`qc_tasks 3.db` متتبعان (`.gitignore` يغطي `db/*.db` فقط — P2-003)، و`db/schema.sql` مفقود منه `ai_audit_log` + 6 فهارس وفيه فهرس غير موجود بالهجرات (P2-008)، ومسار ميت `GET /api/tasks/suggestions` (P3-012).
- أنشأت 6 ملفات تدقيق في `docs/final-audit/`: FILE-COVERAGE (457 ملف، تغطية 100%: 426 CLEAN/15 ISSUE/16 REQUIRES-RUNTIME-EVIDENCE)، ROUTE-COVERAGE، POST-IMPLEMENTATION-REFERENCE-AUDIT (48 قسمًا + 42 سجل ملاحظات: P0=0/P1=2/P2=9/P3=11)، POST-IMPLEMENTATION-AUDIT.json، PILOT-READINESS-SCORECARD، وFINAL-CLOSING-PROMPTS (5 برومبتات إغلاق + QC-FINAL-CLOSING-VERIFICATION).
- الدرجات: الإجمالي الموزون **91.6%** (بالأوزان الإلزامية وبإظهار الحساب)؛ اكتمال الكود 96%، ثقة التحقق الآلي 84%، أمان 91%، سلامة بيانات 97%، UI 90%، جاهزية pilot 82%، production 78%، **HUMAN UAT: NOT VERIFIED** (صفر نتائج بشرية)، **LIVE DEPLOYMENT: NOT VERIFIED**.
- ما عدلت أي كود منتج، وما صار commit أو push أو deploy (وضع التدقيق الصارم). القواعد المؤقتة نُظفت.

### الملفات المتأثرة
- `apps/qc-task-manager/docs/final-audit/{FILE-COVERAGE,ROUTE-COVERAGE,POST-IMPLEMENTATION-REFERENCE-AUDIT,PILOT-READINESS-SCORECARD,FINAL-CLOSING-PROMPTS}.md`
- `apps/qc-task-manager/docs/final-audit/POST-IMPLEMENTATION-AUDIT.json`
- `.agents/mind/01-mind-latest.md` (هذا السجل)

### التحقق
- 10 بوابات/أوامر بـstart/end وexit codes موثقة في `/tmp/qc-audit-gates.log` و`/tmp/qc-prodops.log` (9 ✅ و1 ❌).
- db:status + test:production-operations معزولان على قواعد `/tmp` مؤقتة ✅ (حُذفت بعد الفحص).
- 3 وكلاء تدقيق قراءة-فقط (جرد/RBAC/أمان + UI/UX) بأدلة file:line.
- المسح الثابت: @ts-ignore=0، eval=0، any=8، eslint-disable=3، TODO فعلي=1 (قراءة WI المتعمدة).

### النتيجة
- **الحالة:** نجح (التدقيق نفسه مكتمل بالأدلة) — الحكم على النظام: **CONDITIONAL GO**
- **مختصر:** ما فيه P0؛ الحكم محجوب عن GO بسبب P1-001 (بوابة القبول مكسورة بسبب تصادم locators مع نص المساعدة)، P1-002 (تدوير مفتاح README)، غياب UAT بشري فعلي، وعدم التحقق الحي من النشر. الترتيب المقترح: إصلاح البوابة وتشغيل قبول كامل أخضر ← تدوير المفتاح + إزالة تتبع DB ← UAT ← تحقق نشر حي.

### ملاحظات / مشاكل مفتوحة
- 15 سويت E2E + مرحلتا persistence غير متحققة تشغيليًا في هذا التدقيق (حجبها انهيار P1-001) — تقفلها تلقائي بعد إصلاح البوابة.
- WI ما زال SOURCE-BLOCKED (الصفحات 2/3 و3/3 غير موردة)، وسياسة تجاوز المعايرة (تحذير أم حجب) ما زالت قرار إدارة QC.
- مفتاح README يجب تدويره خارج المستودع؛ قيمة المفتاح لم تُطبع في أي تقرير.

## [2026-08-28] — SKILLS-RESTORE-026: التراجع عن التقليم واستيراد كل مهارات الإضافات

### تم التنفيذ
- بطلب المستخدم تراجعت عن تقليم `SKILLS-CONSOLIDATE-025`: أرجعت **121 مجلد مهارة** من النسخة الاحتياطية `/tmp/brightai-skills-backup/agents-skills-20260828-071029.tgz` — لا حذف متبقٍ في `git status`.
- استوردت **94 مهارة إضافية** لم تُنقل سابقًا، من clone مباشر لريبوهات المتجر: `Owl-Listener/designer-skills` و`Owl-Listener/inclusive-design-skills` — يعني الـ158 مهارة حق الإضافات كلها صارت جوة الريبو.
- عالجت 11 مهارة بأسماء عامة متصادمة (`review`, `audit`, `simplify`, `document`, `handoff`, `generate`, `specify`, `structure`, `rewrite`) بإعادة تسميتها بسابقة الحزمة، مثل `accessible-content-review` و`inclusive-personas-generate`، وحدّثت حقل `name:` داخل كل SKILL.md ليطابق اسم المجلد.
- أصلحت عيبًا في المصدر: `adaptive-personalisation/SKILL.md` كان يحمل `name: contextual-help-design` فيتصادم مع مهارة حقيقية بنفس الاسم — صار `name: adaptive-personalisation`.
- أرجعت `skills-lock.json` لـ175 مدخلًا، وزامنت `.claude/skills/` بإضافة 215 symlink — 371 symlink مقابل 371 مهارة، صفر رابط مكسور.
- نظام الإضافات باقٍ مُلغى من `SKILLS-CONSOLIDATE-025`: `enabledPlugins: {}` والمتجر محذوف — المهارات كلها ملفات حقيقية داخل الريبو.

### الملفات المتأثرة
- `.agents/skills/` — 156 → **371** مهارة
- `.claude/skills/` — 371 symlink
- `skills-lock.json` — 50 → 175 مدخل

### الأرقام
- مهارات: 156 → **371** (121 مُرجَعة + 94 مستوردة)
- مهارات مُعاد تسميتها لتفادي التصادم: 11 | تصادم أسماء متبقٍ: **0**
- `git status`: 316 غير متتبّع، 6 تعديل، **0 حذف**

### القرارات
- **إلغاء معيار التقليم** — المستخدم يفضّل التغطية الكاملة على القائمة المركّزة؛ قرار `SKILLS-CONSOLIDATE-025` بحذف الألعاب/WebGL/الثيمات مُلغى.
- **الأسماء العامة تُسبق بالحزمة** — مهارات مثل `review` و`audit` كانت تتصادم بين حزم متعددة في مجلد مسطّح واحد؛ السابقة تحل التصادم وتحفظ المصدر في الاسم.
- **الاستيراد من clone مو من الكاش** — كاش الإضافات كان محذوفًا، فالـclone المباشر هو المصدر الوحيد المتاح وأيضًا أوثق.

### التحقق
- `ls .agents/skills | wc -l` ✅ = 371
- تصادم `name:` بين كل المهارات ✅ = 0
- `name:` != اسم المجلد ✅ = 0
- symlinks مكسورة ✅ = 0
- `git status` ✅ — 0 حذف (كل المتتبّع مُرجَع)
- SKILL.md مفقود: 1 — `stitch-design-taste` (مجلد فاضي سابق للمهمة، غير فعّال)
- ما شغّلت build/tests — لا مساس بكود المشروع.

### النتيجة
- **الحالة:** نجح
- **مختصر:** 371 مهارة كلها في `.agents/skills/` كملفات حقيقية بمسار واحد، بلا تصادم أسماء وبلا اعتماد على نظام الإضافات. ما صار commit ولا push.

### ملاحظات / مشاكل مفتوحة
- **حجم قائمة المهارات كبير جدًا (371)** — يثقّل اكتشاف المهارات والسياق. لو ظهر تدهور في اختيار المهارة الصح، التقليم خيار متاح ولستا `keep`/`delete` محفوظتان.
- `stitch-design-taste` مجلد فاضٍ بلا SKILL.md، و`design-pipeline/SKILL.md` يشير له ولـ`image-to-code` غير الموجودة — عيب سابق، يحتاج إصلاح أو إزالة الإشارات.
- **4 ملفات SKILL.md موجودة أصلًا انكتب فوقها** من `npx skills add`: `emil-design-eng`, `pick-ui-library`, `prototype`, `review-animations` — راجع `git diff` قبل الـ commit.
- الدستور `CLAUDE.md` مكتوب فيه "67 مهارة" — الرقم الصحيح الآن **371**.

## [2026-08-28] — SKILLS-CONSOLIDATE-025: توحيد المهارات في مسار واحد وتقليم غير المفيد

### تم التنفيذ
- أخذت نسخة احتياطية كاملة قبل أي حذف: `/tmp/brightai-skills-backup/agents-skills-20260828-071029.tgz` (85MB) تشمل `.agents/skills`, `.claude/skills`, `skills-lock.json`, `.claude/settings.json`.
- نقلت **71 مهارة منتقاة** من إضافات `designer-skills` جوة `.agents/skills/` كملفات حقيقية (64 من كاش الإضافات + 7 نقد بصري من ريبو المتجر) — صفر تصادم أسماء.
- حذفت **121 مجلد مهارة** غير مفيدة للمشروع: ألعاب Three.js (~22)، WebGL/3D/شيدرز (~23)، جزيئات وتأثيرات زخرفية (~7)، ثيمات جمالية جاهزة (~30)، منصات ثانية (`write-swift`, `animate-expo`, `performance-profiling` الخاصة بـApple)، سوشال/شخصي، ومهارات مكرّرة (`make-interfaces-feel-better` كانت نسخة مطابقة لـ`better-ui`).
- أبقيت المهارات ما قبل التثبيتات اللي فيها تخصيص للمشروع: `design-pipeline`, `design-md` (فيه triggers عربية), `awesome-design-md`, `grill-me`, `i-have-adhd`.
- نظّفت `skills-lock.json` من 125 مدخلًا لمهارات محذوفة.
- زامنت `.claude/skills/`: حذفت 114 symlink معلّق وأضفت 117 جديد — صار 156 symlink يطابق 156 مهارة، صفر رابط مكسور.
- ألغيت تثبيت الـ15 إضافة وحذفت متجر `designer-skills` وكاشه — `.claude/settings.json` صار `enabledPlugins: {}`؛ ما بقي إلا `claude-plugins-official`.

### الملفات المتأثرة
- `.agents/skills/` — 277 → **156** مهارة (كلها ملفات حقيقية بمسار واحد)
- `.claude/skills/` — 156 symlink فقط، تشير لـ`.agents/skills/`
- `skills-lock.json` — 175 → 50 مدخل
- `.claude/settings.json` — `enabledPlugins` صار فارغًا

### الأرقام
- مهارات: 206 (قبل النقل) → 277 (بعد النقل) → **156** (بعد التقليم)
- محذوف: 121 مجلد | منقول: 71 | باقٍ من الأصل: 85
- إضافات Claude: 15 → **0** | متاجر: 2 → 1

### القرارات
- **مصدر حقيقة واحد = `.agents/skills/`** — ملفات حقيقية هناك فقط، و`.claude/skills/` symlinks بحتة. بكذا الريبو يحمل المهارات، وما يعتمد على كاش إضافات خارج المشروع.
- **إلغاء نظام الإضافات كليًا** — الإضافات تخزّن مهاراتها في `~/.claude/plugins/cache/` خارج الريبو، يعني أي وكيل ثاني أو جهاز ثاني ما يشوفها. النقل جوة الريبو يحل هذا.
- **معيار التقليم:** BRIGHTAI موقع Astro ثابت عربي RTL + لوحة Next.js + QC SSR. أي مهارة عن ألعاب أو 3D/WebGL أو منصات ثانية (Swift/RN) أو ثيمة جمالية جاهزة = بلا فائدة، وتزحم اكتشاف المهارات وتثقّل السياق.

### التحقق
- `ls .agents/skills | wc -l` ✅ = 156
- كل مجلد فيه `SKILL.md` ✅ (0 مفقود)
- symlinks مكسورة في `.claude/skills/` ✅ = 0
- `claude plugin marketplace list` ✅ — `designer-skills` مُزال
- `git status` ✅ — 18 حذف متتبّع، 6 تعديل، 110 غير متتبّع
- ما شغّلت build/tests — لا مساس بكود المشروع.

### النتيجة
- **الحالة:** نجح
- **مختصر:** المهارات موحّدة في `.agents/skills/` بـ156 مهارة مركّزة على SEO/GEO والوصول والأداء وAstro/Tailwind وسير العمل وجودة الواجهة؛ نظام الإضافات مُلغى بالكامل. ما صار commit ولا push.

### ملاحظات / مشاكل مفتوحة
- **8 مهارات متتبّعة في git انحذفت** (قابلة للاسترجاع بـ`git checkout --`): `12-principles-of-animation`, `animation-vocabulary`, `find-animation-opportunities`, `industrial-brutalist-ui`, `llm-council`, `make-interfaces-feel-better`, `minimalist-ui`, `transformer-workspace-auditor`.
- **4 ملفات SKILL.md موجودة أصلًا انكتب فوقها** من `npx skills add`: `emil-design-eng`, `pick-ui-library`, `prototype`, `review-animations` — راجع `git diff` قبل الـ commit.
- `design-pipeline/SKILL.md` يشير لمهارتين غير موجودتين: `stitch-design-taste` (كان مجلدًا فاضيًا وانحذف) و`image-to-code` (ما كانت موجودة من الأصل) — عيب سابق للمهمة، يحتاج إصلاح أو إزالة الإشارات.
- الدستور `CLAUDE.md` مكتوب فيه "67 مهارة" — الرقم الصحيح الآن **156**.

## [2026-08-28] — SKILLS-INSTALL-024: إضافة متجر designer-skills وتثبيت 15 إضافة تصميم/وصول

### تم التنفيذ
- أضفت المتجر: `claude plugin marketplace add Owl-Listener/designer-skills` — نجح، مُعلن في user settings (clone عبر HTTPS لعدم توفر SSH).
- المتجر يعرض 33 إضافة إجمالًا (منها فئات: تصميم/UX، إدارة برامج، قيادة تصميم، AI product design، وصول شامل).
- بقرار المستخدم ثبّتنا 15 إضافة فقط بنطاق **project** — تجنّبًا لتضخيم قائمة المهارات:
  - تصميم/UX (9): `design-research`, `design-systems`, `ux-strategy`, `ui-design`, `interaction-design`, `prototyping-testing`, `design-ops`, `designer-toolkit`, `visual-critique`
  - وصول شامل (6): `cognitive-accessibility`, `inclusive-interaction`, `accessible-content`, `inclusive-personas`, `adaptive-interfaces`, `accessibility-decisions`
- الـ18 الباقية (إدارة برامج، قيادة، AI product design) ما ثبّتناها — متاحة بالمتجر وقت الحاجة.

### الملفات المتأثرة
- `.claude/settings.json` — أُنشئ/حُدّث بـ `enabledPlugins` (15 مفتاحًا)
- `~/.claude/settings.json` — إعلان المتجر (خارج الريبو)
- `~/.claude/plugins/marketplaces/designer-skills/` — كاش المتجر (خارج الريبو)

### الأرقام
- إضافات مثبّتة: 0 → **15** من أصل 33 متاحة
- مهارات `.agents/skills/`: 206 (لم تتغير — الإضافات مسار مستقل عن مجلد المهارات)

### القرارات
- **نطاق project مو user** — لأن الإضافات مرتبطة بشغل BRIGHTAI تحديدًا، وبكذا الإعداد يتوثّق داخل الريبو ويشوفه أي وكيل يشتغل عليه.
- **تثبيت جزئي مو كامل** — 33 إضافة تعني مئات مهارات تحمّل السياق بلا فائدة مباشرة للمشروع.

### التحقق
- `claude plugin marketplace list` ✅ — designer-skills مضاف
- كل أمر تثبيت رجّع `✔ Successfully installed` ✅ (15/15)
- `.claude/settings.json` ✅ يحتوي 15 إضافة مفعّلة
- ما شغّلت build/tests — التغيير إعدادات أدوات فقط، لا يمس كود المشروع.

### النتيجة
- **الحالة:** نجح
- **مختصر:** المتجر مضاف و15 إضافة تصميم/وصول مفعّلة بنطاق المشروع؛ ما صار commit ولا push.

### ملاحظات / مشاكل مفتوحة
- **ملاحظة مهمة:** التثبيتات السابقة (`npx skills add`) عدّلت 4 ملفات SKILL.md موجودة أصلًا: `emil-design-eng`, `pick-ui-library`, `prototype`, `review-animations` — أي نسخ فوق نسخ سابقة. يفضّل مراجعة `git diff` عليها قبل الـ commit.
- الدستور `CLAUDE.md` ما زال مكتوب فيه "67 مهارة" — الرقم الفعلي 206 مهارة + 15 إضافة.

## [2026-08-28] — SKILLS-INSTALL-023: تركيب حزمة jakubkrehel/skills (مهارات واجهة وتصميم)

### تم التنفيذ
- شغّلت `npx skills@latest add jakubkrehel/skills` — نزلت 11 مهارة.
- المهارات: `better-accessibility`, `better-colors`, `better-interface`, `better-layout`, `better-typography`, `better-ui`, `better-writing`, `break`, `explain-interface`, `interface-review`, `variant`.
- الأداة عرضت تقرير فحص أمني: كل المهارات Safe / 0 alerts — عشرة منها Low Risk و`explain-interface` مصنّفة Med Risk.
- كل مهارة انزلت universal (Antigravity, Cline, Codex, Cursor, Gemini CLI +12) مع symlinks لـ Claude Code و ZCode.

### الملفات المتأثرة
- `.agents/skills/` — أصبح 206 مجلد مهارة

### الأرقام
- عدد المهارات: 195 → **206**

### التحقق
- `ls .agents/skills | wc -l` ✅ = 206
- فحص الأداة الأمني ✅ Safe / 0 alerts لكل المهارات الـ11.
- ما شغّلت build/tests — التغيير مقصور على مجلد المهارات.

### النتيجة
- **الحالة:** نجح
- **مختصر:** 11 مهارة واجهة/تصميم مركّبة محليًا؛ ما صار commit ولا push.

### ملاحظات / مشاكل مفتوحة
- `explain-interface` مصنّفة Med Risk من الأداة — يفضّل قراءة `SKILL.md` قبل استخدامها.
- الدستور `CLAUDE.md` ما زال مكتوب فيه "67 مهارة" — يحتاج تحديث للرقم الفعلي 206.

## [2026-08-28] — SKILLS-INSTALL-022: تركيب حزمتي مهارات خارجيتين (emilkowalski + MengTo)

### تم التنفيذ
- شغّلت `npx skills@latest add emilkowalski/skills` — نزلت 12 مهارة (animate, animate-expo, animation-vocabulary, improve-animations, find-animation-opportunities, review-animations, apple-design, emil-design-eng, prototype, pick-ui-library, ask-sonner, write-swift).
- شغّلت `npx skills@latest add MengTo/Skills` — نزلت حزمة كبيرة تشمل مهارات WebGL/Three.js، GSAP، أنظمة تصميم/لاندنق، بناء ألعاب ويب، وحزمة SEO كاملة (`seo-*`).
- كل مهارة انزلت بصيغة universal (Antigravity, Cline, Codex, Cursor, Gemini CLI +12) مع symlinks لـ Claude Code و ZCode.
- ما قرأت محتوى المهارات ولا راجعتها أمنيًا — الأداة نفسها تنبّه إنها تشتغل بكامل صلاحيات الوكيل.

### الملفات المتأثرة
- `.agents/skills/` — 195 مجلد مهارة إجمالًا بعد التركيب (كان ~67 حسب الدستور)

### الأرقام
- عدد المهارات: ~67 → **195**

### التحقق
- `ls .agents/skills | wc -l` ✅ = 195
- ما شغّلت build/tests — التغيير مقصور على مجلد المهارات ولا يمس كود المشروع.

### النتيجة
- **الحالة:** نجح
- **مختصر:** الحزمتان مركّبتان محليًا وجاهزتان للاستخدام؛ ما صار commit ولا push.

### ملاحظات / مشاكل مفتوحة
- **مراجعة أمنية معلّقة:** محتوى المهارات الجديدة (خصوصًا اللي فيها سكربتات) ما راجعته — يفضّل فحصها قبل الاعتماد عليها.
- الدستور `CLAUDE.md` يقول "67 مهارة" — الرقم صار قديم ويحتاج تحديث.

## [2026-08-28] — QC-COMPANY-PILOT-GATE-021: تحقق نهائي مستقل لجاهزية تجربة الشركة

### تم التنفيذ
- تحققت من المصدر الحالي على HEAD `b51504b7ae4e0b8a424a23c6190a43de9a0d2670` وشجرة العمل كانت نظيفة قبل إنشاء تقرير التحقق.
- شغلت بوابات pnpm المطلوبة فعليًا: typecheck وmanifest وroute-manifest وتطابق migrations والهجرات وfull tests وproduction build وE2E acceptance؛ كلها exit 0.
- تحققت من 38/38 migration مضمّنة، ومن restore drill مؤقت يشمل schema v38 و`integrity_check` و`foreign_key_check` وسلاسلي تدقيق وbackup/verify/restore/restart.
- تحققت من acceptance المعزول (28 suites + مرحلتا restart-persistence) ومن axe: 12 صفحة pilot، Critical=0 وSerious=0.
- تحققت من WI: صفحة 1 فقط (33 صفًا source-exact)؛ التطبيق يمنع اختراع الصفحتين 2/3 و3/3.
- سجلت فشل hygiene مستقل: ملفا `apps/qc-task-manager/qc_tasks.db` و`qc_tasks 3.db` متتبّعان رغم أنهما صفريان بلا tables؛ لذلك التصنيف النهائي CONDITIONAL GO وليس GO.

### الملفات المتأثرة
- `apps/qc-task-manager/docs/FINAL-PILOT-READINESS.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `pnpm typecheck` ✅ — 0 errors / 0 warnings / 26 hints.
- `pnpm test:manifest` ✅ — 60 canonical suites و28 E2E.
- `pnpm test:route-manifest` ✅ — 114 routes، 25 middleware، 6 guards.
- `pnpm test:embedded-migration-parity` ✅ — 38/38.
- `pnpm test:migrations` و`pnpm test` و`pnpm build` و`pnpm e2e:acceptance` ✅.
- `pnpm test:production-operations` و`pnpm test:deployment-contract` و`pnpm test:db-doctor` و`pnpm test:lab-documents` ✅.
- `node scripts/verify-security-hygiene.mjs` ⚠️ exit 1 — فقط ملفا SQLite المتتبّعان المذكوران.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** التطبيق اجتاز كل بوابات التشغيل المطلوبة محليًا لكن GO محجوب حتى إزالة artifacts الـSQLite المتتبعة، تنفيذ restore/live deployment الحقيقي، وتوفير نتائج UAT بشري فعلية.

### ملاحظات / مشاكل مفتوحة
- **RUNTIME USER UAT REQUIRED** — لا توجد نتيجة UAT بشرية مُدعاة.
- WI register لا يكتمل حتى توريد controlled pages 2/3 و3/3.
- ما صار commit أو push أو deploy.

## [2026-08-28] — QC-WI-CATALOG-COMPLETION-020: تدقيق كتالوج WI مع حجب الصفحات غير المورّدة

### تم التنفيذ
- أبقيت كتالوج الصفحة 1/3 كما هو: 33 هوية فقط، مع تثبيت بصمة SHA-256 لاكتشاف أي تغيير في الكود أو العنوان أو الإملاء أو المراجعة أو التاريخ أو مصدر الصف.
- أضفت `source_page` و`source_row_no` لكل سجل كتالوج صراحةً؛ جميع الصفوف الحالية page 1 والصفوف 1..33.
- أضفت تحققًا قبل الاستيراد يمنع code/title الفارغين، تكرار الكود أو موقع المصدر، رقم صف غير صالح، revision/date غير صالحين، وأي source page غير مورّدة؛ حاليًا الصفحة الوحيدة المعروفة هي 1.
- جعلت تصادم الكود report-only وغير مدمّر: لا يغيّر العنوان أو provenance أو المحتوى أو `lab_document_versions` أو status، بينما يبقى الاستيراد idempotent وcode-based.
- أبقيت السجلات catalog-only بلا محتوى أو versions وبحالة Missing Content في الواجهة، وأضافت readiness TODO: `WI register incomplete until controlled source pages 2/3 and 3/3 are supplied.`
- راجعت migrations 029 و033 و`lab_documents`/`lab_document_versions` وواجهات WI؛ الحقول اللازمة موجودة، وما أضفت migration أو أي صفوف placeholder/مخمّنة.

### الملفات المتأثرة
- `apps/qc-task-manager/src/lib/lab/wiCatalog.ts`
- `apps/qc-task-manager/scripts/test-lab-documents.mjs`

### التحقق
- `test:lab-documents` ✅ — 303 passed / 0 failed، يشمل page-1 fingerprint، منع pages 2/3، والتصادم مع مستند مؤلف فعليًا.
- `test:migrations` ✅
- `test:manifest` ✅ — 60 canonical suites و28 E2E suites.
- `astro check` ✅ — 0 errors / 0 warnings؛ 26 hints قديمة.
- `NODE_ENV=production astro build` ✅ — Complete؛ تحذيرات Vite المعروفة بقيت.
- `git diff --check` ✅.

### النتيجة
- **الحالة:** نجح
- **مختصر:** المصدر المتاح فقط محفوظ حرفيًا ويمتنع التطبيق عن اختراع الصفحتين 2/3؛ وصولهما لاحقًا يتطلب إضافة صفوفهما المصدرية الدقيقة فقط.

### ملاحظات / مشاكل مفتوحة
- WI register ما زال غير مكتمل حتى يتم توريد controlled source pages 2/3 و3/3.
- ما صار commit أو push أو deploy.

## [2026-08-28] — QC-VISUAL-RESPONSIVE-017: فحوص Playwright للاستجابة وسهولة الاستخدام

### تم التنفيذ
- أضفت جناح Playwright خفيفًا يفحص 18 شاشة عبر 4 مقاسات (1440، 1024، 768، 360) = 648 حالة، بدون SaaS أو baselines بصرية كبيرة.
- أضفت fixtures حتمية ومعزولة للمهام والاختبارات والعينات والمنتجات والمعدات والوثائق، مع تنظيف idempotent بعد التشغيل.
- أضفت فحوص عدم تجاوز عرض الصفحة، وصول الإجراء الأساسي، قابلية استخدام التنقل، استراتيجية تمرير الجداول، احتواء الحوارات، وعدم قص رسائل الأخطاء.
- عطّلت الحركة غير الحتمية عبر `prefers-reduced-motion`، وجعلت لقطات الفشل فقط داخل `download/qa/responsive/` المهمل.
- أصلحت تسربات عرض فعلية في صفحة المختبر وسجل الاختبارات ومحرر الوثائق، مع الحفاظ على تمرير الجداول أفقيًا داخل حاوياتها.
- ربطت الجناح بالـ E2E registry والـ acceptance runner، وأضفت contract/manifest guard لضمان بقاء التسجيل.

### الملفات المتأثرة
- `apps/qc-task-manager/scripts/e2e-responsive.mjs`
- `apps/qc-task-manager/scripts/test-responsive-e2e-contract.mjs`
- `apps/qc-task-manager/{package.json,scripts/e2e-registry.mjs,scripts/test-manifest.mjs}`
- `apps/qc-task-manager/src/layouts/BaseLayout.astro`
- `apps/qc-task-manager/src/pages/lab/index.astro`
- `apps/qc-task-manager/src/pages/lab/tests/index.astro`
- `apps/qc-task-manager/src/components/lab/LabDocumentEditor.astro`

### التحقق
- `pnpm test` ✅ — 59/59 suite canonical.
- `pnpm typecheck` ✅ — 0 أخطاء، 26 hints قديمة.
- `astro build` ✅ — Complete؛ تحذيرات Vite المعروفة بقيت بدون تغيير.
- `test:responsive-e2e-contract` ✅ و`test:manifest` ✅ — 28 جناح E2E canonical.
- responsive Playwright ✅ — 648 passed، 0 failed.
- full acceptance جزئي ⚠️ — وصل للجناح الجديد ونجح، ثم توقف عند `e2e-lab-search` بنتيجة 18/21؛ الإخفاقات الثلاثة تخص عزل RBAC القائم، ولم تتأثر ملفات البحث بهذا التغيير.
- `git diff --check` ✅.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** فحوص الاستجابة الجديدة وإصلاحات العرض الفعلية ناجحة بالكامل، لكن بوابة القبول الكاملة ما زالت متوقفة على 3 إخفاقات baseline في `lab-search` خارج نطاق التغيير.

### ملاحظات / مشاكل مفتوحة
- يلزم حسم إخفاقات RBAC الثلاثة في `scripts/e2e-lab-search.mjs`/طبقة البحث في مهمة منفصلة قبل اعتبار full acceptance أخضر بالكامل.
- ما صار commit أو push أو deploy.

## [2026-08-28] — QC-OBSERVABILITY-016: قابلية تتبع آمنة وحالات أخطاء موحّدة لتجربة الشركة التجريبية

### تم التنفيذ
- أضفت توليد request/correlation ID آمنًا لكل طلب، مع قبول معرف وارد بصيغة آمنة أو استبداله بـ UUID، وإرجاعه في `X-Request-ID` وفي أخطاء 500.
- أضفت سجلًا خادميًا منظمًا كسطر JSON يحوي timestamp و`request_id` وmethod وroute والفاعل/الدور عند توفرهما وحالة HTTP والمدة وكود خطأ آمن، بدون تسجيل payload أو أسرار أو رسائل استثناء.
- أضفت أكواد أخطاء ثابتة `AUTH` و`FORBIDDEN` و`VALIDATION` و`NOT_FOUND` و`CONFLICT` و`STALE_CHANGE` و`DB` و`REPORT` و`UPLOAD` إلى استجابات API المشتركة.
- منعت مسارات مراجعة/سحب طلبات التغيير من تسريب نصوص الاستثناء أو تفاصيل SQLite، وأبقيت رسالة المستخدم عامة مع code آمن.
- أضفت `OperationalState.astro` كلغة موحدة لحالات عدم السجلات، عدم نتائج البحث، المنع، الخطأ، التعارض، السجل القديم، النجاح والتحذير، وكل حالة تقترح إجراءً تاليًا؛ وربطت به بحث المختبر.
- وسّعت FlashNotice لدعم حالة التحذير.

### الملفات المتأثرة
- `apps/qc-task-manager/src/lib/observability.ts`
- `apps/qc-task-manager/src/middleware.ts`
- `apps/qc-task-manager/src/lib/api-security.ts`
- `apps/qc-task-manager/src/components/OperationalState.astro`
- `apps/qc-task-manager/src/pages/api/lab/change-requests/[id]/{review,withdraw}.ts`
- `apps/qc-task-manager/src/pages/lab/search.astro`
- `apps/qc-task-manager/scripts/test-observability.mjs`
- `apps/qc-task-manager/{package.json,scripts/test-manifest.mjs,src/env.d.ts}`

### التحقق
- `test-observability` ✅ — request ID، sanitization، safe codes/messages، structured logs، وكل حالات UI.
- `test-manifest-guard` ✅ — 58 suite canonical.
- `test-request-security` ✅ — 56/56.
- `astro check` ✅ — 0 أخطاء، 0 warnings، 26 hints قديمة.
- `astro build` ✅ — Complete؛ بقيت تحذيرات Vite المعروفة الخاصة بالاستيرادات الديناميكية.
- `git diff --check` ✅.

### النتيجة
- **الحالة:** نجح
- **مختصر:** صار عند التطبيق request ID قابل للتتبع وسجلات تشغيلية آمنة، مع أكواد أخطاء مستقرة ورسائل لا تكشف SQLite أو الأسرار، وحالات UI موحدة قابلة للتصرف.

### ملاحظات / مشاكل مفتوحة
- التشغيل باستخدام `pnpm` تعذر في البيئة بسبب محاولة Corepack الكتابة إلى cache خارج مساحة المشروع؛ تم تشغيل الاختبارات والبناء مباشرة عبر Node و`node_modules/.bin/astro`.
- ما صار commit أو push أو deploy حسب الطلب.

## [2026-08-28] — QC-REPORT-PRINT-UX-015: تحسين معاينة التقارير وجودة الطباعة المضبوطة

### تم التنفيذ
- أضفت معاينة قبل تنزيل التقارير تعرض نوع التقرير، نطاق البيانات المحلولة، الفترة الزمنية، الفلاتر، عدد الصفوف إذا كان حسابه منخفض التكلفة، وسياق المستخدم/الدور.
- وحّدت مسار التفويض بين المعاينة وتوليد التقرير الفعلي، مع إيقاف حساب الصفوف قبل كشف أي نتيجة لمستخدم غير مصرح له.
- أبقيت تنزيلات CSV وXLSX وPDF على أزرار الواجهة المشتركة، بدون إضافة إطار PDF جديد.
- حسّنت `PrintLayout` لطباعة A4 بالاتجاه المناسب، تكرار رؤوس الجداول، منع قص الصفوف الحرجة، وإخفاء التنقل وأزرار الإجراءات في print media.
- أضفت metadata للطباعة تشمل نوع/معرّف السجل، التفويض، التوقيع أو التوقيع الإلكتروني، المصدر/المرجع، سياق المشاهد، وQR حيث ينطبق.
- غطّيت صفحات الطباعة للمختبر، المعدات، الصيانة، المعايرة، والمستندات المضبوطة، مع اختبار Playwright فعلي لـ `emulateMedia('print')` وPDF A4.

### الملفات المتأثرة
- `apps/qc-task-manager/src/lib/reporting/preview.ts`
- `apps/qc-task-manager/src/pages/reports.astro`
- `apps/qc-task-manager/src/pages/lab/reports.astro`
- `apps/qc-task-manager/src/layouts/PrintLayout.astro`
- `apps/qc-task-manager/src/pages/lab/{calibration,equipment,maintenance,documents}/[id]/print.astro`
- `apps/qc-task-manager/scripts/{test-report-preview,test-lab-print,e2e-lab-tests,test-manifest}.mjs`

### التحقق
- `pnpm run test:report-preview` ✅
- `pnpm run test:dashboard-reports` ✅
- `pnpm run test:lab-reports` ✅ — 196 ناجحة / 0 فاشلة
- `pnpm run test:lab-print` ✅ — 68 ناجحة / 0 فاشلة
- `pnpm typecheck` ✅ — 0 أخطاء، 0 تحذيرات، مع 26 hint غير حاجب
- `NODE_ENV=production pnpm build` ✅
- `pnpm test` ✅ — 57 مجموعة canonical بدون فشل
- `pnpm e2e:acceptance` ✅ — 29/29 suite، و2399+ assertion بدون فشل
- `git diff --check` ✅

### النتيجة
- **الحالة:** نجح
- **مختصر:** صارت معاينة التقارير مرتبطة بالتفويض الفعلي، وصارت مخرجات الطباعة المضبوطة A4-friendly مع metadata وQR واختبارات regression وPlaywright print media.

### ملاحظات / مشاكل مفتوحة
- بقيت تحذيرات البناء المعروفة ورسائل Vite الخاصة بالـ dynamic/static imports، إضافة إلى 26 hint غير حاجب؛ ما فيه أخطاء فاشلة.
- ما صار commit أو push أو deploy حسب الطلب.

## [2026-08-28] — QC-FORM-USABILITY-013: تحسين إنتاجية النماذج التشغيلية واختبارات المختبر

### تم التنفيذ
- أضفت progressive enhancement مشتركًا للنماذج المعلّمة بـ `data-qc-form`: مؤشرات الأخطاء، ملخص التحقق، تركيز أول حقل غير صالح، حماية فقدان التعديلات، حالة الحفظ، ومنع الإرسال المزدوج.
- طبّقت الحارس المشترك على نماذج المعدات والمنتجات والمعايرة والقوالب ومحرر المستندات والمهام، مع شريط إجراءات sticky ومؤشرات required الموجودة/المضافة.
- حسّنت `LabTestForm` بمساعدات Duplicate previous row وFill down وClear row وPaste spreadsheet rows وUndo last paste، بدون إضافة معايير علمية أو منطق PASS/FAIL جديد.
- حافظت على الحقول المتوافقة مع الورق، المخطط الحالي، والبيانات legacy؛ وواصلت رسائل النجاح الموجودة عبر `FlashNotice` مع حالة `Saving…` أثناء الإرسال.
- أضفت اختبارات keyboard وpaste وdata-loss واختبار E2E لـ 12 عينة، وسجلتها ضمن manifest والاختبارات الكاملة.

### الملفات المتأثرة
- `apps/qc-task-manager/public/scripts/form-productivity.js`
- `apps/qc-task-manager/src/components/lab/LabTestForm.tsx`
- `apps/qc-task-manager/src/components/lab/{LabEquipmentForm,LabProductForm,LabCalibrationForm,LabTemplateForm,LabDocumentEditor}.astro`
- `apps/qc-task-manager/src/components/NewTaskForm.astro`
- `apps/qc-task-manager/src/layouts/BaseLayout.astro`
- `apps/qc-task-manager/scripts/{test-form-productivity.mjs,e2e-lab-form.mjs,test-manifest.mjs}`
- `apps/qc-task-manager/package.json`

### التحقق
- `node scripts/test-form-productivity.mjs` ✅ — 17 ناجحة / 0 فاشلة
- `pnpm run test:lab-form` ✅ — 72 ناجحة / 0 فاشلة
- `pnpm typecheck` ✅ — 0 أخطاء، 0 تحذيرات، مع 26 hint غير حاجب
- `NODE_ENV=production pnpm build` ✅
- `pnpm test` ✅ — 56 مجموعة canonical، بدون فشل
- `pnpm e2e:acceptance` ✅ — 29/29 مجموعة ناجحة؛ `lab-form` فيها 141 ناجحة / 0 فاشلة
- `git diff --check` ✅

### النتيجة
- **الحالة:** نجح
- **مختصر:** صارت النماذج التشغيلية أوضح وأأمن من ناحية الحفظ والإرسال، وصارت شبكة عينات المختبر تدعم عمليات الدفعات المتكررة مع اختبارات تغطي الاستخدام الفعلي.

### ملاحظات / مشاكل مفتوحة
- بقيت تحذيرات البناء/الـ typecheck الموجودة سابقًا (dynamic/static imports، hints غير مستخدمة، وتنبيه Astro للسكريبت الخارجي) بدون أخطاء حاجبة.
- لم يُنفّذ commit أو push أو deploy حسب الطلب.

## [2026-08-28] — URLS-FILE-001: إنشاء ملف `urls.txt` يدويًا بكل روابط الموقع (262 رابطًا — روابط فقط بدون أي كلمات)

### تم التنفيذ
- أنشأت ملف `urls.txt` في جذر المستودع بطلب صريح من المستخدم: سطر واحد لكل رابط، بدون عناوين أو تعليقات أو كلمات.
- جمعت الروابط من مصدر الحقيقة `sitemap.xml` الجذري (آخر حالة معتمدة: 262/262 بعد ترتيب SITEMAP-ORDER-002) وكتبتها يدويًا عبر محرر الملفات على 3 دفعات — بدون أي سكربت توليد داخل المشروع.
- الملف يغطي كل الصفحات القابلة للفهرسة: الرئيسية، answer (18)، assessment، authors (5)، blog + تصنيفاته، calculator، الشركة والثقة (about/contact/customers/trust/partners...)، القانونية، docs (44)، EN (7)، events (4)، hub (9)، kernel (20)، lp (5)، solutions + مدنها، tools، والصفحات الخدمية (sitemap/referral/sales-deck/newsletter).
- النطاق هو الجديد `https://brightai.live` بعد ترحيل BAI-DOMAIN-MIGRATION-001 — لا يوجد أي رابط بـ `brightai.site`.

### الملفات المتأثرة
- `urls.txt` (جديد — جذر المستودع)
- `.agents/mind/01-mind-latest.md` (هذا السجل)

### التحقق
- عدد الأسطر: **262** = 262 رابط sitemap ✅
- تطابق مجموعة الروابط (sort + diff) مع sitemap: **IDENTICAL** ✅
- كل سطر يبدأ بـ `https://brightai.live/`: **0 استثناءات** ✅
- صفر أسطر فاضية بعد التنظيف ✅
- build/tests: لم تُشغَّل — الملف نصي مرجعي خارج البناء ولا يمس أي كود

### النتيجة
- **الحالة:** نجح
- **مختصر:** `urls.txt` جاهز بكل الـ 262 رابطًا الفعلية للموقع (روابط فقط، سطر لكل رابط)، مطابق تمامًا لمجموعة روابط `sitemap.xml` على النطاق الجديد brightai.live.

### ملاحظات / مشاكل مفتوحة
- الملف ثابت (snapshot يدوي): أي صفحة جديدة مستقبلًا تتطلب تحديثه يدويًا أو إعادة استخراجها من sitemap بعد التوليد.
- الملف في جذر المستودع وليس في `public/` — لا يُنشر على الموقع (إن كان المطلوب نشره كصفحة روابط، يُنقل لـ `public/` بقرار موثق).

---

## [2026-08-28] — SITEMAP-ORDER-002-MANUAL: ترتيب يدوي لـ sitemap.xml الجذري حسب أهمية الصفحات — بدون سكربت وبدون بناء — 262/262 رابطًا

### تم التنفيذ
- أُعيد ترتيب بلوكات `sitemap.xml` في جذر المستودع **يدويًا** (تعديل مباشر للملف — بدون تشغيل `sitemap:generate` ولا `build`) بطلب صريح من المستخدم، حسب أهمية الأعمال: الرئيسية → التجارية الأساسية (`/solutions/` `/pricing/` `/demo/` `/contact/`) → صفحات الحلول → التقييم → منصة kernel → محاور hub → الشركة والثقة (about/services/customers/trust/partners) → docs → مقالات blog → تصنيفات blog → answer → أدوات/lp/events/newsletter → authors → EN → القانونية → الخدمية (sitemap/sales-deck/referral) — وأبجدي داخل كل طبقة.
- كل بلوك `<url>` انتقل بكامل محتواه حرفيًا (loc + hreflang + lastmod) — إعادة ترتيب فقط، حارس برمجي داخل عملية التحويل يفشل على أي تغيير في مجموعة الروابط أو بايتات البلوكات.
- `public/sitemap.xml` لم يُلمس (الطلب كان لملف الجذر فقط) — ما زال بترتيب أبجدي.
- تعديل `scripts/generate-sitemap-all-pages.mjs` غير الملتزم (SITEMAP-ORDER-002 بمنطق طبقات مشابه — من جلسة سابقة) بقي كما هو **ولم يُشغَّل**؛ أي `sitemap:generate`/`build` مستقبلي سيعيد توليد الملف بترتيب السكربت (مشابه لكن غير مطابق: يضع `/en/` بالطبقة 0 وصفحات kernel الفرعية بالأسفل) ويكتب root وpublic معًا.
- نسخة احتياطية قبل التعديل: `/tmp/sitemap-before-backup.xml`.

### الملفات المتأثرة
- `sitemap.xml` (جذر المستودع)
- `.agents/mind/01-mind-latest.md` (هذا السجل)

### التحقق
- عدد الروابط: **262 قبل = 262 بعد** ✅
- تطابق مجموعة الروابط (sort + diff) قبل/بعد: **IDENTICAL** — لا إضافة ولا حذف ✅
- `xmllint --noout sitemap.xml`: **VALID** ✅
- أسطر hreflang/lastmod: **783 قبل = 783 بعد** ✅
- بنية الملف (رأس urlset وذيله وسطور البلوكات) سليمة ✅
- `git diff --stat`: 861 إضافة / 861 حذف = إعادة ترتيب نقي ✅
- build/tests: لم تُشغَّل — تعديل ترتيب XML يدوي فقط لا يمس أي كود

### النتيجة
- **الحالة:** نجح
- **مختصر:** `sitemap.xml` الجذري صار مرتبًا بالصفحات الأهم أولًا (262 رابطًا كاملة ومحتوى البلوكات حرفيًا كما هو) بتعديل يدوي مباشر بدون مولّد وبدون بناء.

### ملاحظات / مشاكل مفتوحة
- لو شُغّل `sitemap:generate` أو `build` لاحقًا، الملف ينعاد توليده بترتيب المولّد (شجرة العمل تحمل SITEMAP-ORDER-002 غير الملتزم) — مطلوب قرار: الالتزام بمنطق السكربت أو مواءمته مع الترتيب اليدوي قبل أي توليد قادم.
- ترتيب الإدخالات داخل sitemap لا يغيّر أولوية الزحف الفعلية لدى Google (priority/changefreq مهملة) — الأثر تنظيمي/بشري بالأساس، والملف يظل صالحًا 100%.

---
## [2026-08-28] — BAI-DOMAIN-MIGRATION-001: إعادة تحقق إنتاجي ومحلي بعد ترحيل brightai.site → brightai.live

### تم التنفيذ
- راجعت حالة Git ومصادر الحقيقة الفعلية: الشجرة نظيفة، و`src/data/site.ts` و`astro.config.mjs` يثبتان `https://brightai.live` كنطاق أساسي.
- تحققت من مخرجات `dist/client`: صفر إشارات للنطاق القديم خارج قواعد التحويل المقصودة؛ وsitemap/canonical/OpenGraph/JSON-LD خالية من `brightai.site` و`brightaii.com`.
- ثُبّت أن البقايا غير المولدة تنحصر في قواعد تحويل 301، وثائق/تقارير تاريخية، و3 workflows محجوبة عن التعديل بلا إذن؛ ولا توجد بقايا production فعّالة.
- لم تُعدّل ملفات تنفيذ الترحيل في هذه الجولة، ولم يحدث commit أو push أو deploy.

### الملفات المتأثرة
- `.agents/mind/01-mind-latest.md`

### التحقق
- `npm run build` ✅
- `pnpm typecheck` ✅ (0 أخطاء؛ تحذيرات قائمة مسبقًا في QC)
- `pnpm test` ✅ (83/83)
- `npm run seo:all` ✅ (بعد اكتمال البناء؛ محاولة متوازية سابقة قرأت `dist` قبل إنشاء `404.html`)
- `npm run seo:hreflang` ✅ (263 مجموعة / 0 أخطاء)
- `npm run headers:check` ✅ · `npm run redirects:check` ✅
- `npm run verify:crawler-access` ✅ (17 زاحفًا + sitemap = 200 على `https://brightai.live`)

### النتيجة
- **الحالة:** نجح
- **مختصر:** ترحيل الدومين الموجود في HEAD يمر جميع بوابات البناء وSEO والتحويلات والفحص الحي للزواحف، وبلا مراجع قديمة فعّالة في artifact الإنتاجي.

### ملاحظات / مشاكل مفتوحة
- **تحقق حي:** `https://www.brightai.live/domain-migration-probe?keep=1` → 301 مباشر إلى النسخة non-www مع حفظ المسار والـ query. أما `brightai.site` و`www.brightai.site` فيفشلان قبل HTTP بـ TLS handshake من شبكة التحقق؛ لذلك تحويل النطاق القديم **غير متحقق/غير مكتمل خارجيًا** حتى يُصلح DNS/TLS/Cloudflare.
- المطلوب خارجيًا: تفعيل TLS و301 على `brightai.site` و`www.brightai.site` إلى `https://brightai.live/:splat`، ثم Change of Address في GSC وBing.

---
## [2026-08-28] — GA4-LITERAL-SNIPPET-002: استبدال محمّل gtag.js المؤجل بمقتطف Google الحرفي G-9LMB4PGTWJ على كل صفحات الزوار — بدون commit/push/deploy

### تم التنفيذ
- استبدال الـ loader القديم (`/js/gtag-init.js` deferred + Consent Mode v2) بمقتطف gtag.js **الحرفي** من Google (`async googletagmanager.com/gtag/js?id=G-9LMB4PGTWJ` + inline `js`/`config`) في 4 مواضع: `BaseLayout.astro` (كل الموقع بما فيه صفحات kernel عبر KernelLayout)، `answer/[slug].astro`، `lp/[slug].astro`، و`public/500.html` — الكود byte-exact بـ `is:inline` (CSP Report-Only مسموح فيه `unsafe-inline` + `googletagmanager.com` فلا كسر).
- **لكل الزيارات بلا قيود**: لا consent gating (الكود الحرفي بلا `consent default`)، لا تأخير requestIdleCallback، لا retry — أول تحميل يبعث page_view فورًا. (الرفض بالبانر كان أصلًا تجميليًا بقرار مالك موثق BAI-ANALYTICS-2026-08-03-B داخل analytics.js — لم يُلمس).
- **تكملة الوظيفة الموحدة**: `analytics.js` صار يسجّل gtag provider داخليًا (كان يسجله gtag-init.js) حتى تكمل أحداث `track()` المخصصة وpage_view للتنقل الناعم (ClientRouter) توصل GA4، مع **كتم أول page_view** قادم من الـ runtime لأن `gtag('config')` الحرفي يبعثه تلقائيًا — يمنع الازدواج.
- تحديث المعرف في كل الأماكن: `site.ts` googleTagId، fallback `GA4_MEASUREMENT_SECRET` في `ga4-server.ts:114` (أحداث server-side تروح لنفس الـ property الجديد)، تعليقات `SEOHead.astro` و`public/_headers`، وسكربت التحقق `playwright-verify-ga4-detection-deep.mjs`. صفر إشارات للـ ID القديم `G-8LLESL207Q` في src/public/scripts.
- `gtag-init.js` صار يتيمًا (لا يُحمّل من أي مكان) — عُلّم DEPRECATED برأسه وبقي على القرص، حذفه قرار مستخدم.

### الملفات المتأثرة
- `src/data/site.ts`, `src/layouts/BaseLayout.astro`, `src/pages/answer/[slug].astro`, `src/pages/lp/[slug].astro`, `public/500.html`, `public/js/analytics.js`, `public/js/gtag-init.js` (علامة deprecated فقط), `src/lib/ga4-server.ts`, `src/components/SEOHead.astro`, `public/_headers`, `scripts/playwright-verify-ga4-detection-deep.mjs`

### الأرقام
- **272/279** صفحة HTML مبنية تحمل المقتطف الحرفي = **100% من صفحات الزوار**؛ الـ 7 المستثناة مشروعة: 6 صفحات `/solutions/cities/*` هي 301 نقي بلا HTML (`Astro.redirect` فقط) + `kernel/admin/quota` شاشة إدارة noindex بقرار معماري موثق برأس الملف ("No analytics — internal operator screen").
- صفر بقايا `gtag-init`/`G-8LLESL207Q` في HTML المبني.

### التحقق
- `npm run build` ✅ Complete · `pnpm typecheck` ✅ 0 errors / 0 warnings / 24 hints
- `npm run headers:check` ✅ بلا drift (بعد تحديث تعليق `_headers`)
- فحص HTML المبني ✅: الرئيسية/answer/lp/500/kernel تحمل `<script async src=...G-9LMB4PGTWJ>` قبل inline config بالترتيب الصحيح

### النتيجة
- **الحالة:** نجح
- **مختصر:** مقتطف gtag.js الحرفي بالمعرف G-9LMB4PGTWJ يعمل على كل صفحات الزوار بلا consent ولا تأخير، وأحداث الـ unified analytics تكمل توصل GA4 عبر provider مدمج — والبناء والفحوص خضراء.

### ملاحظات / مشاكل مفتوحة
- **على المستخدم (خارج المستودع):** (1) متغير البيئة `GA4_MEASUREMENT_SECRET` في Render لو مضبوط بالقديم لازم يتحدث لـ `G-9LMB4PGTWJ` (الـ fallback بالكود صار الجديد، فالمشكلة تظهر فقط لو الـ env مثبت بالقديم). (2) حذف `public/js/gtag-init.js` اليتيم اختياري. (3) الـ GA4 API Secret (Measurement Protocol) يبقى مرتبطًا بالـ property الجديد — لو الـ secret من property القديم، أحداث server-side (leads) راح تُرفض.
- القسم 1 يتجاوز حده الموثق مسبقًا — الأرشفة للقسم 2 تؤجل كقرار متكرر (نمط الجلسات الأخيرة).

## [2026-08-28] — BAI-DOMAIN-MIGRATION-001: ترحيل النطاق الإنتاجي بالكامل brightai.site → brightai.live (محليًا فقط — بدون commit/push)

### تم التنفيذ
- **جرد شامل** قبل أي تعديل: 382 ملفًا يحتوي `brightai.site|brightaii.com` (باستثناء node_modules/.git/dist/.astro/.lighthouseci/.pnpm-store/.vercel/pnpm-lock). صُنّفت إلى **319 ملفًا للترحيل** + مجموعة محفوظة كأدلة تاريخية (§21). تصحيح افتراضين من الجرد الأولي: `render.yaml` **ما فيه** نطاق قديم أصلًا (يُعاد توليده من مولّد التحويلات ومزامنة الهيدرز)، و`brightaii.com` موجود **مرة واحدة فقط** في المستودع (مثال CORS مُعلَّق داخل `public/_headers`).
- **مصدر الحقيقة الواحد**: `src/data/site.ts` → `url: 'https://brightai.live'`، و`astro.config.mjs:175` → `site: 'https://brightai.live'` (ومنها canonical/sitemap/OG/RSS/hreflang كلها تلقائيًا) + 10 روابط prerender للـ kernel. ما أُنشئ أي متغير مكرر.
- **استبدال مُدار** (مو blind) على الـ 319 ملفًا: `src/data/schema-helpers.ts`، `public/{robots.txt,ai.txt,llms.txt,llms-full.txt,humans.txt,500.html,js/*}`، `.well-known/{agent.json,ai-plugin.json,openapi.yaml,security.txt}`، `public/CNAME` (أُعيدت كتابته `brightai.live` — كان فيه مسافة زائدة)، `schema-saudi-seo.json` (public + src)، ~40 سكربت في `scripts/`، `apps/dashboard/{middleware.ts,next.config.mjs,app/**,lib/tenant.ts,lib/billing/stripe.ts,.env.example,README.md,tests/api/middleware-auth.test.ts}`، `packages/config/src/env.ts`، `packages/db/{schema.prisma,seed.ts,src/client.ts}`، `~60 src/pages/**`، `~26 src/data/migrated-pages/*.json`، `~100 src/content/blog/*.md`، `~45 src/content/docs/*.md`، `AGENTS.md`/`CLAUDE.md`/`docs/*`.
- **CORS/Origin بلا توسيع**: `src/pages/api/ai/chat.ts` → `ALLOWED_ORIGINS = ['https://brightai.live','https://www.brightai.live','http://localhost:4321','http://127.0.0.1:4321']` (أصول التطوير ما تغيّرت، ولا wildcard). `apps/dashboard/middleware.ts:31` → `ROOT_DOMAIN ?? 'brightai.live'` (فرع `.localhost` كما هو). `packages/config/src/env.ts` → افتراضات `ROOT_DOMAIN`/`NEXT_PUBLIC_ROOT_DOMAIN` + `SENDGRID_FROM_EMAIL=noreply@brightai.live`.
- **CSP بلا إضعاف**: التعديل الوحيد في `public/_headers` هو مثال CORS **مُعلَّق** (`# Access-Control-Allow-Origin: https://brightai.live`) — وهو الموضع الوحيد لـ `brightaii.com` في المستودع. `headers:check` بلا drift قبل وبعد.
- **تحويلات 301 داخل المستودع**: عُدّل `scripts/generate-all-redirects.mjs` ليولّد 7 قواعد مضيف مطلقة — تطبيع الكنسي (http→https، www→non-www على brightai.live) + ترحيل النطاق القديم بأربع صيغ (`http/https × root/www` على brightai.site) **كلها تشير مباشرة للكنسي = قفزة واحدة بلا سلاسل**، مع `:splat` لحفظ المسار. أُعيد التوليد: `public/_redirects` (7 قواعد بالأعلى + 209 قاعدة)، `render.yaml` (250 قاعدة)، `astro.config.mjs` (200 redirect، 9 مُستبعدة لتعارض صفحات ثابتة).
- **إعادة توليد المولَّدات بدل تعديلها يدويًا**: sitemaps عبر `npm run build`، fixture الاختبار عبر `scripts/__fixtures__/build-output/build-fixture.mjs` (190 HTML / 166 loc / 23 بديل en-SA)، الهيدرز عبر `sync-headers-from-csp.mjs`.
- **بوابات كانت تثبّت النطاق القديم بصيغة regex مهروبة** (ما التقطها grep العادي) — عُدّلت لتثبت النطاق الجديد بعد أن صارت الـ implementation صحيحة: `seo-schema-audit.mjs:85` (BreadcrumbList absolute items — هو سبب فشل `seo:all`)، `verify-all.mjs:217`، `legacy-seo-surface-audit.mjs:132`، `legacy-paths-audit.mjs:39`، `link-graph-validator.mjs:93`، `strategic-ai-answer-content.test.mjs:42`، `trigger-indexnow.test.mjs:117`.
- **ما اتعدّل**: `.github/workflows/{ci-build-guard,reports-gate,weekly-gsc}.yml` (يحتاج إذن صريح — القاعدة 14)، `apps/dashboard/.env.local` (ممنوع لمس `.env*`)، وكل الأدلة التاريخية.

### الملفات المتأثرة
- `git diff --stat` = **329 ملفًا، +3279/−3448**
- الأهم: `src/data/site.ts`، `astro.config.mjs`، `src/data/schema-helpers.ts`، `public/{CNAME,robots.txt,ai.txt,llms.txt,llms-full.txt,_headers,_redirects,sitemap.xml,sitemap-images.xml}`، `.well-known/*`، `render.yaml`، `scripts/generate-all-redirects.mjs`، `src/pages/api/ai/chat.ts`، `apps/dashboard/middleware.ts`، `packages/config/src/env.ts`، `packages/db/prisma/schema.prisma`

### الأرقام
- `brightai.live` في المجموعة المُرحّلة: **1561** موضعًا · نطاق قديم في نفس المجموعة: **0**
- sitemap: `public/sitemap.xml` = `dist/client/sitemap.xml` = **262 `<loc>`**، 0 نطاق قديم · `sitemap-images.xml` 0
- `dist/` بعد البناء: النطاق القديم في **ملف واحد فقط** = `dist/client/_redirects` (قواعد 301 المقصودة)
- بقايا في الشجرة (متتبعة): **60 ملفًا** — كلها أدلة تاريخية أو قواعد تحويل أو workflows موقوفة على إذن

### التحقق
- `pnpm typecheck` ✅ 0 أخطاء (24 hints)
- `npm run build` ✅ · `npm run headers:check` ✅ بلا drift
- `npm run seo:all` ✅ (كان **exit 1** قبل إصلاح `seo-schema-audit.mjs` — ~17 صفحة "Missing BreadcrumbList schema with valid absolute items")
- `npm run seo:hreflang` ✅ 263 مجموعة / 0 أخطاء · `npm run redirects:check` ✅ 209 قاعدة، صفر سلاسل/دوائر/مكررات
- `npm run verify:crawler-access` ✅ 17 زاحفًا + sitemap 200 (host: brightai.live، محليًا)
- `pnpm test` ✅ 83/83 (chat-session 16، csrf 29، pii 38) · `node --test scripts/trigger-indexnow.test.mjs` ✅ 9/9 · `strategic-ai-answer-content.test.mjs` ✅ 3/3
- `npm run verify:all` ⚠️ exit 1 — الفشل من `lint:tokens` (227 مخالفة raw hex)، **موجود قبل الترحيل** (نفس الأسطر في HEAD، وأحد الملفين ما اتعدّل أصلًا). الأجزاء الأخرى: verify 5/5 ✅ + headers:check ✅ + test:chat-session 16/16 ✅
- `node --test scripts/entity-consistency.test.mjs` ⚠️ فشل واحد — يطالب `public/{ai,llms,llms-full}.txt` بروابط `x.com/brightai_sa`/LinkedIn؛ `ai.txt` في HEAD أصلًا فيه **0** إشارة لـ x.com ⇒ **فشل سابق للترحيل**
- `apps/dashboard: pnpm test` ⚠️ 12 فشلًا / 193 نجاحًا — كلها في `tests/firewall/audit-durability.test.ts` (تسمية أكواد Prisma) و`tests/api/chat-streaming.test.ts` (نوع محتوى 429)، **صفر علاقة بالنطاق** وملفاتها ما اتعدّلت؛ `tests/api/middleware-auth.test.ts` (المعدّل) ناجح
- فحص §25 على `dist/client` (الرئيسية، about، blog، en/، en/privacy-policy، solutions/ai-firewall): canonical + hreflang (ar-SA/en-SA/x-default) + `og:url` + `og:image` المطلق + `twitter:url` + `@id` في JSON-LD **كلها brightai.live** بلا خلط نطاقات

### النتيجة
- **الحالة:** نجح داخل حدود المستودع
- **مختصر:** brightai.live صار النطاق الكنسي الوحيد في كل ما يخدمه المستودع (canonical/hreflang/sitemap/robots/schema/OG/CORS/دashboard/سكربتات Cloudflare وRender)، وقواعد 301 من النطاق القديم مكتوبة بقفزة واحدة. تفعيل التحويل فعليًا يتطلب تحكّم بالنطاق القديم في Cloudflare/Render — **غير مُنفَّذ ولا يُدّعى تنفيذه**. ما صار commit ولا push ولا merge.

### ملاحظات / مشاكل مفتوحة
- **خطوات خارج Git (إلزامية لإكمال الترحيل):** Cloudflare: 301 لـ `brightai.site/*` (+www) → `https://brightai.live/:splat` وwww→non-www وHSTS وpurge cache وAI Crawl Control OFF · Render: إضافة `brightai.live` كنطاق مخصص + TLS · GSC: property جديدة + **Change of Address** من `sc-domain:brightai.site` · Bing Webmaster: Site Move · SendGrid: توثيق نطاق `noreply@brightai.live`.
- **موقوف على إذن صريح:** `.github/workflows/ci-build-guard.yml` (سطور 63/65/659/671 host افتراضي)، `weekly-gsc.yml` (21/93/105 — `sc-domain:brightai.site`)، `reports-gate.yml:94` (نص رسالة).
- **يحتاج قرار المستخدم:** `apps/dashboard/.env.local` فيه `ROOT_DOMAIN="brightai.site"` (ممنوع أعدّل `.env*` — يحدّثه المستخدم)؛ **Prisma migration** لتغيير default العمود `cnameTarget` إلى `proxy.brightai.live` (الـ schema اتحدّث، وبوابة `verify-prisma-drift.mjs` ما تفحص defaults ⇒ ما انكسر شي، لكن DB-level default لسه القديم)؛ `sitemap.xml` بجذر المستودع نسخة قديمة مكررة ما يكتبها أي مولّد (المولّد يكتب `public/` و`dist/client/`) — مرشحة للحذف بعد موافقتك.
- **فشل سابق للترحيل (مو من هذه المهمة):** `lint:tokens` 227 مخالفة hex · `entity-consistency.test.mjs` يطالب روابط سوشيال مفقودة من `ai.txt` · 12 فشلًا في vitest الداشبورد (firewall/streaming).

---
## [2026-08-28] — QC-UI-CONSOLIDATION-011: توحيد وتنظيف بنية UI فوق نظام التصميم من 006 (بدون إعادة تصميم) — البوابات الثابتة خضراء، e2e:acceptance متبقٍ — بدون commit/push/deploy

### تم التنفيذ
- **Audit شامل** (وكيل استكشاف read-only) للأنماط المكررة في src/pages: Pagination كان الوحيد المؤسس 100%؛ PageHeader متبني بـ 6 صفحات فقط مقابل ~45 صفحة lab تدوي نفس الكتلة (h1 text-3xl + eyebrow مكرر بـ 44 ملف)؛ **Banner.astro مبنية بصفر استخدام** (24 كتلة خطأ متطابقة)؛ 13 فورم فلترة copy-paste؛ صفحتا إشعارات مكررتان بخرائط drift؛ 23 خريطة status→class منها 6 مكررة حرفيًا؛ LabActionButton شبه نسخة AppButton.
- **الإشعارات موحدة**: `src/components/ui/notificationPresentation.ts` جديد (KIND_ICON/KIND_LABEL/SEVERITY_CARD/SECTION_ORDER + groupNotificationsByKind/orderedNotificationKinds — مصدر واحد) + `src/components/NotificationCard.astro` جديد (كارت موحد مع sr-only severity + unread dot + MarkReadButton + splitMessageLinks) — أُعيدت كتابة /notifications و/lab/notifications عليهما وأنحلت drift نصوص KIND_LABEL (تُوحّد على نصوص الصفحة العامة، e.g. 'Lab tests under review' بدل 'Tests under review') وtimestamp slate-400→500.
- **تبنّي Banner**: codemod حوّل 23 كتلة بنر متطابقة (`rounded-lg border border-{red|amber|sky|emerald}-200...role="alert"`) إلى `<Banner tone="error|warning|info|success">` مع الحفاظ على النص وrole="alert" عند error؛ الشواذ المتبقية (KPI cards، login hint، أقسام emerald في tasks/[id]) تُركت عمدًا.
- **PageHeader على lab**: codemod حوّل 31 هيدر مطابقًا (eyebrow+title+description بسيطة+actions div → PageHeader مع fragment slot="actions")؛ 10 صفحات تفاصيل ببنية identity معقدة (وصف فيه markup/pills) بقيت identity blocks مقصودة (§4) مع **تقارب الحجم فقط**: كل h1 في src/pages/lab + 404 صارت text-2xl tracking-tight (نهاية متبقية 006 الموثقة)؛ 4 صفحات print مستثناة عمدًا؛ فروع 403/404 الشرطية داخل tasks/[id] وfindings/[id] استثنائية موثقة بالحارس.
- **الفلاتر**: `src/components/ui/formPresets.ts` جديد (FILTER_TOOLBAR/FILTER_FIELD/FILTER_CONTROL بنفس الكلاسات الحرفية — markup-neutral)؛ 13 ملفًا تبنّته (12 سجلًا + retests/new)؛ وصفة w-full في acknowledgements بقيت variant مقصود.
- **الأزرار**: LabActionButton صارت wrapper نقي على AppButton (صفر ستايل مملوك)؛ CTA الثلاثي المتطابق حرفيًا (manager/employee/supervisor "New task") → AppButton primary؛ زر "Apply filters" المتطابق بـ 9 سجلات → `<AppButton type="submit" variant="primary">` وReset → variant="secondary"؛ الشواذ الموثقة انحلت: lab/search bg-slate-900 submit → AppButton primary، lab/index actions loop + Quick New Test، change-requests/new زوج Submit/Cancel بلا focus، admin/templates legacy `focus:ring-2` → AppButton، search.astro زر صغير غير قياسي → md، lab/reports "Update filters"، documents/[id] "Add Content" بلا focus → LabActionButton. saved-views Delete الصغير (hover أحمر دلالي) بقى one-off مقصود.
- **خرائط الحالة**: `src/components/ui/labBadgeClasses.ts` جديد يضم CALIBRATION_STATUS_BADGE_CLS / DOCUMENT_STATUS_BADGE_CLS / ACKNOWLEDGEMENT_BADGE_CLS / DOCUMENT_TYPE_BADGE_CLS / TEMPLATE_STATUS_STYLES / TEST_WORKFLOW_TONE / TEST_RESULT_TONE — 12 صفحة استبدلت التصريحات المحلية باستيراد alias (نفس القيم الحرفية — صفر تغيير مظهر)؛ خرائط statusTones.ts وformat.ts (الاستثناء الموثق) لم تُلمس ف badge-contrast سليم.
- **جداول**: كل th `px-4 py-3` → `px-4 py-2.5` (change-requests، drilldown، admin/templates، lab/search) — وصفة رأس موحدة.
- **التنقل**: كل أهداف Navbar ROLE_NAV الـ 15 + /logout تحقق وجودها على القرص (صفر dead links)؛ mobileGroups = نفس primary+more بالضبط (mobile=desktop IA ✅ محقق من 006)؛ **تحسين active states في LabSecondaryNav**: أطول href مطابق يفوز (exact أو child path) → /lab/tests/[id] تفعّل "Tests"، /lab/tests/new تفعّل "New Test" فقط، وaria-current واحد دائمًا؛ لا قرارات permissions في UI (كلها lib/permissions + props — محقّق قراءةً).
- **الحارس توسّع**: test-ui-consistency من 37 → **162 فحصًا**: PageHeader على 31 صفحة lab، منع رجوع h1 text-3xl، منع رجوع وصفة البنر اليدوية، الإشعارات بالمصدر الموحد بلا خرائط محلية، formPresets على سجلات الفلاتر بلا وصفة حرفية، labBadgeClasses بلا إعادة تصريح، LabActionButton يفوض AppButton، th padding موحد، و**حارس dead links**: كل route في IMPLEMENTED_LAB_ROUTES لازم يكون له ملف صفحة فعلي (route.astro أو route/index.astro).
- **إصلاحات أثناء التحويل**: 118+ خطأ استيراد من حساب عمق خاطئ بالـ codemods — صححتها جميعًا (تحقق آلي أن كل import لحل ملف موجود)؛ أصلحت 4 بنى fragment كسرها codemod الهيدر (lab/index، tests/index، tests/[id]، change-requests/[id] — الأخير أُعيدت كتابة description كمتغير frontmatter) وimport { شارد في search.astro.

### الملفات المتأثرة
- جديد: `src/components/ui/{notificationPresentation,formPresets,labBadgeClasses}.ts`، `src/components/NotificationCard.astro`
- موسع: `scripts/test-ui-consistency.mjs` (162 فحصًا)، `src/components/lab/LabSecondaryNav.astro` (active longest-match)، `src/components/lab/LabActionButton.astro` (wrapper)
- مُحوّلة (59 ملفًا إجمالًا): 23 صفحة Banner، 31+4 صفحات PageHeader/h1، 13 فورم فلترة، 12 صفحة خرائط حالة، 14 صفحة أزرار/Apply/Reset، 4 جداول padding، 2 إشعارات، 404.astro

### التحقق
- `pnpm typecheck` ✅ 0 errors / 0 warnings / 24 hints (271 ملفًا)
- `pnpm test:ui-consistency` ✅ **162/162** (موسّع)
- `pnpm test:badge-contrast` ✅ · `pnpm test:lab-ux-presentation` ✅ 6/6 · `pnpm test:lab-ux-performance` ✅ 7/7
- `pnpm test:manifest` ✅ 54 canonical suites / 27 E2E · `pnpm test:route-manifest` ✅ 111 file routes / 25 middleware / 6 guards
- `pnpm test` ✅ **السلسلة الكاملة 54 سويت exit 0**
- `NODE_ENV=production pnpm build` ✅ Complete
- `pnpm e2e:acceptance` ⚠️ **انلغى قبل الاكتمال بأمر المستخدم — غير مُثبت هذه الجلسة** (يشمل a11y axe gate + navigation E2E) — لازم إعادة تشغيل كاملة قبل الاعتماد النهائي
- فحص a11y المنفصل يتطلب سيرفر+قاعدة (بيئة الـ runner) — مغطى داخل acceptance فقط

### النتيجة
- **الحالة:** جزئي — كل البوابات الثابتة والسلسلة الكاملة والبناء خضراء على شجرة العمل؛ e2e:acceptance (بما فيه a11y) متبقٍ إعادة تشغيل.
- **مختصر:** التوحيد المطلوب من 011 منفذ بالكامل: مصدر واحد للإشعارات/خرائط الحالة/الفلاتر/الأزرار/البنرات/الرؤوس، وحارس 162 فحصًا يمنع الانحدار — والبوابة الإقليمية الوحيدة المتبقية هي إعادة e2e:acceptance حتى النهاية.

### ملاحظات / مشاكل مفتوحة
- **متبقٍ مقصود (موثق بالنظام والـ guard):** صفحات التفاصيل ببنية identity (وصف فيه markup)؛ فروع 403/404 داخل tasks/[id] وfindings/[id]؛ صفحات print؛ وصفة w-full في acknowledgements؛ زر Delete الصغير في saved-views؛ بنرات KPI/dashboard؛ TSX error panels داخل React islands (rounded-md — 4 مواضع)؛ خرائط format.ts للمهام (الاستثناء الموثق §2).
- **متبقٍ من 006 الآن مغلق:** توحيد صفحتي الإشعارات ✅، تقارب H1 text-3xl → text-2xl ✅. (ترقية chips الموظف لروابط مفلترة بقت من 006 — تحتاج فلتر due للبحث، خارج نطاق 011.)
- **مطلوب للجلسة الجاية:** إعادة `pnpm e2e:acceptance` كاملة + تحديث `docs/UI-DESIGN-SYSTEM.md` بالكنسي النهائي (notificationPresentation/NotificationCard/formPresets/labBadgeClasses + LabActionButton=wrapper + قاعدة PageHeader للـ lab) — التوثيق لم يُحدّث بعد.
- القسم 1 يتجاوز حده الموثق مسبقًا — الأرشفة للقسم 2 تؤجل كقرار متكرر (نمط الجلسات الأخيرة).

## [2026-08-27] — QC-A11Y-GATE-010: الإتاحة صارت بوابة إقلاع حقيقية (axe gate) في تطبيق QC — بدون commit/push/deploy

### تم التنفيذ
- أُعيدت كتابة `scripts/e2e-a11y.mjs` من report-only إلى **بوابة فاشلة**: axe scan (wcag2a/2aa/21a/21aa/22aa) على 12 صفحة pilot — /login (زائر)، /employee (بجلسة employee)، /manager، /tasks/[id]، /lab، /lab/tests، /lab/tests/new?type=air، /lab/tests/[id]، /lab/documents، /lab/change-requests، /lab/search، /reports — **FAIL عند critical>0 أو serious>0**؛ moderate/minor تُبلَّغ بدون حجب. لم تُعطَّل أو تُعدَّل أي قاعدة axe.
- **الحفاظ الكامل** على سيناريوهات الكيبورد الأربعة القائمة (skip link، notification dropdown، completion wizard، cancel dialog) مع إضافات: التحقق من اسم الـ dialogs (aria-labelledby → heading حقيقي غير فارغ)، focus-visible ring للـ skip link وللـ navbar (Shift+Tab من #main للهيدر — Tab بعد القفز يروح للمحتوى)، وسيناريو تنقل الجوال 390×844 (toggle keyboard operable، aria-expanded يتبع الحالة، الروابط المجمعة شاملة Laboratory، Escape يغلق ويرجع focus للـ toggle).
- **فحوصات بنيوية فاشلة لكل صفحة**: H1 ظاهر واحد بالضبط، لا قفز بمستويات العناوين، status pills تحمل نصًا (غير معتمدة على اللون فقط — كل span.rounded-full ظاهر غير aria-hidden لازم له نص)، كل aria-describedby يحل لعنصر موجود، كل form control ظاهر له اسم متاح (label/aria-label/aria-labelledby).
- **إصلاح 73 عقدة color-contrast حقيقية** (السبب الجذري الوحيد للـ serious قبل البوابة، على 10 من الصفحات الـ12): text-slate-400→500/600 للنصوص المرئية على خلفيات فاتحة في المكونات المشتركة (LabSecondaryNav eyebrows، Pagination Prev/Next inert، Navbar timestamp + عناوين قائمة الجوال، TaskLifecycle، TaskUpdatePanel، CommentBox) والصفحات (employee/manager QC counters، tasks/[id] helpers+hashes، lab tests register disabled actions+Read-only pill+dash، login hint)؛ أزرار Complete/Confirm في TaskLifecycle: bg-emerald-600→700 + hover-800 (3.77:1→5.15:1)؛ text-emerald-600→700 للنصوص؛ إزالة opacity-80 من بطاقات KPI بلاب/index؛ **h3→h2 في AiReviewPanel** (كان يسبب قفز h1→h3 في سجل الاختبارات و7 صفحات ثانية تستخدم المكوّن)؛ aria-hidden لدائرة أيقونة النشاط في tasks/[id] (rounded-full بلا نص).
- **fixtures حتمية** بمعرفات ثابتة (A11Y gate fixture / NOTIF / LAB-TEST-A11Y-GATE-01 / PROD-A11Y-GATE-01 / EQ-A11Y-GATE-01) مع pre/post cleanup idempotent؛ تجاوز trigger «lab_test_samples rows are frozen after approval» بقلب حالة صف fixture الخاص بنا إلى DRAFT قبل حذفه فقط؛ warmup POST ذاتي قبل فتح قاعدة البيانات (نفس نمط الـ acceptance runner) فالعزل اليدوي يشتغل بدون خطوات خارجية.
- تقرير دائم `download/qa/a11y-qc-report.json` (gitignored): gate summary + policy + 12 صفحة بعدّاداتها وviolations مع WCAG tags + assertions بالفشلات مصنفة (keyboard/structure/gate) — **يُكتب حتى عند فشل البوابة**، وهو نفسه الملف الذي يرفعه QC Release Gate workflow كـ artifact عند الفشل.

### الملفات المتأثرة
- `apps/qc-task-manager/scripts/e2e-a11y.mjs` (إعادة كتابة — البوابة)
- `apps/qc-task-manager/src/components/{AiReviewPanel,CommentBox,Navbar,TaskLifecycle,TaskUpdatePanel}.tsx`
- `apps/qc-task-manager/src/components/lab/LabSecondaryNav.astro` + `src/components/ui/Pagination.astro`
- `apps/qc-task-manager/src/pages/{employee/index,manager/index,login,tasks/[id],lab/index,lab/tests/index,lab/documents/index}.astro`

### التحقق
- a11y E2E معزول: **86/0 ALL PASS، exit 0** — وتشغيل سابق أثبت أن البوابة توقف فعليًا (exit 1 عند فشل بنيوي قبل الإصلاح)
- `pnpm typecheck` ✅ 0 errors / 0 warnings / 17 hints
- `pnpm test:manifest` ✅ 54 canonical suites / 27 canonical E2E (التسجيل بدون تغيير)
- `pnpm test` ✅ السلسلة الكاملة 54 سويت exit 0 (منها test:ui-consistency 37/37 على نفس تغييرات المصدر)
- `NODE_ENV=production pnpm build` ✅ Complete
- `pnpm e2e:acceptance` ✅ **29/29 سويت (27 canonical + مرحتا persistence)، 2377+ assertion، exit 0** — ومنها a11y 86/0 داخل القبول
- `git diff --check` نظيف؛ التغييرات 15 ملفًا كلها داخل apps/qc-task-manager؛ السيرفر المؤقت وقواعد /tmp نُظفت

### النتيجة
- **الحالة:** نجح
- **مختصر:** الإتاحة صارت بوابة pilot فعلية: critical=0 وserious=0 على الـ 12 صفحة بعد إصلاحات حقيقية بالمكونات المشتركة أولًا (73 عقدة تباين + قفز عناوين + pill بلا نص)، بدون تعطيل أي قاعدة، والكيبورد/focus/الجوال/التراكيب كلها مغطاة باختبارات فاشلة عند الانحدار.

### ملاحظات / مشاكل مفتوحة
- /lab/tests/new يتطلب `?type=air|vacuum` (بدونه redirect لـ/lab) — البوابة تفحص النموذج بالـ query الصحيح.
- نطاق البوابة الحالي = صفحات الـ pilot الـ12؛ التوسيع مستقبلًا = إضافة سطر في SCAN_PAGES فقط.
- Skills used: verification-before-completion (قُرئت كاملة وطُبقت: لا ادعاء بدون إثبات تشغيل حديث)؛ ما فيه مهارة a11y مخصصة في `.agents/skills/`.
- القسم 1 يتجاوز حده الموثق مسبقًا — الأرشفة للقسم 2 تؤجل كقرار متكرر (نمط الجلسات الأخيرة).

## [2026-08-27] — QC-CI-RELEASE-GATE-009: بوابة إصدار QC المخصصة على GitHub Actions — بدون commit/push/deploy

### تم التنفيذ
- فحص الـ workflows الستة الموجودة (ci-build-guard, a11y, deploy, reports-gate, seo-guard, weekly-gsc): ولا واحد يغطي `apps/qc-task-manager` ولا يوجد تعارض أسماء — **لم يُلمس أي ملف قائم**.
- workflow جديد واحد: `.github/workflows/qc-release-gate.yml` (اسم: QC Release Gate) — صلاحيات `contents: read` فقط، صفر أسرار، صفر deploy، Node من `.node-version` (22.22.2) وpnpm من `packageManager` (10.19.0).
- **بوابة PR** (8 خطوات): install مجمد + typecheck + `test:manifest` + `test:route-manifest` + `test:embedded-migration-parity` + `test:migrations` + `pnpm test` الكامل (54 سويت canonical) + production build مع تحقق `dist/server/entry.mjs`.
- **E2E acceptance الكامل** على push main / nightly (cron `30 2 * * *`) / workflow_dispatch فقط — عبر `e2e:acceptance` الذي يبني ويشغّل الـ runner بقواعد SQLite مؤقتة معزولة لكل سويت ومنافذ معزولة؛ على PR يُعامل skipped ويمرره الـ aggregate. Playwright chromium يُثبّت داخل الـ job.
- عزل إضافي: jobs الوحدات/الهجرات تثبت `QC_DATABASE_PATH`/`QC_DB_PATH` على `runner.temp` كحارس ثانٍ ضد أي fallback لقاعدة حقيقية؛ عند الفشل تُرفع artifacts آمنة فقط (لوجات runner + `download/qa/a11y-qc-report.json` + `download/qa/ui-audit/`) وبدون رفع أي قاعدة بيانات.
- aggregate job باسم **«QC / Release Gate»** (job id: release-gate) بنمط ci-success: يفشل على أي failure/cancelled، يعامل skipped كنجاح، ويكتب جدول نتائج في GITHUB_STEP_SUMMARY.
- توصية branch protection موثقة برأس الملف (require «QC / Release Gate» من إعدادات GitHub يدويًا) مع تحذير سلوك paths-filter — **دون تعديل أي إعداد GitHub فعليًا**.

### الملفات المتأثرة
- `.github/workflows/qc-release-gate.yml` (جديد — الملف الوحيد)

### التحقق
- YAML parse ✅ (python3 yaml.safe_load) + تحقق بنيوي: triggers (pull_request/push/schedule/dispatch)، needs، اسم الـ aggregate، شرط E2E.
- الأوامر الثمانية المرجعية موجودة كلها في `apps/qc-task-manager/package.json` ✅
- تشغيل فعلي للأوامر الخفيفة الثلاثة على الشجرة الحالية: `test:manifest` ✅ (54 canonical suites / 27 E2E)، `test:route-manifest` ✅ (111 file routes / 25 middleware / 6 guards)، `test:embedded-migration-parity` ✅ (37/37 byte-identical).
- typecheck/build/full-tests/e2e: خضراء موثقة اليوم في سجل QC-REQUEST-SECURITY-008 على نفس الشجرة — لم تُعاد هنا.
- actionlint غير متوفر محليًا — الاعتماد كان على YAML parse + مراجعة بنمط ci-build-guard الحرفي.

### النتيجة
- **الحالة:** نجح
- **مختصر:** بوابة QC المخصصة جاهزة كملف workflow واحد جديد لا يمس شيًا قائمًا؛ التفعيل النهائي = commit من المستخدم ثم إضافة «QC / Release Gate» كـ required status check يدويًا من إعدادات GitHub.

### ملاحظات / مشاكل مفتوحة
- paths-filter: PR لا يلمس QC (ولا lockfile/loader) لن يُنتج الـ check أصلًا — لو وظّفت الحماية كـ required يجب إما قبول هذا السلوك أو إزالة الـ paths (موثق برأس الملف).
- القسم 1 يتجاوز حده الموثق مسبقًا — الأرشفة للقسم 2 تؤجل كقرار متكرر (نمط الجلسات الأخيرة).

### 2026-08-27 — SKILLS-DESCRIPTION-STRENGTHEN-003: مراجعة وتقوية أوصاف المهارات الـ60 كإشارة تفعيل تلقائي — نجاح

**المطلوب باختصار:**
- مراجعة أوصاف (description) كل مهارات المشروع وتقوية الضعيفة — الوصف هو إشارة التفعيل الأساسية عند النموذج (يُعرض مقصوصًا ~250 حرفًا، والحد الأقصى 1024).

**تم تنفيذه:**
- مسح الـ 60 وصفًا: أغلبها قوي أصلًا (أوصاف seo-* الـ10 وdesign-pipeline كتلة `>` طويلة بمشغّلات عربية وإنجليزية — المسح الأولي ضلّلها خطأً ثم تصحح بقراءة frontmatter الفعلي).
- **تقوية 11 وصفًا ضعيفًا** (سطر قصير بلا «Use when» أو مشغّلات): dispatching-parallel-agents, executing-plans, grill-me, requesting-code-review, subagent-driven-development, systematic-debugging, test-driven-development, writing-plans, writing-skills, emil-design-eng, minimalist-ui — كل وصف جديد front-loaded بالمشغّلات في أول ~250 حرفًا وبطول 255–336 حرفًا.
- **إصلاح تنسيقي:** وصف systematic-debugging كان multi-line مقتبسًا (شكل ما يضمنه parser وفق diagnosing-skills) — وُحّد لسطر واحد.
- المزامنة إلى `~/.zcode/skills/` و`~/.agents/skills/` تمت للـ 11 المحدثة حفاظًا على التطابق الثلاثي.

**الملفات المتأثرة:**
- `.agents/skills/{11 مهارات أعلاه}/SKILL.md`
- نسخها في `~/.zcode/skills/` و`~/.agents/skills/`
- `.agents/mind/01-mind-latest.md` (هذا السجل)

**التحقق:**
- فحص شامل: **187 ملف SKILL.md صالح** (name موجود + description 1–1024 حرفًا) عبر المجلدات الثلاثة ✅
- تطابق النسخ الثلاث: **0 diffs** ✅
- الملاحظة الوحيدة: ` rtl-ui-guardian` (مجلد بمسافة — مشكلة تسمية معلقة على المستخدم من SKILLS-DEFAULT-EXPORT-001)

**النتيجة**
- **الحالة:** نجح
- **مختصر:** كل مهارات المشروع الآن بأوصاف تفعيل قوية + قاعدة تفعيل تلقائي في AGENTS.md (SKILLS-AUTO-TRIGGER-002) — طبقتا ضمان للتفعيل التلقائي. يسري من الجلسة القادمة.

### ملاحظات / مشاكل مفتوحة
- ` rtl-ui-guardian` ما زالت بانتظار قرار المستخدم (إعادة تسمية المجلد بإزالة المسافة).
- `.agents/skills/stitch-design-taste/` الفاضي ما زال بانتظار قرار المستخدم.

 تفعيل تلقائي إلزامي للمهارات في بداية كل برومبت — نجاح

**المطلوب باختصار:**
- جعل ZCode يستخدم مهارات المشروع تلقائيًا عند بداية أي برومبت.

**تم تنفيذه:**
- فحص إعدادات ZCode (`~/.zcode/v2/config.json`, `setting.json`) + مهارة diagnosing-skills الرسمية: **ما فيه سwich إعدادات "default skills"** — ZCode يكتشف المهارات تلقائيًا ويعرض name/description/when_to_use للنموذج كل برومبت، والتفعيل قرار النموذج بناءً على الوصف + تعليمات النظام.
- الرافعة المضمونة: أُضيف قسم **«⚡ التفعيل التلقائي — إلزامي في بداية كل برومبت»** داخل القاعدة التاسعة بملفي AGENTS.md (المستخدم `~/.zcode/AGENTS.md` + المشروع): أول إجراء في أي برومبت = فحص قائمة المهارات واستدعاء المطابقة فورًا عبر Skill tool قبل أي أداة ثانية، مع ترتيب بعد قراءة الـ mind، واستثناء استدعاء المهارة الصريحة.

**الملفات المتأثرة:**
- `~/.zcode/AGENTS.md` (القاعدة التاسعة)
- `AGENTS.md` (جذر الريبو — نفس التعديل)
- `.agents/mind/01-mind-latest.md` (هذا السجل)

**التحقق:**
- تعديل توثيقي/تعليماتي فقط — لا build/tests. يسري من الجلسة القادمة (AGENTS.md يُحمَّل عند بداية كل جلسة).

**النتيجة**
- **الحالة:** نجح
- **مختصر:** كل برومبت جديد سيلتزم فحص المهارات واستدعاء المطابقة تلقائيًا قبل التنفيذ — عبر تعليمات ملزمة محمّلة دائمًا، لأن ZCode ما يوفر سويش "تحميل إجباري" للمهارات.

### ملاحظات / مشاكل مفتوحة
- قائمة التحقق النهائية في الدستور أُضيفت لها مطابقة ضمنية عبر القاعدة التاسعة المعدلة.
- لا يوجد.

 نشر كل مهارات المشروع إلى مجلدات المهارات الافتراضية على مستوى المستخدم (Default skills) — نجاح

**المطلوب باختصار:**
- إضافة كل مهارات المشروع (`.agents/skills/` — 60 مهارة) إلى الـ Default skills عشان تتوفر افتراضيًا في أي جلسة/مشروع.

**تم تنفيذه:**
- تدقيق مقارن (`diff -rq` لكل مهارة) بين `.agents/skills/` بالمشروع و`~/.zcode/skills/` و`~/.agents/skills/`.
- **اكتشاف أساسي:** `~/.zcode/skills/` (أعلى أولوية user-level في ZCode) مطابقة **100%** للمشروع (60/60، صفر فروقات محتوى) — مهارات المشروع كانت متاحة أصلًا كـ Default من هذا المجلد.
- أُضيفت **6 مهارات ناقصة** إلى `~/.agents/skills/` (الموقع القياسي العابر للأدوات): `astro-developer`, `distribb`, `grill-me`, `performance`, `seo-optimizer`, `web-design-guidelines`.
- زُامنت **7 مهارات** كان محتوى نسخة الـ user أقدم من نسخة المشروع (التي تحمل إصلاحات SKILLS-CODEX-COMPAT-001 الموثقة + النسخة الكاملة الأحدث): `claude-automation-recommender`, `emil-design-eng`, `i-have-adhd`, `pick-ui-library`, `prototype`, `review-animations`, `systematic-debugging`.
- لم تُلمس مهارات الـ user الخاصة غير الموجودة بالمشروع (apple-design, cognitive-tools, learned, rtl-ui-guardian, imagegen-*, vercel-react-best-practices...)، ولم تُلمس `stitch-design-taste` — لأن مجلدها بالمشروع **فاضي تمامًا** والنسخة الصحيحة الوحيدة في `~/.agents/skills/`.

**الملفات المتأثرة:**
- `~/.agents/skills/{astro-developer,distribb,grill-me,performance,seo-optimizer,web-design-guidelines}/` (إضافة)
- `~/.agents/skills/{claude-automation-recommender,emil-design-eng,i-have-adhd,pick-ui-library,prototype,review-animations,systematic-debugging}/` (مزامنة من نسخة المشروع)
- `.agents/mind/01-mind-latest.md` (هذا السجل)

**التحقق:**
- `diff -rq` بعد التنفيذ: **59/59 مهارة موجودة ومطابقة حرفيًا** في `~/.agents/skills/` (الاستثناء الموثق: stitch-design-taste) ✅
- كل المهارات الست الجديدة تحمل `SKILL.md` ✅
- لا build/tests — التغيير خارج شجرة الريبو (مجلدات مستوى المستخدم) + سجل العقل فقط

**النتيجة**
- **الحالة:** نجح
- **مختصر:** كل مهارات المشروع الـ60 متاحة الآن افتراضيًا: 60 في `~/.zcode/skills/` (كانت مطابقة أصلًا) و59 في `~/.agents/skills/` بعد إضافة 6 ومزامنة 7.

### ملاحظات / مشاكل مفتوحة
- `.agents/skills/stitch-design-taste/` بالمشروع مجلد **فاضي بلا SKILL.md** — يحتاج قرار مستخدم: حذفه أو تعبئته من نسخة `~/.agents/skills/stitch-design-taste/` (الصحيحة).
- مجلد ` rtl-ui-guardian` في `~/.agents/skills/` اسمه يبدأ **بمسافة** — خطأ تسمية محتمل يمنع الاكتشاف الصحيح؛ يحتاج قرار مستخدم مستقل.
- الاكتشاف الجديد للـ skills يسري من الجلسة القادمة.

### 2026-08-27 23:05 — QC-REQUEST-SECURITY-008: طبقة Fetch Metadata فوق CSRF + pruning للـ rate-limit buckets + حارس مصدري canonical لكل mutation — بدون commit/push/deploy

**الحالة:** نجح

**المطلوب باختصار:**
- تقوية أمن الطلبات في `apps/qc-task-manager` بدون استبدال المصادقة: Fetch Metadata defense فوق Origin CSRF الحالي، canonical security لكل POST/PUT/PATCH/DELETE، pruning للـ in-memory buckets، سويت scanning معماري، بدون Redis وبدون إضعاف CSP/CORS.

**تم تنفيذه:**
- `requireCsrf` صارت طبقتين: `Sec-Fetch-Site: same-origin` → قبول فوري، `cross-site` → 403 («Cross-site request rejected.»)، وأي قيمة أخرى (same-site/none/unknown) أو غياب الهيدر → fallback حرفي لمنطق Origin الأصلي (نفس الرسالة والسلوك — صفر كسر للسلوك القائم). انقسمت داخليًا إلى `requireCsrfForRequest(request, siteOrigin)` لتخدم الـ APIContext والـ LoginContext البسيط معًا.
- Pruning جديد للـ buckets الذاكرة (mutation IP+path وAI per-user): `pruneRateLimitBuckets(now)` مُصدَّرة بساعة قابلة للحقن (اختبار حتمي)، و`maybePrune` تلقائي مرة كل 60 ثانية أو فورًا عند تجاوز 4096 إدخال (حماية من flood مزيف الـ IP). Buckets بقيت in-memory — QC instance واحد، لا Redis.
- **فجوة اتساق أُغلقت**: `handleCreateTaskPost` (tasks.ts) كان المعالج الوحيد بلا `requireCsrf` canonical (حمايته الوحيدة طبقة Astro الضمنية) — صار يطبقها بنفسه كنمط معالجات المختبر.
- سويت جديد `scripts/test-request-security.mjs` (أمر `test:request-security`، مسجل canonical → **54 suites**): **56/0** — سلوكي (same-origin/cross-site/invalid-origin/لا-metadata يحمي/415/413/rate-limit 121st و16th/pruning بساعة مستقبلية + إعادة قبول بعد التصفير/قفل الحساب بالخامسة/بوابة الـ IP بالعشرين) + **scan معماري** يفشل على أي انحدار: كل unsafe api export لازم يستدعي `requireCsrf`، كل endpoint لازم `requireApiUser` (health.ts الاستثناء الموثق)، لا منطق origin/sec-fetch خارج api-security، كل handle*Post يطبق requireCsrf (استثناء session.ts موثق بترتيب middleware المُثبت نصيًا)، CSP بلا unsafe-inline/eval مع بقاء default-src self وframe-ancestors none وconnect-src self، لا Access-Control-Allow أصلًا، limiters Maps بلا redis في package.json، وكل fetch بالمكونات relative فقط.
- الـ UI islands لم تُلمس: كل الـ fetch نفسها نسبية same-origin والمتصفح يرفق `Sec-Fetch-Site: same-origin` تلقائيًا — التدفق القائم يمر كما هو.
- session.ts لم يُلم عمدًا: إضافة استيراد لخلق دورة session↔api-security؛ مساراها محميان بـ requireCsrf صريح داخل middleware (الموجود مسبقًا) والفحص المصدري يثبت الترتيب.

**الملفات المتأثرة:**
- `apps/qc-task-manager/src/lib/api-security.ts`
- `apps/qc-task-manager/src/lib/tasks.ts`
- `apps/qc-task-manager/scripts/test-request-security.mjs` (جديد)
- `apps/qc-task-manager/scripts/test-manifest.mjs`
- `apps/qc-task-manager/package.json`

**التحقق:**
- `pnpm test:request-security` ✅ 56/0 (من أول تشغيل)
- `pnpm test:lab-security` ✅ 63/0 (الـ refactor لم يكسر السويت القديم)
- `pnpm test:manifest` ✅ 54 canonical suites / 27 E2E — exit 0
- `pnpm typecheck` ✅ 0 errors / 0 warnings / 17 hints (267 ملفًا)
- `NODE_ENV=production pnpm build` ✅ Complete
- E2E معزول حي: `e2e-auth-lockout` ✅ **45/0** على سيرفر `dist/server/entry.mjs` بقاعدة temp (قُطع ونُظف بعدها)
- إثبات حي بـ curl بجلسة صالحة: same-origin metadata → **200** `{ok:true}`؛ cross-site metadata → **403** «Cross-site request rejected.»؛ بلا metadata وبلا Origin → **403** «Invalid request origin.» (fallback)
- `git diff --check` نظيف؛ السيرفر والقاعدة المؤقتة حُذفا

**قرارات/ملاحظات:**
- غياب `Sec-Fetch-Site` = نفس سلوك Origin القديم بالحرف، فلا مسار قائم تغيّر رفضه أو قبوله — الطبقة تضيف رفضًا جديدًا (cross-site حتى لو Origin مزيف مطابق) وقبولًا مبكرًا (same-origin) فقط.
- القيد 52→54 في المانيفست: 53 كانت بعد QC-USER-AUDIT-007، وهذا السويت جعلها 54.
- القسم 1 تجاوز حده (~620 سطرًا الآن) — الأرشفة للقسم 2 تؤجل كقرار موثق متكرر (نمط الجلسات الأخيرة).

**مشاكل مفتوحة:**
- لا يوجد.

**الخطوة الجاية:**
- لا يوجد — جاهز للمراجعة، والـ commit على المستخدم.

### 2026-08-27 22:22 — QC-USER-AUDIT-007: تدقيق دائم لإدارة المستخدمين على qc_audit_log

**الحالة:** نجح

**المطلوب باختصار:**
- استبدال console-only audit لإدارة المستخدمين بسجل قاعدة بيانات دائم.

**تم تنفيذه:**
- migration `037_user_audit_log.sql` توسّع `qc_audit_log` بـ entity `USER` وأحداث create/update/role change/activate/deactivate/password reset، مع rebuild يحفظ كل الصفوف والـ IDs والهاشات حرفيًا.
- عمليات المستخدم أصبحت تكتب before/after مسموحًا به داخل نفس transaction؛ لا password أو hash أو session token، وحمايات self-demotion/self-deactivation بقيت فعالة.
- صفحة `/admin/users/audit` إدارية read-only بفلاتر action/actor/target/date، من نفس السجل الوحيد.
- `test:user-audit` يغطي الأحداث، عدم تسريب الأسرار، عدم audit عند فشل mutation، والـhash chain؛ واختبار migration v36→v37 يثبت السجل التاريخي والهاشات unchanged.

**الملفات المتأثرة:**
- `apps/qc-task-manager/db/migrations/037_user_audit_log.sql`
- `apps/qc-task-manager/{db/schema.sql,src/lib/migrationRegistry.ts,src/lib/users.ts,src/lib/permissions.ts,src/lib/audit/userTimeline.ts}`
- `apps/qc-task-manager/src/pages/admin/users/{index,audit}.astro`
- `apps/qc-task-manager/scripts/{test-user-audit,test-migrations,e2e-admin-users,test-manifest,test}.mjs` والعدادات المتأثرة
- `apps/qc-task-manager/package.json`

**التحقق:**
- Migrations: ✅ `pnpm test:migrations`
- Audit/User: ✅ `pnpm test:user-audit` 21/0 و`pnpm test:audit-integrity`
- Full tests: ✅ `pnpm test` (53 canonical suites)
- E2E: ✅ `pnpm e2e:acceptance`، ومنها admin-users 52/0 ورفض employee لمسار audit
- Typecheck: ✅ 0 errors / 0 warnings / 17 hints
- Build: ✅ `NODE_ENV=production pnpm build` Complete
- Diff: ✅ `git diff --check`

**قرارات/ملاحظات:**
- Skills used: test-driven-development, verification-before-completion, writing-plans, using-superpowers.
- schema version صار 37 وembedded migration parity = 37/37.

**مشاكل مفتوحة:**
- لا يوجد

**الخطوة الجاية:**
- لا يوجد

### 2026-08-27 — QC-PRODUCT-UIUX-RECONSTRUCTION-006: إعادة بناء UI/UX بمنتج كامل لتطبيق QC Task Manager — نظام تصميم ملزم + 6 primitives + تنقل مجمّع + توحيد pagination/شارات/رؤوس + اهتمام الأدوار — كل البوابات خضراء (52 سويت + e2e:acceptance 2304/0) — بدون commit/push/deploy
- **Scope**: `apps/qc-task-manager/` فقط؛ قرأت العقل كاملًا أولًا. صفر تغيير لقواعد العمل أو `permissions.ts` أو المخطط أو الهجرات (عدا تصحيح عدّادات اختبار — تحت) أو CSRF/CSP. الواجهة بقيت إنجليزية بالكامل (حارس مصدري جديد يمنع العربي). لا commit ولا push ولا deploy.
- **المُسلَّم الأساسي**: `docs/UI-DESIGN-SYSTEM.md` — نظام تصميم داخلي صغير ملزم (مقياس تايبوغرافيا، إيقاع مسافات، radius md/lg/xl/pill، ظلال هادئة، خريطة ألوان دلالية neutral/info/progress/success/warning/danger/accent، هيكل صفحة قياسي، نموذج تنقل، عقد a11y، حواجز). استثناء موثق: حالات/أولويات المهام تحتفظ بمخططها الحالي (الرسوم البيانية معتمدة عليه).
- **Primitives جديدة** في `src/components/ui/`: `PageHeader` (eyebrow+H1+وصف+أفعال)، `AppButton` (4 متغيرات ×2 حجم + focus-visible موحد)، `StatusPill` + `statusTones.ts` (خريطة مركزية للحالات — النص دائمًا ظاهر مع نقطة زخرفية، ممنوع اللون وحده)، `Pagination` (تطبيق واحد بدل 4، مع aria-current)، `Banner`، و`EmptyState` محسّن (أيقونة + CTA ثانوي متوافق API). صفر dependencies جديدة.
- **التنقل (Navbar.tsx)**: نموذج مجمّع — Dashboard·Tasks·Search·Findings·Laboratory·Reports أساسية (مفلترة بالدور، الموظف بدون Dashboard قاعدة #1)، والإدارية تحت قائمة **More** (Delete Requests/Team Workload/User Management/Task Templates/Backups & Settings/System Health)، `aria-current="page"` بحبة brand نشطة ديسكتوب+More+جوال، وقائمة جوال مقصودة بأقسام Workspace/Administration/Account وأهداف 44px. **باق حقيقي اكتُشف وأُصلح**: `isActive()` كانت تقرأ `window` وقت تصيير الـ island على السيرفر فتنهار البث (ReferenceError على كل صفحة مصادَق) — صارت تُحسب بعد mount بstate (بلا hydration mismatch).
- **توحيد pagination**: 12 سجلًا صاروا على المكوّن الواحد (search, lab/search بعدل chevrons، lab/audit بعدل نصي، + 9 سجلات lab اللي كان فيها كتل مكررة حرفيًا) عبر codemod مؤقت بحفاظ حرفي على نفس مجموعة الروابط/النافذة (عقود e2e: nav[aria-label] + page=N hrefs + Prev/Next literals). حذفت كتل `pageNumbers` المكررة.
- **رؤوس وجداول وشارات**: `PageHeader` على manager/supervisor/employee/workload/findings/reports؛ رأس جدول قياسي (`px-4 py-2.5` + label موحد) و`tabular-nums` وhover موحد؛ `StatusPill` على سجل الاختبارات (بعد حذف statusTone المحلي) وadmin/users (Active/Disabled) وadmin/templates (lifecycle عبر LIFECYCLE_TONE + priority عبر priorityBadgeClass — كانت خريطة منحرفة). Reset صار شرطيًا بفلاتر نشطة بسجل الاختبارات.
- **صفحات الأدوار (Phase 8)**: strips «Needs attention» فوق القوائم — المدير: overdue/urgent/pending delete requests/open findings (روابط drilldown?kpi=overdue و/search?priority=urgent و/manager/requests و/findings)؛ المشرف: overdue/urgent/tests awaiting review/documents in review؛ الموظف: overdue/due today/open/draft tests/returned for changes/pending change requests (باستعلامات COUNT للقراءة فقط، العدّادات المرجعية تبقى Dashboard).
- **إصلاحات صفحات**: `manager/workload` — حذف الجملة العربية (كانت تخالف قاعدة English-UI) وحذف wrapper `max-w-7xl` المتداخل وإعادة البناء بPageHeader وجدول قياسي وempty state؛ `findings/index` أُعيدت بprimitives (جدول/فلاتر/empty state حسب السبب) مع الحفاظ على كل أسماء الحقول والأكشن؛ `reports` أُعيدت هيكلة 4 خطوات (Report type → Period & scope → Advanced collapsive بdetails → Preview scope → Downloads) مع الحفاظ على كل عقود e2e-reports (h1/select option counts/scope checkbox/audit link)؛ `404` صارت بصفحة مفيدة بCTA مزدوج.
- **Visual QA (Phase 27)**: `scripts/ui-screenshots.mjs` (أداة تشخيص غير مسجلة — سيرفر production ذاتي + DB مؤقتة بنفس بيئة acceptance) التقطت **60 لقطة fullPage لـ 20 شاشة × 1440/768/390** في `download/qa/ui-audit/` مع فحص overflow/H1 برمجي لكل لقطة: **0 overflow وH1 واحد لكل شاشة**. راجعت بصريًا: manager home، employee 390، lab tests register 1440، reports 1440، lab form 768. **باق ثانٍ مُصلح**: شريط الإجراءات اللاصق في `LabTestForm.tsx` كان يفيض 4px بعرض 768 (bleed `-mx-5` داخل سياق `px-4`) — صار `-mx-4 px-4` (مثبت بالمسبار المعزول وبالجولة النهائية).
- **حارس اتساق جديد (Phase 26)**: `scripts/test-ui-consistency.mjs` (أمر `test:ui-consistency`، **مسجل canonical → المانيفست صار 52 سويت**) — 37 فحصًا مصدريًا: صفحات بلا حرف عربي، pagination المشترك بلا pageNumbers inline، PageHeader على المحوّلات، workload بلا wrapper/عربي، StatusPill بسجل الاختبارات، عقد الـ landmark. مثبت صحةً بالمانيفست guard.
- **إصلاحات spec-drift للبوابة (خارج الـ UI لكنها شرط)**: الجلسة السابقة اعترفت أن `pnpm test` الكامل قُطع — البوابة كشفت **7 عدّادات هجرات قديمة (35 بدل 36 بعد migration 036)** أصلحتها جميعًا بلا أي إضعاف: `test-lab-change-requests:66` (currentVersion)، `test-production-operations:29,34` (expectedSchemaVersion ×2)، `test-dashboard-reports:22` (applied.length)، `test-scheduled-notifications:158` (schema version)، `test-db-doctor:40-42` (ثلاث /35/ regex).
- **Verification (كلها على HEAD 4437f121 + شجرة العمل dirty بتغييرات هذه المهمة فقط)**: `pnpm typecheck` **0 errors/0 warnings/17 hints** · `pnpm test:manifest` **52 canonical suites / 27 E2E — exit 0** · `pnpm test:route-manifest` **110 file routes / 25 middleware / 6 guards** · `pnpm test` **السلسلة الكاملة 52 سويت exit 0** · `NODE_ENV=production pnpm build` **Complete** · `pnpm e2e:acceptance` **كل السويتات عدّت: 26 canonical + مرحتا restart-persistence، 2,304 assertion ناجح / 0 فاشل** (منها lab-documents 85/0 بعقد عدّ الروابط الحرفي، reports 912/0، lab-search 21/0، a11y، dashboard بفحص الـ overflow عند 390/768/1440) · `git diff --check` نظيف. التغييرات: 30 ملفًا معدلًا + 5 مسارات جديدة.
- **Skills used**: redesign-existing-projects (قرأت SKILL.md كاملًا واتبعت تسلسل Scan→Diagnose→Fix وقواعد الـ stack)، web-design-guidelines (المرجع العام)، astro-developer (أعراف Astro islands/SSR).
- **الحدود الصادقة**: تقييم الدرجات قبل/بعد (59→80 إجماليًا) هندسي ذاتي وفق الموجز — **RUNTIME USER UAT REQUIRED** قبل أي ادعاء قابلية استخدام بشرية. الباقي: توحيد صفحتي الإشعارات، Reset الشرطي على باقي سجلات lab، تقارب H1 text-3xl القديم في سجلات lab غير المحوّلة نحو text-2xl، وترقية chips الموظف لروابط مفلترة (يحتاج فلتر due للبحث).
- **Files**: `docs/UI-DESIGN-SYSTEM.md` (جديد)، `docs/UI-UX-PRODUCT-AUDIT.md` (جديد)، `src/components/ui/{PageHeader,AppButton,StatusPill,Pagination,Banner}.astro` + `statusTones.ts` (جديد)، `src/components/{Navbar.tsx,EmptyState.astro}`، `src/components/lab/LabTestForm.tsx`، صفحات: `manager/index`، `supervisor/index`، `employee/index`، `manager/workload`، `findings/index`، `reports`، `search`، `404`، `admin/users`، `admin/templates`، `lab/{search,audit,tests/index,tests/review,products,calibration,retests,documents,templates,equipment,acknowledgements}`، `scripts/{test-ui-consistency(جديد),ui-screenshots(جديد),test-manifest,test-dashboard-reports,test-lab-change-requests,test-production-operations,test-scheduled-notifications,test-db-doctor}.mjs`، `package.json`.
- **Status**: delivered محليًا — لا commit ولا push ولا deploy (القاعدة الثانية)؛ الالتزام على المستخدم. القسم 1 تجاوز حده مسبقًا (~594 سطرًا الآن) — الأرشفة للقسم 2 قرار جلسة قادمة (نمط موثق متكرر). رسالة مقترحة: `feat(qc): product UI/UX reconstruction — design system + shared primitives (PageHeader/AppButton/StatusPill/Pagination/Banner), grouped nav with aria-current, unified pagination/status/badges, role attention strips, workload+reports+findings rebuilds, SSR window crash + sticky-bar overflow fixes, UI consistency guard (52 suites) + 60-shot visual QA`

### 2026-08-27 21:34 — PROMPT8-CHECKLIST: إضافة تشيك ليست تنفيذ لـ prompt8.md بنفس أسلوب prompt5-LAB.md — نجاح، بدون commit/push/deploy

**الحالة:** نجح

**المطلوب باختصار:**
- إضافة قسم تشيك ليست (حالة تنفيذ + تبعيات + ترتيب نهائي) لملف `audit/qc/QC-Task-Manager/prompt8.md` مطابق لأسلوب `prompt5-LAB.md`

**تم تنفيذه:**
- أُضيف رأس توثيقي (Repository/Target/Execution model) + قسم "How to Use This Checklist" + "Global Prompt Execution Status" (22 برومبت 00–21) بأعلى الملف
- حالة التنفيذ: 00–05 معلّمة ✅ (مطابقة للواقع الموثق بالعقل: baseline, reporting, migration parity, test gate, deployment, auth/password lifecycle migration 036 + AI safe mode) و06–21 ☐
- أُضيف قسم "Execution Dependencies & Blocking" يوثق تبعيات الحجب: 06 قبل 11/13/17، 09 بعد 02/03، 10 يعتمد على primitives الـ 06، 15 يعتمد على 01، 12 يعتمد على 06، 20 SOURCE-BLOCKED، 21 أخيرًا
- استُبدل قسم "الترتيب النهائي" النصي بـ "FINAL EXECUTION ORDER" على مراحل A–E بمربعات تحقق + "DEFINITION OF DONE" + "AGENT EXECUTION CONTRACT" (بما فيها خطوة تحديث التشيك ليست نفسه وسجل العقل بعد كل برومبت)
- لا تعديل على محتوى البرومبتات نفسها (00–21) — فقط الأقسام الهيكلية

**الملفات المتأثرة:**
- `audit/qc/QC-Task-Manager/prompt8.md`

**التحقق:**
- Build: لم يُشغّل (تغيير توثيقي فقط — لا يمس الكود)
- Lint/Typecheck: غير مطلوب
- Tests: غير متأثرة
- فحص يدوي: ✅ قراءة الملف بعد التعديل (رأس الملف سليم، لا تكرار، نهاية الملف محدثة)

**قرارات/ملاحظات:**
- Skills used: none — no matching skill found (مهمة توثيق برومبتات، ما فيه مهارة مطابقة في `.agents/skills/`)
- الحالة الابتدائية للتشيك: 00–05 ✅ حسب ما أثبته العقل سابقًا؛ 20 معلّم SOURCE-BLOCKED في الترتيب لأن صفحات المصدر المسيطر 2/3 و3/3 غير متوفرة
- ملف توثيقي فقط — لا commit (على المستخدم)

**مشاكل مفتوحة:**
- لا يوجد

**الخطوة الجاية:**
- بدء تنفيذ Prompt 06 (Full Product UI/UX Reconstruction) حسب التشيك ليست الجديدة
## [2026-09-01] — RDX-CONTRAST-ON-MEDIA: أسطح قراءة مضمونة فوق فيديو الخلفية

### تم التنفيذ
- رفعت `--surface-on-media` من `rgba(10,16,32,0.86)` إلى `0.90`؛ أسوأ حالة على إطار أبيض صارت `rgb(34,40,54)`، ورفعت `--text-muted` إلى `#94a3b8` لأن قيمته السابقة لم تكن تحقق AA فوق هذا السطح.
- وسعت أسطح القراءة محليًا للرئيسية، الـhero، المقالات/القانونية، Kernel، الصفحات المستقلة `answer` و`lp`، صفحة 500، و`PageHeader` في QC؛ أضفت فروع reduced-transparency وprint لكلها.
- أضفت `scripts/qa/verify-contrast-on-media.mjs` وربطته في `package.json` عبر `contrast:verify` و`bg:contract`؛ يقرأ التوكنات فعليًا ويحسب النسب فوق طرفي الفيديو بدل لقطة واحدة.
- وسعت `layout-audit.mjs` بحقل `bareTextOnMedia` الذي يمشي على عقد النص ويبحث عن أقرب سطح خلفية؛ صححت regex في الحارس بعدما ولّد نتائج كاذبة بسبب قراءة `rgba()` المحسوب بشكل خاطئ.
- لم أغير عقد الفيديو أو أضف scrim ثابت أو dependency أو commit/push/deploy.

### الملفات المتأثرة
- `src/styles/{tokens,components,pages}.css`
- `src/pages/{answer/[slug],lp/[slug]}.astro` و`public/500.html`
- `apps/qc-task-manager/src/{components/ui/PageHeader.astro,styles/global.css}`
- `scripts/qa/{verify-contrast-on-media,layout-audit}.mjs` و`package.json`

### الأرقام
- `--text-primary`: 17.55:1 (أسود) / 13.45:1 (أبيض).
- `--text-secondary` و`--text-muted`: 7.50:1 / 5.75:1.
- `--brand-300`: 6.62:1 / 5.08:1؛ `--interactive-primary`: 6.31:1 / 4.84:1.
- فحص Chromium المصغّر: 3 routes × 3 مقاسات = 9 runs، `bareTextOnMedia: 0` و`horizontalOverflow: 0`.

### التحقق
- `pnpm build` ✅.
- `pnpm --dir apps/qc-task-manager build` ✅ و`typecheck` ✅ (0 errors/warnings، 27 hints سابقة).
- `pnpm --dir apps/qc-task-manager test:ui-consistency` ✅ 207/207.
- `pnpm bg:verify` ✅ 7/7؛ `pnpm bg:contract` ✅ (background 95/95 + contrast PASS)؛ `pnpm headers:check` ✅؛ `git diff --check` ✅.

### النتيجة
- **الحالة:** جزئي.
- **مختصر:** الحارس الحسابي والأسطح والتدقيق التشغيلي للعينة ناجحة، لكن إعادة المسح الكامل 80 template × 8 viewport والحالات reduced-motion/print/zoom بعد تصحيح الحارس ما زالت غير منفذة؛ لا تدّعي تغطية كاملة قبلها.

### ملاحظات / مشاكل مفتوحة
- مخرجات الفحص تولّدت في `download/qa/global-bg-audit/` وغير متتبعة؛ لا تحذفها بدون قرار المالك.
- لا توجد لقطات before/after الكاملة لكل العائلات بعد.
## [2026-09-01] — RDX-READING-SURFACES-001: توحيد أسطح القراءة وإصلاح هيرو الجوال

### تم التنفيذ
- استبدلت fallback العام `main > *` بأسطح محلية صريحة للأقسام الرئيسية والداخلية وCTA والخلاصة؛ ما عاد كل عنصر في الصفحة يعامل كبطاقة مستقلة.
- أضفت variants دلالية مركزية: hero وsection وprose وcompact وproof وcta، مع fallback واضح لـreduced-transparency والطباعة.
- عدلت `SplitHero` ليعتمد ارتفاعًا ناتجًا من المحتوى على الجوال، وطبقت حماية عرض/wrapping للـH1 مع padding أفقي 16px.
- حسّنت نص هيرو الرئيسية وإجابة صفحة الحلول ليكونان مباشرين وأقصر، بدون claims امتثال أو عملاء جديدة.
- حوّلت النص الطويل في `/solutions/` إلى سطح prose واحد بدل أسطح منفصلة لكل فقرة.

### الملفات المتأثرة
- `src/styles/components.css`
- `src/components/SplitHero.astro`
- `src/pages/solutions/index.astro`
- `docs/audits/RDX-READING-SURFACES-IMPLEMENTATION-REPORT.{md,json}`

### التحقق
- `pnpm bg:contract` ✅ — 95/95 وcontrast PASS؛ أقل نسبة للنص التفاعلي على الإطار الأبيض 4.84:1.
- `git diff --check` ✅.
- `pnpm build` ⚠️ وصل Astro إلى Complete؛ مرحلة sitemap داخل أمر الجذر لم تنتهِ ضمن دورة runner. تحذيرات duplicate routes موجودة قبل المسارات المعدلة.
- لم يكتمل Chrome/layout-audit الشامل: خادم المعاينة المحلي لا يستمر داخل runner الحالي.

### النتيجة
- **الحالة:** جزئي.
- **مختصر:** نظام الأسطح وإصلاح الهيرو للصفحات ذات الأولوية موجودان ويجتازان عقد الخلفية والتباين، لكن تغطية كل route family وQC وDashboard تحتاج تشغيل معاينة مستمر وفحص كامل.

### ملاحظات / مشاكل مفتوحة
- `download/qa/global-bg-audit/route-inventory.json` تغيّر عند إعادة الجرد؛ أبقيته كأثر جرد ولا حذفت أي مخرج QA قائم.
- لا commit ولا push ولا deploy.
