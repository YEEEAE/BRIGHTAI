## [2026-11-03] — صقل أقسام الرئيسية: حوكمة، مشكلة، ركائز، خطوات، بطاقات
### تم التنفيذ
- `governance-statement`: رُفع حد الشفافية من `.1` إلى `.72` فبقيت العبارة الثانية مقروءة أثناء التمرير بدل أن تختفي، وأصبح التشديد الكهرماني بوزن 600 مع `text-wrap: balance`؛ العبارتان والنص والتتابع كما هما.
- `#problem .problem-copy`: النص على `--color-text-copy`، CTA أبيض بسهم كهرماني، وحد داخلي علوي؛ مواضع العمودين والسهم لم تتغير.
- `#principles .pillar`: إطار 1px `--border-strong` وradius 12، حلقة focus كهرمانية عبر `:focus-within`، أيقونة `clamp(96px,8.6vw,124px)`، رقم الركن على نفس السطر البصري، وشرطة قصيرة قبل الملاحظة، وسهم CTA كهرماني.
- `#how-it-works .steps`: أرقام دائرية 34px (28px على 390) بوزن 600، وأسهم 18px بلا إطار متمركزة تحت الرقم، واتجاه التدرج صار 260deg لـRTL؛ لا خطوة جديدة ولا تغيير نص.
- `home-products`/`#solutions`: radius 12 موحد، نص الوصف على `--color-text-copy`، ودفعة 3px لأسهم الروابط على hover/focus فقط؛ الترتيب والمصفوفة لم يتغيرا.
- `site.css`/`experience.css`/`pages.css`/`ProductIcon.astro` لم تُعدّل: الأولى مشتركة وقد تمس الهيدر/الهيرو، والأخيرة غير مستخدمة في الرئيسية.
- مراجع: 21st `How It Works Timeline` (أرقام دائرية وتسلسل)؛ Lazyweb `OpenAI Frontier` و`Zscaler Risk360` (هرمية بطاقات المنتج)؛ MGD `Harvard Bridge Plaque` (وزن/تباين العنوان التحريري)؛ Figma NOT APPLICABLE — لا fileKey/رابط BRIGHT AI في المستودع.
### الملفات المتأثرة
- `src/pages/index.astro`
### التحقق
- Chrome محلي (dev 4331) 1440/1024/390/320: `scrollWidth == innerWidth`، console بلا أخطاء؛ focus على رابط الركن يعطي `rgb(255,184,41)` وحدًا داخليًا؛ hover القطاع `translateY(-2px)` والسهم `translateX(-3px)`؛ reduced-motion: `animation:none` و`0s` وشفافية 1.
- الهيرو/الهيدر محفوظان: H1 100px@1440 و54px@390، زر الهيرو radius 24 و`0.2s`، header 108/160. `git diff --check`: PASS. build/tests/نشر: NOT RUN بطلب الدفعة.
### النتيجة
- **الحالة:** DONE محليًا — NOT_RUNTIME_VERIFIED؛ لا commit/push/deploy.
### ملاحظات / مشاكل مفتوحة
- لا توجد حالة تعلّم مرتبطة بالتمرير في الخطوات؛ لذلك لم يُغيَّر توقيت حالة غير موجودة. لقطات المقارنة أُزيلت بعد الفحص (ملفات مؤقتة).

