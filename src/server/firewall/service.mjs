import { recordProductEvent } from '../ledger/writer.mjs';
import { requireProductAccess } from '../kernel/access.mjs';
import { randomUUID } from 'node:crypto';
import { transaction } from '../kernel/db.mjs';
import { tenantGuard, audit } from '../kernel/service.mjs';
import { KernelError, requireRole } from '../kernel/core.mjs';
import {
  templates, evaluate, inputText, actions, reasons, ruleName, rulePattern, ruleAction, rulePriority,
  MAX_RULES, MAX_TEXT_LENGTH, MAX_EVALUATIONS_PER_WINDOW, EVALUATION_WINDOW_SECONDS,
} from './core.mjs';
import { providerState } from './provider.mjs';
import { enforceDecision } from './guard.mjs';
import { requestHumanReview } from './escalation.mjs';
import { policyReference, decisionFingerprint } from './binding.mjs';
import { evaluateKernelPolicy } from '../kernel/policies.mjs';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const editableFields = ['name', 'pattern', 'action', 'priority'];
const operations = ['dashboard', 'create', 'update', 'delete', 'evaluate', 'enforce'];
const uniqueName = error => error?.code === '23505';

// Copies are new custom rules. The server picks a unique Arabic-suffixed name so the
// client never supplies identity for an existing rule.
async function copyName(db, tenantId, sourceName) {
  const build = tail => {
    const candidate = `${sourceName}${tail})`;
    return candidate.length <= 60 ? candidate : `${sourceName.slice(0, 60 - tail.length - 1).trimEnd()}${tail})`;
  };
  const taken = async name => (await db.query('SELECT 1 FROM public.aigas_fw_rules WHERE tenant_id=$1 AND name=$2', [tenantId, name])).rowCount > 0;
  const base = build(' (نسخة');
  if (!(await taken(base))) return base;
  for (let n = 2; n <= MAX_RULES + 1; n++) {
    const candidate = build(` (نسخة ${n}`);
    if (!(await taken(candidate))) return candidate;
  }
  throw new KernelError(409, 'RULE_EXISTS', 'تعذر توليد اسم فريد للنسخة؛ احذف نسخة قديمة أو أعد تسميتها.');
}

