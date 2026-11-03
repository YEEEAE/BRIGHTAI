import { kernelHandler } from '../../../../server/kernel/http.mjs';
import { updateProduct } from '../../../../server/kernel/administration.mjs';
export const prerender = false;
// The product toggle accepts only FOUNDATION/ENABLED/DISABLED and a version.
// It never accepts a trial, subscription, perpetual, or on-premise licence field;
// those decisions are operator-owned and require their own approval path.
export const PATCH = kernelHandler(updateProduct, true);
