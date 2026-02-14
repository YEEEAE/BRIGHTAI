import {
  Bot,
  Coins,
  Hash,
  MessageSquare,
  Rocket,
  Sparkles,
  Store,
  Upload,
  Wrench,
} from "lucide-react";
import type { خطوة, حالةالنموذج } from "../types/agent-builder.types";

export const WORKFLOW_STORAGE_KEY = "brightai_workflow_autosave";
export const WORKFLOW_UPDATED_EVENT = "brightai-workflow-updated";
export const DRAFT_STORAGE_PREFIX = "brightai_agent_builder_wizard_v2";

export const فئاتالوكلاء = [
  "خدمة العملاء",
  "تحليل البيانات",
  "إنشاء المحتوى",
  "الترجمة",
  "البرمجة والتطوير",
  "التسويق",
  "المبيعات",
  "الموارد البشرية",
  "أخرى (مخصصة)",
];

export const خياراتالنماذج = [
  { id: "llama-3.1-405b-reasoning", label: "جروك - لاما ٣٫١ ٤٠٥ مليار (الأقوى)" },
  { id: "llama-3.1-70b-versatile", label: "جروك - لاما ٣٫١ ٧٠ مليار (متوازن)" },
  { id: "llama-3.1-8b-instant", label: "جروك - لاما ٣٫١ ٨ مليار (الأسرع)" },
  { id: "mixtral-8x7b-32768", label: "جروك - ميكسترال ٨×٧" },
  { id: "gemma2-9b-it", label: "جروك - جيمّا٢ ٩ مليار" },
];

export const خياراتالايقونات = [
  { id: "دعم", label: "دعم", icon: MessageSquare },
  { id: "تحليل", label: "تحليل", icon: Hash },
  { id: "محتوى", label: "محتوى", icon: Sparkles },
  { id: "ترجمة", label: "ترجمة", icon: Upload },
  { id: "برمجة", label: "برمجة", icon: Wrench },
  { id: "تسويق", label: "تسويق", icon: Rocket },
  { id: "مبيعات", label: "مبيعات", icon: Coins },
  { id: "موارد", label: "موارد", icon: Bot },
  { id: "أعمال", label: "أعمال", icon: Store },
  { id: "افتراضي", label: "افتراضي", icon: Bot },
];

export const عناوينالخطوات = [
  { id: 1 as خطوة, title: "المعلومات الأساسية" },
  { id: 2 as خطوة, title: "إعداد الشخصية والسلوك" },
  { id: 3 as خطوة, title: "تصميم سير العمل" },
  { id: 4 as خطوة, title: "الإعدادات المتقدمة" },
  { id: 5 as خطوة, title: "الاختبار والنشر" },
];

export const الحالةالافتراضية: حالةالنموذج = {
  الاسم: "",
  الوصف: "",
  الفئة: "خدمة العملاء",
  فئةمخصصة: "",
  الايقونة: "افتراضي",
  صورةايقونة: "",
  اللون: "#22c55e",
  الوسوم: [],

  وصفمولد: "",
  الموجهالنظامي:
    "أنت وكيل ذكاء اصطناعي لمنصة برايت. قدّم إجابات عملية ومباشرة، واطرح أسئلة توضيحية عند نقص المعلومات، ثم اقترح خطوات قابلة للتنفيذ.",
  اللهجة: "رسمي ومهني",
  لغةالرد: "العربية",
  قواعدالسلوك: ["التزم بنطاق المهمة المحدد.", "قدّم أمثلة عملية عند الحاجة."],
  روابطالمعرفة: [],
  ملفاتالمعرفة: [],
  نصالمعرفة: "",
  الشخصية: {
    اسم: "وكيل Bright AI",
    دور: "مساعد أعمال ذكي",
    خلفية: "وكيل متخصص في دعم فرق الأعمال واتخاذ القرار.",
    رسمية: 70,
    إيجاز: 45,
    إبداع: 55,
    جدية: 75,
    بساطة: 50,
    تحية: "مرحباً، أنا جاهز لمساعدتك.",
    عدمفهم: "أحتاج تفاصيل أكثر حتى أقدم إجابة دقيقة.",
    وداع: "سعيد بخدمتك، ويمكنني المتابعة عند الحاجة.",
    خطأ: "حدث خطأ أثناء المعالجة وسأحاول من جديد.",
    خارجالنطاق: "هذا الطلب خارج نطاق الوكيل الحالي، هل تريد توجيهًا بديلًا؟",
  },

  وضعالسير: "متقدم",

  النموذج: "llama-3.1-70b-versatile",
  temperature: 0.7,
  maxTokens: 2200,
  topP: 0.95,
  frequencyPenalty: 0,
  presencePenalty: 0,

  حدتنفيذيومي: 200,
  حدتكلفةيومية: 120,
  timeoutSeconds: 90,
  retries: 1,

  عام: false,
  تسجيلالمحادثات: true,
  مشاركةمعالفريق: false,

  webhookUrl: "",
  webhookEvent: "الكل",
  webhookHeaders: [],
};