## [2026-11-03] — فهرس الأقسام على الجوال: فتح/إغلاق آمن، وحذف الفهرس المكرر
### تم التنفيذ
- `section-compass` لم يعد يُثبَّت في نهاية المستند على الجوال؛ صار كشفًا ثابتًا أسفل الحافة (`position:fixed` + `env(safe-area-inset-bottom)`) بارتفاع لوحة `min(50svh,320px)`، ويُغلق بـEscape أو لمس خارجي أو اختيار رابط، مع حلقة تركيز على `summary`.
- منع تغطية CTA: مراقب واحد يخفي الفهرس حين يدخل أي `.button` داخل الشريط السفلي (96px)، ويبقى ظاهرًا إن كان التركيز داخله؛ و`footerInView` بديل عن إخفاء `hidden` المباشر.
- حذف الفهرس المكرر من `/privacy/` و`/terms/`: الشرط صار `!reading`، فلم تعد الصفحات التي تملك `document-toc` تحمل compass ثانيًا (و`docs`/`knowledge` كما كانت).
- `document-toc` صار فهرسًا مقروءًا على سطح المكتب (روابط inline بدل تفاصيل مطوية دائمًا) وكشفًا واحدًا على الجوال عبر `data-document-toc`؛ والضغط على الرابط ينقل التركيز للعنوان ويغلق الكشف على الهواتف.
- `:target` صار واضحًا (تسطير كهرماني) وحلقة تركيز على العناوين القابلة للتركيز، و`scroll-margin-block-start` صار `clamp(24px,4vh,56px)`؛ ووُحّد مؤشر القسم الحالي على الكهرماني في Compass وdocument-toc و`KnowledgeReader` (بدل البنفسجي هناك).
- فواصل Breadcrumb صارت `aria-hidden` بدل نص «/» يُقرأ لقارئ الشاشة. لم تُلمس الهيدر/الهيرو/Constellation/النصوص/الترتيب.
- مراجع: 21st `Table of Contents` (appica-dev، scroll-spy يبرز العنوان الظاهر — الاسترجاع التفصيلي وصل حد الخطة)؛ Lazyweb `notion`/`arista-networks` سطح مكتب و`confluence` جوال (عنوان + وقت قراءة ثم فهرس مختصر)؛ MGD `Church Historical Sign` لوزن الفواصل؛ Figma NOT APPLICABLE — لا fileKey/رابط BRIGHT AI في المستودع.
### الملفات المتأثرة
- `src/components/PageShell.astro`, `src/components/InteriorController.astro`, `src/styles/interior.css`, `src/styles/knowledge-reader.css`
### التحقق
- Chrome محلي (dev 4331) بمقاسات 320/360/390/1440: compass ثابت 184px على الجوال ولا تجاوز أفقي في 10 مسارات، ويختفي عند CTA (قيس `hidden=true` عند تداخل الزر)، وEnter/Escape يعملان ويعيدان التركيز؛ `/privacy/` بلا compass وبلا TOC مطوي على سطح المكتب؛ النقر يعطي `#document-heading-3` + underline + تركيز؛ active في `/knowledge/..` كهرماني `rgb(255,184,41)`. console: بلا أخطاء.
- `git diff --check`: PASS. build/lint/typecheck/tests/نشر: NOT RUN بطلب الدفعة؛ لا commit/push.
### النتيجة
- **الحالة:** DONE محليًا — NOT_RUNTIME_VERIFIED.
### ملاحظات / مشاكل مفتوحة
- `knowledge-center.css` لم يُعدّل: لا تداخل `sticky` فعلي في `/docs/` ولا حاجة لتغيير (الترويسة غير مثبتة أصلًا).
- على الجوال قد يظهر الفهرس فوق زاوية بطاقة أثناء التمرير (طبقة عائمة مقصودة)؛ لا يغطي زرًا أو نصًا، ويختفي عند CTA/الفوتر.


## [2026-11-03] — خريطة النظام: تتبّع مسار واحد، بديل نصي، وإصلاح أزرار ghost
### تم التنفيذ
- `SystemMap`: أُضيف `pathLength="1"` فصارت الأسلاك خطوطًا متصلة بدل نمط 100px؛ عند hover/focus تُرسم وصلة المنتج المختار وحدها خلال 700ms (داخل 550–900) ثم تستقر، وتخفت الأربع الأخرى إلى `.26` مع بقاء أسماء كل العقد. أُبطلت حركة `draw-route` الجماعية على أي hover عبر تجاوز بخصوصية أعلى في `interior-motion.css` (بدون تعديل `experience.css`).
- أُضيف بديل نصي `<ul class="map-index">` بخمسة روابط (44px) داخل الشكل، ويعمل أيضًا كوسيلة إيضاح لأن JS الحالي يقرأ أي رابط `/products/` ويضيء وصلته. صُحّح انزياح bidi للأرقام والأسماء اللاتينية بـ`text-align:end` فأصبحت على حافة قراءة البطاقة.
- 320px: صف الرقم أصبح inline مع العنوان وأُزيل تزاحم بطاقتي Secure Chat/Ledger مع نواة AIGAS Kernel؛ لا تجاوز أفقي ولا نص مقصوص.
- `button.ghost` في `KernelSequence` و`RedactionDemo` كان يعرض chrome المتصفح الرمادي (لا خلفية/حد من `.ghost`)؛ عولج محليًا في نطاق `interior-motion.css` فقط.
- `DecisionCircuit`: عند اختيار قرار تخفت المسارات الأربعة الأخرى إلى `.3` فيُقرأ المسار المختار وحده دون تغيير المنطق أو النصوص.
- متروك بقصد: خريطتا Decision Journey في `/kernel/` وKnowledge Connections في `/docs/` — الأولى تكرر K1–K4 القائمة في `KernelSequence`، والثانية تكرر فهرس الأدلة ومساحة المنتجات القائمين؛ شرط الدفعة يمنع القسم المكرر.
### الملفات المتأثرة
- `src/components/SystemMap.astro`, `src/styles/interior-motion.css`
### التحقق
- Chrome محلي (dev 4331) على `/products/` و`/products/firewall/` و`/kernel/` و`/pillars/privacy/` بمقاسات 1440 و390 و320: لا تجاوز أفقي ولا أخطاء console؛ hover/focus يضيء سلكًا واحدًا 700ms والبقية `.26`؛ reduced-motion يعطي `animation:none` و`0s`؛ زر ghost صار 48px بحد `--ui-line` بدل الرمادي الأصلي.
- `git diff --check`: PASS. build/lint/tests/نشر وFigma: NOT RUN / NOT APPLICABLE بطلب الدفعة.
### النتيجة
- **الحالة:** DONE محليًا — NOT_RUNTIME_VERIFIED؛ لا commit/push/deploy.
### ملاحظات / مشاكل مفتوحة
- سطر نواة الخريطة الفرعي بقي 9px على الجوال: أي زيادة إلى 10.5px تجعله أوسع من الفراغ بين بطاقتي 05 و02 فيُرسم تحتهما.
- `docs/` و`kernel/` لم يُضف إليهما قسم جديد للأسباب أعلاه.

