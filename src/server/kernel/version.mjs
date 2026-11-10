import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './env.mjs';

// Runtime identity for the process answering the request. Two independent
// sources are reported so a mismatched deploy is visible instead of assumed:
//   - artifact: dist/server/version.json written by scripts/build-version.mjs
//   - runtime:  RENDER_GIT_COMMIT / AIGAS_RELEASE_SHA supplied by the platform
// Nothing here is a secret; identifiers and digests only, never configuration
// values or connection strings.
const COMMIT = /^[a-f0-9]{40}$/;
const DIGEST = /^sha256:[a-f0-9]{64}$/;

function commitFrom(value) {
  const normalized = (value ?? '').trim().toLowerCase();
  return COMMIT.test(normalized) ? normalized : null;
}

let cached;

// The server bundle may be emitted into dist/server or dist/server/chunks, so
// candidate paths are tried instead of assuming one layout. A missing artifact
// is reported as absent, never fabricated.
function artifactCandidates() {
  return [
    env('AIGAS_VERSION_FILE'),
    join(process.cwd(), 'dist/server/version.json'),
    join(process.cwd(), 'dist/version.json'),
    fileURLToPath(new URL('./version.json', import.meta.url)),
  ].filter(Boolean);
}

function readArtifact() {
  for (const file of artifactCandidates()) {
    try {
      const raw = readFileSync(file);
      const data = JSON.parse(raw.toString('utf8'));
      const packageLock = (data.packageLock ?? '').trim().toLowerCase();
      return {
        present: true,
        commit: commitFrom(data.commit),
        builtAt: typeof data.builtAt === 'string' ? data.builtAt : null,
        node: typeof data.node === 'string' ? data.node : null,
        packageLock: DIGEST.test(packageLock) ? packageLock : null,
        digest: `sha256:${createHash('sha256').update(raw).digest('hex')}`,
      };
    } catch {
      // Try the next candidate; a malformed artifact must not break readiness.
    }
  }
  return { present: false, commit: null, builtAt: null, node: null, packageLock: null, digest: null };
}

export function buildIdentity() {
  if (cached) return cached;
  const artifact = readArtifact();
  const declaredCommit = commitFrom(env('AIGAS_RELEASE_SHA'));
  const runtimeCommit = commitFrom(env('RENDER_GIT_COMMIT'));
  const imageDigest = (env('AIGAS_IMAGE_DIGEST') ?? '').trim().toLowerCase();
  // The artifact proves what was built; the platform value proves what the
  // scheduler intended to run. Any disagreement is surfaced, not resolved.
  const commit = artifact.commit ?? declaredCommit ?? runtimeCommit;
  const claimed = declaredCommit ?? runtimeCommit;
  cached = Object.freeze({
    commit,
    consistent: artifact.commit && claimed ? artifact.commit === claimed : null,
    artifact,
    service: {
      id: env('RENDER_SERVICE_ID') || null,
      name: env('RENDER_SERVICE_NAME') || null,
      type: env('RENDER_SERVICE_TYPE') || null,
    },
    deploy: {
      id: env('AIGAS_DEPLOY_ID') || null,
      imageDigest: DIGEST.test(imageDigest) ? imageDigest : null,
      claimedCommit: claimed,
    },
  });
  return cached;
}

// Tests and long-lived processes may change the recorded artifact path; the
// cache is only cleared explicitly, never on a timer.
export function resetBuildIdentity() {
  cached = undefined;
}
