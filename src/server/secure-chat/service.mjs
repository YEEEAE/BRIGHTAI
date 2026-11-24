import { requireProductAccess } from '../kernel/access.mjs';
import { authenticate } from '../kernel/auth.mjs';
import { audit, tenantGuard } from '../kernel/service.mjs';
import { recordKernelAuditEvidence } from '../ledger/writer.mjs';
import { transaction } from '../kernel/db.mjs';
import { KernelError, dependencyStatusForError } from '../kernel/core.mjs';
import { contractHeaders, errorBody, HTTP_CONTRACT_VERSION } from '../kernel/contracts.mjs';
import { env } from '../kernel/env.mjs';
import { captureProductEvent, captureServerFailure } from '../observability/index.mjs';
import { modelApprovalState, tenantModels, listApprovedModels } from './models.mjs';
import { complete, providerConfiguration, providerState } from './adapter.mjs';
import { INPUT_POLICY, protectText, usagePolicy, usagePolicyStatus } from './policy.mjs';
import { reserve, settleUnknown, cancel, cancellationRequested, requireChatStorage } from './requests.mjs';
import { uuid } from '../kernel/http.mjs';
import { authorizeChatContext, chatPolicyContext, protectContext } from './integration.mjs';

export const HARD_MAX_MESSAGE_LENGTH = 4000;
export function requireChatPolicyIntegration(context) {
  if (!context) throw new KernelError(503, 'CHAT_POLICY_INTEGRATION_REQUIRED', 'يلزم سياق مؤسسة وطلب وسياسة قبل الإرسال.', 'not configured');
  const { identity, tenantId, requestId, model, messages } = context;
  return transaction(async db => {
    await requireProductAccess(db, identity, tenantId, 'secure-chat');
    await db.query('SELECT id FROM public.aigas_tenants WHERE id=$1 FOR UPDATE', [tenantId]);
    return authorizeChatContext(db, identity, tenantId, requestId, model, messages);
  }).then(result => { if (result.error) throw result.error; return result; });
}
// Apply the exact input baseline and Firewall semantics to an untrusted reply.
export function protectReply(reply, rules) {
  try {
    const text = protectContext([{ role: 'assistant', content: reply }], rules)[0].content;
    return { text, redacted: text !== reply };
  } catch (error) {
    if (error instanceof KernelError) throw new KernelError(error.status, error.code, 'حُجب رد النموذج بفحص الحماية؛ لم يُعرض المحتوى. قد يكون المزود استهلك الطلب.');
    throw error;
  }
}
async function protectModelReply(identity, tenantId, model, reply) {
  return transaction(async db => {
    await requireProductAccess(db, identity, tenantId, 'secure-chat');
    await db.query('SELECT id FROM public.aigas_tenants WHERE id=$1 FOR UPDATE', [tenantId]);
    const { ready, rules } = await chatPolicyContext(db, identity, tenantId, model);
    if (!ready) throw new KernelError(403, 'CHAT_POLICY_DENIED', 'حجبت سياسة المؤسسة إتاحة رد النموذج.');
    return protectReply(reply, rules);
  });
}
export function configuredMessageLimit(raw = env('AIGAS_SC_MAX_MESSAGE_CHARS')) {
  if (typeof raw !== 'string' || !/^\d{1,4}$/.test(raw)) return HARD_MAX_MESSAGE_LENGTH;
  const value = Number(raw);
  return value >= 1 && value <= HARD_MAX_MESSAGE_LENGTH ? value : HARD_MAX_MESSAGE_LENGTH;
}
async function accessContext(request, operation = null) {
  const identity = await authenticate(request);
  // Membership discovery must run inside a transaction so the transaction-local actor scope
  // is visible to the query and is discarded before the connection is pooled.
  const { tenant } = await transaction(db => tenantGuard(identity, new URL(request.url).searchParams.get('workspace'), db));
  if (!tenant) throw new KernelError(403, 'MEMBERSHIP_REQUIRED', 'يلزم الانضمام إلى مؤسسة قبل استخدام Secure Chat.');
  await transaction(db => requireProductAccess(db, identity, tenant.tenant_id, 'secure-chat', operation));
  return { identity, tenant };
}

