import React, { useState } from 'react';
import type { StaffMember } from '@/features/business/api/business-api';
import type { BusinessRole } from '@/features/business/permissions/business-permissions';
import { Shield, UserMinus, AlertTriangle } from 'lucide-react';
import { Sheet, SheetContent } from '@/design-system';
import { StaffStrings } from '@/features/business/staff/strings';

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

  if (!member) return null;

  const displayName = member.name || member.email.split('@')[0];

  // Owner can assign owner, manager, attendant. Manager cannot assign roles.
  const allowedRoles: BusinessRole[] =
    currentUserRole === 'owner' ? ['owner', 'manager', 'attendant'] : [];

  const resetAndClose = () => {
    setIsChangingRole(false);
    setIsConfirmingRemove(false);
    setErrorMessage(null);
    onClose();
  };

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
      setErrorMessage(err.message || StaffStrings.couldNotChangeRole);
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
      setErrorMessage(err.message || StaffStrings.couldNotRemove);
    } finally {
      setIsSubmittingRemove(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && resetAndClose()}>
      <SheetContent
        side="bottom"
        className="w-full max-w-md mx-auto p-5 pb-8 rounded-t-[var(--pd-sheet-radius)]"
        aria-describedby={undefined}
      >
        <div className="pr-10 mb-4">
          <h2 className="text-[22px] font-extrabold text-[var(--pd-navy)] m-0 tracking-[-0.02em]">
            {displayName}
          </h2>
          <p className="text-[16px] font-semibold text-[var(--pd-muted)] mt-1 m-0">
            {member.email}
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3.5 bg-[var(--pd-bad-bg)] border border-[var(--pd-bad)]/25 rounded-[var(--pd-card-radius)] flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0 text-[var(--pd-bad)] mt-0.5" strokeWidth={2.25} aria-hidden="true" />
            <span className="text-[15px] font-semibold text-[var(--pd-bad)]">{errorMessage}</span>
          </div>
        )}

        {!isChangingRole && !isConfirmingRemove && (
          <div className="flex flex-col gap-3">
            {currentUserRole === 'owner' && (
              <button
                type="button"
                onClick={handleStartChangeRole}
                className="w-full min-h-[56px] px-4 rounded-[var(--pd-field-radius)] border-2 border-[var(--pd-line-2)] flex items-center gap-3 text-left cursor-pointer active:scale-[0.99] transition-all"
              >
                <Shield className="w-5 h-5 text-[var(--pd-blue)] shrink-0" strokeWidth={2.25} aria-hidden="true" />
                <span className="text-[18px] font-bold text-[var(--pd-navy)]">{StaffStrings.changeRole}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleStartRemove}
              className="w-full min-h-[56px] px-4 rounded-[var(--pd-field-radius)] border-2 border-[var(--pd-bad)] flex items-center gap-3 text-left cursor-pointer active:scale-[0.99] transition-all"
            >
              <UserMinus className="w-5 h-5 text-[var(--pd-bad)] shrink-0" strokeWidth={2.25} aria-hidden="true" />
              <span className="text-[18px] font-bold text-[var(--pd-bad)]">{StaffStrings.removeAccess}</span>
            </button>
          </div>
        )}

        {isChangingRole && (
          <div className="flex flex-col gap-4">
            <p className="text-[16px] font-semibold text-[var(--pd-navy)] m-0">
              {StaffStrings.pickNewRole(displayName)}
            </p>

            <div className="flex flex-col gap-2.5">
              {allowedRoles.map((role) => (
                <label
                  key={role}
                  className={`flex items-center justify-between p-4 min-h-[56px] rounded-[var(--pd-field-radius)] border-2 cursor-pointer transition-colors ${
                    selectedRole === role
                      ? 'border-[var(--pd-blue)] bg-[var(--pd-tint)]'
                      : 'border-[var(--pd-line-2)]'
                  }`}
                >
                  <span className="text-[16px] font-semibold text-[var(--pd-navy)]">
                    {StaffStrings.roleSentence[role]}
                  </span>
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    checked={selectedRole === role}
                    onChange={() => setSelectedRole(role)}
                    className="w-5 h-5 accent-[var(--pd-blue)]"
                  />
                </label>
              ))}
            </div>

            <div className="flex flex-col gap-3 pt-1">
              <button
                type="button"
                onClick={handleSaveRole}
                disabled={isSubmittingRole}
                className="w-full min-h-[60px] rounded-[var(--pd-field-radius)] bg-[var(--pd-blue)] hover:bg-[var(--pd-blue-hover)] text-white text-[20px] font-extrabold disabled:opacity-50 cursor-pointer"
              >
                {isSubmittingRole ? StaffStrings.saving : StaffStrings.saveRole}
              </button>
              <button
                type="button"
                onClick={() => setIsChangingRole(false)}
                disabled={isSubmittingRole}
                className="w-full min-h-[48px] text-[17px] font-extrabold text-[var(--pd-blue)] cursor-pointer"
              >
                {StaffStrings.cancel}
              </button>
            </div>
          </div>
        )}

        {isConfirmingRemove && (
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3 p-4 bg-[var(--pd-warn-bg)] border border-[var(--pd-warn)]/25 rounded-[var(--pd-card-radius)]">
              <AlertTriangle className="w-5 h-5 text-[var(--pd-warn)] shrink-0 mt-0.5" strokeWidth={2.25} aria-hidden="true" />
              <p className="text-[15px] font-semibold text-[var(--pd-warn)] m-0 leading-relaxed">
                {StaffStrings.removeAccessBody(displayName)}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleConfirmRemove}
                disabled={isSubmittingRemove}
                className="w-full min-h-[56px] rounded-[var(--pd-field-radius)] border-2 border-[var(--pd-bad)] text-[var(--pd-bad)] text-[18px] font-extrabold disabled:opacity-50 cursor-pointer"
              >
                {isSubmittingRemove ? StaffStrings.removing : StaffStrings.removeAccess}
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingRemove(false)}
                disabled={isSubmittingRemove}
                className="w-full min-h-[48px] text-[17px] font-extrabold text-[var(--pd-blue)] cursor-pointer"
              >
                {StaffStrings.cancel}
              </button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
