import type { APIRoute } from 'astro';
import { kernelHandler } from '../../../../server/kernel/http.mjs';
import { policyOperation } from '../../../../server/kernel/policies.mjs';
export const prerender = false;
export const GET: APIRoute = async (context) => {
  const policyId = new URL(context.request.url).searchParams.get('policy_id');
  const operation = policyId ? { operation:'history',policyId } : { operation:'list' };
  return kernelHandler((identity, workspace) => policyOperation(identity, workspace, operation))(context);
};
export const POST = kernelHandler(policyOperation, true);
