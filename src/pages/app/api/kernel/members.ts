import { kernelHandler } from '../../../../server/kernel/http.mjs';
import { tenantMembers } from '../../../../server/kernel/service.mjs';
import { manageInvitation, manageMember } from '../../../../server/kernel/administration.mjs';
type KernelIdentity = { userId: string };
export const prerender = false;
export const GET = kernelHandler((identity, workspace, _body, request) =>
  tenantMembers(identity, workspace, Number(new URL(request.url).searchParams.get('page') ?? 1)));
export const POST = kernelHandler(async (identity: KernelIdentity, workspace: string | null, body: Record<string, unknown>) => ['accept','cancel','register','link'].includes(String(body.operation))
  ? manageInvitation(identity, workspace, body)
  : manageMember(identity, workspace, body), true);
