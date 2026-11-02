import { kernelHandler } from '../../../../server/kernel/http.mjs';
import { tenantMembers } from '../../../../server/kernel/service.mjs';
import { manageInvitation, manageMember } from '../../../../server/kernel/administration.mjs';
type KernelIdentity = { userId: string };
export const prerender = false;
export const GET = kernelHandler(tenantMembers);
export const POST = kernelHandler(async (identity: KernelIdentity, workspace: string | null, body: Record<string, unknown>) => body.operation === 'accept' || body.operation === 'register' || body.operation === 'link'
  ? manageInvitation(identity, workspace, body)
  : manageMember(identity, workspace, body), true);
