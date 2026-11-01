import { randomUUID } from 'node:crypto';
import { transaction } from '../kernel/db.mjs';
import { tenantGuard, audit } from '../kernel/service.mjs';
import { KernelError, requireRole } from '../kernel/core.mjs';
import { templates, evaluate, inputText, actions, reasons, ruleName, rulePattern, ruleAction, rulePriority, MAX_RULES } from './core.mjs';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const editableFields = ['name', 'pattern', 'action', 'priority'];
const uniqueName = error => error?.code === '23505';

export function createFirewallService(transact = transaction) {
  return async function operate(identity, requested, operation, body = {}, query = '') {
    if (!['dashboard', 'create', 'update', 'evaluate'].includes(operation)) throw new KernelError(404, 'NOT_FOUND', 'المسار غير موجود.');
    const action = typeof query === 'string' ? query : query?.action ?? '';
    const reason = typeof query === 'object' && query ? query.reason ?? '' : '';
    if (action && !actions.includes(action)) throw new KernelError(400, 'INVALID_FILTER', 'تصفية الإجراء غير صالحة.');
    if (reason && !Object.hasOwn(reasons, reason)) throw new KernelError(400, 'INVALID_FILTER', 'تصفية السبب غير صالحة.');
    return transact(async db => {
      const scope = await tenantGuard(identity, requested, db);
      if (!scope.tenant) throw new KernelError(403, 'NO_WORKSPACE', 'أنشئ مساحة عمل من Kernel أولًا.');
      const tenantId = scope.tenant.tenant_id;
      // Serialize policy changes and evaluation within each tenant.
      await db.query('SELECT id FROM public.aigas_tenants WHERE id=$1 FOR UPDATE', [tenantId]);
      const member = (await db.query('SELECT role FROM public.aigas_memberships WHERE tenant_id=$1 AND user_id=$2 FOR SHARE', [tenantId, identity.userId])).rows[0];
      if (!member) throw new KernelError(403, 'FORBIDDEN', 'عضويتك لم تعد متاحة.');
      const canManage = ['OWNER', 'ADMIN'].includes(member.role);
      if (operation === 'create' || operation === 'update') requireRole(member, ['OWNER', 'ADMIN']);

      if (operation === 'create') {
        if (body.template !== undefined && editableFields.some(field => body[field] !== undefined)) {
          throw new KernelError(400, 'INVALID_BODY', 'أضف إما قالبًا جاهزًا أو قاعدة مخصصة، لا كليهما.');
        }
        let rule;
        if (body.template !== undefined) {
          if (!Object.hasOwn(templates, body.template)) throw new KernelError(400, 'INVALID_TEMPLATE', 'اختر قالب قاعدة معتمدًا.');
          rule = { template: body.template, ...templates[body.template] };
        } else {
          rule = {
            template: null,
            name: ruleName(body.name),
            match_type: 'CONTAINS',
            pattern: rulePattern(body.pattern),
            action: ruleAction(body.action),
            priority: rulePriority(body.priority),
          };
        }
        const count = (await db.query('SELECT count(*)::int AS count FROM public.aigas_fw_rules WHERE tenant_id=$1', [tenantId])).rows[0].count;
        if (count >= MAX_RULES) throw new KernelError(409, 'RULE_LIMIT', `الحد ${MAX_RULES} قاعدة للمؤسسة؛ عطّل أو عدّل قاعدة قائمة.`);
        try {
          await db.query(
            'INSERT INTO public.aigas_fw_rules (id,tenant_id,template,name,match_type,pattern,action,priority) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
            [randomUUID(), tenantId, rule.template, rule.name, rule.match_type, rule.pattern, rule.action, rule.priority],
          );
          await audit(db, identity, tenantId, 'firewall.rule.created');
        } catch (error) {
          if (uniqueName(error)) throw new KernelError(409, 'RULE_EXISTS', 'توجد قاعدة بالاسم أو القالب نفسه؛ عدّلها من القائمة.');
          throw error;
        }
      }

      if (operation === 'update') {
        if (typeof body.id !== 'string' || !uuid.test(body.id) || !Number.isInteger(body.version)) throw new KernelError(400, 'INVALID_RULE', 'بيانات القاعدة غير صالحة.');
        const sets = [];
        const params = [tenantId, body.id, body.version];
        const add = (sql, value) => { params.push(value); sets.push(sql.replace('?', `$${params.length}`)); };
        if (body.name !== undefined) add('name=?', ruleName(body.name));
        if (body.pattern !== undefined) add('pattern=?', rulePattern(body.pattern));
        if (body.action !== undefined) add('action=?', ruleAction(body.action));
        if (body.priority !== undefined) add('priority=?', rulePriority(body.priority));
        if (body.enabled !== undefined) {
          if (typeof body.enabled !== 'boolean') throw new KernelError(400, 'INVALID_RULE', 'حالة التفعيل غير صالحة.');
          add('enabled=?', body.enabled);
        }
        if (!sets.length) throw new KernelError(400, 'INVALID_RULE', 'لا يوجد تغيير مطلوب.');
        if (editableFields.some(field => body[field] !== undefined)) {
          // Server templates stay trusted: they can be toggled, not redefined.
          const existing = (await db.query('SELECT template FROM public.aigas_fw_rules WHERE tenant_id=$1 AND id=$2', [tenantId, body.id])).rows[0];
          if (!existing) throw new KernelError(409, 'RULE_CHANGED', 'تغيرت القاعدة أو لم تعد متاحة؛ حدّث القائمة.');
          if (existing.template) throw new KernelError(409, 'TEMPLATE_IMMUTABLE', 'قوالب المختبر الجاهزة تُفعّل أو تُعطّل فقط؛ أضف قاعدة مخصصة لتعديل النمط أو الإجراء.');
        }
        try {
          const updated = await db.query(
            `UPDATE public.aigas_fw_rules SET ${sets.join(',')},version=version+1,updated_at=now() WHERE tenant_id=$1 AND id=$2 AND version=$3 RETURNING id`,
            params,
          );
          if (!updated.rowCount) throw new KernelError(409, 'RULE_CHANGED', 'تغيرت القاعدة أو لم تعد متاحة؛ حدّث القائمة.');
          await audit(db, identity, tenantId, editableFields.some(field => body[field] !== undefined) ? 'firewall.rule.updated' : 'firewall.rule.toggled');
        } catch (error) {
          if (uniqueName(error)) throw new KernelError(409, 'RULE_EXISTS', 'توجد قاعدة أخرى بالاسم نفسه؛ اختر اسمًا آخر.');
          throw error;
        }
      }

      const rules = (await db.query(
        'SELECT id,name,template,match_type,pattern,action,priority,enabled,version,created_at,updated_at FROM public.aigas_fw_rules WHERE tenant_id=$1 ORDER BY priority,created_at,id',
        [tenantId],
      )).rows;

      if (operation === 'evaluate') {
        const result = evaluate(inputText(body.text), rules);
        const id = randomUUID();
        // Explicit metadata fields only: the submitted text and any output never reach the database.
        await db.query(
          'INSERT INTO public.aigas_fw_decisions (id,tenant_id,action,reason,rule_id,rule_version) VALUES ($1,$2,$3,$4,$5,$6)',
          [id, tenantId, result.action, result.reason, result.rule_id, result.rule_version],
        );
        return { ...result, id, persisted: true };
      }

      const counts = (await db.query('SELECT action,count(*)::int AS count FROM public.aigas_fw_decisions WHERE tenant_id=$1 GROUP BY action', [tenantId])).rows;
      const decisions = (await db.query(
        `SELECT d.id,d.created_at,d.action,d.reason,d.rule_id,d.rule_version,r.name AS rule_name
         FROM public.aigas_fw_decisions d
         LEFT JOIN public.aigas_fw_rules r ON r.tenant_id=d.tenant_id AND r.id=d.rule_id
         WHERE d.tenant_id=$1 AND ($2='' OR d.action=$2) AND ($3='' OR d.reason=$3)
         ORDER BY d.created_at DESC,d.id DESC LIMIT 12`,
        [tenantId, action, reason],
      )).rows;
      return { tenant: scope.tenant, memberships: scope.memberships, canManage, rules, counts, decisions, actionFilter: action, reasonFilter: reason, maxRules: MAX_RULES };
    });
  };
}
export const operate = createFirewallService();
