import type { APIRoute } from 'astro';
import { kernelHandler } from '../../../../server/kernel/http.mjs';
import { policyOperation } from '../../../../server/kernel/policies.mjs';
export const prerender = false;
export const GET: APIRoute = async (context) => {
  const params = new URL(context.request.url).searchParams;
  const policyId = params.get('policy_id');
  const operation = policyId ? {
    operation: 'history',
    policyId,
    versionsPage: Number(params.get('versions_page') ?? 1),
    approvalsPage: Number(params.get('approvals_page') ?? 1),
  } : { operation: 'list' };
  return kernelHandler((identity, workspace) => policyOperation(identity, workspace, operation))(context);
};
export const POST = kernelHandler(policyOperation, true);
