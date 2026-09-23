import * as React from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { CheckCircle2, AlertCircle, Clock, XCircle } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { SyncEngine } from '@/offline/sync/sync-engine';
import { TaskHeader } from '@/design-system/shell/TaskHeader';
import { BuySmsCreditsStrings } from '@/features/sms-credits/purchase/strings';
import { verifyPurchaseOnServer } from '@/features/sms-credits/purchase/api';

export interface PurchaseReturnSearch {
  status?: string;
  tx_ref?: string;
  reference?: string;
  trxref?: string;
}

export function PurchaseReturnScreen() {
  const routerNavigate = useNavigate();
  const search = useSearch({ strict: false }) as PurchaseReturnSearch;
  const { business } = useAuth();
  const businessId = business?.id;

  const statusParam = (search.status || '').toLowerCase();
  const reference = search.tx_ref || search.reference || search.trxref;

  const isExplicitCancelled = statusParam === 'cancelled';

  const [state, setState] = React.useState<'CONFIRMING' | 'PAID' | 'FAILED' | 'PENDING' | 'CANCELLED'>(
    isExplicitCancelled ? 'CANCELLED' : 'CONFIRMING'
  );
  const [balance, setBalance] = React.useState<number | null>(null);

  const verify = React.useCallback(async () => {
    if (!reference) {
      setState('FAILED');
      return;
    }

    try {
      setState('CONFIRMING');
      const res = await verifyPurchaseOnServer(reference);

      if (res.purchase.status === 'PAID') {
        setBalance(res.wallet_balance);
        setState('PAID');
        if (businessId) {
          await SyncEngine.sync(businessId);
        }
      } else if (res.purchase.status === 'FAILED' || res.purchase.status === 'CANCELLED') {
        setState(res.purchase.status === 'CANCELLED' ? 'CANCELLED' : 'FAILED');
      } else {
        setState('PENDING');
      }
    } catch {
      // A failed *check* is not a failed *payment* — the money may well have
      // gone through at the provider and this was just a network blip or a
      // transient server error. Claiming FAILED here would be a false
      // negative that could tell someone their payment failed when it
      // didn't. PENDING is the honest state: unconfirmed, safe to retry.
      setState('PENDING');
    }
  }, [reference, businessId]);

  React.useEffect(() => {
    if (!isExplicitCancelled && reference) {
      verify();
    }
  }, [isExplicitCancelled, reference, verify]);

  return (
    <div className="flex flex-col min-h-screen bg-[var(--pd-page-2)] w-full max-w-lg mx-auto pb-10">
      <TaskHeader
        title={BuySmsCreditsStrings.title}
        onBack={() => routerNavigate({ to: '/more/sms-credits' })}
        screenName="Payment status"
      />

      <main className="flex-1 px-4 pt-4 flex flex-col justify-center items-center text-center">
        {state === 'CANCELLED' && (
          <div className="w-full flex flex-col items-center px-4 py-8">
            <div className="w-16 h-16 rounded-full bg-[var(--pd-line-2)] text-[var(--pd-muted)] flex items-center justify-center mb-4">
              <XCircle className="w-9 h-9" strokeWidth={2.25} aria-hidden="true" />
            </div>
            <h2 className="text-[22px] font-extrabold text-[var(--pd-navy)] m-0">
              {BuySmsCreditsStrings.paymentCancelledTitle}
            </h2>
            <p className="text-[16px] font-semibold text-[var(--pd-muted)] mt-2 mb-8 max-w-xs">
              {BuySmsCreditsStrings.paymentCancelledBody}
            </p>

            <div className="w-full flex flex-col gap-3">
              <button
                type="button"
                onClick={() => routerNavigate({ to: '/more/sms-credits/buy' })}
                className="w-full min-h-[60px] rounded-[var(--pd-field-radius)] bg-[var(--pd-blue)] hover:bg-[var(--pd-blue-hover)] active:scale-[0.99] text-white text-[20px] font-extrabold transition-all cursor-pointer"
              >
                {BuySmsCreditsStrings.tryAgain}
              </button>
              <button
                type="button"
                onClick={() => routerNavigate({ to: '/more/sms-credits' })}
                className="w-full min-h-[52px] rounded-[var(--pd-field-radius)] border-2 border-[var(--pd-line-2)] text-[var(--pd-navy)] text-[16px] font-bold transition-all cursor-pointer"
              >
                {BuySmsCreditsStrings.backToSmsCredits}
              </button>
            </div>
          </div>
        )}

        {state === 'CONFIRMING' && (
          <div className="flex flex-col items-center px-4 py-10 gap-2">
            <div className="w-12 h-12 border-[3px] border-[var(--pd-blue)] border-t-transparent rounded-full animate-spin mb-2" />
            <h2 className="text-[20px] font-extrabold text-[var(--pd-navy)] m-0">
              {BuySmsCreditsStrings.confirmingTitle}
            </h2>
            <p className="text-[16px] font-semibold text-[var(--pd-muted)] m-0 max-w-xs">
              {BuySmsCreditsStrings.confirmingBody}
            </p>
          </div>
        )}

        {state === 'PAID' && (
          <div className="w-full flex flex-col items-center px-4 py-8">
            <div className="w-16 h-16 rounded-full bg-[var(--pd-ok-bg)] text-[var(--pd-ok)] flex items-center justify-center mb-4">
              <CheckCircle2 className="w-9 h-9" strokeWidth={2.25} aria-hidden="true" />
            </div>
            <h2 className="text-[24px] font-extrabold text-[var(--pd-navy)] m-0">
              {BuySmsCreditsStrings.successTitle(balance ?? 0)}
            </h2>

            <button
              type="button"
              onClick={() => routerNavigate({ to: '/more/sms-credits' })}
              className="mt-8 w-full min-h-[60px] rounded-[var(--pd-field-radius)] bg-[var(--pd-blue)] hover:bg-[var(--pd-blue-hover)] active:scale-[0.99] text-white text-[20px] font-extrabold transition-all cursor-pointer"
            >
              {BuySmsCreditsStrings.goBack}
            </button>
          </div>
        )}

        {state === 'PENDING' && (
          <div className="w-full flex flex-col items-center px-4 py-8">
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
                onClick={verify}
                className="w-full min-h-[60px] rounded-[var(--pd-field-radius)] bg-[var(--pd-blue)] hover:bg-[var(--pd-blue-hover)] active:scale-[0.99] text-white text-[20px] font-extrabold transition-all cursor-pointer"
              >
                {BuySmsCreditsStrings.checkAgain}
              </button>
              <button
                type="button"
                onClick={() => routerNavigate({ to: '/more/sms-credits' })}
                className="w-full min-h-[52px] rounded-[var(--pd-field-radius)] border-2 border-[var(--pd-line-2)] text-[var(--pd-navy)] text-[16px] font-bold transition-all cursor-pointer"
              >
                {BuySmsCreditsStrings.backToSmsCredits}
              </button>
            </div>
          </div>
        )}

        {state === 'FAILED' && (
          <div className="w-full flex flex-col items-center px-4 py-8">
            <div className="w-14 h-14 rounded-full bg-[var(--pd-bad-bg)] text-[var(--pd-bad)] flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8" strokeWidth={2.25} aria-hidden="true" />
            </div>
            <h2 className="text-[20px] font-extrabold text-[var(--pd-navy)] m-0">
              {BuySmsCreditsStrings.failedToStartTitle}
            </h2>

            <div className="w-full flex flex-col gap-3 mt-8">
              <button
                type="button"
                onClick={() => routerNavigate({ to: '/more/sms-credits/buy' })}
                className="w-full min-h-[60px] rounded-[var(--pd-field-radius)] bg-[var(--pd-blue)] hover:bg-[var(--pd-blue-hover)] active:scale-[0.99] text-white text-[20px] font-extrabold transition-all cursor-pointer"
              >
                {BuySmsCreditsStrings.tryAgain}
              </button>
              <button
                type="button"
                onClick={() => routerNavigate({ to: '/more/sms-credits' })}
                className="w-full min-h-[52px] rounded-[var(--pd-field-radius)] border-2 border-[var(--pd-line-2)] text-[var(--pd-navy)] text-[16px] font-bold transition-all cursor-pointer"
              >
                {BuySmsCreditsStrings.backToSmsCredits}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
