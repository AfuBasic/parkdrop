import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
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

  // Handle Display Name Update
  const handleUpdateName = async (newName: string) => {
    setIsSavingName(true);
    try {
      const res = await accountApi.updateProfile({ first_name: newName });
      setProfile((prev) => prev ? {
        ...prev,
        user: { ...prev.user, first_name: res.user.first_name },
      } : null);
      setFeedbackMessage('Display name updated successfully.');
      setTimeout(() => setFeedbackMessage(null), 3000);
    } finally {
      setIsSavingName(false);
    }
  };

  // Handle Revoke Single Device
  const handleRevokeDevice = async (deviceId: number) => {
    setRevokingDeviceId(deviceId);
    try {
      await accountApi.revokeDevice(deviceId);
      setDevices((prev) =>
        prev.map((d) => (d.id === deviceId ? { ...d, is_revoked: true, revoked_at: new Date().toISOString() } : d))
      );
      setFeedbackMessage('Device access revoked.');
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (err: any) {
      alert(err?.message || 'Failed to revoke device access.');
    } finally {
      setRevokingDeviceId(null);
    }
  };

  // Handle Revoke All Other Devices
  const handleRevokeAllOthers = async () => {
    if (!confirm('Are you sure you want to revoke access from all other registered devices?')) {
      return;
    }
    setIsRevokingOthers(true);
    try {
      await accountApi.revokeOtherDevices();
      setDevices((prev) =>
        prev.map((d) => (!d.is_current ? { ...d, is_revoked: true, revoked_at: new Date().toISOString() } : d))
      );
      setFeedbackMessage('All other devices revoked.');
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (err: any) {
      alert(err?.message || 'Failed to revoke other devices.');
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
        // Group by business_id
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

      // No pending mutations -> sign out directly
      await logout();
    } catch (e) {
      console.warn('Error checking pending mutations before logout:', e);
      await logout();
    }
  };

  // Sync pending changes then sign out
  const handleSyncAndSignOut = async () => {
    setIsSyncingSignOut(true);
    try {
      // Attempt sync for all businesses that have pending changes
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

  // Confirm sign out anyway (preserves IndexedDB queue safely)
  const handleConfirmSignOutAnyway = async () => {
    setIsSignOutModalOpen(false);
    await logout();
  };

  const currentDevice = devices.find((d) => d.is_current) || {
    id: 0,
    device_name: 'This browser device',
    is_current: true,
    authorized_at: offlineAuth?.authorized_at || null,
    last_seen_at: new Date().toISOString(),
    revoked_at: null,
    is_revoked: false,
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-16">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-neutral-200/80 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="p-1.5 -ml-1.5 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200 transition-colors cursor-pointer"
            aria-label="Go back"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-bold text-neutral-900 leading-tight">Account & Security</h1>
            <p className="text-xs text-neutral-500">Manage identity, active devices, and sessions</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto p-4 space-y-4">
        {feedbackMessage && (
          <div
            role="status"
            className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium flex items-center gap-2 animate-in fade-in"
          >
            <svg className="w-4 h-4 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{feedbackMessage}</span>
          </div>
        )}

        {loading && !profile ? (
          <div className="p-8 text-center text-xs text-neutral-400">Loading security details...</div>
        ) : (
          <>
            {/* 1. Passwordless Identity Section */}
            {profile && (
              <AccountIdentitySection
                user={profile.user}
                businesses={profile.businesses}
                onUpdateName={handleUpdateName}
                isSaving={isSavingName}
              />
            )}

            {/* 2. Current Device & Offline Lease */}
            <CurrentDeviceSection
              device={currentDevice}
              authorization={offlineAuth}
            />

            {/* 3. Remote Devices List */}
            <DeviceList
              devices={devices}
              onRevokeDevice={handleRevokeDevice}
              onRevokeAllOthers={handleRevokeAllOthers}
              revokingDeviceId={revokingDeviceId}
              isRevokingOthers={isRevokingOthers}
            />

            {/* 4. Sign Out Card */}
            <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-xs">
              <h2 className="text-sm font-semibold text-neutral-900 mb-1">
                Active Session
              </h2>
              <p className="text-xs text-neutral-500 mb-3.5">
                Signing out clears authorization on this browser while safely preserving any unsynced offline records.
              </p>
              <button
                type="button"
                onClick={handleInitiateSignOut}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 border border-neutral-200 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </>
        )}
      </main>

      {/* Sign Out With Pending Changes Dialog */}
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
