import { brand } from './brand';

const site = 'https://brightai.live';

export function articleStructuredData(headline: string, description: string, pathname: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${new URL(pathname, site).href}#article`,
    url: new URL(pathname, site).href,
    headline,
    description,
    mainEntityOfPage: new URL(pathname, site).href,
    inLanguage: 'ar-SA',
    dateModified: '2026-10-31',
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
