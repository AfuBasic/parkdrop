import * as React from 'react';
import { RouterProvider } from '@tanstack/react-router';
import { router } from '@/router';
import { AuthProvider, useAuth } from '@/features/auth/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import { AuthFlow } from '@/features/auth/components/AuthFlow';
import { RememberedReauthFlow } from '@/features/auth/components/RememberedReauthFlow';
import { ForgotPinFlow } from '@/features/auth/components/ForgotPinFlow';
import { UnlockScreen } from '@/features/auth/screens/UnlockScreen';
import { ThemeDemo } from '@/routes/theme-demo';
import { RecoveryScreen } from '@/features/recovery/RecoveryScreen';

/** Shown while the app resolves who this is, and while the app chunk loads. */
function BootSplash() {
  return (
    <div className="min-h-[100dvh] bg-surface-page flex flex-col items-center justify-center p-4">
      <img
        src="/parkdrop-icon-only.png"
        alt=""
        aria-hidden="true"
        width={48}
        height={48}
        className="w-12 h-12 object-contain mb-4 animate-pulse drop-shadow-sm"
      />
      <div
        className="w-6 h-6 border-2 border-action-primary border-t-transparent rounded-full animate-spin"
        role="status"
        aria-label="Loading ParkDrop"
      />
    </div>
  );
}

function AppContent() {
  const {
    state,
    business,
    deviceMeta,
    rememberedIdentity,
    unlock,
    forgetRememberedIdentity,
  } = useAuth();
  const [switchAccount, setSwitchAccount] = React.useState(false);
  const [isForgotPin, setIsForgotPin] = React.useState(false);
  
  if (state === 'booting') {
    return <BootSplash />;
  }

  if (state === 'recovery') {
    return (
      <RecoveryScreen
        businessId={business?.id}
        onRecoverySuccess={() => window.location.reload()}
      />
    );
  }

  // If user has a remembered identity and session expired, offer 1-tap re-auth unless they explicitly switched
  if (state === 'remembered_expired' && rememberedIdentity && !switchAccount) {
    return (
      <RememberedReauthFlow
        identity={rememberedIdentity}
        onSwitchToNewAccount={() => setSwitchAccount(true)}
      />
    );
  }

  // Unknown visitor, onboarding pending, or user chose to switch account
  if (state === 'unknown' || state === 'onboarding' || (state === 'remembered_expired' && switchAccount)) {
    return (
      <AuthFlow />
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
        onNotYou={forgetRememberedIdentity}
        onForgotPin={() => setIsForgotPin(true)}
        // Five wrong tries falls back to a code rather than locking them out.
        onTooManyAttempts={() => setIsForgotPin(true)}
      />
    );
  }

  // Authenticated state (active session).
  return (
    <React.Suspense fallback={<BootSplash />}>
      <RouterProvider router={router} />
    </React.Suspense>
  );
}

/**
 * A harness for looking at the Home screen in every state it can be in.
 *
 * Gated on import.meta.env.DEV so the module, and the seeder it pulls in,
 * are dropped from the production bundle entirely.
 */
const HomePreview = import.meta.env.DEV
  ? React.lazy(() => import('@/routes/home-preview'))
  : null;

function App() {
  if (
    HomePreview &&
    typeof window !== 'undefined' &&
    window.location.pathname === '/home-preview'
  ) {
    return (
      <React.Suspense fallback={<BootSplash />}>
        <HomePreview />
      </React.Suspense>
    );
  }

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
