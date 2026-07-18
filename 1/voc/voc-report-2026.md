# تقرير صوت العميل السعودي وAEO — BrightAI 2026

> تاريخ البحث: 2026-07-18. النطاق: `ar-SA` أساسي و`en-SA` ثانوي. هذا التقرير يعيد صياغة الأنماط العامة ولا ينقل منشورات أو نصوصاً محمية.

## 0. المنهجية والقيود

- فُحصت ملفات المشروع الفعلية تحت `src/pages/**` و`src/data/solutions.ts` و`schema-saudi-seo.json`.
- القياس الفعلي: `keyword.txt` = **سطر واحد** (مدخل صالح واحد: «حوكمة الذكاء الاصطناعي»)، و`sitemap.xml` = **166** عنصر `<loc>`، وGit يتتبع **65** ملف صفحة Astro تحت `src/pages/**/*.astro`.
- `node scripts/extract-solutions-content.mjs` فشل بسبب مسارات macOS مطلقة تبدأ بـ `/Users/yzydalshmry/Desktop/BRIGHTAI/`، لذلك لم تُختلق مخرجاته.
- `node scripts/extract-blog-articles.mjs` أعاد `Extracted: 0/22; Skipped: 22` لأن مجلدات HTML القديمة تحت `blog/*/index.html` غير موجودة.
- `node scripts/check-speakable-schema.mjs` فشل: **Expected at least 30 Speakable pages, found 0**.
- عبارات المجتمع أدناه «أنماط VOC معاد صياغتها»؛ الكثافة تقدير نوعي (عالية/متوسطة/منخفضة)، وليست حجم بحث مدفوعاً.

## 1. جرد الكلمات الواقعي وتصنيفها

| الفئة | الكلمات والموضوعات الموجودة فعلياً في المشروع |
|---|---|
| Regulatory | حوكمة الذكاء الاصطناعي، PDPL، NCA ECC، SDAIA، SAMA، SFDA، ISO/IEC 42001، ISO 13485، CBAHI، FATF |
| Technical | AI Firewall، PII Redaction، Immutable Audit Trail، Human Approval Layer، Evidence File، Shadow AI، Risk Score، On-Premise، Air-Gapped، ERP/CRM/HIS connectors |
| Risk | تسريب البيانات، غياب سجل التدقيق، هلوسة النموذج، القرارات عالية المخاطر، الموردون الخارجيون، prompt injection، model drift، فقدان الملكية الفكرية |
| Financial | نماذج الائتمان، AML/KYC، الاحتيال، SAMA، عائد الاستثمار، تكلفة التدقيق اليدوي، فترة الاسترداد |
| Healthcare | بيانات المرضى PHI، SFDA، ISO 13485، CBAHI، الأجهزة الطبية الذكية، الموافقة البشرية، التحقق السريري |
| Procurement | تحليل المناقصات، شروط المنافسة، اعتماد، سجل الموافقات، فصل الصلاحيات، ملف الأدلة، الموردون والعقود |

**الفجوة الأساسية:** `keyword.txt` لا يصلح حالياً كمصدر بحث كلمات؛ المحتوى الفعلي أغنى بكثير لكنه موزّع داخل `src/data/solutions.ts` والصفحات.

## 2. قاموس VOC موثّق (30 عبارة)

