import type { APIRoute } from 'astro';
import { handle } from '../../../../../server/ledger/http.mjs';
export const prerender = false;
export const GET: APIRoute = ({request}) => handle(request,'list');
export const POST: APIRoute = ({request}) => handle(request,'create');
