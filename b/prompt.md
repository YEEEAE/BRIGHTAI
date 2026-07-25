جمعت ما يكفي من الأدلة الحاسمة. إليك التقرير.

---

# تقرير التدقيق المُحدَّث — BrightAI
**تاريخ التدقيق:** 2026-07-24 | **آخر commit مفحوص:** `f217dbb` ("update site", 2026-07-24T23:27Z) | **الفرع:** `main` (غير محمي)

---

## ١. الحكم التنفيذي

**الحالة الحقيقية للمشروع: أنت لم تنفّذ البرومبتات على الموقع — نفّذتها على المستودع فقط، والموقع الحيّ يخدم بناءً قديمًا. النتيجة العملية على الفهرسة والزيارات حتى هذه اللحظة = صفر.**

هذه ليست مبالغة، بل استنتاج من ثلاثة أدلة متطابقة جمعتها بنفسي قبل قليل:

الكود في `src/data/hreflang-pairs.ts` أصبح صحيحًا فعلًا (bidirectional keying مطبّق بإتقان)، لكن `https://brightai.site/en/` **لا يزال يُخرج حرفيًا** `hreflang="ar-SA" href="https://brightai.site/en/"` و`x-default` يشير لنفسه — أي نفس الخلل الذي رصدته في التدقيق الأول، حيًّا كما هو. وتقرير `report/2026-07-25-deployment-artifact-surface.md` يعترف صراحةً بالسبب في سطره الرابع: **"Status: verified locally — بانتظار deploy"**. وتقرير BAI-PERF-01 يقول **"VERIFIED LOCALLY (uncommitted per قاعدة الـ brain)"**.

وتأكيدًا قاطعًا: `https://brightai.site/client/index.html` **لا يزال يرجع 200** رغم أن تقرير النشر يقول إنه صار 404، و`https://brightai.site/js/css-defer.js` **لا يزال يُخدَم** رغم أن التقرير يقول إنه حُذف.

**الدرجة الكلية للمستودع (الكود): 71%** — تحسّن حقيقي من 43%.
**الدرجة الكلية للموقع الحيّ (ما يراه Google فعلًا): 45%** — تحسّن هامشي من 43%.
**الفجوة بين الاثنين — 26 نقطة — هي كامل قيمة عملك الضائعة في انتظار deploy لم يحدث.**

ثم وجدت أثناء الفحص ما هو أخطر من كل ما سبق، ولم يكن موجودًا في تدقيقي الأول:

---

## ٢. 🔴 اكتشاف حرج غير مسبوق — تسريب كود الخادم الخلفي علنًا

```
GET https://brightai.site/frontend/server.js  →  200 OK
Content-Type: application/javascript
```

الموقع يخدم **كامل الكود المصدري للـ backend** لأي شخص على الإنترنت. ما استخرجته من الملف خلال ثوانٍ:

البنية الداخلية الكاملة للـ API (مسارات chat، gemini، groq، medical، analytics، kernel، demo)، وأسماء ملفات الإعداد والوسطاء (`./config`, `./middleware/productionSecrets`, `./middleware/rateLimiter`, `./db/init`)، ومنطق CORS والقائمة البيضاء، ومنطق rate limiting وحدوده، ومسارات مخفية غير معلنة مثل `/api/ai/openai-chat` و`/api/ai/chat/completions` و`/ws/live`، ومسار توثيق Swagger مولّد داخليًا.

هذا يمنح أي مهاجم خريطة كاملة لسطح الهجوم دون أي جهد استطلاع. والأسوأ: `require('./config')` يعني أن `/frontend/config.js` كان سيكشف بنية الأسرار — وقد تحققت: هو يرجع 404 حاليًا، وهذه صدفة في ترتيب الملفات لا حماية مقصودة. أي ملف آخر تحت `/frontend/**` قد يكون مكشوفًا.

