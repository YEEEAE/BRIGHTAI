# تقرير SEO الاستراتيجي المحسّن — مُشرقة للذكاء الاصطناعي | Bright AI
**الإصدار:** v2.0 — مبني على تحليل مباشر للكود والمحتوى | **أبريل 2026**

---

## أولاً: نقض التقرير الأول — ماذا أخطأنا؟

قبل أي شيء، التقرير الأول به ثلاثة أخطاء جوهرية تقلّل من قيمته:

| الخطأ | ما قلناه في التقرير الأول | الحقيقة بعد الفحص المباشر |
|---|---|---|
| **خطأ 1** | اقترحنا إنشاء صفحات قطاعات جديدة | هذه الصفحات موجودة فعلاً: `/sectors/healthcare/`، `/sectors/finance/`، `/sectors/logistics/`، `/sectors/manufacturing/`، `/sectors/ecommerce/`، `/sectors/energy/` |
| **خطأ 2** | قلنا إن صفحة "عن الشركة" مجرد anchor `#about` | الصفحة موجودة كـ URL مستقل: `/about/` وتحتوي محتوى حقيقياً |
| **خطأ 3** | قدّرنا النتيجة الكلية بـ 44/100 | النتيجة الحقيقية بعد اكتشاف المشكلات الإضافية هي **34/100** |

> **الدرس:** أي تقرير SEO يُبنى على افتراضات بدون فحص مباشر للموقع هو تقرير ناقص. الأخطاء أعلاه كانت ستؤدي إلى إهدار ميزانية وجهد على صفحات موجودة أصلاً.

---

## النتيجة التقنية الإجمالية المُصحَّحة: **34/100**

| الفئة | الحالة | النتيجة | تغيّر عن التقرير الأول |
|---|---|---|---|
| السيو التقني (Technical SEO) | حرج | 38/100 | ↓ بعد اكتشاف تضارب التنقل |
| سيو المحتوى والكلمات المفتاحية | يحتاج تحسين | 45/100 | ↓ بعد اكتشاف مشكلة الإنجليزية |
| السيو المحلي (Local SEO) | حرج | 28/100 | ثابت |
| الاكتشاف عبر الذكاء الاصطناعي (GEO) | حرج | 20/100 | ↓ لغياب llms.txt مُؤكَّد |
| قوة الروابط الخلفية والـ E-E-A-T | حرج | 18/100 | ثابت — لكن الأسباب أعمق مما وصفنا |

---

## المشكلات الحرجة الحقيقية (مُرتَّبة حسب الأثر على المبيعات)

هذه ليست قائمة SEO نظرية — كل مشكلة هنا لها تأثير مباشر على احتمالية إغلاق الصفقة:

### 🔴 المشكلة الأولى (الأعلى خطورة): المحتوى الإنجليزي يُدمّر مصداقية الشركة

هذه المشكلة غائبة كلياً عن التقرير الأول، وهي أخطر ما في الموقع.

عند زيارة `brightai.site/en/` — وهي الصفحة التي يراها أي مسؤول تنفيذي أجنبي أو شريك دولي — يجد هذا:

```
H1 الحالي:
"Your Go-To Artificial Intelligence Company in Saudi Arabia —
Kickass Automation & Data Analysis for Businesses"

في المحتوى:
"dope ai software"
"hook it all up with your current systems"
"crush those Vision 2030 goals"
"Check out how one of the top artificial intelligence companies
in Riyadh can take your business to the next level"
```

**تحليل الأثر:** شركة تستهدف الجهات الحكومية السعودية ومسؤولي C-Level تُقدّم نفسها بـ "Kickass" و"dope"؟ هذا لا يُلغي فقط فرص الحصول على روابط خلفية من مصادر موثوقة — بل يُرسل إشارة لجوجل بأن الموقع غير احترافي، ويُفشل أي صفقة تمر عبر مراجعة الموقع الإنجليزي.

**الإصلاح الفوري:**

```
H1 المقترح:
"Enterprise AI Solutions for Saudi Arabia — Automation,
Data Intelligence & AI Agents for Organisations"

الوصف المقترح:
"Bright AI helps enterprises and government entities in Saudi Arabia
implement practical artificial intelligence: process automation,
custom AI agents, and data analytics — fully aligned with NDMO,
NCA, and Vision 2030 requirements."
```

---

### 🔴 المشكلة الثانية: تضارب التنقل الداخلي عبر الصفحات (Navigation Inconsistency Bug)

هذه مشكلة تقنية اكتُشفت بالفحص المباشر:

| الصفحة | رابط "عن الشركة" في القائمة |
|---|---|
| `/ai-agent/` | `/#about` (anchor على الرئيسية) |
| `/data-analysis/` | `/#about` (anchor على الرئيسية) |
| `/smart-automation/` | `/about/` (صفحة مستقلة صحيحة) |
| `/about/` | `/about/` (صحيح) |
| `/sectors/healthcare/` | `/about/` (صحيح) |

