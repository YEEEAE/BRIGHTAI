import { format as formatDateFn } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import { APP_DEFAULT_LOCALE } from "../constants/app";

// دمج أصناف تايلويند مع تجاهل القيم الفارغة
export const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

// تنسيق التاريخ مع دعم العربية
export const formatDate = (date: Date | string | number, format = "PPP") => {
  const value = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  const locale = APP_DEFAULT_LOCALE.startsWith("ar") ? arSA : enUS;
  return formatDateFn(value, format, { locale });
};

// تنسيق الأرقام حسب اللغة
export const formatNumber = (value: number, locale = APP_DEFAULT_LOCALE) =>
  new Intl.NumberFormat(locale).format(value);

// تنسيق العملة
export const formatCurrency = (
  amount: number,
  currency = "SAR",
  locale = APP_DEFAULT_LOCALE
) =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);

// اختصار النص مع إضافة نقاط
export const truncateText = (text: string, length = 120) => {
  if (!text || text.length <= length) {
    return text;
  }
  return `${text.slice(0, length).trim()}...`;
};

// توليد معرف فريد بسيط
export const generateId = () =>
  `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

// تأخير زمني
export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// تنفيذ مؤجل
export const debounce = <T extends (...args: any[]) => void>(fn: T, delay = 300) => {
  let timer: number | undefined;
  return (...args: Parameters<T>) => {
    if (timer) {
      window.clearTimeout(timer);
    }
    timer = window.setTimeout(() => fn(...args), delay);
  };
};

// تنفيذ محدود بالزمن
export const throttle = <T extends (...args: any[]) => void>(fn: T, delay = 300) => {
  let lastTime = 0;
  let timer: number | undefined;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = delay - (now - lastTime);
    if (remaining <= 0) {
      lastTime = now;
      fn(...args);
    } else if (!timer) {
      timer = window.setTimeout(() => {
        lastTime = Date.now();
        timer = undefined;
        fn(...args);
      }, remaining);
    }
  };
};
