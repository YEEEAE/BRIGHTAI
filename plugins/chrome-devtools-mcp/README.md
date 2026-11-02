# Chrome DevTools MCP

A configuration-only Harness bundle that connects the official
[`chrome-devtools-mcp`](https://github.com/ChromeDevTools/chrome-devtools-mcp) server to this DSH profile.

It adds no Harness code of its own: `cordis.patch.yml` inserts one
`@deepseek-ai/dsh-mcp-client` row, and the client bridge registers the server's tools as
`mcp__chrome-devtools__<tool>`.

## What it enables

| Capability | Example tool |
|---|---|
| Open, close, and list pages | `new_page`, `navigate_page`, `list_pages` |
| Inspect the DOM and page state | `take_snapshot`, `evaluate_script` |
| Read console and network activity | `list_console_messages`, `list_network_requests` |
| Measure performance | `performance_start_trace`, `performance_stop_trace` |
| Capture screenshots | `take_screenshot` |

## Configuration

```yaml
serverName: chrome-devtools
transport: stdio
command: npx
args: ['-y', 'chrome-devtools-mcp@1.12.0', '--no-usage-statistics']
```

- The version is pinned; `chrome-devtools-mcp@latest` resolves to the same `1.12.0` at the time of writing.
- `--no-usage-statistics` opts out of Google's MCP usage telemetry; it is independent of Chrome browser metrics.
- The server launches its own Chrome instance with the profile at
  `~/.cache/chrome-devtools-mcp/chrome-profile` and the default viewport.
- `toolCallTimeoutMs` is raised to 120 s so long performance traces and full-page screenshots do not time out.
- Add CLI flags here when a different behavior is needed, for example `--headless`, `--isolated`,
  `--viewport=1440x900`, or `--browserUrl=http://127.0.0.1:9222` to attach to a Chrome started with
  `--remote-debugging-port=9222`.

### Requirements

- Node.js `^20.19.0 || ^22.12.0 || >=23` (this machine runs `24.x`).
- Google Chrome installed at the default location, or an explicit `--executablePath`.

## Security notes

- The server can evaluate JavaScript in the inspected page (`evaluate_script`). That is what makes it useful
  for verification, and it is also why it should only be pointed at pages you trust.
- Filesystem access from the server's tools is restricted to the OS temp directory unless a
  `--workspace` root is configured; add one only when a flow must read or write project files.
- The MCP client scrubs ambient environment variables whose names look like credentials
  (`KEY`, `PASSWORD`, `SECRET`, `TOKEN`) before spawning the process, so no project secret is forwarded implicitly.

## Verify

After installation, confirm the client row is live and the tools exist:

- `cordis_inspect_query` → Host `Config.listConfigs` with `name: "@deepseek-ai/dsh-mcp-client"`.
- `cordis_inspect_query` → Host `Tool.listTools`; look for `mcp__chrome-devtools__*`.
- Call `mcp__chrome-devtools__list_pages` for a round trip to the server.

## Files

- `package.json` — bundle manifest (`dsh.bundle.patch`).
- `cordis.patch.yml` — the single MCP client insert row.
- `locale/en.json`, `locale/ar.json` — display title and description.
- `icon.svg` — original browser-inspection mark.
