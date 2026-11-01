# AIGAS Risk Engine — ACCEPTANCE-AND-EVIDENCE

> **Document ID:** `AIGAS-RE-ACC-001` · **Version:** `1.0.0-draft` · **Date:** 2026-11-01  
> **Canonical path:** `docs/products/risk-engine/ACCEPTANCE-AND-EVIDENCE.md`  
> **Release status:** `NOT_APPROVED / OPERATING PRODUCT NOT VERIFIED`  
> **Target:** `AIGAS-RE`, Wave 2, independently licensed with shared AIGAS Kernel.

## 1. معيار الإثبات لا الوصف

هذه الوثيقة تحدد كيف يثبت صاحب المنتج للجهة المعتمدة أن Risk Engine **ينشئ أصلًا، يصدر تقييمًا مفسرًا، يطبق حدود سياسة، يمنع اعتمادًا غير مخول، ويحتفظ بأثر مراجعة وتغيّر**. واجهة المصفوفة التعليمية، صفحة Astro، نجاح البناء، أو README تاريخي **ليست أدلة تشغيل أو اعتماد إطلاق**.

أضيفت لاحقًا شريحة محلية في `/app/risk-engine/` تحفظ الأصول والتقييمات الأولية، وأضيف الآن سجل نسخ الأصول إلى الترحيل المحلي. اختُبر الأساس السابق على قاعدة محلية اصطناعية، لكن إضافة سجل النسخ لم يُعَد اختبارها في هذه المراجعة لأن sandbox منع تشغيل PostgreSQL. جداول Risk Engine غير موجودة في Neon المفحوصة، ولم تُختبر جلسة Neon فعلية أو نشر. **بوابات التشغيل والإطلاق في هذه الوثيقة تبقى `NOT_VERIFIED`**. `FEATURE-STATUS.yaml` هو السجل التفصيلي؛ لا يجوز تحويل `PLANNED` إلى `WORKING` إلا بدليل خاص بنسخة وبيئة وحالة استخدام.

## 2. قاموس القرار

| الحالة | التفسير | يتيح إطلاق/تسويق كمتاح؟ |
|---|---|---|
| `PASS` | دليل محدث ومكرر في البيئة المحددة ومراجع من صاحب صلاحية | نعم للخاصية ضمن النطاق فقط؛ بعد بوابات الإطلاق |
| `FAIL` | دليل يثبت مخالفة معيار | لا |
| `BLOCKED` | شرط دخول أو موافقة أو مورد غير متاح | لا |
| `NOT_VERIFIED` | لا أدلة كافية أو لا فحص تشغيلي | لا |
| `NOT_APPLICABLE` | استثناء موثق وموافق عليه لنطاق محدد فقط | ليس بديلًا عن المتطلب الأساسي |

**عند عدم وجود تقرير:** `NOT AVAILABLE FOR VERIFICATION`. لا تملأ قيمة `PASS` من افتراض أو لقطة شاشة فقط. لا ترفع شهادة أو مؤشرات نسبة جاهزية دون سند. كل معيار P0 فاشل أو غير متحقق يمنع اعتماد النسخة المستهدفة.

## 3. حزمة إثبات أساسية لكل تشغيل

