import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const pagePath = new URL('../src/pages/tools/ai-risk-register/index.astro', import.meta.url);

test('AI risk register page exposes the complete accessible template contract', async () => {
  const source = await readFile(pagePath, 'utf8');
  const requiredLabels = [
    'حالة الاستخدام',
    'النظام / النموذج / المورد',
    'مالك العمل',
    'أنواع البيانات',
    'المستخدمون المتأثرون',
    'فئة الخطر',
    'الاحتمالية',
    'الأثر',
    'مستوى الخطر',
    'الضوابط',
    'الحاجة لموافقة بشرية',
    'المراقبة',
    'الأدلة',
    'تاريخ المراجعة',
    'الحالة',
  ];

  assert.ok(source.includes('قالب تنفيذ من BrightAI'));
  assert.match(source, /ليس.*درجة.*رسمي|ليست.*درجة.*رسمية/);
  assert.match(source, /solutions\/ai-risk-classification/);
  assert.match(source, /assessment\/ai-governance-readiness/);
  assert.match(source, /<table[\s\S]*<caption>[\s\S]*<thead>[\s\S]*<tbody>/);
  assert.match(source, /data-label=/);
  assert.match(source, /@media print/);
  assert.equal((source.match(/<h1\b/g) ?? []).length, 1);

  for (const label of requiredLabels) {
    assert.ok(source.includes(label), `missing field label: ${label}`);
  }
});
