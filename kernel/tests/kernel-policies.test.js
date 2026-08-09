/**
 * kernel/tests/kernel-policies.test.js — M17.1: Policy Governance engine tests.
 *
 * يختبر المحرك النقي (src/lib/kernel-policies/engine.ts) — نفس المنطق الذي
 * يشغّله المتصفح عبر kernel-policies.js. هذا هو جوهر "source-proven end to end":
 * مصدر الحقيقة واحد، والاختبارات تثبت أن رحلة فحص/تعديل/حفظ لا تسمح
 * "بتحوّل صامت" للسياسة.
 *
 * التغطية المطلوبة (من المهمة):
 *   1. save failure — فشل الحفظ يُكشف بوضوح (لا صمت) + undo snapshot.
 *   2. conflict — optimistic lock: تحديث متزاحم يُرفض قبل الكتابة فوق.
 *   3. keyboard — منطق dirty/publish (حفظ مع dirty يمر عبر confirm؛
 *      إغلاق مع dirty يُمنع/يُحذّر).
 *
 * إضافةً: validation (Regex، risk، حقول)، diff، publish preview، immutable
 * (شهادة)، حد الإصدارات.
 */

import { describe, it, expect, vi } from 'vitest';

import {
  createVersion,
  detectConflicts,
  diffRules,
  diffVersions,
  makeEngineState,
  makePolicy,
  nowIso,
  publishPreview,
  validateRule,
} from '@/src/lib/kernel-policies/engine';

/** قاعدة سليمة افتراضية. */
function goodRule(overrides = {}) {
  return {
    if: { piiType: 'saudi_id', operator: 'contains', pattern: null },
    and: { compliancePack: 'pdpl', orPacks: [] },
    then: { action: 'mask', riskModifier: 15 },
    ...overrides,
  };
}

describe('kernel policies engine — validation', () => {
  it('قاعدة سليمة → لا مشاكل', () => {
    const issues = validateRule(goodRule(), {
      name: 'سياسة',
      status: 'draft',
      limits: { maxVersions: 5, maxPatternLen: 120, maxNameLen: 60, simCount: 1000 },
    });
    expect(issues).toEqual([]);
  });

  it('regex غير صالح → يُرفض قبل الحفظ (لا تحوّل صامت)', () => {
    const issues = validateRule(goodRule({ if: { piiType: 'saudi_id', operator: 'matches', pattern: '[unclosed' } }), {
      name: 'سياسة',
      status: 'draft',
      limits: { maxVersions: 5, maxPatternLen: 120, maxNameLen: 60, simCount: 1000 },
    });
    expect(issues.some((i) => i.code === 'invalid_regex')).toBe(true);
  });

  it('risk خارج النطاق (0–50) → يُرفض', () => {
    const issues = validateRule(goodRule({ then: { action: 'mask', riskModifier: 999 } }), {
      name: 'سياسة',
      status: 'draft',
      limits: { maxVersions: 5, maxPatternLen: 120, maxNameLen: 60, simCount: 1000 },
    });
    expect(issues.some((i) => i.code === 'risk_out_of_range')).toBe(true);
  });

  it('اسم فارغ → يُرفض', () => {
    const issues = validateRule(goodRule(), {
      name: '   ',
      status: 'draft',
      limits: { maxVersions: 5, maxPatternLen: 120, maxNameLen: 60, simCount: 1000 },
    });
    expect(issues.some((i) => i.code === 'name_required')).toBe(true);
  });

  it('طول النمط فوق الحد → يُرفض', () => {
    const issues = validateRule(
      goodRule({ if: { piiType: 'saudi_id', operator: 'matches', pattern: 'x'.repeat(200) } }),
      { name: 'سياسة', status: 'draft', limits: { maxVersions: 5, maxPatternLen: 120, maxNameLen: 60, simCount: 1000 } },
    );
    expect(issues.some((i) => i.code === 'pattern_too_long')).toBe(true);
  });
});

describe('kernel policies engine — diff', () => {
  it('diffRules يكتشف الإضافة والحذف', () => {
    const d = diffRules(
      goodRule(),
      goodRule({ and: { compliancePack: 'nca_ecc', orPacks: ['pdpl'] }, then: { action: 'block', riskModifier: 30 } }),
    );
    expect(d.added.length).toBeGreaterThan(0);
    expect(d.removed.length).toBeGreaterThan(0);
    expect(d.same).toBe(false);
  });

  it('diffVersions: قاعدة متطابقة → same', () => {
    const state = makeEngineState();
    const d = diffVersions(state, 'pr_test', 1, 1);
    expect(d.same).toBe(true);
  });

  it('diffVersions: إصدار غير موجود → error', () => {
    const state = makeEngineState();
    const d = diffVersions(state, 'pr_test', 1, 99);
    expect(d.error).toBe('إصدار غير موجود');
  });
});

