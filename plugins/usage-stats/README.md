# Usage & Stats

A local dashboard for DeepSeek Harness that answers four questions from the profile's real conversation logs:

- How many tokens have I used, split into uncached input, cache reads, cache writes, and output?
- What did that usage cost at an editable rate card, and how much of a monthly budget is left?
- Which conversations consumed the tokens, and when?
- How busy are the machine and the Harness process while the work runs?

It registers a **Usage & stats** page in the left sidebar.

## What is real

| Figure | Source |
|---|---|
| Tokens, requests, turns, steps | Every `assistant/message` usage record in every session log, read through the Host `sessionQuery` service. |
| Conversation count, titles, timestamps, models | Session headers, `session/title`, `request/context`, and `request/header` events. |
| Timeline | Token usage bucketed by local hour and local day from event timestamps. |
| CPU, memory, load, per-core utilization | `node:os` tick deltas plus `process.cpuUsage()`, sampled every two seconds by the plugin Host. |
| Cost and budget | Calculated in the browser from the reported tokens and the editable rate card. **These are estimates, not billing records.** |

The browser never reads session files. The Host serves one owner-only, same-origin route:

```text
GET /api/local-usage-stats
```

## Cost model

The default rate card is a transparent assumption for DeepSeek Flash, in USD per one million tokens:

| Component | Default |
|---|---:|
| Uncached input | $0.28 |
| Cache read | $0.028 |
| Cache write | $0.28 |
| Output | $0.42 |

Open **Cost model & budget** at the bottom of the page to change any rate and the monthly budget. Settings are stored in `localStorage` on this device. The budget compares against month-to-date usage; the main cost KPI covers all time.

## Install

From this workspace:

```bash
dsh plugin --profile desktop add link:/Users/yzydalshmry/Desktop/BRIGHTAI/plugins/usage-stats
```

The CLI links the package and appends `@local/usage-stats` to the ordered `dsh.profile.bundles` list. If your CLI version only links dependencies, add that entry to the profile's `package.json` yourself. The bundle's `cordis.patch.yml` inserts the Host row.

When `plugin_manager` is available in a Creator-mode session, install the same directory with `action: install_bundle`, which performs both steps.

## Layout

| File | Role |
|---|---|
| `index.js` | Host half: session fold, timeline, CPU sampler, authenticated Fetch route. |
| `client.js` | Browser half: sidebar entry, dashboard, charts, conversation table, settings. |
| `cordis.patch.yml` | Inserts the Host plugin row. |
| `locale/*.json` | Plugin Manager title and description in English, Arabic, and Chinese. |
| `icon.svg` | Original dashboard icon. |

## Notes and limits

- A cold session is read once to seed its totals. Live sessions update from `session/event` without rescanning.
- Unreadable or corrupt logs are counted separately and do not break the dashboard.
- CPU percentages describe the machine and the Harness process, not the model provider.
- Cache-write tokens are usually zero for this provider; the chart and table show the component only when it occurs.
- The page refreshes every five seconds while visible and pauses polling when the tab is hidden.
