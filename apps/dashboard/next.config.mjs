/**
 * @brightai/dashboard — Next.js config
 *
 * - Transpiles the workspace @brightai/* packages so we can import
 *   the source TS directly without a build step.
 * - Sets up image domains (Clerk avatars, content URLs).
 * - Server actions allowed up to 2MB (Clerk + form data).
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Standalone output for the production Dockerfile. In dev we use
  // the default output (no .next/standalone dir). Override with
  // `NEXT_OUTPUT=export` if you want a static export (not used today).
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Keep native/binary-backed server packages out of the webpack bundle.
  // `onnxruntime-node` ships prebuilt `.node` N-API binaries that webpack
  // cannot parse; `@huggingface/transformers` (used by `lib/firewall/detectors/ner.ts`)
  // statically re-exports ONNX bindings. Listing both here lets Node resolve
  // them at runtime instead of bundling them. This preserves the lazy
  // NER pipeline — no mocking, no silent disabling.
  serverExternalPackages: ['@huggingface/transformers', 'onnxruntime-node'],
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      // Clerk avatar service (img.clerk.com)
      { protocol: 'https', hostname: 'img.clerk.com' },
      { protocol: 'https', hostname: 'images.clerk.dev' },
      // Common content sources
      { protocol: 'https', hostname: 'cdn.brightai.site' },
    ],
  },
  transpilePackages: ['@brightai/config', '@brightai/db'],
  // Don't expose the framework to headers (security hygiene)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
