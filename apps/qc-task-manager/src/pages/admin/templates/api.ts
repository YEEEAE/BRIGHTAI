// POST /admin/templates/api — admin task-template management actions.
//
// Dispatches on the `action` form field:
//   create       → new template (DRAFT) from title/code/department/priority/...
//   edit         → update editable fields on a DRAFT/ACTIVE template
//   activate     → DRAFT/ACTIVE → ACTIVE lifecycle transition
//   archive      → → ARCHIVED (read-only)
//   unarchive    → ARCHIVED → DRAFT
//   instantiate  → create a task from an ACTIVE template (with optional overrides)
//
// Every request ends in a redirect back to /admin/templates (or the new task)
// with a one-shot flash message. The middleware has already run the /admin
// guard; this handler re-checks PERMISSIONS.canManageTemplates for defense in
// depth. All domain validation lives in templatesStore + templates.

import type { APIRoute } from 'astro';
import { getCurrentUser } from '../../../lib/session';
import { requireCsrf } from '../../../lib/api-security';
import { setFlash } from '../../../lib/flash';
import { PERMISSIONS } from '../../../lib/permissions';
import {
  createTemplate,
  updateTemplate,
  transitionTemplate,
  instantiateTemplate,
  getTemplate,
} from '../../../lib/templatesStore';

export const POST: APIRoute = async (context) => {
  const csrf = requireCsrf(context);
  if (csrf) return csrf;
  const actor = getCurrentUser(context);
  if (!actor) {
    return context.redirect(`/login?redirect=${encodeURIComponent('/admin/templates')}`);
  }
  if (!PERMISSIONS.canManageTemplates(actor.role)) {
    setFlash(context, 'error', 'You do not have permission to manage templates.');
    return context.redirect('/');
  }

  const form = await context.request.formData();
  const action = String(form.get('action') ?? '');

  const fail = (error: string): Response => {
    setFlash(context, 'error', error);
    return context.redirect('/admin/templates');
  };

  if (action === 'create') {
    try {
      const id = createTemplate(formToTemplateInput(form), actor.id);
      setFlash(context, 'success', 'Template created.');
      return context.redirect(`/admin/templates/${id}/edit`);
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Could not create the template.');
    }
  }

  if (action === 'edit') {
    const id = Number(form.get('template_id') ?? '');
    if (!Number.isInteger(id) || id <= 0) return fail('Invalid template.');
    try {
      updateTemplate(id, formToTemplateInput(form), actor.id);
      setFlash(context, 'success', 'Template updated.');
      return context.redirect(`/admin/templates/${id}/edit`);
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Could not update the template.');
    }
  }

  if (action === 'activate' || action === 'archive' || action === 'unarchive') {
    const id = Number(form.get('template_id') ?? '');
    if (!Number.isInteger(id) || id <= 0) return fail('Invalid template.');
    const toStatus = action === 'activate' ? 'ACTIVE' : action === 'archive' ? 'ARCHIVED' : 'DRAFT';
    try {
      transitionTemplate(id, toStatus, actor.id);
      setFlash(context, 'success', `Template ${action}d.`);
      return context.redirect('/admin/templates');
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Could not change template status.');
    }
  }

  if (action === 'instantiate') {
    const id = Number(form.get('template_id') ?? '');
    if (!Number.isInteger(id) || id <= 0) return fail('Invalid template.');
    const existing = getTemplate(id);
    if (!existing) return fail('Template not found.');
    try {
      const taskId = instantiateTemplate(
        id,
        {
          title: String(form.get('title') ?? '').trim() || undefined,
          assignedTo: form.get('assigned_to') ? Number(form.get('assigned_to')) : undefined,
          dueDate: String(form.get('due_date') ?? '').trim() || undefined,
        },
        actor.id,
      );
      setFlash(context, 'success', `Task created from template "${existing.title}".`);
      return context.redirect(`/tasks/${taskId}`);
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Could not create a task from the template.');
    }
  }

  return fail('Unknown action.');
};

/** Parse a JSON string form field into an object/array, returning the fallback on failure. */
function parseJsonField<T>(value: FormDataEntryValue | null, fallback: T): T {
  if (value === null || value === '') return fallback;
  try {
    return JSON.parse(String(value)) as T;
  } catch {
    return fallback;
  }
}

/**
 * Resolve the checklist payload. The admin form sends one of:
 *   - `checklist_json`  → an explicit JSON array (used by the React editor)
 *   - `checklist_text`  → one title per line (textarea convenience)
 * Each title becomes { title, sortOrder } stable by position.
 */
function resolveChecklist(form: FormData): unknown {
  const json = form.get('checklist_json');
  if (json !== null && String(json).trim() !== '') {
    return parseJsonField<unknown>(json, []);
  }
  const text = String(form.get('checklist_text') ?? '');
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((title, index) => ({ title, sortOrder: index }));
}

/** Convert form fields into the TemplateInput shape used by the store. */
function formToTemplateInput(form: FormData) {
  return {
    code: String(form.get('code') ?? ''),
    title: String(form.get('title') ?? ''),
    description: String(form.get('description') ?? ''),
    department: String(form.get('department') ?? ''),
    priority: String(form.get('priority') ?? ''),
    taskType: String(form.get('task_type') ?? ''),
    recurrence: String(form.get('recurrence') ?? ''),
    slaPolicyId: form.get('sla_policy_id') ? Number(form.get('sla_policy_id')) : null,
    checklist: resolveChecklist(form),
    evidenceRequirements: parseJsonField(form.get('evidence_requirements_json'), []),
    findingDefaults: parseJsonField(form.get('finding_defaults_json'), {}),
    assignmentRules: parseJsonField(form.get('assignment_rules_json'), {}),
  };
}
