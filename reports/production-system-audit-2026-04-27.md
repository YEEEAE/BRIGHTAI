# BrightAI Production System Audit - 2026-04-27

Scope: complete local repository inventory excluding `node_modules`, `.git`, `.venv`, build/dist caches. Deployment assumption: Render static site + Render Node API behind Cloudflare.

## Summary Counts
| Metric | Count |
|---|---:|
| totalFiles | 799 |
| htmlPages | 252 |
| cssFiles | 37 |
| jsMjsFiles | 135 |
| assetLikeFiles | 108 |
| dependencies | 18 |
| apiRoutes | 10 |

## File Inventory
| Path | Purpose | Static dependencies |
|---|---|---|
| _headers | Project support file | none detected statically |
| _redirects | Project support file | none detected statically |
| .agents/.DS_Store | Codex/agent skill/plugin metadata | none detected statically |
| .agents/plugins/marketplace.json | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/ rtl-ui-guardian/agents/openai.yaml | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/ rtl-ui-guardian/references/component-rtl-checklist.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/ rtl-ui-guardian/references/logical-properties-map.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/ rtl-ui-guardian/references/mixed-content-bidi.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/ rtl-ui-guardian/references/react-nextjs-rtl.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/ rtl-ui-guardian/SKILL.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/.DS_Store | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/.github/FUNDING.yml | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/.github/ISSUE_TEMPLATE/design-md-request.yml | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/.gitignore | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/agents/gemini.yaml | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/agents/openai.yaml | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/CONTRIBUTING.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/airbnb/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/airtable/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/apple/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/binance/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/bmw/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/bugatti/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/cal/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/claude/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/clay/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/clickhouse/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/cohere/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/coinbase/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/composio/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/cursor/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/elevenlabs/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/expo/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/ferrari/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/figma/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/framer/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/hashicorp/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/ibm/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/intercom/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/kraken/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/lamborghini/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/linear.app/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/lovable/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/mastercard/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/meta/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/minimax/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/mintlify/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/miro/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/mistral.ai/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/mongodb/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/nike/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/notion/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/nvidia/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/ollama/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/opencode.ai/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/pinterest/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/playstation/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/posthog/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/raycast/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/renault/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/replicate/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/resend/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/revolut/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/runwayml/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/sanity/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/semrush/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/sentry/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/shopify/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/spacex/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/spotify/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/starbucks/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/stripe/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/supabase/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/superhuman/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/tesla/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/theverge/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/together.ai/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/uber/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/vercel/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/vodafone/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/voltagent/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/warp/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/webflow/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/wired/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/wise/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/x.ai/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/design-md/zapier/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/LICENSE | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/references/catalog.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/references/CONTRIBUTING.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/references/stitch-format.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/scripts/create_design_md_dirs.py | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/scripts/fetch_design_md.py | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/SKILL 2.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/awesome-design-md/SKILL.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/design-md/agents/openai.yaml | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/design-md/examples/DESIGN.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/design-md/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/design-md/SKILL.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/frontend-design/agents/openai.yaml | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/frontend-design/LICENSE.txt | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/frontend-design/references/design-qa-checklist.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/frontend-design/references/visual-directions.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/frontend-design/SKILL.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/google-indexing-seo-guardian/agents/openai.yaml | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/google-indexing-seo-guardian/references/google-indexing-checklist.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/google-indexing-seo-guardian/scripts/google_indexing_audit.py | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/google-indexing-seo-guardian/SKILL.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/intelligent-content-reviewer-validator/agents/openai.yaml | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/intelligent-content-reviewer-validator/SKILL.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/internal-links-guardian/agents/openai.yaml | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/internal-links-guardian/references/coverage-and-escalation.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/internal-links-guardian/references/report-template.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/internal-links-guardian/SKILL.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/karpathy-guidelines/agents/openai.yaml | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/karpathy-guidelines/references/upstream-cursor-rule.mdc | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/karpathy-guidelines/references/upstream-cursor.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/karpathy-guidelines/references/upstream-examples.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/karpathy-guidelines/references/upstream-plugin.json | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/karpathy-guidelines/references/upstream-readme.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/karpathy-guidelines/references/upstream-readme.zh.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/karpathy-guidelines/references/upstream-SKILL.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/karpathy-guidelines/SKILL.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/render-deploy/agents/openai.yaml | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/render-deploy/assets/docker.yaml | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/render-deploy/assets/go-api.yaml | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/render-deploy/assets/static-site.yaml | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/render-deploy/LICENSE.txt | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/render-deploy/references/blueprint-spec.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/render-deploy/references/codebase-analysis.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/render-deploy/references/configuration-guide.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/render-deploy/references/deployment-details.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/render-deploy/references/direct-creation.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/render-deploy/references/error-patterns.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/render-deploy/references/post-deploy-checks.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/render-deploy/references/runtimes.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/render-deploy/references/service-types.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/render-deploy/references/troubleshooting-basics.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/render-deploy/SKILL.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/seo-audit/agents/openai.yaml | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/seo-audit/SKILL.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/seo-content/agents/openai.yaml | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/seo-content/SKILL.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/seo-geo/agents/openai.yaml | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/seo-geo/SKILL.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/seo-hreflang/agents/openai.yaml | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/seo-hreflang/SKILL.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/seo-images/agents/openai.yaml | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/seo-images/SKILL.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/seo-local/agents/openai.yaml | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/seo-local/SKILL.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/seo-page/agents/openai.yaml | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/seo-page/SKILL.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/seo-plan/agents/openai.yaml | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/seo-plan/assets/agency.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/seo-plan/assets/ecommerce.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/seo-plan/assets/generic.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/seo-plan/assets/local-service.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/seo-plan/assets/publisher.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/seo-plan/assets/saas.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/seo-plan/SKILL.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/seo-schema/agents/openai.yaml | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/seo-schema/SKILL.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/seo-sitemap/agents/openai.yaml | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/seo-sitemap/SKILL.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/seo-technical/agents/openai.yaml | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/seo-technical/SKILL.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/seo/agents/openai.yaml | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/seo/LICENSE | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/seo/references/cwv-thresholds.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/seo/references/eeat-framework.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/seo/references/local-schema-types.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/seo/references/local-seo-signals.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/seo/references/quality-gates.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/seo/references/schema-types.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/seo/requirements.txt | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/seo/schema/templates.json | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/seo/scripts/fetch_page.py | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/seo/scripts/parse_html.py | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/seo/SKILL.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/AGENTS.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/agents/openai.yaml | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/README.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/advanced-event-handler-refs.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/advanced-init-once.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/advanced-use-latest.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/async-api-routes.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/async-defer-await.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/async-dependencies.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/async-parallel.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/async-suspense-boundaries.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/bundle-barrel-imports.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/bundle-conditional.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/bundle-defer-third-party.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/bundle-dynamic-imports.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/bundle-preload.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/client-event-listeners.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/client-localstorage-schema.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/client-passive-event-listeners.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/client-swr-dedup.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/js-batch-dom-css.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/js-cache-function-results.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/js-cache-property-access.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/js-cache-storage.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/js-combine-iterations.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/js-early-exit.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/js-hoist-regexp.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/js-index-maps.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/js-length-check-first.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/js-min-max-loop.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/js-set-map-lookups.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/js-tosorted-immutable.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/rendering-activity.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/rendering-animate-svg-wrapper.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/rendering-conditional-render.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/rendering-content-visibility.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/rendering-hoist-jsx.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/rendering-hydration-no-flicker.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/rendering-hydration-suppress-warning.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/rendering-svg-precision.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/rendering-usetransition-loading.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/rerender-defer-reads.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/rerender-dependencies.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/rerender-derived-state-no-effect.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/rerender-derived-state.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/rerender-functional-setstate.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/rerender-lazy-state-init.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/rerender-memo-with-default-value.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/rerender-memo.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/rerender-move-effect-to-event.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/rerender-simple-expression-in-memo.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/rerender-transitions.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/rerender-use-ref-transient-values.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/server-after-nonblocking.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/server-auth-actions.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/server-cache-lru.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/server-cache-react.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/server-dedup-props.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/server-hoist-static-io.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/server-parallel-fetching.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/rules/server-serialization.md | Codex/agent skill/plugin metadata | none detected statically |
| .agents/skills/vercel-react-best-practices/SKILL.md | Codex/agent skill/plugin metadata | none detected statically |
| .DS_Store | Project support file | none detected statically |
| .gitignore | Project support file | none detected statically |
| .htaccess | Project support file | none detected statically |
| .nojekyll | Project support file | none detected statically |
| .vscode/settings.json | Project support file | none detected statically |
| 06932e6c52144c44bb9ff0296e3da655.txt | Project support file | none detected statically |
| 404.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| 500.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| about/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| ai-agent/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| ai-bots/BrightMath/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| ai-bots/BrightProject/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| ai-bots/BrightRecruiter/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| ai-bots/BrightSales/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| ai-bots/BrightSupport/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| ai-bots/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| ai-scolecs/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| ai-workflows/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| assets/3d-icons/customer-robots-0.avif | Image/icon asset | none detected statically |
| assets/3d-icons/customer-robots-0.webp | Image/icon asset | none detected statically |
| assets/3d-icons/digital-twins-simulation-0.avif | Image/icon asset | none detected statically |
| assets/3d-icons/digital-twins-simulation-0.webp | Image/icon asset | none detected statically |
| assets/3d-icons/icon_1_3d_robot_artificial_intelligence_icon.avif | Image/icon asset | none detected statically |
| assets/3d-icons/icon_1_3d_robot_artificial_intelligence_icon.webp | Image/icon asset | none detected statically |
| assets/3d-icons/icon_1_3d_rocket_startup_icon.avif | Image/icon asset | none detected statically |
| assets/3d-icons/icon_1_3d_rocket_startup_icon.webp | Image/icon asset | none detected statically |
| assets/3d-icons/icon_2_3d_robot_artificial_intelligence_icon.avif | Image/icon asset | none detected statically |
| assets/3d-icons/icon_2_3d_robot_artificial_intelligence_icon.webp | Image/icon asset | none detected statically |
| assets/3d-icons/icon_3_3d_robot_artificial_intelligence_icon.avif | Image/icon asset | none detected statically |
| assets/3d-icons/icon_3_3d_robot_artificial_intelligence_icon.webp | Image/icon asset | none detected statically |
| assets/3d-icons/smart-drones-inspection-0.avif | Image/icon asset | none detected statically |
| assets/3d-icons/smart-drones-inspection-0.webp | Image/icon asset | none detected statically |
| assets/3d-icons/warehouse-automation-0.avif | Image/icon asset | none detected statically |
| assets/3d-icons/warehouse-automation-0.webp | Image/icon asset | none detected statically |
| assets/css/demo-experience.css | Stylesheet asset | HTML link refs |
| assets/css/design-tokens.css | Stylesheet asset | HTML link refs |
| assets/css/extracted-inline-styles.css | Stylesheet asset | HTML link refs |
| assets/css/text-ratio-fix.min.css | Stylesheet asset | HTML link refs |
| assets/css/ux-audit-fixes.css | Stylesheet asset | HTML link refs |
| assets/fonts/IBMPlexSansArabic-Bold.ttf | Font asset | none detected statically |
| assets/fonts/IBMPlexSansArabic-Bold.woff2 | Font asset | none detected statically |
| assets/fonts/IBMPlexSansArabic-Medium.ttf | Font asset | none detected statically |
| assets/fonts/IBMPlexSansArabic-Medium.woff2 | Font asset | none detected statically |
| assets/fonts/IBMPlexSansArabic-Regular.ttf | Font asset | none detected statically |
| assets/fonts/IBMPlexSansArabic-Regular.woff2 | Font asset | none detected statically |
| assets/fonts/IBMPlexSansArabic-SemiBold.ttf | Font asset | none detected statically |
| assets/fonts/IBMPlexSansArabic-SemiBold.woff2 | Font asset | none detected statically |
| assets/fonts/ScheherazadeNew-Regular.ttf | Font asset | none detected statically |
| assets/fonts/ScheherazadeNew-Regular.woff2 | Font asset | none detected statically |
| assets/images/chatbot.svg | Image/icon asset | none detected statically |
| assets/images/Gemini.png | Image/icon asset | none detected statically |
| assets/images/grid.svg | Image/icon asset | none detected statically |
| assets/images/hero-brain.svg | Image/icon asset | none detected statically |
| assets/images/noise.png | Image/icon asset | none detected statically |
| assets/js/demo-experience-loader.js | Client-side JavaScript asset | browser DOM APIs |
| assets/js/gemini-demo-engine.js | Client-side JavaScript asset | browser DOM APIs |
| assets/js/live-demo-apps.js | Client-side JavaScript asset | browser DOM APIs |
| assets/svg/inline-icon-20ad9f0ba8e6.svg | Image/icon asset | none detected statically |
| assets/svg/inline-icon-3effdab8a020.svg | Image/icon asset | none detected statically |
| assets/svg/inline-icon-756421bc760e.svg | Image/icon asset | none detected statically |
| backend/.env.example | Project support file | Node http/ws/runtime config |
| backend/blog-slug-redirects.e2e.test.js | Project support file | Node http/ws/runtime config; Node/CommonJS or browser JS by location |
| backend/config/index.js | Project support file | Node http/ws/runtime config; Node/CommonJS or browser JS by location |
| backend/data/search-index 2.json | Project support file | Node http/ws/runtime config |
| backend/groq-stream.functional.test.js | Project support file | Node http/ws/runtime config; Node/CommonJS or browser JS by location |
| backend/middleware/rateLimiter.js | Backend middleware | Node http/ws/runtime config; Node/CommonJS or browser JS by location |
| backend/middleware/README.md | Backend middleware | Node http/ws/runtime config |
| backend/package-lock.json | Node package manifest/lockfile | Node http/ws/runtime config |
| backend/package.json | Node package manifest/lockfile | Node http/ws/runtime config |
| backend/rag-search.functional.test.js | Project support file | Node http/ws/runtime config; Node/CommonJS or browser JS by location |
| backend/routes/aiGateway.js | Backend API route handler | Node http/ws/runtime config; Node/CommonJS or browser JS by location |
| backend/routes/analytics.js | Backend API route handler | Node http/ws/runtime config; Node/CommonJS or browser JS by location |
| backend/routes/chat.js | Backend API route handler | Node http/ws/runtime config; Node/CommonJS or browser JS by location |
| backend/routes/gemini.js | Backend API route handler | Node http/ws/runtime config; Node/CommonJS or browser JS by location |
| backend/routes/groq.js | Backend API route handler | Node http/ws/runtime config; Node/CommonJS or browser JS by location |
| backend/routes/medical.js | Backend API route handler | Node http/ws/runtime config; Node/CommonJS or browser JS by location |
| backend/routes/search.js | Backend API route handler | Node http/ws/runtime config; Node/CommonJS or browser JS by location |
| backend/routes/summary.js | Backend API route handler | Node http/ws/runtime config; Node/CommonJS or browser JS by location |
| backend/ScheherazadeNew-Regular.ttf | Project support file | Node http/ws/runtime config |
| backend/server.js | Project support file | Node http/ws/runtime config; Node/CommonJS or browser JS by location |
| backend/services/aiGateway.js | Backend service/provider logic | Node http/ws/runtime config; Node/CommonJS or browser JS by location |
| backend/services/openaiCompatProvider.js | Backend service/provider logic | Node http/ws/runtime config; Node/CommonJS or browser JS by location |
| backend/services/ragSearch.js | Backend service/provider logic | Node http/ws/runtime config; Node/CommonJS or browser JS by location |
| backend/static-seo-headers.e2e.test.js | Project support file | Node http/ws/runtime config; Node/CommonJS or browser JS by location |
| backend/stream-routes.e2e.test.js | Project support file | Node http/ws/runtime config; Node/CommonJS or browser JS by location |
| backend/utils/cache.js | Backend utility | Node http/ws/runtime config; Node/CommonJS or browser JS by location |
| backend/utils/errorHandler.js | Backend utility | Node http/ws/runtime config; Node/CommonJS or browser JS by location |
| backend/utils/sanitizer.js | Backend utility | Node http/ws/runtime config; Node/CommonJS or browser JS by location |
| backend/utils/sessionStore.js | Backend utility | Node http/ws/runtime config; Node/CommonJS or browser JS by location |
| backend/vitest.config.mjs | Project support file | Node http/ws/runtime config; Node ESM |
| BingSiteAuth.xml | Project support file | none detected statically |
| blog/ai-agents-business-guide/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/ai-automation-project-analysis/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/ai-business-performance/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/ai-data-analysis-tools/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/ai-energy-saudi/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/ai-finance-saudi/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/ai-generative-content-industry-saudi-arabia/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/ai-guide-saudi-business/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/ai-healthcare-saudi/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/ai-implementation-cost-guide/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/ai-innovation-saudi-arabia/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/ai-manufacturing-digital-guide/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/ai-marketing-guide/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/ai-transformation/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/big-data-analysis/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/building-ai-agents-guide/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/building-ai-agents-practical-guide/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/business-intelligence-data-analysis/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/business-intelligence-saudi/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/case-study-saudi-companies-ai-agents-customer-service/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/chatgpt-vs-claude-vs-gemini-arabic/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/check-canonical.js | Project support file | Node/CommonJS or browser JS by location |
| blog/choose-ai-company-saudi/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/claude-opus-4-6-saudi-market/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/commerce-ministry-chatbot/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/data-analysis-best-practices/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/data-analysis-decision-making/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/digital-banking-saudi/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/digital-health-smart-archive/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/digital-transformation-automation/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/financial-hr-automation/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/future-of-intelligent-data-analysis-finance-sector/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/Gemini.png | Image/icon asset | none detected statically |
| blog/generative-artificial-intelligence/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/government-ai-solutions-saudi/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/government-ai-solutions/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/hr-automation-case-study/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/hr-automation-saudi/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/industrial-automation-productivity/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/industrial-automation-repetitive-tasks/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/intelligent-data-analysis/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/kfshrc-breast-cancer-ai/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/kpi-dashboard-guide/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/ksu-adaptive-learning/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/machine-learning-business/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/machine-learning-computer-vision/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/nca-ai-compliance-saudi/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/nca-compliance/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/power-bi-saudi-guide/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/private-hospital-scheduling-optimization/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/process-automation-ai-efficiency/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/process-automation/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/riyadh-municipality-ai-license/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/saudi-agritech-smart-farming/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/saudi-bank-fraud-detection/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/saudi-dates-quality-ai/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/saudi-ecommerce-ai-growth/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/saudi-edtech-personalized-learning/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/saudi-energy-predictive-maintenance/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/saudi-factory-ai-productivity/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/saudi-hospitality-dynamic-pricing/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/saudi-insurance-claims-ai/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/saudi-logistics-route-optimization/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/saudi-manufacturing-predictive-maintenance/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/saudi-mining-ai-exploration/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/saudi-petrochemical-ai-safety/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/saudi-real-estate-ai-valuation/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/saudi-renewable-energy-ai/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/saudi-smart-city-traffic/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/saudi-sports-analytics-ai/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/saudi-tourism-ai-guide/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/saudi-waste-management-ai/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/smart-automation-benefits/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/smart-crm-system/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/smart-document-processing/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/smart-inventory-management/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/top-ai-tools-saudi-2025/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/transport-logistics-solutions/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/vision-2030-ai-opportunities/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| blog/workplace-automation-guide/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| bot/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| brightai_full_audit_report.md | Documentation/report markdown | none detected statically |
| case-studies/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| CNAME | Project support file | none detected statically |
| consultation/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| contact/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| data-analysis/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| demo/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| demo/ocr-demo/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| demo/pricing/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| demo/resources/report-ai-saudi-2026/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| docs.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| docs/ai-agent-en.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| docs/ai-agent.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| docs/ai-bots-en.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| docs/ai-bots.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| docs/consultation-en.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| docs/consultation.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| docs/contact-en.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| docs/contact.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| docs/data-analysis-en.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| docs/data-analysis.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| docs/examples/.env-2.example | Project support file | none detected statically |
| docs/faq-en.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| docs/faq.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| docs/ga4-key-events.md | Documentation/report markdown | none detected statically |
| docs/openapi.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| docs/openapi.yaml | Project support file | none detected statically |
| docs/privacy-policy-en.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| docs/privacy-policy-en/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| docs/privacy-policy.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| docs/seo-launch-checklist.md | Documentation/report markdown | none detected statically |
| docs/services-overview-en.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| docs/services-overview.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| docs/smart-automation-en.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| docs/smart-automation.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| docs/solutions-bi-en.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| docs/solutions-bi.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| docs/solutions-crm-en.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| docs/solutions-crm.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| docs/solutions-finance-en.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| docs/solutions-finance.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| docs/solutions-healthcare-en.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| docs/solutions-healthcare.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| docs/solutions-hr-en.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| docs/solutions-hr.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| docs/solutions-interview-en.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| docs/solutions-interview.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| docs/solutions-logistics-en.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| docs/solutions-logistics.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| docs/solutions-ocr-en.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| docs/solutions-ocr.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| docs/solutions-retail-en.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| docs/solutions-retail.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| docs/solutions-supply-chain-en.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| docs/solutions-supply-chain.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| docs/terms-and-conditions-en.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| docs/terms-and-conditions.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| en/about/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| en/ai-agent/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| en/ai-bots/BrightMath/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| en/ai-bots/BrightProject/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| en/ai-bots/BrightRecruiter/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| en/ai-bots/BrightSales/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| en/ai-bots/BrightSupport/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| en/ai-bots/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| en/ai-workflows/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| en/consultation/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| en/contact/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| en/data-analysis/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| en/docs/docs.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| en/docs/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| en/health/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| en/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| en/interview/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| en/privacy-cookies/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| en/services/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| en/smart-automation/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| en/smart-medical-archive/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| en/tenders/compare.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| en/tenders/dashboard.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| en/tenders/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| en/tenders/landing.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| en/tenders/reports.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| en/tenders/settings.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| en/tenders/templates.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| en/terms/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| en/tools/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| error.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| frontend/backend/package-lock.json | Node package manifest/lockfile | none detected statically |
| frontend/css/ai-scolecs-inline.min.css | Stylesheet asset | HTML link refs |
| frontend/css/bundle-critical.css | Stylesheet asset | HTML link refs |
| frontend/css/bundle-pages.css | Stylesheet asset | HTML link refs |
| frontend/css/cyber-wave.css | Stylesheet asset | HTML link refs |
| frontend/css/demo-experience.css | Stylesheet asset | HTML link refs |
| frontend/css/demo-theme.min.css | Stylesheet asset | HTML link refs |
| frontend/css/docs.css | Stylesheet asset | HTML link refs |
| frontend/css/en-interview-inline.min.css | Stylesheet asset | HTML link refs |
| frontend/css/en-tenders-templates-inline.min.css | Stylesheet asset | HTML link refs |
| frontend/css/fonts.css | Stylesheet asset | HTML link refs |
| frontend/css/health-demo.css | Stylesheet asset | HTML link refs |
| frontend/css/index-critical-overrides.css | Stylesheet asset | HTML link refs |
| frontend/css/index-critical-overrides.min.css | Stylesheet asset | HTML link refs |
| frontend/css/index-theme.css | Stylesheet asset | HTML link refs |
| frontend/css/index-theme.min.css | Stylesheet asset | HTML link refs |
| frontend/css/interview-inline.min.css | Stylesheet asset | HTML link refs |
| frontend/css/main.bundle.css | Stylesheet asset | HTML link refs |
| frontend/css/main.bundle.min.css | Stylesheet asset | HTML link refs |
| frontend/css/ocr-demo-theme.min.css | Stylesheet asset | HTML link refs |
| frontend/css/product-demo-polish.css | Stylesheet asset | HTML link refs |
| frontend/css/product-demo-polish.min.css | Stylesheet asset | HTML link refs |
| frontend/css/tailwind-input.css | Stylesheet asset | HTML link refs |
| frontend/css/tailwind.local.min.css | Stylesheet asset | HTML link refs |
| frontend/css/tenders-index-inline.min.css | Stylesheet asset | HTML link refs |
| frontend/css/try-data-analyzer-inline.css | Stylesheet asset | HTML link refs |
| frontend/css/try-data-quality-inline.css | Stylesheet asset | HTML link refs |
| frontend/css/try-inline.css | Stylesheet asset | HTML link refs |
| frontend/css/try-text-analysis-inline.css | Stylesheet asset | HTML link refs |
| frontend/css/unified-nav-search.css | Stylesheet asset | HTML link refs |
| frontend/css/vendor/aos.css | Stylesheet asset | HTML link refs |
| frontend/css/vendor/swiper-bundle.min.css | Stylesheet asset | HTML link refs |
| frontend/js/accessibility.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/accessibility.min.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/ai-scolecs-app.min.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/analytics-events.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/api-gateway.min.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/api-preflight.min.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/article-ux-enhancements.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/article-ux-enhancements.min.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/chat-widget.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/chatbot-production.bundle.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/clarity-events.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/data-analyzer.min.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/demo-experience.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/demo-stream.min.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/docs-scripts.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/en-interview-app.min.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/en-tenders-templates-app.min.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/gemini-direct-client.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/groq-client.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/health-demo.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/iconify-preload.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/index-theme.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/index-theme.min.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/interview-app.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/interview-app.min.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/main.bundle.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/main.bundle.min.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/navigation.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/navigation.min.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/ocr-demo.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/ocr-demo.min.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/optimization.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/page-enhancements.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/page-enhancements.min.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/performance-loader.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/performance-loader.min.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/pricing-recommender.min.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/product-demo-enhancements.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/product-demo-enhancements.min.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/runtime-config.min.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/schema-loader.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/search 2.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/search.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/search.min.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/sentry-init.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/tenders-index-app.min.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/tovik-loader.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/tovik-loader.min.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/try-data-analyzer-app.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/try-data-quality-app.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/try-text-analysis-app.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/vendor/aos.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/vendor/iconify-icon.min.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/vendor/iconify.min.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/js/vendor/swiper-bundle.min.js | Client-side JavaScript asset | browser DOM APIs |
| frontend/package.json | Node package manifest/lockfile | none detected statically |
| frontend/scripts/dev-server.mjs | Project support file | Node ESM |
| frontend/tests/smoke.test.mjs | Project support file | Node ESM |
| health/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| interview/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| interview/pages/appointment/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| interview/pages/dashboard/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| interview/pages/support-ai/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| interview/pages/supportAI/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| interview/pages/Visitor-registration/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| llms.txt | SEO crawler/search discovery file | none detected statically |
| lottie-logo.json | Project support file | none detected statically |
| machine-learning/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| mais-OBM/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| mais-OBM/OBM-DATA .xlsx | Project support file | none detected statically |
| manifest.json | Project support file | none detected statically |
| package-lock.json | Node package manifest/lockfile | none detected statically |
| package.json | Node package manifest/lockfile | none detected statically |
| partners/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| plugins/andrej-karpathy-skills/.codex-plugin/plugin.json | Codex/agent skill/plugin metadata | none detected statically |
| plugins/andrej-karpathy-skills/skills/karpathy-guidelines/agents/openai.yaml | Codex/agent skill/plugin metadata | none detected statically |
| plugins/andrej-karpathy-skills/skills/karpathy-guidelines/references/upstream-cursor-rule.mdc | Codex/agent skill/plugin metadata | none detected statically |
| plugins/andrej-karpathy-skills/skills/karpathy-guidelines/references/upstream-cursor.md | Codex/agent skill/plugin metadata | none detected statically |
| plugins/andrej-karpathy-skills/skills/karpathy-guidelines/references/upstream-examples.md | Codex/agent skill/plugin metadata | none detected statically |
| plugins/andrej-karpathy-skills/skills/karpathy-guidelines/references/upstream-plugin.json | Codex/agent skill/plugin metadata | none detected statically |
| plugins/andrej-karpathy-skills/skills/karpathy-guidelines/references/upstream-readme.md | Codex/agent skill/plugin metadata | none detected statically |
| plugins/andrej-karpathy-skills/skills/karpathy-guidelines/references/upstream-readme.zh.md | Codex/agent skill/plugin metadata | none detected statically |
| plugins/andrej-karpathy-skills/skills/karpathy-guidelines/references/upstream-SKILL.md | Codex/agent skill/plugin metadata | none detected statically |
| plugins/andrej-karpathy-skills/skills/karpathy-guidelines/SKILL.md | Codex/agent skill/plugin metadata | none detected statically |
| privacy-cookies/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| README.md | Documentation/report markdown | none detected statically |
| redirects.json | Project support file | none detected statically |
| render.yaml | Render deployment blueprint | none detected statically |
| reports/AUDIT_DEMOS.md | Generated audit/report artifact | none detected statically |
| reports/audit-report.md | Generated audit/report artifact | none detected statically |
| reports/blog-migration-map.json | Generated audit/report artifact | none detected statically |
| reports/blog-migration/blog-migration-map.json | Generated audit/report artifact | none detected statically |
| reports/blog-migration/blog-migration-map.md | Generated audit/report artifact | none detected statically |
| reports/blog-migration/seo-layer-fix-report.md | Generated audit/report artifact | none detected statically |
| reports/brightai_full_seo_ai_audit_2026-04-25.md | Generated audit/report artifact | none detected statically |
| reports/indexable-pages-final.txt | Generated audit/report artifact | none detected statically |
| reports/indexnow_submit.py | Generated audit/report artifact | none detected statically |
| reports/internal-links/broken_links_before.json | Generated audit/report artifact | none detected statically |
| reports/internal-links/broken_links_before.md | Generated audit/report artifact | none detected statically |
| reports/keyword-mapping-2026.md | Generated audit/report artifact | none detected statically |
| reports/keyword.md | Generated audit/report artifact | none detected statically |
| reports/keywords-eng.md | Generated audit/report artifact | none detected statically |
| reports/lighthouse-pr3/index-desktop.json | Generated audit/report artifact | none detected statically |
| reports/lighthouse-pr3/index-mobile.json | Generated audit/report artifact | none detected statically |
| reports/lighthouse-pr3/services-desktop.json | Generated audit/report artifact | none detected statically |
| reports/lighthouse-pr3/services-mobile.json | Generated audit/report artifact | none detected statically |
| reports/pr-2-summary.md | Generated audit/report artifact | none detected statically |
| reports/pr-3-performance-summary.md | Generated audit/report artifact | none detected statically |
| reports/prompts_orygnal.md | Generated audit/report artifact | none detected statically |
| reports/prompts.md | Generated audit/report artifact | none detected statically |
| reports/resource-paths/resource_paths_after.json | Generated audit/report artifact | none detected statically |
| reports/resource-paths/resource_paths_after.md | Generated audit/report artifact | none detected statically |
| reports/resource-paths/resource_paths_before.json | Generated audit/report artifact | none detected statically |
| reports/resource-paths/resource_paths_before.md | Generated audit/report artifact | none detected statically |
| reports/sitemap-quality-report.md | Generated audit/report artifact | none detected statically |
| robots.txt | SEO crawler/search discovery file | none detected statically |
| schema-saudi-seo.json | Project support file | none detected statically |
| scripts/analytics-qa.mjs | Build/SEO/audit automation script | Node ESM |
| scripts/apply-full-audit-seo-fixes.mjs | Build/SEO/audit automation script | Node ESM |
| scripts/apply-seo-intent-headings.mjs | Build/SEO/audit automation script | Node ESM |
| scripts/archive/d.py | Build/SEO/audit automation script | none detected statically |
| scripts/check-api-base-consistency.mjs | Build/SEO/audit automation script | Node ESM |
| scripts/check-performance-budget.js | Build/SEO/audit automation script | Node/CommonJS or browser JS by location |
| scripts/create-en-pages.mjs | Build/SEO/audit automation script | Node ESM |
| scripts/fix-internal-links.mjs | Build/SEO/audit automation script | Node ESM |
| scripts/fix-resource-paths.mjs | Build/SEO/audit automation script | Node ESM |
| scripts/generate-brightai-full-audit-report.mjs | Build/SEO/audit automation script | Node ESM |
| scripts/generate-related-articles.mjs | Build/SEO/audit automation script | Node ESM |
| scripts/generate-service-product-pages.mjs | Build/SEO/audit automation script | Node ESM |
| scripts/generate-sitemap-all-pages.mjs | Build/SEO/audit automation script | Node ESM |
| scripts/high-confidence-sitemap-config.mjs | Build/SEO/audit automation script | Node ESM |
| scripts/html-seo-governor.mjs | Build/SEO/audit automation script | Node ESM |
| scripts/indexnow-submit.mjs | Build/SEO/audit automation script | Node ESM |
| scripts/internal-links-audit.mjs | Build/SEO/audit automation script | Node ESM |
| scripts/internal-links-common.mjs | Build/SEO/audit automation script | Node ESM |
| scripts/local-secrets.mjs | Build/SEO/audit automation script | Node ESM |
| scripts/minify-seo-assets.mjs | Build/SEO/audit automation script | Node ESM |
| scripts/performance-budget.config.json | Build/SEO/audit automation script | none detected statically |
| scripts/ping-search-engines.mjs | Build/SEO/audit automation script | Node ESM |
| scripts/reorder_products.py | Build/SEO/audit automation script | none detected statically |
| scripts/replace-unminified-refs.mjs | Build/SEO/audit automation script | Node ESM |
| scripts/resource-paths-audit.mjs | Build/SEO/audit automation script | Node ESM |
| scripts/resource-paths-common.mjs | Build/SEO/audit automation script | Node ESM |
| scripts/run-monorepo-tests.mjs | Build/SEO/audit automation script | Node ESM |
| scripts/seo-ci-check.mjs | Build/SEO/audit automation script | Node ESM |
| scripts/seo-health-check.mjs | Build/SEO/audit automation script | Node ESM |
| scripts/seo-hreflang-dirs.sh | Build/SEO/audit automation script | none detected statically |
| scripts/seo-indexability-qa.mjs | Build/SEO/audit automation script | Node ESM |
| scripts/seo-intent-headings-qa.mjs | Build/SEO/audit automation script | Node ESM |
| scripts/seo-url-map.mjs | Build/SEO/audit automation script | Node ESM |
| scripts/sitemap-audit-utils.mjs | Build/SEO/audit automation script | Node ESM |
| scripts/smoke-test-api.mjs | Build/SEO/audit automation script | Node ESM |
| scripts/smoke-test.js | Build/SEO/audit automation script | Node/CommonJS or browser JS by location |
| scripts/submit-indexnow.mjs | Build/SEO/audit automation script | Node ESM |
| scripts/validate-production.js | Build/SEO/audit automation script | Node/CommonJS or browser JS by location |
| scripts/verify-all.mjs | Build/SEO/audit automation script | Node ESM |
| scripts/verify-clarity.mjs | Build/SEO/audit automation script | Node ESM |
| sectors/ecommerce-en.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| sectors/ecommerce-en/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| sectors/ecommerce.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| sectors/energy-en.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| sectors/energy-en/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| sectors/energy.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| sectors/finance-en.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| sectors/finance-en/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| sectors/finance.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| sectors/healthcare-en.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| sectors/healthcare-en/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| sectors/healthcare.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| sectors/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| sectors/logistics-en.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| sectors/logistics-en/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| sectors/logistics.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| sectors/manufacturing-en.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| sectors/manufacturing-en/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| sectors/manufacturing.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| services/ai-consulting.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| services/ai-scolecs.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| services/ai-scolecs/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| services/ai-tenders-analysis.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| services/ai-tenders-analysis/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| services/approvals-automation.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| services/brightproject.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| services/brightproject/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| services/brightsales.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| services/brightsales/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| services/competitor-analysis-agent.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| services/custom-ai-agent.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| services/customer-service-automation.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| services/data-analyst-agent.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| services/data-platform.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| services/document-automation.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| services/health-data-analysis.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| services/hr-automation.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| services/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| services/lead-hunter.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| services/marketing-agent.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| services/marketing-automation.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| services/medical-archive.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| services/operational-reports-automation.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| services/seo-agent.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| services/smart-hiring-system.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| services/smart-hospital-management.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| services/smart-hospital-management/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| services/social-data-analysis.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| services/supply-chain-optimization.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| sitemap.xml | SEO crawler/search discovery file | none detected statically |
| sitemap/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| skills-lock.json | Project support file | none detected statically |
| smart-automation/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| smart-medical-archive/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| smart-medical-archive/medical-dashboard.js | Project support file | Node/CommonJS or browser JS by location |
| smart-medical-archive/medical-extraction.js | Project support file | Node/CommonJS or browser JS by location |
| smart-medical-archive/medical-gemini-client.js | Project support file | Node/CommonJS or browser JS by location |
| smart-medical-archive/medical-search.js | Project support file | Node/CommonJS or browser JS by location |
| smart-medical-archive/medical-upload.js | Project support file | Node/CommonJS or browser JS by location |
| smart-medical-archive/smart-ai-logic.js | Project support file | Node/CommonJS or browser JS by location |
| smart-medical-archive/system-unified.css | Project support file | HTML link refs |
| smart-medical-archive/system-unified.js | Project support file | Node/CommonJS or browser JS by location |
| sw.js | Project support file | Node/CommonJS or browser JS by location |
| tailwind.config.cjs | Project support file | none detected statically |
| telegram-devto-bot/.env | Project support file | none detected statically |
| telegram-devto-bot/bot.py | Project support file | none detected statically |
| telegram-devto-bot/requirements.txt | Project support file | none detected statically |
| tenders/api-config.js | Project support file | Node/CommonJS or browser JS by location |
| tenders/api-config.min.js | Project support file | Node/CommonJS or browser JS by location |
| tenders/compare.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| tenders/dashboard.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| tenders/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| tenders/landing.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| tenders/render-backend/package.json | Node package manifest/lockfile | none detected statically |
| tenders/render-backend/README.md | Documentation/report markdown | none detected statically |
| tenders/render-backend/server 2.js | Project support file | Node/CommonJS or browser JS by location |
| tenders/render-backend/server.js | Project support file | Node/CommonJS or browser JS by location |
| tenders/reports.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| tenders/settings.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| tenders/templates.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| terms/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| tests/aiGateway.test.js | Project support file | Node/CommonJS or browser JS by location |
| tmp/blog-canonical-report.json | Generated audit/report artifact | none detected statically |
| tmp/blog-canonical-report.md | Generated audit/report artifact | none detected statically |
| tmp/brightai_html_seo_governor.json | Generated audit/report artifact | none detected statically |
| tmp/brightai_html_seo_governor.md | Generated audit/report artifact | none detected statically |
| tmp/brightai-seo-governor.json | Generated audit/report artifact | none detected statically |
| tmp/brightai-seo-governor.md | Generated audit/report artifact | none detected statically |
| tmp/hreflang-fix-report.json | Generated audit/report artifact | none detected statically |
| tmp/hreflang-fix-report.md | Generated audit/report artifact | none detected statically |
| tmp/html-seo.json | Generated audit/report artifact | none detected statically |
| tmp/semrush_issues_raw.json | Generated audit/report artifact | none detected statically |
| tmp/service-pages-html-seo-governor.json | Generated audit/report artifact | none detected statically |
| tmp/service-pages-html-seo-governor.md | Generated audit/report artifact | none detected statically |
| tmp/url_policy_after.json | Generated audit/report artifact | none detected statically |
| tmp/url_policy_after.md | Generated audit/report artifact | none detected statically |
| tmp/url_policy_report.json | Generated audit/report artifact | none detected statically |
| tmp/url_policy_report.md | Generated audit/report artifact | none detected statically |
| tools/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| try/data-analyzer/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| try/data-quality/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| try/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| try/text-analysis/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |
| vitest.config.js | Project support file | Node/CommonJS or browser JS by location |
| what-is-ai/index.html | Static page / route | linked CSS/JS/assets parsed in page inventory |

