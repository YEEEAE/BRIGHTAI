BEGIN;

CREATE OR REPLACE FUNCTION public.aigas_trial_operator_active()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.aigas_trial_operators o
    JOIN neon_auth."user" u ON u.id = o.user_id
    WHERE o.user_id = public.aigas_actor() AND o.status = 'ACTIVE' AND u.banned IS NOT TRUE
  )
$$;

-- Keep existing append-only evidence. New events carry controlled reason codes.
ALTER TABLE public.aigas_trial_events ADD CONSTRAINT aigas_trial_event_reason_code
  CHECK (reason IS NULL OR reason IN (
    'CANCELLED_BY_TENANT', 'ELIGIBILITY_APPROVED', 'ELIGIBILITY_REJECTED',
    'ACTIVATED_AFTER_READINESS', 'CLOSED_BY_OPERATOR'
  )) NOT VALID;

COMMIT;
