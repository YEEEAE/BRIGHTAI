-- Grant CRUD on evaluation/certificate/audit tables to app and service roles.
-- Previously these tables granted privileges only to the migration-owner role,
-- so integration tests (and the API via dbServiceRole) failed with "permission denied".

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "signing_keys" TO brightai_app, brightai_service;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "evaluation_runs" TO brightai_app, brightai_service;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "evaluation_cases" TO brightai_app, brightai_service;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "evaluation_certificates" TO brightai_app, brightai_service;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "evaluation_audit_events" TO brightai_app, brightai_service;