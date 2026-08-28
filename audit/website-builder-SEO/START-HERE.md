# Start here

Fill in `PROJECT-INPUTS.md`, open the parent project folder in Codex, and paste the following prompt into a new task.

```text
Build the website described in website-builder-prompt-pack/PROJECT-INPUTS.md using the operating system in website-builder-prompt-pack/PROMPTS.md, the usage rules in website-builder-prompt-pack/HOW-TO-USE.md, and the required SEO integration in website-builder-prompt-pack/DATAFORSEO-SETUP.md.

This is a new, independent website project. Work only from this project folder and current public/connected evidence. Do not borrow content, code, claims, keywords, locations, imagery, or design decisions from unrelated folders or example websites.

BOOTSTRAP RULES

1. Read all four referenced files completely before acting. Treat PROJECT-INPUTS.md as owner-supplied intent, not verified proof.
2. Inspect the current folder. Preserve any existing work and report conflicts.
3. Do not paste or restate secrets. Do not perform a paid call, external write, account creation, deployment, DNS change, or publication without the specific approval required by PROMPTS.md.
4. Follow the phases in PROMPTS.md in order. Do not jump straight to code, copy, a sitemap, or a finished visual design.
5. Create the durable control files required by Prompt 0. Use them as the source of truth across future tasks.
6. Use this baseline structure for control artifacts:
   - docs/00-project-brief.md
   - docs/claims-matrix.md
   - docs/project-state.md
   - docs/decision-log.md
   - docs/approval-log.md
   - docs/research/
   - docs/seo/
   - docs/content/page-briefs/
   - docs/design/
   - docs/architecture/
   - docs/qa/
   - docs/analytics/
   - docs/operations/
   - research/data/
7. Do not create empty website-code folders merely to appear complete. Create the Astro or approved framework structure in Phase 6 after the sitemap, page briefs, and design system are approved.
8. Where PROJECT-INPUTS.md says unknown, keep it unknown unless the approved phase authorizes research or the owner supplies the answer.
9. Ask no more than three concise blocking questions at once. If an unanswered detail is reversible and does not affect business truth, claims, budget, architecture, conversion, or publication, make and record a reasonable assumption.
10. After the owner approves a phase, automatically read docs/project-state.md and select the next applicable prompt from PROMPTS.md. The owner should not have to paste every phase prompt manually.
11. DataForSEO through the official `dataforseo/mcp-server-typescript` server is mandatory for Phases 2 and 3. If it is missing or unauthenticated, stop at the Phase 2 gate with the setup path from DATAFORSEO-SETUP.md. Do not replace it with model memory, unsourced estimates, or another keyword provider.

STARTING ACTION

Run Prompt 0 now. Then assess PROJECT-INPUTS.md for missing information required by Prompt 1.

- If critical business identity, offer, audience, market, business model, or conversion information is missing, stop with the smallest set of blocking questions.
- If the inputs are sufficient, continue through Prompt 1 and create the project brief and claims matrix.
- Stop at the Prompt 1 approval gate. Do not begin tool checks, keyword research, design, or implementation yet.

Finish with the exact phase report required by Prompt 0 and tell me the single approval or correction response to give next.
```
