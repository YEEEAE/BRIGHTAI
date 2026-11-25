import type { APIRoute } from 'astro';
import { liveResponse } from '../server/kernel/liveness.mjs';

export const prerender = false;
export const ALL: APIRoute = ({ request }) => liveResponse(request.method);
