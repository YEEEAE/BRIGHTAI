import type {
  ChangeEvent,
  Dispatch,
  RefObject,
  SetStateAction,
  SyntheticEvent,
} from "react";

export type لهجةمحرر =
  | "رسمي ومهني"
  | "ودود وغير رسمي"
  | "تقني ودقيق"
  | "إبداعي ومرن"
  | "مخصص";

export type لغةمحرر = "العربية" | "الإنجليزية" | "تلقائي";

export type ملفمعرفةمحرر = {
  id: string;
  name: string;
  size: number;
  type: string;
  words: number;
  tokens: number;
  chunks: number;
  updatedAt: string;
  content?: string;
  chunksData?: string[];
};

export type رابطمحرر = {
  id: string;
  url: string;
  words: number;
  tokens: number;
  status: "غير مفحوص" | "جارٍ الجلب" | "جاهز" | "فشل";
  updatedAt: string;
  content?: string;
  chunksData?: string[];
};

export type شخصيةمحرر = {
  اسم: string;
  دور: string;
  خلفية: string;
  رسمية: number;
  إيجاز: number;
  إبداع: number;
  جدية: number;
  بساطة: number;
  تحية: string;
  عدمفهم: string;
  وداع: string;
  خطأ: string;
  خارجالنطاق: string;
};

export type قيمةمحررالشخصية = {
  وصفتوليد: string;
  الموجهالنظامي: string;
  اللهجة: لهجةمحرر;
  لغةالرد: لغةمحرر;
  قواعدالسلوك: string[];
  ملفاتالمعرفة: ملفمعرفةمحرر[];
  روابطالمعرفة: رابطمحرر[];
  نصالمعرفة: string;
  الشخصية: شخصيةمحرر;
  temperature: number;
  model: string;
  maxTokens: number;
};

export type خصائصمحررالشخصية = {
  value: قيمةمحررالشخصية;
  onChange: (patch: Partial<قيمةمحررالشخصية>) => void;
};

export type رسالةمعاينة = {
  id: string;
  role: "مستخدم" | "الوكيل";
  text: string;
  time: string;
};

export type حالةتحققالموجه = {
  valid: boolean;
  errors: string[];
};

export type احصاءاتالمعرفة = {
  words: number;
  tokens: number;
  sources: number;
  updatedAt: string;
};

export type وضعالتوليد = "generate" | "improve";

export type نوعتنسيق = "bold" | "italic" | "list";

export type حقلسمةالشخصية = "رسمية" | "إيجاز" | "إبداع" | "جدية" | "بساطة";

export type حقلنصالشخصية = "تحية" | "عدمفهم" | "وداع" | "خطأ" | "خارجالنطاق";

export type خصائصقسمالموجه = {
  value: قيمةمحررالشخصية;
  promptRef: RefObject<HTMLTextAreaElement | null>;
  tokenEstimate: number;
  promptValidation: حالةتحققالموجه;
  promptSegments: string[];
  variableOpen: boolean;
  suggestions: string[];
  generating: boolean;
  improving: boolean;
  onApplyFormat: (type: نوعتنسيق) => void;
  onSetFullscreen: Dispatch<SetStateAction<boolean>>;
  onPromptChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onPromptCursorChange: (event: SyntheticEvent<HTMLTextAreaElement>) => void;
  onChooseVariable: (variable: string) => void;
  onUpdateGenerateDescription: (value: string) => void;
  onGeneratePrompt: (mode: وضعالتوليد) => Promise<void>;
};
