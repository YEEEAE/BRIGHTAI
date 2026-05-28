# AI Test Cases

اختبارات صقر AI تشمل الأسئلة المسموحة، الرفض، session memory، عدم كشف الأسرار، وعدم تغيير الاسم. نص الرفض المطلوب: "يزيد معلمني بأن ما أخرج عن إطار شركة ميس والعمل المؤكل له"

## Checklist
- [ ] قراءة Excel من Backend.
- [ ] تحديث Excel الأسبوعي يظهر سجلات جديدة.
- [ ] فقدان الأعمدة يعطي warning واضح.
- [ ] Gemini يعمل بمفتاح فعلي في Backend.
- [ ] صقر AI يرفض أسئلة خارج النطاق بالنص المعتمد.
- [ ] Session Memory TTL وmax messages يعملان.
- [ ] Auth/RBAC يمنع الوصول غير المصرح.
- [ ] كل صفحة تعرض Loading/Empty/Error.
- [ ] Export/report generation يعمل حسب الصلاحية.
- [ ] اسم "صقر AI" ثابت في الصفحات والوثائق.
- [ ] الوثائق لا تدعي ميزة غير منفذة.

## Related Docs
- [Excel Data Source](../02-data/excel-data-source.md)
- [AI Test Cases](./ai-test-cases.md)
- [Security Overview](../05-security/security-overview.md)
- [Troubleshooting](../07-deployment/troubleshooting.md)

