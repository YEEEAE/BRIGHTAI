import type { APIRoute } from 'astro';
import { kernelHandler } from '../../../../../../server/kernel/http.mjs';
import { operatorDecideTrial } from '../../../../../../server/kernel/trial-service.mjs';
export const prerender = false;
export const POST: APIRoute = async context => {
  const handler = kernelHandler((identity, _workspace, body) =>
    operatorDecideTrial(identity, context.params.trialId, body), true);
  return handler(context);
};
