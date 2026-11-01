import { kernelHandler } from '../../../../server/kernel/http.mjs';
import { updateProduct } from '../../../../server/kernel/administration.mjs';
export const prerender = false;
export const PATCH = kernelHandler(updateProduct, true);
