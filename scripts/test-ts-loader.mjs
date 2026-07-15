/**
 * scripts/test-ts-loader.mjs — CHAT-SESSION-2026-07-15
 *
 * Node 22 ESM loader hook that:
 *  1. Resolves extensionless relative imports to .ts files.
 *     (Node 22 with --experimental-strip-types still does NOT auto-resolve
 *     ".ts" on extensionless imports — this is the standard gap.)
 *  2. Forwards everything else to the default resolution.
 *
 * Used only by `node --import ./scripts/test-ts-loader.mjs --test ...` so
 * the test suite can import .ts source files without changing production
 * code (which intentionally uses extensionless imports per the project's
 * TS config + Astro conventions).
 *
 * The loader is intentionally narrow: it never compiles or strips types.
 * --experimental-strip-types (which the test runner also enables) handles
 * the type-stripping. The loader only fixes the resolution gap.
 *
 * Self-registration: this file calls `module.register()` at the top level
 * so `node --import ./scripts/test-ts-loader.mjs --test ...` is enough —
 * no separate --loader flag needed (the --loader flag is deprecated in
 * Node 22 in favor of --import + register()).
 */

import { register } from "node:module";
import { pathToFileURL, fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const TS_EXTENSIONS = [".ts", ".mts", ".cts"];

// Self-register the hook file. The first arg of register() is a
// specifier that Node will resolve relative to `parentURL` (the
// second arg). We pass the URL of THIS file as parentURL so a
// relative "./test-ts-loader-hook.mjs" resolves next to it.
const thisDir = dirname(fileURLToPath(import.meta.url));
register(
  pathToFileURL(join(thisDir, "test-ts-loader-hook.mjs")).href,
  import.meta.url,
);
