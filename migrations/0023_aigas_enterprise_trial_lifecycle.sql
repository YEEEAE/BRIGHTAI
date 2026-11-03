-- LOCAL DRAFT ONLY — NOT APPLIED.
-- Enterprise trial lifecycle for AIGAS. This migration is intentionally not
-- idempotent and must be reviewed by Product/Operations, Security/Privacy,
-- Finance, and Legal before it is applied to an approved isolated environment.
--
-- Human approval gates (all required):
--   1. Approved 48-hour trial policy and eligible-organization criteria.
--   2. Approved quota/cost profile and AI provider/region/No-Training decision.
--   3. A named operator identity/role that is separate from the tenant requester.
--   4. Approved retention/export/deletion terms and a tested exit procedure.
--   5. Review of runtime grants and RLS policies for the selected least-privilege role.
--
-- This file creates no trial, no entitlement, no price, no invoice, and no user.
-- It has no payment, checkout, automatic conversion, or renewal columns by design.

BEGIN;

CREATE TABLE public.aigas_trial_requests (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.aigas_tenants(id),
  requested_by uuid NOT NULL REFERENCES neon_auth."user"(id),
  requested_products text[] NOT NULL,
  deployment_mode text NOT NULL CHECK (deployment_mode IN ('SAAS', 'ON_PREMISE', 'AIR_GAPPED')),
  data_mode text NOT NULL DEFAULT 'SYNTHETIC' CHECK (data_mode = 'SYNTHETIC'),
  business_goal text NOT NULL CHECK (char_length(btrim(business_goal)) BETWEEN 20 AND 1000),
  state text NOT NULL DEFAULT 'REQUESTED' CHECK (state IN (
    'REQUESTED', 'ELIGIBILITY_REVIEW', 'APPROVED', 'ACTIVATED',
    'EXPIRED', 'CLOSED', 'REJECTED', 'CANCELLED'
  )),
  decision_source text CHECK (decision_source IN ('OPERATOR', 'SYSTEM')),
  decided_by uuid REFERENCES neon_auth."user"(id),
  decided_at timestamptz,
  activated_at timestamptz,
  expires_at timestamptz,
  closed_at timestamptz,
  reason text CHECK (reason IS NULL OR char_length(btrim(reason)) BETWEEN 10 AND 1000),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (cardinality(requested_products) BETWEEN 1 AND 5),
  CHECK (requested_products <@ ARRAY['firewall','ledger','human-gate','risk-engine','secure-chat']::text[]),
  CHECK (activated_at IS NULL OR (expires_at IS NOT NULL AND expires_at = activated_at + interval '48 hours')),
  CHECK (state <> 'ACTIVATED' OR (activated_at IS NOT NULL AND expires_at IS NOT NULL)),
  CHECK (state NOT IN ('APPROVED','ACTIVATED','EXPIRED') OR decided_at IS NOT NULL),
  CHECK (state <> 'REJECTED' OR decided_at IS NOT NULL),
  CHECK (state NOT IN ('REJECTED','CANCELLED') OR reason IS NOT NULL),
  CHECK (state <> 'CLOSED' OR closed_at IS NOT NULL),
  CHECK (state <> 'EXPIRED' OR activated_at IS NOT NULL),
  UNIQUE (id, tenant_id)
);

-- One open evaluation per tenant. A closed/rejected request does not silently
-- reopen; a later evaluation needs a new request and a new decision.
CREATE UNIQUE INDEX aigas_trial_requests_one_open_idx
  ON public.aigas_trial_requests(tenant_id)
  WHERE state IN ('REQUESTED', 'ELIGIBILITY_REVIEW', 'APPROVED', 'ACTIVATED');
CREATE INDEX aigas_trial_requests_tenant_created_idx
  ON public.aigas_trial_requests(tenant_id, created_at DESC);