| معرف دليل | نوع الدليل | ما يلزم وجوده |
|---|---|---|
| `EV-RE-01` | Release manifest | `commit_sha`, نسخة Artifact، بيئة نشر، موافقات، timestamp، هاش محفوظ |
| `EV-RE-02` | Identity & tenant matrix | صلاحيات الدور، حدود tenant، حالات منع Cross-tenant |
| `EV-RE-03` | Policy/methodology registry | نسخة منهج، قواعد، ترتيب حدود عليا وقرار اعتمادها |
| `EV-RE-04` | Assessment trace | مدخلات صناعية، نتيجة، سبب، sources، version، correlation ID |
| `EV-RE-05` | AI provider assessment | نموذج/منطقة/سياسة عدم التدريب/عقد ومعالجة بيانات/تخفيف سجلات |
| `EV-RE-06` | Review decision evidence | هوية مخولة، قرار مسبب، SoD، وقت، نسخة تقييم، سجل رفض |
| `EV-RE-07` | Change & reassessment lineage | before/after، مادية التغير، نسخة التقييم الجديدة وربطها بالقديمة |
| `EV-RE-08` | Integration proof | مسار نظام متكامل مصرح به عند ادعاء إنفاذ، لا Demo |
| `EV-RE-09` | Security/Privacy control evidence | مصفوفة عزل، أسرار، تشفير، logs منقحة، حذف وتصدير |
| `EV-RE-10` | Trial & commercial evidence | تفعيل/انتهاء 48 ساعة، حصص، عدم فوترة تلقائية، تقرير PoV |
| `EV-RE-11` | Offline deployment evidence | تحقق محلي من الرخصة والمفاتيح والتشغيل بلا Cloud إذا سُوق Air-Gapped |
| `EV-RE-12` | Acceptance decision | أسماء أدوار المراجعين وصلاحياتهم وتواقيعهم ونسخة الأدلة |

**حماية الأدلة:** جميع الأمثلة اصطناعية، مع حجب البيانات الشخصية والأسرار. مراجع الأدلة تبقى في مستودع مؤسسي مصرح به حسب سياسة الاحتفاظ؛ لا تُضاف ملفات عملاء خام إلى GitHub أو تحليلات الموقع.

## 4. متطلبات الإثبات التفصيلية (33 معيارًا)

كل معيار يتطلب نتيجة `PASS / FAIL / BLOCKED / NOT_VERIFIED` **مقترنة بإصدار وبيئة ودليل فعلي**، وليس مجرد تحديد خانة.

