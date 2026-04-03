# تقرير الروابط والمسارات المكسورة قبل الإصلاح

- تاريخ التقرير: 2026-04-01T00:59:42.830Z
- عدد الملفات المفحوصة: 345
- إجمالي المراجع المكتشفة: 19804
- المراجع الداخلية المفحوصة: 14469
- الروابط/المسارات المكسورة: 10
- المكسور القابل للإصلاح التلقائي: 0
- فرص توحيد نمط الروابط: 47

## الملفات الأعلى أعطالًا

| الملف | عدد الأعطال |
| --- | ---: |
| frontend/js/en-interview-app.js | 4 |
| frontend/js/interview-app.js | 4 |
| .venv/lib/python3.14/site-packages/setuptools/tests/indexes/test_links_priority/external.html | 1 |
| .venv/lib/python3.14/site-packages/setuptools/tests/indexes/test_links_priority/simple/foobar/index.html | 1 |

## تفاصيل الأعطال

| الملف | السطر | النوع | المرجع | الاقتراح | السبب |
| --- | ---: | --- | --- | --- | --- |
| .venv/lib/python3.14/site-packages/setuptools/tests/indexes/test_links_priority/external.html | 2 | attr | /foobar-0.1.tar.gz#md5=1__bad_md5___ | — | المسار غير موجود |
| .venv/lib/python3.14/site-packages/setuptools/tests/indexes/test_links_priority/simple/foobar/index.html | 2 | attr | /foobar-0.1.tar.gz#md5=0_correct_md5 | — | المسار غير موجود |
| frontend/js/en-interview-app.js | 818 | js-key | <Career path 1> | — | المسار غير موجود |
| frontend/js/en-interview-app.js | 819 | js-key | <Career path 2> | — | المسار غير موجود |
| frontend/js/en-interview-app.js | 842 | js-key | Internship | — | المسار غير موجود |
| frontend/js/en-interview-app.js | 843 | js-key | Junior Tech Support | — | المسار غير موجود |
| frontend/js/interview-app.js | 818 | js-key | <Career path 1> | — | المسار غير موجود |
| frontend/js/interview-app.js | 819 | js-key | <Career path 2> | — | المسار غير موجود |
| frontend/js/interview-app.js | 842 | js-key | فترة تدريبية (Internship) | — | المسار غير موجود |
| frontend/js/interview-app.js | 843 | js-key | دعم فني مبتدئ | — | المسار غير موجود |

