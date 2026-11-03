# Runbook مفهومي — عقد الثقة بين منتجات AIGAS

> **الحالة:** `IMPLEMENTED_IN_SOURCE` / `NOT_RUNTIME_VERIFIED`
> **النطاق:** عقود داخلية بين `Kernel` و`Firewall` و`Ledger` و`Human Gate` و`Risk Engine` و`Secure Chat`
> **ليس:** اعتماد تشغيل، دليل عزل، اتفاق مستوى خدمة، أو إثبات نشر.
> **الملفات المرجعية:** `src/server/kernel/{events,contracts,access,service,policies}.mjs`، `src/server/ledger/writer.mjs`، `src/server/firewall/{guard,escalation,service}.mjs`.

## 1. القاعدة الحاكمة

كل منتج يعمل مستقلاً فوق `Kernel`. لا يجوز أن يصبح منتج مدفوع شرطًا لحماية أساسية أو تدقيق أساسي. المنتجات الاختيارية تُبلّغ عن حالتها (`available / not configured / degraded / blocked / access denied / expired / temporarily unavailable`) ولا تُترجم تلقائيًا إلى «غير مشترك» أو إلى فشل أمني في المنتج المستدعي.

- غياب `Ledger` التجاري لا يلغي `Kernel audit`.
- غياب `Risk Engine` لا يمنع ضوابط `Firewall` الأساسية.
- غياب تكامل `Human Gate` يوقف الإجراء الذي يشترط موافقة بشرية، ولا يتحول إلى سماح.
- `Secure Chat` لا يشترط ترخيص `Firewall` التجاري للحماية الأساسية.

## 2. غلاف الحدث الموحد — `aigas-product-event-v1`

الغلاف داخلي فقط، ولا يُستقبل من المتصفح. يُبنى في `src/server/kernel/events.mjs` ويُستهلك عبر `recordProductEvent` الموجود؛ لا يوجد Event Bus أو طابور جديد.

| الحقل | المصدر | القاعدة |
|---|---|---|
| `tenantId` | جلسة/عضوية موثقة | UUID وليس قيمة من جسم الطلب |
| `actorId` | التوكن الموثّق | UUID |
| `correlationId` | الخادم | UUID لكل دورة |
| `decisionId` | الخادم | مطابق للمرجع المحفوظ (`decision_ref`/`request_ref`/`asset_ref`/`assessment_ref`/`audit_ref`) |
| `policyVersion` | الخادم | نمط `[a-zA-Z0-9_.:-]{1,120}` |
| `source` | الخادم | قائمة `sourceTypes` في `ledger/core.mjs` |
| `action` | الخادم | رمز ثابت مثل `DECISION_RECORDED` أو `OUTCOME_RECORDED` |
| `idempotencyKey` | الخادم | نمط `[a-zA-Z0-9_.:-]{1,180}` |
| `kind` | الخادم | `DECISION` أو `OBSERVATION` أو `OUTCOME` |

قواعد إضافية:

1. حدث `OUTCOME` لا يُسجّل إلا بعد وقوع الأثر داخل نفس معاملة Postgres (`outcome_confirmed: true`). مثال: `human_gate.demo_note.completed` بعد انتقال الطلب إلى `EXECUTED`.
2. لا تُنسخ نصوص المحادثة أو الطلبات أو بيانات شخصية إلى الغلاف. الحقول المسموحة في `metadata_json` تبقى محكومة بقيد الجدول الحالي.
3. `decisionId` لا يطابق المرجع المحفوظ → `EVENT_REFERENCE_MISMATCH` وليس تسجيلًا جزئيًا.
4. إعادة استخدام مفتاح مختلف بمحتوى مختلف → `EVIDENCE_KEY_CONFLICT`، ولا تُعاد كتابة الدليل.
5. الترحيل `0022` (فهارس مرجع فريدة عالمية) **مسودة محلية غير مطبقة**؛ الكود يمنع المرجع العابر للمؤسسات قبل الكتابة، والفهرس يجعله قيدًا دائمًا بعد اعتماد المشغّل.

## 3. حدود القرار والتنفيذ

### Firewall → Human Gate

- `ESCALATE` لا يعتبر «موافقة» بأي حال.
- طلب المراجعة المقبول يجب أن يحمل ربطًا صريحًا: نفس `tenantId` و`decisionId` و`requestId` و`policyVersion`، وحالة `PENDING`.
- أي موافقة موردة من تكامل مستقبلي تُفحص مقابل `tenant_id` و`request_ref` و`policy_version` و`request_fingerprint` وصلاحية `expires_at` وحالة `ACTIVE`. عدم المطابقة → `HUMAN_APPROVAL_BINDING_INVALID`.
- حتى مع موافقة مربوطة، لا يمرر `Firewall` الطلب تلقائيًا: `HUMAN_APPROVAL_PRESENT_NOT_EXECUTED` لأن مسار تنفيذ الموافقة المعتمد غير مهيأ. هذا مقصود: الموافقة ليست تنفيذًا.
- سجل `Firewall` يسجّل `firewall.decision.recorded` فقط، ولا يسجّل نتيجة تنفيذ لم تحدث.

### Human Gate