| Acceptance ID | Trace | أولوية | معيار قابل للإثبات | الدليل الموضوعي الأدنى |
|---|---|---|---|---|
| `AC-RE-01` | `RE-01` | P0 | إضافة أصل بمالك وغرض وسياق داخل tenant مع فحص required fields | سجل إنشاء أصل، API request/response مخفف، حالة تخزين داخل tenant ورابط actor/وقت |
| `AC-RE-02` | `RE-01` | P0 | ربط فئات البيانات والأطراف المتأثرة وإثبات الإذن والتصنيف | Snapshot أصل مع سياسة تصنيف ونتائج ردّ عند بيانات غير مصرح بها |
| `AC-RE-03` | `RE-01` | P1 | مرجعية نموذج وإصدار وضوابط ومكان التشغيل قابلة للتحديث وتبقى النسخ القديمة | Diff قبل/بعد وسجل Asset version وعلاقة أصل بمراجع الإجراءات |
| `AC-RE-04` | `RE-01` | P1 | استيراد مصرح به مع Mapping وتحقق متكامل وعدم تصعيد صلاحية | ملف اصطناعي مقيد، سجل رفض صفوف خاطئة ونتيجة import وAudit |
| `AC-RE-05` | `RE-01` | P0 | بحث/فلترة tenant لا يظهر أصل tenant آخر ولو بتغيير معرف أو Cursor | مصفوفة صلاحيـات A/B، لقطات API query/404، فحص Audit |
| `AC-RE-06` | `RE-02` | P0 | قاعدة منشورة بنسخة منهج؛ يُعاد نفس التصنيف من مدخلات وسياسة ثابتة | Methodology version، rule IDs، input fixture synthetic، trace متكرر |
| `AC-RE-07` | `RE-02` | P0 | شرح عوامل الاحتمال/الأثر/الضوابط ومصادرها وعدم إصدار درجة غير معتمدة | تقرير Finding مع references وأسباب؛ score=null عند غياب منهج رقمي |
| `AC-RE-08` | `RE-02` | P0 | تحليل سياقي فقط عبر نموذج/منطقة معتمدين مع منع التدريب وفلترة المدخلات | موافقات المورد ومعالجة البيانات، provider config، redaction log، result source |
| `AC-RE-09` | `RE-02` | P0 | يظهر الفرق بين قاعدة حتمية ورأي نموذج وأدلة غير كافية | تقييم مسبب، مصدر كل finding، policy/methodology/model version |
| `AC-RE-10` | `RE-02` | P1 | الاعتراض يفتح سجلًا جديدًا ويربط مراجعة/تقييم دون محو التاريخ | Challenge receipt، lineage، أصل التقييم السابق بقي ثابتًا |
| `AC-RE-11` | `RE-02` | P0 | تعطل النموذج/فقد الدليل لا يولد اعتمادًا تلقائيًا | Fault injection، response incomplete/review_required، trace قرارات |
| `AC-RE-12` | `RE-02` | P0 | أي score أو tier مرتبط بمنهج معتمد؛ لا نسبة دقة/سقف رقم من Demo | قرار اعتماد methodology، ردّ رفض إذا غير معتمد، snapshot null |
| `AC-RE-13` | `RE-03` | P0 | إعمال سياسات tenant والوحدة/المنتج/الدور حسب ترتيب ثابت | Policy precedence table مع تقييمات من حسابات أدوار مختلفة |
| `AC-RE-14` | `RE-03` | P0 | رفض تعديل/تقييم يخفف قيدًا أعلى أو يتجاوز حدًا إلزاميًا | سجل `POLICY_HIERARCHY_VIOLATION` وAudit بدون effect جانبي |
| `AC-RE-15` | `RE-03` | P0 | تخزين نسخة السياسة النافذة في التقييم وإعادة إنتاج النتيجة القديمة | تقييمان قبل/بعد سياسة، policy snapshots، تعليل التغير |
| `AC-RE-16` | `RE-03` | P0 | التفويض وSoD لسياسات المخاطر والمراجعات؛ الإدارة التقنية لا تتجاوز القرار | Role matrix ورفض self-approval وtrace source authority |
| `AC-RE-17` | `RE-04` | P1 | التغير في نموذج/بيانات/سياق يظهر بحدث موثوق مرتبط بإصدار الأصل | Change receipt، old/new references وsource timestamp |
| `AC-RE-18` | `RE-04` | P1 | تمييز material/nonmaterial بمعيار مؤرخ ومسبب | قرار materiality، نسخة rule/owner، حالتا تغير اصطناعيتان |
| `AC-RE-19` | `RE-04` | P0 | إعادة التقييم تنشئ نسخة جديدة ولا تعدل تقييمًا سبق اعتماده | Old/new lineage، ETag conflict، audit decision |
| `AC-RE-20` | `RE-04` | P1 | سلسلة أدلة كاملة: تغير ← طلب تقييم ← مراجعة ← نتيجة | Timeline correlation IDs ومراجع الإصدارات |
| `AC-RE-21` | `RE-05` | P0 | حالة عالية المخاطر لا تتجاوز مراجعات Privacy/Security/Safety المقررة | Review policy + missing reviewer + blocked/pending state |
| `AC-RE-22` | `RE-05` | P0 | المراجع مستقل ومخول، قراره مسبب ولا يستطيع محو القيد الأعلى | Identity/SoD matrix، signed review receipt، reject/approve cases |
| `AC-RE-23` | `RE-05` | P0 | خدمة تقييم غير مربوطة بنقطة تحكم لا تدعي أو تفرض حظرًا | فحص معماري ومسار طلب non-integrated، غياب side effects |
| `AC-RE-24` | `RE-05` | P0 | عند وجود تكامل حقيقي فقط، تمنع بوابة نشر مؤثرة دون موافقة صالحة | Integration proof، call logs موثقة، رفض/expired/approved states |
| `AC-RE-25` | `Cross-cutting` | P0 | هوية tenant غير قابلة للعبث؛ عزل DB/API/exports/events/telemetry | Cross-tenant matrix + storage/queue/trace validation |
| `AC-RE-26` | `Cross-cutting` | P0 | تتبع نشاط الأمان الأساسي حتى دون ترخيص Ledger | Kernel audit events + license disabled record |
| `AC-RE-27` | `Cross-cutting` | P0 | إدارة مفاتيح وحماية محتوى وتحديد مورد معتمد؛ لا تدريب على البيانات | Security config، DPA/contract وlogs منقحة ومراجعة provider |
| `AC-RE-28` | `Cross-cutting` | P0 | Risk Engine يعمل منفردًا مع Kernel دون رخص FW/HG/LD | License entitlements & product-only execution trace |
| `AC-RE-29` | `Cross-cutting` | P0 | ملف نشر SaaS/Local/Offline معزول له هوية/رخصة وتحديثات مستقلة | Deployment artifact + disconnected proof for airgap where claimed |
| `AC-RE-30` | `Cross-cutting` | P0 | تصدير وحذف وRetention/Legal Hold بتصريح وقرار مكتوب | Data inventory, delete/export traces, backup exceptions, approvals |
| `AC-RE-31` | `Availability` | P0 | لا تعلن API فعّالة دون توثيق هوست وإصدار وحماية وتشغيل فعلي | Live/isolated runtime endpoint evidence + API conformance + auth |
| `AC-RE-32` | `Trial` | P0 | 48 ساعة من التفعيل، تقييد حصص، إيقاف بلا تجديد مدفوع، تقرير PoV | Trial state transition logs, activated_at/expiry, quota, billing zero |
| `AC-RE-33` | `Release` | P0 | لا READY / AVAILABLE قبل موافقات أصحاب صلاحية وإثبات الإنتاج | Owner/Security/Privacy/Operations signoffs and release manifest |

