import * as React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { WifiOff, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { useSyncState } from '@/offline/hooks/useSyncState';
import { db } from '@/offline/db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import { SyncEngine } from '@/offline/sync/sync-engine';
import { TaskHeader } from '@/design-system/shell/TaskHeader';
import { HelpSheet } from '@/features/auth/components/HelpSheet';
import { SmsCreditBundleOption } from '@/features/sms-credits/purchase/components/SmsCreditBundleOption';
import { BuySmsCreditsStrings } from '@/features/sms-credits/purchase/strings';
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

/** One SMS per package (design plan §3.3.29/§3.3.30 assumption). */
const PACKAGES_PER_SMS = 1;

export function BuySmsCreditsScreen({ onBack, onSuccessDone }: BuySmsCreditsScreenProps) {
  const routerNavigate = useNavigate();
  const handleBack = onBack ?? (() => routerNavigate({ to: '/more/sms-credits' }));
  const handleSuccessDone = onSuccessDone ?? (() => routerNavigate({ to: '/more/sms-credits' }));
  const { business } = useAuth();
  const businessId = business?.id;
  const syncState = useSyncState(businessId);
  const isOffline = syncState.connectivity === 'UNREACHABLE' || syncState.connectivity === 'DEGRADED';
  const [helpOpen, setHelpOpen] = React.useState(false);

  const wallet = useLiveQuery(
    () => (businessId ? db.smsWallets.where('business_id').equals(businessId).first() : undefined),
    [businessId]
  );
  const currentBalance = wallet?.balance ?? 0;

  const [flowState, setFlowState] = React.useState<PurchaseFlowState>('CHOOSING');
  const [selectedProvider, setSelectedProvider] = React.useState<'paystack' | 'flutterwave'>('paystack');
  const [bundles, setBundles] = React.useState<SmsCreditBundle[]>([]);
  const [selectedBundle, setSelectedBundle] = React.useState<SmsCreditBundle | null>(null);
  const [isLoadingBundles, setIsLoadingBundles] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [activePurchase, setActivePurchase] = React.useState<SmsCreditPurchase | null>(null);
  const [verifiedBalance, setVerifiedBalance] = React.useState<number | null>(null);

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
      } catch {
        if (isMounted) {
          setIsLoadingBundles(false);
          setErrorMessage(BuySmsCreditsStrings.couldNotLoadBundles);
        }
      }
    }
    loadBundles();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleContinueToPayment = async () => {
    if (!selectedBundle || flowState !== 'CHOOSING' || isOffline) return;

    try {
      setFlowState('INITIALIZING');
      setErrorMessage(null);

      const res = await initializePurchase(selectedBundle.key, undefined, selectedProvider);
      const purchase = res.purchase;
      setActivePurchase(purchase);

      if (purchase.checkout_url) {
        if (purchase.checkout_url.includes('fake-checkout')) {
          setFlowState('CONFIRMING');
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
          window.location.href = purchase.checkout_url;
        }
      } else {
        setFlowState('CONFIRMING');
      }
    } catch (err: any) {
      setFlowState('CHOOSING');
      setErrorMessage(err.message || BuySmsCreditsStrings.failedToStartTitle);
    }
  };

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
    } catch {
      setFlowState('PENDING');
    }
  };

  const handleDone = () => {
    handleSuccessDone();
  };

  const finalBalance = verifiedBalance ?? currentBalance + (activePurchase?.credits ?? 0);

  return (
    <div className="flex flex-col min-h-screen bg-[var(--pd-page-2)] w-full max-w-lg mx-auto pb-10">
      <TaskHeader title={BuySmsCreditsStrings.title} onBack={handleBack} screenName="Buy SMS credits" />

      <main className="flex-1 px-4 pt-4 flex flex-col">
        {isOffline && flowState === 'CHOOSING' ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-10">
            <WifiOff className="w-10 h-10 text-[var(--pd-warn)]" strokeWidth={2} aria-hidden="true" />
            <h2 className="text-[20px] font-extrabold text-[var(--pd-navy)] m-0">
              {BuySmsCreditsStrings.offlineTitle}
            </h2>
            <p className="text-[16px] font-semibold text-[var(--pd-muted)] m-0 max-w-xs">
              {BuySmsCreditsStrings.offlineBody}
            </p>
          </div>
        ) : (
          <>
            {flowState === 'PAID' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-2 py-8">
                <div className="w-16 h-16 rounded-full bg-[var(--pd-ok-bg)] text-[var(--pd-ok)] flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-9 h-9" strokeWidth={2.25} aria-hidden="true" />
                </div>
                <h2 className="text-[24px] font-extrabold text-[var(--pd-navy)] m-0">
                  {BuySmsCreditsStrings.successTitle(finalBalance)}
                </h2>
                <button
                  type="button"
                  onClick={handleDone}
                  className="mt-8 w-full min-h-[60px] rounded-[var(--pd-field-radius)] bg-[var(--pd-blue)] hover:bg-[var(--pd-blue-hover)] active:scale-[0.99] text-white text-[20px] font-extrabold transition-all cursor-pointer"
                >
                  {BuySmsCreditsStrings.goBack}
                </button>
              </div>
            )}

            {flowState === 'CONFIRMING' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-10 gap-2">
                <div className="w-12 h-12 border-[3px] border-[var(--pd-blue)] border-t-transparent rounded-full animate-spin mb-2" />
                <h2 className="text-[20px] font-extrabold text-[var(--pd-navy)] m-0">
                  {BuySmsCreditsStrings.confirmingTitle}
                </h2>
                <p className="text-[16px] font-semibold text-[var(--pd-muted)] m-0 max-w-xs">
                  {BuySmsCreditsStrings.confirmingBody}
                </p>
              </div>
            )}

            {flowState === 'PENDING' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-2 py-8">
                <div className="w-14 h-14 rounded-full bg-[var(--pd-warn-bg)] text-[var(--pd-warn)] flex items-center justify-center mb-4">
                  <Clock className="w-8 h-8" strokeWidth={2.25} aria-hidden="true" />
                </div>
                <h2 className="text-[20px] font-extrabold text-[var(--pd-navy)] m-0">
                  {BuySmsCreditsStrings.pendingTitle}
                </h2>
                <p className="text-[16px] font-semibold text-[var(--pd-muted)] mt-1.5 max-w-sm m-0">
                  {BuySmsCreditsStrings.pendingBody}
                </p>

                <div className="w-full flex flex-col gap-3 mt-8">
                  <button
                    type="button"
                    onClick={handleCheckStatus}
                    className="w-full min-h-[60px] rounded-[var(--pd-field-radius)] bg-[var(--pd-blue)] hover:bg-[var(--pd-blue-hover)] active:scale-[0.99] text-white text-[20px] font-extrabold transition-all cursor-pointer"
                  >
                    {BuySmsCreditsStrings.checkAgain}
                  </button>
                </div>
              </div>
            )}

            {flowState === 'FAILED' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-2 py-8">
                <div className="w-14 h-14 rounded-full bg-[var(--pd-bad-bg)] text-[var(--pd-bad)] flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8" strokeWidth={2.25} aria-hidden="true" />
                </div>
                <h2 className="text-[20px] font-extrabold text-[var(--pd-navy)] m-0">
                  {BuySmsCreditsStrings.failedToStartTitle}
                </h2>

                <div className="w-full flex flex-col gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => setFlowState('CHOOSING')}
                    className="w-full min-h-[60px] rounded-[var(--pd-field-radius)] bg-[var(--pd-blue)] hover:bg-[var(--pd-blue-hover)] active:scale-[0.99] text-white text-[20px] font-extrabold transition-all cursor-pointer"
                  >
                    {BuySmsCreditsStrings.tryAgain}
                  </button>
                </div>
              </div>
            )}

            {(flowState === 'CHOOSING' || flowState === 'INITIALIZING') && (
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-[16px] font-semibold text-[var(--pd-muted)] m-0">
                    {BuySmsCreditsStrings.currentBalance(currentBalance)}
                  </p>

                  {errorMessage && (
                    <div className="mt-3 rounded-[var(--pd-card-radius)] bg-[var(--pd-bad-bg)] border border-[var(--pd-bad)]/25 p-3.5 flex items-start gap-2.5">
                      <AlertCircle
                        className="w-5 h-5 text-[var(--pd-bad)] shrink-0 mt-0.5"
                        strokeWidth={2.25}
                        aria-hidden="true"
                      />
                      <span className="text-[15px] font-semibold text-[var(--pd-bad)]">{errorMessage}</span>
                    </div>
                  )}

                  <h2 className="mt-5 mb-2.5 text-[18px] font-extrabold text-[var(--pd-navy)] m-0">
                    {BuySmsCreditsStrings.chooseHeading}
                  </h2>

                  {isLoadingBundles ? (
                    <div className="flex flex-col gap-3 mt-2.5">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="h-24 rounded-[var(--pd-card-radius)] bg-[var(--pd-line-2)] animate-pulse"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 mt-2.5" role="radiogroup" aria-label={BuySmsCreditsStrings.chooseHeading}>
                      {bundles.map((bundle) => (
                        <SmsCreditBundleOption
                          key={bundle.key}
                          bundle={bundle}
                          selected={selectedBundle?.key === bundle.key}
                          disabled={isOffline || flowState === 'INITIALIZING'}
                          onSelect={(b) => setSelectedBundle(b)}
                          enoughForLabel={BuySmsCreditsStrings.enoughFor(
                            Math.round(bundle.credits * PACKAGES_PER_SMS)
                          )}
                        />
                      ))}
                    </div>
                  )}

                  {/* Payment provider selector */}
                  <div className="mt-5">
                    <label className="block mb-2 text-[15px] font-bold text-[var(--pd-navy)]">
                      Pay with
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setSelectedProvider('paystack')}
                        className={`min-h-[50px] px-3 py-2 rounded-[var(--pd-card-radius)] border-2 font-bold text-[15px] flex items-center justify-center transition-all cursor-pointer ${
                          selectedProvider === 'paystack'
                            ? 'border-[var(--pd-blue)] bg-[var(--pd-tint)] text-[var(--pd-blue)]'
                            : 'border-[var(--pd-line-2)] bg-white text-[var(--pd-navy)]'
                        }`}
                      >
                        <span>Paystack</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedProvider('flutterwave')}
                        className={`min-h-[50px] px-3 py-2 rounded-[var(--pd-card-radius)] border-2 font-bold text-[15px] flex items-center justify-center transition-all cursor-pointer ${
                          selectedProvider === 'flutterwave'
                            ? 'border-[var(--pd-blue)] bg-[var(--pd-tint)] text-[var(--pd-blue)]'
                            : 'border-[var(--pd-line-2)] bg-white text-[var(--pd-navy)]'
                        }`}
                      >
                        <span>Flutterwave</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-6 pb-2 flex flex-col gap-3">
                  {!selectedBundle && !isLoadingBundles && (
                    <p className="text-[15px] font-semibold text-[var(--pd-muted)] text-center m-0">
                      {BuySmsCreditsStrings.pickABundle}
                    </p>
                  )}
                  <button
                    type="button"
                    disabled={!selectedBundle || isOffline || flowState === 'INITIALIZING'}
                    onClick={handleContinueToPayment}
                    className="w-full min-h-[60px] rounded-[var(--pd-field-radius)] bg-[var(--pd-blue)] hover:bg-[var(--pd-blue-hover)] disabled:bg-[var(--pd-line)] disabled:text-[var(--pd-muted)] disabled:cursor-not-allowed text-white text-[20px] font-extrabold transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {flowState === 'INITIALIZING' ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>{BuySmsCreditsStrings.starting}</span>
                      </>
                    ) : (
                      <span>{BuySmsCreditsStrings.continueToPayment}</span>
                    )}
                  </button>
                  <p className="text-[15px] font-semibold text-[var(--pd-muted)] text-center m-0">
                    {BuySmsCreditsStrings.payNote}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <HelpSheet open={helpOpen} onOpenChange={setHelpOpen} screenName="Buy SMS credits" />
    </div>
  );
}
