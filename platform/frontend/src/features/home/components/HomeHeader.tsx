import { Logo } from '@/features/auth/components/Logo';
import { cn } from '@/lib/utils';
import { SyncChip } from './SyncChip';
import type { SyncSummary } from '../lib/syncSummary';

export interface HomeHeaderProps {
  greeting: string;
  /** The trading name customers see. Absent while setup is unfinished. */
  pointName: string | null;
  /** The park it sits in. Absent while setup is unfinished. */
  parkName: string | null;
  sync: SyncSummary;
  onOpenSync: () => void;
  /**
   * Drop to the logo row alone. Used when the keyboard is up, so the field
   * being typed into and its results both stay on screen — the same
   * behaviour as the sign-in screens.
   */
  collapsed?: boolean;
}

/**
 * The solid blue band at the top of Home.
 *
 * Reads top to bottom in the order someone checks it: who this app is, is my
 * work safe, hello, and then the two names that go out in every customer
 * SMS. The pickup point is the largest thing on the screen after the action
 * tiles because it is the one piece of identity an attendant working across
 * two parks must not get wrong.
 *
 * Every piece of small text here is pure white on #2563EB — never white at
 * reduced opacity, which is unreadable on a cheap screen in daylight.
 */
export function HomeHeader({
  greeting,
  pointName,
  parkName,
  sync,
  onOpenSync,
  collapsed = false,
}: HomeHeaderProps) {
  return (
    <header className="bg-[var(--pd-blue)] text-white">
      <div className="mx-auto w-full max-w-[520px] px-4 pt-3">
        <div className="flex items-center justify-between gap-3 min-h-[var(--pd-tap-min)]">
          <Logo tone="blue" />
          <SyncChip summary={sync} onOpen={onOpenSync} />
        </div>

        {/* Collapsed keeps the logo row and drops the rest, rather than
            hiding the header entirely — losing the brand under the keyboard
            makes the app feel like it navigated somewhere it did not. */}
        {!collapsed && (
          <div className="mt-3">
            <p className="m-0 text-[var(--pd-size-meta)] font-semibold leading-tight text-white">
              {greeting}
            </p>

            {pointName && (
              <h1
                className={cn(
                  'm-0 mt-1.5 text-[var(--pd-size-point)] font-extrabold',
                  'leading-tight tracking-[-0.02em] text-white',
                  // One line, cut cleanly. A 40-character trading name must
                  // not push the park off the screen.
                  'truncate'
                )}
                title={pointName}
              >
                {pointName}
              </h1>
            )}

            {parkName && (
              <p className="m-0 mt-0.5 text-[var(--pd-size-meta)] font-bold leading-tight text-white truncate">
                {parkName}
              </p>
            )}

            {/* Nothing stands in for a missing name. The setup banner below
                asks for the real one — see SetupBanner. */}
          </div>
        )}
      </div>

      {/* The strip the action tiles climb into. */}
      <div
        aria-hidden="true"
        // Twice the overlap: the sheet's rounded top edge takes one, and the
        // tiles climb one further. Anything less and the park name is cut.
        style={{ height: 'calc(var(--pd-tile-overlap) * 2)' }}
        className={collapsed ? 'mt-3' : 'mt-5'}
      />
    </header>
  );
}
