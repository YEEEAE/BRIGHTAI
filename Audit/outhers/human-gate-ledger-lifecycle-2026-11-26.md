# المرحلة 06 — Human Gate + Ledger lifecycle closure

التاريخ: 2026-11-26. النتيجة: **PARTIAL / BLOCKED**. لم تُكتب بيانات إنتاج أو staging، ولم تُطبّق تغييرات مصدر لأن فشل 403 المحدد لم يُعَد إنتاجه ولا يمكن تمييز خطأ adapter من اختلاف استجابة الاختبار دون قاعدة التكامل المخصصة.

## حدود الصلاحية والبيئة

- `tests/helpers/database.mjs` يقبل قواعد PostgreSQL محلية فقط (`localhost`/`127.0.0.1`) ويرفض DSN بعيدًا؛ `FIREWALL_REVIEW_TEST_DATABASE_URL` غير مضبوط، لذلك اختبار قاعدة البيانات تخطّى عمدًا.
- لا توجد قاعدة بيانات محلية مخصصة مثبتة في متغير الاختبار. ظهور مستمع PostgreSQL وحده لا يثبت أن قاعدة فارغة/مؤقتة مخصصة ومصرح بها.
- MCP Graphify طلب تسجيل الدخول ولم يُستخدم. لا يوجد خادم Playwright MCP. بحث Neon عن مشاريع BRIGHTAI أعاد قائمة فارغة؛ لذلك staging غير محدد أو قابل للوصول، ولم تُنفذ كتابة عليه. لم يُستخدم Linear.

## إعادة الإنتاج

الأمر: `node --test tests/firewall-review-binding.test.mjs`

النتيجة: 4 PASS، 0 FAIL، 1 SKIP. حالة skip: `atomic metadata review is visible, independent, revocable and rolls back with decision` بسبب عدم وجود `FIREWALL_REVIEW_TEST_DATABASE_URL`. لهذا لم يُعاد إنتاج فرق جسم 403 المذكور في الطلب. لم تُخفف أي assertion ولم يُكشف أي نص خطأ خام.

## مراجعة العقد الموجود (قراءة فقط)

- `src/server/human-gate/service.mjs`: الطلب يحمل `payload_digest` ومرجع الأصل/الموضوع و`policy_version`؛ فصل صلاحيات المراجع عن مقدم الطلب؛ انتقالات الحالة محددة؛ الرفض حالة نهائية تمنع execute؛ approval expiry؛ grant مربوط بالطلب والفاعل والمراجع والعملية والهدف والبصمة والسياسة؛ قفل صف grant واستهلاكه ذريًا بعد revalidation وقبل/ضمن معاملة الأثر؛ إعادة فحص عضوية وصلاحية المراجع والهدف؛ التنفيذ غير مهيأ لتصعيد Firewall.
- `src/server/ledger/core.mjs` و`src/server/ledger/service.mjs` و`public/downloads/aigas-ledger-verifier.mjs`: canonical SHA-256 sequence/previous-hash موجود، وmanifest يتضمن النطاق والإصدار، والـCLI يرفض التلاعب. وصف assurance قائم كـ`INTEGRITY_ONLY_NO_SIGNATURE`؛ لا يصف البصمات كتوقيع.
- `src/demo/governance.mjs` و`src/scripts/governance-demo.ts`: المختبر العام ما زال يستخدم مراجعات محلية بحدث `review.decided`، ولا يبني سلسلة SHA-256 مستقلة للأحداث أو manifest/verifier خاصًا به. التصدير الحالي `JSON.stringify(state, null, 2)`؛ تسميات APPROVED محلية وصفية. لم يُختبر أن reset/navigation لا يعيدان حالة قديمة في هذا التشغيل. هذه فجوة مستقلة عن المحرك المؤسسي.
- لم يثبت فشل assertion عند السطر المذكور من مصدر الخلل؛ عقد 403 الحالي يتضمن code/message وحقول decision/policy المحدودة عبر adapter، لكن يلزم الاختبار التكاملي على fixture المخصص لحسم expected body مقابل actual body.

## مصفوفة القبول

| المعيار | النتيجة |
|---|---|
| Firewall review / binding وقرار 403 | PARTIAL؛ اختبارات unit 4/4 ذات الصلة ناجحة، اختبار DB skipped، فشل الجسم الأصلي غير معاد الإنتاج |
| Human Gate review / deny / resume / replay | الكود الحالي يُظهر حواجز الربط والرفض والاستخدام الأحادي؛ لم يُنفذ DB replay في هذه المرحلة |
| Ledger 5/5 على staging المخول | BLOCKED؛ لا staging محدد/ظاهر، ولا توجد كتابة عن بعد |
| مستقل verify وtamper copy للمحرك الحالي | موجودة في اختبارات `tests/ledger-db.test.mjs` وCLI verifier؛ لم تُشغّل اختبارات DB في هذه المرحلة |
| مختبر public: سلسلة محلية + manifest + verifier مستقل + tamper | NOT IMPLEMENTED / BLOCKED |
| منع reset/navigation من إحياء إذن | لم يُتحقق منه؛ حالة المختبر الذاكرية الحالية تُمسح عند `pagehide`/clear، لكن اختبار الإحياء مطلوب |
| كتابة إنتاج | لم تحدث |

## الخطوة اللازمة للإغلاق

تشغيل الاختبار على قاعدة PostgreSQL محلية مخصصة وفارغة بإعداد `FIREWALL_REVIEW_TEST_DATABASE_URL` المعتمد؛ ثم تشغيل مجموعة Human Gate/Ledger DB محليًا. إتاحة هوية staging وفرعها المعزول صراحةً إن كان مطلوبًا لإثبات 5/5. بعد ذلك، معالجة adapter أو المصدر فقط إذا أعاد الاختبار نفس 403 مع جسم لا يطابق العقد؛ إبقاء assertion الأمنية دون تخفيف. تنفيذ public demo chain/verifier/tamper كعمل كود مستقل مع اختبار browser محلي.
