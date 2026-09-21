import { useRef, useState } from 'react';
import { ArrowLeft, Shield, Smartphone, Copy, Check, Info } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';

interface AboutScreenProps {
  onBack: () => void;
}

export function AboutScreen({ onBack }: AboutScreenProps) {
  const { business, user } = useAuth();
  const [copiedCode, setCopiedCode] = useState(false);

  // Stable values computed once at mount — never re-computed on re-renders
  const appVersion = '1.0.0';
  const buildDate = '2026-09-21';
  const currentYear = useRef(new Date().getFullYear()).current;
  const sessionSuffix = useRef(Date.now().toString(36).toUpperCase().slice(-6)).current;
  const diagnosticCode = `PD-${appVersion}-${business?.id ?? 0}-${sessionSuffix}`;

  const handleCopyDiagnostic = () => {
    navigator.clipboard.writeText(diagnosticCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface-page max-w-lg mx-auto pb-8">
      {/* Header */}
      <header className="px-4 py-3 bg-surface-default border-b border-border-subtle flex items-center gap-3 sticky top-0 z-10">
        <button
          type="button"
          onClick={onBack}
          className="p-2 -ml-2 text-text-secondary hover:text-text-primary rounded-full transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Back to settings"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-action-primary" />
          <h1 className="text-lg font-bold text-text-primary">About ParkDrop</h1>
        </div>
      </header>

      <main className="p-4 flex flex-col gap-4">
        {/* Brand Hero */}
        <div className="p-6 bg-surface-default rounded-2xl border border-border-subtle shadow-xs flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4 shadow-xs">
            <img 
              src="/parkdrop-icon-only.png" 
              alt="ParkDrop" 
              className="w-10 h-10 object-contain"
            />
          </div>
          <h2 className="text-xl font-extrabold text-text-primary">ParkDrop</h2>
          <p className="text-xs text-text-secondary mt-1 max-w-xs">
            Offline-first parcel holding and pickup point management system.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-blue-50 text-action-primary font-mono text-xs font-semibold">
              v{appVersion}
            </span>
            <span className="text-xs text-text-muted">Build {buildDate}</span>
          </div>
        </div>

        {/* Operational Context Card */}
        <div className="bg-surface-default rounded-2xl border border-border-subtle p-4 shadow-xs flex flex-col gap-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Active Workspace
          </h3>
          <div className="text-sm flex flex-col gap-1.5 text-text-secondary">
            <div className="flex justify-between items-center">
              <span>Business:</span>
              <strong className="text-text-primary font-medium">{business?.name ?? 'None'}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span>Signed in as:</span>
              <span className="text-text-primary font-medium">{user?.email ?? 'Unknown'}</span>
            </div>
          </div>
        </div>

        {/* Support & Diagnostics */}
        <div className="bg-surface-default rounded-2xl border border-border-subtle p-4 shadow-xs flex flex-col gap-3">
          <div className="flex items-center gap-2 text-action-primary">
            <Smartphone className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Diagnostic Reference
            </h3>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            If you contact your support representative, provide this reference code. It contains no personal customer information.
          </p>
          <div className="p-3 bg-surface-page rounded-xl border border-border-subtle flex items-center justify-between font-mono text-xs font-bold text-text-primary">
            <span>{diagnosticCode}</span>
            <button
              type="button"
              onClick={handleCopyDiagnostic}
              className="p-1.5 text-action-primary hover:bg-action-primary/10 rounded-lg transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
              aria-label="Copy diagnostic code"
            >
              {copiedCode ? <Check className="w-4 h-4 text-status-success-text" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          {copiedCode && (
            <span className="text-[11px] font-semibold text-status-success-text text-center">
              Copied to clipboard
            </span>
          )}
        </div>

        {/* Legal and Privacy Information */}
        <div className="p-4 bg-surface-default rounded-2xl border border-border-subtle shadow-xs flex flex-col gap-2 text-xs text-text-muted leading-relaxed">
          <div className="flex items-center gap-1.5 font-bold text-text-secondary">
            <Shield className="w-4 h-4 text-action-primary" />
            <span>Data Protection & Privacy</span>
          </div>
          <p>
            Customer phone numbers, parcel photos, and collection codes are stored securely on this device and encrypted during sync. ParkDrop operates in accordance with local data protection regulations.
          </p>
          <p className="text-[11px] mt-1">
            © {currentYear} ParkDrop. All rights reserved.
          </p>
        </div>
      </main>
    </div>
  );
}
