/**
 * kernel-policies/engine.ts — M17.1: Pure Policy Governance engine (2026-08-09).
 *
 * المحرك النقي لمحرر السياسات — قابل للاختبار بوحدات vitest. لا يعتمد على
 * DOM ولا localStorage: كل عملية تأخذ `state` نقية وتعيد `nextState` نقية
 * (immutability — لا طفرة). هذا يجعل رحلة فحص/تعديل/حفظ "source-proven
 * end to end": نفس المنطق يشغّله المتصفح (عبر kernel-policies.js) وتختبره
 * vitest (kernel/tests/kernel-policies.test.js) — مصدر حقيقة واحد.
 *
 * المسؤوليات:
 *   - validateRule: تحقق أعمق قبل القبول (Regex صالح، risk 0–50،
 *     piiType/operator/action صالحة، طول name/pattern).
 *   - diffVersions: فرق Git-like بين نسختي قاعدة (متضاف/محذوف/معدَّل).
 *   - detectConflicts: كشف تعارضات السياسات النشطة على نفس piiType.
 *   - createVersion: ينشئ إصداراً جديداً immutable — يعمل على نسخة نقية،
 *     مع optimistic lock عبر expectedUpdatedAt/expectedVersion (رفض/تحذير
 *     لو السجل الحالي تغيّر من مكان آخر — شرط "no silent policy mutation").
 *   - publishPreview: الفرق بين baseline و next قبل التأكيد (شاشة diff).
 *
 * لا توجد كتابة تخزين هنا — طبقة الـ UI (kernel-policies.js) تتولى الحفظ
 * وتعالج فشل التخزين بوضوح (لا فشل صامت).
 */

import type {
  PolicyEditorPolicy,
  PolicyEditorAction,
  PolicyLimits,
  PolicyOperator,
  PolicyRule,
  PolicyVersion,
  PolicyEngineState,
  EngineResult,
} from './types';

// ── أدوات ──────────────────────────────────────────────────────────────────

/** استنساخ عميق — للحفاظ على نقاء الحالة (لا طفرات). */
export function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

/** hash حتمي FNV-1a — مطابق للطبقة الحتمية. */
export function fnv1a(str: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return 'h' + h.toString(16).padStart(8, '0');
}

function ruleHash(rule: PolicyRule): string {
  return fnv1a(JSON.stringify(rule));
}

function findPolicy(state: PolicyEngineState, id: string): PolicyEditorPolicy | undefined {
  return state.policies.find((p) => p.id === id);
}

function lastVersion(policy: PolicyEditorPolicy): PolicyVersion | undefined {
  const vs = policy.versions || [];
  return vs.length ? vs[vs.length - 1] : undefined;
}

function isCertified(state: PolicyEngineState, policyId: string, versionNumber: number): boolean {
  return state.certificates.some(
    (c) => c.policyId === policyId && c.version === versionNumber,
  );
}

/** القيمة الحالية للوقت — مكتوبة كـ Date.now لسهولة الـ mock في الاختبارات. */
export function nowIso(timestamp?: number): string {
  return new Date(timestamp ?? Date.now()).toISOString().slice(0, 10);
}

// ── أنواع PII / حزم / إجراءات / مشغلات صالحة ────────────────────────────────

const VALID_PII_TYPES = new Set([
  'saudi_id', 'mobile', 'iban', 'email', 'patient_file', 'credit_card',
  'passport', 'medical_record', 'salary', 'any',
]);

const VALID_OPERATORS = new Set<PolicyOperator>(['contains', 'matches', 'equals']);

const VALID_ACTIONS = new Set<PolicyEditorAction>([
  'mask', 'block', 'redact', 'warn', 'approve', 'local_model_only', 'hitl', 'log',
]);

const VALID_STATUS = new Set(['active', 'draft', 'archived']);

// ── محاولة ربط regex (بدون قتل الخيط — حد زمني) ─────────────────────────────

