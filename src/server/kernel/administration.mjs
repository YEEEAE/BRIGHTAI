import { randomUUID } from 'node:crypto';
import { transaction, connectionPrivilege } from './db.mjs';
import { productGrants } from './access.mjs';
import { trialProductAccess } from './trial.mjs';
import { tenantGuard, memberships, audit } from './service.mjs';
import { KernelError, requireRole, products } from './core.mjs';
import { exact, uuid } from './http.mjs';
const auditContext = () => ({ correlationId: randomUUID() });
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
      const grant = (await productGrants(db, tenant.tenant_id, body.slug))[0];
      const trial = await trialProductAccess(db, tenant.tenant_id, body.slug);
      // The toggle is not a commercial licence. It can be enabled only when one
      // explicit access source is active: an operator administrative grant or a
      // genuinely activated 48-hour trial entitlement. A request or an approval
      // that has not been activated is never enough.
      if (grant?.grantState !== 'ACTIVE' && trial?.grantsProduct !== true) throw new KernelError(403, 'APPROVAL_REQUIRED', 'يلزم قرار إتاحة إداري ساري أو استحقاق تجربة 48 ساعة مفعّل؛ طلب التجربة أو الموافقة وحدها لا يفعّل المنتج ولا ينشئ اشتراكًا أو ترخيصًا.');
    }
    const result = await db.query('UPDATE public.aigas_product_access SET status=$3,version=version+1,updated_at=clock_timestamp() WHERE tenant_id=$1 AND product_slug=$2 AND version=$4 RETURNING status,version', [tenant.tenant_id, body.slug, body.status, body.version]);
    if (!result.rowCount) throw new KernelError(409, 'STALE_PRODUCT', 'تغيرت حالة المنتج؛ حدّث اللوحة قبل إعادة المحاولة.');
    await audit(db, identity, tenant.tenant_id, `kernel.product.${body.slug}.${body.status.toLowerCase()}`, auditContext());
    return { persisted: true, ...result.rows[0] };
  });
}
export async function manageMember(identity, requested, body) {
  if (!['set-role', 'revoke'].includes(body.operation)) throw new KernelError(400, 'INVALID_OPERATION', 'عملية العضوية غير مدعومة.');
  if (body.operation === 'set-role') {
    exact(body, ['operation','userId','role']); uuid(body.userId);
    if (!['ADMIN','MEMBER'].includes(body.role)) throw new KernelError(400, 'INVALID_ROLE', 'الدور المطلوب غير مسموح.');
  } else { exact(body, ['operation','userId']); uuid(body.userId); }
  return transaction(async db => {
    if (!requested) throw new KernelError(400, 'WORKSPACE_REQUIRED', 'حدد المؤسسة قبل تنفيذ العملية.');
    const scope = await tenantGuard(identity, uuid(requested), db);
    const tenant = scope.tenant;
    if (!tenant) throw new KernelError(403, 'FORBIDDEN', 'ليس لديك عضوية في المؤسسة المحددة.');
    // Lock tenant before member rows so concurrent changes serialize without stale authority.
    await db.query('SELECT id FROM public.aigas_tenants WHERE id=$1 FOR UPDATE', [tenant.tenant_id]);
    const actor = (await db.query('SELECT role FROM public.aigas_memberships WHERE tenant_id=$1 AND user_id=$2 FOR UPDATE', [tenant.tenant_id, identity.userId])).rows[0];
    requireRole(actor, ['OWNER','ADMIN']);
    const target = (await db.query('SELECT role FROM public.aigas_memberships WHERE tenant_id=$1 AND user_id=$2 FOR UPDATE', [tenant.tenant_id, body.userId])).rows[0];
    if (!target && body.operation === 'revoke') return { persisted: true, unchanged: true };
    if (!target) throw new KernelError(404, 'MEMBER_NOT_FOUND', 'العضوية غير موجودة أو سبق سحبها.');
    // Roles are never self-edited: a second authorized actor is required.
    if (body.operation === 'set-role' && body.userId === identity.userId) throw new KernelError(409, 'SELF_ROLE_CHANGE_REJECTED', 'لا يمكنك تغيير دورك بنفسك. اطلب من مالك أو مدير آخر إدارة دورك.');
    if (target.role === 'OWNER' && actor.role !== 'OWNER') throw new KernelError(403, 'OWNER_PROTECTED', 'لا يحق للمدير تغيير صلاحية المالك.');
    if (body.operation === 'revoke') {
      if (body.userId === identity.userId) throw new KernelError(409, 'SELF_REVOCATION_REJECTED', 'لا يمكن سحب عضويتك من هذه الشاشة. اطلب من مالك آخر إدارة عضويتك.');
      if (target.role === 'OWNER') {
        const owners = (await db.query("SELECT count(*)::int AS count FROM public.aigas_memberships WHERE tenant_id=$1 AND role='OWNER'", [tenant.tenant_id])).rows[0].count;
        if (owners <= 1) throw new KernelError(409, 'LAST_OWNER_REQUIRED', 'لا يمكن سحب آخر عضوية مالك للمؤسسة.');
      }
      await audit(db, identity, tenant.tenant_id, 'kernel.member.revoked', auditContext());
      const hierarchyReady=(await db.query("SELECT to_regclass('public.aigas_department_memberships') IS NOT NULL AND to_regclass('public.aigas_department_events') IS NOT NULL AS ready")).rows[0].ready;
      if (hierarchyReady) {
        const departments=(await db.query("UPDATE public.aigas_department_memberships SET status='REVOKED' WHERE tenant_id=$1 AND user_id=$2 AND status='ACTIVE' RETURNING department_id",[tenant.tenant_id,body.userId])).rows;
        for (const row of departments) await db.query("INSERT INTO public.aigas_department_events(id,tenant_id,department_id,actor_user_id,subject_user_id,action,reason) VALUES(gen_random_uuid(),$1,$2,$3,$4,'MEMBER_REVOKED','سُحبت عضوية Kernel؛ أوقفت عضوية الإدارة التابعة.')",[tenant.tenant_id,row.department_id,identity.userId,body.userId]);
      }
      const delegationsReady=(await db.query("SELECT to_regclass('public.aigas_policy_delegations') IS NOT NULL AS ready")).rows[0].ready;
      if (delegationsReady) await db.query("UPDATE public.aigas_policy_delegations SET revoked_at=clock_timestamp(),revoke_reason='سُحبت عضوية Kernel.' WHERE tenant_id=$1 AND delegate_user_id=$2 AND revoked_at IS NULL",[tenant.tenant_id,body.userId]);
      await db.query('DELETE FROM public.aigas_memberships WHERE tenant_id=$1 AND user_id=$2', [tenant.tenant_id, body.userId]);
      return { persisted: true };
    }
    if (actor.role !== 'OWNER' && (target.role === 'OWNER' || body.role === 'ADMIN')) throw new KernelError(403, 'OWNER_REQUIRED', 'ترقية الأعضاء إلى مدير من صلاحية المالك فقط.');
    if (target.role === 'OWNER' && body.role !== 'OWNER') {
      const owners = (await db.query("SELECT count(*)::int AS count FROM public.aigas_memberships WHERE tenant_id=$1 AND role='OWNER'", [tenant.tenant_id])).rows[0].count;
      if (owners <= 1) throw new KernelError(409, 'LAST_OWNER_REQUIRED', 'يجب أن يبقى مالك واحد على الأقل.');
    }
    if (target.role === body.role) return { persisted: true, unchanged: true };
    await db.query('UPDATE public.aigas_memberships SET role=$3 WHERE tenant_id=$1 AND user_id=$2', [tenant.tenant_id, body.userId, body.role]);
    if (target.role==='ADMIN' && body.role!=='ADMIN') {
      const delegationsReady=(await db.query("SELECT to_regclass('public.aigas_policy_delegations') IS NOT NULL AS ready")).rows[0].ready;
      if (delegationsReady) await db.query("UPDATE public.aigas_policy_delegations SET revoked_at=clock_timestamp(),revoke_reason='تغير دور العضو من ADMIN.' WHERE tenant_id=$1 AND delegate_user_id=$2 AND revoked_at IS NULL",[tenant.tenant_id,body.userId]);
    }
    await audit(db, identity, tenant.tenant_id, 'kernel.member.role_changed', auditContext());
    return { persisted: true, role: body.role };
  });
}
export async function invitationState(db, identity, tenant) {
  const ready = (await db.query("SELECT to_regclass('public.aigas_auth_organizations') IS NOT NULL AND to_regclass('public.aigas_member_invitations') IS NOT NULL AS ready")).rows[0].ready;
  if (!ready) return { available: false, canLink: false, reason: 'الدعوات معلّقة حتى تطبيق ترحيل إدارة Kernel على بيئة معتمدة.', invitations: [] };
  const mapping = (await db.query('SELECT organization_id FROM public.aigas_auth_organizations WHERE tenant_id=$1', [tenant.tenant_id])).rows[0];
  if (!mapping) return { available: false, canLink: tenant.role === 'OWNER', reason: 'لم تُربط مؤسسة Neon Auth بعد. المالك يستطيع ربط مؤسسة ينشئها بحسابه؛ لا تُستورد أدوار Auth إلى Kernel.', invitations: [] };
  const native = (await db.query('SELECT role FROM neon_auth.member WHERE "organizationId"=$1 AND "userId"=$2', [mapping.organization_id, identity.userId])).rows[0];
  const available = ['OWNER','ADMIN'].includes(tenant.role) && ['owner','admin'].includes(native?.role);
  const invitations = ['OWNER','ADMIN'].includes(tenant.role) ? (await db.query(`SELECT i.id,i.email,i.status,i."expiresAt" AS expires_at,k.accepted_at FROM public.aigas_member_invitations k JOIN neon_auth.invitation i ON i.id=k.invitation_id WHERE k.tenant_id=$1 ORDER BY k.created_at DESC LIMIT 30`, [tenant.tenant_id])).rows.map(row => {
    // Cancellation is a provider action confirmed by the server; only a pending, unaccepted
    // invitation that Kernel actually registered can be offered here.
    const status = row.status === 'pending' && new Date(row.expires_at) <= new Date() ? 'expired' : row.status;
    return { ...row, status, canCancel: status === 'pending' && !row.accepted_at };
  }) : [];
  return { available, canLink: false, organizationId: available ? mapping.organization_id : null, invitations, reason: available ? 'دعوة بدور عضو فقط. تُتابع داخل Kernel؛ إرسال البريد غير مؤكد، وإلغاء الدعوة يتم من هنا أو من Neon Auth.' : 'الدعوة تتطلب OWNER/ADMIN في Kernel وصلاحية دعوة لدى مؤسسة Auth المرتبطة.' };
}
export async function incomingInvitations(identity) {
  return transaction(async db => {
    await memberships(identity.userId, db);
    const ready = (await db.query("SELECT to_regclass('public.aigas_member_invitations') IS NOT NULL AS ready")).rows[0].ready;
    if (!ready) return { invitations: [], available: false };
    const rows = (await db.query(`SELECT i.id,t.name,i."expiresAt" AS expires_at,
      CASE WHEN i.status IN ('pending','accepted') AND i."expiresAt"<=now() THEN 'expired'
           WHEN i.status IN ('pending','accepted') AND (COALESCE(km.role,'') NOT IN ('OWNER','ADMIN') OR COALESCE(nm.role,'') NOT IN ('owner','admin')) THEN 'inviter_unavailable'
           ELSE i.status END AS status
      FROM public.aigas_member_invitations k
      JOIN neon_auth.invitation i ON i.id=k.invitation_id
      JOIN public.aigas_auth_organizations o ON o.tenant_id=k.tenant_id AND o.organization_id=i."organizationId"
      JOIN public.aigas_tenants t ON t.id=k.tenant_id
      JOIN neon_auth."user" u ON lower(u.email)=lower(i.email)
      LEFT JOIN public.aigas_memberships km ON km.tenant_id=k.tenant_id AND km.user_id=k.invited_by
      LEFT JOIN neon_auth.member nm ON nm."organizationId"=i."organizationId" AND nm."userId"=k.invited_by
      WHERE u.id=$1 AND u."emailVerified" IS TRUE AND u.banned IS NOT TRUE AND k.accepted_at IS NULL
        AND i.role='member' AND i."inviterId"=k.invited_by AND i.status IN ('pending','accepted','rejected','canceled')
      ORDER BY k.created_at DESC LIMIT 30`, [identity.userId])).rows;
    return { invitations: rows, available: true };
  });
}
export async function manageInvitation(identity, requested, body) {
  if (body.operation === 'accept') {
    exact(body, ['operation','invitationId']); uuid(body.invitationId);
    return transaction(async db => {
      await memberships(identity.userId, db);
      // Lock registration first: one acceptance cannot create duplicate memberships or audit events.
      const record = (await db.query('SELECT tenant_id,invited_by,accepted_by,accepted_at FROM public.aigas_member_invitations WHERE invitation_id=$1 FOR UPDATE', [body.invitationId])).rows[0];
      if (!record) {
        // Under the NOBYPASSRLS runtime role the invitation row is hidden until a
        // membership exists, so acceptance needs a reviewed bootstrap path. Report
        // configuration, not a false "unknown invitation", and grant nothing.
        const posture = await connectionPrivilege(db).catch(() => ({ rlsEnforced: true }));
        if (posture.rlsEnforced) throw new KernelError(503, 'INVITATION_BOOTSTRAP_REQUIRED', 'قبول الدعوة يتطلب مسار تهيئة معتمدًا قبل تفعيل دور التشغيل المقيد. لم تُمنح أي عضوية.');
        throw new KernelError(403, 'INVALID_INVITATION', 'الدعوة غير مسجلة في Kernel.');
      }
      // An invitation belongs to one identity. A row consumed by another account is
      // reported with the same generic code and is never reassigned or revealed.
      if (record.accepted_by && record.accepted_by !== identity.userId) throw new KernelError(403, 'INVALID_INVITATION', 'الدعوة غير متاحة.');
      if (record.accepted_by === identity.userId) {
        // Idempotent replay after a duplicate click or a session refresh. Any current
        // Kernel role is returned as-is; this path never upgrades a role.
        const membership = (await db.query('SELECT role FROM public.aigas_memberships WHERE tenant_id=$1 AND user_id=$2', [record.tenant_id, identity.userId])).rows[0];
        if (membership) return { persisted: true, tenantId: record.tenant_id, role: membership.role, idempotent: true };
        // The membership was revoked after acceptance. Re-accepting would re-grant
        // access without a new invitation, so the consumed invitation stays closed.
        throw new KernelError(403, 'INVITATION_ALREADY_CONSUMED', 'سبق اعتماد هذه الدعوة ثم سُحبت العضوية؛ اطلب دعوة جديدة من مالك المؤسسة أو مديرها.');
      }
      // One read binds the invitation to this verified identity and to the mapped
      // organization, then reports every dimension the server requires. Expiry uses
      // the database clock, not the browser or application host clock.
      const detail = (await db.query(`SELECT i.status,i.role,i."expiresAt"<=now() AS is_expired,
          u.id AS user_id,u."emailVerified" IS TRUE AS email_verified,u.banned IS TRUE AS banned,
          km.role AS kernel_inviter_role,nm.role AS native_inviter_role,tm.role AS target_native_role
        FROM neon_auth.invitation i
        JOIN public.aigas_auth_organizations o ON o.organization_id=i."organizationId" AND o.tenant_id=$2
        JOIN neon_auth."user" u ON lower(u.email)=lower(i.email)
        LEFT JOIN public.aigas_memberships km ON km.tenant_id=o.tenant_id AND km.user_id=i."inviterId"
        LEFT JOIN neon_auth.member nm ON nm."organizationId"=o.organization_id AND nm."userId"=i."inviterId"
        LEFT JOIN neon_auth.member tm ON tm."organizationId"=o.organization_id AND tm."userId"=u.id
        WHERE i.id=$1 AND i."inviterId"=$3`, [body.invitationId, record.tenant_id, record.invited_by])).rows[0];
      // Same generic answer whether the invitation is missing, bound to another
      // email, or registered to another organization.
      if (!detail || detail.user_id !== identity.userId) throw new KernelError(403, 'INVALID_INVITATION', 'الدعوة غير متاحة.');
      if (detail.is_expired === true) throw new KernelError(410, 'INVITATION_EXPIRED', 'انتهت مدة الدعوة؛ اطلب دعوة جديدة من مالك المؤسسة أو مديرها.');
      if (['canceled','rejected','expired'].includes(detail.status)) throw new KernelError(403, 'INVITATION_REVOKED', 'أُلغيت الدعوة أو رُفضت؛ لم تُمنح عضوية.');
      if (detail.banned === true) throw new KernelError(403, 'IDENTITY_NOT_VERIFIED', 'الحساب غير مؤهل لقبول الدعوة؛ تواصل مع مالك المؤسسة.');
      if (detail.email_verified !== true) throw new KernelError(403, 'IDENTITY_NOT_VERIFIED', 'وثّق بريدك الإلكتروني أولًا ثم أعد المحاولة؛ لم تُمنح عضوية.');
      // The invitation role is fixed to member at creation; an unexpected value is
      // rejected instead of being mapped to a higher Kernel role.
      if (detail.role !== 'member') throw new KernelError(403, 'INVALID_INVITATION', 'دور الدعوة غير صالح؛ اطلب دعوة جديدة.');
      // Authority is re-read at acceptance time: losing OWNER/ADMIN ends the pending
      // invitation's authority even if the provider still shows it as accepted.
      if (!['OWNER','ADMIN'].includes(detail.kernel_inviter_role ?? '')) throw new KernelError(403, 'INVITER_AUTHORITY_REVOKED', 'لم تعد صلاحية الداعي تسمح بإنهاء العضوية.');
      if (!['owner','admin'].includes(detail.native_inviter_role ?? '')) throw new KernelError(403, 'INVITER_AUTHORITY_REVOKED', 'لم تعد صلاحية الداعي تسمح بإنهاء العضوية.');
      if (detail.status !== 'accepted') throw new KernelError(409, 'INVITATION_NOT_ACCEPTED', 'أكمل قبول الدعوة لدى Auth بالبريد الموثّق ثم أعد المحاولة؛ لم تُمنح عضوية.');
      // The provider must also show this identity as a member of the mapped
      // organization. The Kernel role stays MEMBER regardless of that native role.
      if (!detail.target_native_role) throw new KernelError(409, 'INVITATION_NOT_ACCEPTED', 'لم يُسجل قبول العضوية لدى Auth بعد؛ أكمل القبول ثم أعد المحاولة. لم تُمنح عضوية.');
      try {
        // Membership starts as MEMBER only. ON CONFLICT never rewrites an existing
        // row, so a co-member cannot promote themselves through this path.
        await db.query("INSERT INTO public.aigas_memberships(tenant_id,user_id,role) VALUES($1,$2,'MEMBER') ON CONFLICT DO NOTHING", [record.tenant_id, identity.userId]);
        // The registration is consumed exactly once. A concurrent acceptance that
        // already consumed it is reported as idempotent, never granted twice.
        const consumed = await db.query('UPDATE public.aigas_member_invitations SET accepted_by=$2,accepted_at=now() WHERE invitation_id=$1 AND accepted_by IS NULL RETURNING accepted_at', [body.invitationId, identity.userId]);
        if (!consumed.rowCount) {
          const membership = (await db.query('SELECT role FROM public.aigas_memberships WHERE tenant_id=$1 AND user_id=$2', [record.tenant_id, identity.userId])).rows[0];
          if (membership) return { persisted: true, tenantId: record.tenant_id, role: membership.role, idempotent: true };
          throw new KernelError(409, 'INVITATION_ALREADY_CONSUMED', 'تعذر تأكيد اعتماد الدعوة؛ حدّث القائمة قبل إعادة المحاولة.');
        }
        await audit(db, identity, record.tenant_id, 'kernel.invitation.accepted', auditContext());
      } catch (error) {
        if (error?.code === '42501') throw new KernelError(503, 'INVITATION_BOOTSTRAP_REQUIRED', 'قبول الدعوة يتطلب مسار تهيئة معتمدًا قبل تفعيل دور التشغيل المقيد. لم تُمنح أي عضوية.');
        throw error;
      }
      return { persisted: true, tenantId: record.tenant_id, role: 'MEMBER' };
    });
  }
  if (body.operation === 'cancel') {
    exact(body, ['operation','invitationId']); uuid(body.invitationId);
    return transaction(async db => {
      const { tenant } = await adminScope(db, identity, requested, ['OWNER','ADMIN']);
      const record = (await db.query('SELECT accepted_at,accepted_by FROM public.aigas_member_invitations WHERE invitation_id=$1 AND tenant_id=$2 FOR UPDATE', [body.invitationId, tenant.tenant_id])).rows[0];
      if (!record) throw new KernelError(404, 'INVITATION_NOT_FOUND', 'الدعوة غير مسجلة لهذه المؤسسة.');
      if (record.accepted_at || record.accepted_by) throw new KernelError(409, 'INVITATION_ALREADY_ACCEPTED', 'الدعوة مقبولة؛ لا يمكن إلغاؤها من هذه الشاشة.');
      // The browser performs the provider cancellation. The server only records it after
      // reading the real provider state for this tenant's mapped organization; a pending
      // invitation is never treated as canceled.
      const provider = (await db.query(`SELECT i.status FROM neon_auth.invitation i
        JOIN public.aigas_auth_organizations o ON o.organization_id=i."organizationId" AND o.tenant_id=$2
        WHERE i.id=$1`, [body.invitationId, tenant.tenant_id])).rows[0];
      if (!provider || provider.status !== 'canceled') throw new KernelError(409, 'CANCELLATION_NOT_CONFIRMED', 'لم يؤكد Auth إلغاء الدعوة. ألغِها من إدارة الدعوات ثم أعد المحاولة.');
      await audit(db, identity, tenant.tenant_id, 'kernel.invitation.canceled', auditContext());
      return { persisted: true, status: 'canceled' };
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
      await audit(db, identity, tenant.tenant_id, 'kernel.auth.linked', auditContext());
      return { persisted: true };
    }
    if (body.operation !== 'register') throw new KernelError(400, 'INVALID_OPERATION', 'عملية الدعوة غير مدعومة.');
    exact(body, ['operation','invitationId']); uuid(body.invitationId);
    const valid = (await db.query(`SELECT i.id FROM neon_auth.invitation i JOIN public.aigas_auth_organizations o ON o.organization_id=i."organizationId" JOIN neon_auth.member m ON m."organizationId"=o.organization_id AND m."userId"=$2 WHERE i.id=$1 AND o.tenant_id=$3 AND i."inviterId"=$2 AND i.role='member' AND i.status='pending' AND i."expiresAt">now() AND m.role IN ('owner','admin')`, [body.invitationId, identity.userId, tenant.tenant_id])).rows[0];
    if (!valid) throw new KernelError(403, 'INVALID_INVITATION', 'لا توجد دعوة معلقة صحيحة من حسابك بدور عضو للمؤسسة المحددة.');
    const result = await db.query('INSERT INTO public.aigas_member_invitations(invitation_id,tenant_id,invited_by) VALUES($1,$2,$3) ON CONFLICT DO NOTHING RETURNING invitation_id', [body.invitationId, tenant.tenant_id, identity.userId]);
    if (result.rowCount) await audit(db, identity, tenant.tenant_id, 'kernel.invitation.created', auditContext());
    return { persisted: true, delivery: 'NOT_CONFIRMED' };
  });
}
