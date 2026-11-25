import { KernelError } from '../kernel/core.mjs';

export async function readJsonObject(request, limit) {
  const mediaType = request.headers.get('Content-Type')?.split(';', 1)[0].trim().toLowerCase();
  if (mediaType !== 'application/json') throw new KernelError(415, 'INVALID_BODY', 'أرسل طلب JSON.');
  const reader = request.body?.getReader();
  if (!reader) throw new KernelError(400, 'INVALID_BODY', 'الطلب فارغ.');
  const chunks = [];
  let bytes = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > limit) {
        void reader.cancel().catch(() => {});
        throw new KernelError(413, 'BODY_TOO_LARGE', 'الطلب أكبر من الحد المسموح.');
      }
      chunks.push(value);
    }
    const body = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks)));
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
    return body;
  } catch (error) {
    if (error instanceof KernelError) throw error;
    throw new KernelError(400, 'INVALID_BODY', 'تعذر قراءة كائن JSON صالح.');
  } finally {
    reader.releaseLock();
  }
}

/** @template T
 * @param {import('zod').ZodType<T>} schema
 * @param {unknown} body
 * @returns {T}
 */
export function validateBody(schema, body) {
  const result = schema.safeParse(body);
  if (!result.success) throw new KernelError(400, 'INVALID_BODY', 'حقول الطلب أو قيمها غير صالحة.');
  return result.data;
}
