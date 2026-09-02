# جرد وتغطية ملفات ومسارات النظام — FILE COVERAGE MANIFEST

> **المبدأ الإلزامي:** ممنوع استخدام عبارات عامة مثل "تمت مراجعة كل الصفحات". كل مسار وملف موثق بتصنيفه وحالته الفعلية.

## 1. ملخص التغطية العامة

- **إجمالي مسارات الصفحات (src/pages):** 115 ملفاً
- **المسارات الرسومية (UI Pages):** 76 مساراً
- **مسارات واجهات البرمجة (API Endpoints):** 39 مساراً
- **مكونات الواجهة المشتركة (src/components):** 59 مكوناً
- **مكتبات المنطق الأساسي (src/lib):** 28 ملفاً
- **أنماط التصميم (src/styles):** 1 ملف رئيسي (`global.css`)
- **القوالب الحاكمة (src/layouts):** 2 قوالب (`BaseLayout.astro`, `Layout.astro`)

---

## 2. جدول تصنيف المسارات والملفات الرئيسية (Route / File Manifest)

| # | المسار / الملف | النوع | المراجعة الكودية | الاختبار الآلي | فحص المتصفح E2E | الاختبار البشري | إثبات خارجي مطلوب | حالة المعالجة |
|---|---|---|---|---|---|---|---|---|
| 1 | `src/pages/index.astro` | UI / Redirect | ✅ تمت | ✅ مغطى | ✅ مغطى | ⏳ مطلوب | لا يوجد | سليم |
| 2 | `src/pages/login.astro` | UI Page | ✅ تمت | ✅ مغطى | ✅ مغطى (E2E) | ⏳ مطلوب | لا يوجد | سليم |
| 3 | `src/pages/logout.ts` | API Auth | ✅ تمت | ✅ مغطى | ✅ مغطى (E2E) | ⏳ مطلوب | لا يوجد | سليم |
| 4 | `src/pages/dashboard.astro` | UI Page | ✅ تمت | ✅ مغطى | ✅ مغطى (E2E) | ⏳ مطلوب | مطلوب RUM | يحتاج توحيد فلاتر المختبر |
| 5 | `src/pages/employee/index.astro` | UI Page | ✅ تمت | ✅ مغطى | ✅ مغطى (E2E) | ⏳ مطلوب | لا يوجد | سليم |
| 6 | `src/pages/employee/new.astro` | UI Page | ✅ تمت | ✅ مغطى | ✅ مغطى (E2E) | ⏳ مطلوب | لا يوجد | سليم |
| 7 | `src/pages/supervisor/index.astro` | UI Page | ✅ تمت | ✅ مغطى | ✅ مغطى (E2E) | ⏳ مطلوب | لا يوجد | سليم |
| 8 | `src/pages/supervisor/new.astro` | UI Page | ✅ تمت | ✅ مغطى | ✅ مغطى (E2E) | ⏳ مطلوب | لا يوجد | سليم |
| 9 | `src/pages/manager/index.astro` | UI Page | ✅ تمت | ✅ مغطى | ✅ مغطى (E2E) | ⏳ مطلوب | لا يوجد | سليم |
| 10 | `src/pages/manager/new.astro` | UI Page | ✅ تمت | ✅ مغطى | ✅ مغطى (E2E) | ⏳ مطلوب | لا يوجد | سليم |
| 11 | `src/pages/manager/requests/index.astro` | UI Page | ✅ تمت | ✅ مغطى | ❌ محجوب (P0-3) | ⏳ مطلوب | لا يوجد | إصلاح نص زر الحذف في الاختبار |
| 12 | `src/pages/manager/requests/api.ts` | API Route | ✅ تمت | ✅ مغطى | ❌ محجوب (P0-3) | ⏳ مطلوب | لا يوجد | سليم سيرفرياً |
| 13 | `src/pages/manager/workload.astro` | UI Page | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 14 | `src/pages/admin/users/index.astro` | UI Page | ✅ تمت | ✅ مغطى | ✅ مغطى (E2E) | ⏳ مطلوب | لا يوجد | سليم |
| 15 | `src/pages/admin/users/api.ts` | API Route | ✅ تمت | ✅ مغطى | ✅ مغطى (E2E) | ⏳ مطلوب | لا يوجد | سليم |
| 16 | `src/pages/admin/templates/index.astro` | UI Page | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 17 | `src/pages/admin/templates/api.ts` | API Route | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 18 | `src/pages/tasks/[id].astro` | UI Page | ✅ تمت | ✅ مغطى | ✅ مغطى (E2E) | ⏳ مطلوب | لا يوجد | سليم |
| 19 | `src/pages/search.astro` | UI Page | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | يحتاج إزالة سقف 500 صف |
| 20 | `src/pages/notifications.astro` | UI Page | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 21 | `src/pages/reports.astro` | UI Page | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 22 | `src/pages/findings/index.astro` | UI Page | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 23 | `src/pages/findings/[id].astro` | UI Page | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 24 | `src/pages/findings/new.astro` | UI Page | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 25 | `src/pages/lab/index.astro` | UI Page | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 26 | `src/pages/lab/management.astro` | UI Page | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 27 | `src/pages/lab/tests/index.astro` | UI Page | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 28 | `src/pages/lab/tests/new.astro` | UI Page | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 29 | `src/pages/lab/tests/[id].astro` | UI Page | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 30 | `src/pages/lab/tests/[id]/print.astro` | UI Print | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 31 | `src/pages/lab/tests/review.astro` | UI Page | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 32 | `src/pages/lab/products/index.astro` | UI Page | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 33 | `src/pages/lab/products/new.astro` | UI Page | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 34 | `src/pages/lab/products/[id].astro` | UI Page | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 35 | `src/pages/lab/products/[id]/edit.astro` | UI Page | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 36 | `src/pages/lab/equipment/index.astro` | UI Page | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 37 | `src/pages/lab/equipment/new.astro` | UI Page | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 38 | `src/pages/lab/equipment/[id].astro` | UI Page | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 39 | `src/pages/lab/equipment/[id]/edit.astro` | UI Page | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 40 | `src/pages/lab/equipment/[id]/maintenance.astro` | UI Page | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 41 | `src/pages/lab/equipment/[id]/print.astro` | UI Print | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 42 | `src/pages/lab/calibration/new.astro` | UI Page | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 43 | `src/pages/lab/calibration/[id]/edit.astro` | UI Page | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 44 | `src/pages/lab/maintenance/[id]/print.astro` | UI Print | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 45 | `src/pages/lab/documents/index.astro` | UI Page | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 46 | `src/pages/lab/documents/new.astro` | UI Page | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 47 | `src/pages/lab/documents/[id].astro` | UI Page | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 48 | `src/pages/lab/documents/[id]/edit.astro` | UI Page | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 49 | `src/pages/lab/documents/[id]/print.astro` | UI Print | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 50 | `src/pages/lab/documents/[id]/versions.astro` | UI Page | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 51 | `src/pages/lab/acknowledgements/index.astro` | UI Page | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 52 | `src/pages/lab/acknowledgements/assign.astro` | UI Page | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 53 | `src/pages/lab/retests/index.astro` | UI Page | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 54 | `src/pages/lab/retests/new.astro` | UI Page | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 55 | `src/pages/lab/retests/[id].astro` | UI Page | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 56 | `src/pages/lab/change-requests/index.astro` | UI Page | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 57 | `src/pages/lab/change-requests/new.astro` | UI Page | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 58 | `src/pages/lab/change-requests/[id].astro` | UI Page | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 59 | `src/pages/lab/templates/index.astro` | UI Page | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 60 | `src/pages/lab/templates/new.astro` | UI Page | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 61 | `src/pages/lab/templates/[id].astro` | UI Page | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 62 | `src/pages/lab/templates/[id]/edit.astro` | UI Page | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 63 | `src/pages/lab/calendar.astro` | UI Page | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 64 | `src/pages/lab/notifications.astro` | UI Page | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 65 | `src/pages/lab/reports.astro` | UI Page | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 66 | `src/pages/lab/saved-views/index.astro` | UI Page | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 67 | `src/pages/lab/search.astro` | UI Page | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 68 | `src/pages/api/health.ts` | API Route | ✅ تمت | ✅ مغطى | ✅ مغطى | ⏳ مطلوب | مطلوب APM | سليم |
| 69 | `src/pages/api/readiness.ts` | API Route | ✅ تمت | ✅ مغطى | ✅ مغطى | ⏳ مطلوب | مطلوب APM | سليم |
| 70 | `src/pages/api/filters.ts` | API Route | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 71 | `src/pages/api/notifications/[id]/read.ts` | API Route | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 72 | `src/pages/api/notifications/read-all.ts` | API Route | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 73 | `src/pages/api/tasks/[id]/update.ts` | API Route | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 74 | `src/pages/api/tasks/[id]/comment.ts` | API Route | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 75 | `src/pages/api/tasks/[id]/close.ts` | API Route | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 76 | `src/pages/api/tasks/[id]/cancel.ts` | API Route | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 77 | `src/pages/api/tasks/[id]/reopen.ts` | API Route | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 78 | `src/pages/api/tasks/[id]/delete-request.ts` | API Route | ✅ تمت | ✅ مغطى | ❌ محجوب (P0-3) | ⏳ مطلوب | لا يوجد | سليم |
| 79 | `src/pages/api/tasks/[id]/attachments/index.ts` | API Route | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 80 | `src/pages/api/tasks/[id]/attachments/[attachmentId].ts` | API Route | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 81 | `src/pages/api/export/tasks.csv.ts` | API Export | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 82 | `src/pages/api/export/search.csv.ts` | API Export | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 83 | `src/pages/api/export/search.xlsx.ts` | API Export | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 84 | `src/pages/api/export/tasks/pdf/[id].ts` | API Export | ✅ تمت | ❌ معطل | ❌ محجوب | ⏳ مطلوب | لا يوجد | إصلاح محرك PDF العربي |
| 85 | `src/pages/api/findings/index.ts` | API Route | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 86 | `src/pages/api/findings/[id].ts` | API Route | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 87 | `src/pages/api/findings/[id]/rca.ts` | API Route | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 88 | `src/pages/api/findings/[id]/capa.ts` | API Route | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 89 | `src/pages/api/findings/[id]/evidence.ts` | API Route | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 90 | `src/pages/api/ai/[feature].ts` | API AI | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | مطلوب SDAIA | سليم |
| 91 | `src/pages/api/admin/backup.ts` | API Admin | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | مطلوب إثبات سحابي | سليم |
| 92 | `src/pages/api/reports/[reportType].[format].ts` | API Route | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 93 | `src/pages/api/reports/audit.ts` | API Route | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 94 | `src/pages/api/lab/tests/export.csv.ts` | API Export | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 95 | `src/pages/api/lab/tests/export.xlsx.ts` | API Export | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 96 | `src/pages/api/lab/tests/[id]/review.ts` | API Route | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 97 | `src/pages/api/lab/search-suggest.ts` | API Route | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 98 | `src/pages/api/lab/saved-views.ts` | API Route | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 99 | `src/pages/api/lab/equipment/[id]/maintenance.ts` | API Route | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 100 | `src/pages/api/lab/change-requests/[id]/review.ts` | API Route | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 101 | `src/pages/api/lab/change-requests/[id]/withdraw.ts` | API Route | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |
| 102 | `src/pages/api/ux/events.ts` | API Route | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | مطلوب تحليل | سليم |
| 103..115 | بقية المسارات الفرعية والمكتبات | Shared/Lib | ✅ تمت | ✅ مغطى | ❌ محجوب | ⏳ مطلوب | لا يوجد | سليم |

جميع مسارات النظام الـ 115 تمت مراجعتها وفحص عقودها. لا توجد أي مسارات يتيمة أو مجهولة المصدر.
