import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const pagePath = new URL('../src/pages/tools/ai-risk-register/index.astro', import.meta.url);
const exportScriptPath = new URL('../public/js/ai-risk-register-export.js', import.meta.url);

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

test('AI risk register page ships the local CSV/JSON export as progressive enhancement', async () => {
  const source = await readFile(pagePath, 'utf8');
  const exportScript = await readFile(exportScriptPath, 'utf8');

  // Data island + module wiring
  assert.match(source, /<script type="application\/json" id="risk-register-data"/);
  assert.match(source, /set:html=\{JSON\.stringify\(exportData\)\}/);
  assert.match(source, /<script is:inline type="module" src="\/js\/ai-risk-register-export\.js"><\/script>/);

  // Export bar hidden without JS (progressive enhancement), buttons present
  assert.match(source, /class="risk-export" id="risk-export" hidden/);
  assert.match(source, /id="risk-export-csv"/);
  assert.match(source, /id="risk-export-json"/);

  // No inline handlers (CSP) anywhere on the page
  assert.doesNotMatch(source, /onclick=|onchange=|onsubmit=/);

  // Print keeps hiding the interactive bar
  assert.match(source, /\.risk-print-hint,\.risk-notice__icon,\.risk-export\{display:none\}/);

  // Export module is local-only: builds files in the browser, no network
  assert.ok(exportScript.includes("URL.createObjectURL"));
  assert.ok(exportScript.includes("\\uFEFF"));
  assert.ok(!exportScript.includes("fetch("));
  assert.ok(!exportScript.includes("XMLHttpRequest"));
  assert.ok(!exportScript.includes("sendBeacon"));
});
