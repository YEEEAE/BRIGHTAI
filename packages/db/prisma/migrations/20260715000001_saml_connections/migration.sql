-- SSO-001 (2026-07-15): Enterprise SSO per-org configuration.
--
-- Stores per-org IdP metadata (Clerk's enterprise SSO connection ID +
-- email domains for auto-routing + role mapping from SAML groups claim).
--
-- Clerk handles the actual SAML 2.0 / OIDC protocol. We mirror minimal
-- metadata here for: (1) custom sign-in flow domain detection,
-- (2) audit chain, (3) recovery if Clerk's dashboard is unreachable.

CREATE TABLE "saml_connections" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "clerkEnterpriseSsoId" TEXT,
  "emailDomains" TEXT[],
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "config" JSONB NOT NULL DEFAULT '{}',
  "roleMapping" JSONB NOT NULL DEFAULT '{}',
  "lastSsoLoginAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "saml_connections_pkey" PRIMARY KEY ("id")
);

-- One active IdP per org (uniq enforced at DB level).
CREATE UNIQUE INDEX "saml_connections_organizationId_key" ON "saml_connections"("organizationId");

-- Clerk's connection ID is globally unique (when set).
CREATE UNIQUE INDEX "saml_connections_clerkEnterpriseSsoId_key" ON "saml_connections"("clerkEnterpriseSsoId");

-- Provider-scoped queries (e.g. "show me all Okta orgs").
CREATE INDEX "saml_connections_provider_idx" ON "saml_connections"("provider");

-- Enabled filter for the custom sign-in flow.
CREATE INDEX "saml_connections_enabled_idx" ON "saml_connections"("enabled");

-- Cascade delete when org is deleted.
ALTER TABLE "saml_connections" ADD CONSTRAINT "saml_connections_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
