# تقرير اتساق الخريطة و404 — 2026-11-17

الحالة: DONE محليًا؛ التشغيل الحي مختلف ولم يُعدّل. لا نشر ولا إرسال Search Console ولا commit/push.

## التعديل المحلي
- `src/server/seo/indexability.mjs`: أصل الموقع وسياسة المسارات العامة موحدان بين Astro وحارس البناء؛ استبعاد app/auth/api/private/demo/healthz/404/README، بما فيها جذر كل سطح.
- يبقى HTML المبني مصدر قائمة الصفحات المفهرسة: يلزم robots صريح، metadata مكتملة، canonical واحد مطابق لملف الصفحة وأصل الموقع، بلا query أو fragment، ومساواة كاملة بلا تكرار مع XML. llms.txt يُشتق من القائمة نفسها.
- تشديد حارس البناء لمنع إدراج أي source من redirects.json في الخريطة. التحويل الموجود `/sitemap.xml`→`/sitemap-index.xml` لم يحتج تغييرًا.
- خادم Node يعيد صفحة404 المولدة برمز404 على `/404` و`/404/` و`/404.html` لـGET/HEAD قبل خدمة static، مع noindex؛ middleware يحفظ404 لنفس السطح. المسارات المفقودة تبقى لدى Astro ولا تُحوّل للرئيسية.
- robots.txt يشير أصلًا للخريطة الصحيحة ولا يحجب crawler عن قراءة noindex؛ لم نضف Disallow للأسطح التي تحتاج رؤية noindex. لا إضافة lastmod؛ XML المحلي الناتج لا يحتويه.

## ما نجح محليًا
| الفحص | النتيجة |
|---|---|
| build باستخدام lockfile Astro6.4.8 وNode22.22.2 في نسخة معزولة دون أسرار | PASS؛57 صفحة عامة |
| كل URL في الخريطة: GET+HEAD،canonical،robots،الاستثناءات | PASS؛57/57؛لا redirect/noindex/private/demo |
| sitemap-index وجميع ملفات XML التابعة | PASS؛تطابق كامل مع HTML المفهرس؛لا lastmod |
| `/sitemap.xml` GET+HEAD | 301 مباشر إلى `/sitemap-index.xml` |
| `/404/` و`/404.html` GET+HEAD | 404 |
| مسار مفقود في الجذر وآخر تحت knowledge،GET+HEAD | 404 دون تحويل |
| aliases والروابط الداخلية | PASS؛138 تحويلًا/276 فحص طريقة؛3304 مرجعًا؛0 مكسور |
| unit | PASS؛5 اختبارات |
| Chrome على `/404/` | عرض عربي سليم:عنوان الخطأ وروابط العودة موجودة؛status مثبت بفحصHTTP |
| تطابق المصدر المختبر مع working tree | PASS للملفات التنفيذية الخمسة |

لم نستبدل node_modules الحالية؛ استخدمنا `/tmp/brightai-discovery-audit/repo` باعتمادات lockfile الموجودة هناك، ونسخنا المصدر الحالي دون .env أو .git. `build.log` و`routes.log` و`unit.log` أدلة هذه الجولة؛ نجاحها لا يثبت نشرًا. اختبارات المصادقة وقواعد البيانات خارج النطاق.

## ما بقي مختلفًا حيًا
- الفحص مؤرخ بدقة في `results.json`؛ قراءة عامة عبر Cloudflare، وليس اتصالًا مباشرًا بالأصل.
- الخريطة الحالية `/sitemap-index.xml` تعرض57 URL؛ كلها اجتازت GET+HEAD200 وcanonical مطابق وrobots دون noindex.
- `/sitemap.xml` يعيد200 XML قديمًا يحوي264 URL بدل301. فُحص كل URL فيه أيضًا: اتحاد القائمتين311 URL فريدًا،310 تجتاز شروطHTTP/metadata والسياسة، و`https://brightai.live/demo/` يعيد200 و`index, follow` وهو مخالف لاستبعادdemo. مرور الصفحات القديمة منHTTP لا يعني أنها تنتمي للمصدر الحالي أو يُنصح بإبقائها في الخريطة.
- `/404/` و`/404.html` يعيدان200 في GET/HEAD؛ soft404 لا يزال حيًا. مسارا الاختبار المفقودان يعيدان404 حقيقيًا بالفعل.
- robots.txt وllms.txt الحيان200؛ robots يشير لـsitemap-index، وروابط صفحات llms الـ57 تطابق الخريطة الحالية؛ لا يعالجان بقاء المدخل القديم متاحًا.
- رصد `CF-Cache-Status: MISS` و`rndr-id` وLast-Modified قديم في رد الخريطة القديمة؛ يرجح تقديم upstream لها، ولا يثبت وحده أي قاعدة أو خدمة أصل. لم نفحص إعدادCloudflare أو Render مباشرة، فلا ننسب السبب النهائي لكاش الحافة وحده.

## المخرجات وإعادة الفحص
- `results.json`: كل URL ونتيجته وcanonical وrobots وGET/HEAD ورؤوس الخرائط؛`summary.json` ملخص عددي.
- `live-discovery.json`: robots وllms الحيان.
- `OPERATOR-PLAN.md`: خطة منفصلة لتحديد الأصل،اختيار مسارNode أوStatic أوالحافة،purge محدود،معايير قبول ورجوع؛لم تُنفذ.
- أمر التدقيق بعد تشغيل البناء النهائي: `SEO_LOCAL_ORIGIN=http://127.0.0.1:4467 node scripts/audit-sitemap-contract.mjs audit/sitemap-contract-2026-11-17`؛يتصل بالموقع الحي قراءةً فقط،ويفشل عند غياب الخريطة المحلية أوتكرارها أوفشلURL محلي أوlastmod أوprobe404/redirect. نتائج الحي مستقلة ولا تُحوّلها نجاحات المحلي إلىPASS.