export function createFirewallService(transact = transaction) {
  return async function operate(identity, requested, operation, body = {}, query = '') {
    if (!operations.includes(operation)) throw new KernelError(404, 'NOT_FOUND', 'المسار غير موجود.');
    const action = typeof query === 'string' ? query : query?.action ?? '';
    const reason = typeof query === 'object' && query ? query.reason ?? '' : '';
    const filters = typeof query === 'object' && query ? query : {};
    const mode = filters.mode ?? '';
    const from = filters.from ?? '', to = filters.to ?? '';
    const page = Number(filters.page ?? 1);
    const validDay = value => /^\d{4}-\d{2}-\d{2}$/.test(value) && value >= '0001-01-01' && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
    if ((mode && !['LAB', 'GUARD'].includes(mode)) || !Number.isInteger(page) || page < 1 || page > 10000
      || (from && !validDay(from)) || (to && !validDay(to)) || (from && to && from > to)) throw new KernelError(400, 'INVALID_FILTER', 'فترة السجل أو رقم الصفحة أو المسار غير صالح.');
    if (action && !actions.includes(action)) throw new KernelError(400, 'INVALID_FILTER', 'تصفية الإجراء غير صالحة.');
    if (reason && !Object.hasOwn(reasons, reason)) throw new KernelError(400, 'INVALID_FILTER', 'تصفية السبب غير صالحة.');
    if (operation === 'enforce' && (typeof body.request_id !== 'string' || !uuid.test(body.request_id))) throw new KernelError(400, 'INVALID_REQUEST_ID', 'يلزم معرّف UUID جديد للعملية لمنع إعادة تنفيذ الطلب نفسه.');
    if (['evaluate', 'enforce'].includes(operation) && body.synthetic !== true) throw new KernelError(400, 'SYNTHETIC_REQUIRED', 'هذه النسخة تقبل نصًا اصطناعيًا فقط؛ يلزم الإقرار بذلك.');
    const outcome = await transact(async db => {
      const scope = await tenantGuard(identity, requested, db);
      if (!scope.tenant) throw new KernelError(403, 'NO_WORKSPACE', 'أنشئ مساحة عمل من Kernel أولًا.');
      const tenantId = scope.tenant.tenant_id;
      // Serialize policy changes and evaluation within each tenant.
      await db.query('SELECT id FROM public.aigas_tenants WHERE id=$1 FOR UPDATE', [tenantId]);
      await requireProductAccess(db, identity, tenantId, 'firewall');
      const member = (await db.query('SELECT role FROM public.aigas_memberships WHERE tenant_id=$1 AND user_id=$2 FOR SHARE', [tenantId, identity.userId])).rows[0];
      if (!member) throw new KernelError(403, 'FORBIDDEN', 'عضويتك لم تعد متاحة.');
      const canManage = ['OWNER', 'ADMIN'].includes(member.role);
      if (['create', 'update', 'delete'].includes(operation)) requireRole(member, ['OWNER', 'ADMIN']);

      if (operation === 'create') {
        const ruleCount = async () => (await db.query('SELECT count(*)::int AS count FROM public.aigas_fw_rules WHERE tenant_id=$1', [tenantId])).rows[0].count;
        if (body.duplicate_of !== undefined) {
          if (typeof body.duplicate_of !== 'string' || !uuid.test(body.duplicate_of)
            || body.template !== undefined || editableFields.some(field => body[field] !== undefined)) {
            throw new KernelError(400, 'INVALID_BODY', 'أرسل مرجع القاعدة المطلوب نسخها فقط دون حقول أخرى.');
          }
          const source = (await db.query('SELECT name,pattern,action,priority FROM public.aigas_fw_rules WHERE tenant_id=$1 AND id=$2', [tenantId, body.duplicate_of])).rows[0];
          if (!source) throw new KernelError(404, 'RULE_NOT_FOUND', 'القاعدة المطلوب نسخها غير موجودة في هذه المؤسسة.');
          if (await ruleCount() >= MAX_RULES) throw new KernelError(409, 'RULE_LIMIT', `الحد ${MAX_RULES} قاعدة للمؤسسة، ويشمل المعطّلة؛ احذف قاعدة أو عدّلها.`);
          const name = await copyName(db, tenantId, source.name);
          try {
            // A copy starts disabled so a duplicate never changes enforcement silently.
            await db.query(
              'INSERT INTO public.aigas_fw_rules (id,tenant_id,template,name,match_type,pattern,action,priority,enabled) VALUES ($1,$2,NULL,$3,$4,$5,$6,$7,false)',
              [randomUUID(), tenantId, name, 'CONTAINS', source.pattern, source.action, source.priority],
            );
            await audit(db, identity, tenantId, 'firewall.rule.duplicated');
          } catch (error) {
            if (uniqueName(error)) throw new KernelError(409, 'RULE_EXISTS', 'توجد قاعدة بالاسم أو القالب نفسه؛ أعد المحاولة.');
            throw error;
          }
        } else {
          if (body.template !== undefined && editableFields.some(field => body[field] !== undefined)) {
            throw new KernelError(400, 'INVALID_BODY', 'أضف إما قالبًا جاهزًا أو قاعدة مخصصة، لا كليهما.');
          }
          const rule = body.template !== undefined
            ? (Object.hasOwn(templates, body.template) ? { template: body.template, ...templates[body.template] } : null)
            : {
              template: null,
              name: ruleName(body.name),
              match_type: 'CONTAINS',
              pattern: rulePattern(body.pattern),
              action: ruleAction(body.action),
              priority: rulePriority(body.priority),
            };
          if (!rule) throw new KernelError(400, 'INVALID_TEMPLATE', 'اختر قالب قاعدة معتمدًا.');
          if (await ruleCount() >= MAX_RULES) throw new KernelError(409, 'RULE_LIMIT', `الحد ${MAX_RULES} قاعدة للمؤسسة، ويشمل المعطّلة؛ عدّل قاعدة قائمة.`);
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
        const fieldsChanged = editableFields.some(field => body[field] !== undefined);
        if (fieldsChanged) {
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
          await audit(db, identity, tenantId, fieldsChanged ? 'firewall.rule.updated' : 'firewall.rule.toggled');
        } catch (error) {
          if (uniqueName(error)) throw new KernelError(409, 'RULE_EXISTS', 'توجد قاعدة أخرى بالاسم نفسه؛ اختر اسمًا آخر.');
          throw error;
        }
      }

      if (operation === 'delete') {
        if (typeof body.id !== 'string' || !uuid.test(body.id) || !Number.isInteger(body.version)) throw new KernelError(400, 'INVALID_RULE', 'بيانات القاعدة غير صالحة.');
        const existing = (await db.query('SELECT template FROM public.aigas_fw_rules WHERE tenant_id=$1 AND id=$2', [tenantId, body.id])).rows[0];
        if (!existing) throw new KernelError(409, 'RULE_CHANGED', 'تغيرت القاعدة أو لم تعد متاحة؛ حدّث القائمة.');
        // Starter templates are server-owned and are never deleted, only disabled.
        if (existing.template) throw new KernelError(409, 'TEMPLATE_IMMUTABLE', 'قوالب المختبر الجاهزة تُعطّل ولا تُحذف؛ أضف قاعدة مخصصة بدلًا منها.');
        // Decisions are append-only and reference the rule they cite. Never orphan history.
        const cited = (await db.query('SELECT 1 FROM public.aigas_fw_decisions WHERE tenant_id=$1 AND rule_id=$2 LIMIT 1', [tenantId, body.id])).rowCount > 0;
        if (cited) throw new KernelError(409, 'RULE_HAS_HISTORY', 'هذه القاعدة مذكورة في قرارات محفوظة؛ عطّلها بدل حذفها للحفاظ على سجل القرارات.');
        const deleted = await db.query('DELETE FROM public.aigas_fw_rules WHERE tenant_id=$1 AND id=$2 AND version=$3 RETURNING id', [tenantId, body.id, body.version]);
        if (!deleted.rowCount) throw new KernelError(409, 'RULE_CHANGED', 'تغيرت القاعدة أو لم تعد متاحة؛ حدّث القائمة.');
        await audit(db, identity, tenantId, 'firewall.rule.deleted');
      }

      const rules = (await db.query(
        'SELECT id,name,template,match_type,pattern,action,priority,enabled,version,created_at,updated_at FROM public.aigas_fw_rules WHERE tenant_id=$1 ORDER BY priority,created_at,id',
        [tenantId],
      )).rows;

      if (operation === 'evaluate' || operation === 'enforce') {
        const enforced = operation === 'enforce';
        // Abuse control: cap stored evaluations per tenant window. The tenant row lock
        // above serializes this check with concurrent requests in the same transaction.
        const recent = (await db.query(
          `SELECT count(*)::int AS count FROM public.aigas_fw_decisions WHERE tenant_id=$1 AND created_at > now() - ($2::text || ' seconds')::interval`,
          [tenantId, EVALUATION_WINDOW_SECONDS],
        )).rows[0].count;
        if (recent >= MAX_EVALUATIONS_PER_WINDOW) {
          throw new KernelError(429, 'RATE_LIMITED', `تجاوزت المؤسسة ${MAX_EVALUATIONS_PER_WINDOW} تقييمًا في ${EVALUATION_WINDOW_SECONDS} ثانية؛ انتظر قليلًا ثم أعد المحاولة.`);
        }
        const requestText = inputText(body.text);
        let kernelPolicy = null;
        if (enforced) {
          try {
            kernelPolicy = await evaluateKernelPolicy(db, identity, tenantId, { productSlug: 'firewall', operation: 'firewall.execute', resource_type: 'text', departmentId: body.department_id ?? null });
          } catch (error) {
            if (['42P01', '42703', '42501'].includes(error?.code)) throw new KernelError(503, 'KERNEL_POLICY_SETUP_REQUIRED', 'محرك سياسات Kernel غير مهيأ أو غير متاح؛ لم يُرسل الطلب إلى مزود AI.');
            throw error;
          }
          // Missing policy output is an unavailable authorizer, never an allow.
          if (!kernelPolicy || typeof kernelPolicy.decision !== 'string') throw new KernelError(503, 'KERNEL_POLICY_UNAVAILABLE', 'تعذر الحصول على قرار سياسة Kernel؛ لم يُرسل الطلب إلى مزود AI.');
        }
        const productResult = evaluate(requestText, rules, { enforce: enforced });
        // A Kernel policy that is not ALLOW hard-denies and is never softened by product rules.
        const result = enforced && kernelPolicy.decision !== 'ALLOW'
          ? { action: 'DENY', reason: 'KERNEL_POLICY_DENIED', rule_id: null, rule_version: null, rule_name: null, output: null }
          : productResult;
        const id = randomUUID();
        const policyVersion = enforced ? policyReference(kernelPolicy) : 'firewall-evaluator-v2';
        const requestFingerprint = enforced
          ? decisionFingerprint({ tenantId, actorUserId: identity.userId, requestId: body.request_id, policyVersion, result, enforced })
          : null;
        // Single-use request UUID. The pre-check runs under the tenant row lock taken
        // above, so retries are classified before any write; a UUID reused for a
        // different decision is a conflict and is never executed again.
        if (enforced) {
          const existing = (await db.query('SELECT id,request_fingerprint FROM public.aigas_fw_decisions WHERE tenant_id=$1 AND request_id=$2', [tenantId, body.request_id])).rows[0];
          if (existing) {
            if (!existing.request_fingerprint || existing.request_fingerprint !== requestFingerprint) {
              throw new KernelError(409, 'REQUEST_ID_CONFLICT', 'هذا المعرّف مستخدم لطلب مختلف؛ استخدم UUID جديدًا. لم يُعد تنفيذ أي عملية.');
            }
            throw new KernelError(409, 'REQUEST_ALREADY_EVALUATED', 'هذا الطلب مسجّل مسبقًا؛ لم يُعد تنفيذه. راجع سجل القرارات قبل أي عملية جديدة.');
          }
        }
        // Explicit metadata fields only: the submitted text and any output never reach the database.
        try {
          if (enforced) {
            await db.query('INSERT INTO public.aigas_kernel_policy_decisions(id,tenant_id,actor_user_id,product_slug,operation,decision,reason,policy_chain,request_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9)',
              [randomUUID(), tenantId, identity.userId, 'firewall', 'firewall.execute', kernelPolicy.decision, kernelPolicy.reason, JSON.stringify(kernelPolicy.policies ?? []), body.request_id]);
          }
          const inserted = await db.query(
            'INSERT INTO public.aigas_fw_decisions (id,tenant_id,action,reason,rule_id,rule_version,mode,request_id,policy_version,request_fingerprint) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING created_at',
            [id, tenantId, result.action, result.reason, result.rule_id, result.rule_version, enforced ? 'GUARD' : 'LAB', enforced ? body.request_id : null, policyVersion, requestFingerprint],
          );
          if (inserted.rowCount !== 1) throw new Error('DECISION_NOT_SAVED');
          // Kernel audit is required and atomic with the metadata-only decision.
          await audit(db, identity, tenantId, enforced ? 'firewall.guard.evaluated' : 'firewall.lab.evaluated');
          // Mandatory Ledger evidence (when policy requires it) is written inside the
          // same transaction; a failure rolls the decision back. Ledger is never required
          // unless an approved evidence requirement matches this tenant and event type.
          await recordProductEvent(db, identity, tenantId, {
            source: 'firewall', event_type: 'firewall.decision.recorded',
            policy_version: enforced ? policyVersion : (result.rule_id ? `rule:${result.rule_id}:v${result.rule_version}` : 'firewall-evaluator-v2'),
            metadata_json: { synthetic: true, decision_ref: id, action: result.action, mode: enforced ? 'GUARD' : 'LAB', rule_ref: result.rule_id, rule_version: result.rule_version, ...(enforced ? { request_fingerprint: requestFingerprint } : {}) },
            idempotency_key: `decision:${id}`,
          });
          let escalation = null;
          // A human review decision creates its pending request in this transaction,
          // before any provider call, only through an approved server integration.
          if (enforced && result.action === 'ESCALATE') {
            try { escalation = await requestHumanReview(db, identity, tenantId, { decisionId: id, requestId: body.request_id, policyVersion }); }
            catch { throw new KernelError(503, 'HUMAN_GATE_UNAVAILABLE', 'تعذر إنشاء طلب المراجعة البشرية داخل المعاملة؛ لم تُحفظ العملية ولم يُرسل الطلب.'); }
          }
          const decision = {
            id, action: result.action, reason: result.reason, reason_text: reasons[result.reason],
            rule_id: result.rule_id, rule_version: result.rule_version,
            created_at: inserted.rows[0].created_at, mode: enforced ? 'GUARD' : 'LAB',
            policy_version: policyVersion, request_fingerprint: requestFingerprint,
          };
          if (enforced) return { decision, tenantId, actorUserId: identity.userId, requestId: body.request_id, policyVersion, requestFingerprint,
            forwardText: ['ALLOW', 'REDACT'].includes(result.action) ? result.output : null, kernelPolicy, escalation };
          return {
            ...decision, rule_name: result.rule_name, output: result.output,
            input_length: requestText.length, persisted: true,
            execution_status: 'NOT_EXECUTED', external_action_executed: false,
          };
        } catch (error) {
          if (enforced && uniqueName(error)) throw new KernelError(409, 'REQUEST_ALREADY_EVALUATED', 'هذا الطلب أو معرّفه مسجّل مسبقًا؛ لم يُعد تنفيذه. راجع سجل القرارات قبل أي عملية جديدة.');
          if (error instanceof KernelError || ['42P01', '42703', '42501'].includes(error?.code)) throw error;
          throw new KernelError(503, 'REQUIRED_AUDIT_UNAVAILABLE', enforced
            ? 'تعذر تأكيد حفظ القرار وتدقيق Kernel؛ لم يُرسل الطلب إلى مزود AI.'
            : 'تعذر تأكيد حفظ القرار وتدقيق Kernel؛ لم يُسجّل التقييم.');
        }
      }

      const counts = (await db.query('SELECT action,count(*)::int AS count FROM public.aigas_fw_decisions WHERE tenant_id=$1 GROUP BY action', [tenantId])).rows;
      const decisions = (await db.query(
        `SELECT d.id,d.created_at,d.action,d.reason,d.rule_id,d.rule_version,d.mode,d.policy_version
         FROM public.aigas_fw_decisions d
         WHERE d.tenant_id=$1 AND ($2='' OR d.action=$2) AND ($3='' OR d.reason=$3)
         AND ($4='' OR d.mode=$4)
         AND ($5::timestamptz IS NULL OR d.created_at >= $5::timestamptz)
         AND ($6::timestamptz IS NULL OR d.created_at < $6::timestamptz + interval '24 hours')
         ORDER BY d.created_at DESC,d.id DESC LIMIT 13 OFFSET $7`,
        [tenantId, action, reason, mode, from ? `${from}T00:00:00Z` : null, to ? `${to}T00:00:00Z` : null, (page - 1) * 12],
      )).rows;
      return {
        tenant: { ...scope.tenant, role: member.role }, memberships: scope.memberships, canManage, rules, counts,
        decisions: decisions.slice(0, 12), page, hasNext: decisions.length > 12 && page < 10000, provider: providerState(tenantId),
        enforcementPath: '/app/api/firewall/guarded-executions/', actionFilter: action, reasonFilter: reason,
        limits: { maxRules: MAX_RULES, maxTextLength: MAX_TEXT_LENGTH, maxEvaluationsPerWindow: MAX_EVALUATIONS_PER_WINDOW },
      };
    });
    // COMMIT has succeeded before any optional external call. Raw body is never
    // passed to the guard; only the evaluator's output can cross this boundary.
    return operation === 'enforce' ? enforceDecision(outcome) : outcome;
  };
}
export const operate = createFirewallService();