| # | Term | AR | EN | Locale | Source-URL | الدلالة / الكثافة | Page-set-that-cites-it | AEO-surface-fit |
|---:|---|---|---|---|---|---|---|---|
| 1 | AI governance | حوكمة الذكاء الاصطناعي المؤسسية | Enterprise AI governance | ar-SA/en-SA | https://sdaia.gov.sa/ | regulatory / عالية | `/`, `/solutions/ai-governance-platform/` | جميع الأسطح |
| 2 | AI ethics | مبادئ أخلاقيات الذكاء الاصطناعي | AI Ethics Principles | ar-SA/en-SA | https://sdaia.gov.sa/ | regulatory / عالية | blog + solutions | Google AIO, Gemini |
| 3 | PDPL lawful basis | الأساس النظامي لمعالجة البيانات | Lawful basis for personal-data processing | ar-SA/en-SA | https://dgp.sdaia.gov.sa/ | regulatory / عالية | `/trust/`, PDPL blog | ChatGPT, Google AIO |
| 4 | Data minimization | الحد الأدنى اللازم من البيانات | Data minimization | ar-SA/en-SA | https://dgp.sdaia.gov.sa/ | regulatory / عالية | AI Firewall | Gemini, Copilot |
| 5 | PIA/DPIA | تقييم أثر معالجة البيانات الشخصية | Privacy impact assessment | ar-SA/en-SA | https://dgp.sdaia.gov.sa/ | risk / عالية | assessment | Google AIO |
| 6 | ECC-2:2024 | الضوابط الأساسية للأمن السيبراني | Essential Cybersecurity Controls | ar-SA/en-SA | https://nca.gov.sa/ | regulatory / عالية | services + sectors | جميع الأسطح |
| 7 | CCC-2:2024 | ضوابط الأمن السيبراني للحوسبة السحابية | Cloud Cybersecurity Controls | ar-SA/en-SA | https://nca.gov.sa/ | technical / متوسطة | trust + deployment | Copilot, Gemini |
| 8 | AI lifecycle security | أمن دورة حياة نظام AI | AI lifecycle security | ar-SA/en-SA | https://nca.gov.sa/ | technical / متوسطة | platform + docs | ChatGPT |
| 9 | SAMA cyber resilience | المرونة السيبرانية للقطاع المالي | Cyber resilience for financial entities | ar-SA/en-SA | https://www.sama.gov.sa/ | financial / عالية | banking sector | Google AIO |
| 10 | Third-party risk | مخاطر مزودي النماذج والأطراف الثالثة | Third-party AI/vendor risk | ar-SA/en-SA | https://www.sama.gov.sa/ | risk / عالية | banking + trust | Copilot |
| 11 | Model risk | مخاطر النموذج والتحقق المستقل | Model risk and independent validation | en-SA | https://www.sama.gov.sa/ | financial / عالية | banking | ChatGPT, Perplexity |
| 12 | Medical AI authorization | ترخيص برمجيات AI كجهاز طبي | AI/ML medical-device authorization | ar-SA/en-SA | https://www.sfda.gov.sa/ | healthcare / عالية | healthcare sector | Google AIO, Gemini |
| 13 | Clinical evidence | أدلة السلامة والأداء والفعالية | Clinical evidence of safety and performance | ar-SA/en-SA | https://www.sfda.gov.sa/ | healthcare / عالية | pharma/hospital | Gemini |
| 14 | Quality management | إدارة جودة الأجهزة الطبية | ISO 13485 quality management | ar-SA/en-SA | https://www.sfda.gov.sa/ | healthcare / متوسطة | customers/pharma | Google AIO |
| 15 | Cloud localization | موقع الاستضافة وسيادة البيانات | Data residency and cloud localization | ar-SA/en-SA | https://www.cst.gov.sa/ | regulatory / عالية | trust + FAQ | Copilot |
| 16 | AI inventory | نحتاج جرداً واحداً لكل استخدامات AI | A single inventory of every AI use case | ar-SA/en-SA | https://www.linkedin.com/ | business / عالية | platform + assessment | ChatGPT |
| 17 | Named owner | من المسؤول عن كل نظام AI؟ | Who is the accountable owner for each AI system? | ar-SA/en-SA | https://www.linkedin.com/ | business / عالية | governance platform | Perplexity |
| 18 | Audit evidence | نحتاج دليلاً، وليس سياسة PDF | We need evidence, not another policy PDF | ar-SA/en-SA | https://www.linkedin.com/ | business / عالية | evidence file | جميع الأسطح |
| 19 | Board visibility | الإدارة تريد لوحة مخاطر مفهومة | The board needs a defensible AI-risk view | ar-SA/en-SA | https://www.linkedin.com/ | business / متوسطة | platform + reports | ChatGPT |
| 20 | Shadow AI | الموظفون يستخدمون أدوات لم نعتمدها | Employees are using AI tools we never approved | ar-SA/en-SA | https://www.reddit.com/r/sysadmin/ | technical / عالية | use-case discovery | Perplexity |
| 21 | Sensitive prompts | كيف نمنع لصق أسرار الشركة في ChatGPT؟ | How do we stop sensitive data entering public LLMs? | ar-SA/en-SA | https://www.reddit.com/r/sysadmin/ | risk / عالية | AI Firewall | جميع الأسطح |
| 22 | Agent permissions | الوكيل لا يجب أن ينفذ دون حدود واضحة | Agents need least-privilege permissions | en-SA | https://www.reddit.com/r/AI_Agents/ | technical / عالية | approvals + policies | ChatGPT |
| 23 | Prompt injection | RAG لا يلغي مخاطر حقن الأوامر | RAG does not remove prompt-injection risk | en-SA | https://www.reddit.com/r/LLMDevs/ | technical / عالية | firewall + docs | Perplexity |
| 24 | Reproducibility | هل نستطيع إعادة بناء القرار بعد ستة أشهر؟ | Can we reconstruct the decision six months later? | ar-SA/en-SA | https://news.ycombinator.com/ | technical / متوسطة | audit trail | ChatGPT |
| 25 | Governance latency | لا تجعل الموافقات توقف العمل | Governance must not become operational latency | ar-SA/en-SA | https://news.ycombinator.com/ | business / متوسطة | approvals | Perplexity |
| 26 | Vendor lock-in | كيف نغيّر النموذج دون إعادة بناء الضوابط؟ | Can we switch models without rebuilding controls? | ar-SA/en-SA | https://news.ycombinator.com/ | business / عالية | connectors + pricing | ChatGPT |
| 27 | AI risk register | سجل مخاطر AI موحّد ومحدث | A living AI risk register | ar-SA/en-SA | https://www.iso.org/standard/81230.html | risk / عالية | risk classification | Google AIO |
| 28 | ISO 42001 gap | تحليل فجوات ISO 42001 في السعودية | ISO 42001 gap analysis in Saudi Arabia | ar-SA/en-SA | https://www.iso.org/standard/81230.html | regulatory / عالية | assessment + services | جميع الأسطح |
| 29 | Human oversight | موافقة بشرية للقرار عالي الأثر | Human oversight for high-impact decisions | ar-SA/en-SA | https://sdaia.gov.sa/ | regulatory / عالية | approvals | Gemini |
| 30 | Procurement proof | ملف أدلة جاهز للجنة والمراجع | Audit-ready evidence for procurement and assurance | ar-SA/en-SA | https://etimad.sa/ | procurement / متوسطة | government + evidence | Copilot, ChatGPT |

