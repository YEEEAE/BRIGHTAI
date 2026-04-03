# قائمة إطلاق SEO وربط Google Search Console

## Google Search Console

- [ ] إضافة Property جديد من نوع `Domain` للموقع: `brightai.site`
- [ ] إكمال `DNS verification` عبر مزود الدومين والتأكد من ظهور حالة التحقق بنجاح داخل Google Search Console
- [ ] إرسال ملف `sitemap.xml` من داخل قسم `Sitemaps` والتأكد من قبوله بدون أخطاء
- [ ] مراجعة تقرير `Coverage` أو `Pages` للتأكد من عدم وجود صفحات مستبعدة أو أخطاء فهرسة غير متوقعة
- [ ] استخدام `URL Inspection` لأهم الصفحات الرئيسية وطلب الفهرسة عند الحاجة
- [ ] مراجعة تقرير `Core Web Vitals` على الجوال وسطح المكتب ومعالجة أي صفحات تحمل حالة `Poor` أو `Needs improvement`

## تحقق نهائي قبل الإطلاق

- [ ] التأكد من أن جميع روابط `canonical` تشير إلى `https://brightai.site/` فقط، وليس إلى أي نطاق فرعي أو رابط Render مؤقت

## Render قبل الإطلاق

- [ ] التأكد من تفعيل `HTTPS` وأن الموقع يعمل بدون تحذيرات شهادة على `https://brightai.site`
- [ ] مراجعة إعدادات `redirects` بحيث يتم تحويل أي نسخة غير أساسية إلى النطاق الأساسي `brightai.site`
- [ ] مراجعة `headers` المهمة، خصوصاً `X-Robots-Tag`، والتأكد من عدم وجود أي قيمة تمنع الأرشفة مثل `noindex`
- [ ] فتح `robots.txt` والتأكد من أنه يسمح بالأرشفة ويشير إلى `https://brightai.site/sitemap.xml`
