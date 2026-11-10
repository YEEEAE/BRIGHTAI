import type { APIRoute } from 'astro';
import { kernelHandler } from '../../../../../../server/kernel/http.mjs';
import { cancelTrial } from '../../../../../../server/kernel/trial-service.mjs';
export const prerender = false;
export const POST: APIRoute = async context => {
  const handler = kernelHandler((identity, workspace, body) =>
    cancelTrial(identity, workspace, context.params.trialId, body), true);
  return handler(context);
};