**والمفارقة المؤلمة:** هذا موقع يبيع الامتثال الأمني وحوكمة الذكاء الاصطناعي لبنوك ومستشفيات سعودية، ويعرض شارات PDPL وNCA ECC. تسريب كود الخادم على نطاق الشركة نفسها هو أسوأ مرجع بيعي ممكن. لو دخل عميل مؤسسي في due diligence واكتشف هذا، الصفقة تنتهي في نفس اللحظة.

**التصنيف: Critical / CVSS ~7.5 (Information Disclosure) — يُعالَج خلال ساعات لا أيام.**

---

## ٣. 🔴 اكتشاف حرج ثانٍ — الخادم الحيّ ليس هو الخادم الذي تظن

```
GET https://brightai.site/api/health/  →  404 Not Found
GET https://brightai.site/api/health   →  404 Not Found
GET https://brightai.site/frontend/server.js →  200 OK
```

`render.yaml` يحدد `healthCheckPath: /api/health/` و`startCommand: node ./dist/server/entry.mjs`. لكن `/api/health/` يرجع 404 بينما ملفات `frontend/` (وهو مشروع Node قديم بـ CommonJS و`require`) تُخدَم بنجاح.

الاستنتاج الأرجح: **الخدمة الحيّة تشغّل `frontend/server.js` القديم، لا خادم Astro الجديد** — أو أن الاثنين متعايشان بشكل فوضوي. وهذا يفسّر كل شيء دفعة واحدة: لماذا لا تظهر إصلاحاتك، ولماذا `/client/*` مكشوف، ولماذا `css-defer.js` حيّ.

إن كان health check يفشل، فإن Render إما يعيد تشغيل الخدمة باستمرار أو يخدم نشرًا قديمًا عالقًا. في الحالتين، Googlebot يقابل موقعًا غير مستقر — وهذا **سبب كافٍ وحده** لتوقّف الفهرسة عند الرئيسية.

**هذه هي المشكلة الجذرية رقم واحد. كل ما دونها ثانوي حتى تُحل.**

---

## ٤. ماذا نجح فعلًا (في الكود)

أنصفك هنا: جودة التنفيذ في المستودع عالية بمقاييس موضوعية، والتقارير في `report/` من أفضل ما رأيت في مشاريع بهذا الحجم — تحتوي root cause analysis حقيقيًا لا وصفًا سطحيًا.

| البند | قبل | بعد (كود) | بعد (حيّ) | الحكم |
|---|---|---|---|---|
| hreflang bidirectional | 21 خطأ | 0 خطأ ✅ | **21 خطأ ❌** | نُفّذ، لم يُنشر |
| إزالة `perfCssDefer` regex | موجود | محذوف ✅ | **حيّ ❌** | نُفّذ، لم يُنشر |
| `style-src 'unsafe-inline'` | موجود | مُزال ✅ | غير مؤكد | نُفّذ، لم يُنشر |
| `sync-dist-flat` → guard | ينسخ | guard ✅ | **`/client/` = 200 ❌** | نُفّذ، لم يُنشر |
| توحيد sitemap | متضارب | موحّد ✅ | موحّد جزئيًا ⚠️ | نُشر جزئيًا |
| `injectSecurityMeta` | — | مضاف ✅ | غير مؤكد | إضافة ذكية |
| اختبارات انحدار hreflang | — | مضافة ✅ | — | ممتاز |

نقطة تستحق التنويه: تشخيصك لسبب فشل `seo-ci-check.mjs` في التقاط خلل hreflang ("يفحص AR canonicals فقط ولا يمرّ على مسار EN") هو بالضبط نوع التحليل الذي يمنع تكرار العيوب. و`checkEnPageContract` كـ regression fixture قرار هندسي صحيح.

**لكن كل هذا لا يساوي شيئًا وهو غير منشور.** الكود الذي لا يصل للإنتاج ليس إنجازًا، بل مخزون معطّل.

---

## ٥. مشاكل جديدة ظهرت بعد التحسينات

