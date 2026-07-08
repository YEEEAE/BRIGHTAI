/**
 * @brightai/dashboard — Sign-up page
 *
 * Phase 0: Clerk's catch-all sign-up component. Renders the standard
 * form (email + password + OAuth).
 *
 * Phase 1 will:
 *   - Add Company + Owner fields to the sign-up form (single-step
 *     org + owner creation via Clerk's `unsafeMetadata` or a custom
 *     flow).
 *   - Auto-create the Organization row + OWNER membership after
 *     the user verifies their email.
 */

import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return <SignUp />;
}
