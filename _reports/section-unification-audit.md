# BAI-SECTION-UNIFICATION-001 — جرد وتوحيد أقسام BRIGHTAI

**التاريخ:** 2026-09-01  
**النطاق:** `src/pages/**/*.astro` و`src/components/**/*.astro`  
**استثناء ثابت:** `src/components/SiteBackground.astro` و`public/media/brightai-background*` لم تُراجع بغرض التعديل ولن تُمس.

## الملخص التنفيذي

الموقع يملك نظام تصميم قويًا أصلًا للبطاقات وأسـطح القراءة، لكن إيقاع الأقسام انقسم بين وصفة رئيسية متجاوبة ووصفة داخلية ثابتة. أدى ذلك إلى فرق واضح بين الصفحة الرئيسية والصفحات التجارية/المعرفية رغم أنها تستخدم نفس الخلفية المتحركة.

القرار المعتمد في هذه المهمة هو جعل **عقد التباعد المتجاوب 64px على الجوال → 128px من 1024px** هو المرجع الوحيد. تبقى `inner-section` و`home-section--padded` aliases توافقية فقط كي لا تنكسر القوالب أو الصفحات المولدة؛ لا توجد بعد الآن قيمتان متنافستان لهما.

## منهجية الجرد

- فُحصت **185** ملف Astro تحت `src/pages` و`src/components`.
- وُجدت **450** عقدة `<section>`، مع عائلات مستقلة للـHero وFAQ وCTA وKernel والـpricing والـdocs.
- حُسبت الفئات من المصدر، لا من لقطات أو افتراضات.
- قُرئت تعليقات `BAI-VOC-*` و`BAI-SEO-*` و`REPORTS-SEO-KEYWORDS-*` في القوالب المحمية قبل تعديل أي سطر قريب منها. لا تغيّر هذه المهمة روابط أو خصائص `data-*` أو نصوصًا محمية.

## الوضع قبل التوحيد

| نمط القسم | النسخ/الاستخدام | أين يظهر | الملاحظة |
| --- | ---: | --- | --- |
| `home-section--padded` | 12 استخدامًا، ملف واحد | `src/pages/index.astro` | 64px على الجوال و128px على desktop؛ هو الأفضل تقنيًا. |
| `inner-section` | 121 استخدامًا، 37 ملفًا | about/services/contact/solutions/kernel/events/trust/customers وغيرها | 4rem ثابتة بلا توسع desktop. |
| `py-* lg:py-*` مباشر على section | 2 | `src/pages/index.astro` | تسرب يدوي يكسر الإيقاع حتى داخل الرئيسية. |
| `section__eyebrow` / `section__title` | 12 / 46 ملفًا | معظم القوالب التسويقية والمحتوى | البنية نفسها تتكرر يدويًا، رغم وجود primitive. |
| `SectionHeading.astro` | 0 صفحة إنتاجية | stories فقط | معلن كـcanonical لكنه شبه ميت. |
| `Card.astro` | 0 صفحة إنتاجية | لا يوجد | لا يمكن تفعيله آليًا بدون فقد attributes مثل `data-cta`؛ يبقى primitive اختياريًا ولا يحل محل card markup الغني. |
| `card--glass` | 11 ملفات | الرئيسية، FAQ، partners، case studies | سطح القراءة الصحيح للنصوص/المجموعات الكثيفة. |

## عائلات الأقسام الفعلية

| العائلة | مؤشرات المصدر | العدد/الانتشار | وصفة التوحيد |
| --- | --- | --- | --- |
| Hero | `inner-hero` (67 occurrence / 24 ملفًا)، `SplitHero` | الرئيسية، الحلول، القطاعات، المحتوى | تظل ذات هوية مستقلة، وتلتزم بسطح hero والتباين. |
| شبكات ميزات/حلول | `inner-grid` (33/6)، grid محلية | services/solutions/trust/events | تستخدم padding القسم الموحد وحاوية grid الحالية. |
| FAQ | `inner-faq` (14/9)، `home-faq-item` (10/8) | الرئيسية، الخدمات، الثقة، الحلول | لا تغيير لسلوك accordion؛ السطح وقياس النص مركزيان. |
| CTA | `inner-cta-final` (55/11)، `content-cta-final` (6/3)، `home-cta-strip` | نهاية الصفحات التجارية/المحتوى | CTA له density خاصة لكنه يرث padding الموحد بدل قيم محلية متباعدة. |
| إحصاءات | `home-stat-card` وkernel/pricing/docs stats | 77 ملفًا تتضمن تسمية stat | بطاقات/أرقام لا تصبح نصًا عاريًا فوق الوسيط. |
| امتثال | `compliance*` | 264 occurrence / 31 ملفًا | يبقى model/semantic markup كما هو؛ يطبق surface وmeasure على الوصف. |
| شهادات | `CaseStudy` وtestimonial | حالة واحدة/مكوّن مشترك | يستهلك alias الموحد مباشرة. |

