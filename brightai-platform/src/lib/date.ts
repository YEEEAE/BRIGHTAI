import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import { APP_DEFAULT_LOCALE } from "../constants/app";

// تنسيق التاريخ وفق اللغة الافتراضية للتطبيق
export const formatShortDate = (date: Date) => {
  const locale = APP_DEFAULT_LOCALE.startsWith("ar") ? arSA : enUS;
  return format(date, "PPP", { locale });
};
