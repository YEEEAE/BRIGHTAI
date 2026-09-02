# حقيقة تغطية الاختبارات الكنسية — TEST COVERAGE TRUTH

> **المرجع الإلزامي:** التحقق المستقل المنفذ عند HEAD `d9a45b07`. لا يُعتد بأي تقرير سابق لا يعيد إنتاج الاختبارات بالكامل.

---

## 1. ملخص نتائج الاختبارات الإجمالية

| نوع السويت | العدد الإجمالي | الناجح فعلياً | الفاشل فعلياً | المحجوب | النسبة الفعلية | الحالة العامة |
|---|---|---|---|---|---|---|
| **السويتات الكنسية للوحدات (Canonical Unit)** | **74** سويتاً | **72** سويتاً | **2** سويتان (P0-1, P0-2) | 0 | **97.30%** | ❌ FAIL في HEAD |
| **سويتات القبول المتكاملة (Canonical E2E)** | **28** سويتاً | **4** سويتات | **1** سويت (P0-3) | **23** سويتاً | **14.29%** | ❌ BLOCKED عند سويت 5 |
| **حراس البنية التحتية (Meta Guards)** | **3** حراس | **3** حراس | 0 | 0 | **100%** | ✅ PASS |
| **سكريبتات الاختبار المصنفة غير القابلة للتشغيل** | **4** سكريبتات | N/A | N/A | N/A | 100% مصنفة | ✅ معلنة بالأسباب |
| **السلسلة الكنسية التراكمية (Full Cumulative Run)** | **102** سويتاً | **76** سويتاً | **3** سويتات | **23** سويتاً | **74.51%** | ❌ **FAIL / NO-GO** |

---

## 2. تفصيل السويتات الفاشلة والمسببة للتعليق (P0 Failures)

### 1. `test:observability` (P0-1)
- **الأمر:** `pnpm run test:observability`
- **الملف:** `scripts/test-observability.mjs:18`
- **سبب الفشل:** عدم تطابق نص الخطأ الآمن المتوقع في الاختبار (`'Something went wrong. Please try again.'`) مع النص الحقيقي المحسن في الكود (`'We couldn’t complete the request. The save state is unknown. Check the record before trying again.'`).
- **رمز الخروج:** Exit code 1 (AssertionError).

### 2. `test:a11y-ergonomics-100` (P0-2)
- **الأمر:** `pnpm run test:a11y-ergonomics-100`
- **الملف:** `scripts/test-a11y-ergonomics-100.mjs`
- **سبب الفشل:** فشل بوابة المصدر: `A11Y-ERGONOMICS-100-EVIDENCE.md must exist beside this gate`. الملف نُقل وحُذف أثناء عملية دمج الأدلة السابقة، مما كسر شرط البوابة.
- **رمز الخروج:** Exit code 1.

### 3. `e2e:delete-request` (P0-3)
- **الأمر:** `node apps/qc-task-manager/scripts/e2e-delete-request.mjs`
- **الملف:** `scripts/e2e-delete-request.mjs:196`
- **سبب الفشل:** يبحث محدد Playwright عن زر يحمل النص: `button:has-text("Confirm deletion")`، بينما تم تعديل نص الزر في الواجهة (`ReviewDeleteRequestDialog.tsx:83`) إلى `Delete task permanently`. يتوقف السكريبت بانتظار الزر حتى انتهاء المهلة (Timeout)، مما يؤدي لرمي استثناء يوقف مشغل `e2e-acceptance.mjs` بالكامل عند السويت رقم 5.
- **الأثر الحاسم:** حجب 23 سويت E2E تالية عن التنفيذ في الفحص الشامل.

---

## 3. السكريبتات المصنفة في السجل (Classified Non-runnable)

1. `scripts/test-manifest.mjs`: وحدة تصدير بيانات السجل للمشغل والحارس (Data Module).
2. `scripts/test-manifest-guard.mjs`: الحارس الكنسي نفسه؛ يمثل الأمر `test:manifest`.
3. `scripts/test-report-pdf-arabic.mjs`: سكريبت تشخيص يدوي لتوليد PDF العربي — معطل ومصنف كخلل مفتوح (TypeError في تشكيل الحروف).
4. `scripts/test-responsive-e2e-contract.mjs`: حارس عقد الأسلاك والتوصيل لـ E2E المتجاوب.

النتيجة: **صفر اختبارات يتيمة (0 orphan tests)**. سلامة السجل البرمجي مثبتة 100%، لكن الشجرة الفعلية مكسورة بـ 3 P0 حقيقية.
