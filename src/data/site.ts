/**
 * BrightAI — Site-wide configuration data
 * Single source of truth for URLs, contact info, and brand settings.
 */

export const SITE = {
  name: 'BrightAI',
  nameAr: 'برايت أيه آي',
  tagline: 'Saudi AI Safety OS',
  taglineAr: 'نظام حماية الذكاء الاصطناعي السعودي',
  url: 'https://brightai.site',
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
    twitter: 'https://x.com/brightai_sa',
    linkedin: 'https://linkedin.com/company/brightai-saudi',
    github: 'https://github.com/YEEEAE/BRIGHTAI',
  },
  // Verification/tracking IDs — empty until real verified values are provided.
  // Conditional rendering in BaseLayout ensures empty values are never emitted.
  // CHAMPION-03 (2026-07-30): CR number + founder object for E-E-A-T.
  // CR placeholder '1010XXXXXX' — replace with real Commercial Registration
  // number from the owner. Footer renders it conditionally (empty = hidden).
  crNumber: '1010XXXXXX',
  foundedYear: '2025',
  founder: {
    name: 'يزيد الشريف',
    nameEn: 'Yazeed AlShareef',
    familyName: 'الشريف',
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