## 5. خطوات الإثبات الإلزامية بحسب القدرة

### RE-01 — سجل الأصل ومراجعة النسخ

1. شغّل خدمة فعلية تحت مستأجر A بهوية مستخدم يملك `risk.asset.write`، وأنشئ أصلًا اصطناعيًا بمالك وغرض ووصف بيانات.
2. استرجع الأصل وتأكد من `asset_id`, `tenant_id`, `version` والحقول اللازمة وعدم مرور بيانات سرية.
3. عدّل النموذج/الغرض مع `If-Match`؛ سجل نسخة جديدة ولا تغيّر التاريخ سابقًا.
4. كرر القراءة بمستأجر B وبمستخدم فاقد صلاحية؛ يجب رفضها دون كشف وجود الأصل.
5. أعد طلب إنشاء بنفس مفتاح idempotency؛ لا ينتج أصلين أو عد استهلاك مرتين.

### RE-02 — القواعد والهجين والتفسير

1. اعتمد منهجًا وإصدارًا وقواعد محددة، ثم قدّم تقييمًا صناعيًا ذا أدلة احتمال وأثر محددة.
2. أعد تقييم المدخلات والسياسة والمنهج نفسيهما؛ يجب أن يمكن تفسير العوامل والتحقق من سبب أي اختلاف نتيجة.
3. إن استُخدم نموذج سياقي، وثّق الموافقة على المزود والمنطقة، ونوع البيانات المرسلة، ومنع التدريب، وميّز رأيه عن القواعد.
4. أوقف المزود أو أزل دليلًا أساسيًا؛ يتعين إظهار نقص/مراجعة، وليس `APPROVED` آليًا.
5. تحقق أن `numeric_score` فارغ حتى تُعتمد معايرة رقمية، ولا تُعرض مؤشرات دقة بلا قياس.
6. قدّم اعتراضًا على finding؛ يجب إنشاء سجل مرتبط دون تعديل أصل التقييم المعتمد.

### RE-03 — عتبات أعلى وصلاحيات

