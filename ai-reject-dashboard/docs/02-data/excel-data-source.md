# Excel Data Source

## الهدف
توثيق مصدر Excel الرسمي الذي يعتمد عليه المشروع في قراءة بيانات البنود والعمر الافتراضي والمخزون.


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

## حالات الخطأ
- الملف غير موجود: API يرجع warning وقد يستخدم demo fallback.
- الملف مقفل أو غير قابل للقراءة: تعرض الصفحة API unavailable أو Excel unavailable.
- تحديث أسبوعي فاشل: لازم يتسجل في logs ويتم إشعار الفريق.

