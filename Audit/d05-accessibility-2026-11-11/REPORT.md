# D05 — الوصول والتباين وحالات عناصر التحكم

- **التاريخ:** 2026-11-11، 18:20–19:00 +0300.
- **البيئة:** macOS arm64، Node `22.22.2`، npm `10.9.7`، Astro `6.4.8`، Chromium عبر chrome-devtools (dev server محلي `127.0.0.1:4422`).
- **HEAD النهائي:** `e5473c63f5d92480c091ba9266b83630a09045cc` + working tree (10 ملفات مصدر + هذا المجلد).
- **خط الأساس المقاس:** `6a3d53f41b5bd1af59eb320245745498765bd320`. الانحراف: HEAD تقدم قبل البدء إلى `7d5a900a` (D01–T06) وإلى `e5473c63` أثناء التنفيذ (تعديل `Audit/brightai-closure/README.md` فقط). لا تعارض مع ملفات D05؛ أُعيد فحص الانحراف قبل كل تعديل.
- **النطاق المنفذ:** محلي فقط. المصدر والمنشور لم يُنشرا، ولم يُنشأ commit/branch/push.
- **بيئة التشغيل:** `npm run dev` يفشل في هذه النسخة لأن `node_modules/@esbuild/darwin-arm64/bin/` يحوي الملف باسم `esbuild 2` لا `esbuild`. شُغّل dev عبر `ESBUILD_BINARY_PATH=<...>/esbuild 2` دون تعديل `node_modules` ولا المستودع.

## السبب الجذري

لم يكن نقص تباين في الحالة الساكنة. الحالات الساكنة كانت تمر (أدنى نسبة مقاسة 4.60:1). العيب في **حالات hover/focus**:

1. `.button:hover` يجمع `background:#9166ff` مع `filter:brightness(1.12)`؛ الأبيض على الناتج `#a272ff` = **3.29:1**.
2. `#run-demo:hover/focus-visible` يغيّر الخلفية إلى `#906bff` = **3.66:1**.
3. `.kc-read:hover/focus-visible` كان يغيّر الخلفية إلى `#9166ff` **و**يرث لون رابط الصفحة الكهرماني `#ffb829` من قاعدة `.page a:not(.button)…:hover` = **2.19:1**.
4. أزرار التطبيقات كانت تستخدم `filter:brightness(1.08)` على `#8052ff` = **4.24:1** (تحت 4.5). خفض brightness إلى `.94` خفّض النص أيضاً إلى **4.47:1**، لذلك استُبدل بطبقة تعتيم داخلية لا تمس النص.

## التغييرات (10 ملفات)

| الملف | التغيير | السبب |
|---|---|---|
| `src/styles/variables.css` | `--color-action-hover-strong: #6f43e6` | توكن hover للنص الأبيض 14px بنسبة **5.80:1**؛ `--color-action-hover` القديم 3.78:1 ويبقى للأسطح غير النصية |
| `src/styles/tokens.json` | توثيق `action-hover-strong` وتحديث وصف `action-hover` | مصدر التوكنات يطابق CSS |
| `src/styles/interior.css` | تجاوز hover لـ`.interior-page .button` إلى التوكن الجديد مع `filter:none` | إصلاح 3.29 → **5.80** في contact/pricing/products/docs والفورم |
| `src/styles/interior.css` | `#run-demo:hover/focus-visible` إلى التوكن الجديد | إصلاح 3.66 → **5.80** مع إبقاء حلقة focus 3px |
| `src/pages/index.astro` | `.closing .button:hover` فقط (خارج Hero) إلى التوكن الجديد | إصلاح 3.29 → **5.80** دون لمس `.hero` |
| `src/styles/knowledge-center.css` | hover/focus لـ`.kc-read`: خلفية strong + `color: white !important` | إصلاح 2.19 → **5.80**؛ يمنع وراثة الكهرماني على زر ممتلئ |
| `src/styles/kernel.css` | `button:not(:disabled):hover`: `box-shadow: inset 0 0 0 999px #0000001f` بدل `brightness(1.08)` | تعتيم الخلفية فقط؛ النص يبقى أبيض. القياس المرئي **5.69:1** |
| `src/styles/risk-engine.css` | نفس الاستبدال | 4.24 → **5.69** على أزرار Risk Engine |
| `src/styles/secure-chat.css` | نفس الاستبدال | 4.24 → **5.69** على أزرار Secure Chat |
| `src/pages/docs.astro` | `role="group"` على `.kc-active` | `aria-label` على `div` عام كان ممنوعاً (axe serious) ويُهمَل؛ صار الاسم يُعلَن |
| `src/pages/app/kernel/index.astro` | إزالة `role="status"` من `<ul>` وإبقاء `aria-live="polite" aria-atomic="true"` | `role=status` على `<ul>` كان يلغي دلالة القائمة ويكسر `listitem` لثمانية عناصر |

## القياسات

