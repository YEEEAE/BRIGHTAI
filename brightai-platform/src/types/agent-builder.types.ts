import type {
  قيمةمحررالشخصية,
  رابطمحرر,
  ملفمعرفةمحرر,
  شخصيةمحرر,
} from "../components/agent/AgentPersonalityEditor";

export type خطوة = 1 | 2 | 3 | 4 | 5;
export type وضعسير = "بسيط" | "متقدم";
export type لهجة = قيمةمحررالشخصية["اللهجة"];
export type لغةرد = قيمةمحررالشخصية["لغةالرد"];
export type حدثويبهوك = "عند النجاح" | "عند الفشل" | "الكل";
export type حالةحفظ = "غير محفوظ" | "جارٍ الحفظ..." | "تم الحفظ" | "تعذر الحفظ";
export type نوعحفظ = "مسودة" | "تفعيل" | "سوق";

export type ترويسةويبهوك = {
  id: string;
  key: string;
  value: string;
};

export type ملفمعرفة = ملفمعرفةمحرر;
export type رابطمصدر = رابطمحرر;

export type بياناتنموذج = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  workflow: unknown;
  settings: Record<string, unknown> | null;
  tags: string[] | null;
};

export type رسالةاختبار = {
  id: string;
  role: "مستخدم" | "الوكيل";
  text: string;
  createdAt: string;
};

export type حالةنظام = {
  apiConnected: boolean;
  promptReady: boolean;
  workflowReady: boolean;
  warnings: string[];
};

export type حالةالنموذج = {
  الاسم: string;
  الوصف: string;
  الفئة: string;
  فئةمخصصة: string;
  الايقونة: string;
  صورةايقونة: string;
  اللون: string;
  الوسوم: string[];

  وصفمولد: string;
  الموجهالنظامي: string;
  اللهجة: لهجة;
  لغةالرد: لغةرد;
  قواعدالسلوك: string[];
  روابطالمعرفة: رابطمصدر[];
  ملفاتالمعرفة: ملفمعرفة[];
  نصالمعرفة: string;
  الشخصية: شخصيةمحرر;

  وضعالسير: وضعسير;

  النموذج: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;

  حدتنفيذيومي: number;
  حدتكلفةيومية: number;
  timeoutSeconds: number;
  retries: number;

  عام: boolean;
  تسجيلالمحادثات: boolean;
  مشاركةمعالفريق: boolean;

  webhookUrl: string;
  webhookEvent: حدثويبهوك;
  webhookHeaders: ترويسةويبهوك[];
};

export type ملخصسير = {
  nodes: number;
  edges: number;
  sizeKb: number;
  raw: Record<string, unknown> | null;
};

export type نسخةمسودة = {
  agentId: string | null;
  form: حالةالنموذج;
  lastSavedAt: string;
  step?: خطوة;
  workflow?: Record<string, unknown> | null;
};

export type حقلمسودةنصي = "الاسم" | "الوصف" | "فئةمخصصة";
