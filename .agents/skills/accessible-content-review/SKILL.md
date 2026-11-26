---
name: accessible-content-review
description: Use when creating, reviewing, structuring, or simplifying content so people using assistive technology or with varied cognitive and literacy needs can access it.
---

# Accessible Content: Structure, Review, and Rewrite

Use one of three modes: **structure** new content for accessible navigation; **review** existing content for barriers; or **rewrite** supplied content for plain language while preserving meaning. Keep the author's intent and factual accuracy, and distinguish content advice from technical conformance testing.

Use `accessibility-audit` for a whole-interface accessibility audit, and `accessibility-testing-strategy` to plan user or assistive-technology testing. This skill focuses on the content itself.

## 1. Choose the mode and scope

- **Structure:** specify document outline, landmarks, reading order, and accessible treatment for images, media, tables, and forms.
- **Review:** inspect supplied content and return prioritized, location-specific findings and fixes.
- **Rewrite:** clarify or simplify existing copy; preserve meaning, flag ambiguity, and show important changes.

Confirm the material, audience, purpose, and output needed. Ask a focused question only when missing context could alter meaning, reading level, terminology, or legal/technical interpretation.

## 2. Assess content and structure

Review the areas relevant to the material:

- **Headings and hierarchy:** headings describe their sections, hierarchy is logical, and scanning headings alone gives a useful outline.
- **Reading flow:** key information comes early; paragraphs and lists are scannable; the linear reading order makes sense.
- **Language:** vocabulary, sentence structure, jargon, abbreviations, and assumed knowledge fit the intended audience. Prefer plain language, but do not impose arbitrary sentence-length limits.
- **Links and actions:** link text is meaningful out of context; avoid vague labels such as “click here” when a descriptive label is possible.
- **Images and diagrams:** distinguish decorative, informative, functional, and complex images; provide appropriate alt-text strategy and extended description when necessary.
- **Tables and data:** use meaningful headers and captions; explain complex relationships; consider narrow-screen reading.
- **Forms and instructions:** use visible labels, group related questions, explain constraints, and associate errors with the relevant field.
- **Audio and video:** consider captions, transcripts, audio description, player controls, and text alternatives according to the media and audience.

Do not claim that a document or page is screen-reader accessible solely from its prose; implementation semantics and actual testing may be needed.

## 3. Structure new content

Specify:

- A descriptive page title and heading outline (normally one primary heading followed by nested section levels without skipped hierarchy).
- Required semantic regions or document structure appropriate to the platform; do not prescribe redundant landmarks without context.
- DOM/reading order that preserves meaning and does not depend on visual positioning.
- Alt-text purpose for each image type; decorative images should not add noise, and complex visuals may need a short label plus a longer explanation.
- Table captions and header relationships, and form labels, grouping, instructions, and error associations.
- Media alternatives and user-operable controls.

Provide exact copy when requested; otherwise provide a strategy or implementation requirement rather than inventing content.

## 4. Rewrite existing content

1. Identify the reader, task, core message, essential terms, and any regulated or safety-critical meaning.
2. Flag ambiguous or contradictory source material before silently resolving it.
3. Rewrite with familiar words, direct sentence structure, one main idea at a time, active voice where appropriate, and clear organization.
4. Preserve essential technical terms and define them when needed. Do not remove warnings, conditions, exceptions, or legal/medical meaning to make text shorter.
5. Make links descriptive and keep terminology consistent.
6. Present original and revised copy when useful or requested; summarize significant edits and flag meaning that needs subject-matter review.

Plain language is not childish language. Preserve the source voice unless it conflicts with comprehension, safety, or the user's requested tone.

## 5. Report review findings

For each finding, include location, barrier, who or what task is affected, severity/priority with rationale, recommended fix, and any dependency on design or implementation. Separate verified observations from assumptions. Suggested priority labels:

- **Blocking:** important information or task is inaccessible or materially misunderstood.
- **High:** substantial effort, confusion, or risk for a user group.
- **Improvement:** useful refinement with a viable workaround.

Avoid claiming universal accessibility or assigning compliance status from a content-only review.

## Deliverables by mode

- **Structure:** outline, semantic/landmark map, reading order, and alt-text/table/form/media strategies.
- **Review:** concise summary and prioritized findings with locations and fixes.
- **Rewrite:** revised content, essential meaning preserved, and notable changes or unresolved meaning risks.

## Final checks

- The content's audience, task, and scope are clear.
- Headings, links, and instructions remain meaningful when scanned or read linearly.
- Simplification has not removed essential qualifications or altered intent.
- Image, table, form, and media needs are addressed where present.
- Technical semantics and runtime behavior are not presented as verified unless tested.
