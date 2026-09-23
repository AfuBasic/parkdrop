import { cn } from '@/lib/utils';
import { HomeStrings } from '../strings';
import { FirstPackageArt } from './FirstPackageArt';

const STEPS = [HomeStrings.emptyStep1, HomeStrings.emptyStep2, HomeStrings.emptyStep3];

/**
 * The whole of Home on day one.
 *
 * What was here before described the product — "start managing customer
 * pickups and SMS notifications" — to someone who had already decided to use
 * it. This teaches the first action instead: three short steps in the order
 * they happen on the Add screen, then the one thing ParkDrop does that the
 * user cannot see from here.
 *
 * There is deliberately no button. The Add tile sits directly above this
 * card, and a second Add control would make the user choose between two
 * identical doors.
 */
export function FirstPackageCard({ className }: { className?: string }) {
  return (
    <section
      className={cn(
        'rounded-[var(--pd-card-radius)] border border-[var(--pd-line-2)] bg-white',
        'px-5 py-6',
        className
      )}
      aria-labelledby="pd-first-package-title"
    >
      <FirstPackageArt className="w-[132px] h-auto mx-auto mb-4" />

      <h2
        id="pd-first-package-title"
        className="m-0 mb-4 text-center text-[22px] font-extrabold tracking-[-0.02em] text-[var(--pd-navy)]"
      >
        {HomeStrings.emptyTitle}
      </h2>

      <ol className="m-0 p-0 list-none flex flex-col gap-3">
        {STEPS.map((step, index) => (
          <li key={step} className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className={cn(
                'flex-none grid place-items-center w-8 h-8 rounded-full',
                // Size before colour — tailwind-merge drops an earlier text-*.
                'bg-[var(--pd-tint)] text-[var(--pd-size-small)] font-extrabold leading-none tabular-nums text-[var(--pd-blue-dark)]'
              )}
            >
              {index + 1}
            </span>
            <span className="text-[var(--pd-size-body)] font-bold leading-[1.35] text-[var(--pd-navy)]">
              {step}
            </span>
          </li>
        ))}
      </ol>

      <p className="mt-5 mb-0 text-[var(--pd-size-meta)] font-semibold leading-[1.45] text-[var(--pd-muted)]">
        {HomeStrings.emptyOutcome}
      </p>
    </section>
  );
}
