import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const navigationPath = path.join(root, 'src', 'data', 'navigation.ts');

test('footer city links point directly to their canonical sector-city pages', async () => {
  const source = await readFile(navigationPath, 'utf8');

  assert.doesNotMatch(source, /href:\s*'\/solutions\/cities\/(?:riyadh|jeddah|dammam|khobar|mecca|madinah)\/'/);
  for (const href of [
    '/solutions/banking-ai-governance/riyadh/',
    '/solutions/healthcare-ai-governance/jeddah/',
    '/solutions/government-ai-governance/dammam/',
    '/solutions/banking-ai-governance/khobar/',
    '/solutions/healthcare-ai-governance/mecca/',
    '/solutions/government-ai-governance/madinah/',
  ]) {
    assert.match(source, new RegExp(`href:\\s*'${href}'`));
  }
});
