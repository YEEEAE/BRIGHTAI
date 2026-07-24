/**
 * src/astro-modules.d.ts — ambient module declarations for .astro files.
 *
 * P0-3 cleanup (2026-07-19): without this, `tsc` errors on every
 * `import './SomeName.astro'` because .astro files don't have TS
 * types. Astro's own `tsc` wrapper handles this, but `pnpm
 * typecheck` runs the raw `tsc` which doesn't.
 *
 * The `any` type is intentional — .astro files are validated by
 * the Astro compiler, not tsc. This declaration just tells tsc
 * "trust me, this import exists".
 */

declare module '*.astro' {
  const component: unknown;
  export default component;
}
