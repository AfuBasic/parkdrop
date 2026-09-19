/* eslint-disable react-refresh/only-export-components */
import * as React from 'react';
import { db, type DeviceMeta, type RememberedIdentity } from '@/lib/db';
import { authApi } from './api';
import { getMostRecentRememberedIdentity, saveRememberedIdentity, clearAllRememberedIdentities } from './lib/rememberedIdentity';
import type { AuthUser, AuthBusiness } from './types';
import { ApiError } from '@/lib/api';

export type AuthState = 
  | 'booting'              // Initial state while resolving session/storage
  | 'authenticated'        // Valid session exists -> Dashboard
  | 'onboarding'           // Authenticated user but business/onboarding incomplete -> OnboardingFlow
  | 'locked'               // Device registered with PIN lock -> UnlockScreen
  | 'remembered_expired'   // Device has remembered email but session expired -> RememberedReauthScreen
  | 'unknown';             // Fresh unknown visitor -> Universal Email OTP Flow

interface AuthContextValue {
  state: AuthState;
  user: AuthUser | null;
  business: AuthBusiness | null;
  deviceMeta: DeviceMeta | null;
  rememberedIdentity: RememberedIdentity | null;
  setAuthenticatedUser: (user: AuthUser, business: AuthBusiness | null) => Promise<void>;
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
  const [deviceMeta, setDeviceMeta] = React.useState<DeviceMeta | null>(null);
  const [rememberedIdentity, setRememberedIdentity] = React.useState<RememberedIdentity | null>(null);

  const initAuth = React.useCallback(async () => {
    setState('booting');
    try {
      // ─── Phase 1: Resolve from local IndexedDB immediately (no network) ───────
      // This resolves state instantly without any spinner delay.
      const meta = await db.deviceMeta.toCollection().first();
      setDeviceMeta(meta || null);

      const recentIdentity = await getMostRecentRememberedIdentity();
      setRememberedIdentity(recentIdentity);

      // Determine local-only state and render immediately
      let localState: typeof state;
      if (meta?.pin_hash) {
        localState = 'locked';
      } else if (recentIdentity || meta?.first_name) {
        localState = 'remembered_expired';
      } else {
        localState = 'unknown';
      }
      setState(localState);

      // ─── Phase 2: Validate against server session in background ──────────────
      // Do NOT block the UI. This silently upgrades or downgrades state if needed.
      authApi.getSession().then((res) => {
        if (!res.authenticated || !res.user) return; // no upgrade possible

        setUser(res.user);
        setBusiness(res.business);

        if (res.needs_onboarding || !res.business) {
          setState('onboarding');
          return;
        }

        // Server confirms session is live — upgrade from local state
        if (meta?.pin_hash) {
          // Device still locked; keep showing PIN screen even with live session
          setState('locked');
        } else {
          setState('authenticated');
        }
      }).catch((err) => {
        // 401 means session truly expired — local state already set correctly, nothing to do.
        // Network failure? Local state is already appropriate; don't touch it.
        if (err instanceof ApiError && err.status === 401) {
          // Already set to correct degraded state in Phase 1
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

  const setAuthenticatedUser = async (authUser: AuthUser, authBusiness: AuthBusiness | null) => {
    setUser(authUser);
    setBusiness(authBusiness);

    // Persist to remembered identity in Dexie
    await saveRememberedIdentity({
      email: authUser.email,
      name: authUser.first_name,
      business_name: authBusiness?.name,
    });

    const recent = await getMostRecentRememberedIdentity();
    setRememberedIdentity(recent);

    // If local PIN exists, lock; else go straight to authenticated
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
    
    // Check if we have a remembered identity to fall back to
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
    setRememberedIdentity(null);
    setDeviceMeta(null);
    setUser(null);
    setBusiness(null);
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
