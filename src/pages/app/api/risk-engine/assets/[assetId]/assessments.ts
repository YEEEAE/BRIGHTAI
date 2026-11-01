import type { APIRoute } from 'astro';
import { handle } from '../../../../../../server/risk-engine/http.mjs';
export const prerender=false;
export const GET:APIRoute=({request,params})=>handle(request,'history',params.assetId);
export const POST:APIRoute=({request,params})=>handle(request,'assess',params.assetId);