## الخلفيات ambient

| الصنف | الاستخدام الحالي |
| --- | --- |
| `bg-ambient-teal-top` | الرئيسية + `solutions/index` و`solutions/[sector]` و`solutions/[slug]` |
| `bg-ambient-dots` | الرئيسية فقط |
| `bg-ambient-indigo-bottom` | الرئيسية فقط |

**القرار:** هذه الخلفيات تخص الأسطح التسويقية الغنية التي تعرض طبقات حلول أو دعوة قرار، وليست زخرفة افتراضية للـdocs أو الصفحات القانونية أو صفحات Kernel التشغيلية. تعميمها سيضيف حركة/طبقات بصرية بلا معنى إلى محتوى مرجعي، لذلك بقيت opt-in موثقة بدل تطبيق عشوائي.

## العقد المعتمد بعد التوحيد

1. `section--padded` هو الاسم الدلالي الجديد؛ `home-section--padded` و`inner-section` aliases له.
2. كل heading section يستخدم نفس التسلسل البصري: eyebrow ثم H2 ثم subtitle، مع محاذاة RTL-aware وقياس subtitle لا يتجاوز `65ch`.
3. العنوان أو الوصف الظاهر بلا سطح محلي يملك text shadow بنفس وصفة الـsplit hero؛ المجموعات النصية تستخدم surface أو card glass القائمين.
4. التباين يقاس عبر `scripts/qa/verify-contrast-on-media.mjs`: النص العادي والروابط 4.5:1 على أسوأ طرفي الفيديو؛ الأرقام/العناوين الكبيرة لا تقل عن 3:1.
5. `Card.astro` لا يستبدل markup اليدوي الغني في هذه الجولة: المكوّن لا يمرر attributes التحليلية وعقود CTA بأمان. يبقى optional primitive موثقًا، وتُوحّد البطاقات عبر CSS `card--*` القائم بدل إعادة كتابة مئات العقود.

## خط أساس قبل/بعد

| المقياس | قبل | بعد المستهدف |
| --- | ---: | ---: |
| أنظمة padding متوازية | 2 | 1 contract + aliases توافقية |
| sections بـpadding Tailwind يدوي | 2 | 0 |
| سطح التباين على media | حارس موجود | حارس موسع لعنوان/وصف القسم |
| تباين النص على أسوأ طرف فيديو | primary 13.45:1، secondary/muted 5.75:1، links 4.84:1 | لا تراجع؛ يُفحص آليًا |
| SectionHeading في صفحات الإنتاج | 0 | يستخدم في القوالب التي تقبل props النصية بلا تغيير دلالي؛ بقية الـheadings تتبع نفس CSS contract لحين ترحيل آمن تدريجي |

## التحقق المنفذ

- `pnpm build` نجح بعد التوحيد؛ ظلّت تحذيرات تصادم مسارات Astro القديمة كما هي ولا تخص هذا التغيير.
- `pnpm typecheck` و`pnpm test` نجحا (38 اختبارًا ناجحًا).
- `pnpm contrast:verify` و`node scripts/calc-contrast.mjs` نجحا؛ حارس عناوين الأقسام الجديد يقيس: العنوان `13.42:1`، eyebrow `8.57:1`، والوصف `5.73:1` على سطح القراءة المحافظ.
- `git diff --check` نظيف.
- فحص Chromium النهائي: `/` و`/solutions/` على `360×800` و`1440×1000` = 4/4 طلبات HTTP سليمة، صفر overflow أو escapees أو big voids أو bare text على الفيديو أو H1 زائد أو CSS مفقود. صفحة الحلول صارت صفر `invisibleContent` في المقاسين بعد إزالة إخفاء بطاقات الميزات من نظام reveal.
- بقيت إشارتا audit في الرئيسية فقط لعناصر مقصودة خارج تدفق القراءة (`split-hero__chip-word` المتحرك و`trust-badge__tooltip` المخفي حتى hover)، مع clip واحد وsticky واحد لها على 360px. لم تُعامل كمحتوى مفقود.
- `pnpm lint` **لا يمر** بسبب خطأين قائمين وغير متعلقين بالمهمة في `apps/dashboard/lib/observability/logger.ts:81` (`@typescript-eslint/no-explicit-any`)؛ لم تُعدّل مهمة الأقسام كود الـdashboard.

## قيود السلامة

- لا تغيير على SiteBackground أو أصول الخلفية.
- لا تغيير `href` أو `data-cta` أو `data-position` أو `data-page-type` أو `data-offer` أو `data-persona`.
- لا تعاد صياغة نصوص تقع تحت تعليقات الكلمات المحمية.
- لا تحويل شامل آلي للـCard لأن ذلك يغيّر DOM وقد يسقط عقود التحليلات أو slots أو روابط مركبة.