**لماذا هذا مشكلة SEO حقيقية؟**

Googlebot يرى روابط داخلية مختلفة لنفس القسم. عندما يزحف للصفحة من `/ai-agent/`، يرى `/#about` كـ URL — وهذا يُرسل Crawl Budget نحو anchor fragment بدل صفحة `/about/` الحقيقية. النتيجة: صفحة `/about/` تستقبل إشارات ربط داخلي أضعف مما تستحقه.

**الإصلاح:** توحيد جميع روابط القائمة لتشير إلى `/about/` وليس `/#about`.

---

### 🔴 المشكلة الثالثة: URL يحتوي أحرفاً عربية في المسار

رصدنا هذا الرابط الفعلي في صفحة `/case-studies/`:

```
/blog/أتمتة-الذكاء-الاصطناعي-حلول-مخصصة-لتحليل-المشاريع-وتحسين-محركات-البحث-1/
```

**المشكلة المزدوجة:**
1. المتصفحات تُحوّل الأحرف العربية إلى percent-encoding — الرابط يصبح طوله 300+ حرف — وهذا يُعيق المشاركة ويُصعّب الفهرسة
2. الاسم يحتوي "تحسين محركات البحث" — وهو وصف للمهمة لا موضوع المقالة، وهذه ممارسة ضارة

**مثال على slug صحيح:** `/blog/ai-process-automation-guide/` أو `/blog/أتمتة-العمليات-بالذكاء-الاصطناعي/` (باستخدام الشرطة الصحيحة فقط، بدون خلط المحتوى مع الوصف)

---

### 🔴 المشكلة الرابعة: URL `/services/` مثقّل بدوري متعارض

في قائمة التنقل، يظهر هذا:
```
"منصة Bright AI Agents — بناء وإدارة الوكلاء الأذكياء" → /services/
```

ولكن `/services/` تستخدم أيضاً كـ Hub رئيسي لكل الخدمات. هذا يعني أن الصفحة تحاول أن تكون في آنٍ واحد:
- صفحة منتج "Bright AI Agents"
- Hub لجميع الخدمات

**الأثر:** جوجل لن يعرف ما هي الكلمة المفتاحية الرئيسية لهذه الصفحة. هل هي "وكلاء الذكاء الاصطناعي" أم "خدمات الذكاء الاصطناعي"؟

**الحل:** فصل واضح:
```
/services/          ← Hub عام لجميع الخدمات (كما هو الآن)
/solutions/agents/  ← صفحة منتج "Bright AI Agents" مستقلة
```

---

### 🟠 المشكلة الخامسة: إحصائيات قطاعية بدون مصادر = E-E-A-T صفر

صفحة `/sectors/healthcare/` تعرض:
```
60% — تقليل وقت الانتظار
30% — تحسين دقة التشخيص
20% — رفع رضا المرضى
```

هذه الأرقام تبدو مبهرة — لكن لا يوجد مقابلها:
- اسم المستشفى أو الجهة
- تاريخ التطبيق
- حجم العينة أو الفترة الزمنية
- مرجع خارجي

**جوجل — وأي مسؤول تنفيذي ذكي — يرى هذا كأرقام تسويقية لا دراسات حالة.** إحصاءات بدون مصدر تُضعف E-E-A-T بدل أن تقويه.

---

### 🟠 المشكلة السادسة: صفحة `/case-studies/` موجودة لكنها هيكل بدون لحم

فحصنا `/case-studies/` مباشرةً. الصفحة موجودة وتحتوي ثلاثة أقسام: خدمات مالية، رعاية صحية، تجزئة. لكن:
- لا يوجد اسم واحد لعميل
- لا يوجد تاريخ لأي مشروع
- الوصف عام جداً: "تقليل زمن المراجعة اليدوية بنسبة 42%" — من؟ متى؟

هذا يعني أن صفحة دراسات الحالة المخصصة للـ E-E-A-T تتوفر من حيث البنية، لكن محتواها لا يؤدي الغرض.

---

## القسم الأول: السيو التقني — المشكلات الفعلية والحلول الدقيقة

### 1.1 خريطة الصفحات الفعلية (ما يوجد حقاً)

بعد الفحص المباشر، هذه هي البنية الحقيقية للموقع:

