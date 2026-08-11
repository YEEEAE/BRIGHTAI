# AI QC Copilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add human-in-the-loop QC AI features on top of the existing Groq foundation without allowing AI to change authoritative state.

**Architecture:** Server-side feature adapters build minimized, authorized context; `runStructuredAi()` calls the centralized Groq provider and validates Zod output; API routes return advisory results with references and explicit review metadata. Evidence review is gated by RBAC, supported file policy, and data-processing consent, and sends metadata/text excerpts rather than raw files.

**Tech Stack:** Astro SSR API routes, TypeScript, SQLite, Zod, existing Groq provider/service, existing RBAC and task/QC operations readers.

---

### Task 1: AI feature schemas, prompt governance, and safe context

**Files:** `apps/qc-task-manager/src/lib/ai/{schemas,prompts,context,features}.ts`, `src/lib/ai/guardrails.ts`, `scripts/test-ai-features.mjs`

- [ ] Add strict Zod schemas for task, finding, RCA, CAPA, management, and evidence outputs.
- [ ] Add trusted system prompts that label comments/files as untrusted data and explicit human-review metadata.
- [ ] Add context builders that query only authorized rows and redact secrets/unnecessary PII.
- [ ] Add mocked-provider tests for valid/invalid JSON, schema rejection, prompt injection neutralization, and PII minimization.

### Task 2: AI feature service adapters

**Files:** `apps/qc-task-manager/src/lib/ai/features.ts`, `src/lib/ai/index.ts`, `scripts/test-ai-features.mjs`

- [ ] Implement `analyzeTask`, `analyzeFinding`, `assistRca`, `assistCapa`, `buildManagementSummary`, and `reviewEvidence` through `runStructuredAi()` only.
- [ ] Ensure every result is advisory, carries `confidence`, `evidenceUsed`, and `humanReviewRequired`, and never calls mutation/approval functions.
- [ ] Implement evidence eligibility checks: authorized user, supported type, policy consent, and minimized metadata/text only.

### Task 3: API routes and rate-limit/error behavior

**Files:** `apps/qc-task-manager/src/pages/api/ai/**`, `src/lib/api-security.ts`, `scripts/test-ai-features.mjs`

- [ ] Add authenticated same-origin POST routes for each feature with server-side scope checks.
- [ ] Return safe 401/403/404/422/429/503 responses; provider failures never change task/QC state.
- [ ] Ensure no route accepts a client-supplied user, role, decision, or provider key.

### Task 4: UI surfaces

**Files:** `apps/qc-task-manager/src/components/AiReviewPanel.tsx`, task/finding/dashboard pages, CSS as needed

- [ ] Add explicit “AI Generated”, confidence, evidence used, and “Human Review Required” labels.
- [ ] Add buttons/forms that call advisory routes only; no AI result is auto-written to task, finding, CAPA, evidence, severity, risk, RBAC, or workflow state.
- [ ] Add graceful manual fallback when AI is unavailable.

### Task 5: Documentation and verification

**Files:** `docs/AI-QC-COPILOT.md`, package scripts, `.agents/brain.md`

- [ ] Document architecture, features, security, prompt governance, data flow, human approval, failure handling, and testing.
- [ ] Run mocked feature tests, full QC tests, typecheck, build, architecture/security checks, and diff check.
- [ ] Record exact evidence and limitations in the brain; no commit or push.