1. طبّق سياسة عليا للمستأجر مع سياسة إدارة/مستخدم أشد أو أضيق ضمن المسموح.
2. حاول في سياسة أدنى التخفيف من قيد أعلى؛ تحقق من الرفض والأثر في Audit.
3. اعتمد تقييمًا بالسياسة الأولى، غيّر السياسة، وتحقق من حفظ النسخة القديمة وإعادة إصدار تقييم جديد بحسب التغيير.
4. جرّب دور مشرف تقني ومقدم تقييم؛ لا يملكون وحدهم تجاوز ضابط حوكمة أو الموافقة الذاتية عند SoD.

### RE-04 — تغير مادي وإعادة تقييم

1. أنشئ أصلًا وتقييمًا معتمدًا، ثم سجّل حدث تغير موثق (`model_version` أو نوع البيانات أو وجهة المعالجة).
2. طابق سبب اعتبار التغير ماديًا مع سياسة معتمدة، وسجل قرار إعادة التقييم.
3. أظهر أن التقييم الجديد يحمل `new_assessment_id` ويرتبط بالتقييم السابق، دون overwrite للسجل القديم.
4. افحص تغيرًا غير ماديٍ بوضوح؛ ينبغي تسجيل السبب بدل إخفاء الحدث.

### RE-05 — المراجعة والبوابات الفعلية

1. قدّم مثالًا عالي الخطورة **بحسب منهج الجهة المعتمد** وتأكد من فتح Privacy/Security/Safety reviews اللازمة.
2. جرّب مقدم الطلب كمراجع عند اشتراط الفصل، ومراجعًا غير مصرح، ومراجعًا من tenant آخر؛ كلهم يُرفضون.
3. مراجع صحيح يرفض أو يطلب معلومات أو يوافق مع سبب؛ تأكد أن القرار يخص نسخة تقييم معينة.
4. ادّعاء حظر تشغيل AI خارجي غير مسموح دون **نقطة إنفاذ فعلية**. إذا لا يوجد تكامل، يُثبت عدم وجود side-effect لا يُعلن عكسه.
5. إذا تم تسويق بوابة تكامل، يجب إثبات رفض إجراء حقيقي عند انتهاء أو غياب الموافقة؛ لا يكفي ردّ API على واجهة العرض.

## 6. سلامة الـAPI والتعطل

- **Authentication:** رفض 401 عند عدم التوثيق، 403 عند غياب الإذن، 404 موحد عند إخفاء وجود أصول/تقييمات مستأجر آخر.
- **Authorization:** لا ثقة في `tenant_id` بالـpayload أو query، ولا تجاوز `risk.policy.manage` عبر `risk.asset.write`.
- **Concurrency:** `If-Match` و`Idempotency-Key` للعمليات الحساسة؛ طلب قديم يعطي `409/412` دون فقد تاريخ.
- **Safety:** فشل نموذج، فقد منهج، فشل خدمة هوية، غياب دليل، أو وصول حد كلفة لا ينتج اعتمادًا صامتًا.
- **Data:** No-Training مع جميع المزودين؛ لا نص خام حساس في Log/Trace/Analytics؛ عدم إرسال لجهة/منطقة غير مصرح بها.
- **Air-Gapped:** لا اتصالات خارجية إطلاقًا عند النشر المعزول؛ الهوية والرخصة والتحقق والتحديثات تعمل محليًا وفق حزمة معتمدة.
- **Evidence:** Audit Kernel أساسي حتى دون رخصة Ledger؛ أدلة متقدمة اختيارية فقط.
- **Commercial:** تنتهي الـ48 ساعة حسب وقت خادم موثوق وتُقفل الصلاحيات دون تحويل مدفوع أو خصم.

## 7. موانع إطلاق حرجة (P0 Release Blockers)

