# Technical Decisions

## القرارات الحالية
- Excel هو مصدر البيانات الحالي لأنه متوفر للتجربة والربط الأسبوعي.
- Gemini يتم عبر Backend لحماية GEMINI_API_KEY وتقليل البيانات.
- ذاكرة المحادثة مؤقتة فقط لتقليل مخاطر التخزين الدائم.
- اسم النموذج ثابت "صقر AI" للحفاظ على هوية داخلية موحدة.
- التوثيق مكتوب بصياغة داخلية باسم يزيد لأنه QC Compliance يجهز مواد تجربة واختبار، وليس جهة اعتماد نهائية.

## Related Docs
- [Pending Decisions](./pending-decisions.md)
- [Known Limitations](./known-limitations.md)
- [Security Overview](../05-security/security-overview.md)

