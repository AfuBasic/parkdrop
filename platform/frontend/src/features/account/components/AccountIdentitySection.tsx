import React, { useState } from 'react';
import type { UserProfile, BusinessMembershipSummary } from '../account-types';

interface AccountIdentitySectionProps {
  user: UserProfile;
  businesses: BusinessMembershipSummary[];
  onUpdateName: (newName: string) => Promise<void>;
  isSaving?: boolean;
}

export const AccountIdentitySection: React.FC<AccountIdentitySectionProps> = ({
  user,
  businesses,
  onUpdateName,
  isSaving = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.first_name);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError('Display name must be at least 2 characters.');
      return;
    }
    if (trimmed.length > 100) {
      setError('Display name cannot exceed 100 characters.');
      return;
    }

    try {
      setError(null);
      await onUpdateName(trimmed);
      setIsEditing(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to update name. Please try again.');
    }
  };

  const handleCancel = () => {
    setName(user.first_name);
    setError(null);
    setIsEditing(false);
  };

  return (
    <section aria-labelledby="account-identity-heading" className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-xs">
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-neutral-100">
        <div>
          <h2 id="account-identity-heading" className="text-base font-semibold text-neutral-900 tracking-tight">
            Account Identity
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Passwordless account credentials and linked workplaces
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
          Verified
        </span>
      </div>

      <div className="space-y-4">
        {/* Email - Strictly read-only */}
        <div>
          <label className="block text-xs font-medium text-neutral-500 mb-1">
            Email address (Passwordless login)
          </label>
          <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-200/60 text-sm font-medium text-neutral-800">
            <span className="truncate">{user.email}</span>
            <span className="text-xs text-neutral-400 font-normal ml-2 shrink-0">Read-only</span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">
            Sign in anytime with one-time verification codes sent to this address.
          </p>
        </div>

        {/* Display Name */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="display-name-input" className="block text-xs font-medium text-neutral-500">
              Display Name
            </label>
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-xs font-medium text-sky-600 hover:text-sky-700 active:text-sky-800 focus:outline-hidden"
              >
                Change name
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-2">
              <input
                id="display-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSaving}
                autoFocus
                className="w-full text-sm font-medium px-3.5 py-2.5 rounded-xl border border-sky-400 bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 text-neutral-900"
                placeholder="Enter your first name or display name"
                aria-label="Display Name"
              />
              {error && (
                <p className="text-xs text-rose-600 font-medium" role="alert">
                  {error}
                </p>
              )}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 disabled:opacity-50 transition-colors shadow-xs"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="p-3 rounded-xl bg-neutral-50/60 border border-neutral-200/60 text-sm font-medium text-neutral-900">
              {user.first_name || 'Not set'}
            </div>
          )}
        </div>

        {/* Workplaces / Businesses */}
        {businesses.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1.5">
              Workplaces & Memberships
            </label>
            <div className="space-y-1.5">
              {businesses.map((b) => (
                <div
                  key={b.business_id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50/70 border border-neutral-200/50 text-xs"
                >
                  <span className="font-medium text-neutral-800 truncate">
                    {b.business_name || 'Business #' + b.business_id}
                  </span>
                  <span className="capitalize font-medium text-neutral-500 ml-2 px-2 py-0.5 rounded-md bg-white border border-neutral-200/70 shrink-0">
                    {b.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* App Version & Diagnostics Indicator */}
        <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400">
          <span>ParkDrop Mobile</span>
          <span className="font-mono">v{import.meta.env.VITE_APP_VERSION || '1.0.0'}</span>
        </div>
      </div>
    </section>
  );
};