## Page Inventory
| Route | File | Lang/dir | Title | Canonical | Robots | In sitemap | CSS refs | JS refs | Images |
|---|---|---|---|---|---|---|---:|---:|---:|
| /404/ | 404.html | ar-SA/rtl | الصفحة غير موجودة \| Bright AI |  | index, follow | no | 2 | 7 | 0 |
| /500/ | 500.html | ar-SA/rtl | خطأ في الخادم \| Bright AI |  | index, follow | no | 6 | 9 | 0 |
| /about/ | about/index.html | ar-SA/rtl | شركة ذكاء اصطناعي وطنية في الرياض \| Bright AI | https://brightai.site/about/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 11 | 0 |
| /ai-agent/ | ai-agent/index.html | ar-SA/rtl | وكلاء ذكاء اصطناعي للمؤسسات في السعودية \| Bright AI | https://brightai.site/ai-agent/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 10 | 0 |
| /ai-bots/BrightMath/ | ai-bots/BrightMath/index.html | ar-SA/rtl | BrightMath - مساعد الرياضيات الذكي في السعودية \| Bright AI | https://brightai.site/ai-bots/BrightMath/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 14 | 0 |
| /ai-bots/BrightProject/ | ai-bots/BrightProject/index.html | ar-SA/rtl | BrightProject - روبوت إدارة المشاريع الذكي في السعودية \| Bright AI | https://brightai.site/ai-bots/BrightProject/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 14 | 0 |
| /ai-bots/BrightRecruiter/ | ai-bots/BrightRecruiter/index.html | ar-SA/rtl | BrightRecruiter - روبوت التوظيف الذكي في السعودية \| Bright AI | https://brightai.site/ai-bots/BrightRecruiter/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 6 | 13 | 0 |
| /ai-bots/BrightSales/ | ai-bots/BrightSales/index.html | ar-SA/rtl | BrightSales - روبوت المبيعات الذكي في السعودية \| Bright AI | https://brightai.site/ai-bots/BrightSales/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 14 | 0 |
| /ai-bots/BrightSupport/ | ai-bots/BrightSupport/index.html | ar-SA/rtl | BrightSupport - روبوت خدمة العملاء الذكي في السعودية \| Bright AI | https://brightai.site/ai-bots/BrightSupport/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 14 | 0 |
| /ai-bots/ | ai-bots/index.html | ar-SA/rtl | روبوتات ذكاء اصطناعي جاهزة للشركات السعودية \| Bright AI | https://brightai.site/ai-bots/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 2 | 3 | 0 |
| /ai-scolecs/ | ai-scolecs/index.html | ar-SA/rtl | المنصة التعليمية الذكية في السعودية \| Bright AI | https://brightai.site/ai-scolecs/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 6 | 15 | 0 |
| /ai-workflows/ | ai-workflows/index.html | ar-SA/rtl | أتمتة سير العمل في السعودية \| Bright AI | https://brightai.site/ai-workflows/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 11 | 0 |
| /blog/ai-agents-business-guide/ | blog/ai-agents-business-guide/index.html | ar-SA/rtl | دليل وكلاء الذكاء الاصطناعي: كيف تستخدمها لشركتك: شرح عملي \| Bright AI | https://brightai.site/blog/ai-agents-business-guide/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 11 | 1 |
| /blog/ai-automation-project-analysis/ | blog/ai-automation-project-analysis/index.html | ar-SA/rtl | أتمتة الذكاء الاصطناعي: حلول مخصصة لتحليل المشاريع وتحسين | https://brightai.site/blog/ai-automation-project-analysis/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 11 | 1 |
| /blog/ai-business-performance/ | blog/ai-business-performance/index.html | ar-SA/rtl | كيف يمكن للذكاء الاصطناعي تحسين أداء الشركات: شرح عملي \| Bright AI | https://brightai.site/blog/ai-business-performance/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 11 | 1 |
| /blog/ai-data-analysis-tools/ | blog/ai-data-analysis-tools/index.html | ar-SA/rtl | كيف تغيّر الذكاء الاصطناعي مستقبل تحليل البيانات: الأدوات: شرح عملي \| Bright AI | https://brightai.site/blog/ai-data-analysis-tools/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 11 | 1 |
| /blog/ai-energy-saudi/ | blog/ai-energy-saudi/index.html | ar-SA/rtl | الذكاء الاصطناعي في قطاع الطاقة السعودي - كفاءة أعلى: شرح عملي \| Bright AI | https://brightai.site/blog/ai-energy-saudi/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 10 | 0 |
| /blog/ai-finance-saudi/ | blog/ai-finance-saudi/index.html | ar-SA/rtl | الذكاء الاصطناعي للقطاع المالي السعودي - مصرفية أذكى: شرح عملي \| Bright AI | https://brightai.site/blog/ai-finance-saudi/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 10 | 0 |
| /blog/ai-generative-content-industry-saudi-arabia/ | blog/ai-generative-content-industry-saudi-arabia/index.html | ar-SA/rtl | تأثير الذكاء الاصطناعي التوليدي على صناعة المحتوى في: شرح عملي \| Bright AI | https://brightai.site/blog/ai-generative-content-industry-saudi-arabia/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 11 | 1 |
| /blog/ai-guide-saudi-business/ | blog/ai-guide-saudi-business/index.html | ar-SA/rtl | دليل الذكاء الاصطناعي للمبتدئين لرجال الأعمال \| Bright AI | https://brightai.site/blog/ai-guide-saudi-business/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 1 | 10 | 0 |
| /blog/ai-healthcare-saudi/ | blog/ai-healthcare-saudi/index.html | ar-SA/rtl | الذكاء الاصطناعي في القطاع الصحي السعودي: تشخيص: شرح عملي \| Bright AI | https://brightai.site/blog/ai-healthcare-saudi/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 10 | 1 |
| /blog/ai-implementation-cost-guide/ | blog/ai-implementation-cost-guide/index.html | ar-SA/rtl | تكلفة تطبيق الذكاء الاصطناعي في شركتك — دليل \| Bright AI | https://brightai.site/blog/ai-implementation-cost-guide/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 1 | 10 | 0 |
| /blog/ai-innovation-saudi-arabia/ | blog/ai-innovation-saudi-arabia/index.html | ar-SA/rtl | 5 طرق لتعزيز الابتكار من خلال الذكاء الاصطناعي في السعودية: شرح عملي \| Bright AI | https://brightai.site/blog/ai-innovation-saudi-arabia/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 11 | 1 |
| /blog/ai-manufacturing-digital-guide/ | blog/ai-manufacturing-digital-guide/index.html | ar-SA/rtl | الدليل الشامل لتطبيق الذكاء الاصطناعي في المصانع: خطة عملية | https://brightai.site/blog/ai-manufacturing-digital-guide/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 11 | 1 |
| /blog/ai-marketing-guide/ | blog/ai-marketing-guide/index.html | ar-SA/rtl | الذكاء الاصطناعي في التسويق: شرح عملي \| Bright AI | https://brightai.site/blog/ai-marketing-guide/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 11 | 1 |
| /blog/ai-transformation/ | blog/ai-transformation/index.html | ar-SA/rtl | كيف تُحدث حلول الذكاء الاصطناعي المبتكرة تحولًا في الأعمال: شرح عملي \| Bright AI | https://brightai.site/blog/ai-transformation/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 11 | 1 |
| /blog/big-data-analysis/ | blog/big-data-analysis/index.html | ar-SA/rtl | تحليل البيانات الضخمة للأعمال: شرح عملي \| Bright AI | https://brightai.site/blog/big-data-analysis/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 11 | 1 |
| /blog/building-ai-agents-guide/ | blog/building-ai-agents-guide/index.html | ar-SA/rtl | الدليل الشامل لبناء وكلاء الذكاء الاصطناعي \| Bright AI | https://brightai.site/blog/building-ai-agents-guide/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 11 | 1 |
| /blog/building-ai-agents-practical-guide/ | blog/building-ai-agents-practical-guide/index.html | ar-SA/rtl | الدليل الشامل لبناء وكلاء الذكاء الاصطناعي: شرح عملي \| Bright AI | https://brightai.site/blog/building-ai-agents-practical-guide/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 11 | 1 |
| /blog/business-intelligence-data-analysis/ | blog/business-intelligence-data-analysis/index.html | ar-SA/rtl | ذكاء الاعمال: قوة تحليل البيانات لتحسين الأداء: شرح عملي \| Bright AI | https://brightai.site/blog/business-intelligence-data-analysis/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 11 | 1 |
| /blog/business-intelligence-saudi/ | blog/business-intelligence-saudi/index.html | ar-SA/rtl | ذكاء الأعمال BI في السعودية: شرح عملي \| Bright AI | https://brightai.site/blog/business-intelligence-saudi/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 11 | 1 |
| /blog/case-study-saudi-companies-ai-agents-customer-service/ | blog/case-study-saudi-companies-ai-agents-customer-service/index.html | ar-SA/rtl | دراسة حالة: كيف تستخدم الشركات السعودية وكلاء الذكاء \| Bright AI | https://brightai.site/blog/case-study-saudi-companies-ai-agents-customer-service/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 11 | 1 |
| /blog/chatgpt-vs-claude-vs-gemini-arabic/ | blog/chatgpt-vs-claude-vs-gemini-arabic/index.html | ar-SA/rtl | مقارنة ChatGPT vs Claude vs Gemini للشركات: شرح عملي \| Bright AI | https://brightai.site/blog/chatgpt-vs-claude-vs-gemini-arabic/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 1 | 10 | 0 |
| /blog/choose-ai-company-saudi/ | blog/choose-ai-company-saudi/index.html | ar-SA/rtl | كيف تختار شركة الذكاء الاصطناعي المناسبة في: شرح عملي \| Bright AI | https://brightai.site/blog/choose-ai-company-saudi/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 2 | 10 | 0 |
| /blog/claude-opus-4-6-saudi-market/ | blog/claude-opus-4-6-saudi-market/index.html | ar-SA/rtl | Cloud Opus 4.6 في السوق السعودي: شرح عملي \| Bright AI | https://brightai.site/blog/claude-opus-4-6-saudi-market/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 11 | 0 |
| /blog/commerce-ministry-chatbot/ | blog/commerce-ministry-chatbot/index.html | ar-SA/rtl | دراسة حالة: وزارة التجارة - شات بوت ذكي يخدم 50,000 تاجر: شرح عملي \| Bright AI | https://brightai.site/blog/commerce-ministry-chatbot/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 10 | 0 |
| /blog/data-analysis-best-practices/ | blog/data-analysis-best-practices/index.html | ar-SA/rtl | أفضل الممارسات لتحليل البيانات: تحويل البيانات \| Bright AI | https://brightai.site/blog/data-analysis-best-practices/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 11 | 1 |
| /blog/data-analysis-decision-making/ | blog/data-analysis-decision-making/index.html | ar-SA/rtl | تحليل البيانات لاتخاذ القرار: شرح عملي \| Bright AI | https://brightai.site/blog/data-analysis-decision-making/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 11 | 1 |
| /blog/digital-banking-saudi/ | blog/digital-banking-saudi/index.html | ar-SA/rtl | الخدمات المصرفية الرقمية في السعودية: شرح عملي \| Bright AI | https://brightai.site/blog/digital-banking-saudi/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 11 | 1 |
| /blog/digital-health-smart-archive/ | blog/digital-health-smart-archive/index.html | ar-SA/rtl | تطبيقات الصحة الرقمية والأرشفة الطبية الذكية في: شرح عملي \| Bright AI | https://brightai.site/blog/digital-health-smart-archive/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 11 | 1 |
| /blog/digital-transformation-automation/ | blog/digital-transformation-automation/index.html | ar-SA/rtl | التحول الرقمي وأتمتة العمليات للشركات السعودية \| Bright AI | https://brightai.site/blog/digital-transformation-automation/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 11 | 1 |
| /blog/financial-hr-automation/ | blog/financial-hr-automation/index.html | ar-SA/rtl | الأتمتة المالية والموارد البشرية في السعودية \| Bright AI | https://brightai.site/blog/financial-hr-automation/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 11 | 1 |
| /blog/future-of-intelligent-data-analysis-finance-sector/ | blog/future-of-intelligent-data-analysis-finance-sector/index.html | ar-SA/rtl | التحليل الذكي للقطاع المالي: شرح عملي \| Bright AI | https://brightai.site/blog/future-of-intelligent-data-analysis-finance-sector/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 11 | 1 |
| /blog/generative-artificial-intelligence/ | blog/generative-artificial-intelligence/index.html | ar-SA/rtl | الذكاء الاصطناعي التوليدي: ثورة في عالم الإبداع: شرح عملي \| Bright AI | https://brightai.site/blog/generative-artificial-intelligence/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 11 | 1 |
| /blog/government-ai-solutions-saudi/ | blog/government-ai-solutions-saudi/index.html | ar-SA/rtl | حلول الذكاء الاصطناعي للقطاع الحكومي في السعودية - دليل: شرح عملي \| Bright AI | https://brightai.site/blog/government-ai-solutions-saudi/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 11 | 0 |
| /blog/government-ai-solutions/ | blog/government-ai-solutions/index.html | ar-SA/rtl | حلول الذكاء الاصطناعي للقطاع الحكومي في السعودية \| دليل | https://brightai.site/blog/government-ai-solutions/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 11 | 0 |
| /blog/hr-automation-case-study/ | blog/hr-automation-case-study/index.html | ar-SA/rtl | الأتمتة الذكية للموارد البشرية: كيف وفّرت شركة \| Bright AI | https://brightai.site/blog/hr-automation-case-study/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 2 | 10 | 0 |
| /blog/hr-automation-saudi/ | blog/hr-automation-saudi/index.html | ar-SA/rtl | أتمتة الموارد البشرية: وفر 60% من وقت فريقك: شرح عملي \| Bright AI | https://brightai.site/blog/hr-automation-saudi/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 9 | 1 |
| /blog/ | blog/index.html | ar-SA/rtl | مدونة الذكاء الاصطناعي والأتمتة في السعودية: شرح عملي \| Bright AI | https://brightai.site/blog/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 3 | 11 | 0 |
| /blog/industrial-automation-productivity/ | blog/industrial-automation-productivity/index.html | ar-SA/rtl | الأتمتة الصناعية وأتمتة المهام المتكررة: كيفية تحسين الكفاءة الإنتاجية \| Bright AI | https://brightai.site/blog/industrial-automation-productivity/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 11 | 1 |
| /blog/industrial-automation-repetitive-tasks/ | blog/industrial-automation-repetitive-tasks/index.html | ar-SA/rtl | الأتمتة الصناعية وأتمتة المهام المتكررة: كيفية - atou job | https://brightai.site/blog/industrial-automation-repetitive-tasks/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 11 | 1 |
| /blog/intelligent-data-analysis/ | blog/intelligent-data-analysis/index.html | ar-SA/rtl | دليل شامل لتحليل البيانات الذكي: تحويل المعلومات إلى قرارات: شرح عملي \| Bright AI | https://brightai.site/blog/intelligent-data-analysis/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 11 | 1 |
| /blog/kfshrc-breast-cancer-ai/ | blog/kfshrc-breast-cancer-ai/index.html | ar-SA/rtl | دراسة حالة: مستشفى الملك فيصل التخصصي - الذكاء الاصطناعي: شرح عملي \| Bright AI | https://brightai.site/blog/kfshrc-breast-cancer-ai/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 10 | 0 |
| /blog/kpi-dashboard-guide/ | blog/kpi-dashboard-guide/index.html | ar-SA/rtl | كيف تبني لوحة معلومات KPIs لمنشأتك خطوة بخطوة \| Bright AI | https://brightai.site/blog/kpi-dashboard-guide/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 3 | 9 | 1 |
| /blog/ksu-adaptive-learning/ | blog/ksu-adaptive-learning/index.html | ar-SA/rtl | دراسة حالة: جامعة الملك سعود - منصة تعلم تكيفي ترفع معدلات: شرح عملي \| Bright AI | https://brightai.site/blog/ksu-adaptive-learning/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 10 | 0 |
| /blog/machine-learning-business/ | blog/machine-learning-business/index.html | ar-SA/rtl | تعلم الآلة للأعمال في السعودية \| Bright AI | https://brightai.site/blog/machine-learning-business/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 11 | 1 |
| /blog/machine-learning-computer-vision/ | blog/machine-learning-computer-vision/index.html | ar-SA/rtl | التعلم الآلي والرؤية الحاسوبية للأعمال \| Bright AI | https://brightai.site/blog/machine-learning-computer-vision/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 11 | 1 |
| /blog/nca-ai-compliance-saudi/ | blog/nca-ai-compliance-saudi/index.html | ar-SA/rtl | الامتثال لـ NCA ومتطلبات AI في السعودية: شرح عملي \| Bright AI | https://brightai.site/blog/nca-ai-compliance-saudi/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 2 | 10 | 0 |
| /blog/nca-compliance/ | blog/nca-compliance/index.html | ar-SA/rtl | الامتثال لمعايير الأمن السيبراني (NCA) في السعودية - الدليل: شرح عملي \| Bright AI | https://brightai.site/blog/nca-compliance/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 11 | 0 |
| /blog/power-bi-saudi-guide/ | blog/power-bi-saudi-guide/index.html | ar-SA/rtl | Power BI للشركات السعودية: دليل البداية الشامل \| Bright AI | https://brightai.site/blog/power-bi-saudi-guide/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 9 | 1 |
| /blog/private-hospital-scheduling-optimization/ | blog/private-hospital-scheduling-optimization/index.html | ar-SA/rtl | دراسة حالة: مجموعة صحية خاصة - تقليل أوقات الانتظار بنسبة: شرح عملي \| Bright AI | https://brightai.site/blog/private-hospital-scheduling-optimization/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 10 | 0 |
| /blog/process-automation-ai-efficiency/ | blog/process-automation-ai-efficiency/index.html | ar-SA/rtl | تحسين الكفاءة التشغيلية بأتمتة العمليات \| Bright AI | https://brightai.site/blog/process-automation-ai-efficiency/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 11 | 1 |
| /blog/process-automation/ | blog/process-automation/index.html | ar-SA/rtl | أتمتة العمليات: تحويل المهام الروتينية إلى عمليات مؤتمتة: شرح عملي \| Bright AI | https://brightai.site/blog/process-automation/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 11 | 1 |
| /blog/riyadh-municipality-ai-license/ | blog/riyadh-municipality-ai-license/index.html | ar-SA/rtl | دراسة حالة: كيف خفّضت بلدية الرياض وقت التراخيص 70% بالذكاء: شرح عملي \| Bright AI | https://brightai.site/blog/riyadh-municipality-ai-license/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 10 | 0 |
| /blog/saudi-agritech-smart-farming/ | blog/saudi-agritech-smart-farming/index.html | ar-SA/rtl | دراسة حالة شاملة: الزراعة الذكية في السعودية - توفير المياه: شرح عملي \| Bright AI | https://brightai.site/blog/saudi-agritech-smart-farming/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 10 | 0 |
| /blog/saudi-bank-fraud-detection/ | blog/saudi-bank-fraud-detection/index.html | ar-SA/rtl | دراسة حالة: بنك سعودي - كشف 95% من محاولات الاحتيال بالذكاء: شرح عملي \| Bright AI | https://brightai.site/blog/saudi-bank-fraud-detection/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 10 | 0 |
| /blog/saudi-dates-quality-ai/ | blog/saudi-dates-quality-ai/index.html | ar-SA/rtl | دراسة حالة شاملة: الذكاء الاصطناعي في جودة التمور السعودية: شرح عملي \| Bright AI | https://brightai.site/blog/saudi-dates-quality-ai/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 10 | 0 |
| /blog/saudi-ecommerce-ai-growth/ | blog/saudi-ecommerce-ai-growth/index.html | ar-SA/rtl | دراسة حالة شاملة: الذكاء الاصطناعي في التجارة الإلكترونية: شرح عملي \| Bright AI | https://brightai.site/blog/saudi-ecommerce-ai-growth/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 10 | 0 |
| /blog/saudi-edtech-personalized-learning/ | blog/saudi-edtech-personalized-learning/index.html | ar-SA/rtl | دراسة حالة: منصة تعليمية سعودية - تخصيص مسارات التعلم لـ: شرح عملي \| Bright AI | https://brightai.site/blog/saudi-edtech-personalized-learning/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 10 | 0 |
| /blog/saudi-energy-predictive-maintenance/ | blog/saudi-energy-predictive-maintenance/index.html | ar-SA/rtl | دراسة حالة: شركة طاقة سعودية - توفير 40 مليون ريال سنوياً: شرح عملي \| Bright AI | https://brightai.site/blog/saudi-energy-predictive-maintenance/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 10 | 0 |
| /blog/saudi-factory-ai-productivity/ | blog/saudi-factory-ai-productivity/index.html | ar-SA/rtl | دراسة حالة: مصنع سعودي - رفع الإنتاجية 30% بتحليلات الذكاء: شرح عملي \| Bright AI | https://brightai.site/blog/saudi-factory-ai-productivity/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 10 | 0 |
| /blog/saudi-hospitality-dynamic-pricing/ | blog/saudi-hospitality-dynamic-pricing/index.html | ar-SA/rtl | دراسة حالة: مجموعة فنادق سعودية - زيادة الإشغال 20%: شرح عملي \| Bright AI | https://brightai.site/blog/saudi-hospitality-dynamic-pricing/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 10 | 0 |
| /blog/saudi-insurance-claims-ai/ | blog/saudi-insurance-claims-ai/index.html | ar-SA/rtl | دراسة حالة شاملة: الذكاء الاصطناعي في التأمين السعودي - كشف: شرح عملي \| Bright AI | https://brightai.site/blog/saudi-insurance-claims-ai/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 10 | 0 |
| /blog/saudi-logistics-route-optimization/ | blog/saudi-logistics-route-optimization/index.html | ar-SA/rtl | دراسة حالة شاملة: الذكاء الاصطناعي في اللوجستيات السعودية -: شرح عملي \| Bright AI | https://brightai.site/blog/saudi-logistics-route-optimization/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 10 | 0 |
| /blog/saudi-manufacturing-predictive-maintenance/ | blog/saudi-manufacturing-predictive-maintenance/index.html | ar-SA/rtl | دراسة حالة شاملة: الذكاء الاصطناعي في الصناعة السعودية -: شرح عملي \| Bright AI | https://brightai.site/blog/saudi-manufacturing-predictive-maintenance/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 10 | 0 |
| /blog/saudi-mining-ai-exploration/ | blog/saudi-mining-ai-exploration/index.html | ar-SA/rtl | دراسة حالة شاملة: الذكاء الاصطناعي في التعدين السعودي - كنز: شرح عملي \| Bright AI | https://brightai.site/blog/saudi-mining-ai-exploration/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 10 | 0 |
| /blog/saudi-petrochemical-ai-safety/ | blog/saudi-petrochemical-ai-safety/index.html | ar-SA/rtl | دراسة حالة شاملة: الذكاء الاصطناعي في البتروكيماويات: شرح عملي \| Bright AI | https://brightai.site/blog/saudi-petrochemical-ai-safety/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 10 | 0 |
| /blog/saudi-real-estate-ai-valuation/ | blog/saudi-real-estate-ai-valuation/index.html | ar-SA/rtl | دراسة حالة شاملة: الذكاء الاصطناعي في العقارات السعودية -: شرح عملي \| Bright AI | https://brightai.site/blog/saudi-real-estate-ai-valuation/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 10 | 0 |
| /blog/saudi-renewable-energy-ai/ | blog/saudi-renewable-energy-ai/index.html | ar-SA/rtl | دراسة حالة شاملة: الذكاء الاصطناعي في الطاقة المتجددة: شرح عملي \| Bright AI | https://brightai.site/blog/saudi-renewable-energy-ai/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 10 | 0 |
| /blog/saudi-smart-city-traffic/ | blog/saudi-smart-city-traffic/index.html | ar-SA/rtl | دراسة حالة شاملة: الرياض تقلل الازدحام 30%: شرح عملي \| Bright AI | https://brightai.site/blog/saudi-smart-city-traffic/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 10 | 0 |
| /blog/saudi-sports-analytics-ai/ | blog/saudi-sports-analytics-ai/index.html | ar-SA/rtl | دراسة حالة شاملة: الذكاء الاصطناعي في الرياضة السعودية -: شرح عملي \| Bright AI | https://brightai.site/blog/saudi-sports-analytics-ai/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 10 | 0 |
| /blog/saudi-tourism-ai-guide/ | blog/saudi-tourism-ai-guide/index.html | ar-SA/rtl | دراسة حالة شاملة: الذكاء الاصطناعي في السياحة السعودية - \| Bright AI | https://brightai.site/blog/saudi-tourism-ai-guide/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 10 | 0 |
| /blog/saudi-waste-management-ai/ | blog/saudi-waste-management-ai/index.html | ar-SA/rtl | دراسة حالة شاملة: إدارة النفايات بالذكاء الاصطناعي في: شرح عملي \| Bright AI | https://brightai.site/blog/saudi-waste-management-ai/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 10 | 0 |
| /blog/smart-automation-benefits/ | blog/smart-automation-benefits/index.html | ar-SA/rtl | فوائد الأتمتة الذكية للشركات: شرح عملي \| Bright AI | https://brightai.site/blog/smart-automation-benefits/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 12 | 1 |
| /blog/smart-crm-system/ | blog/smart-crm-system/index.html | ar-SA/rtl | نظام CRM ذكي بالذكاء الاصطناعي في السعودية: شرح عملي \| Bright AI | https://brightai.site/blog/smart-crm-system/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 11 | 1 |
| /blog/smart-document-processing/ | blog/smart-document-processing/index.html | ar-SA/rtl | معالجة المستندات الذكية OCR في السعودية: شرح عملي \| Bright AI | https://brightai.site/blog/smart-document-processing/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 11 | 1 |
| /blog/smart-inventory-management/ | blog/smart-inventory-management/index.html | ar-SA/rtl | إدارة المخزون الذكية بالذكاء الاصطناعي: شرح عملي \| Bright AI | https://brightai.site/blog/smart-inventory-management/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 11 | 1 |
| /blog/top-ai-tools-saudi-2025/ | blog/top-ai-tools-saudi-2025/index.html | ar-SA/rtl | أفضل 10 أدوات ذكاء اصطناعي للشركات السعودية 2025: شرح عملي \| Bright AI | https://brightai.site/blog/top-ai-tools-saudi-2025/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 1 | 10 | 0 |
| /blog/transport-logistics-solutions/ | blog/transport-logistics-solutions/index.html | ar-SA/rtl | حلول النقل واللوجستيات الذكية في السعودية: شرح عملي \| Bright AI | https://brightai.site/blog/transport-logistics-solutions/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 11 | 1 |
| /blog/vision-2030-ai-opportunities/ | blog/vision-2030-ai-opportunities/index.html | ar-SA/rtl | رؤية 2030 والذكاء الاصطناعي: فرص الشركات \| Bright AI | https://brightai.site/blog/vision-2030-ai-opportunities/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 3 | 10 | 0 |
| /blog/workplace-automation-guide/ | blog/workplace-automation-guide/index.html | ar-SA/rtl | الأتمتة في مكان العمل: كيف تبدأ؟ \| Bright AI | https://brightai.site/blog/workplace-automation-guide/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 11 | 1 |
| /bot/ | bot/index.html | ar-SA/rtl | Bright AI – مساعد العملاء | https://brightai.site/bot/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 1 | 2 | 0 |
| /case-studies/ | case-studies/index.html | ar-SA/rtl | دراسات حالة الذكاء الاصطناعي في السعودية \| Bright AI | https://brightai.site/case-studies/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 2 | 7 | 0 |
| /consultation/ | consultation/index.html | ar-SA/rtl | استشارات الذكاء الاصطناعي السعودية \| Bright AI | https://brightai.site/consultation/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 10 | 0 |
| /contact/ | contact/index.html | ar-SA/rtl | تواصل مع شركة ذكاء اصطناعي في السعودية \| Bright AI | https://brightai.site/contact/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 12 | 0 |
| /data-analysis/ | data-analysis/index.html | ar-SA/rtl | تحليل البيانات للشركات السعودية \| Bright AI | https://brightai.site/data-analysis/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 11 | 4 |
| /demo/ | demo/index.html | ar-SA/rtl | ديمو حلول الذكاء الاصطناعي \| Bright AI | https://brightai.site/demo/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 10 | 1 |
| /demo/ocr-demo/ | demo/ocr-demo/index.html | ar-SA/rtl | OCR عربي بالذكاء الاصطناعي \| Bright AI | https://brightai.site/demo/ocr-demo/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 10 | 1 |
| /demo/pricing/ | demo/pricing/index.html | ar-SA/rtl | أسعار حلول الذكاء الاصطناعي \| Bright AI | https://brightai.site/demo/pricing/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 11 | 1 |
| /demo/resources/report-ai-saudi-2026/ | demo/resources/report-ai-saudi-2026/index.html | ar-SA/rtl | تقرير الذكاء الاصطناعي في السعودية 2026 \| Bright AI | https://brightai.site/demo/resources/report-ai-saudi-2026/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 10 | 1 |
| /docs/ | docs.html | ar-SA/rtl | مركز وثائق BrightAI للشركات السعودية | https://brightai.site/docs/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 7 | 0 |
| /docs/ai-agent-en/ | docs/ai-agent-en.html | en-SA/ltr | AI Agents for Saudi Enterprises \| BrightAI | https://brightai.site/docs/ai-agent-en/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 6 | 10 | 0 |
| /docs/ai-agent/ | docs/ai-agent.html | ar-SA/rtl | دليل وكلاء الذكاء الاصطناعي للشركات السعودية \| BrightAI | https://brightai.site/docs/ai-agent/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 6 | 10 | 0 |
| /docs/ai-bots-en/ | docs/ai-bots-en.html | en-SA/ltr | Arabic AI Chatbots for Saudi Teams \| BrightAI | https://brightai.site/docs/ai-bots-en/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 10 | 0 |
| /docs/ai-bots/ | docs/ai-bots.html | ar-SA/rtl | دليل الشات بوت العربي للشركات \| BrightAI | https://brightai.site/docs/ai-bots/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 10 | 0 |
| /docs/consultation-en/ | docs/consultation-en.html | en-SA/ltr | AI Consulting for Saudi Enterprises \| BrightAI | https://brightai.site/docs/consultation-en/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 10 | 0 |
| /docs/consultation/ | docs/consultation.html | ar-SA/rtl | دليل استشارات الذكاء الاصطناعي في السعودية \| BrightAI | https://brightai.site/docs/consultation/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 6 | 10 | 0 |
| /docs/contact-en/ | docs/contact-en.html | en-SA/ltr | BrightAI Contact and Support \| BrightAI | https://brightai.site/docs/contact-en/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 2 | 10 | 0 |
| /docs/contact/ | docs/contact.html | ar-SA/rtl | دليل التواصل والدعم في BrightAI \| BrightAI | https://brightai.site/docs/contact/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 2 | 10 | 0 |
| /docs/data-analysis-en/ | docs/data-analysis-en.html | en-SA/ltr | Data Analysis for Saudi Teams \| BrightAI | https://brightai.site/docs/data-analysis-en/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 10 | 0 |
| /docs/data-analysis/ | docs/data-analysis.html | ar-SA/rtl | دليل تحليل البيانات للشركات السعودية \| BrightAI | https://brightai.site/docs/data-analysis/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 10 | 0 |
| /docs/faq-en/ | docs/faq-en.html | en-SA/ltr | BrightAI FAQ \| BrightAI | https://brightai.site/docs/faq-en/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 2 | 10 | 0 |
| /docs/faq/ | docs/faq.html | ar-SA/rtl | الأسئلة الشائعة عن BrightAI \| BrightAI | https://brightai.site/docs/faq/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 6 | 10 | 0 |
| /docs/openapi/ | docs/openapi.html | ar-SA/rtl | مرجع OpenAPI لمطوري BrightAI \| BrightAI | https://brightai.site/docs/openapi/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 2 | 9 | 0 |
| /docs/privacy-policy-en/ | docs/privacy-policy-en.html | en-SA/ltr | BrightAI Privacy Policy \| BrightAI | https://brightai.site/docs/privacy-policy-en/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 2 | 10 | 0 |
| /docs/privacy-policy-en/ | docs/privacy-policy-en/index.html | en-SA/ltr | BrightAI Privacy Policy for Saudi Users | https://brightai.site/docs/privacy-policy-en/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 2 | 10 | 0 |
| /docs/privacy-policy/ | docs/privacy-policy.html | ar-SA/rtl | سياسة الخصوصية في BrightAI \| BrightAI | https://brightai.site/docs/privacy-policy/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 2 | 10 | 0 |
| /docs/services-overview-en/ | docs/services-overview-en.html | en-SA/ltr | BrightAI Services Overview \| BrightAI | https://brightai.site/docs/services-overview-en/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 2 | 10 | 0 |
| /docs/services-overview/ | docs/services-overview.html | ar-SA/rtl | دليل خدمات BrightAI للشركات \| BrightAI | https://brightai.site/docs/services-overview/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 6 | 10 | 0 |
| /docs/smart-automation-en/ | docs/smart-automation-en.html | en-SA/ltr | AI Business Automation Guide \| BrightAI | https://brightai.site/docs/smart-automation-en/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 10 | 0 |
| /docs/smart-automation/ | docs/smart-automation.html | ar-SA/rtl | دليل أتمتة الأعمال بالذكاء الاصطناعي \| BrightAI | https://brightai.site/docs/smart-automation/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 6 | 10 | 0 |
| /docs/solutions-bi-en/ | docs/solutions-bi-en.html | en-SA/ltr | Business Intelligence Documentation \| BrightAI | https://brightai.site/docs/solutions-bi-en/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 10 | 0 |
| /docs/solutions-bi/ | docs/solutions-bi.html | ar-SA/rtl | دليل ذكاء الأعمال ولوحات البيانات \| BrightAI | https://brightai.site/docs/solutions-bi/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 7 | 10 | 0 |
| /docs/solutions-crm-en/ | docs/solutions-crm-en.html | en-SA/ltr | CRM and Customer Intelligence Documentation \| BrightAI | https://brightai.site/docs/solutions-crm-en/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 10 | 0 |
| /docs/solutions-crm/ | docs/solutions-crm.html | ar-SA/rtl | دليل CRM الذكي وخدمة العملاء \| BrightAI | https://brightai.site/docs/solutions-crm/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 6 | 10 | 0 |
| /docs/solutions-finance-en/ | docs/solutions-finance-en.html | en-SA/ltr | Finance AI Solutions Documentation \| BrightAI | https://brightai.site/docs/solutions-finance-en/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 10 | 0 |
| /docs/solutions-finance/ | docs/solutions-finance.html | ar-SA/rtl | دليل حلول الذكاء الاصطناعي للقطاع المالي \| BrightAI | https://brightai.site/docs/solutions-finance/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 6 | 10 | 0 |
| /docs/solutions-healthcare-en/ | docs/solutions-healthcare-en.html | en-SA/ltr | Healthcare AI Solutions Documentation \| BrightAI | https://brightai.site/docs/solutions-healthcare-en/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 10 | 0 |
| /docs/solutions-healthcare/ | docs/solutions-healthcare.html | ar-SA/rtl | دليل حلول الذكاء الاصطناعي للرعاية الصحية \| BrightAI | https://brightai.site/docs/solutions-healthcare/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 6 | 10 | 0 |
| /docs/solutions-hr-en/ | docs/solutions-hr-en.html | en-SA/ltr | HR Automation Documentation \| BrightAI | https://brightai.site/docs/solutions-hr-en/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 6 | 10 | 0 |
| /docs/solutions-hr/ | docs/solutions-hr.html | ar-SA/rtl | دليل أتمتة الموارد البشرية والتوظيف \| BrightAI | https://brightai.site/docs/solutions-hr/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 6 | 10 | 0 |
| /docs/solutions-interview-en/ | docs/solutions-interview-en.html | en-SA/ltr | Smart Hiring Documentation \| BrightAI | https://brightai.site/docs/solutions-interview-en/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 10 | 0 |
| /docs/solutions-interview/ | docs/solutions-interview.html | ar-SA/rtl | دليل التوظيف الذكي والمقابلات \| BrightAI | https://brightai.site/docs/solutions-interview/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 6 | 10 | 0 |
| /docs/solutions-logistics-en/ | docs/solutions-logistics-en.html | en-SA/ltr | Logistics AI Solutions Documentation \| BrightAI | https://brightai.site/docs/solutions-logistics-en/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 10 | 1 |
| /docs/solutions-logistics/ | docs/solutions-logistics.html | ar-SA/rtl | دليل حلول اللوجستيات الذكية \| BrightAI | https://brightai.site/docs/solutions-logistics/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 6 | 10 | 1 |
| /docs/solutions-ocr-en/ | docs/solutions-ocr-en.html | en-SA/ltr | OCR and Document AI Documentation \| BrightAI | https://brightai.site/docs/solutions-ocr-en/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 10 | 0 |
| /docs/solutions-ocr/ | docs/solutions-ocr.html | ar-SA/rtl | دليل OCR واستخراج بيانات المستندات \| BrightAI | https://brightai.site/docs/solutions-ocr/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 10 | 0 |
| /docs/solutions-retail-en/ | docs/solutions-retail-en.html | en-SA/ltr | Retail and Ecommerce AI Documentation \| BrightAI | https://brightai.site/docs/solutions-retail-en/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 10 | 0 |
| /docs/solutions-retail/ | docs/solutions-retail.html | ar-SA/rtl | دليل حلول التجزئة والتجارة الإلكترونية \| BrightAI | https://brightai.site/docs/solutions-retail/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 6 | 10 | 0 |
| /docs/solutions-supply-chain-en/ | docs/solutions-supply-chain-en.html | en-SA/ltr | Supply Chain AI Documentation \| BrightAI | https://brightai.site/docs/solutions-supply-chain-en/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 10 | 0 |
| /docs/solutions-supply-chain/ | docs/solutions-supply-chain.html | ar-SA/rtl | دليل حلول سلسلة الإمداد الذكية \| BrightAI | https://brightai.site/docs/solutions-supply-chain/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 7 | 10 | 0 |
| /docs/terms-and-conditions-en/ | docs/terms-and-conditions-en.html | en-SA/ltr | BrightAI Terms and Conditions \| BrightAI | https://brightai.site/docs/terms-and-conditions-en/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 2 | 10 | 0 |
| /docs/terms-and-conditions/ | docs/terms-and-conditions.html | ar-SA/rtl | الشروط والأحكام في BrightAI \| BrightAI | https://brightai.site/docs/terms-and-conditions/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 2 | 10 | 0 |
| /en/about/ | en/about/index.html | en-SA/ltr | National AI Company In Riyadh \| Bright AI | https://brightai.site/en/about/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 2 | 11 | 0 |
| /en/ai-agent/ | en/ai-agent/index.html | en-SA/ltr | AI Agents For Enterprises in Saudi Arabia \| Bright AI | https://brightai.site/en/ai-agent/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 3 | 10 | 0 |
| /en/ai-bots/BrightMath/ | en/ai-bots/BrightMath/index.html | en-SA/ltr | BrightMath \| Smart Math Assistant in Saudi Arabia | https://brightai.site/en/ai-bots/BrightMath/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 13 | 0 |
| /en/ai-bots/BrightProject/ | en/ai-bots/BrightProject/index.html | en-SA/ltr | BrightProject \| Smart Project Management Bot in Saudi Arabia | https://brightai.site/en/ai-bots/BrightProject/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 12 | 0 |
| /en/ai-bots/BrightRecruiter/ | en/ai-bots/BrightRecruiter/index.html | en-SA/ltr | BrightRecruiter \| Smart Recruitment Bot in Saudi Arabia | https://brightai.site/en/ai-bots/BrightRecruiter/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 12 | 0 |
| /en/ai-bots/BrightSales/ | en/ai-bots/BrightSales/index.html | en-SA/ltr | BrightSales \| Smart Sales Bot in Saudi Arabia | https://brightai.site/en/ai-bots/BrightSales/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 12 | 0 |
| /en/ai-bots/BrightSupport/ | en/ai-bots/BrightSupport/index.html | en-SA/ltr | BrightSupport \| Smart Customer Service Bot in Saudi Arabia | https://brightai.site/en/ai-bots/BrightSupport/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 12 | 0 |
| /en/ai-bots/ | en/ai-bots/index.html | en-SA/ltr | AI Bots for Saudi Enterprises \| Bright AI | https://brightai.site/en/ai-bots/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 0 | 2 | 0 |
| /en/ai-workflows/ | en/ai-workflows/index.html | en-SA/ltr | AI Workflow Automation in Saudi Arabia \| Bright AI | https://brightai.site/en/ai-workflows/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 11 | 0 |
| /en/consultation/ | en/consultation/index.html | en-SA/ltr | AI Consulting In Saudi Arabia \| Bright AI | https://brightai.site/en/consultation/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 3 | 9 | 0 |
| /en/contact/ | en/contact/index.html | en-SA/ltr | Contact Bright AI \| AI Experts in Riyadh | https://brightai.site/en/contact/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 3 | 11 | 0 |
| /en/data-analysis/ | en/data-analysis/index.html | en-SA/ltr | Data Analysis For Saudi Companies in Saudi Arabia \| Bright AI | https://brightai.site/en/data-analysis/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 10 | 4 |
| /en/docs/docs/ | en/docs/docs.html | en-SA/ltr | Bright AI Docs for Saudi Enterprises \| Guides & API | https://brightai.site/en/docs/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | no | 4 | 9 | 0 |
| /en/docs/ | en/docs/index.html | en-SA/ltr | BrightAI Documentation for Saudi Teams | https://brightai.site/en/docs/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 9 | 0 |
| /en/health/ | en/health/index.html | en-SA/ltr | Digital Transformation In Healthcare in Saudi Arabia \| Bright AI | https://brightai.site/en/health/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 3 | 11 | 0 |
| /en/ | en/index.html | en-SA/ltr | Artificial Intelligence Company In Saudi Arabia \| Bright AI | https://brightai.site/en/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 0 | 8 | 4 |
| /en/interview/ | en/interview/index.html | en-SA/ltr | AI Recruitment Platform \| Bright AI | https://brightai.site/en/interview/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 6 | 1 |
| /en/privacy-cookies/ | en/privacy-cookies/index.html | en-SA/ltr | Cookie Policy \| Bright AI Saudi Arabia | https://brightai.site/en/privacy-cookies/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 3 | 5 | 0 |
| /en/services/ | en/services/index.html | en-SA/ltr | AI Services for Saudi Enterprises \| Bright AI | https://brightai.site/en/services/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 0 | 2 | 0 |
| /en/smart-automation/ | en/smart-automation/index.html | en-SA/ltr | AI Automation For Businesses in Saudi Arabia \| Bright AI | https://brightai.site/en/smart-automation/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 2 | 10 | 0 |
| /en/smart-medical-archive/ | en/smart-medical-archive/index.html | en-SA/ltr | AI Medical Archive in Saudi Arabia \| Bright AI | https://brightai.site/en/smart-medical-archive/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 18 | 0 |
| /en/tenders/compare/ | en/tenders/compare.html | en-SA/ltr | Compare Tender Offers and Contract Drafts with AI \| ContractAI | https://brightai.site/en/tenders/compare/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 2 | 4 | 0 |
| /en/tenders/dashboard/ | en/tenders/dashboard.html | en-SA/ltr | Smart Tender Dashboard for Contract Risk \| ContractAI | https://brightai.site/en/tenders/dashboard/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 1 | 4 | 0 |
| /en/tenders/ | en/tenders/index.html | en-SA/ltr | Tender Analysis AI Platform in Saudi Arabia \| ContractAI | https://brightai.site/en/tenders/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 0 | 2 | 0 |
| /en/tenders/landing/ | en/tenders/landing.html | en-SA/ltr | Smart Tender System for Saudi Procurement Teams \| ContractAI | https://brightai.site/en/tenders/landing/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 2 | 2 | 0 |
| /en/tenders/reports/ | en/tenders/reports.html | en-SA/ltr | Tender and Contract Intelligence Reports \| ContractAI | https://brightai.site/en/tenders/reports/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 1 | 4 | 0 |
| /en/tenders/settings/ | en/tenders/settings.html | en-SA/ltr | Tender Intelligence Settings and Integrations \| ContractAI | https://brightai.site/en/tenders/settings/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 1 | 4 | 0 |
| /en/tenders/templates/ | en/tenders/templates.html | en-SA/ltr | Saudi Tender and Contract Templates for AI Review \| ContractAI | https://brightai.site/en/tenders/templates/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 3 | 5 | 0 |
| /en/terms/ | en/terms/index.html | en-SA/ltr | Terms of Use for Customers and Visitors in Saudi Arabia \| Bright AI | https://brightai.site/en/terms/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 2 | 10 | 0 |
| /en/tools/ | en/tools/index.html | en-SA/ltr | AI Data Analysis Tools \| Bright AI | https://brightai.site/en/tools/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 14 | 0 |
| /error/ | error.html | ar-SA/rtl | تقرير أخطاء صحة الموقع \| Bright AI |  | index, follow | no | 1 | 2 | 0 |
| /health/ | health/index.html | ar-SA/rtl | التحول الرقمي في الرعاية الصحية في السعودية \| Bright AI | https://brightai.site/health/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 6 | 15 | 0 |
| / | index.html | ar-SA/rtl | شركة ذكاء اصطناعي في السعودية \| Bright AI | https://brightai.site/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 6 | 7 | 4 |
| /interview/ | interview/index.html | ar-SA/rtl | منصة توظيف بالذكاء الاصطناعي \| Bright AI | https://brightai.site/interview/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 7 | 8 | 1 |
| /interview/pages/appointment/ | interview/pages/appointment/index.html | ar-SA/rtl | حجز مواعيد الموارد البشرية - MAIS | https://brightai.site/interview/pages/appointment/ | index, follow | yes | 4 | 11 | 0 |
| /interview/pages/dashboard/ | interview/pages/dashboard/index.html | ar-SA/rtl | لوحة تحكم المسؤول - نظام التوظيف الذكي | https://brightai.site/interview/pages/dashboard/ | index, follow | yes | 3 | 12 | 0 |
| /interview/pages/support-ai/ | interview/pages/support-ai/index.html | ar-SA/rtl | نافذة الدعم الفني الذكي \| Bright AI | https://brightai.site/interview/pages/support-ai/ | index, follow | yes | 3 | 9 | 0 |
| /interview/pages/supportAI/ | interview/pages/supportAI/index.html | ar-SA/rtl | تم نقل الصفحة \| Bright AI | https://brightai.site/interview/pages/supportAI/ | index, follow | no | 1 | 2 | 0 |
| /interview/pages/Visitor-registration/ | interview/pages/Visitor-registration/index.html | ar-SA/rtl | نظام إدارة تسجيل الزوار - MAIS مع الذكاء الاصطناعي | https://brightai.site/interview/pages/Visitor-registration/ | index, follow | yes | 3 | 13 | 0 |
| /machine-learning/ | machine-learning/index.html | ar-SA/rtl | تطوير نماذج تعلم الآلة السعودية \| Bright AI | https://brightai.site/machine-learning/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 11 | 0 |
| /mais-OBM/ | mais-OBM/index.html | en/ltr | OBM Rejects Control Dashboard | https://brightai.site/mais-OBM/ | index, follow | no | 1 | 3 | 0 |
| /partners/ | partners/index.html | ar-SA/rtl | شراكات الذكاء الاصطناعي في السعودية \| Bright AI | https://brightai.site/partners/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 2 | 7 | 0 |
| /privacy-cookies/ | privacy-cookies/index.html | ar-SA/rtl | سياسة ملفات تعريف الارتباط \| Bright AI السعودية | https://brightai.site/privacy-cookies/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 3 | 5 | 0 |
| /sectors/ecommerce-en/ | sectors/ecommerce-en.html | en-SA/ltr | AI Solutions For Saudi E-Commerce In Saudi Arabia \| Bright AI | https://brightai.site/sectors/ecommerce-en/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 11 | 0 |
| /sectors/ecommerce-en/ | sectors/ecommerce-en/index.html | en-SA/ltr | AI Solutions for Saudi E-Commerce \| Bright AI | https://brightai.site/sectors/ecommerce-en/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 11 | 0 |
| /sectors/ecommerce/ | sectors/ecommerce.html | ar-SA/rtl | أتمتة التسويق بالذكاء الاصطناعي في السعودية \| Bright AI | https://brightai.site/sectors/ecommerce/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 6 | 12 | 0 |
| /sectors/energy-en/ | sectors/energy-en.html | en-SA/ltr | AI Solutions For Saudi Energy In Saudi Arabia \| Bright AI | https://brightai.site/sectors/energy-en/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 11 | 0 |
| /sectors/energy-en/ | sectors/energy-en/index.html | en-SA/ltr | AI Solutions for Saudi Energy \| Bright AI | https://brightai.site/sectors/energy-en/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 11 | 0 |
| /sectors/energy/ | sectors/energy.html | ar-SA/rtl | الذكاء الاصطناعي في قطاع الطاقة في السعودية \| Bright AI | https://brightai.site/sectors/energy/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 11 | 0 |
| /sectors/finance-en/ | sectors/finance-en.html | en-SA/ltr | AI Solutions For Saudi Finance In Saudi Arabia \| Bright AI | https://brightai.site/sectors/finance-en/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 11 | 0 |
| /sectors/finance-en/ | sectors/finance-en/index.html | en-SA/ltr | AI Solutions for Saudi Finance \| Bright AI | https://brightai.site/sectors/finance-en/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 11 | 0 |
| /sectors/finance/ | sectors/finance.html | ar-SA/rtl | الذكاء الاصطناعي في القطاع المالي في السعودية \| Bright AI | https://brightai.site/sectors/finance/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 11 | 0 |
| /sectors/healthcare-en/ | sectors/healthcare-en.html | en-SA/ltr | Healthcare AI Solutions For Saudi Hospitals In Saudi Arabia \| Bright AI | https://brightai.site/sectors/healthcare-en/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 11 | 0 |
| /sectors/healthcare-en/ | sectors/healthcare-en/index.html | en-SA/ltr | Healthcare AI Solutions for Saudi Hospitals \| Bright AI | https://brightai.site/sectors/healthcare-en/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 11 | 0 |
| /sectors/healthcare/ | sectors/healthcare.html | ar-SA/rtl | الذكاء الاصطناعي في الرعاية الصحية في السعودية \| Bright AI | https://brightai.site/sectors/healthcare/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 6 | 11 | 0 |
| /sectors/ | sectors/index.html | ar-SA/rtl | حلول ذكاء اصطناعي للقطاعات السعودية \| Bright AI | https://brightai.site/sectors/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 3 | 0 |
| /sectors/logistics-en/ | sectors/logistics-en.html | en-SA/ltr | AI Solutions For Saudi Logistics In Saudi Arabia \| Bright AI | https://brightai.site/sectors/logistics-en/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 11 | 0 |
| /sectors/logistics-en/ | sectors/logistics-en/index.html | en-SA/ltr | AI Solutions for Saudi Logistics \| Bright AI | https://brightai.site/sectors/logistics-en/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 11 | 0 |
| /sectors/logistics/ | sectors/logistics.html | ar-SA/rtl | الذكاء الاصطناعي في الخدمات اللوجستية في السعودية \| Bright AI | https://brightai.site/sectors/logistics/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 6 | 11 | 0 |
| /sectors/manufacturing-en/ | sectors/manufacturing-en.html | en-SA/ltr | AI Solutions For Saudi Manufacturing In Saudi Arabia \| Bright AI | https://brightai.site/sectors/manufacturing-en/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 11 | 0 |
| /sectors/manufacturing-en/ | sectors/manufacturing-en/index.html | en-SA/ltr | AI Solutions for Saudi Manufacturing \| Bright AI | https://brightai.site/sectors/manufacturing-en/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 11 | 0 |
| /sectors/manufacturing/ | sectors/manufacturing.html | ar-SA/rtl | الذكاء الاصطناعي في المصانع في السعودية \| Bright AI | https://brightai.site/sectors/manufacturing/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 12 | 0 |
| /services/ai-consulting/ | services/ai-consulting.html | ar-SA/rtl | استشارات الذكاء الاصطناعي في السعودية \| استشارات الذكاء الاصطناعي من Bright AI | https://brightai.site/services/ai-consulting/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 0 | 1 | 0 |
| /services/ai-scolecs/ | services/ai-scolecs.html | ar-SA/rtl | منصة تعليمية ذكية متكاملة في السعودية \| نظام منصة تعليمية متكاملة ذكية من Bright AI | https://brightai.site/services/ai-scolecs/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 0 | 1 | 0 |
| /services/ai-scolecs/ | services/ai-scolecs/index.html | ar-SA/rtl | نظام منصة تعليمية متكاملة ذكية \| Bright AI | https://brightai.site/services/ai-scolecs/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 1 | 1 | 0 |
| /services/ai-tenders-analysis/ | services/ai-tenders-analysis.html | ar-SA/rtl | نظام تحليل المناقصات بالذكاء الاصطناعي في السعودية \| نظام تحليل المناقصات بالذكاء الاصطناعي من Bright AI | https://brightai.site/services/ai-tenders-analysis/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 0 | 1 | 0 |
| /services/ai-tenders-analysis/ | services/ai-tenders-analysis/index.html | ar-SA/rtl | نظام تحليل المناقصات بالذكاء الاصطناعي \| Bright AI | https://brightai.site/services/ai-tenders-analysis/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 1 | 1 | 0 |
| /services/approvals-automation/ | services/approvals-automation.html | ar-SA/rtl | أتمتة الموافقات الإدارية في السعودية \| أتمتة الموافقات الإدارية من Bright AI | https://brightai.site/services/approvals-automation/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 0 | 1 | 0 |
| /services/brightproject/ | services/brightproject.html | ar-SA/rtl | BrightProject لإدارة المشاريع الذكية في السعودية \| BrightProject - إدارة المشاريع الذكي في السعودية من Bright AI | https://brightai.site/services/brightproject/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 0 | 1 | 0 |
| /services/brightproject/ | services/brightproject/index.html | ar-SA/rtl | BrightProject - إدارة المشاريع الذكي \| Bright AI | https://brightai.site/services/brightproject/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 1 | 1 | 0 |
| /services/brightsales/ | services/brightsales.html | ar-SA/rtl | BrightSales روبوت المبيعات الذكي في السعودية \| BrightSales - روبوت المبيعات الذكي في السعودية من Bright AI | https://brightai.site/services/brightsales/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 0 | 1 | 0 |
| /services/brightsales/ | services/brightsales/index.html | ar-SA/rtl | BrightSales - روبوت المبيعات الذكي \| Bright AI | https://brightai.site/services/brightsales/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 1 | 1 | 0 |
| /services/competitor-analysis-agent/ | services/competitor-analysis-agent.html | ar-SA/rtl | وكيل تحليل المنافسين في السعودية \| وكيل تحليل المنافسين من Bright AI | https://brightai.site/services/competitor-analysis-agent/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 0 | 1 | 0 |
| /services/custom-ai-agent/ | services/custom-ai-agent.html | ar-SA/rtl | وكيل ذكاء اصطناعي مخصص في السعودية \| وكيل ذكاء اصطناعي مخصص من Bright AI | https://brightai.site/services/custom-ai-agent/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 0 | 1 | 0 |
| /services/customer-service-automation/ | services/customer-service-automation.html | ar-SA/rtl | أتمتة خدمة العملاء في السعودية \| أتمتة خدمة العملاء من Bright AI | https://brightai.site/services/customer-service-automation/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 0 | 1 | 0 |
| /services/data-analyst-agent/ | services/data-analyst-agent.html | ar-SA/rtl | وكيل محلل بيانات في السعودية \| وكيل محلل بيانات من Bright AI | https://brightai.site/services/data-analyst-agent/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 0 | 1 | 0 |
| /services/data-platform/ | services/data-platform.html | ar-SA/rtl | منصة بيانات مؤسسية في السعودية \| نظام التحليل (منصة بيانات) من Bright AI | https://brightai.site/services/data-platform/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 0 | 1 | 0 |
| /services/document-automation/ | services/document-automation.html | ar-SA/rtl | أتمتة إدارة الوثائق في السعودية \| أتمتة إدارة البيانات والوثائق من Bright AI | https://brightai.site/services/document-automation/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 0 | 1 | 0 |
| /services/health-data-analysis/ | services/health-data-analysis.html | ar-SA/rtl | تحليل البيانات الصحية في السعودية \| تحليل البيانات الصحية من Bright AI | https://brightai.site/services/health-data-analysis/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 0 | 1 | 0 |
| /services/hr-automation/ | services/hr-automation.html | ar-SA/rtl | أتمتة الموارد البشرية في السعودية \| أتمتة إدارة الموارد البشرية من Bright AI | https://brightai.site/services/hr-automation/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 0 | 1 | 0 |
| /services/ | services/index.html | ar-SA/rtl | خدمات Bright AI في السعودية \| وكلاء ذكاء اصطناعي وأتمتة أعمال وتحليل بيانات | https://brightai.site/services/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 3 | 0 |
| /services/lead-hunter/ | services/lead-hunter.html | ar-SA/rtl | وكيل اكتشاف العملاء في السعودية \| وكيل اكتشاف الفرص والعملاء من Bright AI | https://brightai.site/services/lead-hunter/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 0 | 1 | 0 |
| /services/marketing-agent/ | services/marketing-agent.html | ar-SA/rtl | وكيل تسويق بالذكاء الاصطناعي في السعودية \| وكيل تسويق من Bright AI | https://brightai.site/services/marketing-agent/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 0 | 1 | 0 |
| /services/marketing-automation/ | services/marketing-automation.html | ar-SA/rtl | أتمتة التسويق الرقمي في السعودية \| أتمتة التسويق الرقمي من Bright AI | https://brightai.site/services/marketing-automation/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 0 | 1 | 0 |
| /services/medical-archive/ | services/medical-archive.html | ar-SA/rtl | أرشيف طبي ذكي في السعودية \| نظام سجلات (أرشيف طبي) من Bright AI | https://brightai.site/services/medical-archive/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 0 | 1 | 0 |
| /services/operational-reports-automation/ | services/operational-reports-automation.html | ar-SA/rtl | أتمتة التقارير التشغيلية في السعودية \| أتمتة التقارير التشغيلية من Bright AI | https://brightai.site/services/operational-reports-automation/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 0 | 1 | 0 |
| /services/seo-agent/ | services/seo-agent.html | ar-SA/rtl | وكيل SEO في السعودية \| وكيل تحسين محركات البحث SEO من Bright AI | https://brightai.site/services/seo-agent/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 0 | 1 | 0 |
| /services/smart-hiring-system/ | services/smart-hiring-system.html | ar-SA/rtl | نظام توظيف ذكي في السعودية \| نظام الاستقطاب (توظيف ذكي) من Bright AI | https://brightai.site/services/smart-hiring-system/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 0 | 1 | 0 |
| /services/smart-hospital-management/ | services/smart-hospital-management.html | ar-SA/rtl | نظام إدارة المستشفيات الذكية في السعودية \| نظام إدارة المستشفيات الذكية من Bright AI | https://brightai.site/services/smart-hospital-management/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 0 | 1 | 0 |
| /services/smart-hospital-management/ | services/smart-hospital-management/index.html | ar-SA/rtl | نظام إدارة المستشفيات الذكية \| Bright AI | https://brightai.site/services/smart-hospital-management/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 1 | 1 | 0 |
| /services/social-data-analysis/ | services/social-data-analysis.html | ar-SA/rtl | تحليل بيانات وسائل التواصل في السعودية \| تحليل بيانات وسائل التواصل الاجتماعي متقدم من Bright AI | https://brightai.site/services/social-data-analysis/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 0 | 1 | 0 |
| /services/supply-chain-optimization/ | services/supply-chain-optimization.html | ar-SA/rtl | تحسين سلسلة التوريد بالذكاء الاصطناعي في السعودية \| أتمتة تحسين سلسلة التوريد من Bright AI | https://brightai.site/services/supply-chain-optimization/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 0 | 1 | 0 |
| /sitemap/ | sitemap/index.html | ar-SA/rtl | خريطة موقع Bright AI \| صفحات الموقع العامة | https://brightai.site/sitemap/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 0 | 2 | 0 |
| /smart-automation/ | smart-automation/index.html | ar-SA/rtl | أتمتة العمليات بالذكاء الاصطناعي في السعودية \| Bright AI | https://brightai.site/smart-automation/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 10 | 0 |
| /smart-medical-archive/ | smart-medical-archive/index.html | ar-SA/rtl | الأرشيف الطبي الذكي بالذكاء الاصطناعي في السعودية \| Bright AI | https://brightai.site/smart-medical-archive/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 10 | 26 | 0 |
| /tenders/compare/ | tenders/compare.html | ar-SA/rtl | مقارنة عروض المناقصات والعقود بالذكاء الاصطناعي \| ContractAI | https://brightai.site/tenders/compare/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 3 | 5 | 0 |
| /tenders/dashboard/ | tenders/dashboard.html | ar-SA/rtl | لوحة نظام مناقصات ذكي لمخاطر العقود \| ContractAI | https://brightai.site/tenders/dashboard/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 2 | 5 | 0 |
| /tenders/ | tenders/index.html | ar-SA/rtl | نظام تحليل المناقصات بالذكاء الاصطناعي \| Bright AI | https://brightai.site/tenders/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 5 | 9 | 0 |
| /tenders/landing/ | tenders/landing.html | ar-SA/rtl | نظام مناقصات ذكي لفرق المشتريات السعودية \| ContractAI | https://brightai.site/tenders/landing/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 4 | 3 | 0 |
| /tenders/reports/ | tenders/reports.html | ar-SA/rtl | تقارير تحليل المناقصات والعقود التنفيذية \| ContractAI | https://brightai.site/tenders/reports/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 2 | 5 | 0 |
| /tenders/settings/ | tenders/settings.html | ar-SA/rtl | إعدادات منصة تحليل مناقصات وذكاء عقود \| ContractAI | https://brightai.site/tenders/settings/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 2 | 5 | 0 |
| /tenders/templates/ | tenders/templates.html | ar-SA/rtl | قوالب عقود ومناقصات سعودية للتحليل الذكي \| ContractAI | https://brightai.site/tenders/templates/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 3 | 5 | 0 |
| /terms/ | terms/index.html | ar-SA/rtl | شروط الاستخدام للعملاء والزوار في السعودية \| Bright AI | https://brightai.site/terms/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 2 | 10 | 0 |
| /tools/ | tools/index.html | ar-SA/rtl | أدوات تحليل البيانات بالذكاء الاصطناعي \| Bright AI | https://brightai.site/tools/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 6 | 14 | 0 |
| /try/data-analyzer/ | try/data-analyzer/index.html | ar-SA/rtl | تحليل بيانات مجاني \| Bright AI | https://brightai.site/try/data-analyzer/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 7 | 18 | 0 |
| /try/data-quality/ | try/data-quality/index.html | ar-SA/rtl | فحص جودة البيانات \| Bright AI | https://brightai.site/try/data-quality/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 8 | 15 | 0 |
| /try/ | try/index.html | ar-SA/rtl | تجربة أدوات الذكاء الاصطناعي \| Bright AI | https://brightai.site/try/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 6 | 11 | 1 |
| /try/text-analysis/ | try/text-analysis/index.html | ar-SA/rtl | تحليل النصوص بالذكاء الاصطناعي \| Bright AI | https://brightai.site/try/text-analysis/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 6 | 9 | 0 |
| /what-is-ai/ | what-is-ai/index.html | ar-SA/rtl | تعريف الذكاء الاصطناعي: شرح عملي \| Bright AI | https://brightai.site/what-is-ai/ | index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1 | yes | 2 | 10 | 0 |

