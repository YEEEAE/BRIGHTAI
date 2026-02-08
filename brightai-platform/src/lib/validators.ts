type ApiProvider = "groq" | "openai" | "anthropic" | "google" | "custom";

type WorkflowPayload = {
  nodes?: Array<{ id?: string; type?: string }>;
  edges?: Array<{ source?: string; target?: string }>;
};

// التحقق من البريد الإلكتروني
export const isValidEmail = (email: string) =>
  /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email);

// التحقق من قوة كلمة المرور
export const isValidPassword = (password: string) => {
  const rules = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
  ];
  return rules.every(Boolean);
};

// التحقق من صحة الرابط
export const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// التحقق من صيغة مفتاح API
export const isValidApiKey = (provider: ApiProvider, key: string) => {
  const patterns: Record<ApiProvider, RegExp> = {
    groq: /^gsk_[A-Za-z0-9_]{10,}$/,
    openai: /^sk-[A-Za-z0-9]{10,}$/,
    anthropic: /^sk-ant-[A-Za-z0-9-_]{10,}$/,
    google: /^AIza[0-9A-Za-z-_]{10,}$/,
    custom: /^.{10,}$/,
  };
  return patterns[provider]?.test(key) ?? false;
};

// التحقق من هيكل سير العمل
export const validateWorkflow = (workflow: WorkflowPayload) => {
  const errors: string[] = [];
  if (!workflow || !Array.isArray(workflow.nodes) || workflow.nodes.length === 0) {
    errors.push("سير العمل لا يحتوي على عقد.");
  }
  const hasInput = workflow.nodes?.some((node) => node.type === "input");
  const hasOutput = workflow.nodes?.some((node) => node.type === "output");
  if (!hasInput) {
    errors.push("يجب وجود عقدة إدخال واحدة على الأقل.");
  }
  if (!hasOutput) {
    errors.push("يجب وجود عقدة إخراج واحدة على الأقل.");
  }
  return { valid: errors.length === 0, errors };
};

// تنقية المدخلات لمنع حقن الشيفرات
export const sanitizeInput = (input: string) =>
  input.replace(/[<>"'`]/g, "").replace(/\s+/g, " ").trim();