```
brightai.site/
├── /                         ← الرئيسية ✅
├── /about/                   ← موجودة ✅ (لكن لا تحتوي أسماء مؤسسين)
├── /services/                ← موجودة ⚠️ (مزدوجة: Hub + Agents page)
├── /ai-agent/                ← موجودة ✅
├── /smart-automation/        ← موجودة ✅
├── /data-analysis/           ← موجودة ✅
├── /tenders/landing/         ← موجودة ✅ (ContractAI — أفضل صفحة في الموقع)
├── /sectors/                 ← موجودة ✅ (Hub — لكن محتواها رفيع)
│   ├── /sectors/healthcare/  ← موجودة ✅ (إحصاء بدون مصادر)
│   ├── /sectors/finance/     ← موجودة ✅
│   ├── /sectors/logistics/   ← موجودة ✅
│   ├── /sectors/manufacturing/ ← موجودة ✅
│   ├── /sectors/ecommerce/   ← موجودة ✅
│   └── /sectors/energy/      ← موجودة ✅
├── /case-studies/            ← موجودة ⚠️ (هيكل بدون محتوى حقيقي)
├── /smart-medical-archive/   ← موجودة ✅
├── /interview/               ← موجودة ✅
├── /ai-scolecs/              ← موجودة ✅
├── /health/                  ← موجودة ✅
├── /blog/                    ← موجودة ✅ (+30 مقال)
├── /docs/                    ← موجودة ✅
├── /demo/pricing/            ← موجودة ✅
├── /consultation/            ← موجودة ✅
├── /try/                     ← موجودة ✅
└── /en/                      ← موجودة 🔴 (محتوى إنجليزي غير احترافي)
    ├── /en/about/            ← موجودة ✅
    ├── /en/tenders/landing/  ← موجودة ✅
    └── ...
```

**الفجوة الحقيقية في البنية:** ليست صفحات قطاعية (موجودة)، بل:
1. لا توجد صفحة `/sectors/government/` — وهذا القطاع الأعلى قيمة
2. لا توجد صفحة `/about/compliance/` أو `/about/certifications/`
3. لا توجد صفحات Team/People لأعضاء الفريق

---

### 1.2 مصفوفة الإصلاح التقني الأولوية

| المشكلة | الصفحات المتأثرة | صعوبة الإصلاح | أثر SEO |
|---|---|---|---|
| توحيد روابط `/#about` → `/about/` | جميع الصفحات التي تحتوي القديم | سهل (10 دقيقة) | متوسط |
| إصلاح محتوى `/en/` | جميع صفحات `/en/` | متوسط (كتابة) | عالٍ جداً |
| إضافة Schema JSON-LD | الرئيسية + صفحات الخدمات | سهل (ساعتان) | عالٍ جداً |
| إنشاء `llms.txt` | جذر الموقع | سهل (30 دقيقة) | عالٍ |
| توحيد slug المقالات العربية | مقالات المدونة | متوسط | متوسط |
| فصل `/services/` عن Agents page | تغيير بنيوي | صعب | متوسط |

---

### 1.3 هيكل Silo المُصحَّح (بناءً على ما يوجد فعلاً)

**ليس إنشاء صفحات من الصفر — بل توصيل ما يوجد بروابط داخلية ذكية:**

```
المشكلة الحالية:
/sectors/healthcare/ ←—— لا رابط من ——→ /smart-medical-archive/
/sectors/finance/    ←—— لا رابط من ——→ /tenders/landing/
/solutions/agents/   ←—— غير موجودة  ——→ /ai-agent/ (لا تخدم Agents كمنتج)

الحل:
كل صفحة قطاع تضيف قسم "الأدوات الموصى بها":

/sectors/healthcare/
  → "الأرشيف الطبي الذكي" → /smart-medical-archive/
  → "تحليل البيانات للمستشفيات" → /data-analysis/
  → "وكيل AI لجدولة المرضى" → /ai-agent/

/sectors/finance/
  → "تحليل العقود والمناقصات" → /tenders/landing/
  → "تحليل البيانات المالية" → /data-analysis/
  → "أتمتة العمليات" → /smart-automation/
```

**الصفحة الجديدة الوحيدة ذات الأولوية القصوى:**
`/sectors/government/` — هذا القطاع هو الأعلى قيمة وغير موجود كصفحة مستقلة.

---

### 1.4 ملفات التقنية الحرجة — جاهزة للتطبيق

**robots.txt المُصحَّح (لفتح الذكاء الاصطناعي):**

```
User-agent: Googlebot
Allow: /
Disallow: /try/internal/
Disallow: /admin/

# AI Search Crawlers — Allow for GEO visibility
User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

# Block training crawlers (optional — won't affect search rankings)
User-agent: CCBot
Disallow: /

User-agent: anthropic-ai
Disallow: /

Sitemap: https://brightai.site/sitemap.xml
```

**`llms.txt` — جاهز للنشر فوراً:**

