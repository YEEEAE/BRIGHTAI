// Explicit local-only portal entry. Production startup remains fail-closed.
// This opens the login surface; all product APIs keep their existing guards.
process.env.HOST = '127.0.0.1';
process.env.AIGAS_APP_ENABLED = 'true';
// Keep the trial URL independent of a deployment PORT already present in .env.
process.env.PORT = process.env.AIGAS_LOCAL_TRIAL_PORT || '4416';
await import('./server.mjs');