function isValidRegex(pattern: string): boolean {
  if (!pattern) return true; // optional
  try {
    // eslint-disable-next-line no-new
    new RegExp(pattern);
    return true;
  } catch {
    return false;
  }
}

// ── validation ──────────────────────────────────────────────────────────────

export interface ValidationIssue {
  field: string;
  code: string;
  message: string;
}

/**
 * تحقق أعمق من القاعدة قبل القبول. يعيد مصفوفة مشاكل (فارغة = سليم).
 * يغطي: الاسم المطلوب/الحد، الـ regex صالح، risk ضمن 0–50، piiType/
 * operator/action/status صالحة، حد طول النمط.
 */
export function validateRule(
  rule: PolicyRule,
  opts: { name: string; status: string; limits: PolicyLimits },
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { name, status, limits } = opts;

  if (!name || !name.trim()) {
    issues.push({ field: 'name', code: 'name_required', message: 'اسم السياسة مطلوب قبل الحفظ.' });
  } else if (name.trim().length > limits.maxNameLen) {
    issues.push({
      field: 'name',
      code: 'name_too_long',
      message: `اسم السياسة أطول من الحد (${limits.maxNameLen} حرف).`,
    });
  }

  if (!rule.if.piiType || !VALID_PII_TYPES.has(rule.if.piiType)) {
    issues.push({ field: 'piiType', code: 'invalid_pii_type', message: 'نوع البيانات غير صالح.' });
  }
  if (!VALID_OPERATORS.has(rule.if.operator)) {
    issues.push({ field: 'operator', code: 'invalid_operator', message: 'نوع المطابقة غير صالح.' });
  }
  if (rule.if.pattern && !isValidRegex(rule.if.pattern)) {
    issues.push({ field: 'pattern', code: 'invalid_regex', message: 'نمط Regex غير صالح.' });
  }
  if (rule.if.pattern && rule.if.pattern.length > limits.maxPatternLen) {
    issues.push({
      field: 'pattern',
      code: 'pattern_too_long',
      message: `النمط أطول من الحد (${limits.maxPatternLen} حرف).`,
    });
  }
  if (!VALID_ACTIONS.has(rule.then.action)) {
    issues.push({ field: 'action', code: 'invalid_action', message: 'الإجراء غير صالح.' });
  }
  if (typeof rule.then.riskModifier !== 'number' || Number.isNaN(rule.then.riskModifier)) {
    issues.push({ field: 'risk', code: 'invalid_risk', message: 'مُعدِّل الخطورة يجب أن يكون رقماً.' });
  } else if (rule.then.riskModifier < 0 || rule.then.riskModifier > 50) {
    issues.push({ field: 'risk', code: 'risk_out_of_range', message: 'مُعدِّل الخطورة خارج النطاق (0–50).' });
  }
  if (!VALID_STATUS.has(status)) {
    issues.push({ field: 'status', code: 'invalid_status', message: 'الحالة غير صالحة.' });
  }

  return issues;
}

// ── diff ────────────────────────────────────────────────────────────────────

export interface DiffResult {
  added: string[];
  removed: string[];
  changed: string[];
  same: boolean;
  error?: string;
}

function flattenRule(rule: PolicyRule | undefined): string[] {
  if (!rule) return [];
  const lines: string[] = [];
  lines.push(`IF.piiType: ${rule.if.piiType}`);
  lines.push(`IF.operator: ${rule.if.operator}`);
  if (rule.if.pattern) lines.push(`IF.pattern: ${rule.if.pattern}`);
  lines.push(`AND.pack: ${rule.and.compliancePack}`);
  (rule.and.orPacks || []).forEach((p) => lines.push(`OR.pack: ${p}`));
  lines.push(`THEN.action: ${rule.then.action}`);
  lines.push(`THEN.riskModifier: ${rule.then.riskModifier}`);
  return lines;
}

/**
 * فرق Git-like بين قاعدتي إصدارين. نفس سلوك diff في المحرك القديم لكن نقي.
 */