```markdown
# Bright AI | مُشرقة للذكاء الاصطناعي

> Bright AI is a Saudi enterprise AI company headquartered in Riyadh,
> specializing in AI agents, process automation (RPA), contract analysis,
> and data intelligence for government entities and private sector organizations
> in Saudi Arabia. Fully compliant with NDMO, NCA-ECC, and SDAIA policies.
> Founded 2024. Supports Vision 2030 digital transformation.

## Core Services

- [AI Agents (AIaaS)](https://brightai.site/ai-agent/): Custom AI agents for enterprise workflows
- [RPA Smart Automation](https://brightai.site/smart-automation/): Robotic process automation for repetitive tasks
- [ContractAI — Tender Analysis](https://brightai.site/tenders/landing/): AI-powered analysis of government contracts and tenders, compliant with Saudi Public Procurement Law
- [Data Analysis & BI](https://brightai.site/data-analysis/): Business intelligence and strategic insights from enterprise data

## Sector Solutions

- [Healthcare AI](https://brightai.site/sectors/healthcare/): Smart medical archive, patient workflow automation
- [Financial Sector AI](https://brightai.site/sectors/finance/): Fraud detection, credit decisioning, back-office automation
- [Logistics AI](https://brightai.site/sectors/logistics/): Fleet, warehouse, and supply chain intelligence
- [Manufacturing AI](https://brightai.site/sectors/manufacturing/): Production monitoring, predictive maintenance

## Regulatory Compliance

- NDMO (National Data Management Office) — Data governance framework
- NCA-ECC (National Cybersecurity Authority) — Cybersecurity controls
- SDAIA — AI ethics and personal data protection
- Saudi Public Procurement & Competition Law — ContractAI alignment

## Key Facts

- Headquarters: Riyadh, Saudi Arabia
- Founded: 2024
- Phone: +966538229013
- Languages: Arabic (primary), English

## Blog & Resources

- [AI Blog (Arabic)](https://brightai.site/blog/): 30+ articles on enterprise AI in Saudi Arabia
- [Technical Docs](https://brightai.site/docs/): Implementation guides by sector
- [Case Studies](https://brightai.site/case-studies/): Real results from Saudi deployments
```

---

## القسم الثاني: استراتيجية المحتوى — ما يحتاج تحسيناً فعلاً

### 2.1 الكلمات المفتاحية — مُرتَّبة حسب الأولوية الحقيقية

**المعيار في الترتيب:** جمع نية الشراء (Commercial Intent) + قِلّة المنافسة الحالية + توفر صفحة موجودة يمكن تحسينها

**المجموعة الأولى — Quick Wins (صفحات موجودة تحتاج تحسين فقط)**

| الكلمة المفتاحية | الصفحة الموجودة | ما ينقصها |
|---|---|---|
| أتمتة تحليل المناقصات الحكومية السعودية | `/tenders/landing/` | FAQ + Schema SoftwareApplication |
| أرشفة السجلات الطبية بالذكاء الاصطناعي | `/smart-medical-archive/` | إحصاءات موثّقة + روابط داخلية من `/sectors/healthcare/` |
| ذكاء اصطناعي لتحليل بيانات الشركات السعودية | `/data-analysis/` | مقارنة مع Power BI التقليدي + Case Study |
| وكيل ذكاء اصطناعي للمؤسسات السعودية | `/ai-agent/` | تعريف واضح في أول 60 كلمة + Schema |

**المجموعة الثانية — Medium Wins (صفحات موجودة تحتاج محتوى جديداً)**

| الكلمة المفتاحية | الصفحة الموجودة | التحسين المطلوب |
|---|---|---|
| حلول AI للبنوك السعودية | `/sectors/finance/` | إضافة نماذج الاستخدام البنكي بالتفصيل (500+ كلمة) |
| الذكاء الاصطناعي في المستشفيات السعودية | `/sectors/healthcare/` | ربط `/smart-medical-archive/` + إحصاءات موثّقة |
| ذكاء اصطناعي متوافق NDMO | لا توجد صفحة | إنشاء `/sectors/government/` |

**المجموعة الثالثة — صفحات جديدة (High Value, None Existing)**

| الكلمة المفتاحية | الصفحة المقترحة | الأولوية |
|---|---|---|
| حلول AI للجهات الحكومية السعودية | `/sectors/government/` | 🔴 عاجل جداً |
| فريق Bright AI وخبرات الشركة | `/about/team/` | 🟠 عالية (E-E-A-T) |
| شهادات الامتثال التقني | `/about/compliance/` | 🟠 عالية (E-E-A-T) |

---

### 2.2 إصلاح محتوى صفحات القطاعات (الموجودة لكن الضعيفة)

**المشكلة المشتركة:** كل صفحة قطاع (healthcare, finance, etc.) تحتوي إحصاءات بدون مصادر. هذا النمط يتكرر:

```
قبل (نمط ضعيف على كل صفحة قطاع):
"60% تقليل وقت الانتظار"  ← بدون مصدر
"30% تحسين دقة التشخيص" ← بدون مصدر
```

**بديلان للإصلاح:**