- `APPROVED` ليست `EXECUTED`. الإذن (`grant`) مرتبط بالطلب والبصمة والنسخة السياسية ويُستهلك مرة واحدة.
- `human_gate.demo_note.completed` لا يُكتب إلا بعد انتقال `EXECUTED` الفعلي.
- غير ذلك يُقيَّد كـ`kernel.audit.recorded` مع `audit_ref`، حتى يبقى التدقيق الأساسي متاحًا دون Ledger.

### Ledger

- `Ledger` لا يقرر السماح؛ هو مرآة أدلة اختيارية أو إلزامية بحسب `aigas_ld_evidence_requirements`.
- إذا كان الدليل إلزاميًا وتعذر `Ledger` → `MANDATORY_EVIDENCE_UNAVAILABLE` و503، وتُلغى العملية.
- إذا كان اختياريًا → `recorded:false` مع `dependencyStatus` و`dependencyCode`، ولا يُعلن نجاح دليل.

### Risk Engine وSecure Chat

- لا يُستدعى `Risk Engine` في مسار `Firewall` الأساسي؛ غيابه لا يغيّر قرار السياسة.
- `Secure Chat` يستخدم `Kernel audit` فقط، ولا يحتاج `Ledger` أو `Firewall` التجاري.

## 4. نطاق المؤسسة والمراجع الثابتة

1. `tenantGuard` يسبق أي استعلام مؤسسي؛ `workspace` مجرد مُحدِّد ضمن عضويات المستدعي، وليس تصريحًا.
2. `setTenantScope` معامَلي (`set_config(..., true)`) بعد التحقق من العضوية.
3. `recordProductEvent` يتحقق من العضوية قبل أي قراءة مؤسسية.
4. المراجع التي يرسلها العميل (Firewall `request_id`، Secure Chat `requestId`) تُفحص ضد مؤسسة أخرى عبر `assertReferenceTenant`؛ المرجع الأجنبي → `REFERENCE_TENANT_CONFLICT` 409.
5. البصمة في `Firewall` تشمل المؤسسة والفاعل ومعرّف الطلب ونسخة السياسة والنتيجة، فلا تصلح إعادة استخدامها في مؤسسة أخرى.

## 5. إصدارات العقود وأكواد الأخطاء

- رأس HTTP: `X-AIGAS-Contract: aigas-http-v1`.
- جسم الخطأ: `{ code, message, contract: { version: 'aigas-http-v1', error: 'aigas-error-v1' }, dependencyStatus? }`.
- الحقول المضافة متوافقة رجعيًا؛ إزالة حقل أو تغيير معناه تحتاج إصدارًا جديدًا وسجل تغيير.
- `contract_version` مضاف إلى استجابات المنتجات الرئيسية، مع بقاء `binding_version` و`chain_version` و`schema_version` الخاصة بكل مجال.
- أكواد مستقرة جديدة في هذه الحزمة: `REFERENCE_TENANT_CONFLICT`، `HUMAN_GATE_REVIEW_UNBOUND`، `HUMAN_APPROVAL_BINDING_INVALID`، `HUMAN_APPROVAL_PRESENT_NOT_EXECUTED`، `EVENT_REFERENCE_MISMATCH`، `OUTCOME_NOT_CONFIRMED`، `INVALID_EVENT_CONTEXT`.

## 6. Failure Mode Matrix المختصرة

| الحالة | الاستجابة | هل تُعلن نجاحًا؟ |
|---|---|---|
| سياسة Kernel غير متاحة أو ناقصة | 503 + `KERNEL_POLICY_*` | لا |
| `Ledger` اختياري غير مهيأ | العملية تكمل، `recorded:false` | لا يُدّعى دليل |
| `Ledger` إلزامي غير متاح | 503 + `MANDATORY_EVIDENCE_UNAVAILABLE` | لا |
| `Human Gate` غير مهيأ لـ`ESCALATE` | 409 + `HUMAN_GATE_NOT_CONFIGURED` | لا، ولا إرسال لمزود |
| موافقة غير مربوطة | 409/503 + `HUMAN_APPROVAL_*` | لا |
| مرجع من مؤسسة أخرى | 409 + `REFERENCE_TENANT_CONFLICT` | لا |
| معاملات متعددة الخطوات تفشل | `ROLLBACK` كامل | لا |
| `Risk Engine` غير متاح | لا يغيّر الضوابط الأساسية | لا يُدّعى تقييم |

## 7. عوائق الاعتماد قبل أي تشغيل

1. تطبيق الترحيلات المعتمدة على بيئة معتمدة (بما فيها `0013/0014/0016/0017` و`0022` بعد موافقة بشرية).
2. اعتماد مزود/نموذج/منطقة/No-Training ومفتاح خادمي قبل أي إرسال.
3. وجود مستخدم/جلسة/عضوية/إتاحة منتج متحققة، ومراجعة RLS/Grants.
4. تكامل `Human Gate` مع `Firewall` يحتاج قرارًا معماريًا وعقد عملية معتمدًا؛ السجل الحالي فارغ.
5. أي فحص تشغيلي أو عزل أو أداء أو نشر: `NOT_VERIFIED` حتى يوجد دليل مستقل.