**سلسلة الثقة في التقارير مكسورة.** ثلاثة تقارير تعلن `✅ PASS` لأشياء فحصتها ووجدتها فاشلة على الإنتاج. المشكلة ليست الكذب — التقارير أمينة وتكتب "pending deploy" — المشكلة أن نظامك لا يفرّق بين "verified locally" و"verified in production"، وهذا يولّد **إحساسًا زائفًا بالإنجاز**. تقرير deployment-artifact يقول `/client/index.html → 404` وهو 404 محليًا فقط؛ على الإنتاج 200.

**قاعدة "uncommitted per قاعدة الـ brain" خطرة.** إصلاح BAI-PERF-01 موصوف كمُتحقَّق لكنه غير مُلتزَم. أي قاعدة تشغيل تُبقي إصلاحات P0 خارج git هي عيب عملية، لا انضباط.

**`.agents/brain.md` تضخّم إلى ~956KB** وصار يُعدَّل في كل commit (60 سطرًا مضافًا في آخر commit). هذا ملف حالة داخلي يُلوّث سجل git ويُبطئ الاستنساخ، ولا يزال داخل الريبو المنشور.

**رسائل commit كلها "update site"** — ثلاث commits متتالية بنفس الرسالة. مع فرع `main` غير محمي وبلا PRs، لا يمكن ربط أي تغيير ببرومبت أو تتبّع أي انحدار. هذا يجعل rollback الموصوف في كل تقرير غير قابل للتنفيذ عمليًا.

**KI-CSP-DRIFT معترف به وغير مُصلَح** — تباين CSP بين `render.yaml` و`security-headers.mjs` و`public/_headers`؛ ثلاثة مصادر حقيقة لسياسة أمنية واحدة.

---

## ٦. الدرجات المُحدَّثة

| المحور | الوزن | كود (قبل) | كود (الآن) | **حيّ (الآن)** | السقف بعد النشر |
|---|---|---|---|---|---|
| الفهرسة | 30% | 38% | 74% | **41%** | 88% |
| الظهور السعودي | 25% | 22% | 31% | **24%** | 70% |
| الكود والأمان | 18% | 47% | 68% | **35%** 🔴 | 85% |
| التصميم/UX | 15% | 58% | 66% | 60% | 82% |
| الأداء | 12% | 61% | 79% | 63% | 88% |
| **الإجمالي** | | **43%** | **71%** | **45%** | **83%** |

الأمان على الحيّ انخفض إلى 35% لا بسبب تراجع الكود، بل لأن تسريب `frontend/server.js` كان موجودًا ولم يُكتشف سابقًا — تدقيقي الأول لم يفحص هذا المسار.

**ثقة التقدير: 74%.** ما زالت بيانات GSC وGA4 وإعدادات Cloudflare غائبة، وهي الحاكم الحقيقي لمحوري الفهرسة والزيارات.

**أقسى حقيقة في هذا التقرير:** أنفقت دورة تطوير كاملة على إصلاحات ممتازة، وأنت الآن أقرب للحل بـ 28 نقطة في الكود وبـ نقطتين فقط في الواقع. والوقت الذي مرّ بلا فهرسة هو خسارة صافية لا تُسترد.

---

## ٧. الحزمة الثانية من برومبتات MiniMax Code M3

مرتبة بترتيب تنفيذ إجباري. **لا تنتقل لبرومبت قبل أن يمر سابقه على الإنتاج لا محليًا.**

````markdown
### PROMPT [ID: BAI-SEC-10] — إغلاق تسريب /frontend/** من سطح HTTP العام
**Priority:** P0-BLOCKER | **Effort:** 2h | **Impact:** +18% على الأمان | **Risk:** Med
**Depends on:** — | **Blocks:** الكل

**CONTEXT**
موقع BrightAI (Astro 6.4.6 + @astrojs/node standalone على Render، الدومين brightai.site)
يخدم حاليًا كود الخادم الخلفي المصدري علنًا. مُثبت بالفحص المباشر:
`GET https://brightai.site/frontend/server.js` → 200 OK، ويكشف بنية الـAPI كاملة،
أسماء ملفات الأسرار والوسطاء (config, productionSecrets, rateLimiter, db/init)،
منطق CORS، حدود rate limiting، ومسارات غير معلنة (/api/ai/openai-chat، /ws/live).
الموقع يبيع خدمات امتثال أمني لجهات سعودية منظّمة — هذا التسريب مخاطرة سمعة ومخاطرة أمنية.