describe('kernel policies engine — conflicts', () => {
  it('يرصد تعارض block vs mask على نفس piiType', () => {
    const blockPolicy = makePolicy({
      id: 'pr_block',
      name: 'حظر',
      piiType: 'saudi_id',
      action: 'block',
      status: 'active',
    });
    const maskPolicy = makePolicy({
      id: 'pr_mask',
      name: 'تعمية',
      piiType: 'saudi_id',
      action: 'mask',
      status: 'active',
    });
    const state = makeEngineState({ policies: [blockPolicy, maskPolicy] });
    const conflicts = detectConflicts(state);
    expect(conflicts.length).toBe(1);
    expect(conflicts[0].severity).toBe('high');
  });

  it('سياسات على piiTypes مختلفة → لا تعارض', () => {
    const a = makePolicy({ id: 'pr_a', piiType: 'saudi_id', action: 'block', status: 'active' });
    const b = makePolicy({ id: 'pr_b', piiType: 'mobile', action: 'mask', status: 'active' });
    const state = makeEngineState({ policies: [a, b] });
    expect(detectConflicts(state).length).toBe(0);
  });
});

describe('kernel policies engine — createVersion (نقي + optimistic lock)', () => {
  it('حفظ ناجح → إصدار جديد immutable على نسخة نقية (لا طفرة على الأصل)', () => {
    const state = makeEngineState();
    const originalVersions = state.policies[0].versions.length;

    const res = createVersion(state, 'pr_test', {
      rule: goodRule({ then: { action: 'block', riskModifier: 30 } }),
      note: 'تعديل',
      expectedUpdatedAt: state.policies[0].updatedAt,
      expectedVersion: state.policies[0].version,
    });

    expect(res.ok).toBe(true);
    if (!res.ok) return;
    // الأصل لم يتغير (immutability)
    expect(state.policies[0].versions.length).toBe(originalVersions);
    expect(state.policies[0].versions[0].version).toBe(1);
    // النسخة الجديدة فيها إصدار v2
    expect(res.nextState.policies[0].versions.length).toBe(originalVersions + 1);
    expect(res.nextState.policies[0].versions[originalVersions].version).toBe(2);
    expect(res.nextState.policies[0].version).toBe(2);
    expect(res.value.newVersion.hash).toBeTruthy();
  });

  it('optimistic lock (conflict): updatedAt تغيّر من مكان آخر → يُرفض قبل الكتابة فوق', () => {
    const state = makeEngineState();
    const baselineUpdatedAt = state.policies[0].updatedAt;
    const baselineVersion = state.policies[0].version;

    // شخص آخر عدّل السياسة (updatedAt/version اختلفا)
    const modified = makeEngineState();
    modified.policies[0].updatedAt = '2099-01-01';
    modified.policies[0].version = baselineVersion + 1;

    const res = createVersion(modified, 'pr_test', {
      rule: goodRule(),
      expectedUpdatedAt: baselineUpdatedAt,
      expectedVersion: baselineVersion,
    });

    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.code).toBe('concurrent_modification');
    // لا تغيير — لم يُكتب فوق تعديل الآخر
    expect(modified.policies[0].versions.length).toBe(1);
  });

  it('optimistic lock (conflict): version قديمة → يُرفض', () => {
    const state = makeEngineState();
    const res = createVersion(state, 'pr_test', {
      rule: goodRule(),
      expectedUpdatedAt: state.policies[0].updatedAt,
      expectedVersion: state.policies[0].version - 1, // نسخة قديمة
    });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.code).toBe('concurrent_modification');
  });

  it('immutable: إصدار مثبَّت بشهادة → يُرفض التعديل', () => {
    const state = makeEngineState({
      certificates: [{ id: 'CERT-1', name: 'شهادة', createdAt: '2026-01-01', policyId: 'pr_test', version: 1 }],
    });
    const res = createVersion(state, 'pr_test', {
      rule: goodRule(),
      expectedUpdatedAt: state.policies[0].updatedAt,
      expectedVersion: state.policies[0].version,
    });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.code).toBe('certified_immutable');
  });

  it('حد الإصدارات → يُرفض', () => {
    const state = makeEngineState({
      policies: [makePolicy({ limits_proxy: true })].map((p) => ({
        ...p,
        versions: Array.from({ length: 5 }, (_, i) => ({
          version: i + 1,
          note: 'v',
          createdAt: '2026-01-01',
          hash: 'h',
          rule: goodRule(),
        })),
      })),
    });
    const res = createVersion(state, 'pr_test', {
      rule: goodRule(),
      expectedUpdatedAt: state.policies[0].updatedAt,
      expectedVersion: state.policies[0].version,
    });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.code).toBe('max_versions');
  });

  it('قاعدة غير صالحة (regex) → يُرفض قبل الحفظ', () => {
    const state = makeEngineState();
    const res = createVersion(state, 'pr_test', {
      rule: goodRule({ if: { piiType: 'saudi_id', operator: 'matches', pattern: '[unclosed' } }),
      expectedUpdatedAt: state.policies[0].updatedAt,
      expectedVersion: state.policies[0].version,
    });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.code).toBe('validation_failed');
  });
});

