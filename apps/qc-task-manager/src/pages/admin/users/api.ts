// POST /admin/users/api — admin user-management actions.
//
// Dispatches on the `action` form field:
//   create          → create a new user (username, full_name, password, role, can_create_tasks)
//   toggle_active   → activate/deactivate a user (user_id, value 0|1)
//   toggle_create   → flip can_create_tasks (user_id, value 0|1)
//   reset_password  → set a new password (user_id, password)
//
// Every request ends in a redirect back to /admin/users with a one-shot flash
// message. The middleware has already run the /admin guard; this handler
// re-checks PERMISSIONS.canManageUsers for defense in depth. All validation
// and safety rules (self-deactivation, username uniqueness, min password length)
// live in src/lib/users.ts.

import type { APIRoute } from 'astro';
import { getCurrentUser } from '../../../lib/session';
import { setFlash } from '../../../lib/flash';
import { PERMISSIONS } from '../../../lib/permissions';
import {
  createUser,
  resetPassword,
  setCanCreateTasks,
  setUserActive,
} from '../../../lib/users';
import type { Role } from '../../../lib/types';

const ROLES: Role[] = ['admin', 'manager', 'supervisor', 'employee'];

export const POST: APIRoute = async (context) => {
  const actor = getCurrentUser(context);
  if (!actor) {
    return context.redirect(`/login?redirect=${encodeURIComponent('/admin/users')}`);
  }
  if (!PERMISSIONS.canManageUsers(actor.role)) {
    setFlash(context, 'error', 'You do not have permission to manage users.');
    return context.redirect('/');
  }

  const form = await context.request.formData();
  const action = String(form.get('action') ?? '');

  const fail = (error: string): Response => {
    setFlash(context, 'error', error);
    return context.redirect('/admin/users');
  };

  if (action === 'create') {
    const role = String(form.get('role') ?? '');
    if (!(ROLES as string[]).includes(role)) return fail('Invalid role.');
    const username = String(form.get('username') ?? '');
    const result = createUser(actor, {
      username,
      fullName: String(form.get('full_name') ?? ''),
      password: String(form.get('password') ?? ''),
      role: role as Role,
      canCreateTasks: form.get('can_create_tasks') === '1',
    });
    if (!result.ok) return fail(result.error);
    setFlash(context, 'success', `User "${username.trim()}" created.`);
    return context.redirect('/admin/users');
  }

  if (action === 'toggle_active') {
    const id = Number(form.get('user_id') ?? '');
    const value = Number(form.get('value') ?? '');
    if (!Number.isInteger(id) || id <= 0) return fail('Invalid user.');
    if (value !== 0 && value !== 1) return fail('Invalid value.');
    const result = setUserActive(actor, id, value === 1);
    if (!result.ok) return fail(result.error);
    setFlash(context, 'success', value === 1 ? 'User activated.' : 'User deactivated.');
    return context.redirect('/admin/users');
  }

  if (action === 'toggle_create') {
    const id = Number(form.get('user_id') ?? '');
    const value = Number(form.get('value') ?? '');
    if (!Number.isInteger(id) || id <= 0) return fail('Invalid user.');
    if (value !== 0 && value !== 1) return fail('Invalid value.');
    const result = setCanCreateTasks(actor, id, value === 1);
    if (!result.ok) return fail(result.error);
    setFlash(context, 'success', value === 1 ? 'User can create tasks.' : 'User can no longer create tasks.');
    return context.redirect('/admin/users');
  }

  if (action === 'reset_password') {
    const id = Number(form.get('user_id') ?? '');
    const password = String(form.get('password') ?? '');
    if (!Number.isInteger(id) || id <= 0) return fail('Invalid user.');
    const result = resetPassword(actor, id, password);
    if (!result.ok) return fail(result.error);
    setFlash(context, 'success', 'Password updated.');
    return context.redirect('/admin/users');
  }

  return fail('Unknown action.');
};
