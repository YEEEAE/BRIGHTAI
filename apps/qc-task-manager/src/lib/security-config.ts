// Runtime security configuration checks. Secrets are intentionally validated
// without ever echoing their values into logs or error messages.

const DEVELOPMENT_SECRET_VALUES = new Set([
  'change-me',
  'change-me-in-production',
  'dev-secret',
  'development-secret',
  'secret',
  'secret-key',
  'your-secret-here',
  'replace-me',
]);

const SECRET_NAMES = ['SESSION_SECRET', 'JWT_SECRET'] as const;

export function isDevelopmentSecret(value: string | undefined): boolean {
  return value != null && DEVELOPMENT_SECRET_VALUES.has(value.trim().toLowerCase());
}

/** Fail closed when a configured production secret is a known dev fallback. */
export function assertProductionSecretPolicy(env: NodeJS.ProcessEnv = process.env): void {
  if (env.NODE_ENV !== 'production') return;
  const unsafe = SECRET_NAMES.filter((name) => isDevelopmentSecret(env[name]));
  if (unsafe.length > 0) {
    throw new Error(`Production refuses development fallback values for: ${unsafe.join(', ')}`);
  }
}

export { DEVELOPMENT_SECRET_VALUES, SECRET_NAMES };
