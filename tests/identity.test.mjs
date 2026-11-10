import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPair, SignJWT } from 'jose';
import { authenticate, authConfig, verifyIdentity } from '../src/server/kernel/auth.mjs';
import { grantKindClass, productGrantState, resolveProductAccess } from '../src/server/kernel/access.mjs';
import { POLICY_SCOPE_ORDER, resolveKernelPolicy } from '../src/server/kernel/policies.mjs';

const issuer = 'https://auth.example.test';
const sign = (key, claims = {}, options = {}) => new SignJWT(claims)
  .setProtectedHeader({ alg: options.alg ?? 'EdDSA' })
  .setIssuer(options.issuer ?? issuer)
  .setSubject(claims.sub ?? randomUUID())
  .setIssuedAt(options.iat)
  .setExpirationTime(options.exp ?? '5m')
  .sign(key);

test('AU01 identity: EdDSA only, required claims, bounded age, issuer and UUID subject', async () => {
  const { privateKey, publicKey } = await generateKeyPair('EdDSA');
  const other = await generateKeyPair('EdDSA');
  const userId = randomUUID();
  const token = await sign(privateKey, { sub: userId });
  assert.deepEqual(await verifyIdentity(token, publicKey, issuer), { userId });

  // A token minted with a different algorithm is not accepted by the EdDSA verifier.
  const hs = await new SignJWT({}).setProtectedHeader({ alg: 'HS256' }).setIssuer(issuer).setSubject(userId).setIssuedAt().setExpirationTime('5m').sign(new TextEncoder().encode('local-test-secret'));
  await assert.rejects(verifyIdentity(hs, publicKey, issuer));

  // Missing iat (required for maxTokenAge), missing exp and a non-UUID subject are rejected.
  const noIssuedAt = await new SignJWT({}).setProtectedHeader({ alg: 'EdDSA' }).setIssuer(issuer).setSubject(userId).setExpirationTime('5m').sign(privateKey);
  await assert.rejects(verifyIdentity(noIssuedAt, publicKey, issuer));
  await assert.rejects(verifyIdentity(await sign(privateKey, { sub: 'not-a-uuid' }), publicKey, issuer));
  await assert.rejects(verifyIdentity(await sign(privateKey, { sub: userId }, { exp: '-1s' }), publicKey, issuer));
  await assert.rejects(verifyIdentity(await sign(privateKey, { sub: userId }, { issuer: 'https://other.example.test' }), publicKey, issuer));
  await assert.rejects(verifyIdentity(token, other.publicKey, issuer));

  // A token older than the 15-minute maximum age is rejected even when exp is still valid.
  const old = await sign(privateKey, { sub: userId }, { iat: Math.floor(Date.now() / 1000) - 16 * 60, exp: '1h' });
  await assert.rejects(verifyIdentity(old, publicKey, issuer));

  // Anonymous and banned/anonymous-shaped identities never become a Kernel user.
  await assert.rejects(verifyIdentity(await sign(privateKey, { sub: userId, role: 'anonymous' }), publicKey, issuer));
  await assert.rejects(verifyIdentity(await sign(privateKey, { sub: userId, is_anonymous: true }), publicKey, issuer));
});

test('AU01/AU02 auth setup: same-origin HTTPS JWKS only, no false readiness, bounded header', async () => {
  const previous = { base: process.env.NEON_AUTH_BASE_URL, jwks: process.env.NEON_AUTH_JWKS_URL };
  try {
    process.env.NEON_AUTH_BASE_URL = 'https://auth.example.test/auth';
    process.env.NEON_AUTH_JWKS_URL = 'https://auth.example.test/auth/jwks';
    assert.deepEqual(authConfig(), { base: 'https://auth.example.test/auth', jwks: 'https://auth.example.test/auth/jwks', issuer: 'https://auth.example.test' });

    process.env.NEON_AUTH_JWKS_URL = 'https://keys.example.test/jwks';
    assert.equal(authConfig(), null, 'JWKS must share the issuer origin');
    process.env.NEON_AUTH_JWKS_URL = 'https://auth.example.test/auth/jwks';
    process.env.NEON_AUTH_BASE_URL = 'http://auth.example.test/auth';
    assert.equal(authConfig(), null, 'plain HTTP is never accepted');

    delete process.env.NEON_AUTH_BASE_URL;
    delete process.env.NEON_AUTH_JWKS_URL;
    await assert.rejects(authenticate(new Request('https://local/app/api/kernel/', { headers: { authorization: 'Bearer any' } })), { status: 503, code: 'AUTH_SETUP_REQUIRED' });
    await assert.rejects(authenticate(new Request('https://local/app/api/kernel/', { headers: { authorization: `Bearer ${'x'.repeat(16385)}` } })), { status: 401, code: 'UNAUTHORIZED' });
  } finally {
    if (previous.base === undefined) delete process.env.NEON_AUTH_BASE_URL; else process.env.NEON_AUTH_BASE_URL = previous.base;
    if (previous.jwks === undefined) delete process.env.NEON_AUTH_JWKS_URL; else process.env.NEON_AUTH_JWKS_URL = previous.jwks;
  }
});