## [2026-11-03] — ترشيد حركة الصفحات الداخلية وعزل عنوان الهيرو عن قاعدة h1 العامة
### تم التنفيذ
- أُزيلت قاعدة `h1 { animation: title-in }` العامة من `experience.css` مع keyframeها؛ الفحص أثبت أنها كانت بلا أثر فعلي (`.interior-page h1` تمنعها و`.hero h1` تتجاوزها) وكانت خطرًا على الهيرو عند إعادة ترتيب CSS. لا تغيير بصري في الهيرو/الهيدر.
- كشف حركة العنوان في `interior-motion.ts` فقد كان `clipPath: inset(0 0 20% 0)` يقص ذيول الحروف العربية 480ms؛ صارت `title` = opacity .88 + translateY(6px) بلا قص، و`rise` 12→8px، والرسم 800→700ms مع stagger ≤200ms (السقف 900ms).
- حُذف نبض `.map-core` (900ms) لأنه زخرفة تنافس رسم الأسلاك في المنطقة نفسها؛ بقي ظهور اللوحة + draw واحد.
- `MotionController` صار one-way: مجموعة `pending` تُفرغ بعد أول ظهور، فتبديل `prefers-reduced-motion` لا يعيد تشغيل الصفحة، و`settle()` يوقف المراقب نهائيًا.
- جُمّعت استجابة أزرار قرار Firewall في مالك واحد داخل `interior-motion.ts` (state + label + نتيجة + packet) وأُزيلت النسخة المكررة و`animate` من `InteriorController`.
- وُحّدت مدة `.sequence-stages` و`.lock-shackle` و`.ghost` و`.map-path` على `--ui-fast/--ui-state` بدل 160/220ms مكتوبة.
- مراجع: 21st `Underline Tabs` (المؤشر يحمل الحالة والمحتوى ثابت)؛ Lazyweb `campsite`/`chameleon`/`appcues` (feedback عند نقطة الإجراء لا احتفال ملء الشاشة)؛ MGD لا مرجع Motion فعلي ⇒ اعتُمد مبدأ الهرمية الساكنة (Church Historical Sign). Figma NOT APPLICABLE — لا fileKey/رابط BRIGHT AI في المصدر.
### الملفات المتأثرة
- `src/styles/experience.css`, `src/styles/interior-motion.css`, `src/components/MotionController.astro`, `src/components/InteriorController.astro`, `src/scripts/interior-motion.ts`
### التحقق
- Chrome محلي (dev 4331) 1440/390/320 على `/`, `/products/`, `/products/firewall/`, `/kernel/`, `/docs/`: بلا تجاوز أفقي وبلا أخطاء console؛ إطارات عنوان الداخل بلا `clipPath`؛ تقليل الحركة = 0 WAAPI وopacity 1 مع بقاء التفاعل يعمل؛ الهيرو كما هو (h1 animation none، radius 24، 0.2s، header 108px)؛ `git diff --check`: PASS.
- build/lint/typecheck/tests/نشر: NOT RUN بطلب الدفعة. تغيير التفضيل الحي لم يُرصد عبر CDP لأن emulation لا يطلق `MediaQueryList.change`؛ مسار `settle` مُتحقق مصدريًا فقط.
### النتيجة
- **الحالة:** DONE محليًا — NOT_RUNTIME_VERIFIED؛ لا commit/push/deploy.
### ملاحظات / مشاكل مفتوحة
- تُرك hover `.catalog-row` بتغيّر `padding-inline` (reflow) لأنه قرار تصميمي خارج نطاق الدفعة؛ و`InteriorMotion.astro` بلا تعديل لأن init/teardown الحالي متوازن.
- `/auth/*` فقدت ارتفاع العنوان 10px بعد إزالة قاعدة h1 العامة؛ لا أثر على الهيرو أو المحتوى.

