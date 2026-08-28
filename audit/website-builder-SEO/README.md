# Universal SEO website builder prompt pack

This is a standalone starter bundle for building a researched, structured, visually distinctive website with a capable research and coding model. It contains no example-business content and does not require access to the project from which the workflow was developed.

The default implementation path is Astro with strict TypeScript and Cloudflare. You can specify a different approved stack in `PROJECT-INPUTS.md`, but the agent must then adapt the implementation and validation steps deliberately rather than mixing frameworks. DataForSEO through its official MCP server is required for the SEO research phases.

## The six files

1. `PROJECT-INPUTS.md` — the only file the owner fills in before starting.
2. `START-HERE.md` — one prompt to paste into a new GPT/Codex task.
3. `PROMPTS.md` — the complete gated research, design, build, QA, and launch system.
4. `HOW-TO-USE.md` — instructions for approvals, corrections, context, and handoff.
5. `DATAFORSEO-SETUP.md` — official MCP installation, credential safety, modules, and preflight checks.
6. `README.md` — this quick-start and package contract.

## Quick start

1. Copy this entire folder into the root of a new website project.
2. Follow `DATAFORSEO-SETUP.md` and connect the official DataForSEO MCP server without storing credentials in the project.
3. Complete `PROJECT-INPUTS.md`. Use `unknown—must be researched or approved` when something is not known.
4. Open the new project folder in Codex or another workspace-aware coding agent.
5. Copy the code block from `START-HERE.md` into a new task.
6. Review the artifacts GPT creates and respond to each approval gate.

You do not paste all 25 phase prompts. The start instruction tells GPT to read `PROMPTS.md`, choose the next valid phase, and continue from the durable project records after each approval.

## Why it is not one blind “build everything” prompt

A production website contains decisions GPT must not silently invent: the business entity, claims, research spend, launch pages, design direction, generated-media quality, CMS, lead destination, analytics consent, and deployment target. The pack automates the work while keeping those decisions visible.

Measured SEO research is not optional or memory-based. The agent must use the connected DataForSEO MCP server for keyword, SERP, competitor, and backlink evidence, and must stop at the connection gate if it is unavailable.

The owner should usually need to:

- complete the input sheet;
- approve the business and claims boundary;
- authorize bounded research spending, if any;
- approve the sitemap and design direction;
- approve the representative page and optional motion concept;
- configure external accounts or secrets without pasting them into chat;
- authorize deployment.

## Structure the agent will create

The control and evidence layer is created before the website code:

```text
docs/
  00-project-brief.md
  claims-matrix.md
  project-state.md
  decision-log.md
  approval-log.md
  research/
  seo/
  content/
    page-briefs/
  design/
  architecture/
  qa/
  analytics/
  operations/
research/
  data/
```

After architecture and design approval, the default Astro implementation should converge on:

```text
src/
  components/
    common/
    content/
    home/
  data/
  layouts/
  lib/
  pages/
  scripts/
  styles/
public/
scripts/
astro.config.mjs
tsconfig.json
package.json
```

Only create folders that have an approved purpose. Page routes, navigation, sitemaps, metadata, and schema should derive from shared typed content wherever practical rather than from repeated hand-maintained lists.

## Two valid outcomes

- **Guided production build:** the recommended mode. It uses the complete approval process and can proceed to a real deployment.
- **Local concept build:** useful for demonstrations. It may create a local visual prototype but must keep unverified claims out, avoid paid/external actions, disable or label fake conversion behavior, and stop before deployment.

The start prompt defaults to the guided production build unless `PROJECT-INPUTS.md` explicitly selects local concept mode.
