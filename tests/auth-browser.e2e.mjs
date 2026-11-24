// Run after npm run build. BRIGHTAI_PLAYWRIGHT_MODULE can point to a local Playwright installation.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync, spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { createServer } from 'node:https';
import { createServer as createTcpServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import pg from 'pg';
import { grantProduct, installSchema, localDatabaseUrl } from './helpers/database.mjs';

const { chromium } = await import(process.env.BRIGHTAI_PLAYWRIGHT_MODULE ?? 'playwright');
const dbUrl = localDatabaseUrl('KERNEL_AUTH_E2E_DATABASE_URL');
assert.ok(dbUrl, 'Set KERNEL_AUTH_E2E_DATABASE_URL to a fresh, disposable PostgreSQL 18 database on localhost.');
const db = new pg.Pool({ connectionString: dbUrl });
const { privateKey, publicKey } = await generateKeyPair('EdDSA');
const jwks = { keys: [{ ...await exportJWK(publicKey), kid: 'fixture-key', alg: 'EdDSA' }] };
const directory = await mkdtemp(join(tmpdir(), 'brightai-auth-browser-'));
const appProcesses = [];
const cookie = '__Secure-neon-auth.session_token';
const browserCookie = '__Host-brightai-auth.session_token';
const email = 'journey@example.test';
const password = 'fixture-password';
const id = '11111111-1111-4111-8111-111111111111';
const invitation = '22222222-2222-4222-8222-222222222222';
const workspace = '33333333-3333-4333-8333-333333333333';
const cookieHeader = `${cookie}=fixture-session; Path=/upstream; Domain=127.0.0.1; Max-Age=600; Secure; SameSite=None; Partitioned`;
let created = false, verified = false, allowUnverified = false, expiresAt = 0, otpUses = 0, signupCalls = 0, nativeAccepts = 0;
const organization = randomUUID();
const inviter = randomUUID();
let reloads = 0, upstreamOrigin, jwt, malformedSession = false;
const memberCount = async () => (await db.query('SELECT count(*)::int AS count FROM aigas_memberships WHERE user_id=$1 AND tenant_id=$2', [id, workspace])).rows[0].count;

async function seedInvitation() {
  await installSchema(db);
  await db.query('INSERT INTO neon_auth."user"(id,name,email,banned,"emailVerified") VALUES($1,$2,$3,false,false),($4,$5,$6,false,true)', [id, 'Synthetic User', email, inviter, 'Synthetic Owner', 'owner@example.test']);
  await db.query('INSERT INTO aigas_tenants(id,name) VALUES($1,$2)', [workspace, 'Synthetic Workspace']);
  await db.query("INSERT INTO aigas_memberships(tenant_id,user_id,role) VALUES($1,$2,'OWNER')", [workspace, inviter]);
  await db.query('INSERT INTO neon_auth.organization(id,name) VALUES($1,$2)', [organization, 'Synthetic Workspace']);
  await db.query("INSERT INTO neon_auth.member(id,\"organizationId\",\"userId\",role) VALUES($1,$2,$3,'owner')", [randomUUID(), organization, inviter]);
  await db.query('INSERT INTO aigas_auth_organizations(tenant_id,organization_id,linked_by) VALUES($1,$2,$3)', [workspace, organization, inviter]);
  await db.query(`INSERT INTO neon_auth.invitation(id,email,status,"expiresAt","organizationId","inviterId",role)
    VALUES($1,$2,'pending',now()+interval '1 day',$3,$4,'member')`, [invitation, email, organization, inviter]);
  await db.query('INSERT INTO aigas_member_invitations(invitation_id,tenant_id,invited_by) VALUES($1,$2,$3)', [invitation, workspace, inviter]);
}
let browser, upstream;
const firstSignup = Promise.withResolvers();

const respond = (res, data, status = 200, headers = {}) => {
  res.writeHead(status, { 'Content-Type': 'application/json', ...headers });
  res.end(JSON.stringify(data));
};
const user = () => ({ id, email, emailVerified: verified, name: 'Synthetic User' });
const issue = res => {
  expiresAt = Date.now() + 600000;
  respond(res, { user: user(), token: 'raw-fixture-session-token' }, 200, { 'Set-Cookie': cookieHeader });
};

async function provider(req, res) {
  const url = new URL(req.url, 'https://fixture.invalid');
  if (url.pathname === '/branch/auth/jwks') return respond(res, jwks);
  if (url.pathname === '/branch/auth/.well-known/jwks.json') return respond(res, jwks);
  assert.equal(req.headers.origin, upstreamOrigin);
  assert.equal(req.headers['x-neon-auth-middleware'], 'true');
  assert.ok(!req.headers.cookie || req.headers.cookie === `${cookie}=fixture-session`);
  let raw = '';
  for await (const chunk of req) raw += chunk;
  const body = raw ? JSON.parse(raw) : {};
  const signedIn = req.headers.cookie === `${cookie}=fixture-session` && expiresAt > Date.now();

  switch (url.pathname) {
    case '/branch/auth/sign-up/email':
      signupCalls++;
      if (created) return respond(res, { code: 'USER_ALREADY_EXISTS', message: 'Email exists' }, 422);
      assert.equal(body.email, email);
      created = true;
      await firstSignup.promise;
      return respond(res, { user: user(), token: 'raw-fixture-token' });
    case '/branch/auth/email-otp/send-verification-otp':
      otpUses++;
      return body.email === email ? respond(res, { success: true }) : respond(res, { code: 'USER_NOT_FOUND' }, 400);
    case '/branch/auth/email-otp/verify-email':
      if (body.email !== email || body.otp !== '123456') return respond(res, { code: 'INVALID_OTP' }, 400);
      verified = true;
      await db.query('UPDATE neon_auth."user" SET "emailVerified"=true WHERE id=$1', [id]);
      return respond(res, { status: true, user: user() });
    case '/branch/auth/sign-in/email':
      if (body.email === 'mfa@example.test') return respond(res, { twoFactorRedirect: true }, 200, { 'Set-Cookie': cookieHeader });
      if (body.email !== email || body.password !== password) return respond(res, { code: 'INVALID_USER' }, 400);
      if (!verified && !allowUnverified) return respond(res, { code: 'EMAIL_NOT_VERIFIED' }, 403);
      return issue(res);
    case '/branch/auth/sign-in/email-otp':
      if (body.email !== email || body.otp !== '654321') return respond(res, { code: 'INVALID_OTP' }, 400);
      return issue(res);
    case '/branch/auth/get-session':
      assert.equal(url.searchParams.get('disableCookieCache'), 'true');
      reloads++;
      if (malformedSession) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        return res.end('<html>fixture outage</html>');
      }
      return respond(res, signedIn ? { user: user(), session: { id, userId: id, expiresAt: new Date(expiresAt), token: 'raw-fixture-token' } } : null);
    case '/branch/auth/sign-out':
      expiresAt = 0;
      return respond(res, { success: true }, signedIn ? 200 : 401);
    case '/branch/auth/token':
      return signedIn ? respond(res, { token: jwt }) : respond(res, { code: 'NO_SESSION' }, 401);
    case '/branch/auth/organization/accept-invitation':
      assert.equal(body.invitationId, invitation);
      assert.ok(signedIn && verified);
      nativeAccepts++;
      // Model a request accepted by Neon whose response was lost.
      await db.query("UPDATE neon_auth.invitation SET status='accepted' WHERE id=$1", [invitation]);
      await db.query("INSERT INTO neon_auth.member(id,\"organizationId\",\"userId\",role) VALUES($1,$2,$3,'member')", [randomUUID(), organization, id]);
      return respond(res, { code: 'UPSTREAM_UNAVAILABLE' }, 503);
    default: return respond(res, { code: 'UNKNOWN_FIXTURE_ROUTE' }, 404);
  }
}