## [2026-11-03] — توحيد أيقونات المنتج/المعرفة وحالات الأسطح والأزرار في صفحات الداخل
### تم التنفيذ
- وُحّد الرمز البصري: `ProductIcon` و`KnowledgeIcon` على شبكة 24 و`vector-effect="non-scaling-stroke"` بعرض 1.6px، فبقي السطر نفسه عند 24 و34 و46px بدل أن يثقل مع التكبير؛ `KnowledgeIcon` صار يقبل 16/20/24/32 و`label` اختياريًا. لم يُستخدم درع العلامة كأيقونة قسم.
- صُقلت أسطح البطاقات: بطاقات التسويق ثابتة بلا Hover، ولا تتجاوب إلا البطاقات/الصفوف التي تحتوي رابطًا فعليًا أو زرًا ممكنًا (`catalog-row`, `map-node`, `product-card`). وُحّدت نصف الأقطار على رموز `radius-*` القائمة وأضيف حد داخلي هادئ.
- الأزرار: Primary/Secondary/Ghost على ارتفاع ولمسة تركيز متسقة، ومُنع hover/transform على المعطّل؛ تظهر حالات kernel غير المهيأة (dashed + نص) منفصلة عن الفشل الأحمر، وأضيفت أشكال صغيرة (دائرة/معيّن/مربع) لحالات `health-state` و`availability` و`connection` حتى لا يكون اللون وحده دلالة.
- Knowledge Center: أُوقف Hover على الأزرار المعطّلة أثناء التحميل/غياب JS، ورُفع زر المسح إلى 44px، ووُحّدت radii وفواصل الحالة، وأضيف مؤشر جهة لـ`kc-product-status`. النصوص والروابط والترتيب لم تتغير.
- MCP: 21st `Button` (originui) + `Multi state badge` + `Base Input` (variants/focus/disabled)؛ Lazyweb `eeye-digital-security` (Cybersecurity dashboard: حالة أعلى الشاشة ثم تفاصيل)؛ MGD `check` (Heroicons/Lucide، 24 grid، round caps)؛ Figma متصل لكن لا fileKey/رابط BRIGHT AI في المصدر ⇒ NOT APPLICABLE. لم يُنشأ تصميم خارجي.
### الملفات المتأثرة
- `src/components/ProductIcon.astro`, `src/components/KnowledgeIcon.astro`
- `src/styles/interior.css`, `src/styles/pages.css`, `src/styles/knowledge-center.css`, `src/styles/kernel.css`
### التحقق
- Chrome محلي (dev 4399): `/products/`, `/products/firewall/`, `/docs/`, `/pricing/`, `/app/kernel/` عند 1440 و390 و320: لا تجاوز أفقي، لا خطأ CSS، الأيقونة 34px بسماكة 1.6، ghost 44px وحلقة تركيز 2px كهرمانية، reduced-motion = 0s. حالة البحث الفارغة تعمل بأيقونة ونص. لقطات بعد التعديل فقط؛ baseline قبل التعديل NOT CAPTURED، والمقارنة مع الإنتاج NOT RUN.
- `git diff --check`: PASS. build/lint/tests/اختبارات آلية/نشر: NOT RUN حسب طلب الدفعة. `504 Outdated Optimize Dep` ظهر من Vite بعد HMR وليس خطأ صفحة (كل المسارات 200).
### النتيجة
- **الحالة:** DONE محليًا للصفحات المتاحة؛ NOT_RUNTIME_VERIFIED. لا commit/push/deploy ولا تغيير Neon/GitHub. `PageShell` بلا تعديل لأن أي تغيير فيه قد يمس فروض الصفحة المشتركة دون حاجة.
### ملاحظات / مشاكل مفتوحة
- الفحص البصري عيّنة لا تغطية لكل تركيبات الحالات؛ حالات `error/success` الحقيقية تحتاج بيانات تشغيل لا تتوفر محليًا. بناء الإنتاج نفسه NOT RUN.


