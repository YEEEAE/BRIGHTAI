// Publication assertions preserved from the existing pages; never inferred from Git/mtime/build.
// modified requires a substantive editorial event. Source access is not specialist review.
export interface EditorialRecord {
  revision?: string;
  published?: string;
  modified?: string;
  modificationEvent?: string;
  sourcesAccessed?: string;
  review?: { name: string; profileUrl: string; scope: string; reviewedOn: string;
    approval: { status: 'approved' | 'pending'; evidenceUrl: string; contentRevision: string } };
}
export const editorialRecords: Record<string, EditorialRecord> = {
  "protect-company-data-chatgpt": {
    "published": "2026-10-31"
  },
  "sdaia-generative-ai-guidelines": {
    "published": "2026-11-03"
  },
  "sdaia-ai-ethics-self-assessment": {
    "published": "2026-11-03"
  },
  "prompt-injection": {
    "published": "2026-10-31"
  },
  "sdaia-ai-adoption-framework": {
    "published": "2026-11-03"
  },
  "ai-governance-saudi": {
    "published": "2026-10-31",
    "modified": "2026-11-17",
    "modificationEvent": "إعادة تحرير الشرح والأمثلة والإحالات؛ Audit/guide-claims-2026-11-17/REPORT.md",
    "sourcesAccessed": "2026-11-17"
  },
  "iso-42001-saudi": {
    "published": "2026-11-03"
  },
  "saudi-ai-law-binding-vs-guidance": {
    "published": "2026-11-03"
  },
  "ai-use-policy-employees": {
    "published": "2026-10-31",
    "modified": "2026-11-17",
    "modificationEvent": "إعادة تحرير الشرح والأمثلة والإحالات؛ Audit/guide-claims-2026-11-17/REPORT.md",
    "sourcesAccessed": "2026-11-17"
  },
  "ai-risk-assessment": {
    "published": "2026-10-31",
    "modified": "2026-11-17",
    "modificationEvent": "إعادة تحرير الشرح والأمثلة والإحالات؛ Audit/guide-claims-2026-11-17/REPORT.md",
    "sourcesAccessed": "2026-11-17"
  },
  "saudi-ai-ethics-principles": {
    "published": "2026-11-03"
  },
  "pdpl-and-ai": {
    "published": "2026-11-03",
    "modified": "2026-11-17",
    "modificationEvent": "إعادة تحرير الشرح والأمثلة والإحالات؛ Audit/guide-claims-2026-11-17/REPORT.md",
    "sourcesAccessed": "2026-11-17"
  }
};
export const guideEditorial: EditorialRecord = {
  published: '2026-11-08', sourcesAccessed: '2026-11-08',
};
export function editorialFor(pathname: string): EditorialRecord {
  return editorialRecords[pathname.split('/').filter(Boolean).at(-1) ?? ''] ?? {};
}
export function approvedReview(record: EditorialRecord) {
  const review = record.review;
  if (!review || review.approval.status !== 'approved' || !review.name.trim() || !review.scope.trim()
    || !/^https:\/\//.test(review.profileUrl) || !/^https:\/\//.test(review.approval.evidenceUrl)
    || !record.revision || review.approval.contentRevision !== record.revision
    || !(record.modified ?? record.published)
    || !/^\d{4}-\d{2}-\d{2}$/.test(review.reviewedOn) || review.reviewedOn < (record.modified ?? record.published ?? '')) return undefined;
  return review;
}
export function formatEditorialDate(date: string) {
  return new Intl.DateTimeFormat('ar-SA', { calendar: 'gregory', numberingSystem: 'latn',
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));
}
