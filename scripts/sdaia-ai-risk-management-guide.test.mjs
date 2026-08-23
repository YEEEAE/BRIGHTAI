import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

test('SDAIA guide route and component expose the regulatory-content contract', async () => {
  const [route, hubIndex, component] = await Promise.all([
    readFile(new URL('../src/pages/hub/[slug].astro', import.meta.url), 'utf8'),
    readFile(new URL('../src/pages/hub/index.astro', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/hub/SdaiaAiRiskManagementGuide.astro', import.meta.url), 'utf8'),
  ]);

  assert.match(route, /slug: 'sdaia-ai-risk-management'/);
  assert.match(route, /SdaiaAiRiskManagementGuide/);
  assert.match(hubIndex, /sdaia-ai-risk-management/);

  for (const text of [
    'SDAIA-P145', 'الإصدار 1.0', 'أبريل 2026',
    'تحديد السياق والنطاق', 'تحديد المخاطر وتقييمها', 'معالجة المخاطر', 'المتابعة والمراجعة',
    'inventory', 'classify', 'assess', 'assign owner', 'control', 'approve', 'monitor', 'evidence',
    '/solutions/ai-risk-classification/', '/solutions/human-approval-layer/',
    '/solutions/ai-audit-trail/', '/solutions/ai-evidence-file/',
    '/solutions/ai-governance-platform/', '/assessment/ai-governance-readiness/',
  ]) {
    assert.ok(component.includes(text), `missing required guide content: ${text}`);
  }

  assert.doesNotMatch(component, /endorsed by SDAIA|معتمد من سدايا|ضمان امتثال/);
});