test('AU07 entitlement: purchase, trial, administrative grant and licence stay separate', () => {
  const now = Date.now();
  const grant = (overrides = {}) => ({
    access_kind: 'ADMIN_NON_BILLED', approvalReferencePresent: true, grantState: 'ACTIVE',
    approved_at: new Date(now - 60_000).toISOString(), expires_at: new Date(now + 86_400_000).toISOString(),
    revoked_at: null, checked_at: new Date(now).toISOString(), ...overrides,
  });
  const trial = (state, grantsProduct = state === 'ACTIVE') => ({ state, grantsProduct, reason: state });

  // A stored ENABLED toggle alone is never access.
  const toggled = resolveProductAccess({ storedStatus: 'ENABLED', grant: null, trial: trial('NOT_CONFIGURED', false) });
  assert.equal(toggled.state, 'DISABLED'); assert.equal(toggled.grantsProduct, false); assert.equal(toggled.source, null);
  assert.equal(toggled.license.state, 'NOT_CONFIGURED');

  const administrative = resolveProductAccess({ storedStatus: 'ENABLED', grant: grant(), trial: trial('NOT_CONFIGURED', false) });
  assert.equal(administrative.state, 'ENABLED'); assert.equal(administrative.source, 'ADMIN_NON_BILLED');
  assert.equal(administrative.trial.state, 'NOT_CONFIGURED');

  // Evidence-required: a grant without an operator approval reference grants nothing.
  const noEvidence = resolveProductAccess({ storedStatus: 'ENABLED', grant: grant({ approvalReferencePresent: false }), trial: trial('NOT_CONFIGURED', false) });
  assert.equal(noEvidence.grantsProduct, false); assert.equal(noEvidence.administrative.state, 'NOT_CONFIGURED');

  const expiredGrant = resolveProductAccess({ storedStatus: 'ENABLED', grant: grant({ grantState: 'EXPIRED', expires_at: new Date(now - 1_000).toISOString() }), trial: trial('NOT_CONFIGURED', false) });
  assert.equal(expiredGrant.state, 'EXPIRED'); assert.equal(expiredGrant.expired.administrative, true);

  const trialOnly = resolveProductAccess({ storedStatus: 'ENABLED', grant: null, trial: trial('ACTIVE') });
  assert.equal(trialOnly.state, 'ENABLED'); assert.equal(trialOnly.source, 'TRIAL_48H');
  assert.equal(trialOnly.administrative.state, 'NOT_APPROVED'); assert.equal(trialOnly.license.grantsProduct, false);

  const revokedGrantWithTrial = resolveProductAccess({ storedStatus: 'ENABLED', grant: grant({ grantState: 'REVOKED', revoked_at: new Date().toISOString() }), trial: trial('ACTIVE') });
  assert.equal(revokedGrantWithTrial.state, 'ENABLED'); assert.equal(revokedGrantWithTrial.source, 'TRIAL_48H');

  const expiredTrial = resolveProductAccess({ storedStatus: 'ENABLED', grant: null, trial: trial('EXPIRED', false) });
  assert.equal(expiredTrial.state, 'EXPIRED'); assert.equal(expiredTrial.reason, 'TRIAL_WINDOW_ENDED');

  assert.equal(productGrantState(grant()), 'ACTIVE');
  assert.equal(productGrantState(grant({ approved_at: new Date(now + 60_000).toISOString(), expires_at: new Date(now + 120_000).toISOString() })), 'PENDING');
  assert.equal(productGrantState(grant({ access_kind: 'SUBSCRIPTION' })), 'NOT_CONFIGURED');
  assert.equal(grantKindClass('SUBSCRIPTION'), 'SUBSCRIPTION');
  assert.equal(grantKindClass('UNKNOWN'), 'NOT_CONFIGURED');
});

test('AU06 policy: top-level mandatory deny cannot be softened by a lower scope', () => {
  const row = (scope, effect, extra = {}) => ({
    id: `${scope}-${effect}`, version: 1, scope, effect, conditions: {}, obligations: [],
    is_mandatory: effect === 'HARD_DENY', checksum: 'local-fixture', ...extra,
  });
  assert.deepEqual(POLICY_SCOPE_ORDER, ['ENTERPRISE', 'DEPARTMENT', 'PRODUCT', 'USER']);

  const mandatory = resolveKernelPolicy([
    row('ENTERPRISE', 'HARD_DENY'), row('DEPARTMENT', 'ALLOW'), row('USER', 'ALLOW'),
  ]);
  assert.equal(mandatory.decision, 'BLOCK'); assert.equal(mandatory.reason, 'MANDATORY_BLOCK');
  assert.equal(mandatory.mandatory, true); assert.equal(mandatory.deciding.scope, 'ENTERPRISE');

  const lowerBlock = resolveKernelPolicy([row('ENTERPRISE', 'ALLOW'), row('DEPARTMENT', 'BLOCK')]);
  assert.equal(lowerBlock.decision, 'BLOCK'); assert.equal(lowerBlock.reason, 'BLOCK');

  // An ALLOW needs an explicit Enterprise ALLOW; absence of a deny is not an allow.
  assert.equal(resolveKernelPolicy([row('PRODUCT', 'ALLOW')]).reason, 'POLICY_UNAVAILABLE');
  assert.equal(resolveKernelPolicy([row('ENTERPRISE', 'ALLOW')]).decision, 'ALLOW');

  // An obligation that cannot be enforced is a block, never a silent allow.
  assert.equal(resolveKernelPolicy([row('ENTERPRISE', 'ALLOW'), row('USER', 'REDACT')]).reason, 'POLICY_OBLIGATION_UNAVAILABLE');
  assert.equal(resolveKernelPolicy([row('ENTERPRISE', 'ALLOW'), row('USER', 'WARN')]).decision, 'ALLOW');
});
