import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();

const strategicSources = [
  ['governance hub', 'src/components/hub/AiGovernancePillar.astro'],
  ['SDAIA risk guide', 'src/components/hub/SdaiaAiRiskManagementGuide.astro'],
  ['Agentic AI security', 'src/components/hub/AgenticAiSecurityPillar.astro'],
  ['Agentic AI governance', 'src/components/hub/AgenticAiGovernancePillar.astro'],
  ['governance platform', 'src/pages/solutions/[slug].astro'],
  ['AI Firewall', 'src/pages/solutions/[slug].astro'],
  ['PDPL guide', 'src/content/docs/pdpl-ai-complete-guide.md'],
  ['NCA cybersecurity guide', 'src/content/blog/nca-cybersecurity-requirements-saudi.md'],
  ['ISO 42001 guide', 'src/content/blog/iso-42001-saudi-implementation-guide.md'],
  ['Riyadh banking', 'src/pages/solutions/[sector]/[city].astro'],
  ['readiness assessment', 'src/pages/assessment/ai-governance-readiness/index.astro'],
];

const read = (relativePath) => readFileSync(path.join(root, relativePath), 'utf8');

test('every strategic source exposes visible AI-answer content signals', () => {
  for (const [name, relativePath] of strategicSources) {
    const source = read(relativePath);
    for (const marker of ['المصدر الرسمي', 'آخر تحديث', 'متطلب أو إرشاد رسمي', 'منهج BrightAI للتنفيذ']) {
      assert.ok(source.includes(marker), `${name} must expose ${marker}`);
    }
    assert.ok(/<(?:table|ol|ul|figure)\b|"(?:table|ol|ul|figure)"/.test(source), `${name} must expose a structured framework`);
  }
});

test('the hub route and index register Agentic AI Security', () => {
  assert.match(read('src/pages/hub/[slug].astro'), /agentic-ai-security/, 'hub route must register the security page');
  assert.match(read('src/pages/hub/index.astro'), /agentic-ai-security/, 'hub index must link the security page');
});

test('machine-readable files cite only the approved strategic set', () => {
  for (const relativePath of ['public/llms.txt', 'public/llms-full.txt', 'public/ai.txt']) {
    const source = read(relativePath);
    assert.match(source, /https:\/\/brightai\.live\/hub\/agentic-ai-security\//, `${relativePath} must include the Agentic security owner`);
    assert.doesNotMatch(source, /Cloud \(KSA\)|Air-Gapped/, `${relativePath} must not state unsupported deployment modes`);
  }
});
