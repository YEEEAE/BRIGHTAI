/**
 * scripts/test-ts-loader-hook.mjs — CHAT-SESSION-2026-07-15
 *
 * Companion to test-ts-loader.mjs. Kept separate so the register()
 * call at the top of test-ts-loader.mjs can self-register this file
 * by URL.
 */

import { existsSync, statSync, readFileSync } from "node:fs";
import { dirname, resolve as pathResolve, join } from "node:path";
import { pathToFileURL } from "node:url";

const TS_EXTENSIONS = [".ts", ".mts", ".cts"];

export async function resolve(specifier, context, nextResolve) {
  // Only touch relative imports ("./" or "../").
  const isRelative = specifier.startsWith("./") || specifier.startsWith("../");
  if (!isRelative) {
    return nextResolve(specifier, context);
  }

  const parentURL = context.parentURL;
  if (!parentURL) {
    return nextResolve(specifier, context);
  }

  // Astro source modules may import text assets as `?raw` (the QC DB layer
  // bundles schema.sql this way). Node's default ESM loader does not know how
  // to resolve that asset in server-less unit tests, so map it to the file URL
  // and let load() turn it into a tiny ESM module.
  if (specifier.endsWith('.sql?raw')) {
    const targetPath = pathResolve(dirname(new URL(parentURL).pathname), specifier.slice(0, -4));
    if (existsSync(targetPath) && statSync(targetPath).isFile()) {
      return { url: pathToFileURL(targetPath).href + '?raw', shortCircuit: true };
    }
  }

  const parentPath = dirname(new URL(parentURL).pathname);
  const target = pathResolve(parentPath, specifier);

  // If the specifier already has an extension, defer to the default.
  if (/\.[a-zA-Z0-9]+$/.test(specifier)) {
    return nextResolve(specifier, context);
  }

  // Try file.<ext> first.
  for (const ext of TS_EXTENSIONS) {
    const candidate = `${target}${ext}`;
    if (existsSync(candidate) && statSync(candidate).isFile()) {
      return {
        ...(await nextResolve(pathToFileURL(candidate).href, context)),
        url: pathToFileURL(candidate).href,
      };
    }
  }

  // Try dir/index.<ext>.
  for (const ext of TS_EXTENSIONS) {
    const candidate = join(target, `index${ext}`);
    if (existsSync(candidate) && statSync(candidate).isFile()) {
      return {
        ...(await nextResolve(pathToFileURL(candidate).href, context)),
        url: pathToFileURL(candidate).href,
      };
    }
  }

  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  const parsed = new URL(url);
  if (parsed.search === '?raw' && parsed.pathname.endsWith('.sql')) {
    const source = `export default ${JSON.stringify(readFileSync(parsed, 'utf8'))};`;
    return { format: 'module', source, shortCircuit: true };
  }
  return nextLoad(url, context);
}
