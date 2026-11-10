import type { APIRoute } from 'astro';
import { kernelHandler } from '../../../../../../server/kernel/http.mjs';
import { submitTrial } from '../../../../../../server/kernel/trial-service.mjs';
export const prerender = false;
// Tenant path only: REQUESTED -> ELIGIBILITY_REVIEW. It approves nothing.
export const POST: APIRoute = async context => {
  const handler = kernelHandler((identity, workspace, body) =>
    submitTrial(identity, workspace, context.params.trialId, body), true);
  return handler(context);
};
