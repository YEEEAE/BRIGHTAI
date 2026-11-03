export const plainText = (html) => html.replace(/<(script|style|svg|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, '').replace(/<[^>]*>/g, ' ').replace(/&(?:nbsp|amp|quot|lt|gt|#\d+|#x[\da-f]+);/gi, ' ').replace(/\s+/g, ' ').trim();
export function summarizeDocument(html) {
  const body = /<div[^>]*data-knowledge-content[^>]*>([\s\S]*?)<!--knowledge-content-end-->/.exec(html)?.[1] ?? html;
  const text = plainText(body);
  const headings = [...body.matchAll(/<h2\b([^>]*)>([\s\S]*?)<\/h2>/g)].map((match, index) => ({ id: /\bid="([^"]+)"/.exec(match[1])?.[1] ?? `document-heading-${index + 1}`, title: plainText(match[2]) })).filter(h => h.title !== 'في هذا الدليل');
  return { body, text, headings, minutes: Math.max(1, Math.ceil(text.split(/\s+/).filter(Boolean).length / 180)) };
}
