import { approvedProvider, PROVIDER_TIMEOUT_MS } from './provider.mjs';
import { policyReference, decisionFingerprint } from './binding.mjs';
import { reviewBindingVersion, verifyHumanApproval } from './escalation.mjs';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fingerprint = /^[0-9a-f]{64}$/;
const policyVersionFormat = /^[a-zA-Z0-9_.:-]{1,120}$/;

// Called only after the mandatory policy decision AND Kernel audit COMMIT.
// The HTTP layer never receives the server-only forwarding text. There is no
// client decision token, arbitrary URL, alternate prompt or provider override.
// Fail-closed order: Kernel ALLOW + durable binding are required before any
// provider lookup, and only ALLOW/REDACT may cross the provider boundary.
export async function enforceDecision({ decision, tenantId, actorUserId, requestId, policyVersion, requestFingerprint, forwardText, kernelPolicy, escalation }) {
  const base = {
    decision,
    policy: kernelPolicy ? { decision: kernelPolicy.decision, action: kernelPolicy.action ?? null, reason: kernelPolicy.reason, obligations: kernelPolicy.obligations ?? [], mandatory: kernelPolicy.mandatory === true, policies: kernelPolicy.policies ?? [], warnings: kernelPolicy.warnings ?? [] } : null,
    request_id: requestId ?? null,
    policy_version: policyVersion ?? null,
    request_fingerprint: requestFingerprint ?? null,
    persisted: true, external_action_executed: false, execution_status: 'NOT_EXECUTED',
  };
  // DENY is the final state; nothing downstream may soften it.
  if (decision.action === 'DENY') return { ...base, httpStatus: 403, code: 'POLICY_BLOCKED', message: 'حُجب الطلب قبل أي استدعاء لمزود AI.' };
  // A human decision satisfies REQUEST_APPROVAL only. It never lifts a Kernel block, so
  // every remaining path (including ESCALATE) requires a stored Kernel ALLOW first.
  if (!kernelPolicy || kernelPolicy.decision !== 'ALLOW') {
    return { ...base, httpStatus: 409, code: 'KERNEL_POLICY_REQUIRED', message: 'لا يوجد قرار Kernel ALLOW صالح لهذه العملية؛ لم يُرسل الطلب ولم يُنشأ طلب مراجعة.' };
  }
  // ESCALATE needs an independent human decision. A review request may exist only
  // when an approved server integration is configured; otherwise this stops here.
  // In both cases nothing has been sent to a provider and nothing will be.
  if (decision.action === 'ESCALATE') {
    // A review request is accepted only when the server-side integration says it
    // belongs to this decision, tenant, request UUID and policy version. A review
    // for another cycle is not evidence of approval for this one.
    const binding = escalation?.requested === true ? escalation.binding : null;
    const reviewBindingValid = binding?.version === reviewBindingVersion
      && binding.tenantId === tenantId
      && binding.decisionId === decision.id
      && binding.requestId === requestId
      && binding.policyVersion === policyVersion
      && escalation.review?.subject_ref === decision.id
      && escalation.review?.policy_version === policyVersion;
    if (escalation?.requested === true && !reviewBindingValid) {
      return { ...base, httpStatus: 503, code: 'HUMAN_GATE_REVIEW_UNBOUND',
        execution_status: 'BLOCKED', blocked_reason: 'REVIEW_BINDING_MISMATCH', review_required: true,
        integration: { code: 'HUMAN_GATE_CONFIGURED', configured: true, operation_type: escalation.operation_type ?? null },
        message: 'طلب المراجعة لا يطابق هذا القرار أو نسخته السياسية؛ لم يُرسل الطلب إلى أي مزود ولم يُعتمد كموافقة.' };
    }
    // Even a supplied approval is only usable if it is bound to this exact request,
    // policy version, fingerprint and tenant and is still active. A mismatch is a
    // refusal, never a silent allow.
    const approval = verifyHumanApproval(escalation, { tenantId, requestId, policyVersion, requestFingerprint });
    if (approval.state === 'INVALID') {
      return { ...base, httpStatus: 409, code: 'HUMAN_APPROVAL_BINDING_INVALID',
        execution_status: 'BLOCKED', blocked_reason: approval.reason, approval_bound: false,
        message: 'الموافقة البشرية لا تطابق هذا الطلب أو انتهت أو استُخدمت مسبقًا؛ لم يُرسل الطلب إلى أي مزود.' };
    }
    if (approval.state === 'BOUND') {
      // This route has no approved integration to execute an approved human action.
      // Returning success or forwarding here would turn an approval into an execution.
      return { ...base, httpStatus: 409, code: 'HUMAN_APPROVAL_PRESENT_NOT_EXECUTED',
        execution_status: 'BLOCKED', blocked_reason: 'EXECUTION_INTEGRATION_NOT_CONFIGURED',
        approval_bound: true, review_required: false,
        message: 'الموافقة البشرية مربوطة بهذا الطلب، لكن مسار تنفيذ الموافقة المعتمد غير مهيأ؛ لم يُرسل الطلب إلى أي مزود.' };
    }
    if (escalation?.requested === true && escalation.review) {
      return { ...base, httpStatus: 202, code: 'REVIEW_PENDING', dependencyStatus: 'available', review_required: true,
        review: escalation.review, integration: { code: escalation.code, configured: true, operation_type: escalation.operation_type },
        message: 'أُنشئ طلب مراجعة بشرية معلق. لم يُرسل الطلب إلى أي مزود، ولن يُرسل قبل اعتماد مستقل يعيد التحقق من الربط.' };
    }
    return { ...base, httpStatus: 409, code: 'HUMAN_GATE_NOT_CONFIGURED', dependencyStatus: escalation?.dependencyStatus ?? 'not configured', review_required: true,
      integration: escalation?.configured === false ? { code: escalation.code, configured: false, reason: escalation.reason ?? null } : { code: 'HUMAN_GATE_NOT_CONFIGURED', configured: false, reason: 'NO_APPROVED_REVIEW_INTEGRATION' },
      message: 'القرار يتطلب موافقة بشرية، وتكامل Human Gate غير مهيأ لهذه النسخة؛ لم يُنشأ طلب ولم يُرسل الطلب إلى أي مزود.' };
  }
  // WARN is a conditional state, never an unconditional allow. Without an
  // approved warning policy the guard refuses to forward it.
  if (decision.action === 'WARN') {
    return { ...base, httpStatus: 409, code: 'WARNING_NOT_FORWARDED',
      message: 'سجّل الفحص تحذيرًا سياسيًا؛ التحذير لا يسمح بالتمرير التلقائي، لذلك لم يُرسل الطلب.' };
  }
  if (!['ALLOW', 'REDACT'].includes(decision.action) || typeof forwardText !== 'string' || !forwardText.length) {
    return { ...base, httpStatus: 503, code: 'INVALID_GUARD_DECISION', message: 'تعذر تطبيق القرار؛ لم يُرسل الطلب.' };
  }
  // The early Kernel check above already covers this path; the assertion stays as
  // defense in depth for a future caller that changes the order.
  if (!kernelPolicy || kernelPolicy.decision !== 'ALLOW') {
    return { ...base, httpStatus: 409, code: 'KERNEL_POLICY_REQUIRED', message: 'لا يوجد قرار Kernel ALLOW صالح لهذه العملية؛ لم يُرسل الطلب.' };
  }
  // The durable decision must carry an intact tenant/policy/request binding.
  // Recompute both the Kernel policy reference and the fingerprint from the actual
  // policy evidence/outcome: a mismatch is a server integrity failure, not an allow.
  if (!uuid.test(tenantId ?? '') || !uuid.test(actorUserId ?? '') || !uuid.test(requestId ?? '')
    || !policyVersionFormat.test(policyVersion ?? '') || !fingerprint.test(requestFingerprint ?? '')) {
    return { ...base, httpStatus: 503, code: 'EXECUTION_BINDING_REQUIRED', message: 'تعذر التحقق من ربط القرار بالطلب والنسخة السياسية؛ لم يُرسل الطلب.' };
  }
  const expectedPolicy = policyReference(kernelPolicy);
  const expectedFingerprint = decisionFingerprint({
    tenantId, actorUserId, requestId, policyVersion: expectedPolicy, enforced: true,
    result: { action: decision.action, reason: decision.reason, rule_id: decision.rule_id ?? null, rule_version: decision.rule_version ?? null },
  });
  if (policyVersion !== expectedPolicy || requestFingerprint !== expectedFingerprint) {
    return { ...base, httpStatus: 503, code: 'EXECUTION_BINDING_MISMATCH', message: 'بصمة القرار أو نسخة السياسة لا تطابق الطلب المحفوظ؛ لم يُرسل الطلب.' };
  }
  const provider = approvedProvider(tenantId);
  if (!provider) return { ...base, httpStatus: 503, code: 'PROVIDER_NOT_CONFIGURED', message: 'حُفظ قرار السياسة، لكن لا توجد جهة AI معتمدة ومهيأة لهذه المؤسسة؛ لم يُرسل الطلب.' };
  const controller = new AbortController();
  let timer;
  try {
    // Only evaluated output is available to the adapter, never the raw request.
    // No automatic retries or fallback to another provider.
    const deadline = new Promise((_, reject) => {
      timer = setTimeout(() => { controller.abort(); reject(new Error('PROVIDER_TIMEOUT')); }, PROVIDER_TIMEOUT_MS);
    });
    const output = await Promise.race([provider.generate({ text: forwardText, signal: controller.signal }), deadline]);
    if (typeof output !== 'string' || output.length > 16000) throw new Error('INVALID_PROVIDER_RESPONSE');
    return { ...base, external_action_executed: true,
      execution_status: decision.action === 'REDACT' ? 'REDACTED_AND_EXECUTED' : 'EXECUTED',
      response_text: output, httpStatus: 200 };
  } catch {
    // A timeout cannot prove that the provider did not receive the request.
    return { ...base, external_action_executed: null, execution_status: 'UNKNOWN', httpStatus: 503,
      code: 'PROVIDER_UNAVAILABLE', message: 'تعذر تأكيد نتيجة المزود؛ قد يكون الطلب وصل. لا تعِد الإرسال تلقائيًا.' };
  } finally { clearTimeout(timer); }
}
