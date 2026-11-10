# P09 — Human Gate local evidence

- الحالة: PARTIAL؛ دليل محلي فقط، دون اعتماد أو تشغيل منشور.
- الوقت: 2026-11-10، 21:09–21:15 Asia/Riyadh. HEAD `3703f46b4091a48ec49626822ebe3994db240fc8` مع تغييرات working tree؛ المرجع `7b1f533f71c7b1f41884790366a4d5967c85a87b`، ثمانية commits بعد المرجع.
- البيئة: Node 22.22.2، PostgreSQL 18.6 على localhost، قاعدة جديدة وAuth اصطناعي ودور `aigas_runtime` بلا superuser أو bypass RLS؛ منع الخروج عبر `tests/helpers/no-egress.mjs`، دون تحميل `.env`. بعد تفويض صريح طُبقت migrations بواسطة fixture على قواعد محلية مؤقتة فقط.
- الأمر: `node --test tests/human-gate.test.mjs tests/human-gate-db.test.mjs` مع `HUMAN_GATE_TEST_DATABASE_URL` لقاعدة localhost جديدة، `AIGAS_REQUIRE_DB_TESTS=true`, `AIGAS_REQUIRE_RLS=true`, `AIGAS_ENVIRONMENT=local`, و`NODE_OPTIONS=--import=.../tests/helpers/no-egress.mjs`.
- التنفيذ: اختبار تنافس اتصالين على طلب rename واحد قرأ نجاحًا واحدًا ورفضًا واحدًا؛ readback طابق الاسم وإصدار الهدف وطلب APPROVED/EXECUTED والقرار وسبب المراجعة وdigest وإصدار السياسة وpermit المستهلك، وحدث تنفيذ وتدقيق واحدين. اسم الحالة النهائي للطلب EXECUTED.
- حالات سلبية: self-review وMEMBER وoutsider وreplay؛ سحب رتبة المراجع بعد الموافقة، إلغاء الطلب، تغيير الهدف والسياسة، سحب التفويض، وانتهاء فعلي بعد دقيقة؛ رفضت جميعها التنفيذ. readback للانتهاء: EXPIRED/TIMEOUT وpermit REVOKED دون تغيير الاسم.
- فشل audit اصطناعي أعاد 503 وأبقى عملية rename في APPROVED وpermit ACTIVE والاسم دون تغيير؛ إنشاء الطلب والقرار وأثر الملاحظة تراجعت أيضًا.
- ظهر خطأ 42501 عند مراجعة مفوضة بسبب قفل Auth المباشر، ثم منع RLS قراءة الهدف بقفل UPDATE لمراجع MEMBER؛ استُخدمت دالة قفل العضوية القائمة وقراءة الهدف دون قفل في مرحلة الأهلية، مع إعادة فحصه وقفل تحديثه أثناء التنفيذ. صُحح تصنيف سبب تغيير الهدف إلى TARGET_CHANGED.
- INTERNAL_DEMO_NOTE أثر اصطناعي داخلي فقط؛ ليس موصل عميل خارجيًا. لم يُنفذ تكامل Firewall ولا أي عملية خارجية.
- Browser وNeon الحالي وAuth runtime وواجهة منشورة والتبعيات P01–P05/P06-A/P08 والاعتمادات لم تُتحقق في هذه الجولة؛ الأدلة السابقة تاريخية أو تخص نطاقها. لا استنتاج إطلاق أو جاهزية شاملة.
- التراجع: تعطيل نوع العملية عبر آلية معتمدة وحفظ الحالات والأدلة؛ لا UPDATE يدوي لإنشاء APPROVED. تعطيل النوع منفردًا غير مثبت في هذه الجولة.
- النتيجة النهائية على الحالة المعدلة: 6 PASS، 0 FAIL، 0 SKIP؛ شملت مراجعة وتنفيذ ملاحظة داخلية بتفويض ساري. أُوقف خادم PostgreSQL؛ بقيت ملفات العنقود المحلي المؤقتة في `/tmp/aigas-p09.4LjGuG`.
