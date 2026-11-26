import type { APIRoute } from 'astro';
import { kernelHandler } from '../../../../../server/kernel/http.mjs';
import { agentTenant, requestedRunId } from '../../../../../server/agents/http.mjs';
import { runtime } from '../../../../../server/agents/instance.mjs';
export const prerender = false;
export const GET: APIRoute = kernelHandler(async (identity, workspace, _body, request) => {
  const tenantId = await agentTenant(identity, workspace);
  return runtime.get(identity, tenantId, requestedRunId(request));
});
