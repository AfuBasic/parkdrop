/* eslint-disable react-refresh/only-export-components */
import * as React from 'react';
import { db, type DeviceMeta, type RememberedIdentity } from '@/lib/db';
import { authApi } from './api';
import { getMostRecentRememberedIdentity, saveRememberedIdentity, clearAllRememberedIdentities } from './lib/rememberedIdentity';
import type { AuthUser, AuthBusiness } from './types';
import { ApiError } from '@/lib/api';
import { saveOfflineAuthorization, clearOfflineAuthorization, getValidOfflineAuthorization } from '@/offline/device/device-identity';

export type AuthState = 
  | 'booting'              // Initial state while resolving session/storage
  | 'authenticated'        // Valid session exists -> Dashboard
  | 'onboarding'           // Authenticated user but business/onboarding incomplete -> OnboardingFlow
  | 'locked'               // Device registered with PIN lock -> UnlockScreen
  | 'remembered_expired'   // Device has remembered email but session expired -> RememberedReauthScreen
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthState>('booting');
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [business, setBusiness] = React.useState<AuthBusiness | null>(null);
  const [role, setRole] = React.useState<string | null>(null);
  const [deviceMeta, setDeviceMeta] = React.useState<DeviceMeta | null>(null);
  const [rememberedIdentity, setRememberedIdentity] = React.useState<RememberedIdentity | null>(null);

  const initAuth = React.useCallback(async () => {
    setState('booting');
    try {
      // ─── Phase 1: Resolve from local IndexedDB immediately (no network) ───────
      const meta = await db.deviceMeta.toCollection().first();
      setDeviceMeta(meta || null);

      const recentIdentity = await getMostRecentRememberedIdentity();
      setRememberedIdentity(recentIdentity);

      const offlineAuth = await getValidOfflineAuthorization();

      // Determine local-only state and render immediately
      let localState: typeof state;
      if (meta?.pin_hash) {
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
      authApi.getSession().then((res) => {
        if (!res.authenticated || !res.user) return; // no upgrade possible

        setUser(res.user);
        setBusiness(res.business);
        setRole(res.role || null);

        if (res.business) {
           saveOfflineAuthorization(res.user.id, res.business.id, res.business.name, null).catch(console.error);
        }

        if (res.needs_onboarding || !res.business) {
          setState('onboarding');
          return;
        }

        // Server confirms session is live
        if (meta?.pin_hash) {
          setState('locked');
        } else {
          setState('authenticated');
        }
      }).catch(async (err) => {
        if (err instanceof ApiError && err.status === 401) {
          // 401 means session truly expired, revoke offline authorization.
          await clearOfflineAuthorization();
          setState(recentIdentity ? 'remembered_expired' : 'unknown');
        } else {
          console.warn('Background session check failed, keeping local state:', err);
        }
      });

    } catch (err) {
      console.error('Auth initialization error:', err);
      setState('unknown');
    }
  }, []);

  React.useEffect(() => {
    initAuth();
  }, [initAuth]);

  const setAuthenticatedUser = async (authUser: AuthUser, authBusiness: AuthBusiness | null, authRole?: string | null) => {
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
    setState('authenticated');
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.warn('Logout API error:', e);
    }

    setUser(null);
    setBusiness(null);
    setRole(null);
    await clearOfflineAuthorization();
    
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
    await clearOfflineAuthorization();
    setRememberedIdentity(null);
    setDeviceMeta(null);
    setUser(null);
    setBusiness(null);
    setRole(null);
    setState('unknown');
  };

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

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
