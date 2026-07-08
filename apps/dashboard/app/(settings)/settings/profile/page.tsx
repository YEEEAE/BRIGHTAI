/**
 * @brightai/dashboard — /settings/profile
 *
 * Phase 0: Clerk's UserProfile component (handles email, name, avatar).
 * Phase 1: add a custom form for locale + display preferences.
 */

import { UserProfile } from '@clerk/nextjs';

export default function ProfileSettingsPage() {
  return <UserProfile routing="hash" />;
}
