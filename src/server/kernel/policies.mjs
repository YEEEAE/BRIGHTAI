import { createHash, randomUUID } from 'node:crypto';
import { KernelError, requireRole } from './core.mjs';
import { tenantGuard, audit } from './service.mjs';
import { transaction } from './db.mjs';

const scopes = ['ENTERPRISE','DEPARTMENT','PRODUCT','USER'];
const effects = ['ALLOW','BLOCK','HARD_DENY','REDACT','REQUEST_APPROVAL','WARN'];
const products = ['firewall','ledger','human-gate','risk-engine','secure-chat'];
const fields = ['operation','resource_type','data_classification','provider','model','region'];
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const text = (value, min, max, code) => {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max || /[\u0000-\u001f\u007f]/.test(value)) throw new KernelError(400, code, 'قيمة السياسة غير صالحة.');
  return value.trim();
};
function validateDefinition(body) {
  const definition = body.definition;
  if (!definition || typeof definition !== 'object' || Array.isArray(definition)) throw new KernelError(400,'INVALID_POLICY','تعريف السياسة غير صالح.');
  const { scope, departmentId = null, productSlug = null, userId = null, family, ruleKey, conditions = {}, effect, obligations = [], mandatory = false, effectiveFrom = null, expiresAt = null, reason } = definition;
  if (!scopes.includes(scope) || !effects.includes(effect)) throw new KernelError(400,'INVALID_POLICY','نطاق السياسة أو أثرها غير مدعوم.');
  if (scope === 'DEPARTMENT' ? !uuid.test(departmentId ?? '') : departmentId !== null) throw new KernelError(400,'INVALID_POLICY','مرجع الإدارة لا يطابق نطاق السياسة.');
  if (scope === 'PRODUCT' ? !products.includes(productSlug) : productSlug !== null) throw new KernelError(400,'INVALID_POLICY','مرجع المنتج لا يطابق نطاق السياسة.');
  if (scope === 'USER' ? !uuid.test(userId ?? '') : userId !== null) throw new KernelError(400,'INVALID_POLICY','مرجع المستخدم لا يطابق نطاق السياسة.');
  if (!conditions || typeof conditions !== 'object' || Array.isArray(conditions) || Object.keys(conditions).some(key => !fields.includes(key)) || Object.values(conditions).some(value => typeof value !== 'string' || !value.trim() || value.length > 120)) throw new KernelError(400,'INVALID_POLICY','شروط السياسة يجب أن تكون حقول سياق حرفية محدودة.');
  if (!Array.isArray(obligations) || obligations.some(item => !['REDACT','REQUEST_APPROVAL','WARN'].includes(item))) throw new KernelError(400,'INVALID_POLICY','التزامات السياسة غير صالحة.');
  if (typeof mandatory !== 'boolean') throw new KernelError(400,'INVALID_POLICY','حالة إلزامية السياسة غير صالحة.');
  const parseDate = value => value === null ? null : (typeof value === 'string' && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : (() => { throw new KernelError(400,'INVALID_POLICY','تاريخ نفاذ السياسة غير صالح.'); })());
  const starts = parseDate(effectiveFrom), ends = parseDate(expiresAt);
  if (starts && ends && ends <= starts) throw new KernelError(400,'INVALID_POLICY','انتهاء السياسة يجب أن يأتي بعد بدء نفاذها.');
  return { scope, departmentId, productSlug, userId, family: text(family,2,80,'INVALID_POLICY'), ruleKey: text(ruleKey,2,100,'INVALID_POLICY'), conditions, effect, obligations: [...new Set(obligations)], mandatory: mandatory || effect === 'HARD_DENY', effectiveFrom: starts, expiresAt: ends, reason: text(reason,3,500,'INVALID_REASON') };
}
const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value==='object' ? Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])])) : value;
const checksum = value => createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');
const signedFields = (conditions,effect,obligations,mandatory) => ({conditions,effect,obligations,mandatory});
async function scoped(db, identity, workspace, roles = ['OWNER']) {
  const result = await tenantGuard(identity, workspace, db);
  if (!result.tenant) throw new KernelError(403,'NO_WORKSPACE','أنشئ مساحة عمل من Kernel أولًا.');
  const member = (await db.query('SELECT role FROM public.aigas_memberships WHERE tenant_id=$1 AND user_id=$2 FOR UPDATE', [result.tenant.tenant_id, identity.userId])).rows[0];
  requireRole(member, roles);
  return result.tenant;
}
function versionValues(d, identity) {
  return [JSON.stringify(d.conditions),d.effect,d.obligations,d.mandatory,d.effectiveFrom,d.expiresAt,checksum(signedFields(d.conditions,d.effect,d.obligations,d.mandatory)),d.reason,identity.userId];
}
export async function policyOperation(identity, workspace, body) {
  const op = body.operation;
  if (!['list','history','department-create','department-member-add','department-member-remove','delegate-approver','revoke-approver','create','revise','submit','approve','publish','retire'].includes(op)) throw new KernelError(404,'NOT_FOUND','عملية سياسة غير موجودة.');
  const topLevelKeys = op==='create' ? ['operation','definition'] : op==='revise' ? ['operation','definition','policyId','expectedVersion'] : op==='department-create' ? ['operation','name','reason'] : op==='department-member-add'||op==='department-member-remove' ? ['operation','departmentId','userId','reason'] : op==='delegate-approver' ? ['operation','userId','expiresAt','reason'] : op==='revoke-approver' ? ['operation','userId','reason'] : op==='list' ? ['operation'] : op==='history' ? ['operation','policyId'] : op==='publish' ? ['operation','policyId','version','expectedVersion','reason'] : ['operation','policyId','version','reason'];
  if (Object.keys(body).some(key=>!topLevelKeys.includes(key))) throw new KernelError(400,'INVALID_BODY','حقول الطلب غير مسموحة.');
  return transaction(async db => {
    const reviewRead=op==='list'||op==='history';
    const tenant = await scoped(db, identity, workspace, op==='approve'||reviewRead?['OWNER','ADMIN']:['OWNER']), tenantId = tenant.tenant_id;
    if (tenant.role==='ADMIN' && reviewRead && !(await db.query("SELECT 1 FROM public.aigas_policy_delegations WHERE tenant_id=$1 AND delegate_user_id=$2 AND action='APPROVE' AND revoked_at IS NULL AND expires_at>now()",[tenantId,identity.userId])).rowCount) throw new KernelError(403,'POLICY_APPROVAL_NOT_DELEGATED','لم يفوضك مالك المؤسسة لمراجعة السياسات.');
    await db.query('SELECT id FROM public.aigas_tenants WHERE id=$1 FOR UPDATE',[tenantId]);
    const reason = body.reason === undefined ? '' : text(body.reason,3,500,'INVALID_REASON');
    const record = async (policyId, version, action, why) => db.query('INSERT INTO public.aigas_policy_approvals(id,tenant_id,policy_id,version,action,actor_user_id,reason) VALUES($1,$2,$3,$4,$5,$6,$7)',[randomUUID(),tenantId,policyId,version,action,identity.userId,why]);
    if (op === 'list') {
      const rows = await db.query(`SELECT p.id,p.scope,p.department_id,p.product_slug,p.user_id,p.policy_family,p.rule_key,p.owner_user_id,p.current_version,v.status,v.effect,v.is_mandatory,v.effective_from,v.expires_at,v.checksum,v.change_reason,v.created_at,v.approved_by,v.published_at
        FROM public.aigas_policies p LEFT JOIN public.aigas_policy_versions v ON v.tenant_id=p.tenant_id AND v.policy_id=p.id AND v.version=COALESCE((SELECT max(v2.version) FROM public.aigas_policy_versions v2 WHERE v2.tenant_id=p.tenant_id AND v2.policy_id=p.id),0)
        WHERE p.tenant_id=$1 ORDER BY p.created_at DESC,p.id`,[tenantId]);
      const departments=(await db.query("SELECT d.id,d.name,d.status,d.created_at,count(dm.user_id) FILTER (WHERE dm.status='ACTIVE')::int AS members FROM public.aigas_departments d LEFT JOIN public.aigas_department_memberships dm ON dm.tenant_id=d.tenant_id AND dm.department_id=d.id WHERE d.tenant_id=$1 GROUP BY d.id ORDER BY d.name,d.id",[tenantId])).rows;
      const departmentMembers=(await db.query('SELECT department_id,user_id,status,created_by,created_at FROM public.aigas_department_memberships WHERE tenant_id=$1 ORDER BY department_id,user_id',[tenantId])).rows;
      const delegations=(await db.query("SELECT delegate_user_id,action,expires_at,granted_by,grant_reason,revoked_at,revoke_reason,created_at FROM public.aigas_policy_delegations WHERE tenant_id=$1 ORDER BY created_at DESC,delegate_user_id",[tenantId])).rows;
      const configured=(await db.query("SELECT EXISTS(SELECT 1 FROM public.aigas_policy_versions v JOIN public.aigas_policies p ON p.tenant_id=v.tenant_id AND p.id=v.policy_id AND p.current_version=v.version WHERE p.tenant_id=$1 AND v.status='PUBLISHED' AND (v.effective_from IS NULL OR v.effective_from<=now()) AND (v.expires_at IS NULL OR v.expires_at>now())) AS ready",[tenantId])).rows[0].ready;
      return { policies: rows.rows, departments, departmentMembers, delegations, engineState:configured?'CONFIGURED':'NOT_CONFIGURED' };
    }
    if (op==='history') {
      if (!uuid.test(body.policyId ?? '')) throw new KernelError(400,'INVALID_ID','معرف السياسة غير صالح.');
      const versions=(await db.query('SELECT version,status,conditions,effect,obligations,is_mandatory,effective_from,expires_at,checksum,change_reason,created_by,approved_by,created_at,published_at FROM public.aigas_policy_versions WHERE tenant_id=$1 AND policy_id=$2 ORDER BY version DESC',[tenantId,body.policyId])).rows;
      if (!versions.length) throw new KernelError(404,'POLICY_NOT_FOUND','السياسة غير موجودة.');
      const approvals=(await db.query('SELECT version,action,actor_user_id,reason,created_at FROM public.aigas_policy_approvals WHERE tenant_id=$1 AND policy_id=$2 ORDER BY created_at, id',[tenantId,body.policyId])).rows;
      return {policyId:body.policyId,versions,approvals};
    }
    if (op === 'department-create') {
      const name=text(body.name,2,100,'INVALID_DEPARTMENT');
      const departmentReason=text(body.reason,3,500,'INVALID_REASON');
      const id=randomUUID();
      await db.query('INSERT INTO public.aigas_departments(id,tenant_id,name,created_by) VALUES($1,$2,$3,$4)',[id,tenantId,name,identity.userId]);
      await db.query("INSERT INTO public.aigas_department_events(id,tenant_id,department_id,actor_user_id,action,reason) VALUES($1,$2,$3,$4,'CREATED',$5)",[randomUUID(),tenantId,id,identity.userId,departmentReason]);
      await audit(db,identity,tenantId,'kernel.department.created');
      return {departmentId:id,status:'ACTIVE'};
    }
    if (op === 'department-member-add' || op === 'department-member-remove') {
      if (!uuid.test(body.departmentId ?? '') || !uuid.test(body.userId ?? '')) throw new KernelError(400,'INVALID_DEPARTMENT_MEMBER','مرجع العضوية غير صالح.');
      const membershipReason=text(body.reason,3,500,'INVALID_REASON');
      if (!(await db.query("SELECT 1 FROM public.aigas_departments WHERE tenant_id=$1 AND id=$2 AND status='ACTIVE'",[tenantId,body.departmentId])).rowCount) throw new KernelError(404,'DEPARTMENT_NOT_FOUND','الإدارة غير موجودة.');
      if (!(await db.query('SELECT 1 FROM public.aigas_memberships m JOIN neon_auth."user" u ON u.id=m.user_id WHERE m.tenant_id=$1 AND m.user_id=$2 AND u.banned IS NOT TRUE',[tenantId,body.userId])).rowCount) throw new KernelError(400,'USER_NOT_MEMBER','المستخدم ليس عضوًا نشطًا في المؤسسة.');
      if (op==='department-member-add') await db.query("INSERT INTO public.aigas_department_memberships(tenant_id,department_id,user_id,created_by) VALUES($1,$2,$3,$4) ON CONFLICT(tenant_id,department_id,user_id) DO UPDATE SET status='ACTIVE',created_by=EXCLUDED.created_by,created_at=clock_timestamp()",[tenantId,body.departmentId,body.userId,identity.userId]);
      else await db.query("UPDATE public.aigas_department_memberships SET status='REVOKED' WHERE tenant_id=$1 AND department_id=$2 AND user_id=$3",[tenantId,body.departmentId,body.userId]);
      await db.query("INSERT INTO public.aigas_department_events(id,tenant_id,department_id,actor_user_id,subject_user_id,action,reason) VALUES($1,$2,$3,$4,$5,$6,$7)",[randomUUID(),tenantId,body.departmentId,identity.userId,body.userId,op==='department-member-add'?'MEMBER_ADDED':'MEMBER_REVOKED',membershipReason]);
      await audit(db,identity,tenantId,op==='department-member-add'?'kernel.department.member.added':'kernel.department.member.revoked');
      return {departmentId:body.departmentId,userId:body.userId,status:op==='department-member-add'?'ACTIVE':'REVOKED'};
    }
    if (op==='delegate-approver' || op==='revoke-approver') {
      if (!uuid.test(body.userId ?? '')) throw new KernelError(400,'INVALID_DELEGATE','معرف المفوض غير صالح.');
      const delegationReason=text(body.reason,3,500,'INVALID_REASON');
      if (op==='delegate-approver') {
        if (typeof body.expiresAt!=='string'||!Number.isFinite(Date.parse(body.expiresAt))) throw new KernelError(400,'INVALID_DELEGATE','تاريخ انتهاء التفويض غير صالح.');
        const expiresAt=new Date(body.expiresAt).toISOString();
        const expiryTime=Date.parse(expiresAt), now=Date.now();
        if (expiryTime<=now || expiryTime>now+90*24*60*60*1000-60000) throw new KernelError(400,'INVALID_DELEGATE','يجب أن ينتهي التفويض خلال 90 يومًا من الآن.');
        const result=await db.query("INSERT INTO public.aigas_policy_delegations(tenant_id,delegate_user_id,action,expires_at,granted_by,grant_reason) SELECT $1,$2,'APPROVE',$3,$4,$5 WHERE EXISTS(SELECT 1 FROM public.aigas_memberships WHERE tenant_id=$1 AND user_id=$2 AND role='ADMIN') ON CONFLICT(tenant_id,delegate_user_id,action) DO UPDATE SET expires_at=EXCLUDED.expires_at,granted_by=EXCLUDED.granted_by,grant_reason=EXCLUDED.grant_reason,created_at=clock_timestamp(),revoked_at=NULL,revoke_reason=NULL RETURNING delegate_user_id",[tenantId,body.userId,expiresAt,identity.userId,delegationReason]);
        if (!result.rowCount) throw new KernelError(400,'ADMIN_REQUIRED','التفويض يقتصر على عضو بدور ADMIN في المؤسسة.');
        await audit(db,identity,tenantId,'kernel.policy.approver.delegated');
        return {userId:body.userId,action:'APPROVE',expiresAt,status:'ACTIVE'};
      }
      await db.query("UPDATE public.aigas_policy_delegations SET revoked_at=clock_timestamp(),revoke_reason=$3 WHERE tenant_id=$1 AND delegate_user_id=$2 AND action='APPROVE' AND revoked_at IS NULL",[tenantId,body.userId,delegationReason]);
      await audit(db,identity,tenantId,'kernel.policy.approver.revoked');
      return {userId:body.userId,action:'APPROVE',status:'REVOKED'};
    }
    if (op === 'create' || op === 'revise') {
      const allowedDefinition=['scope','departmentId','productSlug','userId','family','ruleKey','conditions','effect','obligations','mandatory','effectiveFrom','expiresAt','reason'];
      if (Object.keys(body.definition ?? {}).some(key=>!allowedDefinition.includes(key))) throw new KernelError(400,'INVALID_POLICY','حقول تعريف السياسة غير مسموحة.');
      const d = validateDefinition(body);
      if (d.scope==='DEPARTMENT') {
        const exists=(await db.query("SELECT 1 FROM public.aigas_departments WHERE tenant_id=$1 AND id=$2 AND status='ACTIVE'",[tenantId,d.departmentId])).rowCount;
        if (!exists) throw new KernelError(400,'DEPARTMENT_NOT_AVAILABLE','الإدارة غير متاحة داخل المؤسسة.');
      }
      if (d.scope==='USER' && !(await db.query('SELECT 1 FROM public.aigas_memberships m JOIN neon_auth."user" u ON u.id=m.user_id WHERE m.tenant_id=$1 AND m.user_id=$2 AND u.banned IS NOT TRUE',[tenantId,d.userId])).rowCount) throw new KernelError(400,'USER_NOT_MEMBER','المستخدم ليس عضوًا نشطًا في المؤسسة.');
      let policyId, version=1;
      if (op==='create') {
        policyId=randomUUID();
        await db.query('INSERT INTO public.aigas_policies(id,tenant_id,scope,department_id,product_slug,user_id,policy_family,rule_key,owner_user_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',[policyId,tenantId,d.scope,d.departmentId,d.productSlug,d.userId,d.family,d.ruleKey,identity.userId]);
      } else {
        if (!uuid.test(body.policyId ?? '') || !Number.isInteger(body.expectedVersion) || body.expectedVersion < 0) throw new KernelError(400,'INVALID_POLICY_VERSION','معرف السياسة ورقم النسخة المتوقعة مطلوبان.');
        policyId=body.policyId;
        const p=(await db.query('SELECT current_version,scope,department_id,product_slug,user_id,policy_family,rule_key FROM public.aigas_policies WHERE tenant_id=$1 AND id=$2 FOR UPDATE',[tenantId,policyId])).rows[0];
        if (!p || p.current_version!==body.expectedVersion) throw new KernelError(409,'POLICY_CHANGED','تغيرت السياسة؛ حدّث القائمة قبل التعديل.');
        if (p.scope!==d.scope || p.department_id!==d.departmentId || p.product_slug!==d.productSlug || p.user_id!==d.userId || p.policy_family!==d.family || p.rule_key!==d.ruleKey) throw new KernelError(409,'POLICY_IDENTITY_IMMUTABLE','نطاق السياسة ومفتاحها ثابتان؛ أنشئ سياسة جديدة للتغيير.');
        if (p.current_version>0) {
          const current=(await db.query('SELECT effect,is_mandatory FROM public.aigas_policy_versions WHERE tenant_id=$1 AND policy_id=$2 AND version=$3',[tenantId,policyId,p.current_version])).rows[0];
          if (current?.effect==='HARD_DENY'||current?.is_mandatory) throw new KernelError(409,'MANDATORY_POLICY_IMMUTABLE','لا يمكن استبدال أو تخفيف نسخة إلزامية؛ أنشئ قاعدة إضافية أشد عند الحاجة.');
        }
        version=(await db.query('SELECT COALESCE(max(version),0)::int+1 AS next FROM public.aigas_policy_versions WHERE tenant_id=$1 AND policy_id=$2',[tenantId,policyId])).rows[0].next;
      }
      const vals=versionValues(d,identity);
      await db.query('INSERT INTO public.aigas_policy_versions(tenant_id,policy_id,version,status,conditions,effect,obligations,is_mandatory,effective_from,expires_at,checksum,change_reason,created_by) VALUES($1,$2,$3,\'DRAFT\',$4::jsonb,$5,$6,$7,$8,$9,$10,$11,$12)',[tenantId,policyId,version,...vals]);
      await audit(db,identity,tenantId,op==='create'?'kernel.policy.created':'kernel.policy.revised');
      return { policyId,version,status:'DRAFT' };
    }
    if (!uuid.test(body.policyId ?? '') || !Number.isInteger(body.version) || body.version < 1) throw new KernelError(400,'INVALID_POLICY_VERSION','معرف السياسة ورقم النسخة غير صالحين.');
    const { policyId,version }=body;
    const row=(await db.query('SELECT v.status,v.created_by,v.approved_by,v.effect,v.is_mandatory,p.current_version FROM public.aigas_policy_versions v JOIN public.aigas_policies p ON p.tenant_id=v.tenant_id AND p.id=v.policy_id WHERE v.tenant_id=$1 AND v.policy_id=$2 AND v.version=$3 FOR UPDATE OF v,p',[tenantId,policyId,version])).rows[0];
    if (!row) throw new KernelError(404,'POLICY_NOT_FOUND','السياسة غير موجودة.');
    if (op==='submit' && row.status==='DRAFT' && reason) {
      await db.query("UPDATE public.aigas_policy_versions SET status='IN_REVIEW' WHERE tenant_id=$1 AND policy_id=$2 AND version=$3",[tenantId,policyId,version]);
      await record(policyId,version,'SUBMITTED',reason);
      await audit(db,identity,tenantId,'kernel.policy.submitted');
      return {policyId,version,status:'IN_REVIEW'};
    }
    if (op==='approve' && row.status==='IN_REVIEW' && reason) {
      if (row.created_by===identity.userId) throw new KernelError(403,'SEPARATION_OF_DUTIES','يلزم معتمد مختلف عن منشئ النسخة.');
      if (tenant.role==='ADMIN' && !(await db.query("SELECT 1 FROM public.aigas_policy_delegations WHERE tenant_id=$1 AND delegate_user_id=$2 AND action='APPROVE' AND revoked_at IS NULL AND expires_at>now() FOR SHARE",[tenantId,identity.userId])).rowCount) throw new KernelError(403,'POLICY_APPROVAL_NOT_DELEGATED','لم يفوضك مالك المؤسسة لاعتماد السياسات.');
      await db.query("UPDATE public.aigas_policy_versions SET status='APPROVED',approved_by=$4 WHERE tenant_id=$1 AND policy_id=$2 AND version=$3",[tenantId,policyId,version,identity.userId]);
      await record(policyId,version,'APPROVED',reason);
      await audit(db,identity,tenantId,'kernel.policy.approved');
      return {policyId,version,status:'APPROVED'};
    }
    if (op==='publish' && row.status==='APPROVED' && row.approved_by!==identity.userId && reason && Number.isInteger(body.expectedVersion) && body.expectedVersion===row.current_version && version>row.current_version) {
      await db.query("UPDATE public.aigas_policy_versions SET status='RETIRED' WHERE tenant_id=$1 AND policy_id=$2 AND version=$3 AND status='PUBLISHED'",[tenantId,policyId,row.current_version]);
      const published=await db.query("UPDATE public.aigas_policy_versions SET status='PUBLISHED',published_at=clock_timestamp(),effective_from=COALESCE(effective_from,clock_timestamp()) WHERE tenant_id=$1 AND policy_id=$2 AND version=$3 AND status='APPROVED' RETURNING version",[tenantId,policyId,version]);
      if (!published.rowCount) throw new KernelError(409,'POLICY_CHANGED','تعذر نشر النسخة؛ حدّث الحالة.');
      await db.query('UPDATE public.aigas_policies SET current_version=$3 WHERE tenant_id=$1 AND id=$2',[tenantId,policyId,version]);
      await record(policyId,version,'PUBLISHED',reason);
      await audit(db,identity,tenantId,'kernel.policy.published');
      return {policyId,version,status:'PUBLISHED'};
    }
    if (op==='retire' && row.status==='PUBLISHED' && row.current_version===version && reason && row.effect!=='HARD_DENY' && !row.is_mandatory) {
      await db.query("UPDATE public.aigas_policy_versions SET status='RETIRED' WHERE tenant_id=$1 AND policy_id=$2 AND version=$3",[tenantId,policyId,version]);
      await db.query('UPDATE public.aigas_policies SET current_version=0 WHERE tenant_id=$1 AND id=$2',[tenantId,policyId]);
      await record(policyId,version,'RETIRED',reason);
      await audit(db,identity,tenantId,'kernel.policy.retired');
      return {policyId,version,status:'RETIRED'};
    }
    throw new KernelError(409,'POLICY_TRANSITION_INVALID','انتقال حالة السياسة غير مسموح.');
  });
}

