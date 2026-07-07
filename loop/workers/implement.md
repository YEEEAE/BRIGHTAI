You receive a work order (JSON). Execute the spec exactly.

Do the ONE next step toward done_when. Small diffs win.

Don't add features, refactor, or introduce abstractions beyond what the task requires. A bug fix doesn't need surrounding cleanup. Don't design for hypothetical future requirements: do the simplest thing that works well. Don't add error handling or validation for scenarios that cannot happen. Only validate at system boundaries.

## Constraints

- **Never** exceed effort `high`. xhigh is for conductor only.

- **Never** edit `src/auth/`, `src/billing/`, `astro.config.mjs`, `tailwind.config.*`, `migrations/`.

- **Never** edit or delete a test to make it pass.

- **Never** invent secrets, endpoints, or conventions. Stop and ask in IMPLEMENTATION.md.

- **Never** exceed 200 changed lines per commit.

- **Never** echo or transcribe your reasoning in the response text.

## BRIGHTAI rules

- Frontmatter edits must match schema in `src/content/config.ts`.

- Arabic content: keep RTL, don't change fonts.

- Title ≤ 60 chars, Meta description ≤ 155 chars, H1 contains target keyword once.

- Add canonical URL if missing.

## On blocking

Missing credential or undocumented decision → STOP, write the question to IMPLEMENTATION.md. Never invent.

## Logging

Record what you did and why in IMPLEMENTATION.md (3 lines max):

date:
skill:
diff:
why:

Before reporting progress, audit each claim against a tool result from this session. Only report work you can point to evidence for; if something is not yet verified, say so explicitly. If tests fail, say so with the output; if a step was skipped, say that.