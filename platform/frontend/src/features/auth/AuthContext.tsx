/* eslint-disable react-refresh/only-export-components */
import * as React from 'react';
import { db, type DeviceMeta, type RememberedIdentity } from '@/lib/db';
import { db as offlineDb } from '@/offline/db/database';
import { authApi } from './api';
import { getMostRecentRememberedIdentity, saveRememberedIdentity, clearAllRememberedIdentities } from './lib/rememberedIdentity';
import type { AuthUser, AuthBusiness } from './types';
import { ApiError, onSessionExpired } from '@/lib/api';
import { saveOfflineAuthorization, clearOfflineAuthorization, getValidOfflineAuthorization } from '@/offline/device/device-identity';
import { consumePendingPaymentReturnIfValid } from '@/features/sms-credits/purchase/payment-return-guard';
import { recordActivity, isWithinIdleWindow, clearActivity } from './lib/idle-lock';

export type AuthState = 
  | 'booting'              // Initial state while resolving session/storage
  | 'authenticated'        // Valid session exists -> Dashboard
  | 'onboarding'           // Authenticated user but business/onboarding incomplete -> OnboardingFlow
  | 'locked'               // Device registered with PIN lock -> UnlockScreen
  | 'remembered_expired'   // Device has remembered email but session expired -> RememberedReauthScreen
  | 'recovery'             // Database corruption, recovery marker or schema failure -> RecoveryScreen
  | 'unknown';             // Fresh unknown visitor -> Universal Email OTP Flow

export interface AuthContextValue {
  state: AuthState;
  user: AuthUser | null;
  business: AuthBusiness | null;
  role?: string | null;
  deviceMeta: DeviceMeta | null;
  rememberedIdentity: RememberedIdentity | null;
  setAuthenticatedUser: (user: AuthUser, business: AuthBusiness | null, role?: string | null) => Promise<void>;
  unlock: () => void;
  logout: () => Promise<void>;
  forgetRememberedIdentity: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export const AuthContext = React.createContext<AuthContextValue | null>(null);

import { LocalHealthCheck } from '@/offline/recovery/health-check';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthState>('booting');
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [business, setBusiness] = React.useState<AuthBusiness | null>(null);
  const [role, setRole] = React.useState<string | null>(null);
  const [deviceMeta, setDeviceMeta] = React.useState<DeviceMeta | null>(null);
  const [rememberedIdentity, setRememberedIdentity] = React.useState<RememberedIdentity | null>(null);

  /**
   * The session ended somewhere — mid-boot check, or a 401 from any request
   * anywhere in the app (see onSessionExpired in lib/api.ts). An expired
   * session is an ordinary thing that happens to everyone, not a fault, so
   * this just moves the user to the right sign-in screen quietly rather
   * than leaving whatever screen they were on stuck showing a stale error.
   */
  const handleSessionExpired = React.useCallback(async () => {
    setUser(null);
    setBusiness(null);
    setRole(null);
    await clearOfflineAuthorization();
    const recent = await getMostRecentRememberedIdentity();
    setRememberedIdentity(recent);
    setState(recent ? 'remembered_expired' : 'unknown');
  }, []);

  React.useEffect(() => onSessionExpired(() => { void handleSessionExpired(); }), [handleSessionExpired]);

  const initAuth = React.useCallback(async () => {
    setState('booting');
    try {
      // ─── Phase 0: Local Health & Integrity Check (< 15ms) ───────────────────
      const health = await LocalHealthCheck.checkStartupHealth();
      if (!health.isHealthy && health.state === 'RECOVERY_REQUIRED') {
        setState('recovery');
        return;
      }

      // ─── Phase 1: Resolve from local IndexedDB immediately (no network) ───────
      const meta = await db.deviceMeta.toCollection().first();
      setDeviceMeta(meta || null);

      const recentIdentity = await getMostRecentRememberedIdentity();
      setRememberedIdentity(recentIdentity);

      const offlineAuth = await getValidOfflineAuthorization();

      // Landing back from a Paystack redirect is a full page reload, which
      // wipes this state and would otherwise force the PIN screen before
      // the person can even see whether their payment went through — see
      // payment-return-guard.ts for why that's a false re-lock, not a real
      // security boundary being (re)crossed.
      const skipPinForPaymentReturn = consumePendingPaymentReturnIfValid(window.location.pathname);

      // A reload seconds (or minutes) after the last tap isn't a new person
      // walking up to the device — re-locking on every single reload was
      // just noise. Only actual idleness (see IDLE_TIMEOUT_MS) is worth
      // re-locking on; see lib/idle-lock.ts.
      const skipPinForRecentActivity = isWithinIdleWindow();
      const skipPin = skipPinForPaymentReturn || skipPinForRecentActivity;
      if (skipPin) recordActivity(); // extend the window since we're back

      // Determine local-only state and render immediately
      let localState: typeof state;
      if (meta?.pin_hash && !skipPin) {
        localState = 'locked';
      } else if (offlineAuth) {
        localState = 'authenticated';
        // In a real app we might populate user/business partially from the lease here 
        // to render shell correctly immediately before network responds.
      } else if (recentIdentity || meta?.first_name) {
        localState = 'remembered_expired';
      } else {
        localState = 'unknown';
      }
      setState(localState);

      // ─── Phase 2: Validate against server session in background ──────────────
      //
      // A first-time visitor has no session cookie at all, so asking the server
      // about their session can only ever come back 401 — a guaranteed red
      // error in the console on the very first load, for a state that is
      // completely normal. Only ask when something local suggests there is a
      // session worth confirming.
      const mayHaveServerSession = Boolean(meta || recentIdentity || offlineAuth);

      if (!mayHaveServerSession) {
        return;
      }

      authApi.getSession().then(async (res) => {
        if (!res.authenticated || !res.user) return; // no upgrade possible

        // Detect user or business change across sessions on this device
        if (offlineAuth && res.business && offlineAuth.business_id !== res.business.id) {
          // Different business: purge previous tenant's local data to prevent leak
          await offlineDb.purgeTenantData(offlineAuth.business_id);
        }

        setUser(res.user);
        setBusiness(res.business);
        setRole(res.role || null);

        if (res.business) {
           saveOfflineAuthorization(res.user.id, res.business.id, res.business.name, null).catch((err) => {
             if (import.meta.env.DEV) console.warn('Could not cache offline authorization:', err);
           });
        }

        if (res.needs_onboarding || !res.business) {
          setState('onboarding');
          return;
        }

        // Server confirms session is live
        if (meta?.pin_hash && !skipPin) {
          setState('locked');
        } else {
          setState('authenticated');
        }
      }).catch(async (err) => {
        if (err instanceof ApiError && err.status === 401) {
          // An expired session is an ordinary thing that happens to everyone,
          // not a fault. Revoke the offline authorization and move the user to
          // the right screen without writing anything to the console.
          await handleSessionExpired();
          return;
        }

        if (import.meta.env.DEV) {
          console.warn('Background session check failed, keeping local state:', err);
        }
      });

    } catch (err) {
      if (import.meta.env.DEV) console.error('Auth initialization error:', err);
      setState('unknown');
    }
  }, []);

