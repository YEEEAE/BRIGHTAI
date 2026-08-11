# AI QC Copilot

## Architecture

The QC Copilot is an advisory layer over the existing QC domain:

```text
Authorized API route
  -> server-side scope/context builder
  -> AI feature adapter
  -> runStructuredAi()
  -> Groq provider (llama-3.3-70b-versatile)
  -> Zod validation
  -> advisory response + sanitized AI audit record
```

The browser sends only a feature name, entity IDs, and—where needed—explicit evidence-processing consent. It never sends a provider key or authority decision to the server as trusted input.

## Features

- **Task Analysis:** reviews progress, SLA, blockers, dependencies, evidence, history, and priority; returns risk assessment, reasons, recommended actions, and missing information.
- **Finding Analysis:** suggests potential classification/severity, risk factors, missing evidence, and reviewer questions.
- **RCA Assistance:** suggests root causes, 5 Whys, Fishbone categories, and contributing factors.
- **CAPA Assistance:** suggests corrective action, preventive action, verification method, and effectiveness check.
- **AI Executive Summary:** summarizes authorized SLA risks, critical findings, open CAPA, workload, overdue tasks, and evidence gaps.
- **Evidence AI Review:** reviews minimized evidence metadata after authorization and consent; lifecycle is `UNVERIFIED -> AI_PENDING -> AI_REVIEWED`, with `HUMAN_VERIFIED` and `REJECTED` reserved for human/approved flows.

Every output includes confidence, evidence used, and `human_review_required: true`.

## Security

AI is an assistant, not an authority. It cannot close or complete tasks, approve findings, reject CAPA, set final classification/severity/risk, modify RBAC, or delete evidence. No AI feature imports or calls task mutation, approval, closure, or deletion functions.

All routes re-check the session server-side, apply same-origin CSRF protection, and build context from authorized database reads. Employee access remains limited to their authorized task/Finding scope; management summaries are restricted to supervisor, manager, and admin roles, with supervisors scoped to their department.

`GROQ_API_KEY` is server-only. API keys, Authorization headers, passwords, session tokens, raw BLOBs, raw prompts, and raw provider errors are not logged or returned to the browser.

## Prompt governance

QC prompts use a fixed trusted system instruction that establishes the assistant boundary and requires JSON. User comments, Finding text, filenames, and extracted evidence are wrapped in `<untrusted_qc_data>` delimiters. Text such as “ignore previous instructions” is treated as quoted content to analyze, never as a system instruction.

## Data minimization and PII

Context builders select only fields needed by each feature, cap list sizes, omit file BLOBs, and redact email addresses, Saudi phone numbers, and secret-shaped fields. Evidence review sends metadata and policy-approved descriptive fields; it does not send the uploaded binary file to Groq. Passwords, session tokens, API keys, secrets, and Authorization headers are excluded.

Evidence review additionally requires:

1. The user is authorized to view the task and evidence.
2. The evidence is marked as evidence and uses a supported evidence extension.
3. The request explicitly grants AI-processing consent.

## Data flow

Task/Finding/dashboard data is read server-side, scoped to the current user, minimized/redacted, and passed to the feature adapter. Groq receives only the structured prompt. The response is parsed with a strict Zod schema. Invalid output is rejected, no domain state is changed, and the caller receives a safe error. Successful and failed requests write only references and sanitized status data to `ai_audit_log`.

## Human approval

The UI labels every response **AI Generated**, displays **Confidence** and **Evidence Used**, and shows **Human Review Required**. Results are displayed as suggestions. Applying a suggestion remains a separate human-controlled form/action and is not implemented as an automatic AI mutation.

Evidence `AI_REVIEWED` is not equivalent to `HUMAN_VERIFIED`; a reviewer must complete the existing human verification/approval path before evidence is authoritative.

## Failure handling

Timeouts, network failures, 429, 5xx, invalid JSON, and schema failures return a safe error and leave the QC workflow available manually. Transient provider failures have bounded retries; invalid structured output is rejected without an infinite retry loop. Evidence review returns the attachment to `UNVERIFIED` if the AI request fails. A rate-limited request returns 429 without calling Groq.

## Testing

Automated tests use mocked providers and cover valid output, invalid JSON, schema rejection, timeout, 429, 500, prompt injection text, PII redaction, unauthorized management access, and evidence consent/eligibility. Full QC tests, typecheck, production build, Architecture Guard, and Security Hygiene remain required before delivery. A real Groq request is an environment/integration check and must not be treated as covered by mocked tests.
