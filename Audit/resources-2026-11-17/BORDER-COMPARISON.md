# Resource border comparison — 2026-11-17

## Scope and sequence
Created and built a separate MagicPath example before editing site CSS. Preserved the referenced component/revision.
- Project: 468267169743011840.
- Reference: Knowledge Center — Editorial Library, component 468267228362588160 / revision 468267228362588161.
- Example: Arabic Resources — Subtle Border Study, component 473476606594256896 / revision 473476606594256897. Remote build completed; both stored previews inspected.
- Example includes current/subtle toggle, three-resource selection, template/example display and local Blob downloads using actual resource files. Remote interaction testing was not performed; compilation and rendered preview verified.

## Comparison and decision
| Aspect | Reference/current treatment | Chosen treatment |
|---|---|---|
| Identity | Dark surfaces, purple accents, fine editorial separators | Preserved |
| Notice | Reference reader has a 3px purple right edge; resources had a 3px logical start edge | 1px frame in existing #554365 |
| Citation | Resources had a bright 3px start edge | Same quiet 1px frame |
| Hierarchy | Strong directional stripe competes with text | Text and notice surface retain emphasis; outline separates block |
| Scope | Reference is a broad editorial library | Prototype demonstrates only resource notice/citation refinement; no library redesign applied |

The frame is a visual judgment, not a measured claim about user comprehension. No user study performed. Made Good Designs lookup returned an unrelated music screen, which was not adopted.

## Implementation
src/styles/resources.css: notice and citation border only. Increased citation selector specificity to beat experience.css's inherited 2px logical border; other pages retain their existing treatment. No ignore/suppression added. No changes to content, URLs, resource versions, downloads or access requirements.

## Verification
Fresh isolated lockfile build PASS: 64 public pages; existing root dependency/Node mismatch unchanged. Chrome comparison at 390/1440 checks RTL, overflow and computed four-sided border widths on both elements across three resources; see border-browser.json. Before screenshots recreate the old border via temporary browser-only CSS, with the same final page content. Manual detector returned no findings before the specificity correction; diff check PASS. No publish, push or commit.
