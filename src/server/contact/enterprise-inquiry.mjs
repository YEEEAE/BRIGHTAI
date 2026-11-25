import { hasTrustedApiOrigin } from '../api/origin.mjs';
import { readJsonObject, validateBody } from '../api/json.mjs';

import { enterpriseInquirySchema } from '../api/request-schemas.mjs';

function relayConfig() {
  const token = process.env.BRIGHTAI_INQUIRY_RELAY_TOKEN;
  try {
    const url = new URL(process.env.BRIGHTAI_INQUIRY_RELAY_URL);
    if (url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash && token) {
      return { url, token };
    }
  } catch {
    // The static contact channels remain available without relay configuration.
  }
  return null;
}

const json = (body, status = 200) => Response.json(body, {
  status,
  headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' },
});

export function inquiryAvailability() {
  return json({ available: Boolean(relayConfig()) });
}

export async function submitInquiry(request) {
  if (!hasTrustedApiOrigin(request)) return json({}, 403);
  const config = relayConfig();
  if (!config) return json({}, 503);

  let inquiry;
  try {
    inquiry = validateBody(enterpriseInquirySchema, await readJsonObject(request, 9_000));
  } catch (error) {
    return json({}, error.status ?? 400);
  }

  try {
    const relay = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.token}`,
        'Idempotency-Key': inquiry.submissionId,
      },
      body: JSON.stringify(inquiry),
      signal: AbortSignal.timeout(8_000),
      redirect: 'error',
    });
    if ([409, 429].includes(relay.status)) {
      await relay.body?.cancel();
      return json({}, relay.status);
    }
    if (![200, 201].includes(relay.status)) {
      await relay.body?.cancel();
      return json({}, 503);
    }
    const receipt = await readJsonObject(relay, 1024);
    if (receipt.status !== 'received' || receipt.submissionId !== inquiry.submissionId) return json({}, 503);
    return json({ status: 'received', submissionId: inquiry.submissionId }, 201);
  } catch {
    return json({}, 503);
  }
}