## Asset Inventory
| Asset/path | Purpose | Referenced count or role |
|---|---|---:|
| .agents/plugins/marketplace.json | Codex/agent skill/plugin metadata | 0 |
| .agents/skills/ rtl-ui-guardian/agents/openai.yaml | Codex/agent skill/plugin metadata | 0 |
| .agents/skills/awesome-design-md/.github/FUNDING.yml | Codex/agent skill/plugin metadata | 0 |
| .agents/skills/awesome-design-md/.github/ISSUE_TEMPLATE/design-md-request.yml | Codex/agent skill/plugin metadata | 0 |
| .agents/skills/awesome-design-md/agents/gemini.yaml | Codex/agent skill/plugin metadata | 0 |
| .agents/skills/awesome-design-md/agents/openai.yaml | Codex/agent skill/plugin metadata | 0 |
| .agents/skills/design-md/agents/openai.yaml | Codex/agent skill/plugin metadata | 0 |
| .agents/skills/frontend-design/agents/openai.yaml | Codex/agent skill/plugin metadata | 0 |
| .agents/skills/google-indexing-seo-guardian/agents/openai.yaml | Codex/agent skill/plugin metadata | 0 |
| .agents/skills/intelligent-content-reviewer-validator/agents/openai.yaml | Codex/agent skill/plugin metadata | 0 |
| .agents/skills/internal-links-guardian/agents/openai.yaml | Codex/agent skill/plugin metadata | 0 |
| .agents/skills/karpathy-guidelines/agents/openai.yaml | Codex/agent skill/plugin metadata | 0 |
| .agents/skills/karpathy-guidelines/references/upstream-plugin.json | Codex/agent skill/plugin metadata | 0 |
| .agents/skills/render-deploy/agents/openai.yaml | Codex/agent skill/plugin metadata | 0 |
| .agents/skills/render-deploy/assets/docker.yaml | Codex/agent skill/plugin metadata | 0 |
| .agents/skills/render-deploy/assets/go-api.yaml | Codex/agent skill/plugin metadata | 0 |
| .agents/skills/render-deploy/assets/static-site.yaml | Codex/agent skill/plugin metadata | 0 |
| .agents/skills/seo-audit/agents/openai.yaml | Codex/agent skill/plugin metadata | 0 |
| .agents/skills/seo-content/agents/openai.yaml | Codex/agent skill/plugin metadata | 0 |
| .agents/skills/seo-geo/agents/openai.yaml | Codex/agent skill/plugin metadata | 0 |
| .agents/skills/seo-hreflang/agents/openai.yaml | Codex/agent skill/plugin metadata | 0 |
| .agents/skills/seo-images/agents/openai.yaml | Codex/agent skill/plugin metadata | 0 |
| .agents/skills/seo-local/agents/openai.yaml | Codex/agent skill/plugin metadata | 0 |
| .agents/skills/seo-page/agents/openai.yaml | Codex/agent skill/plugin metadata | 0 |
| .agents/skills/seo-plan/agents/openai.yaml | Codex/agent skill/plugin metadata | 0 |
| .agents/skills/seo-schema/agents/openai.yaml | Codex/agent skill/plugin metadata | 0 |
| .agents/skills/seo-sitemap/agents/openai.yaml | Codex/agent skill/plugin metadata | 0 |
| .agents/skills/seo-technical/agents/openai.yaml | Codex/agent skill/plugin metadata | 0 |
| .agents/skills/seo/agents/openai.yaml | Codex/agent skill/plugin metadata | 0 |
| .agents/skills/seo/schema/templates.json | Codex/agent skill/plugin metadata | 0 |
| .agents/skills/vercel-react-best-practices/agents/openai.yaml | Codex/agent skill/plugin metadata | 0 |
| .vscode/settings.json | Project support file | 0 |
| assets/3d-icons/customer-robots-0.avif | Image/icon asset | 0 |
| assets/3d-icons/customer-robots-0.webp | Image/icon asset | 2 |
| assets/3d-icons/digital-twins-simulation-0.avif | Image/icon asset | 0 |
| assets/3d-icons/digital-twins-simulation-0.webp | Image/icon asset | 2 |
| assets/3d-icons/icon_1_3d_robot_artificial_intelligence_icon.avif | Image/icon asset | 0 |
| assets/3d-icons/icon_1_3d_robot_artificial_intelligence_icon.webp | Image/icon asset | 0 |
| assets/3d-icons/icon_1_3d_rocket_startup_icon.avif | Image/icon asset | 0 |
| assets/3d-icons/icon_1_3d_rocket_startup_icon.webp | Image/icon asset | 2 |
| assets/3d-icons/icon_2_3d_robot_artificial_intelligence_icon.avif | Image/icon asset | 0 |
| assets/3d-icons/icon_2_3d_robot_artificial_intelligence_icon.webp | Image/icon asset | 2 |
| assets/3d-icons/icon_3_3d_robot_artificial_intelligence_icon.avif | Image/icon asset | 0 |
| assets/3d-icons/icon_3_3d_robot_artificial_intelligence_icon.webp | Image/icon asset | 2 |
| assets/3d-icons/smart-drones-inspection-0.avif | Image/icon asset | 0 |
| assets/3d-icons/smart-drones-inspection-0.webp | Image/icon asset | 2 |
| assets/3d-icons/warehouse-automation-0.avif | Image/icon asset | 0 |
| assets/3d-icons/warehouse-automation-0.webp | Image/icon asset | 2 |
| assets/fonts/IBMPlexSansArabic-Bold.ttf | Font asset | 0 |
| assets/fonts/IBMPlexSansArabic-Bold.woff2 | Font asset | 0 |
| assets/fonts/IBMPlexSansArabic-Medium.ttf | Font asset | 0 |
| assets/fonts/IBMPlexSansArabic-Medium.woff2 | Font asset | 0 |
| assets/fonts/IBMPlexSansArabic-Regular.ttf | Font asset | 0 |
| assets/fonts/IBMPlexSansArabic-Regular.woff2 | Font asset | 0 |
| assets/fonts/IBMPlexSansArabic-SemiBold.ttf | Font asset | 0 |
| assets/fonts/IBMPlexSansArabic-SemiBold.woff2 | Font asset | 0 |
| assets/fonts/ScheherazadeNew-Regular.ttf | Font asset | 0 |
| assets/fonts/ScheherazadeNew-Regular.woff2 | Font asset | 0 |
| assets/images/chatbot.svg | Image/icon asset | 0 |
| assets/images/Gemini.png | Image/icon asset | 47 |
| assets/images/grid.svg | Image/icon asset | 0 |
| assets/images/hero-brain.svg | Image/icon asset | 0 |
| assets/images/noise.png | Image/icon asset | 0 |
| assets/svg/inline-icon-20ad9f0ba8e6.svg | Image/icon asset | 2 |
| assets/svg/inline-icon-3effdab8a020.svg | Image/icon asset | 0 |
| assets/svg/inline-icon-756421bc760e.svg | Image/icon asset | 0 |
| backend/data/search-index 2.json | Project support file | 0 |
| backend/package-lock.json | Node package manifest/lockfile | 0 |
| backend/package.json | Node package manifest/lockfile | 0 |
| backend/ScheherazadeNew-Regular.ttf | Project support file | 0 |
| BingSiteAuth.xml | Project support file | 0 |
| blog/Gemini.png | Image/icon asset | 0 |
| docs/openapi.yaml | Project support file | 0 |
| frontend/backend/package-lock.json | Node package manifest/lockfile | 0 |
| frontend/package.json | Node package manifest/lockfile | 0 |
| lottie-logo.json | Project support file | 0 |
| mais-OBM/OBM-DATA .xlsx | Project support file | 0 |
| manifest.json | Project support file | 0 |
| package-lock.json | Node package manifest/lockfile | 0 |
| package.json | Node package manifest/lockfile | 0 |
| plugins/andrej-karpathy-skills/.codex-plugin/plugin.json | Codex/agent skill/plugin metadata | 0 |
| plugins/andrej-karpathy-skills/skills/karpathy-guidelines/agents/openai.yaml | Codex/agent skill/plugin metadata | 0 |
| plugins/andrej-karpathy-skills/skills/karpathy-guidelines/references/upstream-plugin.json | Codex/agent skill/plugin metadata | 0 |
| redirects.json | Project support file | 0 |
| render.yaml | Render deployment blueprint | 0 |
| reports/blog-migration-map.json | Generated audit/report artifact | 0 |
| reports/blog-migration/blog-migration-map.json | Generated audit/report artifact | 0 |
| reports/internal-links/broken_links_before.json | Generated audit/report artifact | 0 |
| reports/lighthouse-pr3/index-desktop.json | Generated audit/report artifact | 0 |
| reports/lighthouse-pr3/index-mobile.json | Generated audit/report artifact | 0 |
| reports/lighthouse-pr3/services-desktop.json | Generated audit/report artifact | 0 |
| reports/lighthouse-pr3/services-mobile.json | Generated audit/report artifact | 0 |
| reports/resource-paths/resource_paths_after.json | Generated audit/report artifact | 0 |
| reports/resource-paths/resource_paths_before.json | Generated audit/report artifact | 0 |
| schema-saudi-seo.json | Project support file | 0 |
| scripts/performance-budget.config.json | Build/SEO/audit automation script | 0 |
| sitemap.xml | SEO crawler/search discovery file | 0 |
| skills-lock.json | Project support file | 0 |
| tenders/render-backend/package.json | Node package manifest/lockfile | 0 |
| tmp/blog-canonical-report.json | Generated audit/report artifact | 0 |
| tmp/brightai_html_seo_governor.json | Generated audit/report artifact | 0 |
| tmp/brightai-seo-governor.json | Generated audit/report artifact | 0 |
| tmp/hreflang-fix-report.json | Generated audit/report artifact | 0 |
| tmp/html-seo.json | Generated audit/report artifact | 0 |
| tmp/semrush_issues_raw.json | Generated audit/report artifact | 0 |
| tmp/service-pages-html-seo-governor.json | Generated audit/report artifact | 0 |
| tmp/url_policy_after.json | Generated audit/report artifact | 0 |
| tmp/url_policy_report.json | Generated audit/report artifact | 0 |

