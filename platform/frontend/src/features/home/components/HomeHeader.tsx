import { useAuth } from '@/features/auth/AuthContext';
import { SyncIndicator } from '@/offline/components/SyncIndicator';
import { useSyncState } from '@/offline/hooks/useSyncState';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/offline/db/database';
import { SmsCreditBalance } from '@/features/sms-credits/components/SmsCreditBalance';

interface HomeHeaderProps {
  onNavigateToCredits?: () => void;
}

export function HomeHeader({ onNavigateToCredits }: HomeHeaderProps) {
  const { user, business } = useAuth();
  const syncState = useSyncState(business?.id);

  const wallet = useLiveQuery(
    () => business?.id ? db.smsWallets.where('business_id').equals(business.id).first() : undefined,
    [business?.id]
  );
  
  // Calculate greeting
  const hour = new Date().getHours();
  let greeting = 'Welcome back';
  if (hour < 12) greeting = 'Good morning';
  else if (hour < 18) greeting = 'Good afternoon';
  else greeting = 'Good evening';

  const name = user?.first_name || user?.email?.split('@')[0] || '';

  return (
    <header className="flex items-start justify-between pb-4 pt-2">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
          {greeting}{name ? `, ${name}` : ''}
        </h1>
        {business && (
          <div className="mt-1 flex flex-col sm:flex-row sm:items-center sm:gap-2 text-[var(--text-body-md)]">
            <span className="font-semibold text-text-primary">{business.name}</span>
            <span className="hidden sm:inline text-text-muted">·</span>
            <span className="text-text-secondary">Default Park</span>
          </div>
        )}
      </div>
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <SyncIndicator state={syncState} />
        {wallet !== undefined && (
          <SmsCreditBalance
            balance={wallet.balance}
            variant="badge"
            onClick={onNavigateToCredits}
          />
        )}
      </div>
    </header>
  );
}
