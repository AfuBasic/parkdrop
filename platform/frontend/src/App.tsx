import * as React from 'react';
import { RouterProvider } from '@tanstack/react-router';
import { router } from '@/router';
import { AuthProvider, useAuth } from '@/features/auth/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import { AuthFlow } from '@/features/auth/components/AuthFlow';
import { RememberedReauthFlow } from '@/features/auth/components/RememberedReauthFlow';
import { ForgotPinFlow } from '@/features/auth/components/ForgotPinFlow';
import { UnlockScreen } from '@/features/auth/screens/UnlockScreen';
import { RecoveryScreen } from '@/features/recovery/RecoveryScreen';

/**
 * Shown while the app resolves who this is, and while the app chunk loads.
 *
 * The mark sits inside a ring that spins around it rather than a bare
 * spinner off to the side, so the two read as one piece of motion instead
 * of a logo that happens to be near unrelated loading chrome. A short label
 * follows the same rule as every other wait in the app: a spinner alone
 * does not say what is happening, so it never appears without words.
 */
function BootSplash() {
  return (
    <div className="min-h-[100dvh] bg-surface-page flex flex-col items-center justify-center gap-5 p-4">
      <div className="relative flex items-center justify-center w-24 h-24">
        <div
          className="absolute inset-0 rounded-full border-[3px] border-action-primary/15 border-t-action-primary animate-spin motion-reduce:animate-none"
          role="status"
          aria-label="Loading ParkDrop"
        />
        <div className="w-16 h-16 rounded-[18px] bg-white shadow-md flex items-center justify-center">
          <img
            src="/parkdrop-icon-only.png"
            alt=""
            aria-hidden="true"
            width={40}
            height={40}
            className="w-10 h-10 object-contain animate-pulse motion-reduce:animate-none"
          />
        </div>
      </div>
      <p className="m-0 text-[15px] font-bold text-text-secondary">Loading ParkDrop…</p>
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

/**
 * The internal design-token/component gallery. Gated on import.meta.env.DEV
 * for the same reason as HomePreview: it must not be a URL anyone can guess
 * their way into on the production build.
 */
const ThemeDemo = import.meta.env.DEV
  ? React.lazy(() => import('@/routes/theme-demo').then((m) => ({ default: m.ThemeDemo })))
  : null;

/**
 * A harness for looking at any signed-in screen without a server or an
 * account. Reached by adding ?preview=1 to any real path, e.g.
 * /more/help?preview=1. Gated on import.meta.env.DEV for the same reason as
 * HomePreview: the module and its seeder must not reach the production
 * bundle, and it must not be a URL anyone can guess their way into.
 */
const ScreenPreview = import.meta.env.DEV
  ? React.lazy(() => import('@/routes/screen-preview'))
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

  if (
    ScreenPreview &&
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('preview') === '1'
  ) {
    return (
      <React.Suspense fallback={<BootSplash />}>
        <ScreenPreview />
        <Toaster />
      </React.Suspense>
    );
  }

  if (ThemeDemo && typeof window !== 'undefined' && window.location.pathname === '/theme') {
    return (
      <React.Suspense fallback={<BootSplash />}>
        <ThemeDemo />
        <Toaster />
      </React.Suspense>
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
