import { useAuth } from '@/features/auth/AuthContext';
import { SyncIndicator } from '@/offline/components/SyncIndicator';
import { useSyncState } from '@/offline/hooks/useSyncState';

export function HomeHeader() {
  const { user, business } = useAuth();
  const syncState = useSyncState(business?.id);
  
  // Calculate greeting
  const hour = new Date().getHours();
  let greeting = 'Welcome back';
  if (hour < 12) greeting = 'Good morning';
  else if (hour < 18) greeting = 'Good afternoon';
  else greeting = 'Good evening';

  const name = user?.first_name || user?.email?.split('@')[0] || '';

  return (
    <header className="flex items-start justify-between pb-6 pt-2">
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
      <div className="flex-shrink-0">
        <SyncIndicator state={syncState} />
      </div>
    </header>
  );
}
