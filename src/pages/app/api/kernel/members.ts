import { kernelHandler } from '../../../../server/kernel/http.mjs';
import { tenantMembers } from '../../../../server/kernel/service.mjs';
import { manageInvitation, manageMember } from '../../../../server/kernel/administration.mjs';
type KernelIdentity = { userId: string };
export const prerender = false;
export const GET = kernelHandler(tenantMembers);
export const POST = kernelHandler(async (identity: KernelIdentity, workspace: string | null, body: Record<string, unknown>) => ['accept','cancel','register','link'].includes(String(body.operation))
  ? manageInvitation(identity, workspace, body)
  : manageMember(identity, workspace, body), true);
