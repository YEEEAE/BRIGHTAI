/**
 * @brightai/dashboard — Sign-in page
 *
 * Phase 0: Clerk's catch-all sign-in component. Renders the standard
 * Clerk form (email + password + OAuth + passkey, based on Clerk
 * dashboard config).
 *
 * Phase 1 will replace this with a custom sign-in flow that includes
 * the organization picker for users who belong to multiple tenants.
 */

import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return <SignIn />;
}
