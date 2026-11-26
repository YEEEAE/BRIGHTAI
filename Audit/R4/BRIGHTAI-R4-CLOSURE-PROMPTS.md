# BRIGHT AI / AIGAS — R4 Closure Work Pack

**الحالة:** خطة إغلاق مبنية على أدلة R3.1 وR13 المحفوظة، وليست تأكيدًا بأن أي عمل نُفذ. لا تبدأ أي اختبار/تغيير خارجي أو مدفوع إلا بتفويض منفصل. لا commit/push/merge/deploy، ولا كتابة Neon/Render/Cloudflare/MagicPath، ولا Groq egress ضمن هذه الحزمة.

## شروط مشتركة

- ثبّت SHA والفرع وحالة العمل قبل كل مرحلة، واحمِ تعديلات المالك.
- استخدم بيئة disposable أو staging معزولة، ومعلومات اصطناعية فقط. القراءة من Neon قبل اختيار المشروع/الفرع الصحيح وتأكيد الصلاحية؛ لا تكتب إلى production.
- لكل نتيجة سجّل `source/local/staging/live` منفصلة مع SHA ووقت UTC/محلي وأداة ومرجع دليل وحالة `PASS_VERIFIED / FAILED / BLOCKED / NOT_VERIFIED`.
- أعد تشغيل assertion الأصلي كما هو؛ لا تخففه لتجاوز فشل. لا تنقل historical/local PASS إلى live.
- معيار 80% لكل محور لا يعوض شرط P0 أو موافقة نشر مستقلة.

## 01 — تثبيت lineage وإعادة القياس النظيفة

اقرأ R3.1 originals من حزمة ZIP الموثقة، وقارن الـ78 IDs/text/domain/weights مع `BRIGHTAI-R4-SCORECARD-PARTIAL.json`. احفظ hash للأصول دون تعديلها. ثبّت HEAD الحالي عند بدء التنفيذ، ثم أعد قياس source/local فقط عند الحاجة ضمن نفس commit؛ لا تصف قياس 961836f8 بأنه عند HEAD أحدث. أخرج diff حسابيًا واضحًا وحالة parity.

**إغلاق:** 78/78 معرّفًا ونصًا ومجالًا؛ 13/13 أوزان ومقامات؛ حساب مستقل يطابق JSON؛ سجل لكل بيئة/وقت/SHA. إذا تغيرت أي متطلبات، أوقف المقارنة ولا تغيّر المقام بصمت.

## 02 — حسم MagicPath المرجعي

اطلب قراءة read-only للمشروع والمكوّن المحددين في R3.1: project `476406002938429440`, component `476406049398726656`, revision `476406049398726657`. سجل أن سجل قبول R13 استخدم `476467892385353728`، ولا تقبل بديلًا قبل تأكيد المالك. لا تعدّل المشروع. التقط المرجع من revision المطابق وصنّف عناصر القبول الـ12، مع source/enterprise منفصلين.

**إغلاق:** revision match موثق؛ المرجع والكود/اللقطات محفوظة محليًا مع hash؛ 12 صفًا لكل مستوى ملائم؛ visual parity لا PASS إذا غابت صورة المرجع أو المرشح.

## 03 — إعادة تحقق نشر Node والبوابات الحية

تحقق من هوية خدمة Render والـworkspace والـdeployment المنشور إلى HEAD الحالي بأذونات قراءة فقط. لا تغيّر الخدمة أو DNS. اختبر `/healthz/`, `/readyz/`, `/app/`, `/app/kernel/`, `/api/trial-availability/`, `/request-access/` عبر origin موثق، واحفظ الحالة/التحويل/headers دون بيانات حساسة.

**إغلاق:** SHA المنشور يطابق المرشح؛ readiness حقيقية وauth/CSP/no-store مناسبة؛ كل 404 مصنّف بدليل. أي تحويل إلى Node أو نشر يحتاج موافقة نشر مستقلة.

## 04 — Neon schema parity وRLS

اطلب تحديد project/branch الصحيح؛ سجلات R13 عن `br-rough-wind-bdkmg13n` و`br-young-bird-b43proeb` ليست بديلًا عن تأكيد الوجهة الحالي، كما أن البحث بمعرّفات سابقة أعاد نتائج فارغة. بعد تأكيد read-only، اجمع constraints/triggers/policies/roles/migration ledger فقط. لا تطبق migrations ولا تنشئ جداول أو أدوار.

**إغلاق:** delta موثق بين 43/31 الجداول حسب البيئة كما يظهر فعليًا، role grants/RLS وسلامة قيود Ledger/guard، reconciliation checksums مع migrations. أي كتابة تبقى محظورة في هذه الخطة؛ ارفع patch وخطة staging/rollback للموافقة.

## 05 — استعادة CTA والتحويل

أعد تشغيل فحص CTA على 320/375/768 وعلى desktop، وتحقق من شجرة الإتاحة وروابط `/request-access/` و`/contact/`. ميّز بين الصفحة التي عُرضت وبين submit/استلام lead. لا ترسل form أو بريدًا أو WhatsApp ولا تنشئ lead حقيقيًا.