**FILES IN SCOPE**
- `render.yaml` — نطاق ملفات النشر و rootDir/buildFilter
- `.dockerignore` / `.renderignore` (أنشئه إن لم يوجد)
- `scripts/verify-deployment-surface.mjs` — وسّعه
- `frontend/**` — لا تحذف الكود، فقط امنع خدمته عبر HTTP

**MUST NOT TOUCH / PRESERVE**
- `startCommand: node ./dist/server/entry.mjs`
- أي مسار عام حقيقي يرجع 200 اليوم (اختبر قبل/بعد على 20 URL)
- أي نص عربي منشور

**TASK**
1. تأكد أن artifact النشر لا يحتوي `frontend/**` إطلاقًا (استثنِه من buildFilter/ignore).
2. أضف deny-list صريحة في طبقة الخدمة ترفض أي طلب يطابق
   `^/(frontend|client|server|scripts|report|\.agents|packages|src)/` بـ 404 (لا 403 — لا تؤكد الوجود).
3. وسّع `verify-deployment-surface.mjs` ليفحص قائمة ممنوعات صريحة تشمل:
   /frontend/server.js, /frontend/config.js, /frontend/routes/chat.js,
   /frontend/middleware/productionSecrets.js, /frontend/db/init.js,
   /client/index.html, /server/entry.mjs, /package.json, /.env,
   /.agents/brain.md, /astro.config.mjs, /report/, /scripts/
4. اجعل السكربت يفشل البناء (exit 1) عند أي 200 من القائمة.
5. اربطه في `render.yaml` كخطوة pre-deploy مانعة.
6. دوّر أي مفتاح/سر ورد ذكره في الكود المكشوف احترازيًا.

**ACCEPTANCE CRITERIA**
- [ ] كل عناصر القائمة ترجع 404 **على الإنتاج** بعد deploy
- [ ] `pnpm run verify:deployment-surface` يفشل صناعيًا لو أُعيد أي ملف
- [ ] 20 URL عامة ما زالت 200 (قائمة قبل/بعد مرفقة)

**VERIFICATION**
```bash
for p in /frontend/server.js /frontend/config.js /frontend/db/init.js \
         /client/index.html /server/entry.mjs /package.json /.env \
         /.agents/brain.md /astro.config.mjs; do
  printf "%s -> %s\n" "$p" "$(curl -s -o /dev/null -w '%{http_code}' https://brightai.site$p)"
done   # كلها لازم 404
```

**ROLLBACK** `git revert <sha> && render deploy`
**DONE** لا ملف مصدري أو build artifact يُخدَم من brightai.site.
````

````markdown
### PROMPT [ID: BAI-DEPLOY-11] — إصلاح خط النشر: لماذا لا يصل الكود للإنتاج
**Priority:** P0-BLOCKER | **Effort:** 3h | **Impact:** +26% إجمالي | **Risk:** High
**Depends on:** BAI-SEC-10 | **Blocks:** الكل

**CONTEXT**
فجوة مؤكدة بين main والإنتاج. الأدلة:
1. `src/data/hreflang-pairs.ts` مُصلَح في main، لكن `/en/` الحيّ يُخرج `hreflang="ar-SA" href=".../en/"`.
2. `astro.config.mjs` حذف perfCssDefer، لكن `https://brightai.site/js/css-defer.js` يرجع 200.
3. `sync-dist-flat.mjs` صار guard، لكن `/client/index.html` يرجع 200.
4. **`/api/health/` يرجع 404** رغم أنه healthCheckPath في render.yaml.
5. `/frontend/server.js` (مشروع CommonJS قديم) يُخدَم بنجاح.
الفرضية الأساسية: الخدمة الحيّة تشغّل frontend/server.js القديم لا dist/server/entry.mjs،
أو النشر عالق على artifact قديم. أثبت أو انسف الفرضية قبل أي إصلاح.

