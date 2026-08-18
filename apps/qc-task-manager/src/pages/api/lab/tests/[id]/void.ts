import type { APIRoute } from 'astro';
import { isResponse, requireApiUser, requireCsrf } from '../../../../../lib/api-security';
import { setFlash } from '../../../../../lib/flash';
import { parsePositiveId, parseFormData, labTestVoidSchema } from '../../../../../lib/validation';
import { canVoidLabTest } from '../../../../../lib/permissions';
import { voidLabTest } from '../../../../../lib/lab/tests';

/**
 * POST /api/lab/tests/[id]/void — Test VOID action (PROMPT 42).
 *
 * Re-checks manager/admin permission, CSRF, validates mandatory reason with Zod,
 * executes atomic void transition inside transaction, and redirects with flash message.
 */
export const POST: APIRoute = async (context) => {
  const csrf = requireCsrf(context);
  if (csrf) return csrf;
  const auth = requireApiUser(context);
  if (isResponse(auth)) return auth;

  if (!canVoidLabTest(auth.role)) {
    setFlash(context, 'error', 'You do not have permission to void laboratory tests.');
    return context.redirect('/lab/tests');
  }

  const id = parsePositiveId(context.params.id);
  if (!id) {
    setFlash(context, 'error', 'Invalid test id.');
    return context.redirect('/lab/tests');
  }

  const form = await context.request.formData();
  const parsed = parseFormData(labTestVoidSchema, form);
  if (!parsed.ok) {
    setFlash(context, 'error', parsed.error);
    return context.redirect(`/lab/tests/${id}`);
  }

  try {
    const result = voidLabTest({ id: auth.id, role: auth.role }, id, parsed.data.reason);
    setFlash(context, 'success', `Test ${result.test_number} was voided.`);
  } catch (err) {
    setFlash(context, 'error', err instanceof Error ? err.message : 'Could not void this test.');
  }
  return context.redirect(`/lab/tests/${id}`);
};
