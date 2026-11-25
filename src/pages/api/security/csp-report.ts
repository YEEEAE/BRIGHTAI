import type { APIRoute } from 'astro';
import { receiveCspReport } from '../../../server/observability/csp-report.mjs';

export const prerender = false;
export const POST: APIRoute = ({ request }) => receiveCspReport(request);
