# How to use the universal SEO website prompts

This guide explains the practical workflow. You do not paste every prompt at once. You use one project folder, establish the operating rules once, and then run one numbered phase at a time.

## What you need before starting

- the current Codex desktop app or a comparable research and coding agent;
- a local project folder opened in Codex;
- your real business facts, offer, market, and preferred conversion action;
- a DataForSEO account and the official MCP server configured according to [DATAFORSEO-SETUP.md](DATAFORSEO-SETUP.md); this is required for measured keyword, SERP, competitor, and backlink research;
- a hosting account such as Cloudflare before the deployment phase;
- optional component-reference tools such as 21st.dev;
- image or video generation access only if the approved design requires generated media;
- a willingness to approve important business, SEO, design, and publishing decisions.

Do not paste API keys, passwords, private customer data, or payment details into a prompt. Configure credentials through the relevant app, CLI, environment variable, or MCP connection.

The SEO phases must not proceed without a working DataForSEO MCP connection. Browsing can supply official local facts and qualitative context, but it cannot replace measured DataForSEO evidence.

## The model setting to use

Use the strongest research and coding model available to you. The workflow is intentionally model-agnostic: durable project files, bounded tool use, approval gates, and observable acceptance tests matter more than a specific model label.

Use the normal/default reasoning setting for most phases. If the app exposes reasoning levels, this is a practical allocation:

| Work | Suggested effort |
| --- | --- |
| Filling a brief, small copy edits, mechanical updates | Medium |
| Keyword synthesis, page architecture, schema, final QA | High |
| A difficult conflict, migration, or final quality review | xHigh |
| The hardest quality-first audit where time and cost matter less | Max or Pro |

More reasoning is not automatically better. Start at medium or high and increase it only when the result misses a difficult requirement.

## The four kinds of text in the prompt library

The library contains four different things:

1. **The master variable sheet** is completed once and reused throughout the project.
2. **Instructions for you** explain when to use a prompt and what to prepare. Do not paste these.
3. **The operating contract** is pasted once at the beginning of a new Codex task.
4. **A numbered phase prompt** is pasted only when you are ready to do that phase.

Text inside `<angle brackets>` is a placeholder. Replace it before pasting. If a value is genuinely unknown, write `unknown—must be researched or approved`; do not guess.

## The exact workflow

### 1. Open the project

Open or create the website project folder in Codex. Keep this starter pack, research, code, and decision records in that folder.

Copy the master project variable sheet from the prompt library into `docs/00-project-brief.md` and fill it in. These values make the same prompts usable for a local provider, referral business, professional service, SaaS product, ecommerce store, or marketplace.

### 2. Start a fresh task

Select your strongest suitable model. Fill in the master project variable sheet at the top of the prompt library, then paste **Prompt 0: establish the operating contract**.

GPT should inspect the folder and create or update:

- `docs/project-state.md` — current phase, completed work, blockers, and next action;
- `docs/decision-log.md` — important decisions and their evidence;
- `docs/approval-log.md` — what you approved, rejected, or deferred.

Read its summary. If the rules are correct, reply:

```text
APPROVE OPERATING CONTRACT
```

If something is wrong, reply:

```text
REVISE OPERATING CONTRACT: <state the correction>
```

### 3. Paste one phase prompt

Start with Prompt 1. Replace every placeholder, paste the entire code block, and let GPT complete the allowed work.

Do not paste Prompt 2 while Prompt 1 is still running. Each prompt ends with a decision gate so the project does not silently move past a business decision.

### 4. Review the phase report

At the end of a phase, GPT should report:

- outcome;
- evidence and source files;
- files changed;
- validation performed and exact result;
- assumptions and unresolved risks;
- the decision it needs from you;
- the next recommended prompt.

Check the actual artifact or website preview, not only GPT's summary.

### 5. Give one clear approval response

Use one of these commands:

```text
APPROVE PHASE <number>
```

```text
APPROVE PHASE <number> WITH CHANGES:
- <change 1>
- <change 2>
```

```text
REVISE PHASE <number>:
- Problem: <what is wrong>
- Evidence: <what you observed>
- Required result: <what must be true>
```

```text
HOLD PHASE <number>. Do not continue until I provide <missing decision or evidence>.
```