// Metadata-only audit. No message text, prompt, model output or user identity is
// added here; the Kernel audit writer only accepts correlation/policy keys.
async function auditBlocked(identity, tenantId, action, requestId) {
  await transaction(async db => {
    await requireProductAccess(db, identity, tenantId, 'secure-chat');
    const auditId = await audit(db, identity, tenantId, action, {
      correlationId: requestId,
      policyVersion: INPUT_POLICY.version,
      idempotencyKey: `secure-chat:${requestId}:${action.split('.').pop()}`,
    });
    await recordKernelAuditEvidence(db, identity, tenantId, {
      auditId, correlationId: requestId, policyVersion: INPUT_POLICY.version, action: `kernel.${action}`,
    });
  });
}

export async function listModels(request) {
  const { identity, tenant } = await accessContext(request, 'browse');
  const approvedModels = listApprovedModels(tenant.tenant_id);
  const states = tenantModels(tenant.tenant_id).map(model => {
    const approval = modelApprovalState(model);
    return { model, state: approvedModels.includes(model) ? providerState(model) : approval === 'EXPIRED' ? approval : 'NOT_APPROVED' };
  });
  const ready = states.filter(item => item.state === 'READY');
  const quota = usagePolicyStatus();
  // A configured quota policy is only usable after the reviewed 0016 function
  // exists. Probing is read-only and failure is treated as not ready, never open.
  let usageQuotaReady = false;
  if (ready.length > 0 && quota.approved) {
    try {
      await transaction(requireChatStorage);
      usageQuotaReady = true;
    } catch { usageQuotaReady = false; }
  }
  // An approved model without an approved quota is not sendable: it would meter
  // nothing. The gate stays closed until both are configured and reviewed.
  const policyReady = [];
  if (usageQuotaReady && quota.approved) {
    for (const { model } of ready) {
      try {
        const usable = await transaction(async db => {
          // Browsing alone never grants sending (including exploration grants).
          await requireProductAccess(db, identity, tenant.tenant_id, 'secure-chat');
          return (await chatPolicyContext(db, identity, tenant.tenant_id, model)).ready;
        });
        if (usable) policyReady.push(model);
      } catch { /* A dependency or authorization failure closes sending only. */ }
    }
  }
  // Eligibility is not evidence of an authorized model completion.
  const sendable = policyReady.length > 0;
  const models = policyReady.map(model => ({ id: model.id, label: model.label, region: model.region, ready: true, state: 'ELIGIBLE' }));
  const available = sendable;
  const allExpired = states.length > 0 && states.every(item => item.state === 'EXPIRED');
  const providerUnavailable = ready.length === 0 && states.some(item => item.state === 'PROVIDER_UNAVAILABLE');
  const dependencyStatus = available ? 'available'
    : providerUnavailable ? 'temporarily unavailable'
    : states.length === 0 ? 'not configured'
      : ready.length === 0 ? (allExpired ? 'expired' : 'not configured')
        : 'not configured';
  const availabilityCode = available ? null
    : states.length === 0 ? 'NO_APPROVED_MODEL'
      : providerUnavailable ? 'PROVIDER_UNAVAILABLE'
    : ready.length === 0 ? (allExpired ? 'MODEL_APPROVAL_EXPIRED'
        : states.some(item => item.state === 'PROVIDER_NOT_CONFIGURED') ? 'PROVIDER_NOT_CONFIGURED'
          : 'NO_APPROVED_MODEL')
        : !quota.approved ? quota.code
          : !usageQuotaReady ? 'USAGE_POLICY_NOT_READY' : 'CHAT_POLICY_INTEGRATION_REQUIRED';
  const unavailableMessage = availabilityCode === 'PROVIDER_NOT_CONFIGURED'
    ? 'الموصل إلى المزود المعتمد غير مهيأ على الخادم؛ لم يُرسل أي محتوى.'
    : availabilityCode === 'PROVIDER_UNAVAILABLE'
      ? 'الموصل غير جاهز حاليًا؛ لم يُرسل أي محتوى.'
    : availabilityCode === 'MODEL_APPROVAL_EXPIRED'
      ? 'انتهت صلاحية اعتماد النموذج المسجل؛ يلزم اعتماد جديد قبل الإرسال.'
      : availabilityCode === 'USAGE_POLICY_NOT_CONFIGURED'
        ? 'لا توجد حصة استخدام معتمدة لهذا المنتج؛ الإرسال موقوف ولم يُرسل أي محتوى.'
        : availabilityCode === 'USAGE_POLICY_INVALID'
          ? 'إعداد حصة الاستخدام غير صالح؛ الإرسال موقوف ولم يُرسل أي محتوى.'
          : availabilityCode === 'USAGE_POLICY_NOT_READY'
            ? 'سياسة الحصة معتمدة لكن مكوّن قياسها غير مهيأ على قاعدة البيانات؛ الإرسال موقوف.'
            : availabilityCode === 'CHAT_POLICY_INTEGRATION_REQUIRED'
              ? 'تكامل سياسات Kernel وFirewall للمحادثة غير مهيأ؛ الإرسال موقوف ولم يُرسل أي محتوى.'
              : 'لا يوجد نموذج معتمد ومهيأ لهذه المؤسسة؛ لم يُرسل أي محتوى إلى مزود AI.';
  return {
    liveSend: { status: 'NOT_VERIFIED', completionVerified: false },
    models, available, dependencyStatus, availabilityCode, tenant: { id: tenant.tenant_id, name: tenant.name },
    conversationMode: 'EPHEMERAL_TAB_ONLY',
    retention: { enabled: false, contentStored: false, message: 'تحتفظ هذه الصفحة بالمسودة مؤقتًا. يحفظ تطبيق BRIGHTAI بيانات الطلب الوصفية ويُخضع معالجة المزود لشروط الاعتماد الخاصة به.' },
    // Explicit capability surface for the client and reviewers. All false values
    // are enforced by the absence of routes and by the request-body whitelist.
    capabilities: { sharing: false, export: false, fileUpload: false, rag: false, savedTranscripts: false, adminContentAccess: false },
    contentVisibility: 'PARTICIPANT_ONLY',
    policy: { version: INPUT_POLICY.version, syntheticOnly: true, firewallLicenceRequired: false, message: 'نصوص اصطناعية فقط. حماية خروج أساسية محدودة تعمل دون رخصة Firewall وتحجب الأسرار وتنقح بعض بيانات الاتصال والهوية؛ لا تضمن كشف جميع البيانات الحساسة.' },
    usage: { cost: 'غير متاح', tokens: null, quotaStatus: quota.code ?? 'APPROVED', limits: quota.policy, configuredMessageCharacters: configuredMessageLimit() },
    message: available ? 'النماذج المعتمدة والمهيأة متاحة للنصوص الاصطناعية فقط؛ كل إرسال يخضع لفحص الخادم.' : unavailableMessage,
    contract_version: HTTP_CONTRACT_VERSION,
  };
}