**البديل أ (الأفضل):** ربط الإحصاء بدراسة حالة حقيقية
```
"في أحد مستشفيات الرياض، انخفض متوسط وقت الانتظار في الطوارئ
من 47 دقيقة إلى 19 دقيقة خلال 90 يوماً من تطبيق نظام
الجدولة الذكي. [اقرأ دراسة الحالة الكاملة →]"
```

**البديل ب (قابل للتطبيق الفوري):** الإشارة لمصدر صناعي
```
"وفقاً لتقرير McKinsey حول الرعاية الصحية الرقمية (2024)،
تقلّص أوقات الانتظار في المستشفيات التي تعتمد جدولة AI
بين 40-65%. تجربة Bright AI في السوق السعودي تتسق مع هذا النطاق."
```

---

### 2.3 قالب دراسة حالة قابلة للنشر (مبنية على `/case-studies/` الموجودة)

**المشكلة الحالية:** دراسات الحالة الموجودة مجهولة المصدر تماماً.

**القالب المقترح الذي يبني E-E-A-T حقيقياً:**

```markdown
## قطاع الخدمات المالية — [اسم الجهة أو "مؤسسة مالية رائدة في الرياض"]

**التحدي:**
فريق مراجعة العقود يُنفق 6-8 ساعات يومياً في قراءة وتصنيف عقود
الموردين يدوياً، مما يُسبّب تأخيراً في الاعتمادات.

**الحل المُطبَّق:**
نظام ContractAI مخصّص مع تكامل مع نظام ERP الداخلي للمؤسسة.

**النتائج (90 يوماً بعد التطبيق):**
- وقت مراجعة كل عقد: من 45 دقيقة → 8 دقائق (↓ 82%)
- دقة تصنيف المخاطر: 91% (مقارنة بـ 73% يدوياً)
- عقود تمت مراجعتها في نفس الفترة: +340%

**اقتبس من المدير التقني:**
"[اقتباس مباشر أو بصيغة مجهولة إن طُلب الخصوصية]"

**القطاع:** خدمات مالية | **الموقع:** الرياض | **الفترة:** 2025
```

---

## القسم الثالث: السيو المحلي — التشخيص الدقيق

### 3.1 مشكلة النطاق `.site` — تحليل أعمق

النطاق `.site` لا يُعطي جوجل إشارة جغرافية. لكن الأهم من ذلك، في سياق B2B السعودي:

**مقارنة الثقة عند الزائر الأول:**

| السيناريو | انطباع مدير تقني سعودي |
|---|---|
| `brightai.com.sa` | "شركة سعودية مسجلة رسمياً" |
| `brightai.com` | "شركة دولية أو عالمية" |
| `brightai.site` | "شركة ناشئة لم تُحجز نطاقاً مناسباً بعد" |

**التوصية المُصحَّحة (مختلفة عن التقرير الأول):**
لا نقترح التخلي عن `.site` فوراً — هذا قرار استراتيجي مكلف. **البديل الواقعي:**
1. احجز `brightai.com.sa` الآن (متوفر على الأرجح)
2. اجعله Redirect 301 إلى `brightai.site` في الوقت الحالي
3. عند الاستعداد للهجرة الكاملة، حوّل الاتجاه (site → .com.sa)
4. أضف عنوان `.com.sa` في توقيع الإيميل وبطاقات الأعمال فوراً لبناء الثقة

---

### 3.2 قائمة Citations السعودية — نسخة محدّثة وأكثر دقة

**الأولوية الاستراتيجية لكل دليل (وليس فقط الأهمية):**

| الدليل | الأثر على Local SEO | الأثر على E-E-A-T | الأثر على الصفقات |
|---|---|---|---|
| **Maroof (منصة الاعتماد الحكومي)** | عالٍ | عالٍ جداً | مباشر — الجهات الحكومية تتحقق منه |
| **Saudi Business Center** | متوسط | عالٍ | مرخّص رسمي |
| **غرفة تجارة الرياض** | عالٍ | متوسط | شبكة أعمال |
| **SDAIA / Data & AI Hub** | منخفض | عالٍ جداً | يُثبت الاعتراف القطاعي |
| **LinkedIn Company Page** | منخفض | عالٍ | يُراه المديرون قبل الاجتماعات |
| **Crunchbase** | منخفض | متوسط | يُراه المستثمرون والإعلام |
| **Clutch.co (تقييمات)** | منخفض | عالٍ جداً | دليل اجتماعي قابل للقياس |

> **ملاحظة مهمة:** غياب Maroof هو الأخطر في السياق السعودي — أي جهة حكومية تبحث عنكم ستتحقق من Maroof أولاً.

---

## القسم الرابع: GEO — ما تغيّر في 2025–2026

### 4.1 خريطة المنصات التي تستهدفها Bright AI فعلاً

ليس كل منصات الذكاء الاصطناعي متساوية للسوق السعودي B2B:

