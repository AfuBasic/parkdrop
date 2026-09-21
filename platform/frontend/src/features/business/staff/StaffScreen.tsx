import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, UserPlus, WifiOff, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '/Library/WebServer/Documents/projects/parkdrop/platform/frontend/src/features/auth/AuthContext';
import { businessApi, type StaffMember, type PendingInvitation } from '/Library/WebServer/Documents/projects/parkdrop/platform/frontend/src/features/business/api/business-api';
import type { BusinessRole } from '/Library/WebServer/Documents/projects/parkdrop/platform/frontend/src/features/business/permissions/business-permissions';
import { getBusinessPermissions } from '/Library/WebServer/Documents/projects/parkdrop/platform/frontend/src/features/business/permissions/business-permissions';
import { StaffMemberRow } from '/Library/WebServer/Documents/projects/parkdrop/platform/frontend/src/features/business/staff/components/StaffMemberRow';
import { PendingInvitationRow } from '/Library/WebServer/Documents/projects/parkdrop/platform/frontend/src/features/business/staff/components/PendingInvitationRow';
import { StaffMemberActionsSheet } from '/Library/WebServer/Documents/projects/parkdrop/platform/frontend/src/features/business/staff/components/StaffMemberActionsSheet';
import { InviteStaffSheet } from '/Library/WebServer/Documents/projects/parkdrop/platform/frontend/src/features/business/staff/components/InviteStaffSheet';

interface StaffScreenProps {
  onBack: () => void;
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
      setErrorMessage(err.message || 'Could not load staff list. Check your connection and try again.');
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
      alert(err.message || 'Could not resend invitation.');
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
      alert(err.message || 'Could not cancel invitation.');
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
    <div className="flex flex-col min-h-screen bg-slate-50 w-full max-w-lg mx-auto pb-12">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-border-subtle px-4 h-14 flex items-center justify-between shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center text-slate-600 hover:text-slate-900 transition-colors py-2 pr-4 -ml-2 min-h-[44px] cursor-pointer"
          aria-label="Back to more menu"
        >
          <ChevronLeft className="h-6 w-6" />
          <span className="text-[17px] font-medium ml-0.5">Back</span>
        </button>
        <h1 className="text-[17px] font-bold text-slate-900 tracking-tight">
          Staff
        </h1>
        <div className="w-12" />
      </header>

      {/* Offline Warning Banner */}
      {!isOnline && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center gap-2.5 text-xs text-amber-800">
          <WifiOff className="w-4 h-4 shrink-0 text-amber-600" />
          <span>Connect to the internet to manage staff or send invitations.</span>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 space-y-6">
        {/* Intro description & Invite CTA */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Staff &amp; Members
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              People with access to this Business on ParkDrop.
            </p>
          </div>

          {permissions.canInviteStaff && (
            <button
              type="button"
              onClick={() => setIsInviteSheetOpen(true)}
              disabled={!isOnline}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px] cursor-pointer"
              aria-label="Invite staff"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Invite staff</span>
            </button>
          )}
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-3 text-xs text-red-700">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={loadStaff}
              className="px-2.5 py-1 text-xs font-semibold text-red-700 bg-red-100 hover:bg-red-200 rounded-lg shrink-0 cursor-pointer"
            >
              Try again
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="bg-white rounded-2xl border border-border-subtle divide-y divide-border-subtle overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 flex items-center gap-3.5 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
                <div className="h-5 bg-slate-100 rounded-full w-16" />
              </div>
            ))}
          </div>
        )}

        {/* Active Members Section */}
        {!isLoading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Active Staff ({members.length})
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-border-subtle overflow-hidden shadow-sm">
              {members.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  No staff members found.
                </div>
              ) : (
                members.map((member) => (
                  <StaffMemberRow
                    key={member.id}
                    member={member}
                    currentUserRole={effectiveRole}
                    currentUserId={user?.id}
                    onSelectMember={handleSelectMember}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* Pending Invitations Section */}
        {!isLoading && invitations.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Pending Invitations ({invitations.length})
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-border-subtle overflow-hidden shadow-sm">
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

      {/* Member Action Sheet */}
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

      {/* Invite Staff Sheet */}
      <InviteStaffSheet
        currentUserRole={effectiveRole}
        isOpen={isInviteSheetOpen}
        onClose={() => setIsInviteSheetOpen(false)}
        onInvite={handleInviteStaff}
      />
    </div>
  );
};