The approval must be written to `docs/approval-log.md`. A casual “looks good” in an old task is too easy to lose.

### 6. Continue to the next phase

After approval, paste the next prompt. GPT should read the durable project files before acting, so you can safely use a new task if the current one has become long or confusing.

## When to use a new Codex task

Start a new task when:

- the previous task has become very long;
- you are moving from research to implementation;
- you want an independent QA review;
- the model appears to be relying on stale chat context;
- another person is taking over the project.

In the new task, paste Prompt 0 again and add:

```text
This is a continuation. Treat the workspace files—not my summary—as the source of truth. Reconstruct current state from docs/project-state.md, docs/decision-log.md, docs/approval-log.md, the approved page map, and the current code. Report any conflict before changing files.
```

## How to attach context correctly

Prefer file paths and saved artifacts over pasting hundreds of lines into chat. A good phase request says:

```text
Read docs/00-project-brief.md, docs/claims-matrix.md, and docs/seo/page-map.md before acting.
```

Attach screenshots when visual judgment is required. Give GPT the live or local URL when it must inspect a page. If you provide a report, CSV, PDF, image, or video, state exactly what decision that file should inform.

Do not say only “make it better.” State the observed problem and the acceptance test:

```text
On a 390 px viewport, the service-card heading wraps to four lines and pushes the CTA below the visible card. Keep the approved typography and card style, but make every heading fit within three lines and confirm the result at 390 px and 1440 px.
```

## What GPT may do without asking

Under the operating contract, GPT may normally:

- read files and inspect the current project;
- browse public sources needed for the approved phase;
- edit in-scope local files when the phase asks for implementation;
- run non-destructive checks, builds, previews, and audits;
- make small reversible implementation decisions consistent with approved artifacts;
- update project-state and decision records.

It must stop before:

- a paid call above the approved budget;
- publishing, deployment, DNS changes, or other external writes unless that phase explicitly authorizes them;
- deleting important data or making destructive changes;
- inventing or upgrading a business claim;
- expanding into new pages, markets, integrations, or scope that you did not approve;
- choosing between alternatives that would materially change the business or user journey.

## How to judge an answer

Do not judge a phase by how polished the prose sounds. Approve it only if:

- it used the required sources;
- facts, inferences, and recommendations are distinguishable;
- the requested artifact exists in the project;
- important unknowns are visible rather than guessed;
- the output matches the required structure;
- validation actually ran;
- the decision gate is clear;
- the next phase depends on an approved result, not an assumption.

## Common mistakes

### Pasting all prompts at once

This removes the approval gates and makes mistakes expensive. Run one phase at a time.

### Leaving placeholders unresolved

Search for `<` in the prompt before pasting. Replace unknown values with an explicit unknown status.

### Approving only in chat

Require GPT to record approvals in the project. This makes the website reproducible and auditable.

### Asking for research and implementation together

Research should determine the page map. The approved page map should determine the build. Mixing them encourages GPT to rationalize pages after creating them.

### Treating a build as proof

`npm run build` proves that the project compiled. It does not prove the business claims, layout, accessibility, live forms, schema eligibility, or production URL are correct.

### Giving unlimited external authority

Allow only the external action needed in the current phase. Searching 21st.dev is different from installing a component; creating a Cloudflare preview is different from changing the production domain.

## If GPT goes off course

Use the correction prompt at the end of the prompt library. Give it the expected result, the observed result, and the authoritative artifact. Ask it to diagnose before changing files when the cause is uncertain.

## Recommended phase order

1. Operating contract
2. Business truth and claims
3. Tool connection checks
4. SEO research plan, bounded execution, and keyword clustering
5. Page architecture approval, page briefs, and differentiation plan
6. Design-reference research, direction selection, homepage experience, and image family
7. Astro foundation, one template page, remaining content, and optional CMS
8. Optional signature interaction: concept, storyboard, media QA, and implementation
9. Technical SEO and truthful structured data
10. Production accessibility/performance QA, lead handling, and measurement
11. Deployment
12. Live acceptance and post-launch plan

Do not skip the business truth, page architecture, or live acceptance phases. Those are the points where a visually impressive website most often becomes misleading, thin, or operationally incomplete.
