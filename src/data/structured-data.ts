import { brand } from './brand';

const site = 'https://brightai.live';

// The page's own Open Graph image, reused so the Article entity never advertises
// an image the page does not actually declare.
export const articleImage = {
  '@type': 'ImageObject',
  url: new URL(brand.logo, site).href,
  width: brand.width,
  height: brand.height,
};

// `published` must come from a real publication date (page frontmatter or the
// source file's creation date); it is never guessed.
export function articleStructuredData(headline: string, description: string, pathname: string,
  { published }: { published?: string } = {}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${new URL(pathname, site).href}#article`,
    url: new URL(pathname, site).href,
    headline,
    description,
    mainEntityOfPage: new URL(pathname, site).href,
    inLanguage: 'ar-SA',
    ...(published ? { datePublished: published } : {}),
    dateModified: '2026-10-31',
    image: articleImage,
    author: { '@type': 'Organization', '@id': `${site}/#organization`, name: 'BRIGHTAI', url: `${site}/about/` },
    publisher: {
      '@type': 'Organization',
      '@id': `${site}/#organization`,
      name: 'BRIGHTAI',
      url: `${site}/`,
      logo: { '@type': 'ImageObject', url: new URL(brand.logo, site).href },
    },
  };
}
