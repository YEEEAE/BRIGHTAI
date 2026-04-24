# Upstream `README.md`

المصدر: `forrestchang/andrej-karpathy-skills`

```md
# Karpathy-Inspired Claude Code Guidelines

> Check out my new project [Multica](https://github.com/multica-ai/multica) — an open-source platform for running and managing coding agents with reusable skills.
>
> Follow me on X: [https://x.com/jiayuan_jy](https://x.com/jiayuan_jy)

A single `CLAUDE.md` file to improve Claude Code behavior, derived from [Andrej Karpathy's observations](https://x.com/karpathy/status/2015883857489522876) on LLM coding pitfalls.

English | [简体中文](./README.zh.md)

## The Problems

From Andrej's post:

> "The models make wrong assumptions on your behalf and just run along with them without checking. They don't manage their confusion, don't seek clarifications, don't surface inconsistencies, don't present tradeoffs, don't push back when they should."
>
> "They really like to overcomplicate code and APIs, bloat abstractions, don't clean up dead code... implement a bloated construction over 1000 lines when 100 would do."
>
> "They still sometimes change/remove comments and code they don't sufficiently understand as side effects, even if orthogonal to the task."

## The Solution

Four principles in one file that directly address these issues:

- Think Before Coding
- Simplicity First
- Surgical Changes
- Goal-Driven Execution

## Install

**Option A: Claude Code Plugin (recommended)**

From within Claude Code, first add the marketplace:

```text
/plugin marketplace add forrestchang/andrej-karpathy-skills
```

Then install the plugin:

```text
/plugin install andrej-karpathy-skills@karpathy-skills
```

**Option B: CLAUDE.md (per-project)**

```bash
curl -o CLAUDE.md https://raw.githubusercontent.com/forrestchang/andrej-karpathy-skills/main/CLAUDE.md
```

## Using with Cursor

This repository includes a committed Cursor project rule at `.cursor/rules/karpathy-guidelines.mdc`.

See `CURSOR.md` for setup and reuse guidance.

## How to Know It's Working

- Fewer unnecessary changes in diffs
- Fewer rewrites due to overcomplication
- Clarifying questions come before implementation
- Clean, minimal PRs

## Customization

Merge these guidelines with project-specific rules instead of treating them as a replacement.

## Tradeoff Note

These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## License

MIT
```
