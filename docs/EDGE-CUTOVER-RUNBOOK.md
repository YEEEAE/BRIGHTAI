# قص brightai.live إلى Render Node

## قبل القص

1. احفظ لقطة لسجلي DNS، وارتباط النطاقين وشهاداتهما في Render، وإعداد TLS، وقواعد Origin وCache وWorker، ومعرّف آخر نشر حي. الأصل الحالي `brightai-4x39.onrender.com` وخدمة Static Site `srv-d7m5bcjbc2fs73826v20`. أبقِ الخدمة الأصلية متاحة للتراجع وتحقق من أن لوحة Render تسمح بإعادة ربط الاسمين بها.
2. حدّد مساحة العمل والخدمة المستهدفة. استخدم خدمة Render Web Service من نوع Node أو أنشئ `brightai-site` على خطة معتمدة. اربط `YEEEAE/BRIGHTAI` بـ`main`. ثبّت SHA من `git ls-remote origin refs/heads/main`. استخدم البناء `npm ci && npm run build` والتشغيل `npm start` الذي ينفذ `node ./scripts/server.mjs`، مع Node `22.22.2` و`HOST=0.0.0.0` و`PORT=10000`.
3. اضبط `AIGAS_APP_ENABLED=false` صراحةً في الخدمة وتحقق من القيمة الفعالة بعد النشر من `dependencies.portal=DISABLED` ومن `/app/` بحالة 503. اضبط `DATABASE_URL` لدور التشغيل المعتمد و`NEON_AUTH_BASE_URL` و`NEON_AUTH_JWKS_URL` في Render، مع `AIGAS_HEALTH_AUTH_PROBE=true` وقيود الدور حسب Blueprint. تحقّق من اعتماديات قاعدة البيانات وJWKS دون نسخ القيم إلى سجل الأدلة. أي ترحيل مطلوب إلى الإنتاج له تفويضه الخاص.
4. انشر SHA المقصود وتأكد أن نشر Node وصل إلى `live` وأن Render يختبر `/readyz/`. اختبر منشأ Node العام وجميع الحالات أدناه قبل لمس DNS. عقد HTTP يسمح بـ503 JSON عند تعطل الاعتماديات، لكن 503 يفشل بوابة Render الحالية. أوقف القص إذا كانت الجاهزية 503 أو إذا اختلف SHA أو ظهرت بوابة التطبيق بحالة تشغيل.
5. تحقّق من قاعدة Cloudflare `Bypass cache for BrightAI runtime routes` على apex وwww. يجب أن تبقى نتيجتها `cache: false` لمسارات probes والصفحات الديناميكية وجذور `app/auth/api` وفروعها. راجع Worker المنشور. مصدر Worker يستدعي `fetch(request)` ويحافظ على ترويسات الأصل ولا يستخدم Cache API. حقن GA4 في GET HTML 200 يستلزم مراجعة توافق CSP. افحص الصفحة العامة ومسار Secure Chat بعد القص دون تخفيف CSP، وتحقق من عدم وجود Origin Rule تغيّر الوجهة أو قاعدة تغيّر الترويسات.

## القص والتحقق

6. في نافذة القص انقل ارتباط apex وwww من Static Site إلى Web Service وفق إعداد النطاقات في Render. استخدم CNAME المعلن من خدمة Node للنطاقين. تحقّق من الملكية والشهادة. إذا طلب Render استخدام DNS-only أثناء إصدار الشهادة، استخدمه مؤقتًا ضمن النافذة ثم أعد Proxy بعد إثبات TLS. اختبر Full (strict) بتطبيقه على النطاقين المعنيين فقط بعد التحقق من الشهادة وملاءمة نطاق إعداد TLS.
7. تحقّق من وجهتي DNS ومن استدعاء Worker للمنشأ الجديد، وأعد فحص `www` للتأكد من تحويله إلى apex مع بقاء المسار والاستعلام. راجع كاش الأصل والحافة. عند ثبوت نسخة قديمة، استخدم تطهيرًا محدودًا للروابط المتأثرة ضمن صلاحية نافذة النشر.
8. نفّذ `npm run smoke:healthz -- https://brightai.live --require-ready --expect-commit="$EXPECTED_COMMIT"` وأعد نفس الفحص على منشأ Node. احفظ استجابات GET وHEAD بلا اتباع التحويلات. افحص المحتوى الفعلي بطلب GET، واستبعد Set-Cookie وقيم الأسرار من السجل.

| المسار | قبول GET وHEAD |
|---|---|
| `/healthz` و`/healthz/` | 200 JSON، `status=ok` و`version` و`commit` مطابق لـSHA. |
| `/readyz` و`/readyz/` | `schema=1` وحقول الحالة والاعتماديات الثابتة دون أسرار. 200 مطلوب لاعتماد القص. |
| `/request-access/` و`/status/` | 200 HTML و`Cache-Control: no-store`. |
| `/api/measurement-status/` | GET 200 JSON بحقل `enabled` منطقي و`no-store`. افحص HEAD أيضًا. |
| `/app/` | 503 صفحة عدم الإتاحة و`no-store`. |
| `/404/` ومسار عشوائي جديد | 404 فعلي من الطلب الأول. |
| `/docs/topics/ai-governance/index.html` | 301 و`Location: /docs/topics/ai-governance/`. اختبر ملفات التحويل الأخرى من `redirects.json` دون اتباع التحويل ثم تحقق من الوجهات. |

افحص CSP وHSTS و`X-Content-Type-Options: nosniff` على ردود HTTPS. كرر GET وHEAD لنفس عناوين المسارات الديناميكية دون cache busting، وافحص `CF-Cache-Status` و`Age` وقاعدة الكاش الفعالة. قارن HEAD بـGET في الحالة والترويسات وتحقق من خلو HEAD من الجسم. اختبر الرئيسية و`/products/` وروابط الوصول وراقب أخطاء 5xx وTLS في نافذة القص.

## التراجع الفوري

1. ابدأ التراجع عند خطأ TLS أو SHA، أو فتح التطبيق، أو غياب سياسة الأمان أو bypass، أو رجوع المسارات العامة إلى 404/5xx غير متوقع بعد القص.
2. أعد ارتباط apex وwww بخدمة Static Site إذا نُقل، وأعد CNAME للنطاقين إلى `brightai-4x39.onrender.com` وحالة Proxy السابقة. استرجع نسخة Worker وأي قواعد أو إعداد TLS تغيّرت أثناء القص حسب اللقطة. يمكن إبقاء تجاوز الكاش الحالي. إذا ثبت أنه سبب خلل، عطّل القاعدة `cfde9c04ab3e46a090b9a8c8e6479677` وحدها وتحقق من بقية القواعد.
3. تحقّق من الشهادة وعودة الرئيسية و`/products/` ومن تحويل www إلى apex. أعد قياس خط الأساس وسجّل وقت التراجع وانتشار DNS. التراجع إلى Static Site يعيد عيوب المسارات الديناميكية المعروفة. اترك `AIGAS_APP_ENABLED=false` في Node خلال التشخيص.

المراجع الرسمية [Render وCloudflare DNS](https://render.com/docs/configure-cloudflare-dns)، [فحوص Render](https://render.com/docs/health-checks)، [Cloudflare Cache Rules](https://developers.cloudflare.com/cache/how-to/cache-rules/settings/).
