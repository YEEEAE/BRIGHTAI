# Enterprise SSO — BrightAI

> توثيق SSO عبر SAML 2.0 / OIDC (Microsoft Entra, Okta, Google Workspace).
> متطلب صريح لأي enterprise customer سعودي (بنوك، حكومة، صحة).

---

## الحالة (Phase 1 — 2026-07-15)

| الطبقة | الحالة | ملاحظات |
|---|---|---|
| Schema (`SamlConnection` model) | ✅ مكتمل | `saml_connections` table + index |
| Audit chain extension | ✅ مكتمل | 42 `AuditAction` values + 6 SSO-specific |
| Webhook expansion | ✅ مكتمل | `organization.*` + `organizationMembership.*` + `session.*` events |
| Settings page | ✅ مكتمل | `/settings/sso` (OWNER-only) |
| Custom sign-in (email detection) | 🟡 Phase 2 | helper موجود، wiring مع Clerk `authenticateWithRedirect` لاحقاً |
| Clerk Pro/Production plan | ❌ **مطلوب** | upgrade في Clerk Dashboard |
| IdP tenant config | ❌ **مطلوب** | per-org: Azure AD / Okta / Google Workspace |
| End-to-end test (Azure AD test tenant) | ❌ **مطلوب** | يحتاج plan + IdP |
| Pricing tier | ✅ صحّح | SSO انتقل من PRO إلى ENTERPRISE (sales-led) |

---

## المعمارية

### الـ Components

```
┌────────────────────────────────────────────────────────────────┐
│ Browser (User on brightai.live/sign-in or tenant.brightai.live)  │
└────────────────────────────────────────────────────────────────┘
            │
            │ Email entry
            ▼
┌────────────────────────────────────────────────────────────────┐
│ Custom Sign-In page (apps/dashboard/app/(auth)/sign-in)         │
│   - Calls detectSsoForEmail() server helper                     │
│   - If SSO enabled for domain → Clerk Enterprise SSO redirect   │
│   - Otherwise → fall back to Clerk hosted <SignIn />            │
└────────────────────────────────────────────────────────────────┘
            │
            │ (if SSO)
            ▼
┌────────────────────────────────────────────────────────────────┐
│ Clerk Enterprise SSO (handles SAML 2.0 / OIDC protocol)         │
│   - Validates IdP signature                                     │
│   - Verifies assertion (audience, expiry, etc.)                │
│   - Maps attributes (email, groups, name)                      │
│   - Fires `session.created` webhook                             │
└────────────────────────────────────────────────────────────────┘
            │
            │ Webhook (Svix-verified)
            ▼
┌────────────────────────────────────────────────────────────────┐
│ /api/webhooks/clerk (apps/dashboard)                            │
│   - session.created → SSO_LOGIN_SUCCESS audit                  │
│   - organization.* → SSO_CONNECTION_CONFIGURED audit           │
│   - organizationMembership.* → role sync + MEMBERSHIP_UPDATED   │
└────────────────────────────────────────────────────────────────┘
            │
            ▼
┌────────────────────────────────────────────────────────────────┐
│ BrightAI DB (PostgreSQL + RLS)                                  │
│   - User (upsert from Clerk)                                    │
│   - Membership (sync role via mapClerkRole)                     │
│   - SamlConnection (per-org IdP metadata)                      │
│   - AuditLog (tamper-evident hash chain)                       │
└────────────────────────────────────────────────────────────────┘
```

### Schema

**`SamlConnection` model** (`packages/db/prisma/schema.prisma`):
- `organizationId @unique` — one IdP per org
- `provider` — `'azure_ad' | 'okta' | 'google_workspace' | 'generic'`
- `clerkEnterpriseSsoId @unique` — Clerk's internal reference
- `entityId`, `ssoUrl`, `sloUrl`, `x509Cert` — IdP metadata (for native SAML SP path)
- `nameIdFormat` — SAML name identifier format
- `emailDomains String[]` — domains that trigger SSO (e.g. `['acme.com']`)
- `enabled Boolean` — kill-switch per org
- `config Json` — IdP-specific extras (Clerk connection name, raw metadata)
- `roleMapping Json` — IdP groups → BrightAI Role enum
- `lastSsoLoginAt`, `lastError` — operational telemetry