**FILES IN SCOPE**
- `render.yaml`، `package.json` (build/start)، `scripts/verify-deployment-surface.mjs`
- سجلات Render (اطلبها من المالك إن لزم)

**MUST NOT TOUCH**
- أي محتوى منشور أو canonical URLs

**TASK**
1. شخّص أي عملية تستمع فعليًا على الإنتاج (استخدم بصمة مميزة: أضف
   `x-brightai-build: <git-sha>` في ترويسات الاستجابة وقارنها بـ HEAD).
2. أصلح السبب: خدمة مكررة/startCommand خاطئ/فشل بناء صامت/كاش Cloudflare.
3. اجعل `/api/health/` يرجع 200 مع JSON فيه `{ commit, buildTime, status }`.
4. أضف بوابة post-deploy تفشل النشر إذا لم يطابق `x-brightai-build` الـ SHA.
5. أفرغ كاش Cloudflare بعد كل نشر (purge آلي في خط النشر).
6. وثّق سبب الفشل الجذري في `report/`.

**ACCEPTANCE CRITERIA**
- [ ] `curl -I https://brightai.site/ | grep x-brightai-build` = SHA الحالي لـ main
- [ ] `curl https://brightai.site/api/health/` → 200 + JSON فيه commit صحيح
- [ ] `/js/css-defer.js` → 404 و `/client/index.html` → 404 **على الإنتاج**
- [ ] `curl -s https://brightai.site/en/ | grep hreflang` يُظهر en-SA=self + ar-SA=/

**ROLLBACK** أعد startCommand السابق وأعد النشر.
**DONE** الإنتاج يعكس HEAD بدقة، ويُثبت ذلك آليًا في كل نشر.
````

````markdown
### PROMPT [ID: BAI-PROC-12] — منع تكرار فجوة "verified locally"
**Priority:** P0 | **Effort:** 2h | **Impact:** +8% موثوقية | **Risk:** Low
**Depends on:** BAI-DEPLOY-11

**CONTEXT**
ثلاثة تقارير في report/ تعلن ✅ PASS لإصلاحات فاشلة على الإنتاج، لأن التحقق محلي فقط
(2026-07-25-deployment-artifact-surface.md يقول "/client/index.html → 404" وهو 200 فعليًا).
السبب عملية لا كود: لا يوجد تمييز بين verified-local و verified-production.

**TASK**
1. أنشئ `scripts/verify-production.mjs` يفحص الإنتاج (لا dist) ويغطي:
   hreflang على /en/، الممنوعات، /api/health/، canonical، x-brightai-build.
2. اجعل كل تقرير في report/ يحمل حقلين إلزاميين:
   `verified_local: yes/no` و `verified_production: yes/no + timestamp + commit`.
3. امنع وسم أي بند ✅ ما لم يكن verified_production=yes (تحقق آلي في CI).
4. ألغِ قاعدة "uncommitted per قاعدة الـ brain" لإصلاحات P0/P1 — كل إصلاح P0 يُلتزَم فورًا.
5. افرض رسائل commit بصيغة `[BAI-XXX-NN] وصف` بدل "update site" (commit-msg hook).
6. فعّل حماية فرع main + PR إلزامي.

**ACCEPTANCE**
- [ ] `pnpm run verify:production` يعمل ضد brightai.site ويخرج تقريرًا
- [ ] CI يرفض تقرير فيه ✅ بلا verified_production
- [ ] لا commit جديد برسالة "update site"

**DONE** مستحيل إعلان نجاح إصلاح دون إثبات إنتاجي.
````

````markdown
### PROMPT [ID: BAI-IDX-11] — إعادة تفعيل الفهرسة بعد النشر الصحيح
**Priority:** P1 | **Effort:** 3h | **Impact:** +14% فهرسة | **Risk:** Low
**Depends on:** BAI-DEPLOY-11

