import * as React from 'react';
import { AuthProvider, useAuth } from '@/features/auth/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import { AuthFlow } from '@/features/auth/components/AuthFlow';
import { RememberedReauthFlow } from '@/features/auth/components/RememberedReauthFlow';
import { UnlockScreen } from '@/features/auth/screens/UnlockScreen';
import { ThemeDemo } from '@/routes/theme-demo';

function AppContent() {
  const { 
    state, 
    user, 
    business, 
    deviceMeta, 
    rememberedIdentity, 
    unlock, 
    logout, 
    forgetRememberedIdentity 
  } = useAuth();
  const [switchAccount, setSwitchAccount] = React.useState(false);

  if (state === 'booting') {
    return (
      <div className="min-h-screen bg-surface-page flex flex-col items-center justify-center p-4">
        <img 
          src="/parkdrop-icon-only.png" 
          alt="ParkDrop Logo" 
          className="w-12 h-12 object-contain mb-4 animate-pulse drop-shadow-sm" 
        />
        <div className="w-6 h-6 border-2 border-action-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If user has a remembered identity and session expired, offer 1-tap re-auth unless they explicitly switched
  if (state === 'remembered_expired' && rememberedIdentity && !switchAccount) {
    return (
      <RememberedReauthFlow
        identity={rememberedIdentity}
        onSwitchToEmail={() => setSwitchAccount(true)}
      />
    );
  }

  // Unknown visitor or user chose to switch account
  if (state === 'unknown' || (state === 'remembered_expired' && switchAccount)) {
    return (
      <AuthFlow 
        initialEmail={switchAccount && rememberedIdentity ? '' : ''} 
      />
    );
  }

  // Device registered with local PIN protection
  if (state === 'locked' && deviceMeta) {
    return (
      <UnlockScreen 
        deviceMeta={deviceMeta} 
        onUnlocked={unlock} 
        onLogout={forgetRememberedIdentity} 
      />
    );
  }

  // Authenticated state (active session)
  return (
    <div className="min-h-screen bg-surface-page flex flex-col items-center justify-center p-6 text-center">
      <img 
        src="/parkdrop-icon-only.png" 
        alt="ParkDrop Logo" 
        className="w-20 h-20 object-contain mb-6 drop-shadow-md" 
      />
      <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">
        Welcome to ParkDrop Dashboard
      </h1>
      <p className="text-text-secondary mb-2 max-w-sm">
        Signed in as <strong className="text-text-primary">{user?.first_name || user?.email}</strong>
      </p>
      {business && (
        <p className="text-xs text-text-muted mb-8">
          Business: <span className="font-semibold text-text-secondary">{business.name}</span>
        </p>
      )}
      
      <div className="flex flex-col sm:flex-row gap-3">
        <button 
          onClick={logout}
          className="px-6 py-2.5 bg-surface-default hover:bg-surface-subtle text-text-primary border border-border-default font-medium rounded-xl transition-colors cursor-pointer text-sm"
        >
          Sign Out
        </button>

        <button 
          onClick={forgetRememberedIdentity}
          className="px-6 py-2.5 bg-status-danger-bg text-status-danger-text border border-status-danger-border font-semibold rounded-xl hover:opacity-90 transition-opacity cursor-pointer text-sm"
        >
          Reset Device
        </button>
      </div>
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