export function validateMessages(message, history, model) {
  const maxLength = configuredMessageLimit();
  if (typeof message !== 'string' || !message.trim() || Array.from(message).length > maxLength) throw new KernelError(400,'INVALID_MESSAGE',`اكتب رسالة من حرف واحد إلى ${maxLength} حرفًا.`);
  if (!Array.isArray(history) || history.length > 12 || history.length % 2) throw new KernelError(400,'INVALID_HISTORY','سياق المحادثة أكبر من الحد التقني أو غير صالح؛ ابدأ محادثة جديدة.');
  let total = Array.from(message).length;
  const messages = history.map((item,index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item) || Object.keys(item).some(key => !['role','content'].includes(key)) || item.role !== (index % 2 ? 'assistant' : 'user') || typeof item.content !== 'string' || !item.content.trim() || Array.from(item.content).length > 16000) throw new KernelError(400,'INVALID_HISTORY','سياق المحادثة غير صالح.');
    total += Array.from(item.content).length;
    return Object.freeze({ role: item.role, content: item.content });
  });
  if (total > 24000) throw new KernelError(400,'CONTEXT_LIMIT','بلغت المحادثة حد السياق التقني؛ ابدأ محادثة جديدة.');
  messages.push(Object.freeze({ role:'user', content:message }));
  // Block secrets early, while retaining the original in memory for tenant
  // restrictions that must be checked before baseline normalization.
  const safe = messages.map(item => protectText(item.content).text);
  const encoder = new TextEncoder();
  const inputBytes = safe.reduce((sum, content) => sum + encoder.encode(content).byteLength, 0);
  if (inputBytes > model.maxInputBytes || inputBytes + model.inputOverheadTokens > model.maxRequestTokens - model.maxOutputTokens) {
    throw new KernelError(413,'CONTEXT_LIMIT','تجاوز سياق الرسالة حد الإدخال المعتمد لهذا النموذج؛ لم يُرسل الطلب.');
  }
  return Object.freeze(messages);
}

export async function cancelMessage(request, requestId) {
  const { identity,tenant } = await accessContext(request);
  return cancel(identity,tenant.tenant_id,uuid(requestId));
}

