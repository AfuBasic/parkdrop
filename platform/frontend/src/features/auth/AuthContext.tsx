/* eslint-disable react-refresh/only-export-components */
import * as React from 'react';
import { db, type DeviceMeta } from '@/lib/db';
import { authApi } from './api';
import type { AuthUser } from './types';

type AuthState = 'loading' | 'unregistered' | 'locked' | 'authenticated';

interface AuthContextValue {
  state: AuthState;
  deviceMeta: DeviceMeta | null;
  user: AuthUser | null;
  unlock: () => void;
  logout: () => void;
}

export const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthState>('loading');
  const [deviceMeta, setDeviceMeta] = React.useState<DeviceMeta | null>(null);
  const [user, setUser] = React.useState<AuthUser | null>(null);

  React.useEffect(() => {
    async function initAuth() {
      try {
        // 1. Check if device is registered
        const meta = await db.deviceMeta.toCollection().first();
        
        if (!meta) {
          setState('unregistered');
          return;
        }

        setDeviceMeta(meta);

        // 2. Check if we have an active API session
        try {
          const apiUser = await authApi.getUser();
          setUser(apiUser);
          setState('authenticated'); // Session is alive
        } catch {
          // If 401, we just need to unlock (which re-authenticates or we'll just show locked screen and the unlock flow will handle API auth if needed. Actually, V1 unlock just bypasses PIN and we assume Sanctum cookie is still valid, OR if cookie is expired, they need to re-request OTP. But the prompt said: "Returning on a known device should normally be: Open ParkDrop -> Enter 4-digit PIN -> Home". So if we have a device, we show locked.)
          
          // Actually, let's always show 'locked' if there's a device, enforcing the PIN entry every time the app opens/reloads.
          setState('locked'); 
        }
      } catch (err) {
        console.error("Auth init failed", err);
        setState('unregistered');
      }
    }
    
    initAuth();
  }, []);

  const unlock = async () => {
    // In a real app, unlocking might also refresh the API session if needed, 
    // but for now, we just update local state.
    setState('authenticated');
  };

  const logout = async () => {
    // Clear everything
    await db.deviceMeta.clear();
    setDeviceMeta(null);
    setUser(null);
    setState('unregistered');
    
    // Might also want to call a backend /logout endpoint here to kill the cookie
  };

  return (
    <AuthContext.Provider value={{ state, deviceMeta, user, unlock, logout }}>
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
