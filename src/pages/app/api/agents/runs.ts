import type { APIRoute } from 'astro';
import { kernelHandler } from '../../../../server/kernel/http.mjs';
import { agentTenant } from '../../../../server/agents/http.mjs';
import { runtime } from '../../../../server/agents/instance.mjs';
export const prerender = false;
export const POST: APIRoute = kernelHandler(async (identity, workspace, body) => {
  const tenantId = await agentTenant(identity, workspace);
  return runtime.start(identity, tenantId, body);
}, true);
