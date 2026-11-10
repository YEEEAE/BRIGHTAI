import type { APIRoute } from 'astro';
import { kernelHandler } from '../../../../../../server/kernel/http.mjs';
import { operatorExpireTrial } from '../../../../../../server/kernel/trial-service.mjs';
export const prerender = false;
export const POST: APIRoute = async context => {
  const handler = kernelHandler((identity) => operatorExpireTrial(identity, context.params.trialId), true);
  return handler(context);
};
