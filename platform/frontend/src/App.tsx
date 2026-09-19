import * as React from 'react';
import { AuthProvider, useAuth } from '@/features/auth/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import { AuthFlow } from '@/features/auth/components/AuthFlow';
import { UnlockScreen } from '@/features/auth/screens/UnlockScreen';
import { ThemeDemo } from '@/routes/theme-demo';

function AppContent() {
  const { state, deviceMeta, unlock, logout } = useAuth();

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-surface-page flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-action-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (state === 'unregistered') {
    return <AuthFlow />;
  }

  if (state === 'locked' && deviceMeta) {
    return <UnlockScreen deviceMeta={deviceMeta} onUnlocked={unlock} onLogout={logout} />;
  }

  return (
    <div className="min-h-screen bg-surface-page flex flex-col items-center justify-center p-6">
      <img src="/parkdrop-icon-only.png" alt="ParkDrop Logo" className="w-20 h-20 object-contain mb-6 drop-shadow-md" />
      <h1 className="text-2xl font-bold text-text-primary mb-2">Welcome to ParkDrop Dashboard</h1>
      <p className="text-text-secondary mb-8 text-center max-w-sm">
        Your first-time setup is complete. You can now start managing packages and SMS credits.
      </p>
      
      <button 
        onClick={logout}
        className="px-6 py-2 bg-status-danger-bg text-status-danger-text border border-status-danger-border font-semibold rounded-xl hover:opacity-90 transition-opacity"
      >
        Sign Out & Reset Device
      </button>
    </div>
  );
}

function App() {
  if (typeof window !== 'undefined' && window.location.pathname === '/theme') {
    return (
      <React.Fragment>
        <ThemeDemo />
        <Toaster />
      </React.Fragment>
    );
  }

  return (
    <AuthProvider>
      <AppContent />
      <Toaster />
    </AuthProvider>
  );
}

export default App;