export async function sendMessage(request, body) {
  const { identity,tenant } = await accessContext(request);
  const requestId = uuid(body.requestId);
  if (body.syntheticAcknowledged !== true) throw new KernelError(400,'SYNTHETIC_DATA_REQUIRED','أكد أن النص اصطناعي ولا يتضمن بيانات عميل حقيقية.');
  if (typeof body.modelId !== 'string' || body.modelId.length > 120) throw new KernelError(400,'INVALID_MODEL','اختيار النموذج غير صالح.');
  const model = listApprovedModels(tenant.tenant_id).find(entry => entry.id === body.modelId);
  if (!model) {
    await auditBlocked(identity,tenant.tenant_id,'secure_chat.blocked_no_approved_model',requestId);
    const expired = tenantModels(tenant.tenant_id).some(entry => entry.id === body.modelId && modelApprovalState(entry) === 'EXPIRED');
    if (expired) throw new KernelError(503, 'MODEL_APPROVAL_EXPIRED', 'انتهت صلاحية اعتماد النموذج؛ لم يُرسل المحتوى.', 'expired');
    throw new KernelError(503,'NO_APPROVED_MODEL','لا يوجد نموذج معتمد؛ لم يُرسل النص إلى أي مزود.','not configured');
  }
  try {
    providerConfiguration(model);
  } catch (error) {
    // The reviewed entry may exist while the server-side connector is absent.
    // Either way nothing leaves the process.
    const action = error?.code === 'NO_APPROVED_MODEL' ? 'secure_chat.blocked_no_approved_model'
      : error?.code === 'PROVIDER_NOT_CONFIGURED' ? 'secure_chat.blocked_provider_not_configured'
        : 'secure_chat.blocked_provider_unavailable';
    await auditBlocked(identity, tenant.tenant_id, action, requestId);
    throw error;
  }
  let validatedInput;
  try {
    validatedInput = validateMessages(body.message,body.history ?? [],model);
  } catch (error) {
    if (error instanceof KernelError && error.code === 'SENSITIVE_CONTENT_BLOCKED') {
      await auditBlocked(identity,tenant.tenant_id,'secure_chat.blocked_sensitive_content',requestId);
    }
    throw error;
  }
  await reserve(identity,tenant.tenant_id,requestId,model);
  const controller = new AbortController();
  let timeout = false, polling = false, watcherFailed = false;
  const abort = () => controller.abort();
  request.signal.addEventListener('abort',abort,{ once:true });
  const deadline = setTimeout(() => { timeout=true; abort(); },model.timeoutMs);
  const watcher = setInterval(async () => {
    if (polling || controller.signal.aborted) return;
    polling=true;
    try { usagePolicy(); if (await cancellationRequested(identity,tenant.tenant_id,requestId)) abort(); }
    catch { watcherFailed=true; abort(); }
    finally { polling=false; }
  },1000);
  let usage = null, dispatched = false, settled = false;
  try {
    if (request.signal.aborted || await cancellationRequested(identity,tenant.tenant_id,requestId)) abort();
    controller.signal.throwIfAborted();
    // Revalidate approval/access immediately before crossing the trust boundary.
    await accessContext(request);
    controller.signal.throwIfAborted();
    // Final egress check: the exact bytes that leave the process are re-protected
    // and frozen. No Firewall licence is consulted, so baseline protection always runs.
    const { outbound } = await requireChatPolicyIntegration({ identity, tenantId: tenant.tenant_id, requestId, model, messages: validatedInput });
    // Replacement markers can grow the byte count. Recheck the exact final
    // context against the model's reviewed framing and reservation ceiling.
    validateMessages(outbound.at(-1).content, outbound.slice(0,-1), model);
    controller.signal.throwIfAborted();
    if (await cancellationRequested(identity,tenant.tenant_id,requestId)) abort();
    controller.signal.throwIfAborted();
    usagePolicy(); // Recheck the emergency quota gate immediately before egress.
    dispatched=true;
    const result = await complete(model,outbound,controller.signal);
    usage=result.usage;
    controller.signal.throwIfAborted();
    let output;
    try { output = await protectModelReply(identity, tenant.tenant_id, model, result.reply); }
    catch (error) {
      await auditBlocked(identity, tenant.tenant_id, 'secure_chat.output.blocked', requestId);
      throw error;
    }
    const current = await accessContext(request);
    if (current.identity.userId !== identity.userId || current.tenant.tenant_id !== tenant.tenant_id ||
        modelApprovalState(model) !== 'APPROVED') {
      throw new KernelError(403, 'CHAT_POLICY_DENIED', 'تعذر تأكيد صلاحية إتاحة رد النموذج.');
    }
    // No streaming: the entire reply is checked before any content is disclosed.
    const state = await settleUnknown(identity,tenant.tenant_id,requestId,'SUCCEEDED',usage);
    settled=true;
    if (state === 'CANCELLED' || controller.signal.aborted) throw new KernelError(409,'REQUEST_CANCELLED','أُوقفت إتاحة الرد؛ قد يكون المزود استهلك الطلب بالفعل.');
    return { requestId, reply:output.text, submittedText:outbound.at(-1).content, modelId:model.id, usage, redacted:output.redacted || outbound.some((item,index) => item.content !== validatedInput[index].content), saved:false, contentStored:false, message:'وصل رد مفحوص أوليًا. يحتفظ التطبيق ببيانات الطلب الوصفية.' };
  } catch (error) {
    if (!settled) {
      // Unknown usage remains conservatively reserved. Never claim zero cost
      // for a timeout, network failure, cancellation or unavailable settlement.
      await settleUnknown(identity,tenant.tenant_id,requestId,controller.signal.aborted ? 'CANCELLED' : dispatched ? 'UNKNOWN' : 'FAILED',usage);
    }
    if (watcherFailed) throw new KernelError(503,'GUARD_UNAVAILABLE','تعذر استمرار التحقق من الوصول؛ أوقف الطلب. قد يكون المزود عالجه بالفعل.');
    if (timeout) throw new KernelError(504,'PROVIDER_TIMEOUT','انتهت مهلة المزود؛ قد يكون استهلاك حدث. لا تتم إعادة الإرسال تلقائيًا.');
    if (controller.signal.aborted) throw new KernelError(409,'REQUEST_CANCELLED','أُوقف انتظار الرد وطُلب إلغاء الاتصال؛ لا يؤكد ذلك انعدام استهلاك المزود.');
    if (error instanceof KernelError) throw error;
    throw new KernelError(502,'PROVIDER_UNAVAILABLE','تعذر تأكيد رد مكتمل من المزود. لا تبديل لمزود آخر ولا إعادة إرسال تلقائية؛ قد يكون الاستهلاك حدث.');
  } finally {
    clearTimeout(deadline); clearInterval(watcher); request.signal.removeEventListener('abort',abort);
  }
}
// Kept for existing server imports; still uses the complete guarded send path.
export async function rejectMessage(request, modelId, message) {
  return sendMessage(request,{modelId,message,syntheticAcknowledged:false});
}
export const privateHeaders = contractHeaders({ 'Cache-Control':'private, no-store', 'X-Robots-Tag':'noindex, nofollow', 'X-Content-Type-Options':'nosniff', 'Referrer-Policy':'no-referrer', Vary:'Authorization' });
export function errorResponse(error, operation = 'POST') {
  const known=error instanceof KernelError;
  const code=known ? error.code : ['42P01','42703','42883'].includes(error?.code) ? 'SECURE_CHAT_SCHEMA_MISSING' : error?.code==='42501' ? 'SECURE_CHAT_DB_PRIVILEGE' : 'SECURE_CHAT_UNAVAILABLE';
  const status=known ? error.status : 503;
  // Quota exhaustion is a product signal, not an error: code only, no user,
  // tenant, message text, model ID, or token counts.
  if(code==='USAGE_LIMIT_REACHED') void captureProductEvent('quota_exhausted',{product:'secure-chat'});
  const message=known ? error.message : code==='SECURE_CHAT_SCHEMA_MISSING' ? 'يلزم تجهيز مخطط Secure Chat على بيئة تطوير معتمدة. لم يُؤكد اكتمال الطلب.' : code==='SECURE_CHAT_DB_PRIVILEGE' ? 'صلاحيات قاعدة البيانات غير مهيأة. لم يُؤكد اكتمال الطلب.' : 'تعذر إكمال الطلب؛ لا تُعد إرساله تلقائيًا. لم يُؤكد استهلاك المزود أو اكتمال الرد.';
  const dependencyStatus=known?dependencyStatusForError(error):code==='SECURE_CHAT_SCHEMA_MISSING'?'not configured':code==='SECURE_CHAT_DB_PRIVILEGE'?'access denied':'temporarily unavailable';
  void captureServerFailure(null, { surface: 'secure-chat', code, status, pathname: '/app/api/secure-chat', dependency: dependencyStatus, operation });
  const responseHeaders=known&&error.status===429?{...privateHeaders,'Retry-After':'60'}:privateHeaders;
  return Response.json(errorBody({code,message,dependencyStatus}),{status,headers:responseHeaders});
}
