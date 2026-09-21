import * as React from 'react';
import { CloudOff } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { useKeyboardOpen } from '@/features/auth/lib/useKeyboardOpen';
import { useSyncState } from '@/offline/hooks/useSyncState';
import { cn } from '@/lib/utils';
import { HomeStrings } from './strings';
import { currentGreeting } from './lib/greeting';
import { useHomeData } from './hooks/useHomeData';
import { usePickupIdentity } from './hooks/usePickupIdentity';
import { HomeHeader } from './components/HomeHeader';
import { SyncSheet } from './components/SyncSheet';
import { summariseSync } from './components/SyncChip';
import { SetupBanner } from './components/SetupBanner';
import { ActionTiles } from './components/ActionTiles';
import { StatStrip } from './components/StatStrip';
import { WaitingList } from './components/WaitingList';
import { FirstPackageCard } from './components/FirstPackageCard';
import { HomeSkeleton } from './components/HomeSkeleton';
import { HomeError } from './components/HomeError';
import type { HomeFilter } from './components/FilterChips';

export type HomePackageFilter = 'WAITING' | 'COLLECTED';

export interface HomeScreenProps {
  onNavigateToSearch?: () => void;
  onNavigateToAdd?: () => void;
  /** Opens the Packages screen, optionally on a given tab. */
  onNavigateToPackages?: (status?: HomePackageFilter) => void;
  /** Opens the screen where the pickup point and park names are set. */
  onNavigateToSetup?: () => void;
  /** Opens the list of things that need a decision. */
  onNavigateToAttention?: () => void;
  onSelectPackage?: (packageId: string) => void;
}

/**
 * Home: two jobs, then one glance.
 *
 * The screen is built around the two things an attendant does all day with
 * a customer standing in front of them — a package arrived, a customer is
 * here — and everything below the tiles exists only to answer "how am I
 * doing?" without a tap.
 *
 * Structure follows the sign-in screens: a solid blue header, then a sheet
 * with rounded top corners that the action tiles climb into. All of it is
 * read from the local database, so the screen is complete before the network
 * is consulted about anything.
 */
export function HomeScreen({
  onNavigateToSearch,
  onNavigateToAdd,
  onNavigateToPackages,
  onNavigateToSetup,
  onNavigateToAttention,
  onSelectPackage,
}: HomeScreenProps) {
  const { user, business } = useAuth();
  const identity = usePickupIdentity();
  const syncState = useSyncState(business?.id);
  const data = useHomeData(business?.id);
  const keyboardOpen = useKeyboardOpen();

  const [filter, setFilter] = React.useState<HomeFilter>('all');
  const [syncSheetOpen, setSyncSheetOpen] = React.useState(false);
  // Bumped to make the live query re-run after a failed read.
  const [retryKey, setRetryKey] = React.useState(0);

  const sync = summariseSync(syncState);
  const greeting = currentGreeting();

  const rows = React.useMemo(
    () => (filter === 'unpaid' ? data.waiting.filter((r) => r.balanceMinor > 0) : data.waiting),
    [data.waiting, filter]
  );

  const handleSyncChip = () => {
    // When something is genuinely stuck, the chip is a route to the fix
    // rather than a reassurance about it.
    if (sync.tone === 'attention' && onNavigateToAttention) {
      onNavigateToAttention();
      return;
    }
    setSyncSheetOpen(true);
  };

  const showOfflineBanner = sync.tone === 'offline';
  // No rows of zeros on day one: the stat strip only earns its space once
  // this pickup point has actually held a package.
  const showStats = data.status === 'ready' && !data.isFirstDay;

  return (
    <div
      key={retryKey}
      className="min-h-[100dvh] bg-[var(--pd-page-2)] flex flex-col"
    >
      <HomeHeader
        greeting={HomeStrings.greeting(greeting, user?.first_name?.trim() || null)}
        pointName={identity.pointName}
        parkName={identity.parkName}
        sync={sync}
        onOpenSync={handleSyncChip}
        collapsed={keyboardOpen}
      />

      <div
        className={cn(
          'relative flex-1 bg-[var(--pd-page-2)]',
          'rounded-t-[var(--pd-sheet-radius)] -mt-[var(--pd-tile-overlap)]'
        )}
      >
        <div className="mx-auto w-full max-w-[520px] px-4 pb-8 flex flex-col gap-4">
          <ActionTiles
            onAddPackage={() => onNavigateToAdd?.()}
            onFindPackage={() => onNavigateToSearch?.()}
            className="relative z-10 -mt-[var(--pd-tile-overlap)]"
          />

          {identity.needsSetup && identity.missing && (
            <SetupBanner
              missing={identity.missing}
              onFinishSetup={() => onNavigateToSetup?.()}
            />
          )}

          {showOfflineBanner && (
            <p className="m-0 flex items-center gap-2.5 rounded-[var(--pd-card-radius)] border border-[#FDE68A] bg-[var(--pd-warn-bg)] px-4 py-3 text-[var(--pd-size-meta)] font-bold leading-[1.35] text-[var(--pd-warn)]">
              <CloudOff className="w-5 h-5 flex-none" strokeWidth={2.5} aria-hidden="true" />
              {HomeStrings.offlineBanner}
            </p>
          )}

          {data.status === 'loading' && <HomeSkeleton />}

          {data.status === 'error' && <HomeError onRetry={() => setRetryKey((n) => n + 1)} />}

          {showStats && (
            <StatStrip
              stats={data.stats}
              onOpenWaiting={() => onNavigateToPackages?.('WAITING')}
              // Unpaid is a payment state rather than a package status, and
              // the Packages screen filters by status. Narrowing this list is
              // the honest version of "filtered that way" until it can filter
              // by money owed too.
              onOpenUnpaid={() => setFilter('unpaid')}
              onOpenCollected={() => onNavigateToPackages?.('COLLECTED')}
            />
          )}

          {data.status === 'ready' &&
            (data.isFirstDay ? (
              <FirstPackageCard />
            ) : (
              <WaitingList
                rows={rows}
                filter={filter}
                onFilterChange={setFilter}
                onSelectPackage={(id) => onSelectPackage?.(id)}
                onSeeAll={() => onNavigateToPackages?.('WAITING')}
              />
            ))}
        </div>
      </div>

      <SyncSheet open={syncSheetOpen} onOpenChange={setSyncSheetOpen} summary={sync} />
    </div>
  );
}