  React.useEffect(() => {
    initAuth();
  }, [initAuth]);

  const setAuthenticatedUser = async (authUser: AuthUser, authBusiness: AuthBusiness | null, authRole?: string | null) => {
    // Check if switching to a different business/user
    const currentAuth = await getValidOfflineAuthorization();
    if (currentAuth && authBusiness && currentAuth.business_id !== authBusiness.id) {
      // Purge old business data
      await offlineDb.purgeTenantData(currentAuth.business_id);
    } else if (currentAuth && !authBusiness) {
      // User has no business yet (fresh onboarding) — wipe previous data
      await offlineDb.purgeAllTenantData();
    }

    setUser(authUser);
    setBusiness(authBusiness);
    setRole(authRole || null);

    // Persist to remembered identity in Dexie
    await saveRememberedIdentity({
      email: authUser.email,
      name: authUser.first_name,
      business_name: authBusiness?.name,
    });

    if (authBusiness) {
      await saveOfflineAuthorization(authUser.id, authBusiness.id, authBusiness.name, null);
    }

    const recent = await getMostRecentRememberedIdentity();
    setRememberedIdentity(recent);

    const meta = await db.deviceMeta.toCollection().first();
    if (meta?.pin_hash) {
      setState('locked');
    } else {
      setState('authenticated');
    }
  };

  const unlock = () => {
    recordActivity();
    setState('authenticated');
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // Logging out locally is what matters; a failed server call is not
      // something the user can act on.
      if (import.meta.env.DEV) console.warn('Logout request failed:', e);
    }

    // Purge tenant transactional data from offline storage on logout
    if (business?.id) {
      await offlineDb.purgeTenantData(business.id);
    } else {
      await offlineDb.purgeAllTenantData();
    }

    setUser(null);
    setBusiness(null);
    setRole(null);
    await clearOfflineAuthorization();
    clearActivity();

    const recent = await getMostRecentRememberedIdentity();
    if (recent) {
      setState('remembered_expired');
    } else {
      setState('unknown');
    }
  };

  const forgetRememberedIdentity = async () => {
    await clearAllRememberedIdentities();
    await db.deviceMeta.clear();
    await offlineDb.purgeAllTenantData();
    await clearOfflineAuthorization();
    clearActivity();
    setRememberedIdentity(null);
    setDeviceMeta(null);
    setUser(null);
    setBusiness(null);
    setRole(null);
    setState('unknown');
  };

  // While unlocked, keep the idle window alive on real interaction, and
  // re-lock automatically once the device has actually gone idle for
  // IDLE_TIMEOUT_MS — otherwise leaving the tab open indefinitely would
  // never re-lock at all, which defeats the point of a device PIN.
  React.useEffect(() => {
    if (state !== 'authenticated' || !deviceMeta?.pin_hash) return;

    const onActivity = () => recordActivity();
    const events = ['pointerdown', 'keydown', 'touchstart'] as const;
    events.forEach((event) => window.addEventListener(event, onActivity, { passive: true }));
    recordActivity();

    const checkIdle = window.setInterval(() => {
      if (!isWithinIdleWindow()) {
        clearActivity();
        setState('locked');
      }
    }, 30_000);

    return () => {
      events.forEach((event) => window.removeEventListener(event, onActivity));
      window.clearInterval(checkIdle);
    };
  }, [state, deviceMeta?.pin_hash]);

  const refreshSession = async () => {
    await initAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        state,
        user,
        business,
        role,
        deviceMeta,
        rememberedIdentity,
        setAuthenticatedUser,
        unlock,
        logout,
        forgetRememberedIdentity,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

const DEFAULT_AUTH_CONTEXT: AuthContextValue = {
  state: 'unknown',
  user: null,
  business: null,
  role: null,
  deviceMeta: null,
  rememberedIdentity: null,
  setAuthenticatedUser: async () => {},
  unlock: () => {},
  logout: async () => {},
  forgetRememberedIdentity: async () => {},
  refreshSession: async () => {},
};

export function useAuth() {
  const context = React.useContext(AuthContext);
  return context ?? DEFAULT_AUTH_CONTEXT;
}

