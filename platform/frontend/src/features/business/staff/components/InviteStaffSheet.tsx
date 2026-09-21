import React, { useState } from 'react';
import type { BusinessRole } from '/Library/WebServer/Documents/projects/parkdrop/platform/frontend/src/features/business/permissions/business-permissions';
import { X, Send, AlertTriangle } from 'lucide-react';

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

  if (!isOpen) return null;

  // Role options according to inviter permissions:
  // Owner can invite Owner, Manager, or Attendant.
  // Manager can invite Attendant only.
  const assignableRoles: { value: BusinessRole; label: string; description: string }[] =
    currentUserRole === 'owner'
      ? [
          {
            value: 'attendant',
            label: 'Attendant',
            description: 'Can log packages, record payments, and release parcels.',
          },
          {
            value: 'manager',
            label: 'Manager',
            description: 'Can view staff and invite attendants alongside operational tasks.',
          },
          {
            value: 'owner',
            label: 'Owner',
            description: 'Full business management, staff roles, and settings.',
          },
        ]
      : [
          {
            value: 'attendant',
            label: 'Attendant',
            description: 'Can log packages, record payments, and release parcels.',
          },
        ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
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
      setErrorMessage(err.message || 'Could not send invitation. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-sheet-title"
    >
      <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-subtle">
          <div>
            <h2 id="invite-sheet-title" className="font-bold text-slate-900 text-base sm:text-lg">
              Invite staff member
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Send an email invitation to join this Business
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            aria-label="Close invite sheet"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          <div>
            <label htmlFor="staff-email" className="block text-xs font-semibold text-slate-700 mb-1">
              Email address
            </label>
            <input
              id="staff-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. emeka@example.com"
              required
              autoFocus
              className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 min-h-[48px]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Role in this Business
            </label>
            <div className="space-y-2">
              {assignableRoles.map((r) => (
                <label
                  key={r.value}
                  className={`flex items-start justify-between p-3.5 rounded-xl border cursor-pointer transition-colors ${
                    role === r.value
                      ? 'border-blue-500 bg-blue-50/50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex flex-col pr-2">
                    <span className="text-sm font-semibold text-slate-900">
                      {r.label}
                    </span>
                    <span className="text-xs text-slate-500 mt-0.5">
                      {r.description}
                    </span>
                  </div>
                  <input
                    type="radio"
                    name="invite-role"
                    value={r.value}
                    checked={role === r.value}
                    onChange={() => setRole(r.value)}
                    className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 mt-1"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 min-h-[48px] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !email.trim()}
              className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm disabled:opacity-50 min-h-[48px] inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Sending...' : 'Send invitation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