export async function evaluateKernelPolicy(db, identity, tenantId, context) {
  const departmentId = context.departmentId ?? null;
  if (departmentId) {
    if (!uuid.test(departmentId)) return { decision:'BLOCK',reason:'CONTEXT_REQUIRED',policies:[] };
    const member=(await db.query("SELECT 1 FROM public.aigas_department_memberships WHERE tenant_id=$1 AND department_id=$2 AND user_id=$3 AND status='ACTIVE'",[tenantId,departmentId,identity.userId])).rowCount;
    if (!member) return {decision:'BLOCK',reason:'CONTEXT_REQUIRED',policies:[]};
  }
  const membership=(await db.query("SELECT department_id FROM public.aigas_department_memberships WHERE tenant_id=$1 AND user_id=$2 AND status='ACTIVE'",[tenantId,identity.userId])).rows;
  const contextJson=JSON.stringify({operation:context.operation,product_slug:context.productSlug,resource_type:context.resource_type});
  const hasDepartmentPolicies=(await db.query(`SELECT 1 FROM public.aigas_policies p JOIN public.aigas_policy_versions v ON v.tenant_id=p.tenant_id AND v.policy_id=p.id AND v.version=p.current_version
    WHERE p.tenant_id=$1 AND p.scope='DEPARTMENT' AND p.department_id IN (SELECT department_id FROM public.aigas_department_memberships WHERE tenant_id=$1 AND user_id=$2 AND status='ACTIVE')
      AND v.status='PUBLISHED' AND (v.conditions->>'operation' IS NULL OR v.conditions->>'operation'=($3::jsonb)->>'operation')
      AND (v.conditions->>'resource_type' IS NULL OR v.conditions->>'resource_type'=($3::jsonb)->>'resource_type')
      AND (v.effective_from IS NULL OR v.effective_from<=now()) AND (v.expires_at IS NULL OR v.expires_at>now()) LIMIT 1`,[tenantId,identity.userId,contextJson])).rowCount>0;
  if (!departmentId && membership.length && hasDepartmentPolicies) return {decision:'BLOCK',reason:'CONTEXT_REQUIRED',policies:[]};
  const rows=(await db.query(`SELECT p.id,p.scope,p.department_id,p.product_slug,p.user_id,v.version,v.conditions,v.effect,v.obligations,v.is_mandatory,v.checksum
    FROM public.aigas_policies p JOIN public.aigas_policy_versions v ON v.tenant_id=p.tenant_id AND v.policy_id=p.id AND v.version=p.current_version
    WHERE p.tenant_id=$1 AND v.status='PUBLISHED' AND (v.effective_from IS NULL OR v.effective_from<=now()) AND (v.expires_at IS NULL OR v.expires_at>now())
      AND (p.scope='ENTERPRISE' OR (p.scope='DEPARTMENT' AND p.department_id=$2) OR (p.scope='PRODUCT' AND p.product_slug=$3) OR (p.scope='USER' AND p.user_id=$4))
      AND (p.product_slug IS NULL OR p.product_slug=$3)
    ORDER BY CASE p.scope WHEN 'ENTERPRISE' THEN 0 WHEN 'DEPARTMENT' THEN 1 WHEN 'PRODUCT' THEN 2 ELSE 3 END,p.id`,[tenantId,departmentId,context.productSlug,identity.userId])).rows;
  const active=[];
  for (const row of rows) {
    const conditions=Object.entries(row.conditions ?? {});
    if (conditions.some(([key,value])=>context[key]!==undefined&&context[key]!==value)) continue;
    if (conditions.some(([key])=>context[key]===undefined)) return {decision:'BLOCK',reason:'POLICY_CONTEXT_INCOMPLETE',policies:[]};
    active.push(row);
  }
  if (active.some(row=>row.checksum!==checksum(signedFields(row.conditions,row.effect,row.obligations,row.is_mandatory)))) return {decision:'BLOCK',reason:'POLICY_INTEGRITY_FAILED',policies:[]};
  if (!active.length) return {decision:'BLOCK',reason:'POLICY_UNAVAILABLE',policies:[]};
  const evidence=active.map(row=>({policy_id:row.id,scope:row.scope,version:row.version,checksum:row.checksum}));
  if (active.some(row=>row.effect==='HARD_DENY'||row.effect==='BLOCK')) return {decision:'BLOCK',reason:'HARD_DENY',policies:evidence};
  const obligations=[...new Set(active.flatMap(row=>row.obligations ?? []))];
  for (const row of active) if (row.effect==='REDACT'||row.effect==='REQUEST_APPROVAL'||row.effect==='WARN') obligations.push(row.effect);
  const unsupported=[...new Set(obligations)].filter(item=>item!=='WARN');
  if (unsupported.length) return {decision:'BLOCK',reason:'POLICY_OBLIGATION_UNAVAILABLE',obligations:unsupported,policies:evidence};
  if (!active.some(row=>row.scope==='ENTERPRISE'&&row.effect==='ALLOW')) return {decision:'BLOCK',reason:'POLICY_UNAVAILABLE',policies:evidence};
  const warnings=active.filter(row=>row.effect==='WARN'||row.obligations?.includes('WARN')).map(row=>({policy_id:row.id,scope:row.scope,version:row.version}));
  return {decision:'ALLOW',reason:'POLICY_ALLOW',warnings,policies:evidence};
}