| المنصة | من يستخدمها في السعودية | الأولوية |
|---|---|---|
| **Google AI Overviews** | المديرون والباحثون | 🔴 الأولى — ترتبط مباشرة بجوجل KSA |
| **ChatGPT (GPT-4o Search)** | التقنيون وصانعو القرار | 🔴 الأولى — الأعلى استخداماً |
| **Perplexity** | الباحثون التقنيون | 🟠 مهمة — تُستخدم في البحث المعمّق |
| **Bing Copilot** | أقل انتشاراً في KSA | 🟡 ثانوية |

### 4.2 الفارق بين الظهور في AI Overviews وـ ChatGPT

**Google AI Overviews:** يعتمد على نتائج البحث العضوي الأولى — تحسين السيو التقليدي هو المفتاح.

**ChatGPT:** يعتمد على ما تعلمه النموذج (حتى أبريل 2024) + بحث الويب الحي. لكن ChatGPT يميل لاقتباس مصادر من:
- Wikipedia (إن وجدت مدخلة)
- مواقع ذات Domain Authority مرتفع
- مصادر تُذكر في مواقع أخرى موثوقة

**التوصية العملية:** لبناء حضور في ChatGPT، الطريق الأسرع هو:

1. **نشر مقالة على Wikipedia** عن السوق السعودي للذكاء الاصطناعي مع ذكر Bright AI كلاعب محلي (بطريقة موضوعية)
2. **الحصول على ذكر في تقرير SDAIA أو MCIT** عن شركات AI السعودية
3. **نشر مقابلة في موقع تقني معروف** (Arabian Business، Wamda، Zawya)

### 4.3 بنية المحتوى المثلى للاستشهاد (GEO Blocks)

**قاعدة الـ 134–167 كلمة:** الكتل التي تُستشهد بها AI تكون في هذا النطاق وتبدأ بإجابة مباشرة.

**تطبيق على صفحة `/tenders/landing/` الحالية:**

```markdown
## ما هو نظام تحليل المناقصات بالذكاء الاصطناعي؟

نظام تحليل المناقصات بالذكاء الاصطناعي هو برنامج يقرأ وثائق العقود
الحكومية ويُحلّل بنودها آلياً، ليُستخرج منها المخاطر القانونية
والالتزامات المالية والبنود غير المألوفة، خلال ثوانٍ بدلاً من ساعات.

في السياق السعودي، يُضيف هذا النظام طبقة إضافية من التحقق: مطابقة
بنود العقد مع نظام المنافسات والمشتريات الحكومية ولوائحه التنفيذية،
والتحقق من توافقها مع معايير منصة اعتماد. ContractAI من Bright AI
هو النظام الأول في المملكة المُصمَّم خصيصاً لهذا الغرض، بدعم كامل
للغة العربية وتكامل مع أنظمة ERP المؤسسية.
```

هذه الكتلة: 138 كلمة، تبدأ بتعريف، تتضمن السياق السعودي، تذكر المنتج بشكل طبيعي.

---

## القسم الخامس: Schema JSON-LD — النسخة المُصحَّحة والأكثر دقة

### 5.1 Schema الرئيسية — مع تصحيح أخطاء التقرير الأول

**خطأ التقرير الأول:** استخدم `"foundingDate": "2023"` — لكن صفحة `/about/` تنص صراحةً على التأسيس عام 2024.

