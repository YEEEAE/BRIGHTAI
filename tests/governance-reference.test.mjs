import assert from 'node:assert/strict';
import test from 'node:test';
import { createGovernanceRegistry } from '../src/server/governance/registry.mjs';
import { pdplArticle19Reference } from '../src/server/governance/reference-catalog.mjs';

test('official reference remains traceable and cannot be applied before approval', () => {
  const registry = createGovernanceRegistry({ today: () => '2026-11-26' });
  const asset = registry.registerAsset({ synthetic: true, id: 'example', kind: 'SYSTEM', version: 1,
    owner: 'owner', purpose: 'Synthetic assessment.', dataSource: { kind: 'SYNTHETIC', reference: 'example' },
    limits: [], review: { reviewer: 'reviewer', dueOn: '2026-12-31' } });
  const pack = pdplArticle19Reference();
  registry.publishPack(pack);
  assert.throws(() => registry.applyPack(asset.id, pack.id), /independently approved/);
  assert.throws(() => registry.publishPack({ ...pack, id: 'reference.invalid', source: { ...pack.source, url: 'https://example.com/law' } }));
  assert.throws(() => registry.publishPack({ ...pack, id: 'reference.invalid', source: { ...pack.source, status: 'APPROVED' } }));
});
