# خطة فهم وإعادة هيكلة قاعدة كود برايت اي آي

## الهدف

الهدف هو فهم التصميم المعماري وتدفق البيانات في المستودع، ثم تحديد مشاكل البنية والتكرار وعنق الزجاجة في الأداء ومخاطر الصيانة، مع تقديم استراتيجية إعادة هيكلة تدريجية تحافظ على الوظائف الحالية وتحسن الجودة.

## ملخص التصميم المعماري

المستودع يعمل كمنظومة هجينة:

1. موقع ثابت كبير يعتمد على ملفات `HTML` و `CSS` و `JavaScript` مباشرة.
2. طبقة `Next.js` محدودة داخل `app` و `components` و `lib`.
3. خادم `Node.js` داخل `backend` يخدم واجهات البرمجة، بعض الملفات الثابتة، إعادة التوجيه، وثائق الواجهة، وقناة التحديثات الفورية.
4. مجلدات ديمو مستقلة داخل `demo` و `services` و `ai-bots` تعتمد على سكربتات وأصول مشتركة جزئياً.
5. طبقة أدوات وسكربتات كبيرة داخل `scripts` لإدارة السيو، الخرائط، الروابط الداخلية، التصغير، والفحص.

تدفق البيانات العام:

1. المستخدم يفتح صفحة ثابتة أو صفحة ديمو.
2. الصفحة تحمّل إعدادات runtime من ملفات الواجهة مثل `frontend/js/runtime-config.min.js`.
3. طلبات الواجهة تذهب إلى `/api` من نفس الدومين في الإنتاج أو إلى `localhost:3000` محلياً.
4. `backend/server.js` يقرأ الطلب، يطبّق إعادة التوجيه أو خدمة الملفات الثابتة أو يمرر الطلب إلى مسارات الذكاء الاصطناعي.
5. مسارات الذكاء الاصطناعي تستخدم طبقة `backend/services/aiGateway.js` أو مزودي Groq و Gemini و NVIDIA و DeepSeek حسب الإعدادات.
6. الاستجابة تعود للواجهة كاستجابة عادية أو بث.

## نطاق الملفات الأكثر تأثيراً

- `backend/server.js`: نقطة دخول مركزية فيها خدمة ثابتة، توجيه، إعدادات مشاركة الموارد، حدود حجم الطلب، وثائق، وصحة النظام.
- `backend/services/aiGateway.js`: طبقة مركزية لمخططات الديمو، الأسماء البديلة، بيانات الاختبار، اختيار المزود، وتوحيد الاستجابات.
- `frontend/js/runtime-config.min.js` و `frontend/js/api-gateway.min.js`: طبقة بناء عناوين الواجهة وطلبات الواجهة.
- `scripts/check-api-base-consistency.mjs`: فحص مهم يثبت اتساق إعدادات الواجهة والباكند.
- `package.json`: يخلط تشغيل Next، بناء الأصول، اختبارات monorepo، وسكربتات السيو.
- صفحات `index.html` و `services/index.html` و `demo/*`: سطح إنتاج واسع وحساس للسيو.

## مناطق المشاكل

### مشاكل بنيوية

1. `backend/server.js` يجمع مسؤوليات كثيرة في ملف واحد: خدمة الملفات الثابتة، إعادة التوجيه، إعدادات مشاركة الموارد، تحليل الطلب، التوجيه، الوثائق، صحة النظام، وقناة التحديثات الفورية. هذا يرفع تكلفة أي تغيير ويصعّب الاختبار الموضعي.
2. وجود `Next.js` إلى جانب موقع ثابت كبير بدون حد واضح بين مصدر الحقيقة للصفحات. هذا يجعل المطور الجديد غير متأكد هل الصفحة تُعدل في `app` أم في ملفات `HTML`.
3. المسارات القديمة والجديدة متداخلة: `/api/gemini/chat` أصبح alias إلى `/api/ai/chat`، مع بقاء مسارات أخرى مستقلة. هذا جيد للتوافق لكنه يحتاج registry واحد بدلاً من سلسلة شروط طويلة.
4. ملفات الإنتاج المصغرة أحياناً هي مصدر الفحص الوحيد، مثل `runtime-config.min.js` عند غياب مصدر غير مصغر. هذا يجعل الصيانة أصعب ويزيد احتمالية تعديل ملف مولد مباشرة.
5. توجد ملفات تحمل لاحقة نسخة مثل `server 2.js` و `search 2.js` و `search-index 2.json` و صفحات `index 2.html`. هذا مؤشر خطر على نسخ يدوية غير محكومة.

