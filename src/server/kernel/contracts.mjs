// Stable HTTP contract metadata for the local AIGAS application.
//
// This module does not change routes or payload shapes. It names the version of
// the existing response envelope, the dependency classes a product may report,
// and the shared error body. Additive fields do not require a version bump; a
// removed field, a changed meaning or a changed status code does.
export const HTTP_CONTRACT_VERSION = 'aigas-http-v1';
export const ERROR_CONTRACT_VERSION = 'aigas-error-v1';

// Dependency classes are deliberately not interchangeable with commercial
// entitlement. `access denied` means an approved entitlement was revoked or the
// caller lacks it; `not configured` means no approved configuration exists yet;
// `blocked` means an existing dependency is deliberately stopped; `degraded`
// means the dependency answered but cannot be trusted for this operation.
export const dependencyClasses = Object.freeze({
  AVAILABLE: 'available',
  NOT_CONFIGURED: 'not configured',
  DEGRADED: 'degraded',
  BLOCKED: 'blocked',
  NOT_ENTITLED: 'access denied',
  EXPIRED: 'expired',
  TEMPORARILY_UNAVAILABLE: 'temporarily unavailable',
});

export const dependencyStatusSet = new Set(Object.values(dependencyClasses));

// One classification for a product-to-product or product-to-infrastructure
// dependency. `entitled` is about an approved access decision, never a price or
// a trial. A missing optional dependency must not be reported as a security
// failure of the calling product.
export function dependencyPosture({ configured = true, entitled = true, healthy = true } = {}) {
  if (configured !== true) return { status: dependencyClasses.NOT_CONFIGURED, code: 'NOT_CONFIGURED', retryable: false, blocking: false };
  if (entitled !== true) return { status: dependencyClasses.NOT_ENTITLED, code: 'NOT_ENTITLED', retryable: false, blocking: false };
  if (healthy !== true) return { status: dependencyClasses.DEGRADED, code: 'DEPENDENCY_DEGRADED', retryable: true, blocking: false };
  return { status: dependencyClasses.AVAILABLE, code: 'AVAILABLE', retryable: false, blocking: false };
}

// Optional dependencies are declared with `required: false`. A caller that
// cannot use an optional dependency continues with the Kernel baseline controls
// that do not depend on it; only a declared mandate may turn the state into a
// blocking failure, and that decision belongs to the calling service.
export function dependencyEntry(product, state, { required = false, reason = null } = {}) {
  if (!dependencyStatusSet.has(state)) throw new Error('Unknown dependency state');
  return Object.freeze({ product, required, status: state, reason, blocking: required && state !== dependencyClasses.AVAILABLE });
}

// Every product HTTP handler returns this shape on failure. `code` is a stable
// machine code; `message` is Arabic operator-facing text; `dependencyStatus`
// is only present when the failure is a classified dependency.
export function errorBody({ code, message, dependencyStatus = null, extra = {} } = {}) {
  return {
    code,
    message,
    contract: { version: HTTP_CONTRACT_VERSION, error: ERROR_CONTRACT_VERSION },
    ...(dependencyStatus ? { dependencyStatus } : {}),
    ...extra,
  };
}

export function contractHeaders(base = {}) {
  // Every AIGAS API response is a private, same-origin document fragment: it must not
  // be framed and must not be readable as a cross-origin resource. Callers may override,
  // but no caller needs to repeat these two lines.
  return {
    'X-Frame-Options': 'DENY',
    'Cross-Origin-Resource-Policy': 'same-origin',
    ...base,
    'X-AIGAS-Contract': HTTP_CONTRACT_VERSION,
  };
}
