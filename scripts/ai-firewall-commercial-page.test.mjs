import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const route = await readFile('src/pages/solutions/[slug].astro', 'utf8');
const data = await readFile('src/data/solutions.ts', 'utf8');

test('AI Firewall has a dedicated commercial page contract', () => {
  for (const marker of [
    "solution.slug === 'ai-firewall'",
    'ai-firewall-flow',
    'ai-firewall-capabilities',
    'ai-firewall-vs-network-firewall',
    'ai-firewall-vs-dlp',
    'ai-firewall-scenario',
    'وش هو AI Firewall؟',
    'اطلب جلسة تصميم ضوابط',
  ]) {
    assert.match(route, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `missing ${marker}`);
  }
  assert.match(route, /مو ضمان مثالي/);
  assert.doesNotMatch(data, /يضمن التوافق مع NCA ECC/);
});

test('AI Firewall page avoids absolute provider and prevention claims', () => {
  const dedicatedBranch = route.slice(route.indexOf("isAiFirewall ?"), route.indexOf("isGovernancePlatform ?"));
  assert.doesNotMatch(dedicatedBranch, /يعمل مع جميع نماذج/);
  assert.doesNotMatch(dedicatedBranch, /يمنع كل تسريب/);
  assert.match(route, /PDPL/);
  assert.match(route, /NCA/);
  assert.match(route, /SDAIA/);
});