**إغلاق:** كل CTA له route فعلي وحالة خطأ/نجاح حقيقية مثبتة محليًا أو في staging مصرح، وبدون PII في URL/analytics؛ live submit يظل NOT_VERIFIED ما لم يسمح اختبار اصطناعي صريح.

## 06 — Secure Chat وCSP

أعد إنتاج فشل `secure-chat-security` وE2E/CSP المحفوظ في R13 من نفس SHA أو المرشح الحالي. أصلح العقد أو التوقع وفق السياسة الفعلية فقط؛ لا تجعل test يمر بإضعاف التحقق. لا تكشف أجسام أخطاء حساسة ولا تُدخل مفاتيح.

**إغلاق:** E2E + فحوص الأمن + CSP PASS على بيئة محلية/معزولة، مع اختبار no-provider/unauthorized والفشل. Live Secure Chat غير مثبت دون تحقق مصرح مستقل.

## 07 — اعتماد Groq وميزانية egress

لا تبدأ أي طلب إلى Groq دون موافقة مالك صريحة على المزود/النموذج/البيانات والمنطقة/الاحتفاظ والميزانية والسقف والتوقيت والبيئة. لا تستخدم سرًا من سجل أو محادثة؛ افحص اسم المتغير فقط. أبق public egress disabled أثناء هذا الإعداد.

**إغلاق:** اعتماد موثق، المفتاح الخادمي المناسب، حدود إنفاق ذرية مشتركة، fail-closed، DENY لا يرسل، ومدخل synthetic ثابت فقط. إن لم توجد الموافقة، يبقى `NOT_VERIFIED` و`NO-GO` ولا يُجرى الاستدعاء.

## 08 — Human Gate وLedger

أعد إنتاج فشل review binding من الاختبار الأصلي في قاعدة disposable. راجع التوقيعات/الـfingerprint/expiry/single-use، ثم تحقق من export وhash chain وtamper copy دون ادعاء توقيع. لا تستخدم production.

**إغلاق:** reject/expire/replay لا ينفّذ؛ الموافقة bound للطلب/الأصل/الإصدار والسياسة؛ تحقق مستقل من ledger؛ rollback موثق؛ اختبارات tenant isolation لا تعبر بيانات بين المؤسسات.

## 09 — Registry وPolicy Packs وRisk

افصل synthetic demo عن persisted enterprise. تحقق من IDs/version/source applicability ومراجع الحزم. أعد تقييم المقياس 3×3 مقابل واجهة MagicPath 5×5 دون تحويل ضمني أو ادعاء قانوني/امتثال. لا تفعّل سياسة مولدة آليًا.

**إغلاق:** عقد معتمد ومصدر تنظيمي مرجعي لكل حزمة، خطر متبقٍ قابل لإعادة الحساب، replay موسوم وليس monitoring حي، مراجعة بشرية وتاريخ/مسؤول واضحان.

## 10 — بناء واجهة MagicPath وربط الأفعال

بعد حسم revision، افحص كل الشاشة/الأقسام الـ11 والـmodal والـcontrols. حافظ على Hero محميًا، Astro/Node، RTL، CSP، وعدم تخزين بيانات مؤسسية في المتصفح أو URL. سجل `screen/control/source/route/contract/auth/data class/state/evidence/status`.

**إغلاق:** 12/12 بنود وظيفية حسب النطاق، route parity، لقطات 1440×900 و390×844 وصورة مرجعية من revision الصحيح؛ accessibility keyboard/focus/contrast/reduced-motion. لا تدّعِ visual pass من prototype وحده.

## 11 — Analytics, SEO, monitoring, procurement

تحقق من project/property المرتبط رسميًا قبل نسبة أحداث PostHog/Sentry/GA4. لا ترسل prompts أو reasons أو email أو hashes حساسة. راجع noindex للخاص، sitemap/canonical، وhealth/error monitoring. Procurement/self-host/air-gap تبقى مطالبات غير متحققة حتى اختبار تثبيت واستعادة معزول وتصريح egress.

**إغلاق:** حدث اصطناعي واحد مصرح ومثبت في property الصحيح، لا tag مزدوج أو خرق CSP؛ مؤشرات القياس مفصولة عن dev. وثائق السيادة/الاحتفاظ مسودات لمراجعة المختص وليست اعتمادًا.

## 12 — Independent final release gate

على SHA مرشح مثبت، أعد حساب scorecard الأصلية ذات 78 معيارًا وأوزانها دون تغيير، وأعد فقط الاختبارات المناسبة المتاحة/المصرح بها. افصل source/local/staging/live، وأدرج الصفر/الفشل/الحجب كما هو. تحقق من كل P0 و12 عنصر MagicPath وسجل Hero وrollback. لا تنشر.

**إغلاق:** صفر P0، ≥80% لكل محور وفق العقد، 100% للشروط الحرجة، نتائج E2E/CI والبيئات الحية مثبتة، mismatch MagicPath محسوم، موافقات المزود/البيانات والـdeployment موثقة. سلّم قرارًا مستقلًا لكل PUBLIC SYNTHETIC / PUBLIC LIVE AI / 48H / COMMERCIAL. إذا بقي دليل حرج مفقود فالنتيجة NO-GO؛ النشر يتطلب طلبًا/موافقة منفصلة.
