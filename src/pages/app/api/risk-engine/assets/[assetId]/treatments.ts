import type { APIRoute } from 'astro';
import { handle } from '../../../../../../server/risk-engine/http.mjs';
export const prerender=false;
export const GET:APIRoute=({request,params})=>handle(request,'treatments',params.assetId);
// Each update appends a full treatment revision; prior decisions stay immutable.
export const POST:APIRoute=({request,params})=>handle(request,'save-treatment',params.assetId);
export const PATCH:APIRoute=({request,params})=>handle(request,'save-treatment',params.assetId);
