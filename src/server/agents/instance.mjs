// Shared server-side instances. Defaults use the Kernel-backed Postgres store,
// real Kernel access/policy checks, Kernel audit + Ledger evidence and no outbox
// dispatcher until one is configured (an undispatched event never reports success).

import { createAgentRuntime } from './runtime.mjs';
import { createOrchestrator } from './orchestrator.mjs';
import { firewallTools, createFirewallAgent } from './firewall-agent.mjs';

export const runtime = createAgentRuntime({ tools: firewallTools });
export const orchestrator = createOrchestrator({ runtime });
export const firewallAgent = createFirewallAgent({ runtime });
