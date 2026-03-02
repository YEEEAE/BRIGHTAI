import type { VariableOption } from "../types/node-editor.types";

export const variableOptions: VariableOption[] = [
  { key: "userMessage", label: "رسالة المستخدم", token: "رسالة_المستخدم" },
  { key: "last_output", label: "آخر مخرجات", token: "آخر_مخرجات" },
  { key: "company", label: "اسم الشركة", token: "اسم_الشركة" },
  { key: "plan", label: "الخطة الحالية", token: "الخطة" },
];

export const templateSuggestions = [
  "قدم ملخصاً تنفيذياً عن الطلب التالي: {{رسالة_المستخدم}}",
  "صغ تقريراً مختصراً مع توصيات قابلة للتنفيذ بناءً على {{آخر_مخرجات}}",
  "أعد صياغة المدخل بأسلوب رسمي لإرساله للإدارة العليا.",
];

export const modelLabelMap: Record<string, string> = {
  "llama-3.1-405b-reasoning": "لاما ٤٠٥ استدلال",
  "llama-3.1-70b-versatile": "لاما ٧٠ متعدد",
  "llama-3.1-8b-instant": "لاما ٨ سريع",
  "mixtral-8x7b-32768": "ميكسترال ٨×٧بي",
  "gemma2-9b-it": "جيما ٢",
};

export const actionLabelMap: Record<string, string> = {
  http: "نداء ويب",
  database: "قاعدة بيانات",
  transform: "تحويل بيانات",
  compute: "حساب داخلي",
};

export const outputLabelMap: Record<string, string> = {
  text: "نص",
  json: "جيسون",
  file: "ملف",
  webhook: "ويب هوك",
};
