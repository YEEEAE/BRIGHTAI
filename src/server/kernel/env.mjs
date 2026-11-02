// Server modules read runtime configuration only; never bake it into the build.
export const env = name => process.env[name];

// Keep the portal available in local development and closed in production by default.
export const isPortalEnabled = () =>
  process.env.NODE_ENV === 'development' || process.env.AIGAS_APP_ENABLED === 'true';
