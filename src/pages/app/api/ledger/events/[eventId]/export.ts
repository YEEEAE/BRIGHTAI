import type { APIRoute } from 'astro';
import { handle } from '../../../../../../server/ledger/http.mjs';
export const prerender = false;
export const GET: APIRoute = ({request,params}) => handle(request,'export',params.eventId);