async function startApp({ enabled, configured, cert }) {
  const probe = createTcpServer().listen(0, '127.0.0.1');
  await once(probe, 'listening');
  const { port } = probe.address();
  await new Promise(resolve => probe.close(resolve));
  const origin = `http://127.0.0.1:${port}`;
  const endpoint = `https://127.0.0.1:${upstream.address().port}/branch/auth`;
  const proc = spawn(process.execPath, ['scripts/server.mjs'], {
    env: {
      PATH: process.env.PATH, NODE_ENV: 'production', HOST: '127.0.0.1', PORT: String(port),
      AIGAS_APP_ENABLED: String(enabled), NODE_EXTRA_CA_CERTS: cert,
      DATABASE_URL: dbUrl, AIGAS_DB_RUNTIME_ROLE: 'aigas_runtime',
      NEON_AUTH_BASE_URL: configured ? endpoint : '', NEON_AUTH_JWKS_URL: configured ? `${endpoint}/jwks` : '',
    },
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  appProcesses.push(proc);
  for (let attempt = 0; attempt < 100; attempt++) {
    if (proc.exitCode !== null) throw new Error('BRIGHTAI server exited');
    if (await fetch(`${origin}/auth/sign-up/`).catch(() => null)) return origin;
    await delay(50);
  }
  throw new Error('BRIGHTAI server did not start');
}

try {
  await seedInvitation();
  const key = join(directory, 'localhost.key');
  const cert = join(directory, 'localhost.crt');
  execFileSync('openssl', ['req', '-x509', '-nodes', '-newkey', 'rsa:2048', '-days', '1', '-keyout', key, '-out', cert,
    '-subj', '/CN=127.0.0.1', '-addext', 'subjectAltName=IP:127.0.0.1'], { stdio: 'ignore' });
  upstream = createServer({ key: await readFile(key), cert: await readFile(cert) }, (req, res) => {
    provider(req, res).catch(error => { process.stderr.write(`${error.stack}\n`); respond(res, { code: 'FIXTURE_ERROR' }, 500); });
  }).listen(0, '127.0.0.1');
  await once(upstream, 'listening');
  jwt = await new SignJWT({}).setProtectedHeader({ alg: 'EdDSA', kid: 'fixture-key' })
    .setIssuer(`https://127.0.0.1:${upstream.address().port}`).setSubject(id).setIssuedAt().setExpirationTime('10m').sign(privateKey);
  const base = await startApp({ enabled: true, configured: true, cert });
  upstreamOrigin = base;
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const status = page.locator('[data-auth-status]');
  const waitStatus = async pattern => {
    await status.filter({ hasText: pattern }).waitFor({ timeout: 5000 });
    return status.textContent();
  };
  const fillCredentials = async (address, secret = password) => {
    await page.locator('#auth-email').fill(address);
    await page.locator('#auth-password').fill(secret);
    await page.locator('[data-submit]').click();
  };
  const logout = async () => {
    await page.locator('[data-sign-out]').click();
    await waitStatus(/تم تسجيل الخروج/);
    assert.equal((await context.cookies()).some(item => item.name === browserCookie), false);
  };

  const checkWidths = async widths => {
    const original = page.viewportSize();
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${width}px: ${page.url()}`);
    }
    await page.setViewportSize(original);
  };
  const widths = [390, 1024, 1440];
  await page.goto(`${base}/auth/sign-up/`);
  await waitStatus(/أكمل الحقول/);
  await checkWidths(widths);
  await page.locator('#auth-name').fill('Synthetic User');
  await fillCredentials(email);
  await waitStatus(/جارٍ إرسال طلب التسجيل/);
  assert.equal(await page.locator('[data-submit]').isDisabled(), true);
  firstSignup.resolve();
  const signupMessage = await waitStatus(/إذا أمكن إكمال التسجيل/);
  assert.equal(signupCalls, 1);
  await page.locator('[data-switch]').click();
  await fillCredentials(email);
  assert.equal(await waitStatus(/إذا أمكن إكمال التسجيل/), signupMessage);
  assert.equal(signupCalls, 2);
  assert.equal((await context.cookies()).some(item => item.name === browserCookie), false);

  await fillCredentials(email);
  const credentialMessage = await waitStatus(/تعذر تسجيل الدخول/);
  await fillCredentials('unknown@example.test');
  assert.equal(await waitStatus(/تعذر تسجيل الدخول/), credentialMessage);

  await page.locator('#verify-email').fill('unknown@example.test');
  await page.locator('[data-send-otp]').click();
  const otpMessage = await waitStatus(/إذا أمكن إرسال رمز/);
  await page.locator('#verify-email').fill(email);
  await page.locator('[data-send-otp]').click();
  assert.equal(await waitStatus(/إذا أمكن إرسال رمز/), otpMessage);
  assert.equal(otpUses, 2);
  await page.locator('#verify-otp').fill('000000');
  await page.locator('[data-verify-form] [type=submit]').click();
  await waitStatus(/تعذر التحقق من الرمز/);
  await page.locator('#verify-otp').fill('123456');
  await page.locator('[data-verify-form] [type=submit]').click();
  await waitStatus(/تم توثيق البريد/);

  await fillCredentials('mfa@example.test');
  await waitStatus(/يتطلب الدخول خطوة تحقق إضافية/);
  assert.equal(await page.locator('[data-auth-session]').isVisible(), false);
  assert.equal((await context.cookies()).some(item => item.name === browserCookie), false);

  const cookieResponse = page.waitForResponse(response => response.url().includes('/auth/api/sign-in/email') && response.ok());
  await fillCredentials(email);
  const loginResponse = await cookieResponse;
  assert.deepEqual(await loginResponse.json(), { user: user() });
  await waitStatus(/جلسة الدخول نشطة/);
  const currentCookie = (await context.cookies()).find(item => item.name === browserCookie);
  assert.ok(currentCookie);
  assert.deepEqual([currentCookie.domain, currentCookie.path, currentCookie.secure, currentCookie.httpOnly, currentCookie.sameSite], ['127.0.0.1', '/', true, true, 'Lax']);
  assert.ok(!(await page.evaluate(() => document.cookie)).includes(browserCookie));
  await page.reload();
  await waitStatus(/جلسة الدخول نشطة/);
  const previousReloads = reloads;
  await page.locator('[data-refresh]').click();
  await waitStatus(/جلسة الدخول نشطة/);
  assert.ok(reloads > previousReloads);
  malformedSession = true;
  await page.locator('[data-refresh]').click();
  await waitStatus(/خدمة الحسابات غير متاحة مؤقتًا/);
  malformedSession = false;
  await page.locator('[data-refresh]').click();
  await waitStatus(/جلسة الدخول نشطة/);
  const rejectedOrigin = await fetch(`${base}/auth/api/sign-out/`, {
    method: 'POST', headers: { Origin: 'https://other.example.test', 'Content-Type': 'application/json' }, body: '{}',
  });
  assert.equal(rejectedOrigin.status, 403);
  assert.equal((await fetch(`${base}/auth/api/sign-out/`, { method: 'POST' })).status, 403);
  assert.equal((await fetch(`${base}/auth/api/sign-out/`, {
    method: 'POST', headers: { Origin: base, 'Content-Type': 'text/plain' }, body: '{}',
  })).status, 415);
  assert.equal((await fetch(`${base}/auth/api/token/`, { headers: { 'Sec-Fetch-Site': 'same-site' } })).status, 403);
  assert.match((await fetch(`${base}/auth/api/get-session/`)).headers.get('cache-control'), /no-store/);
  expiresAt = 0;
  await page.locator('[data-refresh]').click();
  await waitStatus(/انتهت جلسة الدخول/);

  await page.locator('#verify-email').fill(email);
  await page.locator('#otp-purpose').selectOption('sign-in');
  await page.locator('[data-send-otp]').click();
  await waitStatus(/إذا أمكن إرسال رمز/);
  await page.locator('#verify-otp').fill('654321');
  await page.locator('[data-verify-form] [type=submit]').click();
  await waitStatus(/جلسة الدخول نشطة/);
  const secondTab = await context.newPage();
  await secondTab.goto(`${base}/auth/sign-up/`);
  await secondTab.locator('[data-auth-session]').waitFor();
  await logout();
  await secondTab.locator('[data-auth-status]').filter({ hasText: /انتهت جلسة الدخول/ }).waitFor();
  await secondTab.close();
  assert.equal((await fetch(`${base}/auth/api/sign-out/`, {
    method: 'POST', headers: { Origin: base, 'Content-Type': 'application/json' }, body: '{}',
  })).status, 200);

  await page.goto(`${base}/auth/accept-invitation/?invitationId=${invitation}`);
  await page.getByRole('link', { name: 'تسجيل الدخول أو توثيق البريد' }).click();
  await waitStatus(/سجّل الدخول بكلمة المرور/);
  await fillCredentials(email);
  await page.waitForURL(`${base}/auth/accept-invitation/?invitationId=${invitation}`);
  const accept = page.getByRole('button', { name: 'قبول الانضمام بدور عضو' });
  await accept.waitFor();
  assert.equal(await memberCount(), 0);
  await accept.click();
  await page.locator('[data-accept-status]').filter({ hasText: /اعتمد الخادم عضويتك/ }).waitFor();
  assert.equal(nativeAccepts, 1);
  assert.equal(await memberCount(), 1);
  const acceptAgain = await fetch(`${base}/app/api/kernel/members/`, {
    method: 'POST', headers: { Origin: base, 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({ operation: 'accept', invitationId: invitation }),
  });
  assert.deepEqual(await acceptAgain.json(), { persisted: true, tenantId: workspace, role: 'MEMBER', idempotent: true });
  assert.equal(await memberCount(), 1);
  assert.ok((await page.locator('[data-open-workspace]').getAttribute('href')).endsWith(workspace));
  await page.locator('[data-reload]').click();
  await page.locator('[data-accept-status]').filter({ hasText: /لا توجد دعوة مؤهلة/ }).waitFor();

  await grantProduct(db, workspace, 'firewall');
  await page.goto(`${base}/app/firewall/?workspace=${workspace}`);
  await page.locator('[data-private]').waitFor();
  await page.locator('#fw-text').fill('Synthetic dependency fixture');
  await page.locator('[data-synthetic]').check();
  await page.locator('[data-eval-submit]').click();
  const firewallResult = page.locator('[data-result]');
  await firewallResult.getByRole('list', { name: 'حالات الاعتماد' }).waitFor();
  assert.match(await firewallResult.innerText(), /Ledger — غير مهيأ/);
  assert.match(await firewallResult.innerText(), /سياسة Kernel — خارج مسار العملية/);
  await page.locator('[data-eval-mode]').selectOption('GUARD');
  await page.locator('[data-eval-submit]').click();
  await firewallResult.getByText('سياسة Kernel — غير مهيأ · يحجب المسار', { exact: true }).waitFor();
  assert.match(await firewallResult.innerText(), /NOT_EXECUTED/);
  assert.match(await firewallResult.innerText(), /DENY/);
  await checkWidths(widths);

  await page.goto(`${base}/auth/sign-up/?returnTo=%2Fapp%2Ffirewall%2F`);
  await page.waitForURL(`${base}/app/kernel/?returnTo=%2Fapp%2Ffirewall%2F`);
  await page.goto(`${base}/products/firewall/#lab`);
  await page.getByRole('navigation', { name: 'مسار الوصول' }).getByRole('link', { name: 'طلب الوصول' }).click();
  await page.waitForURL(`${base}/request-access/?product=firewall`);
  await page.getByRole('link', { name: 'المتابعة إلى الحساب' }).click();
  await page.waitForURL(`${base}/app/trial/?product=firewall`);
  assert.match(await page.locator('[data-trial-home]').innerText(), /المنتج المختار.*Firewall/);
  await page.goto(`${base}/auth/sign-up/?returnTo=%2F%2Fevil.example.test`);
  await waitStatus(/جلسة الدخول نشطة/);
  assert.match(page.url(), /\/auth\/sign-up/);

  await logout();
  verified = false;
  allowUnverified = true;
  await page.goto(`${base}/auth/sign-in/?trial=48h`);
  await waitStatus(/سجّل الدخول بكلمة المرور/);
  await fillCredentials(email);
  await waitStatus(/وثّق بريدك بالرمز/);
  assert.equal(await page.locator('[data-continue]').isVisible(), false);
  assert.equal(await page.locator('[data-verify-form]').isVisible(), true);
  assert.match(page.url(), /\/auth\/sign-up/);
  await page.locator('#verify-otp').fill('123456');
  await page.locator('[data-verify-form] [type=submit]').click();
  await page.waitForURL(`${base}/app/trial/`);

  const trialApi = (body, selected = '') => fetch(`${base}/app/api/trial/${selected ? `?workspace=${selected}` : ''}`, {
    headers: { Authorization: `Bearer ${jwt}`, ...(body ? { Origin: base, 'Content-Type': 'application/json' } : {}) },
    ...(body ? { method: 'POST', body: JSON.stringify(body) } : {}),
  });
  const trialStatus = page.locator('[data-trial-status]');
  await trialStatus.filter({ hasText: /بريدك موثّق/ }).waitFor();
  assert.equal(await page.locator('[data-trial-products] article').count(), 0);
  const trialFailure = Promise.withResolvers();
  await page.route('**/app/api/trial/', async route => {
    await trialFailure.promise;
    await route.fulfill({ status: 503, json: { message: 'تعذر تحميل مساحة التجربة.' } });
  }, { times: 1 });
  await page.locator('[data-trial-refresh]').click();
  await trialStatus.filter({ hasText: /جارٍ تحميل مساحة التجربة/ }).waitFor();
  assert.equal(await page.locator('[data-trial-start]').isDisabled(), true);
  trialFailure.resolve();
  await trialStatus.filter({ hasText: /تعذر تحميل مساحة التجربة/ }).waitFor();
  assert.equal(await page.locator('[data-trial-start]').isVisible(), false);
  assert.equal(await page.locator('#trial-access-status').innerText(), 'غير متاح حاليًا');
  await page.getByRole('button', { name: 'إعادة المحاولة' }).click();
  await trialStatus.filter({ hasText: /بريدك موثّق/ }).waitFor();
  assert.equal((await trialApi({ operation: 'start', expires_at: '2099-01-01' })).status, 400);
  assert.equal((await trialApi({ operation: 'start' }, workspace)).status, 403);
  await page.locator('[data-trial-start]').click();
  await trialStatus.filter({ hasText: /التجربة نشطة/ }).waitFor();
  assert.equal(await page.getByText('متاح للقراءة فقط', { exact: true }).count(), 5);
  await checkWidths(widths);
  assert.match(await page.locator('[data-trial-clock]').textContent(), /المتبقي:/);
  const activeTrial = await (await trialApi()).json();
  assert.equal(new Date(activeTrial.expiresAt) - new Date(activeTrial.startedAt), 172800000);
  await page.locator('[data-trial-products] article').filter({ hasText: 'Firewall' }).getByRole('button', { name: 'فتح المنتج' }).click();
  await page.waitForURL(`${base}/app/firewall/?workspace=${activeTrial.tenantId}`);
  await checkWidths(widths);
  await page.goto(`${base}/app/trial/`);
  await trialStatus.filter({ hasText: /التجربة نشطة/ }).waitFor();
  assert.equal(await page.locator('[data-trial-start]').isVisible(), false);
  assert.equal(new URL(page.url()).searchParams.get('workspace'), activeTrial.tenantId);
  await db.query(`WITH boundary AS (SELECT clock_timestamp() AS expires)
    UPDATE aigas_self_service_trials SET started_at=expires-interval '48 hours',expires_at=expires
    FROM boundary WHERE tenant_id=$1`, [activeTrial.tenantId]);
  await page.locator('[data-trial-refresh]').click();
  await trialStatus.filter({ hasText: /انتهت مدة التجربة/ }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'فتح المنتج' }).count(), 0);
  assert.equal((await trialApi({ operation: 'open', product: 'firewall' }, activeTrial.tenantId)).status, 403);
  assert.equal((await (await trialApi({ operation: 'start' })).json()).tenantId, activeTrial.tenantId);
  assert.equal((await (await trialApi()).json()).status, 'EXPIRED');

  const closed = await startApp({ enabled: false, configured: true, cert });
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/products/', '/products/firewall/', '/request-access/?product=firewall', '/auth/sign-up/?trial=48h', '/app/trial/', '/status/']) {
      const response = await page.goto(closed + path, { waitUntil: 'domcontentloaded' });
      assert.equal(response.status(), path.startsWith('/app/') ? 503 : 200, path);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${width}px: ${path}`);
      assert.ok(await page.locator('[data-access-status]').first().isVisible(), path);
      assert.ok(await page.getByRole('link', { name: 'حالة النظام', exact: true }).first().count(), path);
    }
  }
  await page.goto(`${closed}/request-access/?product=firewall`);
  const access = page.locator('main');
  assert.equal(await access.getByRole('article').count(), 4);
  assert.equal(await access.getByRole('link', { name: 'المتابعة إلى الحساب' }).count(), 0);
  assert.match(await access.ariaSnapshot(), /navigation "مسار الوصول"[\s\S]*المختبر العام[\s\S]*طلب الوصول[\s\S]*تجربة محدودة[\s\S]*نسخة تجريبية مغلقة[\s\S]*تشغيل مؤسسي/);
  assert.equal(await access.locator('[aria-current="step"]').innerText(), 'طلب الوصول');
  const summary = access.locator('#access-action summary');
  await summary.focus();
  await summary.press('Enter');
  assert.equal(await summary.evaluate(element => element.parentElement.open), true);
  for (const [track, label] of [['beta', 'نسخة تجريبية مغلقة'], ['production', 'تشغيل مؤسسي']]) {
    await access.getByRole('link', { name: `اختيار ${label}`, exact: true }).click();
    assert.equal(new URL(page.url()).searchParams.get('track'), track);
    assert.ok(await access.getByRole('link', { name: 'جهّز طلبك' }).isVisible());
  }
  await access.getByRole('link', { name: 'جهّز طلبك' }).click();
  assert.match(await page.locator('#contact-draft').inputValue(), /طلب مراجعة للتشغيل المؤسسي لمنتج Firewall/);
  await page.goto(`${closed}/auth/sign-up/?trial=48h`);
  assert.match(await page.locator('.auth-unavailable').textContent(), /التسجيل مغلق/);
  assert.match(page.url(), /\/auth\/sign-up/);
  assert.equal((await fetch(`${closed}/app/trial/`)).status, 503);
  assert.equal((await fetch(`${closed}/auth/api/get-session/`)).status, 503);
  const missing = await startApp({ enabled: true, configured: false, cert });
  await page.goto(`${missing}/auth/sign-up/`);
  assert.match(await page.locator('.auth-unavailable').textContent(), /خدمة الحسابات غير مهيأة/);
  await page.goto(`${missing}/auth/accept-invitation/`);
  assert.match(await page.locator('.accept-unavailable').textContent(), /خدمة الحسابات غير مهيأة/);
  assert.equal((await (await fetch(`${missing}/auth/api/get-session/`)).json()).code, 'AUTH_SETUP_REQUIRED');
  process.stdout.write('PASS: registration and authentication, invitation, product selection, trial loading and retry, activation and expiry, closed access tracks, keyboard disclosure, accessibility tree and responsive layouts\n');
} finally {
  firstSignup.resolve();
  await browser?.close();
  for (const proc of appProcesses) proc.kill();
  await new Promise(resolve => upstream ? upstream.close(resolve) : resolve());
  await db.end();
  await rm(directory, { recursive: true, force: true });
}