### Audit Actions (SSO-specific, in `@brightai/config/constants.ts`)

```ts
SSO_CONNECTION_CONFIGURED  // OWNER saved / webhook mirrored
SSO_CONNECTION_TESTED      // Phase 2: test flow
SSO_CONNECTION_DISABLED     // manual disable or Clerk deleted
SSO_LOGIN_SUCCESS           // session.created webhook from Clerk (SAML/OIDC)
SSO_LOGIN_FAILED            // Phase 2: failed assertion logged
SSO_JIT_PROVISIONED         // Phase 2: first SSO login created user
```

كل action يمر عبر `appendAuditLog()` (tamper-evident hash chain) — PDPL Art. 19 compliant.

---

## Sign-In Flow (Phase 2 — wired with Clerk `authenticateWithRedirect`)

```typescript
// 1. User enters email on /sign-in
const { ssoEnabled, organizationId, provider } = await detectSsoForEmail(email);

if (ssoEnabled) {
  // 2. Clerk handles IdP redirect via authenticateWithRedirect
  await signIn.authenticateWithRedirect({
    strategy: 'enterprise_sso',
    identifier: email,
    redirectUrl: '/dashboard',
  });
} else {
  // 3. Fallback to password / passkey / OAuth
  await signIn.create({ identifier: email, password });
}
```

---

## Custom Sign-In Phase (helper available now)

`detectSsoForEmail()` lives in `apps/dashboard/app/(auth)/sign-in/[[...sign-in]]/page.tsx`:

```typescript
export async function detectSsoForEmail(email: string): Promise<{
  ssoEnabled: boolean;
  organizationId: string | null;
  provider: string | null;
}> {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return { ssoEnabled: false, organizationId: null, provider: null };
  const tenant = await getTenantFromHeaders();
  if (!tenant.organization) {
    return { ssoEnabled: false, organizationId: null, provider: null };
  }
  const conn = await dbServiceRole.samlConnection.findFirst({
    where: {
      organizationId: tenant.organization.id,
      enabled: true,
      emailDomains: { has: domain },
    },
  });
  if (!conn) return { ssoEnabled: false, organizationId: null, provider: null };
  return { ssoEnabled: true, organizationId: conn.organizationId, provider: conn.provider };
}
```

Phase 2 wires this into a client form that calls Clerk's `authenticateWithRedirect`.

---

## Configuration Steps (per enterprise customer)

### 1. Prerequisites (Sales-led)
- Enterprise tier contract signed
- Customer provides IdP metadata: entityId, SSO URL, signing certificate (or metadata XML URL)

### 2. Clerk Dashboard setup (admin)
- Upgrade Clerk to Production plan
- Navigate to **Enterprise Connections**
- Add new connection (SAML 2.0 or OIDC depending on IdP)
- Configure IdP metadata
- Note the `clerkConnectionId` for our `SamlConnection.clerkEnterpriseSsoId` field

### 3. BrightAI settings (OWNER at customer org)
- Navigate to `/settings/sso`
- Select provider (Azure AD / Okta / Google Workspace / generic)
- Enter email domains (comma-separated): `acme.com, acme.sa`
- (Optional) Configure role mapping JSON
- Click **تفعيل SSO**
- Audit entry written: `SSO_CONNECTION_CONFIGURED`

### 4. Clerk webhook verification
- Webhook URL: `https://brightai.live/api/webhooks/clerk`
- Events to subscribe: `organization.created`, `organization.updated`,
  `organizationMembership.created`, `organizationMembership.updated`,
  `session.created`
- Svix verification via `CLERK_WEBHOOK_SECRET`

### 5. Test SSO login
- User from `acme.com` navigates to `acme.brightai.live/sign-in`
- Enters email
- Auto-redirect to IdP login page (via Clerk Enterprise SSO)
- After IdP auth → `session.created` webhook → `SSO_LOGIN_SUCCESS` audit
- Lands on `/dashboard`

