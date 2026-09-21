import * as React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ChevronLeft, MessageSquare, WifiOff, AlertCircle, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { useSyncState } from '@/offline/hooks/useSyncState';
import { db } from '@/offline/db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import { SyncEngine } from '@/offline/sync/sync-engine';
import { SmsCreditBundleOption } from '@/features/sms-credits/purchase/components/SmsCreditBundleOption';
import {
  fetchCreditBundles,
  initializePurchase,
  verifyPurchaseOnServer,
} from '@/features/sms-credits/purchase/api';
import type { SmsCreditBundle, SmsCreditPurchase, PurchaseFlowState } from '@/features/sms-credits/purchase/types';

interface BuySmsCreditsScreenProps {
  onBack?: () => void;
  onSuccessDone?: () => void;
}

export function BuySmsCreditsScreen({ onBack, onSuccessDone }: BuySmsCreditsScreenProps) {
  const routerNavigate = useNavigate();
  const handleBack = onBack ?? (() => routerNavigate({ to: '/more/sms-credits' }));
  const handleSuccessDone = onSuccessDone ?? (() => routerNavigate({ to: '/more/sms-credits' }));
  const { business } = useAuth();
  const businessId = business?.id;
  const syncState = useSyncState(businessId);
  const isOffline = syncState.connectivity === 'UNREACHABLE' || syncState.connectivity === 'DEGRADED';

  // Live query local Dexie wallet for current balance
  const wallet = useLiveQuery(
    () => (businessId ? db.smsWallets.where('business_id').equals(businessId).first() : undefined),
    [businessId]
  );
  const currentBalance = wallet?.balance ?? 0;

  // Screen states
  const [flowState, setFlowState] = React.useState<PurchaseFlowState>('CHOOSING');
  const [bundles, setBundles] = React.useState<SmsCreditBundle[]>([]);
  const [selectedBundle, setSelectedBundle] = React.useState<SmsCreditBundle | null>(null);
  const [isLoadingBundles, setIsLoadingBundles] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [activePurchase, setActivePurchase] = React.useState<SmsCreditPurchase | null>(null);
  const [verifiedBalance, setVerifiedBalance] = React.useState<number | null>(null);

  // Load server-controlled bundles on mount
  React.useEffect(() => {
    let isMounted = true;
    async function loadBundles() {
      try {
        setIsLoadingBundles(true);
        const data = await fetchCreditBundles();
        if (isMounted) {
          setBundles(data.bundles);
          setIsLoadingBundles(false);
        }
      } catch (err) {
        if (isMounted) {
          setIsLoadingBundles(false);
          setErrorMessage('Could not load credit packages. Please check your connection.');
        }
      }
    }
    loadBundles();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle continuing to payment
  const handleContinueToPayment = async () => {
    if (!selectedBundle || flowState !== 'CHOOSING' || isOffline) return;

    try {
      setFlowState('INITIALIZING');
      setErrorMessage(null);

      const res = await initializePurchase(selectedBundle.key);
      const purchase = res.purchase;
      setActivePurchase(purchase);

      if (purchase.checkout_url) {
        // If it's a fake checkout or test environment URL, we can simulate confirmation
        if (purchase.checkout_url.includes('fake-checkout')) {
          setFlowState('CONFIRMING');
          // Verify on server
          const verifyRes = await verifyPurchaseOnServer(purchase.id);
          if (verifyRes.purchase.status === 'PAID') {
            setVerifiedBalance(verifyRes.wallet_balance);
            setFlowState('PAID');
            if (businessId) {
              await SyncEngine.sync(businessId);
            }
          } else {
            setFlowState(verifyRes.purchase.status as PurchaseFlowState);
          }
        } else {
          // Open real provider hosted checkout in window or redirect
          window.location.href = purchase.checkout_url;
        }
      } else {
        setFlowState('CONFIRMING');
      }
    } catch (err: any) {
      setFlowState('CHOOSING');
      setErrorMessage(err.message || 'Could not start payment. Please try again.');
    }
  };

  // Check payment status manually if pending
  const handleCheckStatus = async () => {
    if (!activePurchase) return;
    try {
      setFlowState('CONFIRMING');
      const verifyRes = await verifyPurchaseOnServer(activePurchase.id);
      if (verifyRes.purchase.status === 'PAID') {
        setVerifiedBalance(verifyRes.wallet_balance);
        setFlowState('PAID');
        if (businessId) {
          await SyncEngine.sync(businessId);
        }
      } else if (verifyRes.purchase.status === 'FAILED') {
        setFlowState('FAILED');
      } else {
        setFlowState('PENDING');
      }
    } catch (err: any) {
      setFlowState('PENDING');
      setErrorMessage('Could not check payment status yet.');
    }
  };

  const handleDone = () => {
    handleSuccessDone();
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface-page w-full max-w-lg mx-auto pb-10">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-surface-page/95 backdrop-blur-sm border-b border-border-subtle px-4 h-14 flex items-center justify-between shrink-0">
        <button
          type="button"
          onClick={handleBack}
          disabled={flowState === 'INITIALIZING' || flowState === 'CONFIRMING'}
          className="flex items-center text-text-secondary hover:text-text-primary transition-colors py-2 pr-4 -ml-2 cursor-pointer disabled:opacity-50"
        >
          <ChevronLeft className="h-6 w-6" />
          <span className="text-[17px] font-medium ml-0.5">Back</span>
        </button>

        <h1 className="text-[17px] font-semibold text-text-primary">
          Buy SMS credits
        </h1>

        <div className="w-8" />
      </header>

      {/* Main Container */}
      <main className="flex-1 px-4 pt-4 flex flex-col">
        {/* Offline Banner */}
        {isOffline && (
          <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 p-3.5 flex items-start gap-2.5 text-xs text-amber-900">
            <WifiOff className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Connect to the internet to buy SMS credits</p>
              <p className="text-amber-800 mt-0.5">
                Online payment verification is required to add credits to your wallet.
              </p>
            </div>
          </div>
        )}

        {/* State: PAID (Authoritative Success) */}
        {flowState === 'PAID' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-8">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <h2 className="text-2xl font-bold text-text-primary tracking-tight">
              Payment confirmed
            </h2>
            <p className="text-emerald-700 font-semibold text-base mt-1">
              +{activePurchase?.credits ?? selectedBundle?.credits} SMS credits added
            </p>

            <div className="w-full bg-surface-default border border-border-subtle rounded-2xl p-5 mt-6 shadow-sm flex flex-col items-center">
              <span className="text-xs uppercase tracking-wider font-semibold text-text-muted">
                New Balance
              </span>
              <span className="text-4xl font-extrabold text-text-primary mt-1">
                {verifiedBalance ?? (currentBalance + (activePurchase?.credits ?? 0))}
              </span>
              <span className="text-xs text-text-secondary mt-0.5">SMS credits</span>
            </div>

            <button
              type="button"
              onClick={handleDone}
              className="mt-8 w-full h-14 bg-action-primary hover:bg-action-primary/95 active:scale-[0.99] text-white font-semibold text-[16px] rounded-xl transition-all shadow-sm cursor-pointer"
            >
              Done
            </button>
          </div>
        )}

        {/* State: CONFIRMING */}
        {flowState === 'CONFIRMING' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-10">
            <div className="w-12 h-12 border-3 border-action-primary border-t-transparent rounded-full animate-spin mb-4" />
            <h2 className="text-xl font-bold text-text-primary">Confirming payment…</h2>
            <p className="text-sm text-text-secondary mt-1 max-w-xs">
              Verifying payment with the provider. Your credits will appear momentarily.
            </p>
          </div>
        )}

        {/* State: PENDING */}
        {flowState === 'PENDING' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-8">
            <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
              <Clock className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-text-primary">Payment pending</h2>
            <p className="text-sm text-text-secondary mt-1.5 max-w-sm">
              We're still confirming your payment with the provider. Your SMS credits will appear automatically once confirmed.
            </p>

            <div className="w-full flex flex-col gap-3 mt-8">
              <button
                type="button"
                onClick={handleCheckStatus}
                className="w-full h-13 bg-action-primary text-white font-semibold text-[15px] rounded-xl transition-all active:scale-[0.99] cursor-pointer"
              >
                Check status again
              </button>
              <button
                type="button"
                onClick={handleBack}
                className="w-full h-13 bg-surface-default border border-border-default text-text-primary font-medium text-[15px] rounded-xl hover:bg-surface-subtle transition-all cursor-pointer"
              >
                Back to SMS credits
              </button>
            </div>
          </div>
        )}

        {/* State: FAILED */}
        {flowState === 'FAILED' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-8">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-700 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-text-primary">Payment wasn't completed</h2>
            <p className="text-sm text-text-secondary mt-1 max-w-sm">
              No SMS credits were added. You can try again whenever you're ready.
            </p>

            <div className="w-full flex flex-col gap-3 mt-8">
              <button
                type="button"
                onClick={() => setFlowState('CHOOSING')}
                className="w-full h-13 bg-action-primary text-white font-semibold text-[15px] rounded-xl transition-all active:scale-[0.99] cursor-pointer"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={handleBack}
                className="w-full h-13 bg-surface-default border border-border-default text-text-primary font-medium text-[15px] rounded-xl hover:bg-surface-subtle transition-all cursor-pointer"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* State: CHOOSING or INITIALIZING */}
        {(flowState === 'CHOOSING' || flowState === 'INITIALIZING') && (
          <div className="flex-1 flex flex-col justify-between">
            <div>
              {/* Subtle Current Balance Header */}
              <div className="bg-surface-default rounded-[var(--radius-xl)] border border-border-subtle p-4 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-action-primary flex items-center justify-center">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                      Current balance
                    </div>
                    <div className="text-[17px] font-bold text-text-primary leading-tight">
                      {currentBalance} {currentBalance === 1 ? 'credit' : 'credits'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Error notification */}
              {errorMessage && (
                <div className="mt-3 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Choose Bundle Heading */}
              <div className="mt-5 mb-2.5 px-1">
                <h2 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                  Choose SMS Credits
                </h2>
              </div>

              {/* Bundle list */}
              {isLoadingBundles ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 rounded-[var(--radius-xl)] bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3" role="radiogroup" aria-label="SMS Credit Bundles">
                  {bundles.map((bundle) => (
                    <SmsCreditBundleOption
                      key={bundle.key}
                      bundle={bundle}
                      selected={selectedBundle?.key === bundle.key}
                      disabled={isOffline || flowState === 'INITIALIZING'}
                      onSelect={(b) => setSelectedBundle(b)}
                    />
                  ))}
                </div>
              )}

              {/* Small explanation */}
              <p className="text-xs text-text-muted mt-4 px-1 leading-relaxed">
                Credits are strictly used for outbound customer package arrival notifications. ParkDrop core parcel management remains free.
              </p>
            </div>

            {/* Sticky Bottom Action */}
            <div className="pt-6 pb-2">
              <button
                type="button"
                disabled={!selectedBundle || isOffline || flowState === 'INITIALIZING'}
                onClick={handleContinueToPayment}
                className="w-full h-14 bg-action-primary hover:bg-action-primary/95 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold text-[16px] rounded-xl transition-all shadow-sm active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
              >
                {flowState === 'INITIALIZING' ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Preparing payment…</span>
                  </>
                ) : (
                  <>
                    <span>Continue to payment</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
