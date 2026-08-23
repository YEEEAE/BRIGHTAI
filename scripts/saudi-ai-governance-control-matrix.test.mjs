import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const componentPath = new URL('../src/components/hub/AiGovernancePillar.astro', import.meta.url);
const source = fs.readFileSync(componentPath, 'utf8');

test('Saudi AI governance control matrix exposes the complete practical contract', () => {
  assert.match(source, /governanceControlMatrix/);
  assert.match(source, /Saudi AI Governance Control Matrix/);
  assert.match(source, /ليست وثيقة رسمية|مو وثيقة رسمية|ليست شهادة/);

  const rows = source.match(/id: 'control-[^']+'/g) ?? [];
  assert.equal(rows.length, 13);

  for (const field of ['objective', 'risk', 'control', 'owner', 'evidence', 'capability', 'reference']) {
    assert.match(source, new RegExp(`${field}:`));
  }

  assert.match(source, /href="\/solutions\//);
  assert.match(source, /data-label=/);
  assert.match(source, /<caption>/);
});
