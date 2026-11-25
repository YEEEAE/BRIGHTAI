import type { APIRoute } from 'astro';
import { readyResponse } from '../server/kernel/health-endpoint.mjs';

export const prerender = false;
export const ALL: APIRoute = ({ request }) => readyResponse(request.method);
