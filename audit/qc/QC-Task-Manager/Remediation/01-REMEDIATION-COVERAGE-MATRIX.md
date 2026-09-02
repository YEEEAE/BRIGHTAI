# مصفوفة التغطية الشاملة لبرنامج العلاج — REMEDIATION COVERAGE MATRIX

> **المعيار الحاسم:** يجب أن يمتلك كل عيب ومجال ومعيار مفتوح في تقرير التدقيق جهة ملكية حصرية واضحة في أحد البرومبتات التنفيذية.  
> **حالة العيوب غير المخصصة:** **UNASSIGNED ACTIONABLE FINDINGS = 0** ✅

---

## 1. جدول تخصيص العيوب والنتائج المرصودة في التدقيق

| Finding ID | Severity | Audit Domain | Audit Score | Problem Description | Closure Type | Assigned Prompt | Dependency | Closure Evidence |
|---|---|---|---:|---|---|---|---|---|
| **P0-1** | Critical (P0) | Observability (30) / Error Arch (19) | 50.0% | فشل سويت الرصد بسبب عدم تطابق نص رسالة الخطأ الآمنة مع نص الاختبار القديم | Local Code | `PROMPT-01` | None | `PROMPT-01-EVIDENCE.md` + نجاح `test:observability` |
| **P0-2** | Critical (P0) | Accessibility (26) / Ergonomics (28) | 25.0% | فشل حارس الوصول لطلب ملف الأدلة بجانب البوابة بعد نقله وحذفه بالدمج | Local Code | `PROMPT-01` | None | `PROMPT-01-EVIDENCE.md` + نجاح `test:a11y-ergonomics-100` |
| **P0-3** | Critical (P0) | Destructive Actions (65) / Workflow (12) | 50.0% | توقف مشغل E2E عند سويت الحذف لاختلاف نص الزر وحجب 23 سويتاً | Local Code | `PROMPT-01` | None | `PROMPT-01-EVIDENCE.md` + نجاح 28 سويت E2E كاملاً |
| **P1-1** | High (P1) | Screen Reader UX (56) / A11y (26) | 50.0% | غياب تام لاختبارات قارئات الشاشة الحقيقية VoiceOver / NVDA بالعربي | Human Validation | `PROMPT-H2` | Gate C | محضر فحص VoiceOver/NVDA مع كفيف |
| **P1-2** | High (P1) | Backup & DR (9) / Reliability (20) | 75.0% | عدم تنفيذ تمرين استعادة كوارث فعلي في بيئة سحابية حية | External Cloud | `PROMPT-E2` | Gate C | تقرير تمرين الاستعادة وقياس RTO/RPO |
| **P1-3** | High (P1) | UX Research (66) / Usability (67) | 50.0% | خطة أبحاث تجربة المستخدم UAT لم تنفذ عملياً مع أي مستخدم حقيقي | Human Validation | `PROMPT-H1` | Gate C | تفريغ جلسات UAT وحساب نقاط SUS |
| **P1-4** | High (P1) | Dashboard (45) / Data Viz (46) | 75.0% | فلاتر اللوحة لا تشمل المختبر، وغياب جداول HTML البديلة لرسوم SVG | Local Code | `PROMPT-07` | Gate B | `PROMPT-07-EVIDENCE.md` + فحص اللوحة |
| **P1-5** | High (P1) | Advanced Tables (48) / Search (49) | 75.0% | سقف صامت لـ 500 صف في الفلترة والبحث وغياب الترقيم الخادمي | Local Code | `PROMPT-08` | Gate B | `PROMPT-08-EVIDENCE.md` + اختبار الترقيم |
| **P1-6** | High (P1) | Forms Design (25) / Unsaved Changes (64) | 75.0% | عدم تعميم حماية التغييرات غير المحفوظة وحفظ المسودات عبر الـ 51 نموذجاً | Local Code | `PROMPT-06` | Gate B | `PROMPT-06-EVIDENCE.md` + سويت النماذج |
| **P1-7** | High (P1) | Concurrency (35) / Capacity (84) | 75.0% | معمارية المعالجة أحادية الخيط ومحدودية التوسع المباشر لـ SQLite | Local & Arch | `PROMPT-02` | Gate A | `PROMPT-02-EVIDENCE.md` + معايير WAL |
| **P2-1** | Medium (P2) | Export / PDF (73) / Reporting (74) | 50.0% | تعطل سكريبت توليد PDF العربي بسبب خطأ تشكيل الحروف في fontkit | Local Code | `PROMPT-05` | Gate A | `PROMPT-05-EVIDENCE.md` + نجاح سكريبت PDF |
| **P2-2** | Medium (P2) | Dashboard Design (45) / Metrics (47) | 75.0% | تكرار تعريفي بين مقياس Completion Time ومقياس Resolution Time | Local Code | `PROMPT-07` | Gate B | `PROMPT-07-EVIDENCE.md` + فحص المقاييس |
| **P2-3** | Medium (P2) | Laboratory UX (43) / Change Requests (16) | 75.0% | نموذج طلب التغيير في المختبر يعكس هيكل الـ DB بدلاً من نية المستخدم | Local Code | `PROMPT-04` | Gate A | `PROMPT-04-EVIDENCE.md` + تجربة النموذج |
| **P2-4** | Medium (P2) | Security Engineering (3) / AppSec (79) | 75.0% | غياب تقرير فحص اختراق خارجي مستقل (External Pentest) | External Security | `PROMPT-H4` | Gate C | تقرير فحص اختراق أمني مستقل معتمد |
| **P2-5** | Medium (P2) | Secrets Management (81) / IAM (6) | 75.0% | مفتاح تجريبي محلي بحاجة لتدوير رسمي وإجبار التغيير بالإنتاج | Local Code & Ops | `PROMPT-03` | Gate A | `PROMPT-03-EVIDENCE.md` + تدوير المفاتيح |
| **P2-6** | Medium (P2) | Concurrency (35) / API Design (34) | 75.0% | غياب مفاتيح منع التكرار Idempotency Keys في طلبات POST غير الآمنة | Local Code | `PROMPT-02` | Gate A | `PROMPT-02-EVIDENCE.md` + سويت الـ Idempotency |
| **P3-1** | Low (P3) | Code Quality (33) / Docs (88) | 75.0% | مسافات بيضاء زائدة في نهاية أسطر بعض ملفات التوثيق | Local Hygiene | `PROMPT-13` | Gate B | فحص نظافة الكود والتوثيق |
| **P3-2** | Low (P3) | Design Tokens (91) / Maintainability (33)| 75.0% | أسماء مستعارة قديمة لتوكنز الحركة duration-150 للتوافق الرجعي | Local Hygiene | `PROMPT-10` | Gate B | فحص نظافة التوكنز في Tailwind |
| **P3-3** | Low (P3) | Responsive Design (54) / Visual (52) | 75.0% | اختلافات طفيفة في محاذاة الجداول عند تكبير 400% بالجوال | Local CSS | `PROMPT-10` | Gate B | اختبار التكبير لـ 400% بالجوال |

