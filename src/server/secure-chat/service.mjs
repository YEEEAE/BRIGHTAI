import { requireProductAccess } from '../kernel/access.mjs';
import { authenticate } from '../kernel/auth.mjs';
import { audit, tenantGuard } from '../kernel/service.mjs';
import { transaction } from '../kernel/db.mjs';
import { KernelError } from '../kernel/core.mjs';
import { env } from '../kernel/env.mjs';
import { findApprovedModel, listApprovedModels } from './models.mjs';
import { complete, providerReady, providerConfiguration } from './adapter.mjs';
import { INPUT_POLICY, protectText, usagePolicy } from './policy.mjs';
import { reserve, settle, cancel, cancellationRequested } from './requests.mjs';
import { uuid } from '../kernel/http.mjs';

export const HARD_MAX_MESSAGE_LENGTH = 4000;
export function configuredMessageLimit(raw = env('AIGAS_SC_MAX_MESSAGE_CHARS')) {
  if (typeof raw !== 'string' || !/^\d{1,4}$/.test(raw)) return HARD_MAX_MESSAGE_LENGTH;
  const value = Number(raw);
  return value >= 1 && value <= HARD_MAX_MESSAGE_LENGTH ? value : HARD_MAX_MESSAGE_LENGTH;
}
async function accessContext(request) {
  const identity = await authenticate(request);
  const { tenant } = await tenantGuard(identity, new URL(request.url).searchParams.get('workspace'));
  if (!tenant) throw new KernelError(403, 'MEMBERSHIP_REQUIRED', 'يلزم الانضمام إلى مؤسسة قبل استخدام Secure Chat.');
  await transaction(db => requireProductAccess(db, identity, tenant.tenant_id, 'secure-chat'));
  return { identity, tenant };
}
export async function listModels(request) {
  const { tenant } = await accessContext(request);
  const models = listApprovedModels(tenant.tenant_id).map(model => ({ id: model.id, label: model.label, region: model.region, ready: providerReady(model) }));
  const policy = usagePolicy();
  const available = models.some(model => model.ready);
  return {
    models, available, tenant: { id: tenant.tenant_id, name: tenant.name },
    conversationMode: 'EPHEMERAL_TAB_ONLY', retention: { enabled: false, message: 'لا تُحفظ نصوص المحادثة أو مسوداتها؛ تُحفظ بيانات طلب وصفية لمنع التكرار وضبط الاستخدام. لم تعتمد سياسة حفظ المتن.' },
    policy: { version: INPUT_POLICY.version, syntheticOnly: true, message: 'نصوص اصطناعية فقط. حماية أولية محدودة تحجب الأسرار وتنقح بعض بيانات الاتصال والهوية؛ لا تضمن كشف جميع البيانات الحساسة.' },
    usage: { cost: 'غير متاح', tokens: null, limits: policy, configuredMessageCharacters: configuredMessageLimit() },
    message: available ? 'النماذج المعتمدة والمهيأة متاحة للنصوص الاصطناعية فقط؛ كل إرسال يخضع لفحص الخادم.' : models.length ? 'النموذج معتمد لكن موصله غير مهيأ أو انتهى اعتماده؛ الإرسال موقوف.' : 'لا يوجد نموذج معتمد لهذه المؤسسة. لم يُرسل أي محتوى إلى مزود AI.',
  };
}
function validateMessages(message, history) {
  const maxLength = configuredMessageLimit();
  if (typeof message !== 'string' || !message.trim() || Array.from(message).length > maxLength) throw new KernelError(400,'INVALID_MESSAGE',`اكتب رسالة من حرف واحد إلى ${maxLength} حرفًا.`);
  if (!Array.isArray(history) || history.length > 12 || history.length % 2) throw new KernelError(400,'INVALID_HISTORY','سياق المحادثة أكبر من الحد التقني أو غير صالح؛ ابدأ محادثة جديدة.');
  let total = Array.from(message).length;
  let redacted = false;
  const messages = history.map((item,index) => {
    if (!item || typeof item !== 'object' || Object.keys(item).some(key => !['role','content'].includes(key)) || item.role !== (index % 2 ? 'assistant' : 'user') || typeof item.content !== 'string' || !item.content.trim() || Array.from(item.content).length > 16000) throw new KernelError(400,'INVALID_HISTORY','سياق المحادثة غير صالح.');
    total += Array.from(item.content).length;
    const safe = protectText(item.content); redacted ||= safe.redacted;
    return { role: item.role, content: safe.text };
  });
  if (total > 24000) throw new KernelError(400,'CONTEXT_LIMIT','بلغت المحادثة حد السياق التقني؛ ابدأ محادثة جديدة.');
  const safe = protectText(message);
  redacted ||= safe.redacted;
  messages.push({ role:'user', content:safe.text });
  return { messages, redacted, submittedText:safe.text };
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
    await transaction(async db => { await requireProductAccess(db,identity,tenant.tenant_id,'secure-chat'); await audit(db,identity,tenant.tenant_id,'secure_chat.blocked_no_approved_model'); });
    throw new KernelError(503,'NO_APPROVED_MODEL','لا يوجد نموذج معتمد؛ لم يُرسل النص إلى أي مزود ولم يُحفظ متن المحادثة.');
  }
  providerConfiguration(model);
  const protectedInput = validateMessages(body.message,body.history ?? []);
  // The provider must enforce the approved context/output token bounds. Neither
  // client roles nor model output can execute tools or change server policies.
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
    dispatched=true;
    const result = await complete(model,protectedInput.messages,controller.signal);
    usage=result.usage;
    controller.signal.throwIfAborted();
    const output = protectText(result.reply);
    await accessContext(request);
    // No streaming: the entire reply is checked before any content is disclosed.
    const state = await settle(identity,tenant.tenant_id,requestId,'SUCCEEDED',usage);
    settled=true;
    if (state === 'CANCELLED' || controller.signal.aborted) throw new KernelError(409,'REQUEST_CANCELLED','أُوقفت إتاحة الرد؛ قد يكون المزود استهلك الطلب بالفعل.');
    return { requestId, reply:output.text, submittedText:protectedInput.submittedText, modelId:model.id, usage, redacted:protectedInput.redacted || output.redacted, saved:false, message:'وصل رد مفحوص أوليًا؛ لم يُحفظ متن المحادثة.' };
  } catch (error) {
    if (!settled) {
      // Unknown usage remains conservatively reserved. Never claim zero cost
      // for a timeout, network failure, cancellation or unavailable settlement.
      await settle(identity,tenant.tenant_id,requestId,controller.signal.aborted ? 'CANCELLED' : dispatched ? 'UNKNOWN' : 'FAILED',usage);
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
export const privateHeaders = { 'Cache-Control':'private, no-store', 'X-Robots-Tag':'noindex, nofollow', 'X-Content-Type-Options':'nosniff', Vary:'Authorization' };
export function errorResponse(error) {
  const known=error instanceof KernelError;
  const code=known ? error.code : ['42P01','42703','42883'].includes(error?.code) ? 'SECURE_CHAT_SCHEMA_MISSING' : error?.code==='42501' ? 'SECURE_CHAT_DB_PRIVILEGE' : 'SECURE_CHAT_UNAVAILABLE';
  const message=known ? error.message : code==='SECURE_CHAT_SCHEMA_MISSING' ? 'يلزم تجهيز مخطط Secure Chat على بيئة تطوير معتمدة. لم يُؤكد اكتمال الطلب.' : code==='SECURE_CHAT_DB_PRIVILEGE' ? 'صلاحيات قاعدة البيانات غير مهيأة. لم يُؤكد اكتمال الطلب.' : 'تعذر إكمال الطلب؛ لا تُعد إرساله تلقائيًا. لم يُؤكد استهلاك المزود أو اكتمال الرد.';
  return Response.json({code,message},{status:known ? error.status : 503,headers:privateHeaders});
}
