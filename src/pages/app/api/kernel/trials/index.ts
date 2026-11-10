import { kernelHandler } from '../../../../../server/kernel/http.mjs';
import { requestTrial } from '../../../../../server/kernel/trial-service.mjs';
import { trialLifecycle } from '../../../../../server/kernel/trial.mjs';
import { transaction } from '../../../../../server/kernel/db.mjs';
import { tenantGuard } from '../../../../../server/kernel/service.mjs';
export const prerender = false;
// A trial request is an eligibility request, not an approval or an activation.
// The response always says activation is closed until product readiness exists.
export const GET = kernelHandler(async (identity, workspace) => {
  return transaction(async db => {
    const scope = await tenantGuard(identity, workspace, db);
    if (!scope.tenant) return { configured: false, state: 'NO_WORKSPACE', lifecycle: null, activationClosed: true };
    return { configured: true, lifecycle: await trialLifecycle(db, scope.tenant.tenant_id), activationClosed: true };
  });
});
export const POST = kernelHandler(requestTrial, true);
