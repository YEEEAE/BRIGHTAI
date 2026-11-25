import type { APIRoute } from 'astro';
import { oidcRoute } from '../../../server/kernel/sso.mjs';
export const prerender = false;
export const GET: APIRoute = ({ request }) => oidcRoute(request, false);
