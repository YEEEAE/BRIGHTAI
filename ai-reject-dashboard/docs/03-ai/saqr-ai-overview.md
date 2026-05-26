# صقر AI Overview

## التعريف
"صقر AI" هو مساعد تحليلي داخلي لمشروع ai-reject-dashboard. الاسم ثابت ولا يترجم ولا يتغير حتى في الوثائق الإنجليزية.

## الدور
يساعد في تلخيص بيانات الجودة والإنتاج والمالية، ويقترح أسئلة وإجراءات مراجعة. مخرجات "صقر AI" استشارية فقط، ولا تعتبر قرار جودة نهائي. قرارات الجودة النهائية ترجع إلى QCM/QAM حسب الإجراء الداخلي.

## طريقة العمل
- النموذج المستخدم: Gemini AI Model Flash 2.5 عبر `gemini-2.5-flash`.
- الاتصال من Backend فقط.
- API Key لا يظهر أبداً في Frontend.
- لا يستقبل كامل Excel إلا إذا كان ضرورياً جداً.
- البيانات المرسلة مختصرة: metrics، selected records، page context، user question، recent session messages.


## Related Docs
- [AI API](../04-api/ai-api.md)
- [Security Overview](../05-security/security-overview.md)
- [Prompt Injection Protection](./prompt-injection-protection.md)
- [AI Test Cases](../06-testing/ai-test-cases.md)

