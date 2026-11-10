import test from 'node:test';
import assert from 'node:assert/strict';
import { productNavigation, productForSlug, productForReturnTo, productEntryPath, authorizedProductDestination, productContactPath } from '../src/shared/product-navigation.mjs';

const tenant_id = '11111111-1111-4111-8111-111111111111';
test('all five product entry paths preserve only canonical allowlisted destinations', () => {
  assert.equal(productNavigation.length, 5);
  assert.equal(new Set(productNavigation.map(p => p.slug)).size, 5);
  for (const product of productNavigation) {
    assert.equal(productForSlug(product.slug), product);
    const entry = new URL(productEntryPath(product.slug), 'https://brightai.live');
    assert.equal(entry.pathname, '/app/kernel/');
    assert.equal(productForReturnTo(entry.searchParams.get('returnTo')), product);
    assert.equal(new URL(productContactPath(product.slug, true), entry).pathname, '/contact/');
  }
});

test('external, encoded, recursive and non-product return paths cannot redirect', () => {
  for (const value of [null, undefined, '', '//evil.test', 'https://evil.test/app/firewall/', '/\\evil.test', '/app/kernel/', '/auth/sign-up/', '/app/firewall/?returnTo=https://evil.test', '/app/firewall/#x', '/app/%66irewall/', '/app/ledger/../firewall/', '/app/firewall', '/app/firewall//', ['firewall'], {}]) {
    assert.equal(productForReturnTo(value), null);
    assert.equal(authorizedProductDestination(value, { tenant: { tenant_id }, products: [] }), null);
  }
});

test('only a server-authorized product and canonical tenant selector produce a destination', () => {
  for (const product of productNavigation) {
    const access = { slug: product.slug, enabled: true, href: product.workspacePath };
    const dashboard = { tenant: { tenant_id }, products: [access] };
    assert.equal(authorizedProductDestination(product.workspacePath, dashboard), `${product.workspacePath}?workspace=${tenant_id}`);
    for (const blocked of [undefined, {}, { ...dashboard, tenant: null }, { ...dashboard, tenant: { tenant_id: '//evil.test' } }, { ...dashboard, products: [] }, { ...dashboard, products: [{ ...access, enabled: false }] }, { ...dashboard, products: [{ ...access, href: null }] }, { ...dashboard, products: [{ ...access, href: 'https://evil.test' }] }, { ...dashboard, products: [{ ...access, href: '/app/kernel/' }] }]) {
      assert.equal(authorizedProductDestination(product.workspacePath, blocked), null);
    }
  }
});
