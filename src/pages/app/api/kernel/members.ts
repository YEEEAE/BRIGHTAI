import type { APIRoute } from 'astro';
import { authenticate } from '../../../../server/kernel/auth.mjs';
import { tenantMembers } from '../../../../server/kernel/service.mjs';
import { KernelError } from '../../../../server/kernel/core.mjs';
export const prerender = false;
const headers = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow', 'Vary': 'Authorization', 'X-Content-Type-Options': 'nosniff' };
// Read-only: role changes and invitations have no approved server path yet, so none is exposed.
export const GET: APIRoute = async ({ request }) => {
  try {
    const identity = await authenticate(request);
    const workspace = new URL(request.url).searchParams.get('workspace');
    return Response.json(await tenantMembers(identity, workspace), { headers });
  } catch (error: any) {
    const known = error instanceof KernelError;
    return Response.json({ code: known ? error.code : 'DB_UNAVAILABLE', message: known ? error.message : 'تعذر تحميل أعضاء المؤسسة. تحقق من اتصال القاعدة وترحيل Kernel.' }, { status: known ? error.status : 503, headers });
  }
};
