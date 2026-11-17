# القياس الموحد — 2026-11-17

الحالة: DONE للمواصفات والربط العام المحلي؛ PARTIAL لقبول القياس المنشور والخادمي. لا نشر/لوحة/إعداد خارجي/مفتاح أو .env أو workflow أو migration.

## التنفيذ
- أربعة أحداث عامة مغلقة الخصائص إلى GA4 الموجود: lab_started، scenario_completed(demo_client)، template_download_requested، contact_channel_opened. لا search/chat/form/tenant properties. لا ادعاء inquiry أو server success من العميل.
- حارس تركيب واحد، ID للفعل، dedup محلي وإكمال مرة للمحاولة حتى reset؛ لا نجاح إن لم تُقبل البداية بالقياس؛ لا replay للأحداث المتوقفة.
- قاطع runtime عام أو خاص GA4، boolean public status/no-store، قبل تحميل SDK ودوريًا15s وعند visibility. يضبط ga-disable، والتوقف الصريح latched حتى reload؛ لا إيقاف وظائف المنتج.
- الاستضافة static تستخدم control JSON عند API404؛ القيمة الملتزم بها true. runtime env وحده لا يغير static؛ يلزم خدمة endpoint أو نشر قيمة control. لم ينفذ أي منهما خارجيًا.
- الزيارات وإسناد Google/Bing وUTM source/medium/campaign/content باقية؛ حُذف utm_term حماية لعبارة البحث. CSP/hash وغلاف البوابة وdemo self-connect متطابقة.
- لا وجهة إضافية، لا IDs مستمرة جديدة، لا محتوى في أحداث القياس. Enhanced Measurement في حساب GA4 وقيم الحملات المتبقية/إثراء المزود تحتاج مراجعة مستقلة؛ ليست شهادة خصوصية شاملة.

## الدليل
- `node --import ./tests/helpers/no-egress.mjs --test tests/measurement.test.mjs tests/observability.test.mjs tests/ga4-attribution.test.mjs tests/kernel-demo.test.mjs tests/firewall-demo.test.mjs tests/human-gate-demo.test.mjs tests/risk-demo.test.mjs`: 73 PASS / 0 FAIL / 0 SKIP. لا شبكة خارجية.
- توسيع الجولة بـsecure-chat-demo: حالتا منطق المحاكاة PASS، وفحص المصدر الذي يمنع أي fetch FAIL. الدليل السابق في `git show HEAD:src/components/SecureChatDemo.astro` يحتوي fetch('/api/public-demo/groq-sandbox') نفسه في سطر42؛ لم يضف هذا العمل الاتصال ولم يعطل الاختبار.
- lockfile مطابق، بناء معزول في `/tmp/brightai-measurement-verify` باستخدام Node22.22.3 واعتمادات Astro6.4.8 الموجودة: PASS؛ 64 public pages وSEO coverage PASS. لم تستخدم node_modules الجذر غير المطابقة ولم تثبت حزمًا.
- Playwright/localhost: Kernel، Firewall، Secure Chat، Risk، Human Gate، Ledger كل منها أظهر start+complete demo فقط. القالب CSV أظهر download request واحدًا، والتواصل email أظهر open واحدًا؛ منع التنقل في اختبار الروابط لتجنب فتح تطبيق/إرسال أو تلويث الموقع الخارجي.
- إعادة تشغيل Firewall مرتين دون reset: حدثان فقط، وبعد reset ومحاولة جديدة: أربعة؛ config واحد وloader واحد. مسار demo/firewall يسمح self-connect والقاطع يعمل فيه.
- محاكاة status.enabled=false بصفحة مفتوحة: ga-disable=true، لا أحداث جديدة، نتيجة المختبر ظاهرة. reload مع تعطيل: صفر vendor loader. اختبار المتصفح اعترض جميع HTTPS بما فيه SDK؛ لا بيانات اصطناعية أرسلت للحساب، ولا ادعاء إثبات ingestion أو SDK الحقيقي.
- `git diff --check`: PASS. تغييرات المستخدم السابقة في Audit/seo.md وAudit/outhers/seo.md محفوظة.

## الحدود
- لا مستقبِل دائم/outbox أو server_committed أو inquiry_verified مربوط: N/A؛ لا ينشأ عدد استفسارات من فتح قناة.
- لا cohort completion خادمي، ولا dedup لدى مزود خارجي/بعد reload؛ الأحداث الحالية محلية بلا retry. لا تعمم الإثبات إلى exactly-once.
- لا لوحة خارجية، لا فحص جمع منشور/Realtime/GSC أو الحساب. المواصفات تبقى تصميم اللوحة فقط.
- Project Mind لم يُعدّل لأن `.agents` read-only بصلاحيات الجلسة؛ هذا التقرير مرجع الاستمرار.
