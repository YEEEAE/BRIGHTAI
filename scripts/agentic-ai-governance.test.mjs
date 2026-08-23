import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const component = await readFile('src/components/hub/AgenticAiGovernancePillar.astro', 'utf8');
const route = await readFile('src/pages/hub/[slug].astro', 'utf8');
const index = await readFile('src/pages/hub/index.astro', 'utf8');

test('Agentic AI governance pillar has the operating-model sections', () => {
  for (const phrase of ['سجّل', 'صنّف', 'منح الأدوات والبيانات', 'اعتمد الأفعال العالية الخطورة', 'مصفوفة RACI', 'Governance checklist', 'Evidence by design']) {
    assert.match(component, new RegExp(phrase));
  }
  for (const role of ['Business owner', 'Technical owner', 'Risk / compliance owner', 'Approver']) assert.match(component, new RegExp(role));
  assert.doesNotMatch(component, /noindex/);
});

test('Agentic AI governance is registered as a first-class hub route', () => {
  assert.match(route, /slug: 'agentic-ai-governance'/);
  assert.match(route, /AgenticAiGovernancePillar/);
  assert.match(index, /slug: 'agentic-ai-governance'/);
});