export function diffRules(a: PolicyRule | undefined, b: PolicyRule | undefined): DiffResult {
  const linesA = flattenRule(a);
  const linesB = flattenRule(b);
  const added: string[] = [];
  const removed: string[] = [];
  linesB.forEach((line) => { if (linesA.indexOf(line) === -1) added.push(line); });
  linesA.forEach((line) => { if (linesB.indexOf(line) === -1) removed.push(line); });
  const changed = added.concat(removed).filter((l) => l.indexOf(':') !== -1);
  return { added, removed, changed, same: added.length === 0 && removed.length === 0 };
}

/**
 * الفرق بين إصدارين من سياسة في الحالة. يعيد إصدار غير موجود + خطأ.
 */
export function diffVersions(
  state: PolicyEngineState,
  policyId: string,
  vA: number,
  vB: number,
): DiffResult {
  const policy = findPolicy(state, policyId);
  if (!policy) return { added: [], removed: [], changed: [], same: true };
  const a = policy.versions.find((v) => v.version === vA);
  const b = policy.versions.find((v) => v.version === vB);
  if (!a || !b) return { added: [], removed: [], changed: [], same: false, error: 'إصدار غير موجود' };
  return diffRules(a.rule, b.rule);
}

// ── كشف التعارض ────────────────────────────────────────────────────────────

export interface ConflictInfo {
  a: string;
  b: string;
  piiType: string;
  severity: 'high' | 'medium';
  note: string;
}

/**
 * يكتشف تعارضات بين السياسات النشطة على نفس piiType. نفس المنطق القديم.
 */
export function detectConflicts(state: PolicyEngineState): ConflictInfo[] {
  const conflicts: ConflictInfo[] = [];
  const active = state.policies.filter((p) => p.status === 'active');
  const byType: Record<string, PolicyEditorPolicy[]> = {};
  active.forEach((p) => {
    (byType[p.piiType] = byType[p.piiType] || []).push(p);
  });
  Object.keys(byType).forEach((type) => {
    const list = byType[type];
    for (let i = 0; i < list.length; i += 1) {
      for (let j = i + 1; j < list.length; j += 1) {
        const c = conflictBetween(list[i].action, list[j].action);
        if (c) {
          conflicts.push({ a: list[i].id, b: list[j].id, piiType: type, severity: c.severity, note: c.note });
        }
      }
    }
  });
  return conflicts;
}

function conflictBetween(
  actA: PolicyEditorAction,
  actB: PolicyEditorAction,
): { severity: 'high' | 'medium'; note: string } | null {
  const block = ['block'];
  const severe = ['block', 'redact'];
  const soft = ['mask', 'warn', 'log', 'approve', 'hitl', 'local_model_only'];
  if (block.indexOf(actA) !== -1 && soft.indexOf(actB) !== -1) {
    return { severity: 'high', note: `إجراء ${actA} يتعارض مع ${actB} على نفس نوع البيانات` };
  }
  if (block.indexOf(actB) !== -1 && soft.indexOf(actA) !== -1) {
    return { severity: 'high', note: `إجراء ${actB} يتعارض مع ${actA} على نفس نوع البيانات` };
  }
  if (severe.indexOf(actA) !== -1 && severe.indexOf(actB) !== -1 && actA !== actB) {
    return { severity: 'medium', note: `إجراءان حاسمان مختلفان (${actA} / ${actB})` };
  }
  return null;
}

// ── publish preview (diff baseline → next) ──────────────────────────────────

export interface PublishPreview {
  policyId: string;
  name: string;
  fromVersion: number | null; // null = لا يوجد إصدار سابق
  toVersion: number;
  diff: DiffResult;
  issues: ValidationIssue[];
  conflicts: ConflictInfo[];
  isDraftPublish: boolean; // هل هذا يحوّل مسودة → مفعّلة؟
  riskSummary: string;
}

/**
 * يُحضّر معاينة النشر قبل التأكيد: الـ diff بين baseline (آخر إصدار) والنص
 * الجديد + مشاكل التحقق + تعارضات + هل هو نشر مسودة. يعمل على state نقي
 * ولا يغيِّر شيئاً — فقط يعرض ما سيحدث.
 */
