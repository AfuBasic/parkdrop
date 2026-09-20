import * as React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button, AuthBackdrop } from '@/design-system';

interface AuthLayoutProps {
  children: React.ReactNode;
  onBack?: () => void;
  showBack?: boolean;
}

export function AuthLayout({ children, onBack, showBack = true }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-surface-page flex flex-col items-center justify-center p-0 sm:p-6 md:p-10 relative overflow-hidden">
      {/* Mobile background atmospheric motif */}
      <div className="absolute -top-12 -right-12 w-80 h-80 pointer-events-none opacity-[0.06] md:hidden">
        <AuthBackdrop className="w-full h-full" />
      </div>

      <div className="w-full max-w-5xl flex-1 flex flex-col justify-center z-10 sm:my-auto">
        <div className="min-h-screen sm:min-h-[540px] grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-start sm:items-center bg-transparent sm:bg-surface-default border-0 sm:border sm:border-border-default sm:rounded-3xl p-5 sm:p-10 sm:shadow-elevation-2 backdrop-blur-none sm:backdrop-blur-sm">
          {/* Left Column: Form & Navigation */}
          <div className="md:col-span-7 flex flex-col min-h-screen sm:min-h-[460px] pt-[env(safe-area-inset-top)] sm:pt-0 pb-[max(20px,env(safe-area-inset-bottom))] sm:pb-0">
            <header className="flex items-center justify-between mb-6 sm:mb-8 min-h-[56px] sm:min-h-0 shrink-0">
              <div className="flex items-center">
                {showBack && onBack ? (
                  <button
                    type="button"
                    onClick={onBack}
                    className="flex items-center justify-center h-11 w-11 rounded-full hover:bg-surface-subtle -ml-2 text-text-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
                    aria-label="Go back"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                ) : (
                  <div className="w-11 h-11 -ml-2" />
                )}

                <div className="flex items-center gap-2.5 ml-1">
                  <img src="/parkdrop-icon-only.png" alt="ParkDrop Logo" className="w-7 h-7 sm:w-8 sm:h-8 object-contain drop-shadow-sm" />
                  <span className="font-bold text-lg sm:text-xl tracking-tight text-text-primary">ParkDrop</span>
                </div>
              </div>
            </header>

            <main className="flex-1 flex flex-col justify-start sm:justify-center">
              {children}
            </main>
          </div>

          {/* Right Column (Desktop): Brand Visual Composition */}
          <div className="hidden md:flex md:col-span-5 flex-col items-center justify-center bg-pd-blue-50/60 border border-pd-blue-100 rounded-2xl p-8 min-h-[460px] relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <AuthBackdrop className="w-full h-full scale-110" />
            </div>
            
            <div className="relative z-10 text-center max-w-[260px] mt-auto">
              <h2 className="text-base font-semibold text-pd-blue-900 mb-1">
                Reliable Parcel Operations
              </h2>
              <p className="text-xs text-pd-blue-700/80 leading-relaxed">
                Log packages, notify recipients instantly via SMS, and release pickups with verified tokens.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
