import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { UserPlus, WifiOff, AlertCircle } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { businessApi, type StaffMember, type PendingInvitation } from '@/features/business/api/business-api';
import type { BusinessRole } from '@/features/business/permissions/business-permissions';
import { getBusinessPermissions } from '@/features/business/permissions/business-permissions';
import { StaffMemberRow } from '@/features/business/staff/components/StaffMemberRow';
import { PendingInvitationRow } from '@/features/business/staff/components/PendingInvitationRow';
import { StaffMemberActionsSheet } from '@/features/business/staff/components/StaffMemberActionsSheet';
import { InviteStaffSheet } from '@/features/business/staff/components/InviteStaffSheet';
import { TaskHeader } from '@/design-system/shell/TaskHeader';
import { StaffStrings } from '@/features/business/staff/strings';

interface StaffScreenProps {
  onBack?: () => void;
  mockMembers?: StaffMember[];
  mockInvitations?: PendingInvitation[];
  mockRole?: BusinessRole;
  mockIsOnline?: boolean;
}

export const StaffScreen: React.FC<StaffScreenProps> = ({
  onBack,
  mockMembers,
  mockInvitations,
  mockRole,
  mockIsOnline,
}) => {
  const routerNavigate = useNavigate();
  const handleBack = onBack ?? (() => routerNavigate({ to: '/more' }));
  const { user, role: contextRole } = useAuth();
  const effectiveRole = (mockRole || contextRole || 'attendant') as BusinessRole;
  const permissions = getBusinessPermissions(effectiveRole);

  const [members, setMembers] = useState<StaffMember[]>(mockMembers || []);
  const [invitations, setInvitations] = useState<PendingInvitation[]>(mockInvitations || []);
  const [isLoading, setIsLoading] = useState(!mockMembers);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isOnline, setIsOnline] = useState<boolean>(
    mockIsOnline !== undefined ? mockIsOnline : typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null);
  const [isActionsSheetOpen, setIsActionsSheetOpen] = useState(false);
  const [isInviteSheetOpen, setIsInviteSheetOpen] = useState(false);

  const [resendingInviteId, setResendingInviteId] = useState<string | null>(null);
  const [revokingInviteId, setRevokingInviteId] = useState<string | null>(null);

  // Monitor online status
  useEffect(() => {
    if (mockIsOnline !== undefined) {
      setIsOnline(mockIsOnline);
      return;
    }
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [mockIsOnline]);

  // Load staff list from server
  const loadStaff = useCallback(async () => {
    if (mockMembers) return;
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const res = await businessApi.getStaffList();
      setMembers(res.members);
      setInvitations(res.invitations);
    } catch (err: any) {
      setErrorMessage(err.message || StaffStrings.couldNotLoad);
    } finally {
      setIsLoading(false);
    }
  }, [mockMembers]);

  useEffect(() => {
    if (!mockMembers) {
      loadStaff();
    }
  }, [loadStaff, mockMembers]);

  // Handlers
  const handleSelectMember = (member: StaffMember) => {
    setSelectedMember(member);
    setIsActionsSheetOpen(true);
  };

  const handleInviteStaff = async (email: string, role: BusinessRole) => {
    const res = await businessApi.inviteStaff(email, role);
    setInvitations((prev) => [res.invitation, ...prev]);
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      setResendingInviteId(invitationId);
      await businessApi.resendInvitation(invitationId);
    } catch (err: any) {
      toast.error(err.message || StaffStrings.couldNotResend);
    } finally {
      setResendingInviteId(null);
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    try {
      setRevokingInviteId(invitationId);
      await businessApi.revokeInvitation(invitationId);
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
    } catch (err: any) {
      toast.error(err.message || StaffStrings.couldNotCancel);
    } finally {
      setRevokingInviteId(null);
    }
  };

  const handleChangeRole = async (member: StaffMember, newRole: BusinessRole) => {
    await businessApi.changeMemberRole(member.id, newRole);
    setMembers((prev) =>
      prev.map((m) => (m.id === member.id ? { ...m, role: newRole } : m))
    );
  };

  const handleRemoveAccess = async (member: StaffMember) => {
    await businessApi.removeMember(member.id);
    setMembers((prev) => prev.filter((m) => m.id !== member.id));
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--pd-page-2)] w-full max-w-lg mx-auto pb-12">
      <TaskHeader
        title={StaffStrings.title}
        onBack={handleBack}
        screenName="Your team"
        subtitle={!isLoading ? StaffStrings.count(members.length) : undefined}
      />

      {/* Offline: read-only, said plainly rather than letting a tap fail. */}
      {!isOnline && (
        <div
          role="status"
          className="bg-[var(--pd-warn-bg)] border-b border-[var(--pd-warn)]/25 px-4 py-3 flex items-start gap-2.5 text-[var(--pd-warn)]"
        >
          <WifiOff className="w-5 h-5 shrink-0 mt-0.5" strokeWidth={2.25} aria-hidden="true" />
          <div>
            <p className="text-[16px] font-semibold m-0">{StaffStrings.offlineTitle}</p>
            <p className="text-[15px] font-semibold m-0 mt-0.5">{StaffStrings.offlineBody}</p>
          </div>
        </div>
      )}

      <main className="flex-1 p-4 flex flex-col gap-5">
        {permissions.canInviteStaff && (
          <button
            type="button"
            onClick={() => setIsInviteSheetOpen(true)}
            disabled={!isOnline}
            className="w-full min-h-[60px] rounded-[var(--pd-field-radius)] bg-[var(--pd-blue)] hover:bg-[var(--pd-blue-hover)] active:scale-[0.99] text-white text-[20px] font-extrabold transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-5 h-5" strokeWidth={2.25} aria-hidden="true" />
            <span>{StaffStrings.invite}</span>
          </button>
        )}

        {errorMessage && (
          <div className="p-4 bg-[var(--pd-bad-bg)] border border-[var(--pd-bad)]/25 rounded-[var(--pd-card-radius)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 text-[var(--pd-bad)]" strokeWidth={2.25} aria-hidden="true" />
              <span className="text-[15px] font-semibold text-[var(--pd-bad)]">{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={loadStaff}
              className="min-h-[48px] px-3 text-[15px] font-extrabold text-[var(--pd-bad)] shrink-0 cursor-pointer"
            >
              {StaffStrings.tryAgain}
            </button>
          </div>
        )}

        {isLoading && (
          <div className="bg-white rounded-[var(--pd-card-radius)] border border-[var(--pd-line-2)] divide-y divide-[var(--pd-line-2)] overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 flex items-center gap-3.5 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-[var(--pd-line-2)] shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[var(--pd-line-2)] rounded w-1/3" />
                  <div className="h-3 bg-[var(--pd-line-2)] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && members.length === 0 && invitations.length === 0 && (
          <div className="bg-white rounded-[var(--pd-card-radius)] border border-[var(--pd-line-2)] p-8 flex flex-col items-center text-center gap-1">
            <h2 className="text-[18px] font-extrabold text-[var(--pd-navy)] m-0">{StaffStrings.empty}</h2>
            <p className="text-[15px] font-semibold text-[var(--pd-muted)] m-0 mt-1">
              {StaffStrings.emptyBody}
            </p>
          </div>
        )}

        {!isLoading && members.length > 0 && (
          <div className="bg-white rounded-[var(--pd-card-radius)] border border-[var(--pd-line-2)] overflow-hidden shadow-sm">
            {members.map((member) => (
              <StaffMemberRow
                key={member.id}
                member={member}
                currentUserRole={effectiveRole}
                currentUserId={user?.id}
                onSelectMember={handleSelectMember}
              />
            ))}
          </div>
        )}

        {!isLoading && invitations.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="px-1 text-[16px] font-extrabold text-[var(--pd-navy)]">
              {StaffStrings.waitingToJoin}
            </span>
            <div className="bg-white rounded-[var(--pd-card-radius)] border border-[var(--pd-line-2)] overflow-hidden shadow-sm">
              {invitations.map((inv) => (
                <PendingInvitationRow
                  key={inv.id}
                  invitation={inv}
                  currentUserRole={effectiveRole}
                  isOnline={isOnline}
                  onResend={handleResendInvitation}
                  onRevoke={handleRevokeInvitation}
                  resendingId={resendingInviteId}
                  revokingId={revokingInviteId}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      <StaffMemberActionsSheet
        member={selectedMember}
        currentUserRole={effectiveRole}
        isOpen={isActionsSheetOpen}
        onClose={() => {
          setIsActionsSheetOpen(false);
          setSelectedMember(null);
        }}
        onChangeRole={handleChangeRole}
        onRemoveAccess={handleRemoveAccess}
      />

      <InviteStaffSheet
        currentUserRole={effectiveRole}
        isOpen={isInviteSheetOpen}
        onClose={() => setIsInviteSheetOpen(false)}
        onInvite={handleInviteStaff}
      />
    </div>
  );
};