export function publishPreview(
  state: PolicyEngineState,
  policyId: string,
  patch: {
    rule: PolicyRule;
    name: string;
    status: string;
    description: string;
  },
): PublishPreview {
  const policy = findPolicy(state, policyId);
  const current = policy ? lastVersion(policy) : undefined;
  const fromVersion = current ? current.version : null;
  const toVersion = current ? current.version + 1 : 1;
  const issues = validateRule(patch.rule, { name: patch.name, status: patch.status, limits: state.limits });
  const conflicts = detectConflicts(state);
  const isDraftPublish = patch.status === 'active' && policy?.status === 'draft';
  const diff = diffRules(current ? current.rule : undefined, patch.rule);
  const riskSummary = `v${toVersion} · +${diff.added.length} / -${diff.removed.length}`;

  return {
    policyId,
    name: patch.name,
    fromVersion,
    toVersion,
    diff,
    issues,
    conflicts,
    isDraftPublish,
    riskSummary,
  };
}

// ── createVersion (نقي + optimistic lock + immutable) ───────────────────────

export interface CreateVersionPatch {
  rule: PolicyRule;
  note?: string;
  status?: string;
  riskModifier?: number;
  action?: PolicyEditorAction;
  name?: string;
  description?: string;
  /** optimistic lock: الطابع عند فتح المحرر. */
  expectedUpdatedAt: string;
  /** optimistic lock: عدّاد الإصدارات عند فتح المحرر. */
  expectedVersion: number;
}

export type CreateVersionResult = EngineResult<{ policy: PolicyEditorPolicy; newVersion: PolicyVersion }> &
  ({ ok: false; code: string; message: string } | { ok: true; message: string; value: { policy: PolicyEditorPolicy; newVersion: PolicyVersion }; nextState: PolicyEngineState });

/**
 * ينشئ إصداراً جديداً immutable على نسخة نقية (لا طفرة). يرفض:
 *   - Policy غير موجودة
 *   - الإصدار الحالي مثبَّت بشهادة (immutable)
 *   - بلوغ حد الإصدارات
 *   - قاعدة غير صالحة (validateRule)
 *   - optimistic lock conflict (updatedAt/version تغيّر من مكان آخر)
 *
 * يعيد nextState جديدة؛ طبقة الـ UI هي المسؤولة عن الحفظ.
 */