| Blocker | لماذا يمنع الإطلاق | القرار |
|---|---|---|
| `RE-BLK-01` | لا يوجد تقييم فعلي بعوامل/منهج/نسخة/دليل | `NO-GO` |
| `RE-BLK-02` | أصل أو تقييم يُقرأ عبر tenant آخر | `NO-GO` |
| `RE-BLK-03` | تخفيف سياسة عليا أو تجاوز قيد إلزامي | `NO-GO` |
| `RE-BLK-04` | self-approval ممنوع أو مراجعة غير مخولة | `NO-GO` |
| `RE-BLK-05` | AI provider غير معتمد أو يسمح تدريبًا على بيانات العملاء | `NO-GO` |
| `RE-BLK-06` | فشل/غياب دليل ينتج «موافق» بدل معلّق | `NO-GO` |
| `RE-BLK-07` | تعديل تقييم سابق بدل إصدار جديد أو ضياع أثر المراجعة | `NO-GO` |
| `RE-BLK-08` | تصنيف رقمي يُسوق كمعتمد دون منهج/معايرة موثقة | `NO-GO` |
| `RE-BLK-09` | «حظر» مُعلن على نظام لا يمر عبر نقطة إنفاذ فعلية | `NO-GO` |
| `RE-BLK-10` | خطر بيانات حقيقية في Trial دون تصريح مكتوب/بيئة معتمدة | `NO-GO` |
| `RE-BLK-11` | كشف أسرار أو بيانات حساسة في logs أو analytics أو التصدير | `NO-GO` |
| `RE-BLK-12` | فشل ترخيص/انتهاء التجربة يؤدي لاستخدام مستمر أو فوترة صامتة | `NO-GO` |

لا يُلغي نجاح CSS/Playwright على موقع التسويق أي Blocker أعلاه.

## 8. مصفوفة مسارات المنتجات والتراخيص

| النطاق | حالة القبول المطلوبة | إثبات خاص |
|---|---|---|
| Risk Engine منفرد | **MVP الأساسي يعمل** مع Kernel فقط | اختبر دون رخص FW/HG/LD؛ `AC-RE-28` |
| Risk Engine + Firewall | تكامل اختياري يعيد مرجع تصنيف ضمن حدود حالة الطلب | إثبات قرار FW عبر نقطة متكاملة، لا استجابة RE وحدها |
| Risk Engine + Human Gate | مراجعة متعددة المراحل اختيارية | تفويض وSoD على المنتجين وتوافق إصدارات |
| Risk Engine + Ledger | أدلة موسعة اختيارية | نسخة أساسية من Audit تبقى عند تعطيل LD |
| SaaS | Tenant isolation وresidency وحدود المورد | مراجع تشغيل وتقارير عزل واعتماد موقع البيانات |
| On-Premise | حزمة مُدارة داخل حدود العميل | ترخيص وصلاحيات ومفاتيح ومسؤوليات تعاقدية |
| Air-Gapped | تشغيل محلي 100% إن أُعلن | فحص دون أي اتصال خارجي وتحقق ترخيص محلي |

## 9. سجل الأدلة والتحقق (نموذج قابل للتعبئة)

| الحقل | القيمة المطلوبة (لا تُختلق) |
|---|---|
| `release_id / code_commit_sha` | `NOT AVAILABLE FOR VERIFICATION` إلى حين إثباته |
| `build_artifact_hash` | `NOT AVAILABLE FOR VERIFICATION` |
| `environment / region / deployment_profile` | `NOT AVAILABLE FOR VERIFICATION` |
| `trial_or_paid_license_scope` | `NOT AVAILABLE FOR VERIFICATION` |
| `risk_methodology_approval` | `NOT AVAILABLE FOR VERIFICATION` |
| `policy_version_and_signoff` | `NOT AVAILABLE FOR VERIFICATION` |
| `model_and_provider_approval` | `NOT AVAILABLE FOR VERIFICATION` |
| `identity_and_role_matrix` | `NOT AVAILABLE FOR VERIFICATION` |
| `security_privacy_review` | `NOT AVAILABLE FOR VERIFICATION` |
| `QA_and_integrations_evidence` | `NOT AVAILABLE FOR VERIFICATION` |
| `risk_owner_final_decision` | `NOT AVAILABLE FOR VERIFICATION` |
| `customer_scope_and_limitations` | `NOT AVAILABLE FOR VERIFICATION` |

