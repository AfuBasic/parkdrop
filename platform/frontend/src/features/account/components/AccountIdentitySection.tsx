import React, { useState } from 'react';
import type { UserProfile, BusinessMembershipSummary } from '../account-types';
import { AccountStrings } from '@/features/account/strings';

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
      setError(AccountStrings.nameTooShort);
      return;
    }
    if (trimmed.length > 100) {
      setError(AccountStrings.nameTooLong);
      return;
    }

    try {
      setError(null);
      await onUpdateName(trimmed);
      setIsEditing(false);
    } catch (err: any) {
      setError(err?.message || AccountStrings.couldNotUpdateName);
    }
  };

  const handleCancel = () => {
    setName(user.first_name);
    setError(null);
    setIsEditing(false);
  };

  return (
    <section
      aria-labelledby="account-identity-heading"
      className="bg-white rounded-[var(--pd-card-radius)] border border-[var(--pd-line-2)] p-5 shadow-sm"
    >
      <h2
        id="account-identity-heading"
        className="text-[18px] font-extrabold text-[var(--pd-navy)] m-0 mb-4 pb-3 border-b border-[var(--pd-line-2)]"
      >
        {AccountStrings.whoYouAreHeading}
      </h2>

      <div className="flex flex-col gap-4">
        <div>
          <span className="block text-[15px] font-bold text-[var(--pd-muted)] mb-1">
            {AccountStrings.emailLabel}
          </span>
          <div className="p-3.5 rounded-[var(--pd-field-radius)] bg-[var(--pd-page-2)] border border-[var(--pd-line-2)] text-[18px] font-semibold text-[var(--pd-navy)] truncate">
            {user.email}
          </div>
          <p className="text-[15px] text-[var(--pd-muted)] mt-1.5 m-0">{AccountStrings.signInMethod}</p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[15px] font-bold text-[var(--pd-muted)]">{AccountStrings.nameLabel}</span>
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="min-h-[48px] px-2 -mr-2 text-[16px] font-extrabold text-[var(--pd-blue)] cursor-pointer"
              >
                {AccountStrings.changeName}
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSave} className="flex flex-col gap-3">
              <input
                id="display-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSaving}
                autoFocus
                className="w-full min-h-[var(--pd-field-h)] px-4 rounded-[var(--pd-field-radius)] border-2 border-[var(--pd-blue)] text-[var(--pd-navy)] text-[18px] font-semibold focus:outline-none"
                placeholder={AccountStrings.namePlaceholder}
                aria-label={AccountStrings.nameLabel}
              />
              {error && (
                <p className="text-[15px] font-semibold text-[var(--pd-bad)] m-0" role="alert">
                  {error}
                </p>
              )}
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="min-h-[48px] px-4 rounded-[var(--pd-field-radius)] text-[16px] font-extrabold text-white bg-[var(--pd-blue)] hover:bg-[var(--pd-blue-hover)] disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? AccountStrings.saving : AccountStrings.save}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="min-h-[48px] px-4 text-[16px] font-extrabold text-[var(--pd-muted)] cursor-pointer"
                >
                  {AccountStrings.cancel}
                </button>
              </div>
            </form>
          ) : (
            <div className="p-3.5 rounded-[var(--pd-field-radius)] bg-[var(--pd-page-2)] border border-[var(--pd-line-2)] text-[18px] font-semibold text-[var(--pd-navy)]">
              {user.first_name || AccountStrings.nameNotSet}
            </div>
          )}
        </div>

        {businesses.length > 0 && (
          <div>
            <span className="block text-[15px] font-bold text-[var(--pd-muted)] mb-1.5">
              {AccountStrings.workplacesHeading}
            </span>
            <div className="flex flex-col gap-2">
              {businesses.map((b) => (
                <div
                  key={b.business_id}
                  className="flex items-center justify-between p-3 rounded-[var(--pd-field-radius)] bg-[var(--pd-page-2)] border border-[var(--pd-line-2)]"
                >
                  <span className="text-[16px] font-semibold text-[var(--pd-navy)] truncate">
                    {b.business_name || 'Business #' + b.business_id}
                  </span>
                  <span className="text-[15px] font-semibold text-[var(--pd-muted)] ml-2 shrink-0">
                    {b.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
