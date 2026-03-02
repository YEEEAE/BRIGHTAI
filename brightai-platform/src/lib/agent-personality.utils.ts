import type { قيمةمحررالشخصية } from "../types/agent-personality.types";

export const تقديرالرموز = (text: string): number => {
  if (!text.trim()) {
    return 0;
  }
  return Math.ceil(text.trim().length / 4);
};

export const عددالكلمات = (text: string): number => {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean).length;
};

export const حجمملف = (size: number): string => {
  if (size < 1024) {
    return `${size} بايت`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} ك.ب`;
  }
  return `${(size / (1024 * 1024)).toFixed(2)} م.ب`;
};

export const تقسيملنص = (text: string, chunkSize = 1200, overlap = 120): string[] => {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return [];
  }

  const chunks: string[] = [];
  let start = 0;
  while (start < normalized.length) {
    const end = Math.min(start + chunkSize, normalized.length);
    chunks.push(normalized.slice(start, end));
    if (end >= normalized.length) {
      break;
    }
    start = Math.max(0, end - overlap);
  }

  return chunks;
};

export const stripHtml = (html: string): string => {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

export const بناءرسالةوكيل = (text: string, value: قيمةمحررالشخصية): string => {
  const identity = value.الشخصية;
  const creativityRatio = value.temperature;
  const formalMode = identity.رسمية >= 55;
  const detailedMode = identity.إيجاز <= 45;

  const intro = identity.تحية.trim() || "مرحباً، يسعدني مساعدتك.";
  const base = [
    intro,
    `فهمت طلبك حول: ${text}`,
    detailedMode
      ? "سأعطيك خطوات مفصلة ومرتبة لتطبيق الحل مباشرة."
      : "سأعطيك إجابة مختصرة مع خطوة تنفيذ واضحة.",
    `مستوى الإبداع الحالي ${creativityRatio.toFixed(2)} والنبرة ${value.اللهجة}.`,
  ];

  if (formalMode) {
    base.push("سأحافظ على أسلوب مهني مباشر ومتزن.");
  } else {
    base.push("سأتحدث بنبرة ودية وواضحة مع الحفاظ على الدقة.");
  }

  if (value.قواعدالسلوك.length > 0) {
    base.push(`قاعدة سلوك مفعلة: ${value.قواعدالسلوك[0]}`);
  }

  if (creativityRatio > 1) {
    base.push("يمكنني اقتراح بدائل إضافية إذا رغبت بخيارات أكثر.");
  }

  const tail = identity.وداع.trim() || "إذا رغبت أتابع معك خطوة بخطوة.";
  base.push(tail);

  return base.join("\n");
};