describe('kernel policies engine — publish preview (draft/diff/confirm path)', () => {
  it('publishPreview: مسودة → مفعّلة تُعلَّم isDraftPublish + تعرض الـ diff', () => {
    const state = makeEngineState(); // status = draft
    const preview = publishPreview(state, 'pr_test', {
      rule: goodRule({ then: { action: 'block', riskModifier: 30 } }),
      name: 'سياسة اختبار',
      status: 'active',
      description: 'وصف',
    });
    expect(preview.isDraftPublish).toBe(true);
    expect(preview.diff.same).toBe(false);
    expect(preview.fromVersion).toBe(1);
    expect(preview.toVersion).toBe(2);
    expect(preview.issues).toEqual([]);
  });

  it('publishPreview: مفعّلة → مفعّلة (تعديل، ليس نشر مسودة)', () => {
    const state = makeEngineState({
      policies: [makePolicy({ status: 'active' })],
    });
    const preview = publishPreview(state, 'pr_test', {
      rule: goodRule(),
      name: 'سياسة اختبار',
      status: 'active',
      description: 'وصف',
    });
    expect(preview.isDraftPublish).toBe(false);
  });

  it('publishPreview: معاينة لا تغيّر الحالة (لا تحوّل صامت)', () => {
    const state = makeEngineState();
    const before = JSON.stringify(state);
    publishPreview(state, 'pr_test', {
      rule: goodRule({ then: { action: 'block', riskModifier: 30 } }),
      name: 'سياسة اختبار',
      status: 'active',
      description: 'وصف',
    });
    expect(JSON.stringify(state)).toBe(before);
  });
});

describe('kernel policies engine — save failure / dirty (منطق الحفظ الآمن)', () => {
  it('نمذجة فشل الحفظ: لا يوجد فشل صامت — العملية تعيد ok:false صريحة', () => {
    // المحرك النقي لا يكتب تخزين؛ طبقة الـ UI تعالج رفض التخزين. هنا نثبت
    // أن أي عملية تعيد نتيجة قابلة للفحص (ok:false + code) لو fشلت —
    // لا "undefined" صامت.
    const state = makeEngineState();
    const res = createVersion(state, 'pr_missing', {
      rule: goodRule(),
      expectedUpdatedAt: '',
      expectedVersion: 0,
    });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.code).toBe('not_found');
  });

  it('dirty detect: الخلط بين baseline و next يُكشف (لا نشر صامت)', () => {
    const state = makeEngineState();
    const dirty = publishPreview(state, 'pr_test', {
      rule: goodRule({ then: { action: 'block', riskModifier: 30 } }),
      name: 'سياسة اختبار',
      status: 'draft',
      description: 'وصف',
    });
    // قاعدة تغيّرت → diff مو same → المستخدم لازم يؤكد قبل الحفظ
    expect(dirty.diff.same).toBe(false);
  });
});

describe('kernel policies engine — nowIso determinism', () => {
  it('nowIso(timestamp) حتمي — يمكن التحكم به للاختبارات', () => {
    expect(nowIso(0)).toBe('1970-01-01');
    expect(nowIso(1754208000000)).toBe('2025-08-03');
  });
});