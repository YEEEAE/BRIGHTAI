/**
 * cities.ts — Saudi Economic Cities metadata & LocalBusiness schema helpers.
 * Covers the 6 primary Saudi economic hubs: Riyadh, Jeddah, Dammam, Khobar, Mecca, Madinah.
 */

export interface SaudiCityData {
  slug: string;
  cityAr: string;
  cityEn: string;
  regionAr: string;
  regionEn: string;
  geoLat: number;
  geoLng: number;
  wikidataId: string;
  primarySectorSlug: string;
  landingHref: string;
  description: string;
}

export const CITIES: Record<string, SaudiCityData> = {
  riyadh: {
    slug: 'riyadh',
    cityAr: 'الرياض',
    cityEn: 'Riyadh',
    regionAr: 'منطقة الرياض',
    regionEn: 'Riyadh Region',
    geoLat: 24.7136,
    geoLng: 46.6753,
    wikidataId: 'Q3674',
    primarySectorSlug: 'banking-ai-governance',
    landingHref: '/solutions/banking-ai-governance/riyadh/',
    description: 'خدمات حوكمة الذكاء الاصطناعي للبنوك والمؤسسات المالية في الرياض (المقر الرئيسي).',
  },
  jeddah: {
    slug: 'jeddah',
    cityAr: 'جدة',
    cityEn: 'Jeddah',
    regionAr: 'منطقة مكة المكرمة',
    regionEn: 'Makkah Region',
    geoLat: 21.4858,
    geoLng: 39.1925,
    wikidataId: 'Q39547',
    primarySectorSlug: 'healthcare-ai-governance',
    landingHref: '/solutions/healthcare-ai-governance/jeddah/',
    description: 'خدمات حوكمة الذكاء الاصطناعي للمستشفيات والمنشآت الصحية في جدة.',
  },
  dammam: {
    slug: 'dammam',
    cityAr: 'الدمام',
    cityEn: 'Dammam',
    regionAr: 'المنطقة الشرقية',
    regionEn: 'Eastern Province',
    geoLat: 26.4207,
    geoLng: 50.0888,
    wikidataId: 'Q41630',
    primarySectorSlug: 'government-ai-governance',
    landingHref: '/solutions/government-ai-governance/dammam/',
    description: 'خدمات حوكمة الذكاء الاصطناعي للجهات الحكومية في الدمام والمنطقة الشرقية.',
  },
  khobar: {
    slug: 'khobar',
    cityAr: 'الخبر',
    cityEn: 'Khobar',
    regionAr: 'المنطقة الشرقية',
    regionEn: 'Eastern Province',
    geoLat: 26.2794,
    geoLng: 50.2083,
    wikidataId: 'Q810482',
    primarySectorSlug: 'banking-ai-governance',
    landingHref: '/solutions/banking-ai-governance/khobar/',
    description: 'خدمات حوكمة الذكاء الاصطناعي للبنوك والمؤسسات المالية في الخبر.',
  },
  mecca: {
    slug: 'mecca',
    cityAr: 'مكة المكرمة',
    cityEn: 'Mecca',
    regionAr: 'منطقة مكة المكرمة',
    regionEn: 'Makkah Region',
    geoLat: 21.3891,
    geoLng: 39.8579,
    wikidataId: 'Q35484',
    primarySectorSlug: 'healthcare-ai-governance',
    landingHref: '/solutions/healthcare-ai-governance/mecca/',
    description: 'خدمات حوكمة الذكاء الاصطناعي للمستشفيات والمنشآت الصحية في مكة المكرمة.',
  },
  madinah: {
    slug: 'madinah',
    cityAr: 'المدينة المنورة',
    cityEn: 'Madinah',
    regionAr: 'منطقة المدينة المنورة',
    regionEn: 'Madinah Region',
    geoLat: 24.4686,
    geoLng: 39.6142,
    wikidataId: 'Q334084',
    primarySectorSlug: 'government-ai-governance',
    landingHref: '/solutions/government-ai-governance/madinah/',
    description: 'خدمات حوكمة الذكاء الاصطناعي للجهات الحكومية في المدينة المنورة.',
  },
};
