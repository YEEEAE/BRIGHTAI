// Non-network adapter for authorised local/staging verification only.
//
// It is deliberately NOT part of `approvedProviders` in provider.mjs: registration
// would report a configured AI provider and imply an external execution that does
// not exist. `enforceDecision` accepts an injected resolver only when the resolved
// adapter is marked `external:false` and `localSandbox:true`, so this module can
// never turn into an undisclosed egress path.
//
// `generate()` receives the already evaluated text (raw only for ALLOW, redacted
// for REDACT) but never echoes it. The fixed marker keeps local verification from
// copying prompt content into a response, a log or a transcript.
export const LOCAL_SANDBOX_ID = 'firewall-local-sandbox-v1';

export function createLocalSandboxAdapter() {
  return Object.freeze({
    id: LOCAL_SANDBOX_ID,
    localSandbox: true,
    external: false,
    model: 'local-synthetic-v1',
    region: 'local',
    noTraining: true,
    // Shaped like a reviewed adapter so guard code paths stay identical, but it
    // performs no fetch, DNS lookup, socket call or key read.
    async generate({ signal } = {}) {
      if (signal?.aborted) throw new Error('LOCAL_SANDBOX_ABORTED');
      return `[${LOCAL_SANDBOX_ID}] مخرج اصطناعي ثابت؛ لم يُرسل أي نص إلى مزود خارجي.`;
    },
  });
}
