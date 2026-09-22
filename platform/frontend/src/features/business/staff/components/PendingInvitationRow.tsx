import React from 'react';
import type { PendingInvitation } from '@/features/business/api/business-api';
import type { BusinessRole } from '@/features/business/permissions/business-permissions';
import { canManageTargetMember } from '@/features/business/permissions/business-permissions';
import { Mail, RefreshCw, XCircle } from 'lucide-react';
import { StaffStrings } from '@/features/business/staff/strings';

interface PendingInvitationRowProps {
  invitation: PendingInvitation;
  currentUserRole: BusinessRole;
  isOnline: boolean;
  onResend: (invitationId: string) => void;
  onRevoke: (invitationId: string) => void;
  resendingId?: string | null;
  revokingId?: string | null;
}

/** "2 hours ago", "3 days ago" — how long ago the invite was sent. */
function describeAge(iso: string | null | undefined): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (isNaN(then)) return '';

  const minutes = Math.floor((Date.now() - then) / 60000);
  if (minutes < 1) return 'a moment ago';
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? 'day' : 'days'} ago`;
}

export const PendingInvitationRow: React.FC<PendingInvitationRowProps> = ({
  invitation,
  currentUserRole,
  isOnline,
  onResend,
  onRevoke,
  resendingId,
  revokingId,
}) => {
  const canManage = canManageTargetMember(currentUserRole, invitation.role);
  const isResending = resendingId === invitation.id;
  const isRevoking = revokingId === invitation.id;
  const roleSentence = StaffStrings.roleSentence[invitation.role] ?? StaffStrings.roleSentence.attendant;
  const age = describeAge(invitation.created_at);

  return (
    <div
      className="w-full flex flex-col gap-3 p-4 bg-white border-b border-[var(--pd-line-2)] last:border-b-0"
      aria-label={`${invitation.email}, ${roleSentence}, ${StaffStrings.waitingToJoin}`}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-10 h-10 rounded-full bg-[var(--pd-page-2)] text-[var(--pd-muted)] flex items-center justify-center shrink-0">
          <Mail className="w-5 h-5" strokeWidth={2.25} aria-hidden="true" />
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <span className="font-bold text-[var(--pd-navy)] text-[18px] truncate">
            {invitation.email}
          </span>
          <span className="text-[16px] font-semibold text-[var(--pd-muted)] mt-0.5">
            {roleSentence}
          </span>
          <span className="text-[15px] font-semibold text-[var(--pd-muted)] mt-0.5">
            {StaffStrings.waitingToJoin}
            {age ? ` · ${StaffStrings.sentAgo(age)}` : ''}
          </span>
        </div>
      </div>

      {canManage && isOnline && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onResend(invitation.id)}
            disabled={isResending || isRevoking}
            className="min-h-[48px] px-3 inline-flex items-center gap-1.5 text-[16px] font-extrabold text-[var(--pd-blue)] disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isResending ? 'animate-spin' : ''}`} strokeWidth={2.25} aria-hidden="true" />
            <span>{isResending ? StaffStrings.sending : StaffStrings.sendAgain}</span>
          </button>

          <button
            type="button"
            onClick={() => onRevoke(invitation.id)}
            disabled={isResending || isRevoking}
            className="min-h-[48px] px-3 inline-flex items-center gap-1.5 text-[16px] font-extrabold text-[var(--pd-bad)] disabled:opacity-50 cursor-pointer"
          >
            <XCircle className="w-4 h-4" strokeWidth={2.25} aria-hidden="true" />
            <span>{isRevoking ? StaffStrings.cancelling : StaffStrings.cancelInvite}</span>
          </button>
        </div>
      )}
    </div>
  );
};