---

## Compliance

| المتطلب | التغطية |
|---|---|
| **PDPL Art. 19** (record of processing activities) | ✅ hash chain يحفظ كل SSO login event |
| **NCA ECC 2-2024 §5** (audit logs) | ✅ tamper-evident + SSO-specific actions |
| **SDAIA AI Ethics** (human oversight + transparency) | ✅ SSO users يمكن تتبعهم من entry point |
| **ISO 27001 A.9.2.5** (review of access rights) | 🟡 Phase 2: SCIM deprovisioning |
| **ISO 42001** (responsible AI access) | ✅ SSO + audit chain |

---

## Migration Plan

### Phase 1 (done — 2026-07-15)
- [x] `SamlConnection` schema + migration
- [x] Audit action extension (42 actions + 6 SSO)
- [x] Webhook expansion (org.* + membership.* + session.*)
- [x] `/settings/sso` page (OWNER-only)
- [x] Pricing tier fix (PRO → ENTERPRISE)
- [x] Custom sign-in helper (`detectSsoForEmail`)
- [x] `docs/SSO.md`
- [x] `brain.md` change ledger

### Phase 2 (pending — needs Clerk Pro plan)
- [ ] Clerk Pro/Production plan upgrade
- [ ] Configure one test IdP tenant (Azure AD recommended — Saudi enterprise baseline)
- [ ] Wire `authenticateWithRedirect` into custom sign-in form
- [ ] Add `SSO_CONNECTION_TESTED` + `SSO_LOGIN_FAILED` audit paths
- [ ] SSO settings UI: "Test connection" button (sends test SAML request)
- [ ] IdP metadata fetch (avoid manual XML paste)
- [ ] Email-not-verified error path
- [ ] Multi-IdP-per-org support (if customers ask)

### Phase 3 (future — SCIM)
- [ ] SCIM endpoint for JIT deprovisioning
- [ ] Periodic access review automation
- [ ] Regional IdP routing (KSA data residency)

---

## Testing Checklist (verification gates)

### Code-level (Phase 1 — can test now)
- [ ] `pnpm --filter @brightai/db db:migrate:dev` ينجح (ينشئ `saml_connections` + enum extensions)
- [ ] `pnpm --filter @brightai/dashboard typecheck` ينجح (types pass)
- [ ] `pnpm --filter @brightai/dashboard lint` ينجح
- [ ] `pnpm --filter @brightai/dashboard build` ينجح
- [ ] Webhook handler returns 200 for known events, 401 for invalid sig
- [ ] `/settings/sso` OWNER-only (ADMIN/MEMBER → 403)

### Integration-level (needs Clerk Pro)
- [ ] Webhook signature verified (Svix)
- [ ] `organization.created` → SamlConnection mirrored + audit
- [ ] `organizationMembership.created` → Membership upserted + role sync
- [ ] `session.created` (SSO actor) → SSO_LOGIN_SUCCESS audit
- [ ] Custom sign-in routes SSO-eligible users to IdP
- [ ] Custom sign-in falls back to password for non-SSO domains
- [ ] Hash chain still verifies (no broken links after SSO events)

### E2E-level (needs IdP test tenant)
- [ ] Azure AD test tenant → real SAML round-trip succeeds
- [ ] Okta dev org → OIDC round-trip succeeds
- [ ] Just-in-time provisioning creates user + membership on first SSO
- [ ] Role mapping from IdP groups → BrightAI role works
- [ ] SCIM deprovisioning (Phase 3) deactivates membership

---

## المرجعيات

- **Clerk Enterprise SSO**: https://clerk.com/docs/authentication/saml
- **Clerk Webhooks (Svix)**: https://clerk.com/docs/integrations/webhooks
- **PDPL Art. 19**: https://sdaia.gov.sa
- **NCA ECC 2-2024**: https://nca.gov.sa
- **SAML 2.0 spec**: https://docs.oasis-open.org/security/saml/

---

**صاحب الملف**: BrightAI Workspace Agent
**آخر تحديث**: 2026-07-16
**الإصدار**: 1.0