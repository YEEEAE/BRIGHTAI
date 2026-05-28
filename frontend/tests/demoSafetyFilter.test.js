import { describe, expect, it } from 'vitest';
import safetyModule from '../services/demoSafetyFilter.js';

const { assertSafeDemoInput, appendSafetyNotice } = safetyModule;

describe('demo safety filter', () => {
  it('blocks medical diagnosis and treatment requests in hospital demo', () => {
    expect(() => assertSafeDemoInput('smart-hospital-management', {
      scenarioId: 'patient-case',
      message: 'شخص حالة ألم صدر واقترح علاجاً',
      locale: 'ar-SA'
    })).toThrow(/MEDICAL_CONTENT_BLOCKED/);
  });

  it('blocks real student identifiers in education demo', () => {
    expect(() => assertSafeDemoInput('smart-education-platform', {
      scenarioId: 'student-risk',
      message: 'رقم الهوية 1234567890',
      locale: 'ar-SA'
    })).toThrow(/UNSAFE_CONTENT_DETECTED/);
  });

  it('adds legal notice for tender outputs', () => {
    const output = appendSafetyNotice('tenders-analysis', { summary: 'تحليل أولي' });
    expect(output.safetyNotices.join(' ')).toContain('مراجعة قانونية');
  });
});
