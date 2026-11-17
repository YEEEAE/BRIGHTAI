import { brand } from './brand';
import { organization } from './organization';
import { editorialFor, approvedReview, type EditorialRecord } from './editorial';

const site = 'https://brightai.live';

// The page's own Open Graph image, reused so the Article entity never advertises
// an image the page does not actually declare.
export const articleImage = {
  '@type': 'ImageObject',
  url: new URL(brand.logo, site).href,
  width: brand.width,
  height: brand.height,
};

// One record feeds both ArticleContext and JSON-LD. Never use build time or a fixed fallback.
export function articleStructuredData(headline: string, description: string, pathname: string,
  editorial: EditorialRecord = editorialFor(pathname)) {
  const review = approvedReview(editorial);
  const url = new URL(pathname, site).href;
  return {
    '@context': 'https://schema.org', '@type': 'Article', '@id': `${url}#article`,
    url, headline, description, mainEntityOfPage: {
      '@type': 'WebPage', '@id': url,
      ...(review ? { reviewedBy: { '@type': 'Person', name: review.name, url: review.profileUrl },
        lastReviewed: review.reviewedOn,
        description: `نطاق المراجعة: ${review.scope}`, citation: review.approval.evidenceUrl } : {}),
    },
    inLanguage: 'ar-SA',
    ...(editorial.published ? { datePublished: editorial.published } : {}),
    ...(editorial.modified && editorial.modificationEvent ? { dateModified: editorial.modified } : {}),
    image: articleImage, author: organization, publisher: organization,
  };
}