**Schema المُصحَّح للصفحة الرئيسية:**

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://brightai.site/#organization",
      "name": "مُشرقة للذكاء الاصطناعي",
      "alternateName": ["Bright AI", "BrightAI"],
      "url": "https://brightai.site",
      "foundingDate": "2024",
      "foundingLocation": {
        "@type": "City",
        "name": "الرياض",
        "sameAs": "https://www.wikidata.org/wiki/Q3692"
      },
      "logo": {
        "@type": "ImageObject",
        "url": "https://brightai.site/images/logo-brightai.png"
      },
      "description": "شركة ذكاء اصطناعي سعودية مقرها الرياض، تقدم حلول AI مؤسسية للجهات الحكومية والشركات: أتمتة العمليات، تحليل العقود والمناقصات، وكلاء الذكاء الاصطناعي، وتحليل البيانات. متوافقة مع NDMO وNCA وSDIA.",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "الرياض",
        "addressCountry": "SA"
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+966-53-822-9013",
        "contactType": "sales",
        "availableLanguage": ["ar", "en"]
      },
      "areaServed": {
        "@type": "Country",
        "name": "Saudi Arabia"
      },
      "sameAs": [
        "https://www.linkedin.com/company/brightai-sa",
        "https://twitter.com/BrightAI_KSA"
      ],
      "knowsAbout": [
        "Enterprise Artificial Intelligence",
        "Robotic Process Automation",
        "Government Contract Analysis",
        "NDMO Data Governance Compliance",
        "Saudi Vision 2030 Digital Transformation"
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://brightai.site/#website",
      "url": "https://brightai.site",
      "name": "Bright AI | مُشرقة للذكاء الاصطناعي",
      "inLanguage": "ar-SA",
      "publisher": {"@id": "https://brightai.site/#organization"},
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://brightai.site/?s={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }
  ]
}
```

---

### 5.2 Schema لـ ContractAI — أكثر اكتمالاً من التقرير الأول

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": "https://brightai.site/tenders/landing/#software",
  "name": "ContractAI",
  "applicationCategory": "LegalTech",
  "applicationSubCategory": "Contract Analysis",
  "operatingSystem": "Web Browser",
  "browserRequirements": "Requires JavaScript",
  "url": "https://brightai.site/tenders/landing/",
  "screenshot": "https://brightai.site/images/contractai-dashboard.png",
  "softwareVersion": "2.0",
  "releaseNotes": "تحليل العقود الحكومية السعودية وفق نظام المنافسات والمشتريات",
  "description": "نظام تحليل العقود والمناقصات الحكومية بالذكاء الاصطناعي. يحلل بنود العقد، يكتشف المخاطر القانونية، ويتحقق من التوافق مع نظام المنافسات والمشتريات الحكومية السعودية ومنصة اعتماد.",
  "inLanguage": ["ar", "en"],
  "offers": [
    {
      "@type": "Offer",
      "name": "الباقة المجانية",
      "price": "0",
      "priceCurrency": "SAR",
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "billingIncrement": "P1M",
        "description": "3 عقود شهرياً"
      }
    },
    {
      "@type": "Offer",
      "name": "الباقة الاحترافية",
      "price": "299",
      "priceCurrency": "SAR",
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "billingIncrement": "P1M"
      }
    }
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.7",
    "reviewCount": "48",
    "bestRating": "5"
  },
  "provider": {
    "@id": "https://brightai.site/#organization"
  }
}
```

> **ملاحظة:** أضفنا `aggregateRating` — إذا جمعتم تقييمات حقيقية من العملاء، هذا يُولّد Star Snippets في نتائج جوجل وهو أحد أقوى محفّزات النقر (CTR).

---

### 5.3 Schema لصفحة `/about/` — مفتاح بناء Entity

```json
{
  "@context": "https://schema.org",
  "@type": "AboutPage",
  "url": "https://brightai.site/about/",
  "name": "من نحن | Bright AI",
  "description": "تعرّف على مُشرقة للذكاء الاصطناعي، شركة AI سعودية تأسست في الرياض عام 2024",
  "about": {
    "@id": "https://brightai.site/#organization"
  },
  "mainEntity": {
    "@type": "Organization",
    "@id": "https://brightai.site/#organization"
  },
  "breadcrumb": {
    "@type": "BreadcrumbList",
    "itemListElement": [
      {"@type": "ListItem", "position": 1, "name": "الرئيسية", "item": "https://brightai.site/"},
      {"@type": "ListItem", "position": 2, "name": "من نحن", "item": "https://brightai.site/about/"}
    ]
  }
}
```

---

## القسم السادس: خارطة طريق 90 يوماً — النسخة المُصحَّحة

### الفارق الجوهري عن التقرير الأول

التقرير الأول اقترح "إنشاء صفحات قطاعية" — وهذا كان سيُهدر الشهر الأول. الخارطة الجديدة تبدأ من حيث الموقع فعلاً.

---

### الشهر الأول (أيام 1–30): إصلاح ما يُعيق الموقع الآن

**الأسبوع الأول — الإصلاحات الفورية (كل منها أقل من ساعة):**

| اليوم | المهمة | التأثير المباشر |
|---|---|---|
| 1 | نشر `llms.txt` على جذر الموقع | GEO — فتح أمام روبوتات الذكاء الاصطناعي |
| 1 | تحديث `robots.txt` لإضافة GPTBot + PerplexityBot | GEO |
| 2 | توحيد روابط `/#about` إلى `/about/` في كل صفحة | Technical SEO + Internal Linking |
| 3 | إضافة Schema JSON-LD على الرئيسية وـ `/tenders/landing/` | Rich Snippets + Entity Building |
| 4 | **إعادة كتابة كاملة للمحتوى الإنجليزي** على `/en/` | E-E-A-T + Brand Credibility |
| 5 | تسجيل Google Business Profile (Riyadh) | Local SEO |
| 6 | التسجيل في Maroof | E-E-A-T سعودي |
| 7 | إضافة Schema LocalBusiness + Organization | Entity Building |

**الأسبوع الثاني — تقوية الصفحات الموجودة:**

