import type { LocalPackage } from '@/offline/db/schema';
import { PackagesStrings } from '../strings';

export interface PackagePickupCodeCardProps {
  pkg: LocalPackage;
}

/**
 * Pickup code card:
 * - Label "Customer's pickup code"
 * - Code very large (36px, tabular monospace, grouped for reading e.g. C7XY XK8)
 * - Caption "Ask the customer to show this code."
 * - Copy button removed.
 */
export function PackagePickupCodeCard({ pkg }: PackagePickupCodeCardProps) {
  // Format 7-character code into grouped readable format: "C7XY XK8"
  const rawCode = pkg.pickup_code ? pkg.pickup_code.trim().toUpperCase() : '';
  const formattedCode =
    rawCode.length === 7 ? `${rawCode.slice(0, 4)} ${rawCode.slice(4)}` : rawCode;

  return (
    <div className="bg-white rounded-[var(--pd-card-radius)] border border-[var(--pd-line-2)] p-5 shadow-xs flex flex-col items-center text-center gap-2">
      <span className="text-[15px] font-extrabold text-[var(--pd-muted)] tracking-wide">
        {PackagesStrings.pickupCodeTitle}
      </span>

      {/* 36px monospace grouped code */}
      <div className="my-1.5 px-4 py-2 rounded-xl bg-[var(--pd-page)] border border-[var(--pd-line)]">
        <span className="text-[34px] sm:text-[38px] font-extrabold font-mono text-[var(--pd-navy)] tracking-widest tabular-nums select-all">
          {formattedCode}
        </span>
      </div>

      <p className="text-[15px] font-bold text-[var(--pd-muted)] m-0">
        {PackagesStrings.pickupCodeCaption}
      </p>
    </div>
  );
}
