# Data Processing

## وش يصير للبيانات
Backend يقرأ Excel عبر `excelService.js`، يحدد header row، يحتفظ بالحقول الأصلية داخل raw، ثم يمرر الصفوف إلى processing/mapping لإنتاج سجلات قابلة للعرض.


## المسار الأساسي
`/BRIGHTAI/reports/internal-links/ALL_ITEMS_MAIS_with_life_years.xlsx`

الملف يتم تحديثه أسبوعياً حسب المطلوب التشغيلي. القراءة لازم تكون من Backend فقط، وأي ربط مباشر من Frontend يعتبر Not Implemented وغير مقبول أمنياً.

## الأعمدة المتوقعة
- Item Code
- Item Name
- Batch Number
- UOM
- Quantity
- Rate
- Stock Value
- Manufacturing Date
- Life Years
- Expiry Date
- Rpt Date
- Age %
- Remaining %
- Total Life
- Pass
- Rpt-Date

## Related Docs
- [Data API](../04-api/data-api.md)
- [Realtime Updates](./realtime-updates.md)
- [Testing Strategy](../06-testing/testing-strategy.md)
- [Troubleshooting](../07-deployment/troubleshooting.md)

## التعامل مع البيانات غير النظيفة
- بيانات فارغة: يتم تجاهلها أو عرضها كقيمة ناقصة حسب الحقل.
- تواريخ غير صحيحة: Needs Verification وتدخل ضمن warnings.
- أرقام غير قابلة للتحويل: لا تستخدم في KPIs المالية إلا بعد تنظيف.
- Grand Total: يستبعد من التفاصيل لأنه ملخص وليس سجل.

