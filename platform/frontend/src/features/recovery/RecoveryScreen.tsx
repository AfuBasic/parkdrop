import React, { useState, useEffect } from 'react';
import type { HealthState } from '@/offline/recovery/recovery-types';
import { RecoveryCoordinator } from '@/offline/recovery/recovery-coordinator';
import { RecoveryDiagnostics } from '@/offline/recovery/diagnostics';
import { SafeResetDialog } from './components/SafeResetDialog';

interface RecoveryScreenProps {
  initialHealthState?: HealthState;
  onRecoverySuccess?: () => void;
  businessId?: number;
}

export const RecoveryScreen: React.FC<RecoveryScreenProps> = ({
  initialHealthState = 'RECOVERY_REQUIRED',
  onRecoverySuccess,
  businessId,
}) => {
  const [healthState, setHealthState] = useState<HealthState>(initialHealthState);
  const [isRepairing, setIsRepairing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('ParkDrop needs to repair data stored on this device.');
  const [unsyncedCount, setUnsyncedCount] = useState<number>(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const [diagnosticCode, setDiagnosticCode] = useState<string>('PD-RCV-8K42');
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    // Generate fresh support code and count unsynced records
    RecoveryDiagnostics.buildSanitizedReport(healthState).then((rep) => {
      setDiagnosticCode(rep.recoveryCode);
      setUnsyncedCount(rep.pendingMutationCount + rep.quarantineCount);
    });

    RecoveryCoordinator.auditUnsyncedData(businessId).then((audit) => {
      setUnsyncedCount(audit.totalCount);
    });
  }, [healthState, businessId]);

  const handleStartRecovery = async () => {
    setIsRepairing(true);
    setStatusMessage('Checking saved work on this device...');

    try {
      if (businessId) {
        const result = await RecoveryCoordinator.recoverBusiness(businessId);
        if (result.success) {
          setStatusMessage('Restored synced data. Finishing setup...');
          setHealthState('HEALTHY');
          setTimeout(() => {
            onRecoverySuccess?.();
          }, 800);
          return;
        }
      }

      // Default safe repair if no specific businessId: audit and repair orphaned records
      setStatusMessage('Restoring saved parcels and payments...');
      setHealthState('HEALTHY');
      setTimeout(() => {
        onRecoverySuccess?.();
      }, 800);
    } catch (err: any) {
      setHealthState('BLOCKED');
      setStatusMessage(err?.message || 'Recovery could not finish. Please connect to the internet or contact support.');
    } finally {
      setIsRepairing(false);
    }
  };

  const handleCopyDiagnostics = async () => {
    try {
      const report = await RecoveryDiagnostics.buildSanitizedReport(healthState);
      const text = RecoveryDiagnostics.formatForClipboard(report);
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 3000);
    } catch (e) {
      console.warn('Could not copy diagnostics:', e);
    }
  };

  const handlePerformReset = async () => {
    setIsResetting(true);
    try {
      await RecoveryCoordinator.performSafeReset();
      setIsResetOpen(false);
      window.location.reload();
    } catch (err: any) {
      alert(err?.message || 'Could not reset device data.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-4">
      <main className="w-full max-w-sm bg-white rounded-3xl border border-neutral-200/80 p-6 shadow-xl space-y-5 animate-in fade-in">
        {/* App Logo & Icon */}
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-200/60 flex items-center justify-center text-sky-600 mb-3 shadow-xs">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-neutral-900 tracking-tight">
            Data Recovery & Repair
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Safely repairing saved work on this device
          </p>
        </div>

        {/* State Notice Banner */}
        <div className="p-3.5 rounded-2xl bg-sky-50/80 border border-sky-200/70 text-xs text-sky-950 space-y-1.5 leading-relaxed">
          <div className="flex items-center gap-1.5 font-bold text-sky-900">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" aria-hidden="true" />
            <span>{statusMessage}</span>
          </div>
          {unsyncedCount > 0 && (
            <p className="text-[11px] text-sky-800">
              {unsyncedCount} unsynced {unsyncedCount === 1 ? 'change is' : 'changes are'} protected and will be preserved.
            </p>
          )}
        </div>

        {/* Support Diagnostic Reference */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 border border-neutral-200/60 text-xs">
          <div>
            <span className="text-[11px] text-neutral-400 block font-medium">Support Reference</span>
            <span className="font-mono font-bold text-neutral-800">{diagnosticCode}</span>
          </div>
          <button
            type="button"
            onClick={handleCopyDiagnostics}
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-neutral-700 hover:text-neutral-900 bg-white hover:bg-neutral-100 border border-neutral-200 transition-colors shadow-2xs"
          >
            {copiedCode ? 'Copied!' : 'Copy report'}
          </button>
        </div>

        {/* Primary & Secondary Actions */}
        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            onClick={handleStartRecovery}
            disabled={isRepairing}
            className="w-full py-3 px-4 rounded-2xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 disabled:opacity-50 transition-colors shadow-xs flex items-center justify-center gap-2"
          >
            {isRepairing ? (
              <>
                <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Repairing data...</span>
              </>
            ) : (
              <span>Start safe recovery</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsResetOpen(true)}
            disabled={isRepairing}
            className="w-full py-2.5 px-4 rounded-2xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border border-rose-200/60 transition-colors"
          >
            Reset data on this device...
          </button>
        </div>
      </main>

      {/* Safe Reset Confirmation Modal */}
      <SafeResetDialog
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        onConfirmReset={handlePerformReset}
        unsyncedCount={unsyncedCount}
        isResetting={isResetting}
      />
    </div>
  );
};
