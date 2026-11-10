import { kernelHandler } from '../../../../../server/kernel/http.mjs';
import { operatorListTrials } from '../../../../../server/kernel/trial-service.mjs';
export const prerender = false;
// Named operator channel. Authorization is an owner-provisioned row, not a token
// claim; a non-operator receives OPERATOR_REQUIRED and sees no tenant data.
export const GET = kernelHandler(operatorListTrials);
