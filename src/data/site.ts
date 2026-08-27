/**
 * BrightAI — Site-wide configuration data
 * Single source of truth for URLs, contact info, and brand settings.
 */

export const SITE = {
  name: 'BrightAI',
  nameAr: 'برايت أيه آي',
  tagline: 'Saudi AI Safety OS',
  taglineAr: 'نظام حماية الذكاء الاصطناعي السعودي',
  descriptionEn: 'BrightAI is a Saudi AI governance and safety platform for organizations in Saudi Arabia.',
  descriptionAr: 'BrightAI منصة سعودية لحوكمة وأمان الذكاء الاصطناعي للمؤسسات في المملكة العربية السعودية.',
  country: 'SA',
  market: 'Saudi Arabia',
  url: 'https://brightai.live',
  logo: '/assets/images/logo.png',
  locale: {
    ar: 'ar-SA',
    en: 'en-SA',
  },
  defaultLang: 'ar',
  googleTagId: 'G-8LLESL207Q',
  whatsapp: {
    number: '966538229013',
    url: 'https://wa.me/966538229013',
    message: {
      ar: 'مرحباً، أريد الاستفسار عن خدمات BrightAI',
      en: 'Hi, I want to inquire about BrightAI services',
    },
  },
  social: {
    official: [
      'https://x.com/brightai_sa',
      'https://www.linkedin.com/company/brightai-saudi/',
      'https://github.com/YEEEAE/BRIGHTAI',
    ],
    twitter: 'https://x.com/brightai_sa',
    linkedin: 'https://www.linkedin.com/company/brightai-saudi/',
    github: 'https://github.com/YEEEAE/BRIGHTAI',
  },
  // Verification/tracking IDs — empty until real verified values are provided.
  // Conditional rendering in BaseLayout ensures empty values are never emitted.
  // CHAMPION-03 (2026-07-30): CR number + founder object for E-E-A-T.
  // Footer renders crNumber conditionally (empty = hidden).
  crNumber: '7038771197',
  foundedYear: '2025',
  founder: {
    name: 'يزيد البديوي',
    nameEn: 'Yazeed Albadawy',
    familyName: 'البديوي',
    linkedIn: 'https://www.linkedin.com/in/yazeed-brightai',
    bio: 'المؤسس والرئيس التنفيذي لـ BrightAI — المنصة السعودية لحوكمة وأمان وامتثال الذكاء الاصطناعي.',
  },
  bingVerification: '',
  yandexVerification: '',
  googleVerification: '',
  clarityId: '',
  ogImage: '/assets/images/og/brightai-og-1200x630.png',
} as const;

export type SupportedLang = 'ar' | 'en';

export interface HreflangLink {
  lang: string;
  href: string;
}

export interface SEOProps {
  title: string;
  description: string;
  canonical: string;
  hreflang?: HreflangLink[];
  ogImage?: string;
  ogImageAlt?: string;
  jsonLd?: Record<string, unknown>;
}
