/**
 * @brightai/dashboard — /settings/security
 *
 * Phase 0: Clerk's UserProfile security tab.
 * Phase 1: link to our own session management UI (revoke devices).
 */

import { UserProfile } from '@clerk/nextjs';

export default function SecuritySettingsPage() {
  return <UserProfile routing="hash" />;
}
