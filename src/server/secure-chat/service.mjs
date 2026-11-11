import { requireProductAccess } from '../kernel/access.mjs';
import { authenticate } from '../kernel/auth.mjs';
import { audit, tenantGuard } from '../kernel/service.mjs';
import { transaction } from '../kernel/db.mjs';
import { KernelError, dependencyStatusForError } from '../kernel/core.mjs';
import { contractHeaders, errorBody, HTTP_CONTRACT_VERSION } from '../kernel/contracts.mjs';
import { env } from '../kernel/env.mjs';
import { captureProductEvent, captureServerFailure } from '../observability/index.mjs';
import { findApprovedModel, listApprovedModels } from './models.mjs';
import { complete, providerConfiguration, providerState } from './adapter.mjs';
import { INPUT_POLICY, approvedEgress, protectText, usagePolicyStatus } from './policy.mjs';
import { reserve, settleUnknown, cancel, cancellationRequested } from './requests.mjs';
import { uuid } from '../kernel/http.mjs';

export const HARD_MAX_MESSAGE_LENGTH = 4000;
// Secure Chat does not yet have a bound Kernel/Firewall decision for every
// message in the outgoing context. A model approval alone must not enable egress.
export function requireChatPolicyIntegration() {
  throw new KernelError(503, 'CHAT_POLICY_INTEGRATION_REQUIRED', 'تكامل سياسات Kernel وFirewall للمحادثة غير مهيأ؛ الإرسال موقوف ولم يُرسل أي محتوى.', 'not configured');
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
    await audit(db, identity, tenantId, action, {
      correlationId: requestId,
      policyVersion: INPUT_POLICY.version,
      idempotencyKey: `secure-chat:${requestId}:${action.split('.').pop()}`,
    });
  });
}