## 3. قياس الصفحات مقابل لغة VOC

> «الغائب» عدد تقريبي من 12 ركيزة VOC عالية التكرار: inventory، owner، risk register، DPIA، model validation، third-party risk، data residency، evidence pack، incident response، vendor lock-in، time-to-value، measurable outcome.

| الصفحة/القالب | H1 / الوعد الأول | CTA الحالي | الغائب من 12 | FAQ schema | TL;DR ≤60 كلمة | ملاحظة AEO |
|---|---|---|---:|---|---|---|
| `/` | حوكمة AI السعودية؛ تعريف 36 كلمة | استكشف/تحدث | 5 | نعم (مكرر موضوعياً) | نعم | أقوى صفحة اقتباس؛ `Speakable` الفعلي غير مولّد |
| `/about/` | شركة سعودية تبني طبقة أمان AI | ابدأ ديمو | 8 | لا | نعم في فقرة «الزبدة» | ادعاءات credentials تحتاج إثباتاً |
| `/services/` | تنفيذ Saudi AI Safety OS | ابدأ تقييم مجاني | 5 | نعم | قابل جزئياً | ينقص ISO 42001 gap / زمن ومخرجات محددة |
| `/pricing/` | تسعير واضح ومرن | ناقش التسعير | 8 | نعم | لا | تموضع مشتت بين governance/chatbot/automation |
| `/customers/bank/` | قيمة قطاعية للبنوك | عرض/تواصل | 5 | حسب القالب | جزئي | أضف model validation وthird-party risk |
| `/customers/hospital/` | قيمة للمستشفى | عرض/تواصل | 6 | حسب القالب | جزئي | أضف clinical safety وPHI incident evidence |
| `/customers/pharma/` | جودة وامتثال | عرض/تواصل | 6 | حسب القالب | جزئي | أضف GxP/change control وSFDA evidence |
| `/solutions/[sector]` | H1 وdescription من `solutions.ts` | اطلب عرضاً | 4-6 | غير مضاف في القالب رغم وجود بيانات FAQ | جزئي | فرصة كبيرة: FAQ data موجودة لكن schema graph لا يستخدمها |
| `/solutions/[sector]/[city]` | قطاع + مدينة | عرض/واتساب | 9 | لا | لا | النص المحلي عام ومكرر؛ لا توجد نيوم/KAUST في البيانات الحالية |
| `/kernel/` | النواة التشغيلية | ديمو/تواصل | 6 | موجود في بعض صفحات Kernel | جزئي | يحتاج تعريفاً مستقلاً قابلاً للاقتباس |
| `/kernel/chat/` | تشغيل محادثة محكومة | CTA منتج | 7 | متباين | لا | أضف منع PII/prompt injection بإجابة مباشرة |
| `/kernel/approvals/` | موافقات بشرية | CTA منتج | 6 | متباين | جزئي | جيد لـ human oversight؛ ينقص SLA/escalation |
| `/kernel/audit/` | سجل تدقيق | CTA منتج | 5 | متباين | جزئي | أضف retention/reconstruction/chain-of-custody |
| `/kernel/evidence/` | ملف أدلة | CTA منتج | 5 | متباين | جزئي | أفضل BOFU إذا حُدد محتوى الملف ووقت إنتاجه |
| `/kernel/compliance/` | ربط الامتثال | CTA منتج | 6 | متباين | جزئي | لا تدّعِ «امتثالاً كاملاً» دون qualification |
| `/kernel/connectors/` | تكامل الأنظمة | CTA منتج | 7 | متباين | لا | أضف model portability وdata-boundary language |
| `/assessment/ai-governance-readiness/` | تقييم جاهزية AI | ابدأ التقييم | 3 | نعم | نعم | أقوى lead magnet؛ الوعد الزمني غير ثابت |
| `/calculator/roi/` | حاسبة عائد الحوكمة | احسب العائد | 7 | لا | لا | يلزم شرح المنهج والافتراضات ومصدر المخاطر |
| `/demo/` | 30+ ديمو | جرّب/احجز | 9 | FAQ موجود في الصفحة | لا | يخلط use-case demos مع governance intent |
| `/contact/` | تواصل/احجز | إرسال | 10 | لا | لا | أضف outcome ومدة الاستجابة وخصوصية البيانات |
| `/blog/[...slug]` | ديناميكي من content collection | CTA مقالي | متباين | حسب المقال/layout | حسب المقال | extractor القديم لا يقيس المصدر الحالي |

