import { readJsonObject, validateBody } from '../../../../server/api/json.mjs';
import { bodySchemaFor } from '../../../../server/api/request-schemas.mjs';
import { hasTrustedApiOrigin } from '../../../../server/api/origin.mjs';
import type { APIRoute } from 'astro';
import { errorResponse, privateHeaders, sendMessage, cancelMessage } from '../../../../server/secure-chat/service.mjs';
import { KernelError } from '../../../../server/kernel/core.mjs';
export const prerender = false;

async function bodyFor(request: Request) {
  if (!hasTrustedApiOrigin(request)) throw new KernelError(403,'ORIGIN_REJECTED','مصدر الطلب غير مسموح.');
  return validateBody(bodySchemaFor(request), await readJsonObject(request, 131072));
}
export const POST: APIRoute = async ({request}) => {
  try {
    const body=await bodyFor(request);
    return Response.json(await sendMessage(request,body),{headers:privateHeaders});
  } catch(error) { return errorResponse(error); }
};
export const DELETE: APIRoute = async ({request}) => {
  try {
    const body=await bodyFor(request);
    return Response.json(await cancelMessage(request,body.requestId),{headers:privateHeaders});
  } catch(error) { return errorResponse(error, 'DELETE'); }
};
