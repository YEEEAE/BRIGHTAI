-- Add signatures without changing or re-signing historical events.
BEGIN;
ALTER TABLE public.aigas_ld_events ADD CONSTRAINT aigas_ld_events_tenant_event_unique UNIQUE(tenant_id,event_id);
CREATE TABLE public.aigas_ld_event_signatures (
 tenant_id uuid NOT NULL,
 event_id uuid NOT NULL,
 key_id text NOT NULL CHECK (key_id ~ '^[A-Za-z0-9_.:-]{1,120}$'),
 signature text NOT NULL CHECK (signature ~ '^[A-Za-z0-9+/]{86}==$'),
 PRIMARY KEY (tenant_id,event_id),
 FOREIGN KEY (tenant_id,event_id) REFERENCES public.aigas_ld_events(tenant_id,event_id)
);
ALTER TABLE public.aigas_ld_event_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aigas_ld_event_signatures FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.aigas_ld_event_signatures FROM PUBLIC;
GRANT SELECT, INSERT ON public.aigas_ld_event_signatures TO aigas_runtime;
CREATE POLICY aigas_runtime_tenant ON public.aigas_ld_event_signatures FOR ALL TO aigas_runtime
 USING (public.aigas_tenant_scope(tenant_id)) WITH CHECK (public.aigas_tenant_scope(tenant_id));
CREATE TRIGGER aigas_ld_signatures_append_only BEFORE UPDATE OR DELETE ON public.aigas_ld_event_signatures
 FOR EACH ROW EXECUTE FUNCTION public.aigas_ld_events_reject_mutation();
CREATE TRIGGER aigas_ld_signatures_no_truncate BEFORE TRUNCATE ON public.aigas_ld_event_signatures
 FOR EACH STATEMENT EXECUTE FUNCTION public.aigas_ld_events_reject_mutation();
COMMIT;