### خلاصة AEO

- **FAQ:** موجود في الصفحة الرئيسية والخدمات والأسعار والتقييم، لكن غير متسق في قوالب القطاع/المدينة والصفحات P0.
- **Speakable:** نتيجة الأداة الفعلية **0 صفحة**؛ وجود `data-speakable` في الصفحة الرئيسية لا يكفي ما لم يخرج `SpeakableSpecification` في JSON-LD.
- **الاقتباس:** الصفحة الرئيسية والتقييم وبعض solution leads قادرة على إجابة intent خلال 60 كلمة. صفحات المدن وROI وcontact وdemo ليست كذلك.
- **تنبيه:** Google لا يعرض FAQ rich results لمعظم المواقع التجارية؛ استخدم FAQ للمستخدم وقابلية الفهم عبر محركات الإجابة، لا كوعد rich result.

## 4. Pain Patterns (10)

1. **مدير الحوكمة بالبنك:** يشعر أنه لا يستطيع الدفاع عن قرار AI أمام SAMA لأن الاستخدام موزع ولا يوجد owner أو سجل موحد. **EN:** The governance lead cannot defend an AI decision because ownership and evidence are fragmented.
2. **CISO حكومي:** يخشى تسرب مستند مصنف إلى نموذج عام لأن الموظفين ينسخون البيانات خارج القنوات المعتمدة. **EN:** The CISO fears classified data leakage through unsanctioned public LLM use.
3. **CDO مستشفى:** لا يرى أين تنتقل بيانات المرضى بين HIS والنموذج والمورد. **EN:** The CDO lacks end-to-end lineage for patient data across HIS, models, and vendors.
4. **مدير أبحاث دوائية:** يخشى أن تغيّر نسخة نموذج جديدة مخرجاً منظماً دون change control. **EN:** The R&D leader fears model updates changing regulated outputs without change control.
5. **مدير مخاطر تأمين:** لا يملك تفسيراً قابلاً للمراجعة لقرار تسعير أو مطالبة مدعوم بـAI. **EN:** The risk leader lacks reviewable rationale for AI-assisted underwriting or claims decisions.
6. **المشتريات الحكومية:** يصعب مقارنة وعود الموردين بمتطلبات أمن وبيانات قابلة للقياس. **EN:** Procurement cannot translate vendor claims into measurable security and data requirements.
7. **فريق الامتثال:** يقضي أياماً بجمع screenshots وأدلة متفرقة قبل التدقيق. **EN:** Compliance spends days assembling screenshots and fragmented evidence before audits.
8. **فريق التقنية:** يخشى أن تضيف الحوكمة طوابير موافقة تبطئ الخدمة. **EN:** Engineering fears governance will add approval queues and operational latency.
9. **الإدارة العليا:** ترى عشرات تجارب AI ولا ترى سجل مخاطر أو عائداً موحداً. **EN:** Executives see many pilots but no consolidated risk register or ROI view.
10. **المالك التنفيذي:** يخشى vendor lock-in وأن تصبح الضوابط مرتبطة بنموذج واحد. **EN:** The executive sponsor fears model lock-in and non-portable controls.

## 5. Goal Patterns (10)

1. جرد 100% من حالات استخدام AI وتعيين مالك لكل حالة.
2. إنتاج ملف أدلة PDPL/NCA خلال 24 ساعة بدلاً من البحث اليدوي.
3. اجتياز مراجعة NCA ECC بأدلة تشغيلية قابلة للتتبع.
4. إكمال ISO 42001 gap analysis بخريطة ضوابط ذات owners ومواعيد.
5. منع PII قبل مغادرته حدود المؤسسة في الزمن الفعلي.
6. فرض موافقة بشرية على 100% من القرارات عالية المخاطر.
7. إعادة بناء أي قرار AI من prompt إلى approval إلى action.
8. تبديل مزود النموذج دون إعادة بناء سياسة الحوكمة.
9. خفض ساعات إعداد التدقيق اليدوي بمؤشر أساس وقياس بعدي.
10. إطلاق pilot محكوم بقطاع واحد ونتيجة قابلة للقياس.

## 6. Objection Patterns (10)

1. السعر غير واضح للمؤسسة الكبيرة. 2. التنفيذ قد يطول أو يعطل الإنتاج. 3. Vendor lock-in. 4. احتمال إرسال بيانات التدريب إلى طرف ثالث. 5. هل المنتج «أداة» أم استشارة قانونية؟ 6. أين تستضاف البيانات؟ 7. كيف يندمج مع SIEM/ERP/HIS؟ 8. هل الأدلة يقبلها المدقق؟ 9. ما دقة التصنيف ونسبة false positives؟ 10. هل يوجد دعم سعودي واتفاق SLA موثق؟

