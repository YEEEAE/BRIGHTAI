# Excel Schema

## الهدف
تحديد الأعمدة المتوقعة وطريقة التعامل مع أي اختلاف في أسماء الأعمدة.


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

## قواعد schema
- الأعمدة الناقصة: Needs Verification ولا يتم افتراض قيمة تشغيلية.
- اختلاف أسماء الأعمدة مستقبلاً: يتم تحديث mapping في Backend بعد مراجعة.
- Grand Total: لا يعتبر سجل Item عادي، ويجب استبعاده من التحليلات التفصيلية.
- Rpt Date وRpt-Date: كلاهما يحتاج mapping واضح لأن الاسم قد يختلف.