### Evidence manifest المطلوب عند التنفيذ

```yaml
assessment_evidence_manifest:
  document_id: AIGAS-RE-ACC-001
  release_id: null
  environment: null
  commit_sha: null
  methodology_version: null
  policy_version: null
  tenant_reference: null
  evidence_items:
    - acceptance_id: AC-RE-01
      status: NOT_VERIFIED
      evidence_ref: null
      reviewer_role: null
      reviewed_at: null
  security_signoff: null
  risk_owner_signoff: null
  release_decision: NO_GO_UNTIL_VERIFIED
```

## 10. بوابة المستندات والاعتماد النهائي

**لا يقبل الإطلاق** إلا بعد:

1. اكتمال المتطلبات الوظيفية الأساسية `RE-01` إلى `RE-05` وفق نطاق الإصدار المعلن؛ لا تخلط تحقق جزئي مع تحقيق كامل لـRE-02 الهجين.
2. المرور على 33 معيارًا، مع عدم وجود P0 Fail/Blocked/Not Verified في النطاق الذي يُسوّق كمتاح.
3. مراجعة أمن العزل والصلاحيات وخصوصية المورد وعدم التدريب واحتفاظ البيانات.
4. مراجعة منهج الاحتمال/الأثر/العتبات وحالات عدم اليقين من Risk Owner.
5. إثبات قابلية التتبع والتاريخ والتفسير وSoD والاعتراض؛ لا تُستخدم نتيجة LLM كتوقيع بشري.
6. الموافقة على العقد البرمجي الحقيقي وإصدار منشور، مع تغيير حالة `API-CONTRACT.yaml` بعد مراجعة المصدر لا من التخمين.
7. اعتماد الترخيص والقياس والتجربة إذا سُوق أي مسار تجريبي؛ وإلا يظل Trial Unavailable.
8. اعتماد Data Residency/Privacy والسياسات/الموردين والرسائل التسويقية.
9. اعتماد القرار من Product Owner وSecurity Lead وPrivacy/Legal وRisk Owner وOperations وCommercial حسب السلطة الفعلية.
10. إعلان نطاق التوافر والقيود فقط، وليس ادعاء امتثال أو دقة أو اكتشاف لا دليل لها.

## 11. Decision log — قالب مراجعة الإصدار

| Role | Name/identifier | Decision | Date | Evidence link |
|---|---|---|---|---|
| Product Owner | TBD | PENDING | — | — |
| Risk Owner | TBD | PENDING | — | — |
| Security Owner | TBD | PENDING | — | — |
| Privacy/Legal | TBD | PENDING | — | — |
| Platform/Operations | TBD | PENDING | — | — |
| Commercial/Trial Owner | TBD | PENDING | — | — |

**الحكم الحالي:** `NO-GO — NOT VERIFIED`. هذا حكم إثبات على المعلومات المتاحة، وليس تقريرًا عن عطل منتج قائم.

## 12. روابط المستندات

- `PRODUCT-SPEC.md` — تعريف ومجال ومستويات RE-01..RE-05.
- `FEATURE-STATUS.yaml` — لكل ميزة حالة تشغيل وحاجز ترقية للحالة WORKING.
- `PAGE-EXPERIENCE.md` — صفحة العرض التعليمية ولوحة المؤسسة المقترحة.
- `API-CONTRACT.yaml` — OpenAPI 3.1 تصميمي، غير منشور.
- `48H-TRIAL-SPEC.md` — 16 سيناريو PoV وحدود 48 ساعة.

لا يعد إنشاء حزمة المستندات أو مرور تحقق YAML **قبولًا لإطلاق المنتج**.
