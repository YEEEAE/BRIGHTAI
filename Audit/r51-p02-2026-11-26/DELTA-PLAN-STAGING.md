# خطة delta — Staging (P02)

**الحالة:** NOT APPLIED — خطة فقط. لم تُكتب أي تغييرات على Staging في هذه الجلسة.
**المصدر:** lucky-salad-43566291 / br-rough-wind-bdkmg13n (قراءة فقط 2026-11-26).
**الهدف المرجعي:** raspy-surf-09603889 / br-noisy-frog-bdwi4d6d بعد 0047.

## 1. القياس الحالي (من الكتالوج)

| البند | Staging الآن | الهدف |
|---|---:|---:|
| جداول public | 43 | 54 |
| جداول لها سياسات | 43/43 | 54/54 |
| إجمالي السياسات | 93 | 112 |
| إيصالات APPLIED | 32 (حتى 0036) | 43 (حتى 0047) |
| aigas_runtime | موجود | NOBYPASSRLS/NOINHERIT |
| aigas_app_login | غائب | LOGIN/NOINHERIT، SET TRUE بلا direct grants |
| start(uuid)/read(uuid) self-service | غائبتان (الإصدار القديم بلا وسيط موجود) | موجودتان |
| aigas_agent_start(uuid)/aigas_agent_read(uuid) | غائبتان | موجودتان |

الفرق الكتالوجي: catalog-diff.json؛ اللقطة: catalog-snapshot.json.

## 2. الشروط المسبقة

1. موافقة مالك قاعدة البيانات على نافذة تغيير Staging.
2. نقطة استعادة محفوظة (Neon restore point / branch) وتجربة restore موثقة.
3. مطابقة الإيصالات الـ32 مع CHECKSUMS.txt؛ أي انحراف يوقف الخطة.
4. DATABASE_URL_UNPOOLED يُحقن من مخزن الأسرار فقط؛ لا يُطبع.
5. تثبيت --expected-host و--expected-database للهدف المصرّح به.

## 3. مسار التنفيذ

```bash
node scripts/apply-migrations.mjs --mode resume --dry-run
node scripts/apply-migrations.mjs --mode resume --confirm-existing-ledger \
  --expected-host <staging-host> --expected-database <staging-db>
```

ذيل السجل فقط: 0037 0038 0039 0040 0041 0042 0043 0044 0045 0046 0047.
resumeOrder يرفض الإيصال غير المطابق أو الثقب أو صف FAILED قبل أي كتابة.

## 4. التحقق بعد التطبيق

- to_regprocedure للدوال الأربع start/read(uuid) غير NULL.
- 54 جدولًا، 54/54 بسياسات، 112 سياسة، 43 إيصال APPLIED وSHA مطابق لـCHECKSUMS.txt.
- aigas_runtime بلا superuser/bypassrls؛ aigas_app_login LOGIN/NOINHERIT وSET TRUE, INHERIT FALSE وصفر منح جداول مباشرة.
- دوال aigas_%: prosecdef وproconfig search_path=pg_catalog, public وصفر EXECUTE للعميل.
- محاولات cross-tenant لكل أنواع الوصول → صفر صفوف و42501/23514.
- verify-agent-persistence.sql: write test يُرجَع دائمًا.

## 5. التراجع

إعادة الهدف إلى نقطة الاستعادة كاملة؛ لا حذف انتقائي. أي صف FAILED يُسجَّل برسالته الحقيقية.
