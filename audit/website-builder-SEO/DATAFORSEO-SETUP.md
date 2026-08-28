# Required DataForSEO MCP setup

DataForSEO is the required measured-data source for the SEO phases in this pack. The agent must use it for keyword demand, CPC and competition context, live SERPs, recurring competitors, ranked-domain/page evidence, and backlinks where the approved research plan requires them.

Public web research remains necessary for official regulations, market facts, local programs, and source verification. It supplements DataForSEO; it does not replace its metrics.

Official project: [dataforseo/mcp-server-typescript](https://github.com/dataforseo/mcp-server-typescript)

Before executing an installation, the agent must inspect the current official README because package commands, supported modules, and host configuration can change. The instructions below were verified against the repository on 2026-07-17.

## Prerequisites

- Node.js 14 or newer according to the server repository; a current supported Node LTS is preferable.
- A DataForSEO account with API login credentials and enough balance for the research budget you approve.
- An MCP-capable host such as Codex desktop/CLI or another compatible coding agent.

Never place the DataForSEO username or password in this folder, source control, screenshots, prompts, tutorial recordings, or frontend code.

## Recommended installation: published package

The official repository documents a global install and a direct `npx` option. The direct option avoids keeping a separate server checkout:

```bash
npx dataforseo-mcp-server@latest
```

Configure the MCP host to start an STDIO server with:

```text
command: npx
arguments: -y dataforseo-mcp-server@latest
```

Supply these required environment variables through the MCP host's secure environment/secret configuration or the parent process—not through committed project files:

```text
DATAFORSEO_USERNAME
DATAFORSEO_PASSWORD
```

The official server uses `DATAFORSEO_USERNAME`. Do not substitute a differently named variable from an unrelated integration unless that integration's own documentation explicitly requires it.

## Alternative installation: clone the official repository

Use this route when you want to inspect, pin, or modify the server:

```bash
git clone https://github.com/dataforseo/mcp-server-typescript
cd mcp-server-typescript
npm install
npm run build
```

Then follow the repository README for the current local-server command and configure your MCP host to run that checked-out server. Record the tag or commit used for reproducibility. Do not copy DataForSEO credentials into the checkout.

## Recommended modules for this website workflow

The server supports limiting its exposed modules with `ENABLED_MODULES`. For the complete workflow, configure only the modules you expect to use:

```text
SERP,KEYWORDS_DATA,DATAFORSEO_LABS,BACKLINKS,BUSINESS_DATA,DOMAIN_ANALYTICS,ONPAGE
```

- `SERP`: live organic and local search-result evidence.
- `KEYWORDS_DATA`: keyword metrics and clickstream-derived data.
- `DATAFORSEO_LABS`: keyword, domain, and ranked-page research.
- `BACKLINKS`: referring-domain and page evidence when it changes a decision.
- `BUSINESS_DATA`: local business/review evidence where relevant.
- `DOMAIN_ANALYTICS`: domain technology and related competitor context.
- `ONPAGE`: auditing an existing site; it may be unnecessary for a new blank project.

Optional response settings documented by the server include:

```text
DATAFORSEO_FULL_RESPONSE=false
DATAFORSEO_SIMPLE_FILTER=false
```

Keep concise responses by default. Change the simple-filter setting only if the selected host cannot process the normal nested schema.

## Connection preflight

After adding the server:

1. Restart or reconnect the MCP host.
2. Confirm that DataForSEO tools are visible.
3. Confirm the server identity comes from the official repository or its published `dataforseo-mcp-server` package.
4. Run only a documented free status, endpoint-list, or equivalent non-billable authentication check.
5. Confirm no credential values appear in chat, logs, screenshots, project files, or generated documentation.
6. Do not create a paid task until Prompt 3A has produced a bounded call plan and the owner has approved its spend or task limit.

## Hard failure rule

If authentication fails, the tools are missing, or the server cannot be identified, stop at Phase 2. Report the exact non-secret error and the next setup action. Do not:

- invent search volume, CPC, competition, rankings, traffic, or backlink data;
- substitute numbers from model memory;
- proceed from keyword brainstorming directly to a launch sitemap;
- silently use a different paid provider;
- expose credentials while troubleshooting.