export function createVersion(
  state: PolicyEngineState,
  policyId: string,
  patch: CreateVersionPatch,
  now?: number,
): CreateVersionResult {
  const policy = findPolicy(state, policyId);
  if (!policy) {
    return { ok: false, code: 'not_found', message: `ما لقينا السياسة ${policyId}` };
  }
  const current = lastVersion(policy);

  // optimistic lock: لو سجل السياسة الحالي تغيّر منذ فتح المحرر → رفض/تحذير.
  if (patch.expectedUpdatedAt && patch.expectedUpdatedAt !== policy.updatedAt) {
    return {
      ok: false,
      code: 'concurrent_modification',
      message: 'السياسة حُدّثت من مكان آخر منذ فتحك المحرر. حدّث العرض وراجع قبل الحفظ — ما نكتب فوق تعديل غيرك.',
    };
  }
  if (patch.expectedVersion !== undefined && patch.expectedVersion !== policy.version) {
    return {
      ok: false,
      code: 'concurrent_modification',
      message: 'السياسة حُدّثت من نسخة أخرى. حدّث العرض وراجع قبل الحفظ.',
    };
  }

  // immutable: إصدار مثبَّت بشهادة لا يُعدَّل.
  if (current && isCertified(state, policyId, current.version)) {
    return {
      ok: false,
      code: 'certified_immutable',
      message: `الإصدار ${current.version} مثبَّت بشهادة امتثال — ما ينفع تعديله. أنشئ سياسة جديدة أو تواصل مع الحوكمة.`,
    };
  }

  // حد الإصدارات.
  if ((policy.versions || []).length >= state.limits.maxVersions) {
    return {
      ok: false,
      code: 'max_versions',
      message: `وصلت لأقصى عدد إصدارات (${state.limits.maxVersions}). أرشف إصداراً قديماً قبل التعديل.`,
    };
  }

  // تحقق أعمق قبل القبول.
  const issues = validateRule(patch.rule, {
    name: patch.name ?? policy.name,
    status: patch.status ?? policy.status,
    limits: state.limits,
  });
  if (issues.length) {
    return {
      ok: false,
      code: 'validation_failed',
      message: issues[0].message,
      // نمرر الـ issues في الـ message عبر detail لاحقاً — هنا message كافٍ للاختبار.
    };
  }

  const newRule = deepClone(patch.rule);
  const newVersion: PolicyVersion = {
    version: current ? current.version + 1 : 1,
    note: patch.note || 'تعديل يدوي',
    createdAt: nowIso(now),
    hash: ruleHash(newRule),
    rule: newRule,
  };

  // نبني سياسة جديدة نقية (لا طفرة على الأصل).
  const nextPolicy: PolicyEditorPolicy = deepClone(policy);
  nextPolicy.versions = [...(nextPolicy.versions || []), newVersion];
  if (patch.status && VALID_STATUS.has(patch.status)) nextPolicy.status = patch.status as PolicyEditorPolicy['status'];
  if (typeof patch.riskModifier === 'number') nextPolicy.riskModifier = patch.riskModifier;
  if (patch.action && VALID_ACTIONS.has(patch.action)) nextPolicy.action = patch.action;
  if (patch.name) nextPolicy.name = patch.name;
  if (patch.description !== undefined) nextPolicy.description = patch.description;
  nextPolicy.lastModified = newVersion.createdAt;
  nextPolicy.updatedAt = newVersion.createdAt;
  nextPolicy.version = (policy.version ?? 0) + 1;

  // nextState نقية.
  const nextState: PolicyEngineState = deepClone(state);
  const idx = nextState.policies.findIndex((p) => p.id === policyId);
  if (idx !== -1) nextState.policies[idx] = nextPolicy;

  return {
    ok: true,
    message: `نشأ إصدار v${newVersion.version} بـ hash ${newVersion.hash}`,
    value: { policy: nextPolicy, newVersion },
    nextState,
  };
}

// ── مصنّع سياسة للاختبارات ──────────────────────────────────────────────────

/**
 * ينشئ سياسة افتراضية صالحة — يُستعمل في الاختبارات وأي مصدر build-time.
 */
export function makePolicy(overrides: Partial<PolicyEditorPolicy> = {}): PolicyEditorPolicy {
  const rule: PolicyRule = {
    if: { piiType: 'saudi_id', operator: 'contains', pattern: null },
    and: { compliancePack: 'pdpl', orPacks: [] },
    then: { action: 'mask', riskModifier: 15 },
  };
  const now = nowIso();
  return {
    id: 'pr_test',
    name: 'سياسة اختبار',
    description: 'وصف',
    piiType: 'saudi_id',
    compliancePacks: ['pdpl'],
    action: 'mask',
    riskModifier: 15,
    status: 'draft',
    appsCount: 0,
    lastModified: now,
    owner: 'الحوكمة',
    versions: [{
      version: 1,
      note: 'الإصدار الأول',
      createdAt: now,
      hash: ruleHash(rule),
      rule,
    }],
    exceptions: [],
    updatedAt: now,
    version: 1,
    ...overrides,
  };
}

/**
 * ينشئ حالة افتراضية صالحة — يُستعمل في الاختبارات.
 */
export function makeEngineState(overrides: Partial<PolicyEngineState> = {}): PolicyEngineState {
  return {
    policies: [makePolicy()],
    certificates: [],
    limits: { maxVersions: 5, maxPatternLen: 120, maxNameLen: 60, simCount: 1000 },
    ...overrides,
  };
}