import test from 'node:test';
import assert from 'node:assert/strict';
import { workspaceGuidance } from '../src/server/kernel/guidance.mjs';

test('identity without membership receives no product destination', () => {
  assert.equal(workspaceGuidance(null, [{ slug: 'ledger', enabled: true, href: '/app/ledger/' }]).productSlug, null);
});
test('exploration guidance does not promise execution or elevate an institution admin', () => {
  const product = { slug: 'ledger', enabled: true, href: '/app/ledger/', accessSource: 'INTERNAL_EXPLORATION_48H' };
  assert.match(workspaceGuidance({ role: 'MEMBER' }, [product]).message, /تصفح/);
  assert.equal(workspaceGuidance({ role: 'MEMBER' }, [product]).productSlug, 'ledger');
  assert.equal(workspaceGuidance({ role: 'ADMIN' }, [{ ...product, enabled: false, href: null }]).productSlug, null);
  assert.match(workspaceGuidance({ role: 'ADMIN' }, []).message, /لا يمنح صلاحية المشغّل/);
});
test('unavailable schema or revoked access never becomes a next destination', () => {
  for (const product of [
    { slug: 'ledger', enabled: true, href: null },
    { slug: 'ledger', enabled: false, href: '/app/ledger/' },
    { slug: 'ledger', enabled: true, href: 'https://example.test/' },
  ]) assert.equal(workspaceGuidance({ role: 'MEMBER' }, [product]).productSlug, null);
});