### تكرار الكود

1. تكرار نمط إعداد التحليلات ووسوم السيو عبر صفحات ثابتة كثيرة.
2. تكرار منطق بناء عنوان الواجهة بين runtime config وملفات ديمو خاصة.
3. تكرار مسارات الذكاء الاصطناعي كـ aliases في الواجهة والباكند.
4. تكرار صفحات عربية وإنجليزية وديموهات بملفات HTML كبيرة بدلاً من data-driven templates.
5. وجود CSS متعدد المصدر بين `assets/css` و `frontend/css` و ملفات ديمو مستقلة.

### عنق الزجاجة في الأداء

1. `backend/server.js` يستخدم `fs.statSync` و `fs.readFileSync` في مسارات الطلب لبعض الملفات. في ضغط عالٍ قد تسبب العمليات المتزامنة تأخيراً.
2. خدمة الملفات الثابتة من الباكند تضيف مسؤولية كان يمكن أن تنفذ بكفاءة أعلى عبر CDN أو static hosting، خاصة مع كثرة صفحات HTML والأصول.
3. بعض صفحات HTML كبيرة جداً، مثل `index.html` و `services/index.html`، وهذا يزيد زمن التحميل وتكلفة المراجعة.
4. تعدد ملفات CSS وJS في صفحات الإنتاج يزيد مخاطر التحميل غير الضروري، خصوصاً إذا حملت الصفحة سكربتات عامة لا تحتاجها.
5. قناة WebSocket ترسل payload عشوائي كل سبع ثوانٍ لكل العملاء. هذا مقبول للديمو لكنه يحتاج عزل أو تعطيل واضح في بيئة الإنتاج إذا لم يكن مطلوباً.

### مخاطر الصيانة

1. أي تعديل في `backend/server.js` قد يكسر API أو static routing أو redirects أو docs بسبب تداخل المسؤوليات.
2. التوافق مع السيو حساس جداً لأن صفحات كثيرة ثابتة وتحتوي canonical وhreflang وروابط داخلية.
3. ملفات النسخ اليدوية ذات المسافات قد تجعل المطور يعدل النسخة الخطأ.
4. `package.json` في الجذر يحمل أوامر كثيرة غير مصنفة بوضوح، وهذا يصعّب معرفة pipeline الصحيح قبل النشر.
5. اختلاف نسخة Node بين الجذر والباكند يزيد مخاطر اختلاف السلوك بين التطوير والنشر.

## استراتيجية إعادة الهيكلة الموصى بها

### المرحلة الأولى: حدود المسؤوليات بدون تغيير السلوك

1. استخراج خدمة الملفات الثابتة من `backend/server.js` إلى `backend/server/staticFiles.js`.
   - التحقق: اختبارات `GET /` و `GET /robots.txt` و `HEAD /`.
2. استخراج redirects إلى `backend/server/redirects.js`.
   - التحقق: اختبارات 301 للمسارات القديمة والمدونة.
3. استخراج route table إلى `backend/server/apiRoutes.js`.
   - التحقق: اختبار كل endpoint موجود حالياً بنفس status والشكل.
4. إبقاء `backend/server.js` كتركيب فقط: config ثم middleware ثم router ثم start.
   - التحقق: `npm run test:backend` و `npm run smoke-test:config`.

### المرحلة الثانية: سجل مركزي للمسارات والعقود

