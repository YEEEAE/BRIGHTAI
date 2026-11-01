import type { APIRoute } from 'astro';
import { handle } from '../../../../../../server/ledger/http.mjs';
export const prerender = false;
export const POST: APIRoute = ({request,params}) => handle(request,'verify',params.eventId);
