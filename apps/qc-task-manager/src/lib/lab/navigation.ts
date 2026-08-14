// QC Laboratory secondary navigation (contract §5.3).
//
// Permission filtering happens HERE, in the lib layer, delegating every
// authorization decision to src/lib/permissions.ts (the canonical RBAC
// source). UI components receive the already-filtered entries as props —
// components never import permissions directly (architecture-guard
// UI_AUTHORITY rule).
//
// IMPLEMENTED_ROUTES lists only routes whose pages actually exist, so the
// nav never renders a dead link. Later implementation prompts add their
// route here as each page lands.

import {
  canCreateLabDocument,
  canCreateLabProduct,
  canCreateLabRetest,
  canCreateLabTemplate,
  canCreateLabTest,
  canRecordLabEquipmentMaintenance,
  canReviewLabTest,
  canViewLab,
  canViewLabCalibration,
  canViewLabDataQuality,
  canViewLabManagementDashboard,
  canViewLabReports,
} from '../permissions';
import type { Role } from '../types';

export interface LabNavItem {
  href: string;
  label: string;
  group: LabNavGroup;
}

export type LabNavGroup =
  | 'Overview'
  | 'Testing'
  | 'Master Data'
  | 'Controlled Documents'
  | 'Operations';

export const LAB_NAV_GROUPS: readonly LabNavGroup[] = [
  'Overview',
  'Testing',
  'Master Data',
  'Controlled Documents',
  'Operations',
];

interface LabNavEntry extends LabNavItem {
  allowed: (role: Role) => boolean;
}

// Keep in sync with the 36-route map in docs/QC-LAB-ARCHITECTURE.md §5.2.
const ALL_ENTRIES: readonly LabNavEntry[] = [
  // Overview
  { href: '/lab', label: 'Command Center', group: 'Overview', allowed: canViewLab },
  { href: '/lab/search', label: 'Search', group: 'Overview', allowed: canViewLab },
  { href: '/lab/calendar', label: 'Calendar', group: 'Overview', allowed: canViewLab },
  { href: '/lab/notifications', label: 'Notifications', group: 'Overview', allowed: canViewLab },
  // Testing
  { href: '/lab/tests', label: 'Tests', group: 'Testing', allowed: canViewLab },
  { href: '/lab/tests/new', label: 'New Test', group: 'Testing', allowed: canCreateLabTest },
  { href: '/lab/tests/review', label: 'Review Queue', group: 'Testing', allowed: canReviewLabTest },
  { href: '/lab/retests', label: 'Retests', group: 'Testing', allowed: canCreateLabRetest },
  // Master Data
  { href: '/lab/products', label: 'Products', group: 'Master Data', allowed: canCreateLabProduct },
  { href: '/lab/templates', label: 'Test Templates', group: 'Master Data', allowed: canCreateLabTemplate },
  { href: '/lab/equipment', label: 'Equipment', group: 'Master Data', allowed: canViewLab },
  { href: '/lab/equipment/maintenance', label: 'Maintenance', group: 'Master Data', allowed: canRecordLabEquipmentMaintenance },
  { href: '/lab/calibration', label: 'Calibration', group: 'Master Data', allowed: canViewLabCalibration },
  // Controlled Documents
  { href: '/lab/documents', label: 'SOP / WI Documents', group: 'Controlled Documents', allowed: canViewLab },
  { href: '/lab/documents/new', label: 'New Document', group: 'Controlled Documents', allowed: canCreateLabDocument },
  // Operations
  { href: '/lab/reports', label: 'Reports', group: 'Operations', allowed: canViewLabReports },
  { href: '/lab/data-quality', label: 'Data Quality', group: 'Operations', allowed: canViewLabDataQuality },
  { href: '/lab/management', label: 'Management Dashboard', group: 'Operations', allowed: canViewLabManagementDashboard },
];

/** Routes whose pages exist today. Extended as implementation prompts land. */
export const IMPLEMENTED_LAB_ROUTES: readonly string[] = [
  '/lab',
  '/lab/tests/new',
  '/lab/tests',
  '/lab/tests/[id]',
];

/**
 * Lab secondary-nav items visible to `role`: permission-filtered (via the
 * canonical RBAC module) AND limited to implemented routes (no dead links).
 */
export function labNavForRole(role: Role): LabNavItem[] {
  const implemented = new Set(IMPLEMENTED_LAB_ROUTES);
  return ALL_ENTRIES.filter((entry) => implemented.has(entry.href) && entry.allowed(role)).map(
    ({ href, label, group }) => ({ href, label, group }),
  );
}
