import { transaction } from './db.mjs';
import { tenantGuard, memberships, audit } from './service.mjs';
import { KernelError, requireRole, products } from './core.mjs';
import { exact, uuid } from './http.mjs';
export async function adminScope(db, identity, requested, roles = ['OWNER','ADMIN']) {
  if (!requested) throw new KernelError(400, 'WORKSPACE_REQUIRED', 'حدد المؤسسة قبل تنفيذ العملية.');
  const scope = await tenantGuard(identity, uuid(requested), db);
  requireRole(scope.tenant, roles);
  const member = (await db.query('SELECT role FROM public.aigas_memberships WHERE tenant_id=$1 AND user_id=$2 FOR SHARE', [scope.tenant.tenant_id, identity.userId])).rows[0];
  requireRole(member, roles);
  return scope;
}
export async function updateProduct(identity, requested, body) {
  exact(body, ['slug','status','version']);
  if (!products.some(p => p.slug === body.slug) || !['FOUNDATION','ENABLED','DISABLED'].includes(body.status) || !Number.isSafeInteger(body.version) || body.version < 1) throw new KernelError(400, 'INVALID_PRODUCT', 'اختر منتجًا وحالة صحيحة وحدّث البيانات.');
  return transaction(async db => {
    const { tenant } = await adminScope(db, identity, requested, ['OWNER']);
    if (body.status === 'ENABLED') {
      const grant = (await db.query('SELECT 1 FROM public.aigas_product_grants WHERE tenant_id=$1 AND product_slug=$2 AND revoked_at IS NULL AND expires_at>now() FOR SHARE', [tenant.tenant_id, body.slug])).rows[0];
      if (!grant) throw new KernelError(403, 'APPROVAL_REQUIRED', 'يلزم قرار إتاحة إداري مؤقت من المشغّل؛ لا يمكن منح ترخيص أو تجربة مدفوعة من هذه الواجهة.');
    }
    const result = await db.query('UPDATE public.aigas_product_access SET status=$3,version=version+1,updated_at=clock_timestamp() WHERE tenant_id=$1 AND product_slug=$2 AND version=$4 RETURNING status,version', [tenant.tenant_id, body.slug, body.status, body.version]);
    if (!result.rowCount) throw new KernelError(409, 'STALE_PRODUCT', 'تغيرت حالة المنتج؛ حدّث اللوحة قبل إعادة المحاولة.');
    await audit(db, identity, tenant.tenant_id, `kernel.product.${body.slug}.${body.status.toLowerCase()}`);
    return { persisted: true, ...result.rows[0] };
  });
}
export async function invitationState(db, identity, tenant) {
  const ready = (await db.query("SELECT to_regclass('public.aigas_auth_organizations') IS NOT NULL AND to_regclass('public.aigas_member_invitations') IS NOT NULL AS ready")).rows[0].ready;
  if (!ready) return { available: false, canLink: false, reason: 'الدعوات معلّقة حتى تطبيق ترحيل إدارة Kernel على بيئة معتمدة.', invitations: [] };
  const mapping = (await db.query('SELECT organization_id FROM public.aigas_auth_organizations WHERE tenant_id=$1', [tenant.tenant_id])).rows[0];
  if (!mapping) return { available: false, canLink: tenant.role === 'OWNER', reason: 'لم تُربط مؤسسة Neon Auth بعد. المالك يستطيع ربط مؤسسة ينشئها بحسابه؛ لا تُستورد أدوار Auth إلى Kernel.', invitations: [] };
  const native = (await db.query('SELECT role FROM neon_auth.member WHERE "organizationId"=$1 AND "userId"=$2', [mapping.organization_id, identity.userId])).rows[0];
  const available = ['OWNER','ADMIN'].includes(tenant.role) && ['owner','admin'].includes(native?.role);
  const invitations = ['OWNER','ADMIN'].includes(tenant.role) ? (await db.query(`SELECT i.id,i.email,i.status,i."expiresAt" AS expires_at,k.accepted_at FROM public.aigas_member_invitations k JOIN neon_auth.invitation i ON i.id=k.invitation_id WHERE k.tenant_id=$1 ORDER BY k.created_at DESC LIMIT 30`, [tenant.tenant_id])).rows.map(row => ({ ...row, status: row.status === 'pending' && new Date(row.expires_at) <= new Date() ? 'expired' : row.status })) : [];
  return { available, canLink: false, organizationId: available ? mapping.organization_id : null, invitations, reason: available ? 'دعوة بدور عضو فقط. تُتابع داخل Kernel؛ إرسال البريد يتبع إعداد Neon Auth ولا يُفترض نجاحه.' : 'الدعوة تتطلب OWNER/ADMIN في Kernel وصلاحية دعوة لدى مؤسسة Auth المرتبطة.' };
}
export async function incomingInvitations(identity) {
  return transaction(async db => {
    await memberships(identity.userId, db);
    const ready = (await db.query("SELECT to_regclass('public.aigas_member_invitations') IS NOT NULL AS ready")).rows[0].ready;
    if (!ready) return { invitations: [], available: false };
    const rows = (await db.query(`SELECT i.id,t.name,i.status,i."expiresAt" AS expires_at FROM public.aigas_member_invitations k JOIN neon_auth.invitation i ON i.id=k.invitation_id JOIN public.aigas_auth_organizations o ON o.tenant_id=k.tenant_id AND o.organization_id=i."organizationId" JOIN public.aigas_tenants t ON t.id=k.tenant_id JOIN neon_auth."user" u ON lower(u.email)=lower(i.email) JOIN public.aigas_memberships m ON m.tenant_id=k.tenant_id AND m.user_id=k.invited_by AND m.role IN ('OWNER','ADMIN') WHERE u.id=$1 AND u."emailVerified" IS TRUE AND u.banned IS NOT TRUE AND k.accepted_at IS NULL AND i.role='member' AND i."inviterId"=k.invited_by AND i.status IN ('pending','accepted') AND i."expiresAt">now() ORDER BY k.created_at DESC LIMIT 30`, [identity.userId])).rows;
    return { invitations: rows, available: true };
  });
}
export async function manageInvitation(identity, requested, body) {
  if (body.operation === 'accept') {
    exact(body, ['operation','invitationId']); uuid(body.invitationId);
    return transaction(async db => {
      await memberships(identity.userId, db);
      // Lock registration first: one acceptance cannot create duplicate memberships or audit events.
      const record = (await db.query('SELECT * FROM public.aigas_member_invitations WHERE invitation_id=$1 FOR UPDATE', [body.invitationId])).rows[0];
      if (!record) throw new KernelError(403, 'INVALID_INVITATION', 'الدعوة غير مسجلة في Kernel.');
      if (record.accepted_by === identity.userId) return { persisted: true, tenantId: record.tenant_id };
      if (record.accepted_by) throw new KernelError(403, 'INVALID_INVITATION', 'الدعوة غير متاحة.');
      const inviter = (await db.query('SELECT role FROM public.aigas_memberships WHERE tenant_id=$1 AND user_id=$2 FOR SHARE', [record.tenant_id, record.invited_by])).rows[0];
      requireRole(inviter, ['OWNER','ADMIN']);
      const valid = (await db.query(`SELECT i.id FROM neon_auth.invitation i JOIN public.aigas_auth_organizations o ON o.organization_id=i."organizationId" JOIN neon_auth."user" u ON lower(u.email)=lower(i.email) JOIN neon_auth.member m ON m."organizationId"=o.organization_id AND m."userId"=u.id WHERE i.id=$1 AND o.tenant_id=$2 AND i."inviterId"=$3 AND i.status='accepted' AND i.role='member' AND m.role='member' AND i."expiresAt">now() AND u.id=$4 AND u."emailVerified" IS TRUE AND u.banned IS NOT TRUE`, [body.invitationId, record.tenant_id, record.invited_by, identity.userId])).rows[0];
      if (!valid) throw new KernelError(403, 'INVITATION_NOT_ACCEPTED', 'يلزم قبول دعوة Auth الصحيحة ببريد موثّق؛ لم تُمنح أي عضوية.');
      await db.query("INSERT INTO public.aigas_memberships(tenant_id,user_id,role) VALUES($1,$2,'MEMBER') ON CONFLICT DO NOTHING", [record.tenant_id, identity.userId]);
      await db.query('UPDATE public.aigas_member_invitations SET accepted_by=$2,accepted_at=now() WHERE invitation_id=$1', [body.invitationId, identity.userId]);
      await audit(db, identity, record.tenant_id, 'kernel.invitation.accepted');
      return { persisted: true, tenantId: record.tenant_id };
    });
  }
  return transaction(async db => {
    const { tenant } = await adminScope(db, identity, requested, body.operation === 'link' ? ['OWNER'] : ['OWNER','ADMIN']);
    if (body.operation === 'link') {
      exact(body, ['operation','organizationId']); uuid(body.organizationId);
      const owner = (await db.query(`SELECT o.id FROM neon_auth.organization o JOIN neon_auth.member m ON m."organizationId"=o.id WHERE o.id=$1 AND m."userId"=$2 AND m.role='owner'`, [body.organizationId, identity.userId])).rows[0];
      if (!owner) throw new KernelError(403, 'AUTH_OWNER_REQUIRED', 'يلزم أن تكون مالك مؤسسة Auth المراد ربطها.');
      const inserted = await db.query('INSERT INTO public.aigas_auth_organizations(tenant_id,organization_id,linked_by) VALUES($1,$2,$3) ON CONFLICT DO NOTHING RETURNING tenant_id', [tenant.tenant_id, body.organizationId, identity.userId]);
      if (!inserted.rowCount) throw new KernelError(409, 'ALREADY_LINKED', 'المؤسسة مرتبطة مسبقًا؛ حدّث الأعضاء.');
      await audit(db, identity, tenant.tenant_id, 'kernel.auth.linked');
      return { persisted: true };
    }
    if (body.operation !== 'register') throw new KernelError(400, 'INVALID_OPERATION', 'عملية الدعوة غير مدعومة.');
    exact(body, ['operation','invitationId']); uuid(body.invitationId);
    const valid = (await db.query(`SELECT i.id FROM neon_auth.invitation i JOIN public.aigas_auth_organizations o ON o.organization_id=i."organizationId" JOIN neon_auth.member m ON m."organizationId"=o.organization_id AND m."userId"=$2 WHERE i.id=$1 AND o.tenant_id=$3 AND i."inviterId"=$2 AND i.role='member' AND i.status='pending' AND i."expiresAt">now() AND m.role IN ('owner','admin')`, [body.invitationId, identity.userId, tenant.tenant_id])).rows[0];
    if (!valid) throw new KernelError(403, 'INVALID_INVITATION', 'لا توجد دعوة معلقة صحيحة من حسابك بدور عضو للمؤسسة المحددة.');
    const result = await db.query('INSERT INTO public.aigas_member_invitations(invitation_id,tenant_id,invited_by) VALUES($1,$2,$3) ON CONFLICT DO NOTHING RETURNING invitation_id', [body.invitationId, tenant.tenant_id, identity.userId]);
    if (result.rowCount) await audit(db, identity, tenant.tenant_id, 'kernel.invitation.created');
    return { persisted: true, delivery: 'NOT_CONFIRMED' };
  });
}
