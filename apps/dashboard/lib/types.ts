/**
 * @brightai/dashboard — Shared types
 *
 * Local type aliases for common shapes. Re-exports from @brightai/db
 * so app code can import everything from one place.
 */

export type { Organization, User, Membership, Role, Policy, AIRequest } from '@brightai/db';
export type { Permission } from '@brightai/config';
export type { TenantContext } from './tenant';
export type { SessionContext } from './session';
