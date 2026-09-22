import * as React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { CloudOff } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { useKeyboardOpen } from '@/features/auth/lib/useKeyboardOpen';
import { useSyncState } from '@/offline/hooks/useSyncState';
import { cn } from '@/lib/utils';
import { HomeStrings } from './strings';
import { currentGreeting } from './lib/greeting';
import { useHomeData } from './hooks/useHomeData';
import { DEFAULT_DAILY_STORAGE_FEE_MINOR } from '@/features/payments/domain/storage-fee';
import { usePickupIdentity } from './hooks/usePickupIdentity';
import { HomeHeader } from './components/HomeHeader';
import { SyncSheet } from './components/SyncSheet';
import { summariseSync } from './lib/syncSummary';
import { SetupBanner } from './components/SetupBanner';
import { ActionTiles } from './components/ActionTiles';
import { StatStrip } from './components/StatStrip';
import { OverdueCard } from './components/OverdueCard';
import { WaitingList } from './components/WaitingList';
import { FirstPackageCard } from './components/FirstPackageCard';
import { HomeSkeleton } from './components/HomeSkeleton';
import { HomeError } from './components/HomeError';
import { isOverdue24h, formatOverdueAgeSubline } from '@/features/packages/domain/package-filters';

export type HomePackageFilter = 'WAITING' | 'COLLECTED';

export interface HomeScreenProps {
  onNavigateToSearch?: () => void;
  onNavigateToAdd?: () => void;
  /** Opens the Packages screen, optionally on a given tab. */
  onNavigateToPackages?: (status?: HomePackageFilter, age?: string) => void;
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
  const routerNavigate = useNavigate();
  const handleNavigateToSearch = onNavigateToSearch ?? (() => routerNavigate({ to: '/packages/search' }));
  const handleNavigateToAdd = onNavigateToAdd ?? (() => routerNavigate({ to: '/packages/new' }));
  const handleNavigateToPackages =
    onNavigateToPackages ??
    ((status, age) =>
      routerNavigate({
        to: '/packages',
        search: (status || age) ? { status, age } : undefined,
      }));
  const handleNavigateToSetup = onNavigateToSetup ?? (() => routerNavigate({ to: '/more/business' }));
  const handleNavigateToAttention = onNavigateToAttention ?? (() => routerNavigate({ to: '/more/attention' }));
  const handleSelectPackage = onSelectPackage ?? ((id: string) => routerNavigate({ to: '/packages/$packageId', params: { packageId: id } }));

  const { user, business } = useAuth();
  const identity = usePickupIdentity();
  const syncState = useSyncState(business?.id);
  const data = useHomeData(business?.id, business?.daily_storage_fee_minor ?? DEFAULT_DAILY_STORAGE_FEE_MINOR);
  const keyboardOpen = useKeyboardOpen();

  const [syncSheetOpen, setSyncSheetOpen] = React.useState(false);
  // Bumped to make the live query re-run after a failed read.
  const [retryKey, setRetryKey] = React.useState(0);

  const sync = summariseSync(syncState);
  const greeting = currentGreeting();

  const rows = data.waiting;

  // 24-hour overdue packages calculation using the exact same shared utility
  const overdueInfo = React.useMemo(() => {
    const now = new Date();
    const overdueList = data.waiting.filter((r) => isOverdue24h(r.createdAt, now));
    const count = overdueList.length;
    let oldestSubline: string | null = null;
    if (count > 0) {
      // data.waiting is already sorted oldest-first by createdAt
      oldestSubline = formatOverdueAgeSubline(overdueList[0].createdAt, now);
    }
    return { count, oldestSubline };
  }, [data.waiting]);

  const handleSyncChip = () => {
    // When something is genuinely stuck, the chip is a route to the fix
    // rather than a reassurance about it.
    if (sync.tone === 'attention') {
      handleNavigateToAttention();
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
          // The sheet's own top edge stays flush with the bottom of the blue
          // band. Only the tiles cross it, which reads as two cards resting
          // on the boundary rather than as a torn corner.
          'rounded-t-[var(--pd-sheet-radius)]'
        )}
      >
        <div className="mx-auto w-full max-w-[520px] px-4 pb-8 flex flex-col gap-4">
          <ActionTiles
            onAddPackage={handleNavigateToAdd}
            onFindPackage={handleNavigateToSearch}
            className="relative z-10 -mt-[calc(var(--pd-tile-overlap)*2)]"
          />

          {identity.needsSetup && identity.missing && (
            <SetupBanner
              missing={identity.missing}
              onFinishSetup={handleNavigateToSetup}
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
            <>
              <StatStrip
                stats={data.stats}
                onOpenWaiting={() => handleNavigateToPackages('WAITING')}
                onOpenUnpaid={() => handleNavigateToPackages('WAITING')}
                onOpenCollected={() => handleNavigateToPackages('COLLECTED')}
              />

              <OverdueCard
                overdueCount={overdueInfo.count}
                oldestSubline={overdueInfo.oldestSubline}
                onOpenOverdue={() => handleNavigateToPackages('WAITING', '24h')}
              />
            </>
          )}

          {data.status === 'ready' &&
            (data.isFirstDay ? (
              <FirstPackageCard />
            ) : (
              <WaitingList
                rows={rows}
                onSelectPackage={(id) => handleSelectPackage(id)}
                onSeeAll={() => handleNavigateToPackages('WAITING')}
              />
            ))}
        </div>
      </div>

      <SyncSheet open={syncSheetOpen} onOpenChange={setSyncSheetOpen} summary={sync} />
    </div>
  );
}
