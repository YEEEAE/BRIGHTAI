// This module is imported exclusively by server modules. Runtime values win.
const built = {
  DATABASE_URL: import.meta.env?.DATABASE_URL,
  NEON_AUTH_BASE_URL: import.meta.env?.NEON_AUTH_BASE_URL,
  NEON_AUTH_URL: import.meta.env?.NEON_AUTH_URL,
  NEON_AUTH_JWKS_URL: import.meta.env?.NEON_AUTH_JWKS_URL,
  NEON_JWKS_URL: import.meta.env?.NEON_JWKS_URL,
};
export const env = name => process.env[name] ?? built[name];
