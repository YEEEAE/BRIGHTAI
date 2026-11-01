import type { APIRoute } from 'astro';
import { handle } from '../../../../../../server/risk-engine/http.mjs';
export const prerender=false;
export const GET:APIRoute=({request,params})=>handle(request,'revisions',params.assetId);