الطريقة: computed styles من Chromium، ثم دمج الخلفية مع `filter`/`opacity`/الطبقة الداخلية، ثم نسبة WCAG 2.x. وأُخذت عينات بكسل فعلية من screenshots العناصر للتأكيد.

| العنصر/الحالة | قبل | بعد |
|---|---|---|
| `.button` (contact) hover | `#a272ff` + أبيض = **3.29** | `#6f43e6` + أبيض = **5.80** (بكسل فعلي `111,67,230`) |
| `.closing .button` hover | **3.29** | **5.80** |
| `#run-demo` hover/focus | `#906bff` = **3.66** | `#6f43e6` = **5.80** (بكسل فعلي مطابق) |
| `.kc-read` hover/focus | `#9166ff` + كهرماني `#ffb829` = **2.19** | `#6f43e6` + أبيض = **5.80** |
| زر تطبيق (Risk `[data-reload]`) hover | `#8a59ff` = **4.24** | داخلية 12% = **5.69** (بكسل فعلي `112,72,224`) |
| الحالة الساكنة `#8052ff` + أبيض | **4.60** | **4.60** (بلا تغيير) |
| Hero `.hero .button` hover | `#9166ff` + `brightness(1.12)` | **مطابق قبل/بعد** (تحقق حي) |

عينات محفوظة: `button-default.png`، `button-hover.png`، `contact-button-hover.png`، `run-demo-hover.png`.

## التحقق

| الفحص | النتيجة | الدليل |
|---|---|---|
| axe-core 4.10.2 على 26 مساراً عاماً + حالات عدم الدخول لمسارات `app` | **PASS** — صفر مخالفات، عدا ملاحظة واحدة موثقة أدناه | `main` في كل صفحة |
| `/docs/` بعد الإصلاح | **PASS** — صفر مخالفات (كانت `aria-prohibited-attr`) | `.kc-active` = group باسم |
| `/app/kernel/` بعد الإصلاح | **PASS** — صفر مخالفات (كانت `aria-allowed-role` + `listitem`×8) | شجرة الوصول: `list atomic live=polite` |
| لوحة المفاتيح — contact | **PASS** — Tab 11 مرة، حلقة `2px #ffb829` | computed outline |
| لوحة المفاتيح — `/kernel/` `#run-demo` | **PASS** — Tab 10 مرات، خلفية 5.80 وحلقة `3px #ffcf66` | computed |
| لوحة المفاتيح — `/app/risk-engine/` | **PASS** — Tab 15 مرة، حلقة `2px #ffb829` | computed |
| إعلان الاختيار | **PASS** — `aria-pressed` و`role=status` يتحدثان في Firewall/Ledger/Risk/Human Gate/Secure Chat | تنشيط Enter ومقارنة `aria-pressed` والنص الحيّ |
| Escape في معاينة docs | **PASS** — أغلق المعاينة وأعاد focus إلى زر «معاينة سريعة» | `hidden`/`is-open`/activeElement |
| reduced motion | **PASS** — `prefers-reduced-motion: reduce` ⇒ مدة الانتقالات `0s` والعناصر ظاهرة | emulation + computed |
| Hero/الهيدر/الشعار/Constellation | **PASS** — لم تُعدّل ملفاتها؛ hover الـHero مطابق حرفياً | diff + computed |
| قارئ شاشة فعلي | **NOT RUN** — لا قارئ شاشة في بيئة التنفيذ | — |
| حوار Ledger المخوّل/Escape داخل التطبيق | **NOT RUN** — يحتاج جلسة T03 | — |
| المنشور `brightai.live` | **NOT RUN** — لا نشر؛ التغيير محلي | — |

## استثناءات مفتوحة

- **Hero:** عيب الوصول المعروف في Hero يبقى استثناءً مفتوحاً ولم يُعدّل (قياس hover قبل/بعد مطابق).
- **Firewall `aria-pressed`:** السلوك المثبت حياً (E13) مستبعد من الإصلاح ولم يُلمس.
- **Pricing `<aside class="quote-scope">`:** axe يبلّغ `landmark-complementary-is-top-level` (moderate، عقدتان). بنيوي وخارج معايير D05؛ لم يُعدّل. يحتاج مهمة بنية/معالم منفصلة.
- **`.kc-read`:** التباين مُقاس حياً على العنصر بعد فتح المعاينة، لكن قارئ الشاشة لم يُختبر.

## قرارات

- **Internal:** حالات hover/focus والتباين المحددة أُغلقت محلياً بدليل قابل لإعادة القياس؛ يبقى Internal **NOT READY** كحكم عام لأن T01/T03 والتشغيل الحي مفتوحان.
- **Public Beta:** **NO-GO** — لم يتغير حكم الإطلاق؛ هذا إصلاح وصول محلي لا شهادة WCAG شاملة.
- **Commercial:** **NO-GO** — لا أدلة UAT/تشغيل/تعاقد في هذه الجولة.

> `PASS ≠ RELEASED`. لا تُقرأ هذه الورقة كشهادة امتثال WCAG كاملة؛ التغطية هي الحالات والمسارات المذكورة فقط.
