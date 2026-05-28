# Data Quality Rules

## قواعد جودة البيانات
- لا تعتمد سجلات بدون Item Code أو Item Name للتحليل التفصيلي إلا كحالة Needs Verification.
- Quantity وRate وStock Value لازم تكون أرقام قابلة للتحويل.
- Expiry Date وManufacturing Date لازم تكون تواريخ صالحة.
- Age % وRemaining % لازم تكون ضمن نطاق منطقي.
- Grand Total يستبعد من سجلات البنود.

## حالات التصنيف
- Implemented: تنظيف أساسي ومصدر Backend موجود.
- Partially Implemented: قواعد استبعاد Grand Total والتحقق التفصيلي تحتاج اختبار إضافي.
- Needs Verification: اختلاف أسماء الأعمدة مستقبلاً.

## Related Docs
- [Excel Schema](./excel-schema.md)
- [Testing Strategy](../06-testing/testing-strategy.md)
- [Known Limitations](../08-decisions/known-limitations.md)

