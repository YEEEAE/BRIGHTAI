# Neon MCP (DeepSeek Harness bundle)

Configuration-only bundle that connects the official [Neon MCP Server](https://neon.com/docs/ai/connect-mcp-clients-to-neon) to this Harness profile.

- Endpoint: `https://mcp.neon.tech/mcp?projectId=young-frog-60183055` (project `AIGAS Kernel`, branch `production`).
- Tools appear as `mcp__neon__<tool>`.
- Transport: `streamable-http`, provided by the shipped `@deepseek-ai/dsh-mcp-client` package.

## Authentication

The official server accepts OAuth or an `Authorization: Bearer <NEON_API_KEY>` header. This bundle carries **no secret**. Authentication is supplied by a user-level row override in the profile patch:

```yaml
- id: neon-mcp
  name: '@deepseek-ai/dsh-mcp-client'
  config:
    serverName: neon
    transport: streamable-http
    url: 'https://mcp.neon.tech/mcp?projectId=young-frog-60183055'
    headers:
      Authorization: 'Bearer <YOUR_NEON_API_KEY>'
    toolCallTimeoutMs: 120000
    failOnStartupError: false
```

A config override replaces `config` wholesale, so restate every field.

Create a project-scoped key (cannot touch other projects, cannot mint keys, but can change everything inside this one):

```bash
neon api-keys create --name "dsh-neon-mcp" --project-id young-frog-60183055
```

Revoke it with `neon api-keys revoke <id>` when it is no longer needed.

## Scope and limits

- The key is limited to project `young-frog-60183055`. Drop `?projectId=` to let the server see every project the account can access.
- Neon documents the MCP server as intended for development and testing. Destructive tools are exposed; review actions before running them.
- The database contract for this repository is still `DATABASE_URL` from `.env`; this bundle adds tooling, it does not change application runtime.
- MCP tools load at Harness startup. After installing or editing the row, the running profile reloads the composition; a restart is only needed if the connection does not recover.