## 7. Buying Triggers (10)

1. تعميم أو ضابط جديد من SDAIA/NCA/SAMA/SFDA. 2. تدقيق مقرر خلال 90 يوماً. 3. حادثة تسريب عبر GenAI. 4. طلب مجلس الإدارة سجل مخاطر AI. 5. توسع Copilot/ChatGPT Enterprise. 6. طرح RFP حكومي. 7. بدء ISO 42001. 8. إطلاق نموذج ائتمان/طبي عالي الأثر. 9. تغيير مزود سحابة أو نموذج. 10. طلب شركة تأمين/مراجع مستقل أدلة controls.

## 8. 30 سؤال People Also Ask واتجاه النية

| # | السؤال | Intent | الصفحة الأنسب |
|---:|---|---|---|
| 1 | ما هي حوكمة الذكاء الاصطناعي في السعودية؟ | TOFU | `/` |
| 2 | من ينظم الذكاء الاصطناعي في السعودية؟ | TOFU | blog/SDAIA guide |
| 3 | هل PDPL ينطبق على بيانات prompts؟ | MOFU | PDPL blog + AI Firewall |
| 4 | كيف أبني سجل مخاطر AI؟ | MOFU | risk classification |
| 5 | ما متطلبات NCA ECC لأنظمة AI؟ | MOFU | NCA mapping doc |
| 6 | هل يوجد تدقيق إلزامي لنماذج AI؟ | MOFU | sector + blog |
| 7 | ما ISO/IEC 42001؟ | TOFU | ISO guide |
| 8 | كم يستغرق ISO 42001 gap analysis؟ | BOFU | assessment |
| 9 | كيف نكتشف Shadow AI؟ | MOFU | use-case discovery |
| 10 | كيف نمنع تسريب PII إلى ChatGPT؟ | BOFU | AI Firewall |
| 11 | ما محتويات AI evidence pack؟ | BOFU | evidence file |
| 12 | كيف نثبت human oversight؟ | BOFU | approvals |
| 13 | ما مدة الاحتفاظ بسجلات AI؟ | MOFU | audit trail |
| 14 | هل يجب استضافة بيانات AI في السعودية؟ | MOFU | trust |
| 15 | كيف نقيم مخاطر مورد LLM؟ | MOFU | platform + procurement guide |
| 16 | هل يمكن نشر منصة الحوكمة On-Premise؟ | BOFU | trust/platform |
| 17 | ما تكلفة حوكمة AI؟ | BOFU | pricing |
| 18 | كيف نحسب ROI للحوكمة؟ | BOFU | calculator |
| 19 | ما متطلبات SAMA لنماذج AI؟ | MOFU | banking |
| 20 | كيف نراجع نموذج ائتمان مدعوم بـAI؟ | BOFU | banking |
| 21 | هل AI الطبي يحتاج موافقة SFDA؟ | MOFU | healthcare |
| 22 | كيف نحمي بيانات المرضى عند استخدام LLM؟ | BOFU | hospital + firewall |
| 23 | ما أدلة التحقق السريري لنظام AI؟ | MOFU | healthcare/pharma |
| 24 | كيف نحكم وكلاء AI ذوي الصلاحيات؟ | MOFU | approvals/policies |
| 25 | ما الفرق بين AI governance وAI security؟ | TOFU | blog |
| 26 | كيف نحول سياسة AI إلى controls؟ | BOFU | policy mapping |
| 27 | هل السجل غير القابل للتعديل كافٍ للتدقيق؟ | MOFU | audit trail |
| 28 | كيف نمنع vendor lock-in؟ | BOFU | connectors |
| 29 | ما الأسئلة التي يجب وضعها في RFP لحوكمة AI؟ | BOFU | government/procurement |
| 30 | What is the fastest path to audit-ready AI in KSA? | BOFU | assessment/services |

## 9. 18 رسالة تسويقية مرتبة حسب العمود الناقص

