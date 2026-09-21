import React from 'react';
import type { PendingInvitation } from '/Library/WebServer/Documents/projects/parkdrop/platform/frontend/src/features/business/api/business-api';
import type { BusinessRole } from '/Library/WebServer/Documents/projects/parkdrop/platform/frontend/src/features/business/permissions/business-permissions';
import { canManageTargetMember } from '/Library/WebServer/Documents/projects/parkdrop/platform/frontend/src/features/business/permissions/business-permissions';
import { Mail, RefreshCw, XCircle } from 'lucide-react';

interface PendingInvitationRowProps {
  invitation: PendingInvitation;
  currentUserRole: BusinessRole;
  isOnline: boolean;
  onResend: (invitationId: string) => void;
  onRevoke: (invitationId: string) => void;
  resendingId?: string | null;
  revokingId?: string | null;
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
  const roleDisplay = invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1);

  return (
    <div
      className="w-full flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border-b border-border-subtle gap-3"
      aria-label={`Invitation for ${invitation.email}, Role: ${roleDisplay}, Status: Invitation pending`}
    >
      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
        <div className="w-9 h-9 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center shrink-0 border border-slate-200 mt-0.5 sm:mt-0">
          <Mail className="w-4 h-4" aria-hidden="true" />
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-900 text-sm truncate">
              {invitation.email}
            </span>
            <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
              Invitation pending
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
            <span>Role: <strong className="font-medium text-slate-700">{roleDisplay}</strong></span>
            {invitation.invited_by_name && (
              <>
                <span>•</span>
                <span>Invited by {invitation.invited_by_name}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {canManage && isOnline && (
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-1 sm:pt-0">
          <button
            type="button"
            onClick={() => onResend(invitation.id)}
            disabled={isResending || isRevoking}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors disabled:opacity-50 min-h-[36px] cursor-pointer"
            aria-label={`Resend invitation to ${invitation.email}`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
            <span>{isResending ? 'Sending...' : 'Resend'}</span>
          </button>

          <button
            type="button"
            onClick={() => onRevoke(invitation.id)}
            disabled={isResending || isRevoking}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors disabled:opacity-50 min-h-[36px] cursor-pointer"
            aria-label={`Cancel invitation for ${invitation.email}`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>{isRevoking ? 'Cancelling...' : 'Cancel'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
