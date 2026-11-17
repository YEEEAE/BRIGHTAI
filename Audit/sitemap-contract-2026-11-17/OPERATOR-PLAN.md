# خطة تشغيل مستقلة — لم تُنفذ

النطاق: إزالة استجابة `/sitemap.xml` القديمة من الأصل أو الحافة بعد اعتماد تشغيل منفصل. لا نشر ولا تعديل Cloudflare/Render ولا Search Console ضمن هذه المهمة.

## العقد المطلوب
- GET وHEAD لـ`https://brightai.live/sitemap.xml` → 301 بخطوة واحدة إلى `/sitemap-index.xml`؛ query محفوظ.
- `/sitemap-index.xml` → 200 XML يحيل إلى `/sitemap-0.xml`؛ الأخير 57 رابطًا حسب artifact المراجع لهذه المهمة، لا lastmod بتاريخ البناء.
- كل URL في الخريطة النهائية → GET/HEAD 200 دون تحويل؛ canonical واحد يطابق URL تمامًا؛ لا noindex أو private أو demo.
- `/404/` و`/404.html` والمسارات المفقودة → 404، دون تحويل للرئيسية أو soft 404.

## 1. إثبات الجهة التي تقدم الملف قبل أي تغيير
1. احفظ GET/HEAD والرؤوس والمتن وSHA-256 لكل من `/sitemap.xml` و`/sitemap-index.xml` و`/sitemap-0.xml` من الدومين العام، ثم من hostname الأصل الفعلي المثبت في إعداد Cloudflare. سجّل UTC وservice/deploy/SHA ونوع الخدمة وpublish directory. لا تستنتج hostname الأصل من ذاكرة سابقة.
2. افحص قراءةً فقط Cloudflare: DNS target، Workers routes، Redirect Rules، Origin Rules، Cache Rules، وأي Page Rule قديم لهذه المسارات. افحص Render route/redirect configuration وملفات artifact المنشور. خزّن نسخة الإعداد السابق للرجوع.
3. قارن المحتوى والـhash؛ بقاء الملف القديم على الأصل يعني أن purge وحده لا يعالجه. `CF-Cache-Status: MISS` مع `rndr-id` في لقطة هذه المهمة يرجح وصوله من upstream، لكنه لا يثبت غياب Worker أو يحدد إعداد الأصل.

## 2. اختر مسارًا واحدًا حسب نوع الاستضافة المثبت
### أصل Node
- جهّز artifact من lockfile وNode22، راجع build ونتيجة `scripts/audit-sitemap-contract.mjs` و`verify-routes`.
- تشغيل الدخول عبر `node scripts/server.mjs` إلزامي؛ تشغيل adapter مباشرة يتجاوز حارس الملفات prerendered.
- `redirects.json` يحتوي أصلًا `/sitemap.xml` → `/sitemap-index.xml`؛ الخادم يطبقه على GET/HEAD قبل خدمة الملفات.
- افحص على hostname الأصل بعد النشر المصرّح: 301 وLocation الصحيح، الوجهة 200 XML، ثم فحص كامل الخريطة و404. لا تعمم قبول Node على static hosting.
### أصل Static
- لا يعتمد هذا النوع على `scripts/server.mjs` أو Astro middleware. ثبّت قاعدة Redirect 301 دقيقة `/sitemap.xml` → `/sitemap-index.xml` في إعداد الاستضافة، مع حفظ query واختبار GET/HEAD. لا تستخدم rewrite 200.
- أزل artifact القديم من publish directory عند إعداد الإصدار المعتمد. الملف الجذري `sitemap.xml` في المستودع ليس ضمن `public/` ولا ينشره Astro؛ نسخ جذر المستودع كاملًا قد يعيد المشكلة.
- احفظ status404 لصفحة الخطأ وfallback؛ لا تضف catch-all200. معالجة explicit `/404/` تحتاج قاعدة استضافة فعلية تعيد404، أو انتقل إلى Node بخطة مستقلة؛ لا تفترض أن HTML وحده يضبط status.
### حافة Cloudflare عند تعذر تغيير الأصل مباشرة
- قاعدة Redirect واحدة: hostname يساوي `brightai.live` وURI path يساوي `/sitemap.xml`؛ الوجهة `https://brightai.live/sitemap-index.xml`؛ status301 وPreserve query string مفعّل. راجع أولوية Workers/redirects الحالية قبل التفعيل.
- لا تستهدف `/sitemap-index.xml` أو `/sitemap-0.xml` ولا تستخدم wildcard للخريطة كلها. إن كانت Workers تسيطر على المسار، عالج داخل المسار المالك أو أزل التعارض بتغيير معتمد؛ لا تضف قواعد متنافسة.
- تبقى معالجة الأصل مطلوبة لتجنب عودة الملف القديم عند إزالة القاعدة؛ وثّق أن هذا إصلاح حافة فقط. لا تستخدم redirect لمعالجة404.

## 3. الكاش والتحقق بعد التغيير المعتمد
1. بعد نجاح الأصل أو القاعدة، نفّذ purge محدودًا لروابط الخرائط الثلاثة وأشكال query المرصودة، و`/404/` و`/404.html` إذا تغيرت؛ لا purge شامل. راجع cache key الفعلي وCache Rules قبل تحديد النطاق.
2. اختبر cold ثم warm GET/HEAD من نقطتي شبكة مستقلتين؛ احفظ Location/CF-Cache-Status/Age/ETag/Cache-Control/Content-Type والمتن. طلب no-cache أو query عشوائي وحده لا يثبت إزالة الكاش.
3. شغّل فحصًا كاملًا لكل URL في الخريطة، وaliases، ومسارات مفقودة عشوائية في الجذر وknowledge. افحص تطابق robots.txt وllms.txt مع القائمة، وعدم وجود XML قديم عبر `/sitemap.xml`.
4. القبول: تحويل واحد و57/57 بلا فشل للـartifact المعتمد،404 حقيقي، لا demo/private/noindex في الخريطة، canonical نهائي مطابق. إذا تغير المحتوى عمدًا أعد جرد القائمة بدل فرض العدد57.
5. لا إرسال Search Console في هذه الخطة. أبقِ توثيق الأدلة وروابط الخرائط للمراجعة فقط.

## الرجوع
- أوقف التنفيذ عند loop/5xx/خريطة غير XML/اختلاف canonical أو تضرر صفحات عامة. أعد الإصدار أو القاعدة السابقة المعروفة، ثم purge محدود لنفس المفاتيح وأعد probes.
- لا تسترجع soft404 أو catch-all200 عمدًا؛ إن كان الإصدار السابق يحتويهما، أوقف الترقية وأعلن النقص بدل اعتباره نجاحًا.
