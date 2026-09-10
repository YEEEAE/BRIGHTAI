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

test('exposes a visible progress state and accessible question grouping', () => {
  const source = fs.readFileSync(path.join(process.cwd(), 'src/pages/assessment/ai-governance-readiness/index.astro'), 'utf8');
  assert.match(source, /data-assessment-step-label/);
  assert.match(source, /role="radiogroup"/);
  assert.match(source, /aria-labelledby=\{`q-/);
  assert.match(source, /data-assessment-status[^>]*aria-live="polite"/);
  assert.match(source, /data-assessment-error[^>]*role="alert"/);
});

test('tracks the full funnel without collecting personal data', () => {
  const client = fs.readFileSync(path.join(process.cwd(), 'public/js/ai-governance-readiness.js'), 'utf8');
  for (const event of ['assessment_started', 'assessment_step_progress', 'assessment_completed', 'assessment_abandon']) {
    assert.ok(client.includes(`'${event}'`), `missing ${event}`);
  }
  // Abandonment must survive mobile browser suspension, sent only once.
  assert.match(client, /pagehide/);
  assert.match(client, /abandoned/);
  // Reduced motion must be respected on result scroll.
  assert.match(client, /prefers-reduced-motion/);
  // Privacy allowlist: step/dimension/position identifiers only.
  assert.match(client, /ALLOWED_KEYS/);
  assert.doesNotMatch(client, /localStorage|sessionStorage|fetch\(|XMLHttpRequest/);
});

test('keeps conversion CTAs wired to the unified analytics taxonomy', () => {
  const source = fs.readFileSync(path.join(process.cwd(), 'src/pages/assessment/ai-governance-readiness/index.astro'), 'utf8');
  assert.match(source, /data-cta="assessment_start_click"/);
  assert.match(source, /data-cta="assessment_completion_cta"/);
  assert.match(source, /href="#assessment"/);
  assert.match(source, /href="\/contact\/"/);
});
