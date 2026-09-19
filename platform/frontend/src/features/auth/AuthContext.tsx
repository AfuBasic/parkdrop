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
      // 1. Check local Dexie storage
      const meta = await db.deviceMeta.toCollection().first();
      setDeviceMeta(meta || null);

      const recentIdentity = await getMostRecentRememberedIdentity();
      setRememberedIdentity(recentIdentity);

      // 2. Inspect server session via Sanctum
      let sessionData = null;
      let sessionUnauthorized = false;

      try {
        const res = await authApi.getSession();
        if (res.authenticated && res.user) {
          sessionData = res;
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          sessionUnauthorized = true;
        } else {
          // Network error or offline: do NOT log out or clear session if device exists
          console.warn('Network error checking session, respecting offline state:', err);
        }
      }

      // 3. Resolve state machine
      if (sessionData?.user) {
        setUser(sessionData.user);
        setBusiness(sessionData.business);
        
        // If device requires PIN lock
        if (meta?.pin_hash) {
          setState('locked');
        } else {
          setState('authenticated');
        }
        return;
      }

      // If server explicitly said 401 Unauthenticated
      if (sessionUnauthorized || !sessionData) {
        if (recentIdentity) {
          setState('remembered_expired');
        } else if (meta?.first_name) {
          // Fallback to device meta if available
          setState('remembered_expired');
        } else {
          setState('unknown');
        }
      }
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