## Dependency Inventory
| Manifest | Scope | Package | Version |
|---|---|---|---|
| package.json | dependencies | @sentry/react | ^10.38.0 |
| package.json | dependencies | dotenv | ^16.5.0 |
| package.json | dependencies | esbuild | ^0.21.5 |
| package.json | dependencies | glob | ^13.0.6 |
| package.json | dependencies | ws | ^8.18.3 |
| package.json | devDependencies | aos | ^2.3.4 |
| package.json | devDependencies | cheerio | ^1.2.0 |
| package.json | devDependencies | fast-check | ^3.15.0 |
| package.json | devDependencies | gsap | ^3.14.2 |
| package.json | devDependencies | jsdom | ^23.0.0 |
| package.json | devDependencies | swiper | ^12.1.0 |
| package.json | devDependencies | vitest | ^1.0.0 |
| backend/package.json | dependencies | dotenv | ^16.5.0 |
| backend/package.json | dependencies | ws | ^8.18.3 |
| backend/package.json | devDependencies | vitest | ^1.0.0 |
| tenders/render-backend/package.json | dependencies | express | ^4.18.2 |
| tenders/render-backend/package.json | dependencies | cors | ^2.8.5 |
| tenders/render-backend/package.json | dependencies | node-fetch | ^2.7.0 |