---

## 2. جدول تغطية الـ 100 مجال في برنامج العلاج (100-Domain Allocation)

| نطاق المجالات | عدد المجالات | البرومبتات المسؤولة عن التطوير المحلي | البرومبتات المسؤولة عن التحقق البشري والخارجي |
|---|---:|---|---|
| **المجالات 1 إلى 10 (الهندسة، الجودة، الأمان، البيانات)** | 10 مجالات | `PROMPT-00`, `PROMPT-01`, `PROMPT-02`, `PROMPT-03`, `PROMPT-04` | `PROMPT-H4`, `PROMPT-E2`, `PROMPT-H5` |
| **المجالات 11 إلى 21 (المعمارية، التدفقات، السجلات، الخصوصية)** | 11 مجالاً | `PROMPT-01`, `PROMPT-02`, `PROMPT-03`, `PROMPT-04`, `PROMPT-13` | `PROMPT-H5`, `PROMPT-E1` |
| **المجالات 22 إلى 36 (تجربة المستخدم، النماذج، الوصول، الأداء)** | 15 مجالاً | `PROMPT-06`, `PROMPT-09`, `PROMPT-11`, `PROMPT-02`, `PROMPT-03` | `PROMPT-H1`, `PROMPT-H2`, `PROMPT-H3`, `PROMPT-E3` |
| **المجالات 37 إلى 50 (استراتيجية المنتج، نظام التصميم، اللوحات)** | 14 مجالاً | `PROMPT-07`, `PROMPT-08`, `PROMPT-10`, `PROMPT-04` | `PROMPT-H1`, `PROMPT-H3` |
| **المجالات 51 إلى 65 (الواجهات، التجاوب، لوحة المفاتيح، الأخطاء)** | 15 مجالاً | `PROMPT-09`, `PROMPT-10`, `PROMPT-06`, `PROMPT-01`, `PROMPT-04` | `PROMPT-H2`, `PROMPT-H3` |
| **المجالات 66 إلى 80 (الأبحاث، التقارير، السلسلة الإمدادية، البيئات)** | 15 مجالاً | `PROMPT-05`, `PROMPT-07`, `PROMPT-08`, `PROMPT-11`, `PROMPT-13` | `PROMPT-H1`, `PROMPT-H4`, `PROMPT-E1` |
| **المجالات 81 إلى 97 (الأسرار، الحوادث، المكونات، الحركة، الرموز)** | 17 مجالاً | `PROMPT-03`, `PROMPT-10`, `PROMPT-11`, `PROMPT-13` | `PROMPT-E4`, `PROMPT-H3` |
| **المجالات 98 إلى 100 (حوكمة الذكاء الاصطناعي وتقييم النماذج)** | 3 مجالات | `PROMPT-12` | `PROMPT-H5` |
| **الإجمالي** | **100 مجال** | **تغطية برمجية محلية 100%** | **تغطية بشرية وخارجية 100%** |

---

## 3. إثبات التغطية الكاملة (Proof of Complete Coverage)

- **إجمالي العيوب المرصودة في التدقيق:** 19 عيباً صريحاً.
- **العيوب المخصصة لبرومبتات التنفيذ البرمجي:** 13 عيباً.
- **العيوب المخصصة لبرومبتات الفحص البشري:** 3 عيوب (P1-1, P1-3, P2-4).
- **العيوب المخصصة لبرومبتات الفحص الخارجي السحابي:** 3 عيوب (P1-2, P1-7, P2-4 مشتركة).
- **عدد العيوب غير المخصصة (UNASSIGNED ACTIONABLE FINDINGS):** **0 (صفر)**.
- **تغطية عيوب P0:** **100% (3 من 3)**.
- **تغطية عيوب P1:** **100% (7 من 7)**.
- **تغطية عيوب P2:** **100% (6 من 6)**.
- **تغطية عيوب P3 الجوهرية:** **100% (3 من 3)**.
- **تغطية المجالات الـ 98 التي تقل عن 100%:** **100% (98 من 98)**.
