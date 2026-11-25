import type { APIRoute } from 'astro';
import { evaluateHealth } from '../../server/kernel/health-endpoint.mjs';
import { isPortalEnabled } from '../../server/kernel/env.mjs';
import { trialDependenciesReady } from '../../server/kernel/self-service-trial.mjs';

export const prerender = false;
export const GET: APIRoute = async () => {
  const available = isPortalEnabled() && (await evaluateHealth()).status === 200 && await trialDependenciesReady();
  return Response.json({ available }, { headers: { 'Cache-Control': 'no-store' } });
};
export const HEAD = GET;
