import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { RefreshCw, WifiOff } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { db } from '@/offline/db/database';
import { SyncEngine } from '@/offline/sync/sync-engine';
import { useSyncState } from '@/offline/hooks/useSyncState';
import { TaskHeader } from '@/design-system/shell/TaskHeader';
import { SmsCreditsStrings } from '@/features/sms-credits/strings';
import { SmsCreditBalance } from '@/features/sms-credits/components/SmsCreditBalance';
import { SmsCreditWarning } from '@/features/sms-credits/components/SmsCreditWarning';
import { SmsCreditActivityList } from '@/features/sms-credits/components/SmsCreditActivityList';

interface SmsCreditsScreenProps {
  onBack?: () => void;
  onNavigateToBuy?: () => void;
}

/** "2 hours ago", "5 minutes ago", "3 days ago" — how old the number is. */
function describeAge(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (isNaN(then)) return null;

  const minutes = Math.floor((Date.now() - then) / 60000);
  if (minutes < 1) return 'a moment ago';
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? 'day' : 'days'} ago`;
}

console.log("SmsCreditsScreen render");
export function SmsCreditsScreen({ onBack, onNavigateToBuy }: SmsCreditsScreenProps) {
  const routerNavigate = useNavigate();
  const handleBack = onBack ?? (() => routerNavigate({ to: '/more' }));
  const handleNavigateToBuy =
    onNavigateToBuy ?? (() => routerNavigate({ to: '/more/sms-credits/buy' }));
  const { business, role } = useAuth();
  const businessId = business?.id;
  const syncState = useSyncState(businessId);



  const wallet = useLiveQuery(
    () => (businessId ? db.smsWallets.where('business_id').equals(businessId).first() : undefined),
    [businessId]
  );

  const transactions = useLiveQuery(
    async () => {
      if (!wallet?.id) return [];
      const txs = await db.smsCreditTransactions
        .where('sms_wallet_id')
        .equals(wallet.id)
        .toArray();

      return txs.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
    [wallet?.id]
  );

  const handleManualSync = async () => {
    if (businessId) {
      await SyncEngine.sync(businessId);
    }
  };

  const balance = wallet?.balance ?? 0;
  const isOffline =
    syncState.connectivity === 'UNREACHABLE' || syncState.connectivity === 'DEGRADED';
  const canBuy = role === 'owner' || role === 'manager';
  const age = describeAge(wallet?.updated_at);

  return (
    <div className="flex flex-col min-h-screen bg-[var(--pd-page-2)] w-full max-w-lg mx-auto pb-10">
      <TaskHeader
        title={SmsCreditsStrings.title}
        onBack={handleBack}
        screenName="SMS credits"
      />

      <main className="flex-1 px-4 pt-4 flex flex-col gap-4">
        {/* Offline: say how old this number is, so it can be trusted. */}
        {isOffline && (
          <div
            role="status"
            className="w-full rounded-[var(--pd-card-radius)] bg-[var(--pd-warn-bg)] border border-[var(--pd-warn)]/25 px-4 py-3 flex items-center gap-3 text-[var(--pd-warn)]"
          >
            <WifiOff className="w-6 h-6 shrink-0" aria-hidden="true" strokeWidth={2.25} />
            <span className="text-[16px] font-semibold leading-snug">
              {age ? SmsCreditsStrings.offlineAge(age) : SmsCreditsStrings.offlineNoAge}
            </span>
          </div>
        )}

        {/* The number */}
        <SmsCreditBalance balance={balance} />

        {/* What the number means, when it needs saying */}
        <SmsCreditWarning balance={balance} />

        {/* Getting more */}
        {canBuy ? (
          <button
            type="button"
            onClick={handleNavigateToBuy}
            className="w-full min-h-[60px] rounded-[var(--pd-field-radius)] bg-[var(--pd-blue)] hover:bg-[var(--pd-blue-hover)] active:scale-[0.99] text-white text-[20px] font-extrabold transition-all shadow-xs cursor-pointer"
          >
            {SmsCreditsStrings.buy}
          </button>
        ) : (
          <p className="text-[18px] font-semibold text-[var(--pd-muted)] text-center m-0 py-2">
            {SmsCreditsStrings.askManager}
          </p>
        )}

        {/* History */}
        <section className="mt-2 flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[18px] font-extrabold text-[var(--pd-navy)] m-0">
              {SmsCreditsStrings.historyTitle}
            </h2>
            <button
              type="button"
              onClick={handleManualSync}
              disabled={syncState.isSyncing || isOffline}
              className="min-h-[48px] px-2 -mr-2 flex items-center gap-1.5 text-[16px] font-extrabold text-[var(--pd-blue)] hover:text-[var(--pd-blue-hover)] disabled:opacity-40 active:scale-95 transition-all cursor-pointer"
            >
              <RefreshCw
                className={`w-5 h-5 ${syncState.isSyncing ? 'animate-spin' : ''}`}
                aria-hidden="true"
                strokeWidth={2.25}
              />
              <span>{SmsCreditsStrings.refresh}</span>
            </button>
          </div>

          <SmsCreditActivityList
            transactions={transactions ?? []}
            isLoading={transactions === undefined}
          />
        </section>
      </main>
    </div>
  );
}
