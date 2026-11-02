const site = 'https://brightai.live';

export function articleStructuredData(headline: string, description: string, pathname: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    mainEntityOfPage: new URL(pathname, site).href,
    inLanguage: 'ar-SA',
    publisher: {
      '@type': 'Organization',
      name: 'BRIGHTAI',
      url: `${site}/`,
      logo: { '@type': 'ImageObject', url: new URL('/images/brightai-logo.webp', site).href },
    },
  };
}