| الصفحة | الرسالة | ركيزة VOC | Persona | وعد قابل للقياس | دليل مطلوب |
|---|---|---|---|---|---|
| `/` | اعرف كل نظام AI، مالكه، ومخاطره من لوحة واحدة | inventory/owner | CDO | جرد موحد | لقطة منتج + methodology |
| `/` | امنع البيانات الحساسة قبل أن تصل إلى النموذج | PII leakage | CISO | فحص كل prompt ضمن النطاق | اختبار redaction |
| `/` | حوّل كل قرار AI إلى سجل قابل لإعادة البناء | auditability | Compliance | trace end-to-end | audit sample |
| `/` | من سياسة AI إلى control يعمل وقت التنفيذ | policy-to-control | Governance | controls mapped | SDAIA/NCA mapping |
| `/` | ابدأ بتقييم جاهزية 20 دقيقة وخريطة فجوات PDF | time-to-value | Executive | 20 دقيقة + PDF | نموذج التقرير |
| `/services/` | ISO 42001 gap analysis بأصحاب مهام ومواعيد إغلاق | ISO 42001 | Governance | action register | ISO source |
| `/services/` | AI risk register حيّ، لا ملف Excel منسي | risk register | CRO | تحديث مستمر | product workflow |
| `/services/` | ملف تدقيق PDPL/NCA يُصدّر خلال 24 ساعة | evidence | Compliance | 24 ساعة | sample export |
| `/services/` | Pilot محكوم لقسم واحد مع KPI قبل/بعد | rollout | Innovation | pilot scoped | baseline report |
| `/services/` | تكامل مع ERP/HIS/SIEM دون تغيير النموذج الحالي | portability | CIO | defined connectors | connector matrix |
| `/solutions/[sector]` | للبنوك: trace وhuman review لكل قرار ائتماني عالي الأثر | model risk | Bank CRO | 100% high-risk routed | SAMA + test case |
| `/solutions/[sector]` | للمستشفيات: مسار بيانات المريض من HIS إلى النموذج والعودة | PHI lineage | Hospital CDO | trace per request | PDPL/SFDA |
| `/solutions/[sector]` | للأدوية: change control وأدلة إصدار لكل تحديث نموذج | validation | Pharma R&D | versioned evidence | SFDA/ISO 13485 |
| `/solutions/[sector]` | للحكومة: ضوابط NCA وPDPL قابلة للإثبات في RFP والتدقيق | procurement | Gov CISO | mapped controls | NCA/SDAIA |
| `/customers/bank/` | جهّز لجنة المخاطر بدليل قرار، لا screenshot | board evidence | Bank governance | one evidence pack | anonymized sample |
| `/customers/hospital/` | طبّق human oversight دون إبطاء مسار الرعاية | safety/latency | Clinical CIO | SLA measured | workflow test |
| `/customers/pharma/` | اربط كل مخرج AI بالإصدار والبيانات والمراجع | traceability | Quality director | full lineage | validation protocol |
| `/pricing/` | سعر مرتبط بالنطاق: أنظمة، مستخدمون، controls، وSLA واضح | objection/price | Procurement | itemized proposal | scope template |

## 10. 12 CTA ثنائية اللغة

| # | العربية | English | Microcopy |
|---:|---|---|---|
| 1 | احجز تقييم جاهزية AI — 20 دقيقة، مجاني، تقرير PDF | Book an AI readiness review — 20 minutes, free, PDF report | اعرف أول 3 فجوات قبل الاستثمار |
| 2 | أنشئ سجل مخاطر AI الأول | Build your first AI risk register | ابدأ بحالة استخدام واحدة |
| 3 | اطلب نموذج ملف الأدلة | Request a sample evidence pack | شاهد ما يراه المدقق |
| 4 | اختبر منع تسرب PII | Test PII leakage prevention | ببيانات وهمية، دون رفع أسرارك |
| 5 | راجع فجوات ISO 42001 | Review your ISO 42001 gaps | خريطة controls وowners |
| 6 | قيّم جاهزية تدقيق NCA | Assess NCA audit readiness | اربط الضابط بالدليل التشغيلي |
| 7 | صمّم Pilot محكوماً | Scope a governed pilot | KPI واضح وقسم واحد |
| 8 | راجع مخاطر مورد LLM | Review an LLM vendor risk | الاستضافة، التدريب، والاحتفاظ |
| 9 | شاهد مسار الموافقة البشرية | See the human-approval workflow | لا قرار عالي الأثر دون اعتماد |
| 10 | احسب تكلفة التدقيق اليدوي | Calculate manual audit cost | استخدم بياناتك الفعلية |
| 11 | ناقش تكامل ERP/HIS/SIEM | Discuss ERP/HIS/SIEM integration | دون إعادة بناء أنظمتك |
| 12 | اطلب عرضاً مفصلاً خلال 24 ساعة | Request an itemized proposal in 24 hours | نطاق، milestones، وSLA |

## 11. GeneralizedOut مقابل LocalizedOut — أعلى 5 مفاتيح

| المفتاح | تفوق BrightAI محلياً | التأخر مقابل المنافسين | الأولوية |
|---|---|---|---|
| حوكمة الذكاء الاصطناعي السعودية | عربية أولاً، PDPL/NCA/SDAIA، صفحات قطاعات ومدن | ضعف إثبات العملاء والاعتمادات والبحث الأصلي | P0: case studies + sourced claims |
| ISO 42001 Saudi | ذكر متكرر وربط تشغيلي | لا توجد صفحة خدمة gap analysis قوية بمنهج ومخرجات | P0: assessment landing + expert author |
| AI risk register KSA | حل تصنيف ومخاطر وتشغيل | لا توجد معاينة register أو template قابل للتنزيل | P0: template + demo |
| PDPL AI personal data | AI Firewall وPII Redaction ورسائل عربية قوية | claims مثل «متوافق بالكامل» تحتاج qualification ومصدر | P0: legal-safe copy + source mapping |
| NCA ECC AI controls | policy-to-control وaudit/evidence | IBM/Microsoft/OneTrust أقوى في الثقة المؤسسية والتكاملات المنشورة | P1: control matrix + connectors + references |

