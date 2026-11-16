import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import pg from 'pg';
import { readiness } from '../src/server/kernel/readiness.mjs';
import { resetBuildIdentity } from '../src/server/kernel/version.mjs';

test('readiness rejects invalid JWKS and every conflicting SHA claim', async t => {
  const dir = mkdtempSync(join(tmpdir(), 'aigas-readiness-'));
  const savedEnv = { ...process.env };
  const savedFetch = globalThis.fetch;
  const original = Object.fromEntries(['connect', 'query', 'end'].map(key => [key, pg.Client.prototype[key]]));
  t.after(() => {
    globalThis.fetch = savedFetch;
    Object.assign(pg.Client.prototype, original);
    process.env = savedEnv;
    resetBuildIdentity();
    rmSync(dir, { recursive: true });
  });
  pg.Client.prototype.connect = async () => {};
  pg.Client.prototype.query = async () => ({ rows: [{ kernel_schema: true }] });
  pg.Client.prototype.end = async () => {};
  const sha = 'a'.repeat(40);
  process.env.AIGAS_VERSION_FILE = join(dir, 'version.json');
  writeFileSync(process.env.AIGAS_VERSION_FILE, JSON.stringify({ commit: sha }));
  process.env.DATABASE_URL = 'postgresql://local/test';
  process.env.AIGAS_HEALTH_AUTH_PROBE = 'true';
  process.env.RENDER_GIT_COMMIT = sha;
  delete process.env.AIGAS_RELEASE_SHA;
  for (const [name, response, expected] of [
    ['html', new Response('<html>login</html>'), 'unavailable'],
    ['empty', Response.json({ keys: [] }), 'unavailable'],
    ['wrong-algorithm', Response.json({ keys: [{ kty: 'RSA', alg: 'RS256' }] }), 'unavailable'],
    ['valid', Response.json({ keys: [{ kty: 'OKP', crv: 'Ed25519', x: 'a'.repeat(43) }] }), 'ready'],
  ]) {
    process.env.NEON_AUTH_BASE_URL = `https://${name}.example.test`;
    process.env.NEON_AUTH_JWKS_URL = `https://${name}.example.test/jwks`;
    globalThis.fetch = async () => response;
    assert.equal((await readiness()).state, expected, name);
  }
  process.env.AIGAS_RELEASE_SHA = sha;
  process.env.RENDER_GIT_COMMIT = 'b'.repeat(40);
  resetBuildIdentity();
  const mismatch = await readiness();
  assert.equal(mismatch.state, 'blocked');
  assert.equal(mismatch.release.consistent, false);
});
