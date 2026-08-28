import type { APIRoute } from 'astro';
import { apiJsonError, isResponse, requireApiUser, requireCsrf } from '../../../lib/api-security';
import { parseUxEvent, recordUxEvent } from '../../../lib/uxTelemetry';

export const POST: APIRoute = async (context) => {
  const csrf = requireCsrf(context);
  if (csrf) return csrf;
  const auth = requireApiUser(context);
  if (isResponse(auth)) return auth;

  let body: unknown;
  try {
    body = await context.request.json();
  } catch {
    return apiJsonError('Invalid telemetry payload.', 400);
  }
  const parsed = parseUxEvent(body);
  if (!parsed.success) return apiJsonError('Invalid telemetry payload.', 400);

  try {
    recordUxEvent(parsed.data, auth.role);
    return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[ux-telemetry] event write failed', error);
    return apiJsonError('Telemetry unavailable.', 503);
  }
};
