import React from 'react';
import type { StaffMember } from '/Library/WebServer/Documents/projects/parkdrop/platform/frontend/src/features/business/api/business-api';
import type { BusinessRole } from '/Library/WebServer/Documents/projects/parkdrop/platform/frontend/src/features/business/permissions/business-permissions';
import { canManageTargetMember } from '/Library/WebServer/Documents/projects/parkdrop/platform/frontend/src/features/business/permissions/business-permissions';
import { ChevronRight } from 'lucide-react';

interface StaffMemberRowProps {
  member: StaffMember;
  currentUserRole: BusinessRole;
  currentUserId?: number;
  onSelectMember?: (member: StaffMember) => void;
}

export const StaffMemberRow: React.FC<StaffMemberRowProps> = ({
  member,
  currentUserRole,
  currentUserId,
  onSelectMember,
}) => {
  const isSelf = currentUserId === member.user_id;
  const isManageable = canManageTargetMember(currentUserRole, member.role);

  const getInitials = (name: string | null, email: string) => {
    if (name && name.trim().length > 0) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
  };

  const getRoleBadgeClasses = (role: BusinessRole) => {
    switch (role) {
      case 'owner':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'manager':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'attendant':
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const roleDisplay = member.role.charAt(0).toUpperCase() + member.role.slice(1);
  const displayName = member.name || member.email.split('@')[0];

  const handleClick = () => {
    if (isManageable && onSelectMember) {
      onSelectMember(member);
    }
  };

  return (
    <div
      onClick={handleClick}
      role={isManageable ? 'button' : undefined}
      tabIndex={isManageable ? 0 : undefined}
      onKeyDown={(e) => {
        if (isManageable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick();
        }
      }}
      className={`w-full flex items-center justify-between p-4 bg-white border-b border-border-subtle transition-colors min-h-[64px] ${
        isManageable ? 'cursor-pointer hover:bg-slate-50 active:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary' : ''
      }`}
      aria-label={`${displayName}, ${member.email}, ${roleDisplay}${isSelf ? ', You' : ''}`}
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
        {/* Avatar with initials */}
        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 font-semibold text-sm flex items-center justify-center shrink-0 border border-blue-100">
          {getInitials(member.name, member.email)}
        </div>

        {/* Member info */}
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-900 text-sm sm:text-base truncate">
              {displayName}
            </span>
            {isSelf && (
              <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                You
              </span>
            )}
          </div>
          <span className="text-xs text-slate-500 truncate mt-0.5">
            {member.email}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeClasses(
            member.role
          )}`}
        >
          {roleDisplay}
        </span>
        {isManageable && (
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
        )}
      </div>
    </div>
  );
};
