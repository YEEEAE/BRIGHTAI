import test from 'node:test';
import assert from 'node:assert/strict';
import { productNavigation } from '../src/shared/product-navigation.mjs';
import { readLastLab, rememberLastLab } from '../src/shared/lab-session.mjs';

const createStorage = () => {
  const values = new Map();
  return {
    values,
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  };
};

test('entering a public lab records only its allowlisted slug and resumes to that lab', () => {
  const storage = createStorage();
  for (const product of productNavigation) {
    assert.equal(rememberLastLab(product.slug, () => storage), true);
    const result = readLastLab(() => storage);
    assert.equal(result.available, true);
    assert.equal(result.product, product);
    assert.deepEqual([...storage.values.keys()], ['aigas:lab:last']);
    assert.deepEqual([...storage.values.values()], [product.slug]);
  }
});

test('the most recently visited lab replaces the previous resume destination', () => {
  const storage = createStorage();
  rememberLastLab('firewall', () => storage);
  rememberLastLab('risk-engine', () => storage);
  assert.equal(readLastLab(() => storage).product.slug, 'risk-engine');
});

test('invalid values and user-entered content are never stored as a lab destination', () => {
  const storage = createStorage();
  for (const value of [null, '', 'https://example.test', '/products/firewall/', 'firewall\nsecret text', {}, ['firewall']]) {
    assert.equal(rememberLastLab(value, () => storage), false);
  }
  assert.equal(storage.values.size, 0);
  storage.setItem('aigas:lab:last', 'firewall\nsecret text');
  assert.equal(readLastLab(() => storage).product, null);
});

test('blocked session storage fails closed and reports that the resume shortcut is unavailable', () => {
  const blocked = () => { throw new DOMException('Blocked', 'SecurityError'); };
  assert.equal(rememberLastLab('firewall', blocked), false);
  assert.deepEqual(readLastLab(blocked), { available: false, product: null });
});
