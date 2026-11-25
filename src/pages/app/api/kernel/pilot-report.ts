import { kernelHandler } from '../../../../server/kernel/http.mjs';
import { pilotReport } from '../../../../server/kernel/service.mjs';

export const prerender = false;
export const POST = kernelHandler(pilotReport, true);
