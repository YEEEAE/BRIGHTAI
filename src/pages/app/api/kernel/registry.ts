import { kernelHandler } from '../../../../server/kernel/http.mjs';
import { registryOperation } from '../../../../server/governance/persistent-registry.mjs';
export const prerender = false;
export const GET = kernelHandler((identity, workspace) => registryOperation(identity, workspace));
export const POST = kernelHandler(registryOperation, true);