export async function listModels(request) {
  const { tenant } = await accessContext(request, 'browse');
  const approvedModels = listApprovedModels(tenant.tenant_id);
  const states = approvedModels.map(model => ({ model, state: providerState(model) }));
  const ready = states.filter(item => item.state === 'READY');
  const quota = usagePolicyStatus();
  // A configured quota policy is only usable after the reviewed 0016 function
  // exists. Probing is read-only and failure is treated as not ready, never open.
  let usageQuotaReady = false;
  if (ready.length > 0 && quota.approved) {
    try {
      // Existence alone is not enough: the connected role must also hold EXECUTE.
      usageQuotaReady = (await transaction(db => db.query("WITH fn AS (SELECT to_regprocedure('public.aigas_sc_usage_window_v2(uuid,uuid)') AS oid) SELECT CASE WHEN oid IS NULL THEN false ELSE has_function_privilege(current_user, oid, 'EXECUTE') END AS ready FROM fn"))).rows[0].ready;
    } catch { usageQuotaReady = false; }
  }
  // An approved model without an approved quota is not sendable: it would meter
  // nothing. The gate stays closed until both are configured and reviewed.
  const sendable = false; // Kept closed until the mandatory policy integration is verified.
  const models = sendable ? ready.map(({ model }) => ({ id: model.id, label: model.label, region: model.region, ready: true, state: 'READY' })) : [];
  const available = sendable;
  const allExpired = states.length > 0 && states.every(item => item.state === 'EXPIRED');
  const dependencyStatus = available ? 'available'
    : states.length === 0 ? 'not configured'
      : ready.length === 0 ? (allExpired ? 'expired' : 'not configured')
        : 'not configured';
  const availabilityCode = available ? null
    : states.length === 0 ? 'NO_APPROVED_MODEL'
      : ready.length === 0 ? (allExpired ? 'MODEL_APPROVAL_EXPIRED'
        : states.some(item => item.state === 'PROVIDER_NOT_CONFIGURED') ? 'PROVIDER_NOT_CONFIGURED'
          : 'NO_APPROVED_MODEL')
        : !quota.approved ? quota.code
          : !usageQuotaReady ? 'USAGE_POLICY_NOT_READY' : 'CHAT_POLICY_INTEGRATION_REQUIRED';
  const unavailableMessage = availabilityCode === 'PROVIDER_NOT_CONFIGURED'
    ? 'الموصل إلى المزود المعتمد غير مهيأ على الخادم؛ لم يُرسل أي محتوى.'
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
    models, available, dependencyStatus, availabilityCode, tenant: { id: tenant.tenant_id, name: tenant.name },
    conversationMode: 'EPHEMERAL_TAB_ONLY',
    retention: { enabled: false, contentStored: false, message: 'لا تُحفظ نصوص المحادثة أو مسوداتها؛ تُحفظ بيانات طلب وصفية لمنع التكرار وضبط الاستخدام. لم تعتمد سياسة حفظ المتن.' },
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

function validateMessages(message, history, model) {
  const maxLength = configuredMessageLimit();
  if (typeof message !== 'string' || !message.trim() || Array.from(message).length > maxLength) throw new KernelError(400,'INVALID_MESSAGE',`اكتب رسالة من حرف واحد إلى ${maxLength} حرفًا.`);
  if (!Array.isArray(history) || history.length > 12 || history.length % 2) throw new KernelError(400,'INVALID_HISTORY','سياق المحادثة أكبر من الحد التقني أو غير صالح؛ ابدأ محادثة جديدة.');
  let total = Array.from(message).length;
  let redacted = false;
  const messages = history.map((item,index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item) || Object.keys(item).some(key => !['role','content'].includes(key)) || item.role !== (index % 2 ? 'assistant' : 'user') || typeof item.content !== 'string' || !item.content.trim() || Array.from(item.content).length > 16000) throw new KernelError(400,'INVALID_HISTORY','سياق المحادثة غير صالح.');
    total += Array.from(item.content).length;
    const safe = protectText(item.content); redacted ||= safe.redacted;
    return Object.freeze({ role: item.role, content: safe.text });
  });
  if (total > 24000) throw new KernelError(400,'CONTEXT_LIMIT','بلغت المحادثة حد السياق التقني؛ ابدأ محادثة جديدة.');
  const safe = protectText(message);
  redacted ||= safe.redacted;
  messages.push(Object.freeze({ role:'user', content:safe.text }));
  const encoder = new TextEncoder();
  const inputBytes = messages.reduce((sum,item) => sum + encoder.encode(item.content).byteLength,0);
  if (inputBytes > model.maxInputBytes || inputBytes + model.inputOverheadTokens > model.maxRequestTokens - model.maxOutputTokens) {
    throw new KernelError(413,'CONTEXT_LIMIT','تجاوز سياق الرسالة حد الإدخال المعتمد لهذا النموذج؛ لم يُرسل الطلب.');
  }
  return { messages:Object.freeze(messages), redacted, submittedText:safe.text };
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
  const model = findApprovedModel(body.modelId,tenant.tenant_id);
  if (!model) {
    await auditBlocked(identity,tenant.tenant_id,'secure_chat.blocked_no_approved_model',requestId);
    throw new KernelError(503,'NO_APPROVED_MODEL','لا يوجد نموذج معتمد؛ لم يُرسل النص إلى أي مزود ولم يُحفظ متن المحادثة.','not configured');
  }
  try {
    providerConfiguration(model);
  } catch (error) {
    // The reviewed entry may exist while the server-side connector is absent.
    // Either way nothing leaves the process.
    await auditBlocked(identity,tenant.tenant_id,error?.code === 'PROVIDER_NOT_CONFIGURED' ? 'secure_chat.blocked_provider_not_configured' : 'secure_chat.blocked_no_approved_model',requestId);
    throw error;
  }
  requireChatPolicyIntegration();
  let protectedInput;
  try {
    protectedInput = validateMessages(body.message,body.history ?? [],model);
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
    try { if (await cancellationRequested(identity,tenant.tenant_id,requestId)) abort(); }
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
    const outbound = approvedEgress(protectedInput.messages);
    dispatched=true;
    const result = await complete(model,outbound,controller.signal);
    usage=result.usage;
    controller.signal.throwIfAborted();
    const output = protectText(result.reply);
    await accessContext(request);
    // No streaming: the entire reply is checked before any content is disclosed.
    const state = await settleUnknown(identity,tenant.tenant_id,requestId,'SUCCEEDED',usage);
    settled=true;
    if (state === 'CANCELLED' || controller.signal.aborted) throw new KernelError(409,'REQUEST_CANCELLED','أُوقفت إتاحة الرد؛ قد يكون المزود استهلك الطلب بالفعل.');
    return { requestId, reply:output.text, submittedText:protectedInput.submittedText, modelId:model.id, usage, redacted:protectedInput.redacted || output.redacted, saved:false, contentStored:false, message:'وصل رد مفحوص أوليًا؛ لم يُحفظ متن المحادثة.' };
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
export function errorResponse(error) {
  const known=error instanceof KernelError;
  const code=known ? error.code : ['42P01','42703','42883'].includes(error?.code) ? 'SECURE_CHAT_SCHEMA_MISSING' : error?.code==='42501' ? 'SECURE_CHAT_DB_PRIVILEGE' : 'SECURE_CHAT_UNAVAILABLE';
  const status=known ? error.status : 503;
  // Quota exhaustion is a product signal, not an error: code only, no user,
  // tenant, message text, model ID, or token counts.
  if(code==='USAGE_LIMIT_REACHED') void captureProductEvent('quota_exhausted',{product:'secure-chat'});
  void captureServerFailure(error,{surface:'secure-chat',code,status,pathname:'/app/api/secure-chat',dependency:known?dependencyStatusForError(error):code==='SECURE_CHAT_SCHEMA_MISSING'?'not configured':code==='SECURE_CHAT_DB_PRIVILEGE'?'access denied':'temporarily unavailable',operation:'POST'});
  const message=known ? error.message : code==='SECURE_CHAT_SCHEMA_MISSING' ? 'يلزم تجهيز مخطط Secure Chat على بيئة تطوير معتمدة. لم يُؤكد اكتمال الطلب.' : code==='SECURE_CHAT_DB_PRIVILEGE' ? 'صلاحيات قاعدة البيانات غير مهيأة. لم يُؤكد اكتمال الطلب.' : 'تعذر إكمال الطلب؛ لا تُعد إرساله تلقائيًا. لم يُؤكد استهلاك المزود أو اكتمال الرد.';
  const dependencyStatus=known?dependencyStatusForError(error):code==='SECURE_CHAT_SCHEMA_MISSING'?'not configured':code==='SECURE_CHAT_DB_PRIVILEGE'?'access denied':'temporarily unavailable';
  const responseHeaders=known&&error.status===429?{...privateHeaders,'Retry-After':'60'}:privateHeaders;
  return Response.json(errorBody({code,message,dependencyStatus}),{status,headers:responseHeaders});
}
