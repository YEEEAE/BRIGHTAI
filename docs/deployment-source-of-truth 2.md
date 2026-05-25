# BrightAI Deployment Source of Truth

## Public Site Runtime

The production public website at `https://brightai.site` is served by the `brightai-site` Render **static** service defined in `render.yaml`.

Render does not run `next start` for the public website. The Next.js files under `app/`, `components/`, and `lib/` are not the indexing source of truth and are excluded from `.render-static` during the Render static build.

## Source of Truth for Public URLs

For public, crawlable URLs, the source of truth is the static HTML file that maps to the canonical URL:

| URL shape | Source file |
| --- | --- |
| `/` | `index.html` |
| `/about/` | `about/index.html` |
| `/services/` | `services/index.html` |
| `/ai-agent/` | `ai-agent/index.html` |
| `/demo/ocr-demo/` | `demo/ocr-demo/index.html` |
| `/blog/example/` | `blog/example/index.html` |
| `/docs/example/` after deploy normalization | `docs/example/index.html` in `.render-static` |

Do not rely on `app/page.tsx` or other Next metadata for Google indexing. If a Next page exists for local experimentation and has the same canonical URL as a static page, its `title`, `description`, and `canonical` must stay aligned with the static HTML page, but the static HTML remains authoritative.

## Build Command

The Render static service runs this sequence:

```bash
npm ci --include=dev --no-audit --no-fund
npm run assets:minify
npm run assets:replace-refs
npm run production:fixes
npm run sitemap:all
npm run seo:gate
bash scripts/seo-hreflang-dirs.sh
rsync ... ./ .render-static/
node <render normalization script>
```

`npm run next:build` is intentionally not part of the production static-site build.

## Deploy Output

The deploy output is `.render-static`.

The build copies static site assets and HTML into `.render-static`, while excluding source-only or server-only directories such as:

- `app/`
- `components/`
- `lib/`
- `backend/`
- `scripts/`
- `node_modules/`
- `reports/`
- `tmp/`

This prevents source-only Next routes or backend files from becoming public static files.

## HTML Normalization During Deploy

After copying files into `.render-static`, `render.yaml` normalizes selected `.html` files to directory `index.html` files. For example:

- `docs/openapi.html` becomes `docs/openapi/index.html`
- `services/custom-ai-agent.html` becomes `services/custom-ai-agent/index.html`
- `sectors/healthcare.html` becomes `sectors/healthcare/index.html`

The canonical URL in the source HTML must already match the final public URL. The deploy normalization must not create a canonical mismatch.

## Sitemap Timing

`npm run sitemap:all` runs before files are copied to `.render-static`.

That means `sitemap.xml` is generated from the repository source files and must only include URLs whose source HTML is:

- public and indexable,
- self-canonical,
- not `noindex`,
- not redirect-like,
- not `.html` in the final `<loc>`,
- not uppercase in the final `<loc>`.

`npm run seo:gate` runs immediately after sitemap generation and before `.render-static` is created, so sitemap and canonical errors fail the Render build before deploy output is published.

## API Runtime

The `brightai-api` Render service is separate. It serves `/api/*` and `/ws/*` through rewrites from the static site. `backend/services/staticFiles.js` is not the source of truth for public marketing pages on `brightai-site`; it only controls backend/static fallback behavior for the API service.