1. إنشاء registry موحد لمسارات API مع method وpath وhandler وbodyLimit.
2. استخدام نفس registry لاختبار المسارات وتوليد جزء من توثيق OpenAPI عند الإمكان.
3. نقل aliases إلى نفس registry بدلاً من sets متفرقة وسلسلة شروط.

### المرحلة الثالثة: تنظيف الأصول والصفحات

1. تحديد مصدر الحقيقة لكل أصل: غير مصغر في `frontend/js` أو `assets/js`، والمصغر ناتج بناء فقط.
2. حذف أو عزل الملفات ذات لاحقة النسخ بعد التأكد أنها غير مستخدمة.
3. توحيد تحميل التحليلات والروابط الحرجة عبر generator أو include موحد.
4. تشغيل فحوص السيو والروابط بعد كل دفعة.

### المرحلة الرابعة: فصل الموقع الثابت عن واجهات البرمجة

النهج المفضل هو جعل الواجهة الثابتة تُخدم من CDN أو static host، والباكند يخدم `/api` فقط. هذا يقلل حمل الباكند ويجعل تحسين الأداء أوضح.

البديل الأول: الإبقاء على الخدمة الهجينة لكن مع modules منفصلة وفحوص أقوى.

البديل الثاني: تحويل الصفحات المتكررة تدريجياً إلى generator data-driven بدون نقل كامل إلى Next دفعة واحدة.

## كود محسّن مقترح

### سجل مسارات بدلاً من سلسلة شروط طويلة

```js
const routes = [
  { method: 'POST', path: '/api/ai/chat', handler: unifiedChatHandler },
  { method: 'POST', path: '/api/ai/chat/stream', handler: unifiedChatStreamHandler, rawResponse: true },
  { method: 'POST', path: '/api/gemini/chat', handler: unifiedChatHandler, aliasOf: '/api/ai/chat' },
  { method: 'POST', path: '/api/gemini/chat/stream', handler: unifiedChatStreamHandler, rawResponse: true, aliasOf: '/api/ai/chat/stream' },
  { method: 'GET', path: '/api/ai/status', handler: async (_req, res) => res.status(200).json(getSafeAiStatus()) }
];

function findRoute(method, path) {
  return routes.find(route => route.method === method && route.path === path) || null;
}

async function dispatchApiRoute(ctx, method, path, rawRes) {
  const route = findRoute(method, path);
  if (!route) return false;
  await route.handler(ctx.req, ctx.res, rawRes);
  return true;
}
```

### اختيار حجم الطلب من registry

```js
const bodyLimits = new Map([
  ['/api/ai/ocr', config.validation.ocrMaxBodyBytes],
  ['/api/ai/extract-text', config.validation.ocrMaxBodyBytes],
  ['/api/ai/medical-archive', config.validation.ocrMaxBodyBytes],
  ['/api/ai/medical-agent', config.validation.ocrMaxBodyBytes],
  ['/api/ai/transcribe', config.validation.uploadMaxBodyBytes]
]);

function getBodyLimit(pathname) {
  return bodyLimits.get(pathname) || config.validation.maxBodyBytes;
}
```

### فصل redirects عن الخادم

```js
function getRedirectTarget(pathname) {
  return STATIC_ROUTE_REDIRECTS.get(pathname) || getStaticRedirectTarget(pathname) || null;
}

function sendRedirect(res, target, search = '') {
  res.writeHead(301, { Location: encodeURI(`${target}${search}`) });
  res.end();
}
```

هذه الأمثلة لا تغير الوظائف، لكنها تجعل السلوك قابلاً للاختبار والتوسيع بدون سلسلة شروط ضخمة داخل نقطة الدخول.

## خطة تحقق مقترحة

1. فصل static files وredirects → التحقق: اختبارات route وstatic وhead وcache headers.
2. فصل API route registry → التحقق: snapshot بسيط لقائمة المسارات واختبارات status لكل endpoint.
3. توحيد runtime config → التحقق: `npm run smoke-test:config`.
4. تنظيف النسخ اليدوية → التحقق: `rg` للروابط إلى الملفات قبل الحذف، ثم `npm run internal-links:audit`.
5. مراجعة السيو بعد كل تعديل HTML → التحقق: `npm run seo:html:check` و `npm run seo:qa`.
6. اختبار شامل قبل الدمج → التحقق: `npm test` و `npm run validate:production`.

