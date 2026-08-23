import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const { summarizeReadiness } = await import('../public/js/ai-governance-readiness.js');

test('summarizes strengths, gaps, and next controls without a numeric score', () => {
  const summary = summarizeReadiness({
    inventory: 'established',
    ownership: 'partial',
    risk: 'not_started',
    policy: 'established',
    data: 'partial',
    approvals: 'not_started',
    evidence: 'established',
    monitoring: 'partial',
  });

  assert.deepEqual(summary.strengths, ['حصر استخدامات الذكاء الاصطناعي', 'سياسة استخدام الذكاء الاصطناعي', 'التسجيل والأدلة']);
  assert.ok(summary.gaps.includes('إدارة المخاطر'));
  assert.ok(summary.nextControls.includes('أنشئ مسار اعتماد بشري للحالات عالية الأثر.'));
  assert.equal('score' in summary, false);
});

test('keeps the assessment explanation crawlable and its boundaries explicit', () => {
  const source = fs.readFileSync(path.join(process.cwd(), 'src/pages/assessment/ai-governance-readiness/index.astro'), 'utf8');
  for (const dimension of ['inventory', 'ownership', 'risk', 'policy', 'data', 'approvals', 'evidence', 'monitoring']) {
    assert.match(source, new RegExp(`\\['${dimension}'`));
  }
  assert.match(source, /إجاباتك تبقى داخل متصفحك/);
  assert.match(source, /ليست شهادة أو موافقة تنظيمية أو حكم امتثال/);
  assert.doesNotMatch(source, /\b72\b|١٤<span/);
});