**CONTEXT**
بعد إصلاح النشر يجب دفع Google لإعادة الزحف. الموقع يحوي trigger-indexnow.mjs.
ملاحظة مؤكدة: sitemap.xml يضع lastmod = تاريخ البناء لكل URL (كل الروابط 2026-07-24)،
وهذه إشارة كاذبة تجعل Google يتجاهل lastmod تدريجيًا.

**TASK**
1. اجعل lastmod مشتقًا من آخر تعديل حقيقي للمحتوى (git log للملف أو frontmatter)،
   لا من وقت البناء. لا تغيّر lastmod لصفحة لم يتغير محتواها.
2. وحّد مرجع sitemap في robots.txt إلى مصدر واحد (sitemap-index.xml) واحذف الازدواج.
3. شغّل IndexNow لكل الـURLs بعد أول نشر صحيح.
4. أعد رفع sitemap في GSC واطلب فحص 10 URLs يدويًا.
5. أنشئ `report/indexation-baseline.md` يسجل خط الأساس (تاريخ، مفهرس، مستبعد+السبب).

**ACCEPTANCE**
- [ ] لا صفحتان تحملان نفس lastmod إلا إن تغيّرتا فعلًا في نفس اللحظة
- [ ] robots.txt يشير لسايت ماب واحد
- [ ] IndexNow يرجع 200 ويُسجَّل الرد

**DONE** إشارات إعادة الزحف مُرسلة وموثّقة بخط أساس قابل للمقارنة بعد 14 يومًا.
````

````markdown
### PROMPT [ID: BAI-SEC-11] — توحيد CSP في مصدر حقيقة واحد (KI-CSP-DRIFT)
**Priority:** P1 | **Effort:** 2h | **Impact:** +6% أمان | **Risk:** Med
**Depends on:** BAI-DEPLOY-11

**CONTEXT**
CSP مُعرَّفة في ثلاثة أماكن متباينة: scripts/security-headers.mjs، public/_headers، render.yaml.
التباين معترف به في brain.md كـ KI-CSP-DRIFT (cdnjs + Sentry في render.yaml فقط).
`script-src 'unsafe-inline'` و `style-src-attr 'unsafe-inline'` ما زالا مطلوبين
بسبب inline style attrs في 65 ملف.

**TASK**
1. اجعل `scripts/security-headers.mjs` المصدر الوحيد؛ ولّد منه _headers وقسم render.yaml آليًا.
2. أضف فحص drift يفشل البناء عند أي اختلاف.
3. أزل cdnjs.cloudflare.com بالكامل (استضف الأصول محليًا).
4. ابدأ إزالة inline style attrs من الـ65 ملف على دفعات (هذا البرومبت: الدفعة الأولى 20 ملفًا).
5. فعّل HSTS preload عبر Cloudflare Transform Rule.

**ACCEPTANCE**
- [ ] `pnpm run verify:csp-drift` = 0 اختلاف
- [ ] لا طلبات لـ cdnjs في أي صفحة
- [ ] ترويسة CSP على الإنتاج مطابقة حرفيًا للمصدر

**DONE** سياسة أمنية واحدة، مُولَّدة، ومُتحقَّقة على الإنتاج.
````

````markdown
### PROMPT [ID: BAI-REPO-13] — تنظيف الريبو من ملفات الحالة الضخمة
**Priority:** P2 | **Effort:** 2h | **Impact:** +4% صيانة | **Risk:** Low

**CONTEXT**
`.agents/brain.md` ~956KB و `.agents/AGENTS.md` ~172KB داخل الريبو، ويُعدَّلان في كل commit
(60 سطرًا في آخر commit وحده). ملفات حالة داخلية تلوّث سجل git وتُبطئ الاستنساخ.

