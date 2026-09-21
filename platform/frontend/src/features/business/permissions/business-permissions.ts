export type BusinessRole = 'owner' | 'manager' | 'attendant';

export interface BusinessPermissions {
  canViewStaff: boolean;
  canInviteStaff: boolean;
  canChangeRole: boolean;
  canRemoveStaff: boolean;
  canEditBusinessDetails: boolean;
  canViewReports: boolean;
  canExportReports: boolean;
}

export function getBusinessPermissions(role: BusinessRole | string | null | undefined): BusinessPermissions {
  const normalized = (role ?? '').toLowerCase();

  switch (normalized) {
    case 'owner':
      return {
        canViewStaff: true,
        canInviteStaff: true,
        canChangeRole: true,
        canRemoveStaff: true,
        canEditBusinessDetails: true,
        canViewReports: true,
        canExportReports: true,
      };
    case 'manager':
      return {
        canViewStaff: true,
        canInviteStaff: true, // Can only invite attendants
        canChangeRole: false, // Managers cannot alter owner/manager roles
        canRemoveStaff: false, // In fallback matrix, removing staff is restricted or attendant-only; conservative V1 blocks manager
        canEditBusinessDetails: false,
        canViewReports: true,
        canExportReports: true,
      };
    case 'attendant':
    default:
      return {
        canViewStaff: false,
        canInviteStaff: false,
        canChangeRole: false,
        canRemoveStaff: false,
        canEditBusinessDetails: false,
        canViewReports: false,
        canExportReports: false,
      };
  }
}

export function canManageTargetMember(
  actorRole: BusinessRole | string,
  targetRole: BusinessRole | string
): boolean {
  const actor = actorRole.toLowerCase();
  const target = targetRole.toLowerCase();

  if (actor === 'owner') {
    return true; // Owner can manage all members (backend enforces last-owner invariant)
  }

  if (actor === 'manager') {
    return target === 'attendant'; // Manager can manage Attendants only
  }

  return false;
}
