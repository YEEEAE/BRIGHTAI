// Server modules read runtime configuration only; never bake it into the build.
export const env = name => process.env[name];

// The portal is closed unless it is explicitly opened.
// - AIGAS_APP_ENABLED=false always wins, even in local development.
// - AIGAS_APP_ENABLED=true is the only way to open a non-development runtime.
// - With no flag, only `astro dev` (NODE_ENV=development) stays open so local
//   work is possible without shipping an open portal by accident.
export const isPortalEnabled = () => {
  const flag = process.env.AIGAS_APP_ENABLED;
  if (flag === 'true') return true;
  if (flag === 'false') return false;
  return process.env.NODE_ENV === 'development';
};