**استنتاج:** LocalizedOut قوي في اللغة والسياق السعودي، لكنه يتأخر في «دليل التنفيذ»: مراجع أولية، نماذج أدلة، قياسات، أسماء عملاء موثقة، ومصفوفة تكاملات. هذه هي فجوة الثقة الأهم، لا مجرد زيادة الكلمات المفتاحية.

---

# الطور B — Mini Execution Prompts لـ minimax code m3

## BAI-VOC-001-A — Embed VOC in Headlines

```text
سياق التنفيذ:
- الريبو: BRIGHTAI-main/، Astro 6.4.6، ar-SA أساسي.
- افحص src/pages/** وsrc/data/solutions.ts قبل التعديل.
- استخدم Playwright للتحقق المرئي، Context7 عند الحاجة لتوثيق Astro، وSequential Thinking قبل أي تعديل متعدد القوالب.

Task ID: BAI-VOC-001-A
الهدف: إدخال VOC عالي القيمة في hero copy دون تغيير بنية الصفحات.

1) حدّث H1 والفقرة الأولى فقط في `/`, `/services/`, قالب `/solutions/[sector]`, وصفحات `/customers/{bank,hospital,pharma}/` باستخدام: AI inventory، accountable owner، AI risk register، audit-ready evidence، human oversight.
2) خصص الوعد حسب persona والقطاع، وتجنب ادعاءات «امتثال كامل/مضمون»؛ استخدم «يدعم الجاهزية».
3) حافظ على كل الأقسام والروابط والمكونات وترتيبها، وأضف تعليق `<!-- BAI-VOC-001-A (2026-07-18): ... -->` أعلى frontmatter لكل ملف معدل.
4) شغّل build واختبارات SEO الحالية، ثم افحص الصفحات بـ Playwright على mobile وdesktop.
5) سجّل الملفات والـ before/after والنتائج في `worklog.md`.

معيار القبول:
- 7 surfaces على الأقل تحمل H1/lead مخصصاً؛ كل hero يتضمن ركيزتي VOC على الأقل؛ لا H1 مكرر؛ build ناجح؛ 0 رابط أو قسم محذوف.

حدود لا تكسر:
- لا تحذف صفحة أو قسمًا. لا تعدّل CSP. لا تعِد تسمية مكوّن. سجّل في worklog.md.
```

## BAI-VOC-001-B — Add FAQ Blocks

```text
سياق التنفيذ:
- الريبو: BRIGHTAI-main/، Astro 6.4.6، ar-SA أساسي.
- نتيجة baseline الحالية: `node scripts/check-speakable-schema.mjs` يجد 0 Speakable pages.
- استخدم Playwright وContext7 وSequential Thinking بالاسم عند الحاجة.

Task ID: BAI-VOC-001-B
الهدف: إضافة FAQ مرئي ومتطابق مع schema وSpeakableSpecification للصفحات الناقصة.

1) استخرج الصفحات P0 التي لا تحتوي FAQ مرئياً من `/solutions/[sector]`, `/solutions/[sector]/[city]`, `/kernel/{chat,approvals,audit,evidence,compliance,connectors}`.
2) لكل template ناقص أضف 5 أسئلة وأجوبة عربية سعودية، 40–60 كلمة للإجابة، مبنية على VOC القطاع دون ادعاء قانوني قاطع.
3) ولّد `FAQPage` من نفس مصفوفة البيانات المرئية، وأضف `SpeakableSpecification` بمحددات CSS تشير إلى H1 وملخص answer-first ظاهر.
4) أضف تعليق المهمة أعلى frontmatter وشغّل schema audit وbuild وافحص صفحة من كل template بـ Playwright.
5) وثّق count قبل/بعد والملفات في `worklog.md`.

معيار القبول:
- 5 FAQs مرئية ومتطابقة مع JSON-LD لكل template P0؛ لا اختلاف سؤال/جواب؛ `check-speakable-schema.mjs` يمر أو تُحدّث عتبته وفق العدد الحقيقي المبرر؛ 0 schema parse errors.

حدود لا تكسر:
- لا تحذف صفحة أو قسمًا. لا تعدّل CSP. لا تعدّل FAQ موجوداً إلا لإزالة تناقض مثبت. سجّل في worklog.md.
```

## BAI-VOC-001-C — Localize CTAs

