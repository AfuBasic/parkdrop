import React from 'react';
import type { StaffMember } from '@/features/business/api/business-api';
import type { BusinessRole } from '@/features/business/permissions/business-permissions';
import { canManageTargetMember } from '@/features/business/permissions/business-permissions';
import { ChevronRight } from 'lucide-react';
import { StaffStrings } from '@/features/business/staff/strings';

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

  const roleSentence = StaffStrings.roleSentence[member.role] ?? StaffStrings.roleSentence.attendant;
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
      className={`w-full flex items-center justify-between gap-3 p-4 min-h-[72px] bg-white border-b border-[var(--pd-line-2)] last:border-b-0 transition-colors ${
        isManageable ? 'cursor-pointer hover:bg-[var(--pd-page-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pd-blue)]' : ''
      }`}
      aria-label={`${displayName}, ${member.email}, ${roleSentence}${isSelf ? `, ${StaffStrings.you}` : ''}`}
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
        <div className="w-11 h-11 rounded-full bg-[var(--pd-tint)] text-[var(--pd-blue)] font-extrabold text-[15px] flex items-center justify-center shrink-0">
          {getInitials(member.name, member.email)}
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-[var(--pd-navy)] text-[18px] truncate">
              {displayName}
            </span>
            {isSelf && (
              <span className="text-[15px] font-semibold text-[var(--pd-muted)]">
                ({StaffStrings.you})
              </span>
            )}
          </div>
          <span className="text-[16px] font-semibold text-[var(--pd-muted)] truncate mt-0.5">
            {member.email}
          </span>
          <span className="text-[16px] font-semibold text-[var(--pd-muted)] mt-0.5">
            {roleSentence}
          </span>
        </div>
      </div>

      {isManageable && (
        <ChevronRight className="w-5 h-5 text-[var(--pd-muted)] shrink-0" aria-hidden="true" strokeWidth={2.25} />
      )}
    </div>
  );
};
