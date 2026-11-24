import type { APIRoute } from 'astro';
import { proxyAuth } from '../../../server/kernel/auth-proxy.mjs';

export const prerender = false;
export const ALL: APIRoute = ({ params, request }) => proxyAuth(request, params.operation?.replace(/\/$/, ''));
