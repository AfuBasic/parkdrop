import React, { useState } from 'react';
import type { BusinessRole } from '@/features/business/permissions/business-permissions';
import { Send, AlertTriangle } from 'lucide-react';
import { Sheet, SheetContent } from '@/design-system';
import { StaffStrings } from '@/features/business/staff/strings';

interface InviteStaffSheetProps {
  currentUserRole: BusinessRole;
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string, role: BusinessRole) => Promise<void>;
}

export const InviteStaffSheet: React.FC<InviteStaffSheetProps> = ({
  currentUserRole,
  isOpen,
  onClose,
  onInvite,
}) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<BusinessRole>('attendant');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Owner can invite owner, manager or attendant. Manager can invite attendant only.
  const assignableRoles: BusinessRole[] =
    currentUserRole === 'owner' ? ['attendant', 'manager', 'owner'] : ['attendant'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage(StaffStrings.invalidEmail);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await onInvite(cleanEmail, role);
      setEmail('');
      setRole('attendant');
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || StaffStrings.couldNotInvite);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="w-full max-w-md mx-auto p-5 pb-8 rounded-t-[var(--pd-sheet-radius)]"
        aria-describedby={undefined}
      >
        <div className="pr-10 mb-5">
          <h2 className="text-[22px] font-extrabold text-[var(--pd-navy)] m-0 tracking-[-0.02em]">
            {StaffStrings.inviteTitle}
          </h2>
          <p className="text-[16px] font-semibold text-[var(--pd-muted)] mt-1 m-0">
            {StaffStrings.inviteBody}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {errorMessage && (
            <div className="p-3.5 bg-[var(--pd-bad-bg)] border border-[var(--pd-bad)]/25 rounded-[var(--pd-card-radius)] flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 shrink-0 text-[var(--pd-bad)] mt-0.5" strokeWidth={2.25} aria-hidden="true" />
              <span className="text-[15px] font-semibold text-[var(--pd-bad)]">{errorMessage}</span>
            </div>
          )}

          <div>
            <label htmlFor="staff-email" className="block text-[16px] font-semibold text-[var(--pd-navy)] mb-1.5">
              {StaffStrings.emailLabel}
            </label>
            <input
              id="staff-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={StaffStrings.emailPlaceholder}
              required
              autoFocus
              className="w-full min-h-[var(--pd-field-h)] px-4 rounded-[var(--pd-field-radius)] border-2 border-[var(--pd-line)] text-[var(--pd-navy)] text-[18px] font-semibold focus:outline-none focus:border-[var(--pd-blue)]"
            />
          </div>

          <div>
            <span className="block text-[16px] font-semibold text-[var(--pd-navy)] mb-2">
              {StaffStrings.roleLabel}
            </span>
            <div className="flex flex-col gap-2.5">
              {assignableRoles.map((r) => (
                <label
                  key={r}
                  className={`flex items-center justify-between p-4 min-h-[56px] rounded-[var(--pd-field-radius)] border-2 cursor-pointer transition-colors ${
                    role === r ? 'border-[var(--pd-blue)] bg-[var(--pd-tint)]' : 'border-[var(--pd-line-2)]'
                  }`}
                >
                  <span className="text-[16px] font-semibold text-[var(--pd-navy)] pr-2">
                    {StaffStrings.roleSentence[r]}
                  </span>
                  <input
                    type="radio"
                    name="invite-role"
                    value={r}
                    checked={role === r}
                    onChange={() => setRole(r)}
                    className="w-5 h-5 accent-[var(--pd-blue)] shrink-0"
                  />
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !email.trim()}
            className="w-full min-h-[60px] rounded-[var(--pd-field-radius)] bg-[var(--pd-blue)] hover:bg-[var(--pd-blue-hover)] text-white text-[20px] font-extrabold disabled:opacity-50 inline-flex items-center justify-center gap-2 cursor-pointer mt-1"
          >
            <Send className="w-5 h-5" strokeWidth={2.25} aria-hidden="true" />
            <span>{isSubmitting ? StaffStrings.sending : StaffStrings.sendInvite}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full min-h-[48px] text-[17px] font-extrabold text-[var(--pd-blue)] cursor-pointer"
          >
            {StaffStrings.cancel}
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
};
