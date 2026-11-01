import type { APIRoute } from 'astro';
import { errorResponse, listModels, privateHeaders } from '../../../../server/secure-chat/service.mjs';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    return Response.json(await listModels(request), { headers: privateHeaders });
  } catch (error) {
    return errorResponse(error);
  }
};
