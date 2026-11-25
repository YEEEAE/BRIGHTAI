import { probeResponse, methodNotAllowed } from './probe-response.mjs';
import { buildIdentity } from './version.mjs';

export function liveResponse(method) {
  if (method !== 'GET' && method !== 'HEAD') return methodNotAllowed();
  const { version, commit } = buildIdentity();
  return probeResponse(method, 200, { status: 'ok', version, commit });
}
