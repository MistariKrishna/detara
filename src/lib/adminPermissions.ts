/**
 * Admin Role Permissions
 *
 * admin  → Full access to everything (add, edit, delete, remove of everything)
 * editor → Can ONLY add products. No edit, no delete, no manage users, no system settings.
 * viewer → View only. Cannot create, edit, update, delete, or manage anything.
 */

export type AdminRole = 'admin' | 'editor' | 'viewer';

export interface AdminPermissions {
  canCreate: boolean;        // create any record (admin only)
  canAddProducts: boolean;   // add new products only (editor + admin)
  canEdit: boolean;
  canDelete: boolean;
  canManageUsers: boolean;   // admin-users page, role changes
  canManageSystem: boolean;  // settings, currency, ai-settings, security, audit-logs
  canExport: boolean;
  canApprove: boolean;       // reviews, orders status changes
  canToggleStatus: boolean;  // activate/deactivate records
}

const PERMISSIONS: Record<AdminRole, AdminPermissions> = {
  admin: {
    canCreate: true,
    canAddProducts: true,
    canEdit: true,
    canDelete: true,
    canManageUsers: true,
    canManageSystem: true,
    canExport: true,
    canApprove: true,
    canToggleStatus: true,
  },
  editor: {
    canCreate: false,
    canAddProducts: true,   // ONLY permission: add new products
    canEdit: false,
    canDelete: false,
    canManageUsers: false,
    canManageSystem: false,
    canExport: false,
    canApprove: false,
    canToggleStatus: false,
  },
  viewer: {
    canCreate: false,
    canAddProducts: false,
    canEdit: false,
    canDelete: false,
    canManageUsers: false,
    canManageSystem: false,
    canExport: false,
    canApprove: false,
    canToggleStatus: false,
  },
};

export function getPermissions(role: string): AdminPermissions {
  const normalized = (role || '').toLowerCase() as AdminRole;
  return PERMISSIONS[normalized] ?? PERMISSIONS.viewer;
}

/**
 * Nav items hidden from editors and viewers.
 * Only admins can see system config pages.
 */
export const ADMIN_ONLY_ROUTES = [
  '/admin/admin-users',
  '/admin/settings',
  '/admin/currency',
  '/admin/ai-settings',
  '/admin/security',
  '/admin/audit-logs',
];

export function canAccessRoute(role: string, href: string): boolean {
  const perms = getPermissions(role);
  if (ADMIN_ONLY_ROUTES.includes(href)) {
    return perms.canManageSystem && perms.canManageUsers;
  }
  return true;
}
