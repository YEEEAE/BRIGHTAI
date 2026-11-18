import type { APIRoute } from 'astro';
import { publicSandbox } from '../../../server/ai/public-sandbox-limiter.mjs';
export const prerender = false;
export const POST: APIRoute = publicSandbox;
