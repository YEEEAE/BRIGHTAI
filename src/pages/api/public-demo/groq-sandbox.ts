import type { APIRoute } from 'astro';
import { publicSandbox } from '../../../server/ai/public-sandbox-limiter.mjs';
export const prerender = false;
// Use adapter-derived address only; never trust visitor-supplied forwarding headers.
export const POST: APIRoute = ({request, clientAddress}) => publicSandbox(request, clientAddress);
