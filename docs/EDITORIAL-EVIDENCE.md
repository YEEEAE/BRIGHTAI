# Publication, source access and specialist review

`src/data/editorial.ts` owns the editorial record. Static articles resolve their slug there; each generated guide carries an `editorial` record in `knowledge-guides.ts`. `ArticleContext` and `articleStructuredData` consume that same record.

- `published`: original publication assertion preserved from the preceding source. Neither Git creation time nor a build is publication evidence. Correct it only with evidence of the actual event.
- `modified` + `modificationEvent`: a substantive editorial change with a traceable record. Template fixes, schema corrections, source access and review approval alone do not bump it. The four 2026-11-17 changes are evidenced by `Audit/guide-claims-2026-11-17/REPORT.md`. Earlier universal/equal-to-publication modification dates had no separate event and were removed, without assigning replacement dates.
- `sourcesAccessed`: when the cited sources were actually read. The twenty generated guides preserve the preceding source-access assertion of 2026-11-08; this task did not reread those external sources. Four revised guides retain the 2026-11-17 source-check event. Other guides say unknown, rather than inferring access from publication.
- `review`: specialist review, separate from editing and checking citations. No approved person is currently recorded.

## Recording a genuine review

The content owner must verify the person's identity, public profile and consent to attribution; inspect the approval evidence; and establish exactly which sections and version it covers. Do not infer qualifications from a legacy URL, biography or stock image. Only reference a publishable evidence URL; do not expose private correspondence.

Assign the record an explicit `revision`. Supply `review.name`, an HTTPS `profileUrl`, precise `scope`, actual ISO `reviewedOn`, and `approval` containing `status: 'approved'`, a real HTTPS `evidenceUrl`, and `contentRevision` matching the record. Change the revision on every substantive content change, even on the same day; stale approval then disappears. First-publication review does not require inventing `modified`. Pending/incomplete records never render a reviewer or reviewer schema. The program checks completeness and version matching; the owner verifies the underlying evidence's authenticity.

The visible block shows person, scope, review date and evidence together. `reviewedBy` and `lastReviewed` belong to the linked `WebPage`, not the Article. Source access has no fabricated `dateAccessed` schema property. The Article emits only supported publication/modification dates. See [Schema.org reviewedBy](https://schema.org/reviewedBy) and [Google Article documentation](https://developers.google.com/search/docs/appearance/structured-data/article).

## Publisher identity and legacy profiles

`organization.ts` reflects the owner's naming baseline in `docs/MASTER-PROJECT-BLUEPRINT.md` §00, and shares identity with about/trust and Article author/publisher. It asserts a public identity, not legal registration. No legal name, registration number, address, certification or external `sameAs` is inferred. The only site link is the owner's `https://brightai.live/`.

The three existing `/authors/` paths now have local explanatory replacements. The personal slug is preserved without treating it as proof of a name, position, qualification or authorship. No Person/ProfilePage or unverified contribution list is emitted. These local replacements do not remove the old deployed pages until an independently authorized deployment.