**TASK**
1. تحقق أنها مستثناة من artifact النشر (يجب أن تكون 404 — يغطيها BAI-SEC-10).
2. انقل change ledger إلى ملفات شهرية منفصلة بدل ملف واحد متضخم.
3. راجع محتواها بحثًا عن أسرار/مفاتيح/بيانات عملاء قبل بقائها في ريبو عام.
4. قرّر صراحةً: خاص أم عام؟ لو عام، احذف كل ما لا يُقصد نشره.

**ACCEPTANCE**
- [ ] لا ملف حالة > 200KB في main
- [ ] 0 نتائج لبحث أنماط الأسرار في .agents/**
**DONE** الريبو نظيف من ملفات الحالة المتضخمة والمحتوى غير المقصود نشره.
````

````markdown
### PROMPT [ID: BAI-GROWTH-10] — الأساس غير المرتبط بالفهرسة
**Priority:** P2 | **Effort:** 4h | **Impact:** +12% زيارات سعودية | **Risk:** Low
**Depends on:** BAI-DEPLOY-11

**CONTEXT**
حتى مع فهرسة مثالية، الموقع كيان جديد على دومين .site يتصادم اسميًا مع bright.ai الأمريكية،
وبلا backlinks ولا Google Business Profile. الاعتماد الكامل على العضوي يعني أشهرًا بلا زيارات.
schema يعلن sameAs لـ LinkedIn/X/YouTube/TikTok/Crunchbase — يجب التحقق أن كلها 200 حقيقية.

**TASK**
1. افحص كل رابط sameAs؛ احذف أي رابط لا يرجع 200 (رابط ميت في schema يضر الثقة).
2. جهّز Google Business Profile: NAP مطابق حرفيًا لعنوان schema (الرياض، حي الفيحاء، 14254).
3. وحّد NAP عبر الموقع وGBP وLinkedIn.
4. أنشئ 5 صفحات هبوط عربية لنوايا تجارية محددة (حوكمة AI، امتثال PDPL،
   ضوابط NCA ECC، ISO 42001، تقييم جاهزية) — كل صفحة ≥900 كلمة أصلية.
5. حوّل صفحات المؤلفين الوظيفية إلى أشخاص حقيقيين بأسماء وسير وروابط، أو احذفها.
6. اختبر ذكر الموقع في ChatGPT/Perplexity بـ10 أسئلة سعودية ووثّق النتائج.

**ACCEPTANCE**
- [ ] 0 روابط sameAs ميتة
- [ ] NAP متطابق في 3 مواضع
- [ ] 5 صفحات منشورة ومفهرسة
**DONE** الظهور السعودي لم يعد رهينة الفهرسة العضوية وحدها.
````

---

## ٨. ترتيب التنفيذ

| الدفعة | البرومبتات | الإجمالي بعدها |
|---|---|---|
| 1 (اليوم) | BAI-SEC-10 → BAI-DEPLOY-11 | 45% → **72%** |
| 2 (48 ساعة) | BAI-PROC-12، BAI-IDX-11 | 72% → **79%** |
| 3 (أسبوعان) | BAI-SEC-11، BAI-REPO-13 | 79% → **83%** |
| 4 (90 يومًا) | BAI-GROWTH-10 + الحزمة الأولى المتبقية | 83% → **89%** |

---

## ٩. ما زلت أحتاجه لرفع الثقة فوق 85%

تصدير GSC (حالات التغطية + أداء السعودية لـ90 يومًا)، لقطة إعدادات Cloudflare (Security Level, Bot Fight Mode, Cache Rules)، سجلات نشر Render لآخر 24 ساعة، ولوحة خدمات Render (هل توجد أكثر من خدمة على نفس الدومين؟ هذه فرضيتي الأولى لتفسير `/frontend/server.js`).

**وقد أكون مخطئًا في نقطة:** استنتاجي بأن الخادم القديم هو الذي يعمل مبني على استدلال من ترويسات ورموز حالة، لا من سجلات Render. البديل المحتمل أن Cloudflare يخدم نسخة مخبأة قديمة — وهذا أسهل بكثير في الحل. سجلات Render وحدها تحسم أيهما، وهي أول ما يجب أن تفتحه بعد قراءة هذا التقرير.