## API Inventory
| Route | Method | Handler files | Purpose |
|---|---|---|---|
| /api/ai/stream | POST | backend/server.js + backend/routes/aiGateway.js/groq.js | stream alias |
| /api/groq/stream | POST | backend/server.js + backend/routes/groq.js | stream alias |
| /api/gemini/chat | POST | backend/server.js + backend/routes/gemini.js | Gemini chat |
| /api/gemini/chat/stream | POST | backend/server.js + backend/routes/gemini.js | Gemini stream |
| /api/ai/openai-chat | POST | backend/server.js + backend/routes/aiGateway.js | OpenAI-compatible chat |
| /api/ai/chat/completions | POST | backend/server.js + backend/routes/aiGateway.js | OpenAI-compatible completions |
| /api/health/ai | GET | backend/server.js + backend/services/aiGateway.js | AI provider health |
| /api/analytics/ga4/conversion | POST | backend/server.js + backend/routes/analytics.js | GA4 conversion forwarding |
| /api/health | GET | backend/server.js | service health |
| /ws/live | WS | backend/server.js | live dashboard websocket |

## Critical Issues
| Severity | Area | File path | Evidence | Impact | Fix |
|---|---|---|---|---|---|
| High | SEO/indexability | 404.html:27 | `meta robots=index, follow`, no canonical, not in sitemap | Error URL can enter index and waste crawl budget | Set `noindex, follow`; add canonical only if intentionally indexable |
| High | SEO/indexability | 500.html:36 | `meta robots=index, follow`, no canonical, not in sitemap | Server-error page can be indexed | Set `noindex, follow` and serve 500 status in production |
| High | SEO/indexability | error.html:16 | Generated site-health report is `index, follow` and no canonical | Internal diagnostic content can be indexed | Set `noindex, nofollow` or exclude from publish |
| High | Deployment/routes | _redirects:36-75 + render.yaml:78-111 | Both `.html` and folder/index forms exist for selected service/sector/docs pages | Cloudflare + Render can cache mixed route bodies and split canonicals if rules diverge | Keep one physical route form in publish output and make redirects 301 consistently |
| High | Testing/release confidence | backend/package.json:15, package.json:5 | Backend test failed locally due Rollup native optional dependency/code-sign + Node v24 while engine requires Node >=22 <23 | CI/developer validation can fail despite Render using Node 22 | Run tests under Node 22 and reinstall optional deps in a clean environment |
| Medium | Performance/cache | render.yaml:141-186 vs backend/server.js:510-523 | Static site caches JS/CSS 30d; backend static fallback caches JS/CSS 1d; filenames are not consistently hashed | Cloudflare may serve stale JS/CSS after deploy | Use content-hashed assets or lower cache for unversioned names |
| Medium | UI/responsive | frontend/css/index-theme.css:1 | Global `overflow-x:hidden`, fixed/sticky overlays and large transformed demo surfaces are minified into one line | Horizontal bugs can be hidden instead of fixed; hard to debug exact component | Add component-level responsive wrappers and keep source maps/unminified CSS in repo |
| Medium | AI search/GEO | services/ai-scolecs/index.html, services/ai-tenders-analysis/index.html, services/brightproject/index.html, services/brightsales/index.html, services/smart-hospital-management/index.html | Audit parser found no answer-block on these product pages | Less citable in AI Overviews/ChatGPT-style answer engines | Add 40-60 word answer block near H1 plus FAQ/table where appropriate |
| Medium | Content governance | reports/brightai_full_seo_ai_audit_2026-04-25.md | Generator could not read missing `reports/keywords strategy 2026.xlsx` | Keyword mapping section may be stale/incomplete | Restore keyword workbook or update generator to use committed keyword markdown/json |