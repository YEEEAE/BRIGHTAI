import { randomUUID } from 'node:crypto';
import { transaction } from '../kernel/db.mjs';
import { tenantGuard, audit } from '../kernel/service.mjs';
import { KernelError, requireRole } from '../kernel/core.mjs';
import { templates, evaluate, inputText } from './core.mjs';
export function createFirewallService(transact = transaction) {
  return async function operate(identity, requested, operation, body = {}, filter = '') {
    if (!['dashboard', 'create', 'toggle', 'evaluate'].includes(operation)) throw new KernelError(404, 'NOT_FOUND', 'المسار غير موجود.');
    if (filter && !['ALLOW','BLOCK','REDACT'].includes(filter)) throw new KernelError(400, 'INVALID_FILTER', 'تصفية غير صالحة.');
    return transact(async db => {
      const scope = await tenantGuard(identity, requested, db);
      if (!scope.tenant) throw new KernelError(403, 'NO_WORKSPACE', 'أنشئ مساحة عمل من Kernel أولًا.');
      const tenantId = scope.tenant.tenant_id;
      // Serialize policy changes and evaluation within each tenant.
      await db.query('SELECT id FROM public.aigas_tenants WHERE id=$1 FOR UPDATE', [tenantId]);
      const member = (await db.query('SELECT role FROM public.aigas_memberships WHERE tenant_id=$1 AND user_id=$2 FOR SHARE', [tenantId, identity.userId])).rows[0];
      if (!member) throw new KernelError(403, 'FORBIDDEN', 'عضويتك لم تعد متاحة.');
      if (operation === 'create' || operation === 'toggle') requireRole(member, ['OWNER','ADMIN']);
      if (operation === 'create') {
        const t = Object.hasOwn(templates, body.template) ? templates[body.template] : null;
        if (!t) throw new KernelError(400, 'INVALID_TEMPLATE', 'اختر قالب قاعدة معتمدًا.');
        const inserted = await db.query('INSERT INTO public.aigas_fw_rules (id,tenant_id,template,name,match_type,pattern,action) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (tenant_id,template) DO NOTHING RETURNING id', [randomUUID(),tenantId,body.template,t.name,t.match_type,t.pattern,t.action]);
        if (!inserted.rowCount) throw new KernelError(409, 'RULE_EXISTS', 'القاعدة موجودة؛ يمكنك تفعيلها من القائمة.');
        await audit(db,identity,tenantId,'firewall.rule.created');
      }
      if (operation === 'toggle') {
        if (typeof body.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.id) || typeof body.enabled !== 'boolean' || !Number.isInteger(body.version)) throw new KernelError(400,'INVALID_RULE','بيانات القاعدة غير صالحة.');
        const updated = await db.query('UPDATE public.aigas_fw_rules SET enabled=$3,version=version+1,updated_at=now() WHERE tenant_id=$1 AND id=$2 AND version=$4 RETURNING id', [tenantId,body.id,body.enabled,body.version]);
        if (!updated.rowCount) throw new KernelError(409,'RULE_CHANGED','تغيرت القاعدة أو لم تعد متاحة؛ حدّث القائمة.');
        await audit(db,identity,tenantId,'firewall.rule.toggled');
      }
      const rules = (await db.query('SELECT id,name,template,match_type,pattern,action,enabled,version,created_at,updated_at FROM public.aigas_fw_rules WHERE tenant_id=$1 ORDER BY created_at,id', [tenantId])).rows;
      if (operation === 'evaluate') {
        const result = evaluate(inputText(body.text),rules);
        const id = randomUUID();
        // Explicit metadata fields: never pass the text or output to the database.
        await db.query('INSERT INTO public.aigas_fw_decisions (id,tenant_id,action,reason,rule_id,rule_version) VALUES ($1,$2,$3,$4,$5,$6)', [id,tenantId,result.action,result.reason,result.rule_id,result.rule_version]);
        return { ...result, id, persisted: true };
      }
      const counts = (await db.query('SELECT action,count(*)::int AS count FROM public.aigas_fw_decisions WHERE tenant_id=$1 GROUP BY action',[tenantId])).rows;
      const decisions = (await db.query("SELECT id,created_at,action,reason,rule_id,rule_version FROM public.aigas_fw_decisions WHERE tenant_id=$1 AND ($2='' OR action=$2) ORDER BY created_at DESC,id DESC LIMIT 10",[tenantId,filter])).rows;
      return { tenant: scope.tenant, memberships: scope.memberships, canManage: ['OWNER','ADMIN'].includes(member.role), rules, counts, decisions };
    });
  };
}
export const operate = createFirewallService();
