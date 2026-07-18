# Kernel

واجهة Kernel الحالية مبنية على Astro داخل `src/pages/kernel/`. المسار المنشور
يبدأ من `/kernel/`، وصفحة المحادثة الحالية هي `/kernel/chat/`.

## الصفحات الحالية

الصفحات الموجودة حالياً:

- `/kernel/`
- `/kernel/chat/`
- `/kernel/approvals/`
- `/kernel/audit/`
- `/kernel/compliance/`
- `/kernel/connectors/`
- `/kernel/evidence/`
- `/kernel/offline/`
- `/kernel/policies/`
- `/kernel/reports/`
- `/kernel/scenarios/`
- `/kernel/stats/`

صفحات Kernel تستخدم `KernelLayout.astro` ومكوّنات Kernel المشتركة من
`src/components/kernel/`، مع CSS الصفحة في `kernel/assets/css/pages/` عند الحاجة.

## محادثة Kernel

الواجهة في `src/pages/kernel/chat.astro` ترسل `POST` إلى:

```text
/api/ai/chat/
```

الـ endpoint الحالي في `src/pages/api/ai/chat.ts` يختار Groq أولاً في وضع
`auto`، ثم يحاول Gemini إذا فشل Groq. الاستجابة الناجحة ترجع metadata آمنة
تحتوي `provider` بقيمة `groq` أو `gemini`، ومع SSE تأتي القيمة في `event: done`.

مصدر الحقيقة الوحيد لاسم المزود في الواجهة هو `provider` من response metadata.
الواجهة ما تعرض `configured` أو `model` أو `mode` لأنها ما تستلمها من هذا
العقد، وما تفترض مزوداً ثابتاً مسبقاً.

أسرار المزود تُقرأ داخل الخادم من environment variables فقط. ما تنرسل مفاتيح
API للمتصفح، وما تنحط في HTML أو client bundle.

## الردود التوضيحية

صفحة المحادثة فيها seed messages وردود fallback لتوضيح تجربة الاستخدام. كل رد
توضيحي موسوم بوضوح `بيانات توضيحية`، ويظهر وسم `تجريبي` في بطاقة السياق. الرد
التوضيحي ما ينسب نفسه إلى Groq أو Gemini.

إذا رجع endpoint بخطأ قابل للعرض أو ما كان متاحاً، الواجهة توضح إن الرد تجريبي
وتستخدم fallback بصري. هذا ما يغيّر مصدر الحقيقة: provider ما يظهر إلا بعد رد
ناجح يحمل metadata فعلية.

## الجلسة والأمان

- `sessionId` اختياري، ويُرسل كـ UUID للتحكم بسياق المحادثة.
- `promptId` يمر عبر allowlist في الخادم.
- حد الرسالة في الواجهة والخادم 4000 حرف.
- الـ API يتحقق من origin ويدعم session storage مع تنبيه `سياق غير محفوظ` إذا
  اضطر لاستخدام fallback غير دائم.
- PII Firewall يشتغل قبل استدعاء المزود.

## التحقق

من جذر المشروع شغّل:

```bash
pnpm test:chat-session
pnpm build
```

ولفحص التدفق في browser بعد تشغيل preview أو dev server:

```bash
node scripts/playwright/kernel-chat-sse-json-test.mjs
```

اختبار browser يتأكد إن بطاقة المزود ما فيها اسم ثابت، وتبدأ بشرطة، وبعد
الإرسال تعرض Groq أو Gemini من metadata الفعلية، أو تعرض وسم `تجريبي` عند
fallback، ويتأكد بعد من حماية IME.
