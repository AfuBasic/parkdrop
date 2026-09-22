import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Check } from 'lucide-react';
import { accountApi } from '@/features/account/api/account-api';
import type { UserProfile, BusinessMembershipSummary, RegisteredDevice } from '@/features/account/account-types';
import { AccountIdentitySection } from '@/features/account/components/AccountIdentitySection';
import { CurrentDeviceSection } from '@/features/account/components/CurrentDeviceSection';
import { DeviceList } from '@/features/account/components/DeviceList';
import { SignOutConfirmDialog } from '@/features/account/components/SignOutConfirmDialog';
import { getLocalAuthorization } from '@/offline/device/device-identity';
import type { LocalAuthorization } from '@/offline/db/schema';
import { db } from '@/offline/db/database';
import { SyncEngine } from '@/offline/sync/sync-engine';
import { useAuth } from '@/features/auth/AuthContext';
import { TaskHeader } from '@/design-system/shell/TaskHeader';
import { AccountStrings } from '@/features/account/strings';

interface AccountSecurityScreenProps {
  onBack?: () => void;
}

export const AccountSecurityScreen: React.FC<AccountSecurityScreenProps> = ({ onBack }) => {
  const routerNavigate = useNavigate();
  const handleBack = onBack ?? (() => routerNavigate({ to: '/more' }));
  const { logout, user: authUser, business } = useAuth();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ user: UserProfile; businesses: BusinessMembershipSummary[] } | null>(null);
  const [devices, setDevices] = useState<RegisteredDevice[]>([]);
  const [offlineAuth, setOfflineAuth] = useState<LocalAuthorization | null>(null);

  const [isSavingName, setIsSavingName] = useState(false);
  const [revokingDeviceId, setRevokingDeviceId] = useState<number | null>(null);
  const [isRevokingOthers, setIsRevokingOthers] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Sign out confirmation dialog state
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingBusinesses, setPendingBusinesses] = useState<Array<{ businessId: number; count: number }>>([]);
  const [isSyncingSignOut, setIsSyncingSignOut] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [profileRes, devicesRes, localAuth] = await Promise.all([
        accountApi.getProfile().catch((err) => {
          console.warn('Could not fetch server profile, using active auth session:', err);
          return {
            user: {
              id: authUser?.id || 1,
              email: authUser?.email || '',
              first_name: authUser?.first_name || '',
              status: 'active',
              email_verified_at: new Date().toISOString(),
            },
            businesses: business ? [{ business_id: business.id, business_name: business.name, role: 'owner' }] : [],
          };
        }),
        accountApi.getDevices().catch((err) => {
          console.warn('Could not fetch registered devices:', err);
          return { devices: [] };
        }),
        getLocalAuthorization(),
      ]);

      setProfile(profileRes);
      setDevices(devicesRes.devices);
      setOfflineAuth(localAuth);
    } finally {
      setLoading(false);
    }
  }, [authUser, business]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateName = async (newName: string) => {
    setIsSavingName(true);
    try {
      const res = await accountApi.updateProfile({ first_name: newName });
      setProfile((prev) => prev ? {
        ...prev,
        user: { ...prev.user, first_name: res.user.first_name },
      } : null);
      setFeedbackMessage(AccountStrings.nameUpdated);
      setTimeout(() => setFeedbackMessage(null), 3000);
    } finally {
      setIsSavingName(false);
    }
  };

  const handleRevokeDevice = async (deviceId: number) => {
    setRevokingDeviceId(deviceId);
    try {
      await accountApi.revokeDevice(deviceId);
      setDevices((prev) =>
        prev.map((d) => (d.id === deviceId ? { ...d, is_revoked: true, revoked_at: new Date().toISOString() } : d))
      );
    } catch (err: any) {
      alert(err?.message || AccountStrings.couldNotRevoke);
    } finally {
      setRevokingDeviceId(null);
    }
  };

  const handleRevokeAllOthers = async () => {
    if (!confirm(AccountStrings.revokeAllOthers + '?')) {
      return;
    }
    setIsRevokingOthers(true);
    try {
      await accountApi.revokeOtherDevices();
      setDevices((prev) =>
        prev.map((d) => (!d.is_current ? { ...d, is_revoked: true, revoked_at: new Date().toISOString() } : d))
      );
    } catch (err: any) {
      alert(err?.message || AccountStrings.couldNotRevokeOthers);
    } finally {
      setIsRevokingOthers(false);
    }
  };

  // Check pending mutations across ALL businesses before signing out
  const handleInitiateSignOut = async () => {
    try {
      const allPending = await db.mutations
        .where('status')
        .anyOf(['PENDING', 'RETRYABLE'])
        .toArray();

      if (allPending.length > 0) {
        const businessCounts = new Map<number, number>();
        for (const m of allPending) {
          businessCounts.set(m.business_id, (businessCounts.get(m.business_id) || 0) + 1);
        }

        const summaries = Array.from(businessCounts.entries()).map(([businessId, count]) => ({
          businessId,
          count,
        }));

        setPendingCount(allPending.length);
        setPendingBusinesses(summaries);
        setIsSignOutModalOpen(true);
        return;
      }

      await logout();
    } catch (e) {
      console.warn('Error checking pending mutations before logout:', e);
      await logout();
    }
  };

  const handleSyncAndSignOut = async () => {
    setIsSyncingSignOut(true);
    try {
      for (const b of pendingBusinesses) {
        try {
          await SyncEngine.sync(b.businessId);
        } catch (syncErr) {
          console.warn(`Sync failed for business #${b.businessId} during sign-out:`, syncErr);
        }
      }
      setIsSignOutModalOpen(false);
      await logout();
    } finally {
      setIsSyncingSignOut(false);
    }
  };

  const handleConfirmSignOutAnyway = async () => {
    setIsSignOutModalOpen(false);
    await logout();
  };

  const currentDevice = devices.find((d) => d.is_current) || {
    id: 0,
    device_name: AccountStrings.thisPhoneLabel,
    is_current: true,
    authorized_at: offlineAuth?.authorized_at || null,
    last_seen_at: new Date().toISOString(),
    revoked_at: null,
    is_revoked: false,
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--pd-page-2)] w-full max-w-lg mx-auto pb-16">
      <TaskHeader title={AccountStrings.title} onBack={handleBack} screenName="This phone" />

      <main className="flex-1 p-4 flex flex-col gap-4">
        {feedbackMessage && (
          <div
            role="status"
            className="p-3.5 rounded-[var(--pd-card-radius)] bg-[var(--pd-ok-bg)] border border-[var(--pd-ok)]/25 flex items-center gap-2.5"
          >
            <Check className="w-5 h-5 shrink-0 text-[var(--pd-ok)]" strokeWidth={2.25} aria-hidden="true" />
            <span className="text-[16px] font-semibold text-[var(--pd-ok)]">{feedbackMessage}</span>
          </div>
        )}

        {loading && !profile ? (
          <div className="p-8 text-center text-[16px] font-semibold text-[var(--pd-muted)]">
            {AccountStrings.loading}
          </div>
        ) : (
          <>
            {profile && (
              <AccountIdentitySection
                user={profile.user}
                businesses={profile.businesses}
                onUpdateName={handleUpdateName}
                isSaving={isSavingName}
              />
            )}

            <CurrentDeviceSection device={currentDevice} authorization={offlineAuth} />

            <DeviceList
              devices={devices}
              onRevokeDevice={handleRevokeDevice}
              onRevokeAllOthers={handleRevokeAllOthers}
              revokingDeviceId={revokingDeviceId}
              isRevokingOthers={isRevokingOthers}
            />

            <div className="bg-white rounded-[var(--pd-card-radius)] border border-[var(--pd-line-2)] p-5 shadow-sm">
              <h2 className="text-[18px] font-extrabold text-[var(--pd-navy)] m-0 mb-1.5">
                {AccountStrings.activeSessionHeading}
              </h2>
              <p className="text-[15px] font-semibold text-[var(--pd-muted)] mb-4 m-0 mt-1.5">
                {AccountStrings.signOutBody}
              </p>
              <button
                type="button"
                onClick={handleInitiateSignOut}
                className="w-full min-h-[56px] rounded-[var(--pd-field-radius)] border-2 border-[var(--pd-line)] text-[18px] font-extrabold text-[var(--pd-navy)] cursor-pointer"
              >
                {AccountStrings.signOut}
              </button>
            </div>
          </>
        )}
      </main>

      <SignOutConfirmDialog
        isOpen={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
        onConfirmSignOutAnyway={handleConfirmSignOutAnyway}
        onSyncAndSignOut={handleSyncAndSignOut}
        pendingCount={pendingCount}
        pendingBusinesses={pendingBusinesses}
        isSyncing={isSyncingSignOut}
      />
    </div>
  );
};
