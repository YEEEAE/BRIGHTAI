import { authenticate } from '../kernel/auth.mjs';
import { audit, tenantGuard } from '../kernel/service.mjs';
import { database } from '../kernel/db.mjs';
import { KernelError } from '../kernel/core.mjs';

export const MAX_MESSAGE_LENGTH = 4000;

async function accessContext(request) {
  const identity = await authenticate(request);
  const workspace = new URL(request.url).searchParams.get('workspace');
  const { tenant } = await tenantGuard(identity, workspace);
  if (!tenant) throw new KernelError(403, 'MEMBERSHIP_REQUIRED', 'يلزم الانضمام إلى مؤسسة قبل استخدام Secure Chat.');

  const result = await database().query(
    `SELECT 1 FROM public.aigas_product_access a
     JOIN public.aigas_memberships m ON m.tenant_id = a.tenant_id
     WHERE a.tenant_id = $1 AND m.user_id = $2 AND a.product_slug = 'secure-chat' AND a.status = 'ENABLED'`,
    [tenant.tenant_id, identity.userId],
  );
  if (!result.rowCount) throw new KernelError(403, 'PRODUCT_NOT_ENABLED', 'Secure Chat غير مفعّل لهذه المؤسسة.');
  return { identity, tenant };
}

export async function listModels(request) {
  const { tenant } = await accessContext(request);
  // No provider/model has verified approval for region and no-training terms.
  return {
    models: [],
    available: false,
    tenant: { id: tenant.tenant_id, name: tenant.name },
    conversationMode: 'EPHEMERAL_TAB_ONLY',
    message: 'لا يوجد نموذج معتمد ومهيأ لهذه المؤسسة. لم يُرسل أي محتوى إلى مزود AI.',
  };
}

export async function rejectMessage(request, modelId, message) {
  const { identity, tenant } = await accessContext(request);
  if (typeof message !== 'string' || !message.trim() || message.length > MAX_MESSAGE_LENGTH) {
    throw new KernelError(400, 'INVALID_MESSAGE', 'اكتب رسالة من حرف واحد إلى 4000 حرف.');
  }
  if (typeof modelId !== 'string' || modelId.length > 120) {
    throw new KernelError(400, 'INVALID_MODEL', 'اختيار النموذج غير صالح.');
  }

  // Record only a fixed metadata action; never persist or log the submitted content.
  await audit(database(), identity, tenant.tenant_id, 'secure_chat.blocked_no_approved_model');
  throw new KernelError(503, 'NO_APPROVED_MODEL', 'لا يوجد نموذج معتمد ومهيأ؛ لم يُرسل النص إلى أي مزود ولم يُحفظ في قاعدة البيانات.');
}

export function errorResponse(error) {
  const known = error instanceof KernelError;
  return Response.json(
    { code: known ? error.code : 'SECURE_CHAT_UNAVAILABLE', message: known ? error.message : 'تعذر إكمال الطلب. لم يصدر رد من نموذج.' },
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
