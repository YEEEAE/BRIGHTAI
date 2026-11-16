import type { APIRoute } from 'astro';
import { handleAssist } from '../../../../server/risk-engine/assist.mjs';
export const prerender=false;
export const POST:APIRoute=({request})=>handleAssist(request);
