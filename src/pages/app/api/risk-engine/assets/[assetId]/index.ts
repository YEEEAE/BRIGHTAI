import type { APIRoute } from 'astro';
import { handle } from '../../../../../../server/risk-engine/http.mjs';
export const prerender=false;
export const PATCH:APIRoute=({request,params})=>handle(request,'update',params.assetId);
export const DELETE:APIRoute=({request,params})=>handle(request,'archive',params.assetId);
