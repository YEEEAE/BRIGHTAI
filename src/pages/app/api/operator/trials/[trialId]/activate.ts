import type { APIRoute } from 'astro';
import { kernelHandler } from '../../../../../../server/kernel/http.mjs';
import { operatorActivateTrial } from '../../../../../../server/kernel/trial-service.mjs';
export const prerender = false;
// Refuses by design until readiness exists for this product, release and
// environment. The refusal is the P06-A acceptance condition, not a placeholder.
export const POST: APIRoute = async context => {
  const handler = kernelHandler((identity, _workspace, body) =>
    operatorActivateTrial(identity, context.params.trialId, body), true);
  return handler(context);
};
