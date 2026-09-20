import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronLeft, Info, RefreshCw } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { db } from '@/offline/db/database';
import { SyncEngine } from '@/offline/sync/sync-engine';
import { useSyncState } from '@/offline/hooks/useSyncState';
import { SmsCreditBalance } from '../components/SmsCreditBalance';
import { SmsCreditWarning } from '../components/SmsCreditWarning';
import { SmsCreditActivityList } from '../components/SmsCreditActivityList';

interface SmsCreditsScreenProps {
  onBack: () => void;
  onNavigateToBuy?: () => void;
}

export function SmsCreditsScreen({ onBack, onNavigateToBuy }: SmsCreditsScreenProps) {
  const { business } = useAuth();
  const businessId = business?.id;
  const syncState = useSyncState(businessId);

  // Live query local Dexie wallet
  const wallet = useLiveQuery(
    () => businessId ? db.smsWallets.where('business_id').equals(businessId).first() : undefined,
    [businessId]
  );

  // Live query transactions
  const transactions = useLiveQuery(
    async () => {
      if (!wallet?.id) return [];
      const txs = await db.smsCreditTransactions
        .where('sms_wallet_id')
        .equals(wallet.id)
        .toArray();

      return txs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
    [wallet?.id]
  );

  const handleManualSync = async () => {
    if (businessId) {
      await SyncEngine.sync(businessId);
    }
  };

  const balance = wallet?.balance ?? 0;
  const isOffline = syncState.connectivity === 'UNREACHABLE' || syncState.connectivity === 'DEGRADED';

  return (
    <div className="flex flex-col min-h-screen bg-surface-page w-full max-w-lg mx-auto pb-10">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-surface-page/95 backdrop-blur-sm border-b border-border-subtle px-4 h-14 flex items-center justify-between shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center text-text-secondary hover:text-text-primary transition-colors py-2 pr-4 -ml-2 cursor-pointer"
        >
          <ChevronLeft className="h-6 w-6" />
          <span className="text-[17px] font-medium ml-0.5">Back</span>
        </button>

        <h1 className="text-[17px] font-semibold text-text-primary">
          SMS Credits
        </h1>

        <button
          type="button"
          onClick={handleManualSync}
          disabled={syncState.isSyncing}
          aria-label="Refresh balance"
          className="p-2 -mr-2 text-text-muted hover:text-text-primary transition-colors rounded-full hover:bg-surface-subtle active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${syncState.isSyncing ? 'animate-spin text-action-primary' : ''}`} />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 pt-4 flex flex-col gap-4">
        {/* Offline indicator note */}
        {isOffline && (
          <div className="w-full rounded-xl bg-amber-50/80 border border-amber-200/80 px-3.5 py-2.5 flex items-center gap-2 text-xs text-amber-900">
            <Info className="w-4 h-4 text-amber-700 flex-shrink-0" />
            <span>Showing last synced balance. Will refresh when connected.</span>
          </div>
        )}

        {/* Warning Banner if 0 or low */}
        <SmsCreditWarning balance={balance} />

        {/* Hero Card */}
        <SmsCreditBalance balance={balance} variant="hero" />

        {/* Buy Credits CTA */}
        {onNavigateToBuy && (
          <button
            type="button"
            onClick={onNavigateToBuy}
            className="w-full h-13 bg-action-primary hover:bg-action-primary/95 active:scale-[0.99] text-white font-semibold text-[15px] rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Buy SMS credits</span>
          </button>
        )}

        {/* Info card regarding package notifications */}
        <div className="bg-surface-subtle border border-border-subtle rounded-[var(--radius-xl)] p-4 text-xs text-text-secondary flex flex-col gap-1.5">
          <p className="font-semibold text-text-primary">About SMS credits</p>
          <p>
            Credits are only used for outbound arrival SMS messages to parcel recipients. Core package intake, pickup codes, and verification remain 100% free.
          </p>
        </div>

        {/* Activity Ledger */}
        <div className="mt-2">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
              Credit History
            </h2>
            <span className="text-xs text-text-muted">
              {transactions ? `${transactions.length} recorded` : 'Loading…'}
            </span>
          </div>

          <SmsCreditActivityList
            transactions={transactions ?? []}
            isLoading={transactions === undefined}
          />
        </div>
      </main>
    </div>
  );
}
