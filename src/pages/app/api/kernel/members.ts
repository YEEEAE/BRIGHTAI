import { kernelHandler } from '../../../../server/kernel/http.mjs';
import { tenantMembers } from '../../../../server/kernel/service.mjs';
import { manageInvitation } from '../../../../server/kernel/administration.mjs';
export const prerender = false;
export const GET = kernelHandler(tenantMembers);
export const POST = kernelHandler(manageInvitation, true);