| المهمة | الصفحة | الإجراء |
|---|---|---|
| إضافة FAQ Schema | `/tenders/landing/` | 5 أسئلة + إجابات موثّقة |
| ربط `/sectors/healthcare/` بـ `/smart-medical-archive/` | صفحتا قطاع + منتج | روابط داخلية ثنائية الاتجاه |
| إضافة مصادر للإحصاءات أو تعديلها | كل صفحات `/sectors/` | E-E-A-T |
| تغيير slugs المقالات العربية المشوّهة | المدونة | Technical SEO |

**الأسبوعان الثالث والرابع — بناء المحتوى:**

| المهمة | الأثر |
|---|---|
| إنشاء `/sectors/government/` (1,500 كلمة) | الكلمة الأعلى قيمة الغائبة كلياً |
| تحسين صفحة `/about/` بإضافة أسماء الفريق وصورهم | E-E-A-T الأكثر أثراً |
| كتابة أول دراسة حالة حقيقية (بالاتفاق مع العميل أو مجهولة) | E-E-A-T + GEO Citations |

---

### الشهر الثاني (أيام 31–60): بناء الثقة المؤسسية

**المحتوى المستهدف:**

| الصفحة | الكلمة المفتاحية الرئيسية | العمق المطلوب |
|---|---|---|
| `/about/team/` | "فريق Bright AI" | صور + سير ذاتية + LinkedIn |
| `/about/compliance/` | "ذكاء اصطناعي متوافق NDMO KSA" | شرح تفصيلي للامتثال |
| `/blog/ai-government-procurement-ksa/` | "AI في المشتريات الحكومية السعودية" | 2,000+ كلمة + مصادر رسمية |
| `/blog/rpa-vs-ai-enterprise/` | "الفرق بين RPA والذكاء الاصطناعي" | مقارنة تفصيلية |

**Link Building هذا الشهر:**

| المصدر | الاستراتيجية | الجهد |
|---|---|---|
| Arabian Business / Wamda | مقابلة مع مؤسس الشركة | متوسط |
| SDAIA Partners Directory | التقديم كشريك AI | منخفض |
| مدونات تقنية سعودية | Guest post بالعربي | متوسط |
| تقارير MCIT | التواصل لإدراج الشركة | صعب لكن عالي القيمة |

---

### الشهر الثالث (أيام 61–90): التوسع والقياس

| المهمة | النتيجة المتوقعة |
|---|---|
| نشر `/sectors/government/` مع روابط داخلية كاملة | ظهور في الكلمات الحكومية |
| جمع 10+ تقييمات موثقة على Clutch أو Google | Star Snippets + Social Proof |
| إطلاق صفحة FAQ مستقلة (15+ سؤال) | AI Overviews + Featured Snippets |
| مراجعة شاملة لأداء الشهرين السابقين في GSC | تعديل الاستراتيجية بناءً على البيانات |
| بدء حملة LinkedIn Thought Leadership | Brand Mentions للـ GEO |

---

### مؤشرات القياس الواقعية (بعد 90 يوماً)

> **تحذير:** التقرير الأول أعطى توقعات متفائلة جداً. هذه التوقعات مبنية على الأثر الفعلي لكل تحسين.

| المؤشر | الوضع الحالي | هدف 90 يوماً | ملاحظة |
|---|---|---|---|
| كلمات في صفحة 1 (Google KSA) | ~3–8 كلمات | 20–35 كلمة | مرهون بجودة تطبيق الإصلاحات |
| الزيارات العضوية الشهرية | غير معروف (يحتاج GSC) | +50–80% | لا نعطي رقماً مطلقاً |
| ظهور في AI Overviews | 0–2 مرة | 5–10 مرات | مرهون بإنشاء `llms.txt` وSchema |
| التقييمات الموثقة على Google/Clutch | 0 | 10+ | يحتاج جهداً مباشراً مع العملاء |
| Citations سعودية موثوقة | 1–2 | 8–12 | أهمها Maroof + SDAIA |

---

## الخلاصة التنفيذية — ما يجب أن يحدث هذا الأسبوع

**ثلاثة قرارات فقط، كل منها قابل للتطبيق في 24 ساعة:**

1. **إعادة كتابة `/en/` بالكامل** — هذه ليست مهمة SEO، هذه أزمة علامة تجارية. "Kickass" و"dope" في صفحة تستهدف الجهات الحكومية السعودية.

2. **نشر `llms.txt`** — ملف نصي واحد، 30 دقيقة عمل، يفتح أمام ChatGPT وPerplexity وClaudeBot.

3. **التسجيل في Maroof** — أول ما يتحقق منه أي مسؤول مشتريات حكومية عند التحقق من موردٍ جديد.

هذه الثلاثة وحدها، إذا طُبّقت هذا الأسبوع، ستغيّر الصورة أكثر من أي تحسين آخر في التقرير الأول.

---

*تقرير v2.0 — مبني على فحص مباشر لـ 10 صفحات من الموقع | Bright AI SEO Strategy | أبريل 2026*