CREATE TABLE public.aigas_trial_events (
  id uuid PRIMARY KEY,
  trial_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  from_state text NOT NULL CHECK (from_state IN (
    'REQUESTED', 'ELIGIBILITY_REVIEW', 'APPROVED', 'ACTIVATED',
    'EXPIRED', 'CLOSED', 'REJECTED', 'CANCELLED'
  )),
  to_state text NOT NULL CHECK (to_state IN (
    'REQUESTED', 'ELIGIBILITY_REVIEW', 'APPROVED', 'ACTIVATED',
    'EXPIRED', 'CLOSED', 'REJECTED', 'CANCELLED'
  )),
  actor_user_id uuid REFERENCES neon_auth."user"(id),
  actor_source text NOT NULL CHECK (actor_source IN ('TENANT', 'OPERATOR', 'SYSTEM')),
  reason text CHECK (reason IS NULL OR char_length(btrim(reason)) BETWEEN 3 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (trial_id, tenant_id) REFERENCES public.aigas_trial_requests(id, tenant_id)
);
CREATE INDEX aigas_trial_events_trial_idx ON public.aigas_trial_events(trial_id, created_at);

-- Entitlements are per product. Kernel is not a row here: it is the shared
-- foundation and never has a separate licence or price. No product is implied
-- by requesting another product.
CREATE TABLE public.aigas_trial_entitlements (
  trial_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  product_slug text NOT NULL CHECK (product_slug IN ('firewall','ledger','human-gate','risk-engine','secure-chat')),
  entitlement_kind text NOT NULL DEFAULT 'TRIAL' CHECK (entitlement_kind = 'TRIAL'),
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'EXPIRED', 'REVOKED')),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (trial_id, product_slug),
  FOREIGN KEY (trial_id, tenant_id) REFERENCES public.aigas_trial_requests(id, tenant_id),
  CHECK (ends_at = starts_at + interval '48 hours')
);
CREATE INDEX aigas_trial_entitlements_tenant_product_idx
  ON public.aigas_trial_entitlements(tenant_id, product_slug, ends_at DESC);

-- The transition guard duplicates the application state machine at the database
-- boundary. It is deliberately strict: no skipped state, no reopened trial, no
-- changed 48-hour start, and no transition driven by a browser clock.
CREATE OR REPLACE FUNCTION public.aigas_trial_transition_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.state <> 'REQUESTED' THEN
      RAISE EXCEPTION 'Trial must start in REQUESTED';
    END IF;
    IF NEW.activated_at IS NOT NULL OR NEW.expires_at IS NOT NULL OR NEW.decided_at IS NOT NULL THEN
      RAISE EXCEPTION 'Trial request cannot start with decision or activation timestamps';
    END IF;
    RETURN NEW;
  END IF;
  IF OLD.activated_at IS NOT NULL AND NEW.activated_at IS DISTINCT FROM OLD.activated_at THEN
    RAISE EXCEPTION 'Trial activated_at is immutable';
  END IF;
  IF OLD.expires_at IS NOT NULL AND NEW.expires_at IS DISTINCT FROM OLD.expires_at THEN
    RAISE EXCEPTION 'Trial expires_at is immutable';
  END IF;
  IF NEW.state IS DISTINCT FROM OLD.state THEN
    IF NOT (
      (OLD.state = 'REQUESTED' AND NEW.state IN ('ELIGIBILITY_REVIEW','CANCELLED')) OR
      (OLD.state = 'ELIGIBILITY_REVIEW' AND NEW.state IN ('APPROVED','REJECTED','CANCELLED')) OR
      (OLD.state = 'APPROVED' AND NEW.state IN ('ACTIVATED','CANCELLED')) OR
      (OLD.state = 'ACTIVATED' AND NEW.state IN ('EXPIRED','CANCELLED')) OR
      (OLD.state IN ('EXPIRED','REJECTED','CANCELLED') AND NEW.state = 'CLOSED')
    ) THEN
      RAISE EXCEPTION 'Trial transition % -> % is not allowed', OLD.state, NEW.state;
    END IF;
    IF NEW.state = 'ACTIVATED' AND OLD.state <> 'APPROVED' THEN
      RAISE EXCEPTION 'Trial activation requires APPROVED state';
    END IF;
  END IF;
  NEW.updated_at = clock_timestamp();
  RETURN NEW;
END;
$$;
CREATE TRIGGER aigas_trial_transition_guard
  BEFORE INSERT OR UPDATE ON public.aigas_trial_requests
  FOR EACH ROW EXECUTE FUNCTION public.aigas_trial_transition_guard();

REVOKE ALL ON public.aigas_trial_requests, public.aigas_trial_events, public.aigas_trial_entitlements FROM PUBLIC;
ALTER TABLE public.aigas_trial_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aigas_trial_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aigas_trial_entitlements ENABLE ROW LEVEL SECURITY;

-- Tenant read policies are intentionally NOT created here. The current owner
-- connection bypasses RLS; a future runtime role needs separate tenant scoping
-- policies and explicit grants after review. No tenant role may insert or update
-- a trial decision or entitlement directly.

COMMIT;
