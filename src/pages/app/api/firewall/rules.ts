import type { APIRoute } from 'astro';
import { handle } from '../../../../server/firewall/http.mjs';
export const prerender = false;
export const GET: APIRoute = ({request}) => handle(request,'dashboard');
export const POST: APIRoute = ({request}) => handle(request,'create');
export const PATCH: APIRoute = ({request}) => handle(request,'toggle');