## أوامر توجيه جاهزة لتنفيذ العمل

### الأمر 1: فهم الخريطة المعمارية

افحص مستودع برايت اي آي كمهندس معماري أول. اقرأ نقاط الدخول والتكوين والباكند والواجهة والسكربتات، ثم اكتب خريطة تدفق البيانات بين الصفحات الثابتة وواجهات البرمجة ومزودي الذكاء الاصطناعي. لا تعدل أي ملف. أعطني الملفات الحرجة، الاعتمادات، ومخاطر السيو.

### الأمر 2: فصل الخادم بدون تغيير السلوك

أعد هيكلة `backend/server.js` بشكل تدريجي مع الحفاظ على نفس المسارات والاستجابات. استخرج خدمة الملفات الثابتة إلى module مستقل، واستخرج redirects إلى module مستقل، واترك `server.js` كمنسق فقط. اكتب اختبارات تغطي `/` و`/robots.txt` و`/api/health` ومسارات redirect القديمة. لا تغير أسماء المسارات.

### الأمر 3: توحيد سجل مسارات الواجهة البرمجية

حوّل سلسلة شروط API في `backend/server.js` إلى route registry يحتوي method وpath وhandler وbodyLimit وaliases. حافظ على كل endpoints القديمة. أضف اختباراً يثبت أن `/api/gemini/chat` و`/api/ai/chat` يذهبان لنفس handler وأن streaming routes لا تنكسر.

### الأمر 4: تنظيف التكرار في إعدادات الواجهة

افحص `frontend/js/runtime-config*` و`frontend/js/api-gateway*` وملفات الديمو التي تبني عناوين API. وحّد منطق بناء عناوين API في مصدر واحد غير مصغر، ثم ولّد النسخة المصغرة. شغّل `npm run smoke-test:config` وأصلح أي كسر.

### الأمر 5: تنظيف ملفات النسخ اليدوية

ابحث عن الملفات ذات أسماء تحتوي نسخاً يدوية مثل ` 2`. لا تحذف شيئاً قبل إثبات عدم وجود مراجع داخل HTML أو JS أو sitemap أو scripts. أنشئ تقرير استخدام، ثم اقترح حذفاً آمناً أو نقلها إلى archive خارج مسار الإنتاج.

### الأمر 6: تحسين الأداء بدون تغيير الوظائف

افحص تحميل CSS وJS في الصفحة الرئيسية وصفحات الخدمات والديمو. اقترح إزالة التحميل غير الضروري أو تأجيله، لكن لا تغير المحتوى أو السيو. تحقق من عدم كسر `dir="rtl"` و`lang="ar-SA"` ووسم Google Analytics.

### الأمر 7: حماية السيو بعد إعادة الهيكلة

بعد أي تعديل في HTML أو head أو روابط أو أصول، شغّل فحص السيو التقني والروابط الداخلية. تأكد من canonical وhreflang وsitemap وrobots وGoogle Analytics `G-8LLESL207Q`. أصلح فقط المشاكل الآمنة واذكر ما يحتاج مراجعة بشرية.

### الأمر 8: إنتاج خطة دمج آمنة

قسّم إعادة الهيكلة إلى pull requests صغيرة. لكل PR اكتب الهدف، الملفات المتأثرة، المخاطر، أوامر التحقق، وخطة rollback. يجب أن تبقى الوظائف كما هي وتتحسن قابلية الصيانة فقط.

## النتيجة المتوقعة

بعد تنفيذ الخطة تدريجياً، ستصبح قاعدة الكود أسهل للفهم، أقل تكراراً، وأقوى في الاختبار، مع تقليل مخاطر كسر صفحات الإنتاج أو فهرسة Google أو مسارات API القديمة.
