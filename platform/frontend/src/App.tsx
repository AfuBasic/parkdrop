import * as React from 'react';
import { AuthProvider, useAuth } from '@/features/auth/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import { AuthFlow } from '@/features/auth/components/AuthFlow';
import { RememberedReauthFlow } from '@/features/auth/components/RememberedReauthFlow';
import { ForgotPinFlow } from '@/features/auth/components/ForgotPinFlow';
import { UnlockScreen } from '@/features/auth/screens/UnlockScreen';
import { ThemeDemo } from '@/routes/theme-demo';
import { AppShell } from '@/design-system/shell/AppShell';
import { HomeScreen } from '@/features/home/HomeScreen';

function AppContent() {
  const { 
    state, 
    user, 
    
    deviceMeta, 
    rememberedIdentity, 
    unlock, 
    logout, 
    forgetRememberedIdentity 
  } = useAuth();
  const [switchAccount, setSwitchAccount] = React.useState(false);
  const [isForgotPin, setIsForgotPin] = React.useState(false);
  
  // Lightweight internal router for Build 4
  const [currentPath, setCurrentPath] = React.useState('/');

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

  // Unknown visitor, onboarding pending, or user chose to switch account
  if (state === 'unknown' || state === 'onboarding' || (state === 'remembered_expired' && switchAccount)) {
    return (
      <AuthFlow 
        initialEmail={switchAccount && rememberedIdentity ? '' : ''} 
      />
    );
  }

  // Device registered with local PIN protection
  if (state === 'locked' && deviceMeta) {
    if (isForgotPin) {
      return (
        <ForgotPinFlow 
          deviceMeta={deviceMeta} 
          rememberedIdentity={rememberedIdentity}
          onCancel={() => setIsForgotPin(false)} 
        />
      );
    }

    return (
      <UnlockScreen 
        deviceMeta={deviceMeta} 
        onUnlocked={unlock} 
        onLogout={forgetRememberedIdentity} 
        onForgotPin={() => setIsForgotPin(true)}
      />
    );
  }

  // Helper to render the placeholder screens for features not built yet
  const renderPlaceholder = (title: string, description: string) => (
    <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-center p-6">
      <h2 className="text-xl font-bold text-text-primary mb-2">{title}</h2>
      <p className="text-text-secondary mb-6">{description}</p>
      {currentPath !== '/' && (
        <button 
          onClick={() => setCurrentPath('/')}
          className="text-action-primary font-medium hover:underline"
        >
          Return to Home
        </button>
      )}
    </div>
  );

  // Authenticated state (active session)
  return (
    <AppShell currentPath={currentPath} onNavigate={setCurrentPath}>
      {currentPath === '/' && (
        <HomeScreen 
          onNavigateToSearch={() => setCurrentPath('/packages/search')}
          onNavigateToAdd={() => setCurrentPath('/add')}
          onNavigateToPackages={() => setCurrentPath('/packages')}
        />
      )}
      
      {currentPath === '/packages' && renderPlaceholder('Packages', 'Package list and management will be built in a future milestone.')}
      {currentPath === '/add' && renderPlaceholder('Add Package', 'The offline package creation flow will be built next.')}
      {currentPath === '/customers' && renderPlaceholder('Customers', 'Customer directory and lookup will be built in a future milestone.')}
      {currentPath === '/packages/search' && renderPlaceholder('Search Packages', 'Full package search capabilities will be built in a future milestone.')}
      
      {currentPath === '/more' && (
        <div className="flex flex-col h-full max-w-lg mx-auto pb-4 pt-6 text-center">
          <h2 className="text-2xl font-bold text-text-primary mb-8 tracking-tight">Settings & More</h2>
          <div className="bg-surface-default rounded-[var(--radius-xl)] p-6 shadow-sm border border-border-subtle flex flex-col gap-4">
            <p className="text-text-secondary mb-2">
              Signed in as <strong className="text-text-primary">{user?.first_name || user?.email}</strong>
            </p>
            <button 
              onClick={logout}
              className="px-6 py-3 w-full bg-surface-page hover:bg-surface-subtle text-text-primary border border-border-default font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Sign Out
            </button>
            <button 
              onClick={forgetRememberedIdentity}
              className="px-6 py-3 w-full mt-2 bg-status-danger-bg text-status-danger-text border border-status-danger-border font-semibold rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
            >
              Reset Device Identity
            </button>
          </div>
        </div>
      )}
    </AppShell>
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
