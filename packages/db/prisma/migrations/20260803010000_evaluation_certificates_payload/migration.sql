-- Add signed payload JSON so verification can rebuild exact canonical bytes.
ALTER TABLE "evaluation_certificates" ADD COLUMN "payload" JSONB;
