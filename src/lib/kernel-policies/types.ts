/**
 * kernel-policies/types.ts — M17.1: Policy Governance engine types (2026-08-09).
 *
 * أنواع المحرك النقي لمحرر السياسات. تُشتق من src/data/kernel-policy-editor.ts
 * لكن بإضافة حقول كشف التعديل (updatedAt/version) لدعم optimistic lock —
 * شرط "no silent policy mutation": أي حفظ يعمل على نسخة من state نقية،
 * ويُرفض/يُحذَّر لو السجل الحالي تغيّر من مكان آخر منذ فتح المحرر.
 *
 * لا يعتمد هذا الملف على DOM ولا localStorage — قابل للاستيراد في الاختبارات
 * (نفس نمط src/lib/kernel-certs).
 */

export type PolicyEditorStatus = 'active' | 'draft' | 'archived';
export type PolicyEditorAction =
  | 'mask'
  | 'block'
  | 'redact'
  | 'log'
  | 'hitl'
  | 'warn'
  | 'approve'
  | 'local_model_only';
export type PolicyOperator = 'contains' | 'matches' | 'equals';

/** قاعدة واحدة (IF … AND … THEN) — تُخزَّن داخل الإصدار. */
export interface PolicyRule {
  if: { piiType: string; operator: PolicyOperator; pattern: string | null };
  and: { compliancePack: string; orPacks: string[] };
  then: { action: PolicyEditorAction; riskModifier: number };
}

/** إصدار immutable — لا يُعدَّل، لا يُحذف. */
export interface PolicyVersion {
  version: number;
  note: string;
  createdAt: string;
  /** hash حتمي FNV-1a للقاعدة. */
  hash: string;
  /** لقطة القاعدة عند هذا الإصدار. */
  rule: PolicyRule;
  /** شهادة امتثال تثبّت هذا الإصدار → immutable. */
  certifiedBy?: string;
}

/** استثناء — يعلّق تفعيل سياسة على نطاق محدد. */
export interface PolicyException {
  id: string;
  scope: 'user' | 'department' | 'app' | 'sector' | 'all';
  value: string;
  reason: string;
  createdBy: string;
  createdAt: string;
  expiresAt: string | null;
  active: boolean;
}

/** سياسة كاملة للمحرر — + updatedAt/version لـ optimistic lock. */
export interface PolicyEditorPolicy {
  id: string;
  name: string;
  description: string;
  piiType: string;
  compliancePacks: string[];
  action: PolicyEditorAction;
  riskModifier: number;
  status: PolicyEditorStatus;
  appsCount: number;
  lastModified: string;
  owner: string;
  versions: PolicyVersion[];
  exceptions: PolicyException[];
  /** طابع التعديل عند آخر حفظ — يُقارن للكشف عن تحديث متزاحم. */
  updatedAt: string;
  /** عدّاد إصدارات للتحديث المتزاحم (optimistic lock). */
  version: number;
}

/** شهادة امتثال تثبّت إصداراً محدداً من سياسة. */
export interface PolicyCertificate {
  id: string;
  name: string;
  createdAt: string;
  policyId: string;
  version: number;
}

/** طلب محاكاة واحد (من آخر 1000). */
export interface SimulationRequest {
  id: string;
  department: string;
  sector: string;
  text: string;
  piiHint: string | null;
}

export interface PolicyLimits {
  maxVersions: number;
  maxPatternLen: number;
  maxNameLen: number;
  simCount: number;
}

/** الحالة الكاملة للمحرك — تُمرَّر نقية لكل عملية. */
export interface PolicyEngineState {
  policies: PolicyEditorPolicy[];
  certificates: PolicyCertificate[];
  limits: PolicyLimits;
}

/** نتيجة عملية محرك خالص. */
export type EngineResult<T = undefined> =
  | { ok: true; message?: string; nextState?: PolicyEngineState; value?: T }
  | { ok: false; code: string; message: string };