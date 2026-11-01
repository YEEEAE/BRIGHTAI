import { kernelHandler } from '../../../../server/kernel/http.mjs';
import { incomingInvitations } from '../../../../server/kernel/administration.mjs';
export const prerender = false;
export const GET = kernelHandler(incomingInvitations);
