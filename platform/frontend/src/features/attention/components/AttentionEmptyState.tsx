import { CheckCircle2 } from 'lucide-react';
import { AttentionStrings } from '@/features/attention/strings';

/**
 * Empty is the normal state of this screen, and it should feel like one —
 * not like a list that failed to load (design plan 02 §3.3.27).
 */
export function AttentionEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-[var(--pd-ok-bg)] border border-[var(--pd-ok)]/25 flex items-center justify-center text-[var(--pd-ok)] mb-5">
        <CheckCircle2 className="w-8 h-8" aria-hidden="true" strokeWidth={2.25} />
      </div>
      <h3 className="text-[22px] font-extrabold text-[var(--pd-navy)] m-0">
        {AttentionStrings.emptyTitle}
      </h3>
      <p className="text-[18px] font-semibold text-[var(--pd-muted)] mt-2 max-w-xs leading-snug m-0">
        {AttentionStrings.emptyBody}
      </p>
    </div>
  );
}
