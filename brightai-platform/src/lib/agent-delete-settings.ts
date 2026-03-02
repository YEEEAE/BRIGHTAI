export type إعداداتحذفوكيل = {
  تأكيدمزدوج: boolean;
  تأكيدبالاسم: boolean;
  منعتلقائيعندوجودتنفيذات: boolean;
};

const STORAGE_KEY = "brightai_agent_delete_settings";

const الإعداداتالافتراضية: إعداداتحذفوكيل = {
  تأكيدمزدوج: true,
  تأكيدبالاسم: true,
  منعتلقائيعندوجودتنفيذات: false,
};

const normalize = (input: unknown): إعداداتحذفوكيل => {
  if (!input || typeof input !== "object") {
    return الإعداداتالافتراضية;
  }

  const row = input as Record<string, unknown>;
  return {
    تأكيدمزدوج:
      typeof row.تأكيدمزدوج === "boolean"
        ? row.تأكيدمزدوج
        : الإعداداتالافتراضية.تأكيدمزدوج,
    تأكيدبالاسم:
      typeof row.تأكيدبالاسم === "boolean"
        ? row.تأكيدبالاسم
        : الإعداداتالافتراضية.تأكيدبالاسم,
    منعتلقائيعندوجودتنفيذات:
      typeof row.منعتلقائيعندوجودتنفيذات === "boolean"
        ? row.منعتلقائيعندوجودتنفيذات
        : الإعداداتالافتراضية.منعتلقائيعندوجودتنفيذات,
  };
};

export const getAgentDeleteSettings = (): إعداداتحذفوكيل => {
  if (typeof window === "undefined") {
    return الإعداداتالافتراضية;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return الإعداداتالافتراضية;
    }
    return normalize(JSON.parse(raw));
  } catch {
    return الإعداداتالافتراضية;
  }
};

export const saveAgentDeleteSettings = (next: إعداداتحذفوكيل) => {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalize(next)));
};

type ConfirmDeleteParams = {
  name: string;
  executionCount?: number | null;
};

export const confirmAgentDeleteBySettings = ({
  name,
  executionCount = 0,
}: ConfirmDeleteParams): { ok: boolean; reason?: string } => {
  const settings = getAgentDeleteSettings();

  if (settings.منعتلقائيعندوجودتنفيذات && Number(executionCount || 0) > 0) {
    return {
      ok: false,
      reason: "تم منع حذف الوكيل لأن لديه تنفيذات سابقة. عطّل خيار المنع من إعدادات الأمان إن أردت المتابعة.",
    };
  }

  const firstConfirm = window.confirm(`هل تريد حذف الوكيل: ${name}؟`);
  if (!firstConfirm) {
    return { ok: false };
  }

  if (settings.تأكيدمزدوج) {
    const secondConfirm = window.confirm(
      "هذا حذف نهائي. سيتم حذف إعدادات الوكيل وسجل التنفيذ المرتبط به. هل تريد المتابعة؟"
    );
    if (!secondConfirm) {
      return { ok: false };
    }
  }

  if (settings.تأكيدبالاسم) {
    const typed = window.prompt(`اكتب اسم الوكيل للتأكيد النهائي:\n${name}`);
    if ((typed || "").trim() !== name.trim()) {
      return { ok: false, reason: "اسم الوكيل غير مطابق، تم إلغاء عملية الحذف." };
    }
  }

  return { ok: true };
};
