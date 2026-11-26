# خطة delta — Production (P02)

**الحالة:** BLOCKED — NOT APPLIED. بوابة P15 لم تُفتح.

**المصدر:** young-frog-60183055 / br-young-bird-b43proeb (قراءة فقط 2026-11-26).

## 1. الأساس الحقيقي

- 31 جدولًا في public — مطابق تمامًا لـLIVE_BASELINE_TABLES (لا مفقود ولا إضافي).
- 2/31 فقط لها سياسة (سياستان)؛ لا aigas_runtime ولا aigas_app_login ولا ledger.
- PG 18.7، region aws-us-east-2.
- لا تُشغّل 0011/0012/0013/0019 على fresh؛ delta يبدأ من 0013 بعد فحص الشكل.

## 2. الشروط المسبقة قبل P15

1. فتح بوابة P15 صراحةً مع موافقة مالك DB.
2. نسخة احتياطية/نقطة استعادة مُثبتة بrestore rehearsal موثق.
3. --expected-host و--expected-database مثبتان؛ DATABASE_URL_UNPOOLED من مخزن الأسرار.
4. --confirm-live-baseline إلزامي؛ أي انحراف عن الـ31 جدولًا يوقف التنفيذ.
5. مطابقة CHECKSUMS.txt مع migrations/.

## 3. التنفيذ المخطط (بعد P15 فقط)

```bash
node scripts/apply-migrations.mjs --mode delta --dry-run
node scripts/apply-migrations.mjs --mode delta --confirm-live-baseline \
  --expected-host <approved-host> --expected-database <approved-db>
```

11 ملف أساس + 33 خطوة DELTA_ORDER حتى 0047 = 44 إيصالًا متوقعًا بإيصالات وchecksums حقيقية.

## 4. التحقق المستهدف

- 54 جدولًا، 54/54 سياسة RLS، 112 سياسة، دورا runtime/login بالسمات المطلوبة.
- دوال start/read(uuid) وprosecdef/search_path مثبت وصفر صلاحية عميل.
- عزل مؤسستين لكل أنواع الوصول وaigas_client_deny على كل جدول.
- إثبات backup/restore وrollback بلا فقد بيانات اصطناعية.

## 5. التراجع

استعادة نقطة الاستعادة كاملة؛ لا تعديل إيصالات يدويًا، ولا اعتبار البناء المحلي دليلًا على Production.
