# BRIGHTAI — Topical Authority Page Matrix (2026-09-08)

هذه الخريطة تربط كل كلمة في `01-KEYWORD-OWNERSHIP-MAP.csv` بمالك واحد واضح. كلمة `primary` لها صفحة أساسية واحدة، والكلمات `secondary` و`supporting` تظهر داخل صفحات ذات نية بحث متقاربة وتدعم المالك بروابط وسياق تحريري طبيعي.

## الصفحات المالكة الأساسية

| الصفحة المالكة | Primary keyword / cluster | الكلمات الداعمة داخل الصفحة أو العنقود |
|---|---|---|
| `/` | شركات الذكاء الاصطناعي في السعودية | الذكاء الاصطناعي في السعودية، الذكاء الاصطناعي وحوكمة البيانات، ذكاء اصطناعي |
| `/services/` | شركة أتمتة | AI automation tools، AI automation، AI and automation، استشارات التحول الرقمي، شركة اتمتة جدة |
| `/solutions/ai-firewall/` | ai firewall | AI security، AI and security، data loss prevention |
| `/blog/ndmo-data-governance-saudi/` | حوكمة البيانات | ما هي حوكمة البيانات، معنى حوكمة البيانات، إدارة البيانات، حوكمة تقنية المعلومات |
| `/docs/ai-risk-management/` | إدارة المخاطر | مخاطر الذكاء الاصطناعي، إدارة المخاطر pdf |
| `/docs/pdpl-ai-complete-guide/` | حماية البيانات الشخصية | حماية البيانات، نظام حماية البيانات الشخصية سدايا، نظام حماية البيانات الشخصية هيئة الخبراء، نظام حماية البيانات الشخصية السعودي pdf، الخصوصية |
| `/blog/saudi-ai-landscape-sdaia-humain-allam-scai/` | الذكاء الاصطناعي في السعودية | تطبيقات الذكاء الاصطناعي في السعودية، الذكاء الاصطناعي السعودية، الذكاء الاصطناعي بالعربي، استخدام الذكاء الاصطناعي، استخدامات الذكاء الاصطناعي، سدايا |
| `/blog/nca-cybersecurity-requirements-saudi/` | الأمن السيبراني السعودية | الأمن السيبراني، AI network security |
| `/hub/ai-governance/` | AI governance | حوكمة الذكاء الاصطناعي، أخلاقيات الذكاء الاصطناعي، تقنيات الذكاء الاصطناعي، حوكمة الذكاء الاصطناعي pdf |
| `/en/pdpl-statement/` | PDPL | نظام حماية البيانات الشخصية |
| `/blog/shadow-ai-discovery-saudi-company/` | shadow ai | استخدامات Shadow AI داخل المؤسسة |
| `/blog/digital-transformation-sme-saudi/` | التحول الرقمي | قياس التحول الرقمي، التحول الرقمي في السعودية |
| `/blog/arabic-chatbot-customer-service-saudi/` | شات بوت | شات بوت عربي، روبوت دردشة |

## صفحات الدعم التعليمي والسياقي

| الصفحة | الكلمات المالكة لها كسياق داعم |
|---|---|
| `/blog/ai-governance-framework-saudi-model/` | حوكمة الشركات في السعودية، لائحة حوكمة الشركات، حوكمة الشركات، ai governance best practices، ai governance strategy، ai governance principles، ai governance standards، ai governance model |
| `/blog/ai-vs-machine-learning-explained/` | ماهو الذكاء الاصطناعي، الذكاء الاصطناعي، ذكاء اصطناعي، تعلم الآلة، تطبيق الذكاء الاصطناعي، برمجة الذكاء الاصطناعي |
| `/blog/big-data-analytics-saudi-companies/` | تحليل البيانات، ذكاء الأعمال |
| `/blog/generative-ai-education-saudi/` | دورات الذكاء الاصطناعي، وظائف الذكاء الاصطناعي |
| `/blog/ai-customer-data-protection-saudi/` | chatgpt، شات جي بي تي |
| `/docs/pdpl-ai-complete-guide/` | منصة حوكمة البيانات الوطنية، الخصوصية |
| `/about/` | saudi company for artificial intelligence |

## قاعدة تعدد المالكين

لا تُنشأ ملكية ثانية تنافس الصفحة الأساسية لنفس الكلمة. عند الحاجة تظهر الكلمة نفسها في صفحة داعمة واحدة أو أكثر فقط إذا كان السياق مختلفًا ومفيدًا للمستخدم، وتظل `final_owner_url` في خريطة CSV هي المرجع الأساسي. حقل `supporting_urls` يوثق صفحات الدعم الموجودة بدون تحويلها إلى صفحات منافسة.

## حالة التحقق

- 80 كلمة في خريطة الملكية؛ 80 لها `final_owner_url`.
- 15 كلمة/عنقودًا أساسيًا، و37 كلمة ثانوية، و28 كلمة داعمة.
- التحقق النهائي يجب أن يقرأ HTML الناتج بعد البناء، لا ملفات المصدر فقط؛ التصدّر الفعلي يحتاج إعادة فهرسة وبيانات GSC بعد النشر.
