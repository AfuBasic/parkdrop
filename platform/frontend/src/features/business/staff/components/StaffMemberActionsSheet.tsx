import React, { useState } from 'react';
import type { StaffMember } from '/Library/WebServer/Documents/projects/parkdrop/platform/frontend/src/features/business/api/business-api';
import type { BusinessRole } from '/Library/WebServer/Documents/projects/parkdrop/platform/frontend/src/features/business/permissions/business-permissions';
import { X, Shield, UserMinus, AlertTriangle } from 'lucide-react';

interface StaffMemberActionsSheetProps {
  member: StaffMember | null;
  currentUserRole: BusinessRole;
  isOpen: boolean;
  onClose: () => void;
  onChangeRole: (member: StaffMember, newRole: BusinessRole) => Promise<void>;
  onRemoveAccess: (member: StaffMember) => Promise<void>;
}

export const StaffMemberActionsSheet: React.FC<StaffMemberActionsSheetProps> = ({
  member,
  currentUserRole,
  isOpen,
  onClose,
  onChangeRole,
  onRemoveAccess,
}) => {
  const [isChangingRole, setIsChangingRole] = useState(false);
  const [selectedRole, setSelectedRole] = useState<BusinessRole>('attendant');
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);

  const [isConfirmingRemove, setIsConfirmingRemove] = useState(false);
  const [isSubmittingRemove, setIsSubmittingRemove] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !member) return null;

  const displayName = member.name || member.email.split('@')[0];
  const roleDisplay = member.role.charAt(0).toUpperCase() + member.role.slice(1);

  // Available roles to change to:
  // Owner can assign owner, manager, attendant.
  // Manager cannot assign roles.
  const allowedRoles: BusinessRole[] =
    currentUserRole === 'owner' ? ['owner', 'manager', 'attendant'] : [];

  const handleStartChangeRole = () => {
    setSelectedRole(member.role);
    setErrorMessage(null);
    setIsChangingRole(true);
    setIsConfirmingRemove(false);
  };

  const handleSaveRole = async () => {
    if (selectedRole === member.role) {
      setIsChangingRole(false);
      return;
    }
    try {
      setIsSubmittingRole(true);
      setErrorMessage(null);
      await onChangeRole(member, selectedRole);
      setIsChangingRole(false);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not change this role. Try again.');
    } finally {
      setIsSubmittingRole(false);
    }
  };

  const handleStartRemove = () => {
    setErrorMessage(null);
    setIsConfirmingRemove(true);
    setIsChangingRole(false);
  };

  const handleConfirmRemove = async () => {
    try {
      setIsSubmittingRemove(true);
      setErrorMessage(null);
      await onRemoveAccess(member);
      setIsConfirmingRemove(false);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not remove access. Try again.');
    } finally {
      setIsSubmittingRemove(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="member-action-title"
    >
      <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-subtle">
          <div>
            <h2 id="member-action-title" className="font-bold text-slate-900 text-base sm:text-lg">
              {displayName}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{member.email} • {roleDisplay}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            aria-label="Close sheet"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error alert banner */}
        {errorMessage && (
          <div className="m-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {/* Mode: Default Action Sheet */}
        {!isChangingRole && !isConfirmingRemove && (
          <div className="p-4 space-y-2">
            {currentUserRole === 'owner' && (
              <button
                type="button"
                onClick={handleStartChangeRole}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 active:bg-slate-100 text-left font-medium text-slate-900 transition-colors min-h-[48px] cursor-pointer"
              >
                <Shield className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <div className="text-sm font-semibold">Change role</div>
                  <div className="text-xs text-slate-500 font-normal">
                    Promote or adjust responsibility
                  </div>
                </div>
              </button>
            )}

            <button
              type="button"
              onClick={handleStartRemove}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-red-100 bg-red-50/50 hover:bg-red-50 active:bg-red-100 text-left font-medium text-red-700 transition-colors min-h-[48px] cursor-pointer"
            >
              <UserMinus className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <div className="text-sm font-semibold">Remove access</div>
                <div className="text-xs text-red-500 font-normal">
                  Revoke ParkDrop access for this Business
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Mode: Change Role */}
        {isChangingRole && (
          <div className="p-4 space-y-4">
            <div className="text-sm font-semibold text-slate-900">
              Select new role for {displayName}:
            </div>

            <div className="space-y-2">
              {allowedRoles.map((role) => (
                <label
                  key={role}
                  className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-colors ${
                    selectedRole === role
                      ? 'border-blue-500 bg-blue-50/50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-900 capitalize">
                      {role}
                    </span>
                    <span className="text-xs text-slate-500">
                      {role === 'owner'
                        ? 'Full business & staff administration'
                        : role === 'manager'
                        ? 'Operational package actions & staff viewing'
                        : 'Operational package & pickup actions'}
                    </span>
                  </div>
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    checked={selectedRole === role}
                    onChange={() => setSelectedRole(role)}
                    className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                </label>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsChangingRole(false)}
                disabled={isSubmittingRole}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 min-h-[48px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRole}
                disabled={isSubmittingRole}
                className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm disabled:opacity-50 min-h-[48px] cursor-pointer"
              >
                {isSubmittingRole ? 'Saving...' : 'Save role'}
              </button>
            </div>
          </div>
        )}

        {/* Mode: Confirm Remove Access */}
        {isConfirmingRemove && (
          <div className="p-4 space-y-4">
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 leading-relaxed">
                <strong>{displayName}</strong> will no longer be able to use ParkDrop for this Business.
                Their User account and past package/payment activity will remain intact.
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmingRemove(false)}
                disabled={isSubmittingRemove}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 min-h-[48px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemove}
                disabled={isSubmittingRemove}
                className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm disabled:opacity-50 min-h-[48px] cursor-pointer"
              >
                {isSubmittingRemove ? 'Removing...' : 'Remove access'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
