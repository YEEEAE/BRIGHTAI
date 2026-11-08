// Single import surface for server-side monitoring. Both layers are inert by
// default and independent of AIGAS_APP_ENABLED. See
// docs/MONITORING-AND-ANALYTICS-WIRING.md for the approval and data rules.
export { captureServerFailure, captureIntegritySignal, shouldCaptureFailure } from './sentry.mjs';
export { captureProductEvent, buildProductEvent, productEventNames } from './posthog.mjs';
export { sentrySettings, posthogSettings, approvalReference, monitoringEnvironment } from './config.mjs';
