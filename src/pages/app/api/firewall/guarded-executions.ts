import type { APIRoute } from 'astro';
import { handle } from '../../../../server/firewall/http.mjs';
export const prerender = false;
export const POST: APIRoute = ({ request }) => handle(request, 'enforce');