```text
سياق التنفيذ:
- الريبو: BRIGHTAI-main/، ar-SA + en-SA.
- CTAs الحالية متفرقة بين «اطلب عرضاً»، «واتساب»، و«ابدأ تقييم مجاني».
- استخدم Playwright للتحقق من الروابط والنصوص.

Task ID: BAI-VOC-001-C
الهدف: توحيد CTA حسب مرحلة النية مع microcopy يعالج pain واحداً.

1) عرّف مصفوفة CTA مشتركة لثلاث نوايا: TOFU «نزّل/شاهد»، MOFU «قيّم»، BOFU «احجز/اطلب عرضاً» بالعربية والإنجليزية.
2) طبّقها على `/`, `/services/`, `/pricing/`, `/assessment/ai-governance-readiness/`, `/customers/*`, `/solutions/*` دون تغيير href/action الحالية.
3) أضف microcopy لا يتجاوز 12 كلمة: مدة، مجانية، PDF، خصوصية البيانات، أو عدم الالتزام.
4) أضف تعليق المهمة، اختبر keyboard focus وaccessible names والروابط بـ Playwright، ثم شغّل build.
5) سجّل before/after ومصفوفة CTA في `worklog.md`.

معيار القبول:
- كل صفحة P0 لها CTA رئيسي action-oriented + ثانوي؛ لا CTA مبهم مثل «اعرف أكثر» في hero/final CTA؛ كل microcopy ≤12 كلمة؛ 0 href/action متغير؛ 0 رابط مكسور.

حدود لا تكسر:
- لا تحذف صفحة أو قسمًا. لا تعدّل CSP. لا تغيّر endpoints أو أرقام التواصل. سجّل في worklog.md.
```

## BAI-VOC-001-D — Solution Page City Cluster

```text
سياق التنفيذ:
- القالب: `src/pages/solutions/[sector]/[city].astro` والبيانات في `src/data/solutions.ts`.
- المطلوب نص محلي فقط؛ لا تنشئ routes أو صفحات جديدة.
- استخدم Playwright وSequential Thinking قبل تعديل القالب الديناميكي.

Task ID: BAI-VOC-001-D
الهدف: إزالة النص المحلي العام وإضافة سياق مفيد للرياض، جدة، الدمام، نيوم، وKAUST zone حيث توجد route فعلية فقط.

1) جرد المدن الموجودة فعلياً في `sectors[].locals`; لا تفترض route لمدينة غير موجودة.
2) أضف mapping نصياً حسب المدينة والقطاع يشمل persona، الجهة التنظيمية، pain، وuse case محلياً، من 120–180 كلمة فريدة.
3) إن لم توجد نيوم أو KAUST zone، سجّلها `not implemented: no existing route` ولا تنشئ صفحة؛ حسّن المدن الموجودة فقط.
4) حافظ على canonical/geo/schema، أضف تعليق المهمة، ثم افحص uniqueness وbuild وصفحة من كل مدينة بـ Playwright.
5) سجّل coverage والقيود في `worklog.md`.

معيار القبول:
- 100% من routes المحلية الموجودة لها فقرة فريدة؛ تشابه النصوص الأساسية <70%؛ كل فقرة تذكر المدينة + القطاع + منظم مناسب؛ 0 route جديد؛ 0 تغيير canonical/geo.

حدود لا تكسر:
- لا تحذف صفحة أو قسمًا. لا تنشئ صفحات. لا تعدّل CSP. لا تختلق مكتباً أو عميلاً أو اعتماداً محلياً. سجّل في worklog.md.
```

## BAI-VOC-001-E — AEO Snippet Pack

```text
سياق التنفيذ:
- الريبو: BRIGHTAI-main/؛ صفحات P0 للقطاعات المنظمة.
- الملخص يجب أن يكون ظاهراً في body وقابلاً للاقتباس، وليس metadata فقط.
- استخدم Playwright وContext7 للتحقق من SSR وJSON-LD.

Task ID: BAI-VOC-001-E
الهدف: إضافة TL;DR answer-first إلى 12 صفحة P0 داخل section موجود.

1) اختر 12 صفحة فعلية تغطي البنوك والمستشفيات والأدوية والحكومة، مع أولوية sector/customer/solution pages.
2) اكتب لكل صفحة ملخصاً عربياً فريداً ≤60 كلمة: تعريف مباشر + منظم/معيار مناسب + outcome قابل للإثبات + disclaimer عند الحاجة.
3) ضعه في صدر section موجود داخل `<body>` مع class موحد و`data-speakable`; لا تضف section جديداً.
4) اربط `SpeakableSpecification.cssSelector` بالـ class الفعلي، وأضف تعليق المهمة وشغّل schema audit وbuild.
5) افحص 12 صفحة آلياً: الظهور في HTML SSR، عدد الكلمات، uniqueness، وmobile layout؛ وثّق النتائج في `worklog.md`.

معيار القبول:
- 12/12 ملخصاً ظاهراً وSSR؛ كل واحد 35–60 كلمة؛ 12 نصاً فريداً؛ 100% لها selector صالح؛ 0 ادعاء امتثال مضمون؛ schema/build ناجحان.

حدود لا تكسر:
- لا تحذف صفحة أو قسمًا. لا تعدّل CSP. لا تضف claims بلا مصدر. سجّل في worklog.md.
```

هذه البرومبتات المصغّرة جاهزة للصق المباشر في minimax code m3. ترتيب التنفيذ الموصى: BAI-VOC-001-A → -B → -C → -D → -E.
