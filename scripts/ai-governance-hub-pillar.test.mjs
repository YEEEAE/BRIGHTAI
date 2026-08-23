import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const componentPath = new URL('../src/components/hub/AiGovernancePillar.astro', import.meta.url);

async function readPillar() {
  return readFile(componentPath, 'utf8');
}

test('AI governance hub pillar has the required educational sections and Saudi official sources', async () => {
  const source = await readPillar();

  for (const requiredMarker of [
    'وش هي حوكمة الذكاء الاصطناعي؟',
    'الفرق العملي',
    'دورة حياة الحوكمة',
    'الأدوار والمساءلة',
    'تصنيف المخاطر',
    'الإشراف البشري',
    'من السياسة إلى الضابط',
    'أدلة التدقيق',
    'حماية البيانات',
    'حوكمة النماذج والوكلاء',
    'خارطة طريق عملية',
    'https://sdaia.gov.sa',
    'https://nca.gov.sa',
  ]) {
    assert.ok(source.includes(requiredMarker), `missing pillar marker: ${requiredMarker}`);
  }
});

test('AI governance hub pillar keeps commercial intent behind a contextual product link', async () => {
  const source = await readPillar();

  assert.match(source, /href="\/solutions\/ai-governance-platform\/"/);
  assert.match(source, /مو بديل عن تقييم قانوني أو تنظيمي/);
});
