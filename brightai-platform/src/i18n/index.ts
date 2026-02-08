import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ar from "./ar.json";
import en from "./en.json";

const defaultLocale = process.env.REACT_APP_DEFAULT_LOCALE || "ar-SA";
const language = defaultLocale.startsWith("ar") ? "ar" : "en";

// تهيئة الترجمة مع اللغة العربية كلغة أساسية
i18n.use(initReactI18next).init({
  resources: {
    ar: { translation: ar },
    en: { translation: en },
  },
  lng: language,
  fallbackLng: "ar",
  interpolation: {
    escapeValue: false,
  },
});

export const setDocumentDirection = (lang: string) => {
  // ضبط لغة المستند والاتجاه للمحاذاة الصحيحة
  const isArabic = lang.startsWith("ar");
  document.documentElement.lang = isArabic ? "ar" : "en";
  document.documentElement.dir = isArabic ? "rtl" : "ltr";
};

export default i18n;