## [2026-11-03] — توحيد رموز الحركة والقراءة العربية في CSS العام
### تم التنفيذ
- أصبح `variables.css` المصدر الوحيد للحركة/السهولة و`theme.css` نقطة استيراد بلا تعريفات (أُزيل تكرار radius وinterior aliases). أُضيفت `--color-text-copy`, `--motion-hover:140ms`, `--motion-state:220ms`, `--transition-control`، و`--radius-system: var(--radius-control)`.
- حُذفت رموز النوع/الزوايا الميتة غير المستخدمة (`--text-heading*`, `--leading-heading*`, `--text-display`, `--radius-nav/cards/tags`, `--font-ppneuemontreal`) بعد التأكد من صفر استدعاءات.
- القراءة: `.page .lead` وinterior copy على alias واحد؛ `.interior-page .note` 14→15px؛ caption الخريطة وfigcaption/map-status 11→12px؛ استُبدل 15 تكرار `#bdbdbd` في `interior.css` بـ`--color-text-muted` دون تغيير القيمة.
- العزل: `unicode-bidi: isolate` لـ`.latin` وأرقام/IDs/عناوين المنتجات اللاتينية؛ لا تقسيم حروف ولا تتبع سالب. حركة الأزرار 220→140ms عبر `--transition-control`، والهيرو محفوظ بـ`0.2s` وradius 24.
- مراجع: 21st (Typography primitives: hierarchy = size/weight/space)؛ Lazyweb (Basedash dark dashboard: surface/border hierarchy)؛ MGD (Neon Arabic Poster, Duo Security brand guidelines للتباين)؛ Figma NOT APPLICABLE — لا fileKey/رابط تصميم في المستودع.
### الملفات المتأثرة
- `src/styles/{variables,theme,site,experience,interior}.css`, `src/styles/tokens.json`.
### التحقق
- `tokens.json` JSON صالح و`git diff --check`: PASS. Chrome محلي 1440/390/320 على `/`, `/products/`, `/products/firewall/`, `/docs/`: لا تجاوز أفقي؛ الهيرو/الهيدر/Constellation بلا تغيير (H1 54px@390، زر Hero radius 24 و0.2s)؛ reduced-motion يعطي 0ms. build/tests/نشر: NOT RUN بطلب الدفعة.
### النتيجة
- **الحالة:** DONE محليًا — NOT_RUNTIME_VERIFIED؛ لا commit/push/deploy.
### ملاحظات / مشاكل مفتوحة
- `docs/BRAND-AND-DESIGN-SYSTEM.md` يذكر تضارب radius قديم لم يعد قائمًا؛ تحديثه يحتاج دفعة توثيق منفصلة. الفحص البصري عيّنة لا تغطية شاملة.

## [2026-11-03] — جرد UI محمي وتحسين دلالي محدود لفهرس المنتجات
### تم التنفيذ
- أضيف `ui_batch_baseline` إلى Registry: توسيع 5 منتجات/4 قطاعات/3 أركان و12 مقالاً، ملكية CSS والمكونات المشتركة، وترتيب أقسام الصفحات الأربع وحدود التجميد للدفعات التالية. صُحح عداد ملفات API في السجل إلى 29؛ لا تغيير API.
- رُبط قسما الفهرس والتحقق في `products/index.astro` بعنوانيهما الحاليين عبر أربع سمات فقط؛ لا تغيير نصوص أو روابط أو CSS أو ترتيب أو هيدر/هيرو/شعار.
- مراجع Lazyweb: bettermode/services وGitbook؛ MGD: Architectural Blueprint Sheet (مطابقة جزئية). Figma لم يعرض ملف مشروع أو رابطاً صالحاً للاكتشاف؛ لا تصميم خارجي أُنشئ.
### الملفات المتأثرة
- `src/pages/products/index.astro`, `docs/WEBSITE-PAGE-REGISTRY.yaml`, `.agents/mind/01-mind-latest.md`.
### التحقق
- YAML وdiff وفحص تطابق المصدر بعد استبعاد السمات الأربع: PASS. Chrome للعام والنسخة الحالية `/`, `/products/`, `/docs/`, `/contact/` عند 1440 و390 فعلياً: لا تجاوز أفقي بالعينة. مرجعَا العناوين موجودان وفريدان.
- المعاينة الحالية أُطلقت على 4322؛ عملية سابقة تشغل 4321 واستُبعدت من الدليل. resize إلى 390 أعطى 500 أولاً، ثم أُعيد بمحاكاة viewport مؤكدة 390.
- Build/tests وإرسال النماذج والنشر: NOT RUN. الجرد الدلالي التفصيلي لكل صفحة عامة و320px والوصول الشامل: NOT VERIFIED.
### النتيجة
- **الحالة:** PARTIAL للجرد الشامل؛ التحسين المحدود منفذ محلياً. لا commit/push/deploy أو تغيير خارجي.
