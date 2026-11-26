// Shared server-side instances. Defaults use the Kernel-backed Postgres store,
// real Kernel access/policy checks, Kernel audit + Ledger evidence and no outbox
// dispatcher until one is configured (an undispatched event never reports success).

import { createAgentRuntime } from './runtime.mjs';
import { createOrchestrator } from './orchestrator.mjs';

export const runtime = createAgentRuntime();
export const orchestrator = createOrchestrator({ runtime });
