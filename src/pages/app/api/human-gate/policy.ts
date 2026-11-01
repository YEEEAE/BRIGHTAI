import type { APIRoute } from 'astro';
import { handle } from '../../../../server/human-gate/http.mjs';
export const prerender=false;
export const POST:APIRoute=({request})=>handle(request,'policy');
