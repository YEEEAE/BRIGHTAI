# BrightAI Monorepo

مستودع BrightAI الآن يعمل على فصل واضح بين الواجهة الثابتة وواجهة الـ API الخادمية.
git add .
git commit -m "وصف التعديل"
git push
## **الموقع فعلت فيه :**



📁 All your files are in ~/.hermes/:

   Settings:  /Users/yzydalshmry/.hermes/config.yaml
   API Keys:  /Users/yzydalshmry/.hermes/.env
   Data:      /Users/yzydalshmry/.hermes/cron/, sessions/, logs/

────────────────────────────────────────────────────────────

📝 To edit your configuration:

   hermes setup          Re-run the full wizard
   hermes setup model    Change model/provider
   hermes setup terminal Change terminal backend
   hermes setup gateway  Configure messaging
   hermes setup tools    Configure tool providers

   hermes config         View current settings
   hermes config edit    Open config in your editor
   hermes config set <key> <value>
                          Set a specific value

   Or edit the files directly:
   nano /Users/yzydalshmry/.hermes/config.yaml
   nano /Users/yzydalshmry/.hermes/.env

────────────────────────────────────────────────────────────

🚀 Ready to go!

   hermes              Start chatting
   hermes gateway      Start messaging gateway
   hermes doctor       Check for issues


## من cloudflare  :

# Nihmuk@mohemil.com

**Automatic SSL/TLS**

[Page Shield](https://dash.cloudflare.com/08cdfffb36f5fcbe856c2e5cd8da97e6/brightai.site/security/page-shield/settings)

Multi-signer DNSSEC

Cache Reserve

Security action items

## الفهرسه 
تمت في bing , google search 



## الوحدات

- `frontend/`: ملفات الواجهة والصفحات الثابتة.
- `backend/`: خادم Node المسؤول عن `Gemini/Groq` وبقية مسارات `/api`.

## بنية الصفحة الرئيسية

تم فصل الصفحة الرئيسية الثابتة إلى أصول أوضح:

- `assets/css/home-design-tokens.css`: رموز تصميم الصفحة الرئيسية فقط، من دون التأثير على رموز التصميم العامة.
- `assets/css/critical.css`: أنماط العرض الأول الحرجة، وحجمها أقل من 14 كيلوبايت.
- `assets/css/main.css`: تحسينات عامة للقراءة والتركيز والتجاوب.
- `assets/css/components.css`: أنماط مكونات الصفحة الرئيسية المستخرجة من الصفحة.
- `assets/js/main.bundle.js`: مصدر حزمة تفاعلات الصفحة الرئيسية.
- `assets/js/main.bundle.min.js`: النسخة المصغرة مع خريطة مصدر.

لإعادة بناء حزمة الصفحة الرئيسية:

```bash
npx esbuild assets/js/main.bundle.js --bundle --minify --sourcemap --target=es2019 --outfile=assets/js/main.bundle.min.js
```

## مهارات الوكلاء داخل المشروع

- `frontend-design`: لتصميم وتحسين الواجهات.
- `design-md`: لاشتقاق وتوثيق نظام التصميم.
- `vercel-react-best-practices`: لتحسين أنماط React وNext.js.
- `intelligent-content-reviewer-validator`: لمراجعة ترابط المحتوى واتساقه بعد أي تغيير نصي أو توثيقي.

قاعدة العمل: بعد أي تعديل محتوى أو وثائق أو نصوص واجهة، شغّل مهارة
`intelligent-content-reviewer-validator`
لإخراج تقرير سلامة المحتوى ومعالجة المشكلات الواضحة قبل اعتبار العمل مكتملاً.

## التشغيل المحلي

### الواجهة

```bash
npm run dev:frontend
```

### الـ backend

```bash
npm run dev:backend
```


## الاختبارات

```bash
npm test
```

أوامر منفصلة:

- `npm run test:frontend`
- `npm run test:backend`

## النشر الحالي

- GitHub هو مصدر الحقيقة للكود.
- الموقع العام يُنشر كخدمة Render Static باسم `brightai-site`.
- مصدر الحقيقة للصفحات العامة هو ملفات HTML الثابتة، وليس `app/page.tsx` أو Next.js.
- مخرجات النشر النهائية هي `.render-static`، ويتم استبعاد `app/` و`components/` و`lib/` و`backend/` من مخرجات الموقع الثابت.
- `backend` يُنشر كخدمة Render منفصلة باسم `brightai-api`.
- الواجهة تعتمد على `/api` من نفس الدومين، وRender يعيد توجيهه داخلياً إلى خدمة `brightai-api`.
- يتم توليد `sitemap.xml` عبر `npm run sitemap:all` قبل إنشاء `.render-static`، ثم يفشل `npm run seo:gate` البناء إذا ظهر canonical mismatch أو noindex داخل sitemap.

تفاصيل مصدر الحقيقة وأوامر البناء وتوقيت توليد الـ sitemap موثقة في [docs/deployment-source-of-truth.md](docs/deployment-source-of-truth.md).

## فحص صحة الـ API

```bash
npm run smoke-test:prod
```

أو مباشرة:

```bash
node scripts/smoke-test-api.mjs https://brightai.site
```

## أسرار البيئة

- لا تضع أي مفاتيح سرية داخل `frontend` أو أي متغير يبدأ بـ `REACT_APP_`.
- استخدم ملفات `.env.local` غير المتتبعة محلياً.
- للتشفير المحلي قبل حفظ النسخ المشفرة، استخدم:

```bash
node scripts/local-secrets.mjs encrypt --in backend/.env.local --out secrets/backend.env.enc
```

## دفع التغييرات إلى GitHub

```bash
git add .
git commit -m "feat: describe change"
git push -u origin
```

لا يوجد خطوات أخرى داخل هذا الملف، وتم توضيح الأساسيات بالكامل.
