import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getSignUpAvailability } from '../src/shared/sign-up-availability.mjs';

const configuredAuthUrl = 'https://auth.example.test/auth';

test('signup availability distinguishes missing Auth setup from a deliberately closed portal', () => {
  const cases = [
    { authUrl: '', portalEnabled: true, available: false, message: 'التسجيل غير متاح الآن؛ خدمة الحسابات غير مهيأة.' },
    { authUrl: '', portalEnabled: false, available: false, message: 'التسجيل غير متاح الآن؛ خدمة الحسابات غير مهيأة.' },
    { authUrl: configuredAuthUrl, portalEnabled: false, available: false, message: 'التسجيل مغلق حاليًا. تواصل معنا لمعرفة خيارات استكشاف المنتج.' },
    { authUrl: configuredAuthUrl, portalEnabled: true, available: true, message: '' },
  ];
  for (const state of cases) {
    assert.deepEqual(getSignUpAvailability(state.authUrl, state.portalEnabled), {
      available: state.available,
      message: state.message,
    });
  }
});

test('whitespace-only Auth setup is treated as missing and messages never expose a URL or env key', () => {
  const result = getSignUpAvailability('  \n ', false);
  assert.equal(result.available, false);
  assert.match(result.message, /خدمة الحسابات غير مهيأة/);
  assert.doesNotMatch(result.message, /https?:|NEON_AUTH_BASE_URL|AIGAS_APP_ENABLED/);
});

test('signup page renders the resolved state with a contact alternative and no stale setup-only message', () => {
  const page = readFileSync(new URL('../src/pages/auth/sign-up.astro', import.meta.url), 'utf8');
  assert.match(page, /getSignUpAvailability\(authUrl, portalEnabled\)/);
  assert.match(page, /signUpAvailability\.available \?/);
  assert.match(page, /href="\/contact\/"/);
  assert.doesNotMatch(page, /لم يُضبط عنوان Neon Auth لهذا التشغيل/);
});
