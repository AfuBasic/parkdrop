import * as React from 'react';
import { ArrowLeft, MessageSquare, Check, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthLayoutProps {
  children: React.ReactNode;
  onBack?: () => void;
  showBack?: boolean;
  heroState?: 'big' | 'mid' | 'compact';
  onHelp?: () => void;
  step?: number;
  totalSteps?: number;
  isSuccess?: boolean;
  isKeyboardOpen?: boolean;
}

export function AuthLayout({ 
  children, 
  onBack, 
  showBack = true,
  heroState = 'big',
  onHelp,
  step,
  totalSteps = 5,
  isSuccess,
  isKeyboardOpen
}: AuthLayoutProps) {
  // Mobile app styling mapped from the prototype
  return (
    <div className="min-h-screen bg-surface-page flex flex-col md:items-center md:justify-center md:py-10">
      <div className={cn(
        "relative w-full h-full min-h-screen md:min-h-[840px] md:h-[840px] md:w-[392px] md:rounded-[44px] md:overflow-hidden md:shadow-2xl bg-action-primary flex flex-col font-sans text-text-primary",
        isKeyboardOpen && "kbd" // Allows applying keyboard specific styles
      )}>
        
        {/* Hero Section */}
        <header className={cn(
          "relative flex-none bg-action-primary bg-[radial-gradient(rgba(255,255,255,.12)_1.6px,transparent_1.7px)] bg-[length:20px_20px] text-white px-5 pb-[46px] overflow-hidden transition-all duration-300",
          heroState === 'big' && "min-h-[clamp(176px,32vh,262px)] pt-[max(14px,env(safe-area-inset-top))]",
          heroState === 'mid' && "min-h-[clamp(150px,25vh,206px)] pt-[max(14px,env(safe-area-inset-top))]",
          heroState === 'compact' && "min-h-0 pt-[max(14px,env(safe-area-inset-top))]",
          isKeyboardOpen && "min-h-0 pb-[38px]"
        )}>
          {/* Top Bar */}
          <div className="relative z-10 flex items-center justify-between gap-2.5 min-h-[48px]">
            {showBack && onBack ? (
              <button 
                onClick={onBack}
                className="inline-flex items-center gap-2 h-12 px-3.5 pr-4 rounded-full bg-white/20 text-white text-base font-bold hover:bg-white/30 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
                Back
              </button>
            ) : (
              <div className="w-[100px]" />
            )}

            {heroState !== 'compact' && (
              <div className="flex items-center gap-2.5 text-[22px] font-extrabold tracking-[-0.02em]">
                <span className="grid place-items-center w-[38px] h-[38px] rounded-[11px] bg-white text-action-primary overflow-hidden">
                  <img src="/parkdrop-icon-only.png" alt="ParkDrop Logo" className="w-[26px] h-[26px] object-contain" />
                </span>
                ParkDrop
              </div>
            )}

            <button 
              onClick={onHelp}
              className="inline-flex items-center gap-2 h-12 px-3.5 pr-4 rounded-full bg-white/20 text-white text-base font-bold hover:bg-white/30 transition-colors"
            >
              <MessageSquare className="w-5 h-5" strokeWidth={2.5} />
              <span className="sr-only sm:not-sr-only">Need help?</span>
            </button>
          </div>

          {/* Tagline (Phone screen) */}
          {heroState === 'big' && !isKeyboardOpen && (
            <p className="relative z-10 mt-4 text-[clamp(24px,3.7vh,30px)] leading-[1.12] font-extrabold tracking-[-0.025em]">
              Record parcels.<br/>Find them fast.
            </p>
          )}

          {/* Steps (Compact) */}
          {(heroState === 'compact' || isKeyboardOpen) && step && (
            <div className={cn("relative z-10", isKeyboardOpen ? "mt-3" : "mt-4")}>
              {!isKeyboardOpen && (
                <p className="m-0 mb-2 text-base font-bold">Step {step} of {totalSteps}</p>
              )}
              <div className="flex gap-1.5">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <i 
                    key={i} 
                    className={cn(
                      "flex-1 h-2 rounded-full",
                      i < step ? "bg-white" : "bg-white/30"
                    )} 
                  />
                ))}
              </div>
            </div>
          )}

          {/* Badge (Ready screen) */}
          {isSuccess && !isKeyboardOpen && (
            <div className="absolute left-5 bottom-14 z-10 w-[68px] h-[68px] rounded-full bg-white text-status-success grid place-items-center animate-in zoom-in duration-300">
              <Check className="w-[38px] h-[38px]" strokeWidth={3} />
            </div>
          )}

          {/* Isometric Art (Big/Mid) */}
          {(heroState === 'big' || heroState === 'mid') && !isKeyboardOpen && (
            <svg className="absolute right-2 bottom-0 z-[1] h-[clamp(96px,19vh,150px)] aspect-[206/150] w-auto" viewBox="0 0 206 150" aria-hidden="true">
              <rect x="104" y="16" width="54" height="40" rx="4" fill="#E9C27F"/>
              <rect x="104" y="16" width="54" height="12" rx="4" fill="#D6A557"/>
              <rect x="122" y="16" width="18" height="40" fill="#F4E4BF"/>
              <rect x="70" y="52" width="122" height="98" rx="5" fill="#E2B46E"/>
              <rect x="70" y="52" width="122" height="18" rx="5" fill="#CF9A4D"/>
              <rect x="120" y="52" width="20" height="98" fill="#F4E4BF"/>
              <rect x="80" y="86" width="30" height="4" rx="2" fill="#B9852F"/>
              <rect x="80" y="96" width="21" height="4" rx="2" fill="#B9852F"/>
              <rect x="146" y="82" width="38" height="28" rx="4" fill="#fff"/>
              <text x="165" y="101" textAnchor="middle" fontFamily="Manrope,system-ui,sans-serif" fontSize="14" fontWeight="800" fill="#0D1B2A">4821</text>
              <rect x="4" y="82" width="74" height="68" rx="5" fill="#D9A45A"/>
              <rect x="4" y="82" width="74" height="14" rx="5" fill="#C58C3F"/>
              <rect x="14" y="82" width="16" height="68" fill="#F1DDB0"/>
              <rect x="36" y="100" width="38" height="18" rx="3" fill="#fff"/>
              <text x="55" y="113" textAnchor="middle" fontFamily="Manrope,system-ui,sans-serif" fontSize="9" fontWeight="800" fill="#0D1B2A">PD-2841</text>
            </svg>
          )}
        </header>

        {/* Sheet Content */}
        <div className="relative z-[3] flex-1 min-h-0 -mt-7 bg-white rounded-t-[28px] flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto px-5 pt-6 pb-6 flex flex-col">
            {children}
          </div>
        </div>

      </div>
    </div>
  );
}
