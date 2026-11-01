import { requireProductAccess } from '../kernel/access.mjs';
import { authenticate } from '../kernel/auth.mjs';
import { audit, tenantGuard } from '../kernel/service.mjs';
import { transaction } from '../kernel/db.mjs';
import { KernelError } from '../kernel/core.mjs';
import { env } from '../kernel/env.mjs';
import { findApprovedModel, listApprovedModels } from './models.mjs';

export const HARD_MAX_MESSAGE_LENGTH = 4000;

export function configuredMessageLimit(raw = env('AIGAS_SC_MAX_MESSAGE_CHARS')) {
  if (typeof raw !== 'string' || !/^\d{1,4}$/.test(raw)) return HARD_MAX_MESSAGE_LENGTH;
  const value = Number(raw);
  return value >= 1 && value <= HARD_MAX_MESSAGE_LENGTH ? value : HARD_MAX_MESSAGE_LENGTH;
}

async function accessContext(request) {
  const identity = await authenticate(request);
  const workspace = new URL(request.url).searchParams.get('workspace');
  const { tenant } = await tenantGuard(identity, workspace);
  if (!tenant) throw new KernelError(403, 'MEMBERSHIP_REQUIRED', 'يلزم الانضمام إلى مؤسسة قبل استخدام Secure Chat.');

  await transaction(db => requireProductAccess(db, identity, tenant.tenant_id, 'secure-chat'));
  return { identity, tenant };
}

export async function listModels(request) {
  const { tenant } = await accessContext(request);
  const models = listApprovedModels();
  return {
    models,
    available: models.length > 0,
    tenant: { id: tenant.tenant_id, name: tenant.name },
    conversationMode: 'EPHEMERAL_TAB_ONLY',
    usage: {
      cost: 'غير متاح',
      requestLimit: 'غير متاح',
      tokenLimit: 'غير متاح',
      configuredMessageCharacters: configuredMessageLimit(),
    },
    message: models.length
      ? 'النماذج المعتمدة ظاهرة؛ التحقق من إعداد الموصل ما زال مطلوبًا قبل الإرسال.'
      : 'لا يوجد نموذج معتمد ومهيأ لهذه المؤسسة. لم يُرسل أي محتوى إلى مزود AI.',
  };
}

export async function rejectMessage(request, modelId, message) {
  const { identity, tenant } = await accessContext(request);
  const maxLength = configuredMessageLimit();
  if (typeof message !== 'string' || !message.trim() || Array.from(message).length > maxLength) {
    throw new KernelError(400, 'INVALID_MESSAGE', `اكتب رسالة من حرف واحد إلى ${maxLength} حرفًا.`);
  }
  if (typeof modelId !== 'string' || modelId.length > 120) {
    throw new KernelError(400, 'INVALID_MODEL', 'اختيار النموذج غير صالح.');
  }
  if (!findApprovedModel(modelId)) {
    // Do not contact a provider, even if a client submits an arbitrary model ID.
    await transaction(async db => {
      await requireProductAccess(db, identity, tenant.tenant_id, 'secure-chat');
      await audit(db, identity, tenant.tenant_id, 'secure_chat.blocked_no_approved_model');
    });
    throw new KernelError(503, 'NO_APPROVED_MODEL', 'لا يوجد نموذج معتمد ومهيأ؛ لم يُرسل النص إلى أي مزود ولم يُحفظ في قاعدة البيانات.');
  }

  // An approved registry entry still needs its provider adapter, protected
  // credential, input/output policy gates, and metering before it can run.
  throw new KernelError(503, 'PROVIDER_NOT_CONFIGURED', 'النموذج معتمد لكن موصله غير مهيأ؛ لم يُرسل النص إلى أي مزود.');
}

export function errorResponse(error) {
  const known = error instanceof KernelError;
  const code = known ? error.code : error?.code === '42P01' ? 'SECURE_CHAT_SCHEMA_MISSING' : error?.code === '42501' ? 'SECURE_CHAT_DB_PRIVILEGE' : 'SECURE_CHAT_UNAVAILABLE';
  const message = known ? error.message : error?.code === '42P01'
    ? 'يلزم تجهيز مخطط Secure Chat على بيئة تطوير معتمدة.'
    : error?.code === '42501'
      ? 'دور قاعدة البيانات لا يملك الصلاحية المطلوبة؛ لم يُرسل النص إلى مزود.'
      : 'تعذر إكمال الطلب. لم يصدر رد من نموذج.';
  return Response.json(
    { code, message },
    {
      status: known ? error.status : 503,
      headers: {
        'Cache-Control': 'private, no-store',
        'X-Robots-Tag': 'noindex, nofollow',
        'X-Content-Type-Options': 'nosniff',
        'Vary': 'Authorization',
      },
    },
  );
}

export const privateHeaders = {
  'Cache-Control': 'private, no-store',
  'X-Robots-Tag': 'noindex, nofollow',
  'X-Content-Type-Options': 'nosniff',
  'Vary': 'Authorization',
};
