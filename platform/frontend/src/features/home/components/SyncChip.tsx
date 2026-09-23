import { Check, CloudOff, Loader2, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SyncSummary, SyncTone } from '../lib/syncSummary';
import { HomeStrings } from '../strings';

const TONE_CLASS: Record<SyncTone, string> = {
  // Always a solid plate rather than a translucent one. A white-on-blue chip
  // at reduced opacity fails contrast in daylight, which is exactly when this
  // screen is read.
  saved: 'bg-white text-[var(--pd-blue-dark)]',
  sending: 'bg-white text-[var(--pd-blue-dark)]',
  offline: 'bg-[var(--pd-warn-bg)] text-[var(--pd-warn)]',
  attention: 'bg-[var(--pd-bad-bg)] text-[var(--pd-bad)]',
};

function ToneIcon({ tone }: { tone: SyncTone }) {
  const props = { className: 'w-[18px] h-[18px] flex-none', strokeWidth: 2.75 } as const;

  if (tone === 'offline') return <CloudOff {...props} aria-hidden="true" />;
  if (tone === 'attention') return <TriangleAlert {...props} aria-hidden="true" />;
  if (tone === 'sending')
    return (
      <Loader2
        {...props}
        className={cn(props.className, 'motion-safe:animate-spin')}
        aria-hidden="true"
      />
    );
  return <Check {...props} aria-hidden="true" />;
}

export interface SyncChipProps {
  summary: SyncSummary;
  onOpen: () => void;
  className?: string;
}

/**
 * The status of the user's own work, at the top right of the header.
 *
 * It replaces "Saved on this device", which stated a fact without answering
 * the question behind it. Tapping opens a sheet that says, in one sentence,
 * that nothing is lost.
 */
export function SyncChip({ summary, onOpen, className }: SyncChipProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${summary.label}. ${HomeStrings.syncChipHint}`}
      className={cn(
        'inline-flex items-center gap-2 flex-none',
        'min-h-[var(--pd-tap-min)] px-3.5 rounded-[var(--pd-chip-radius)]',
        'text-[var(--pd-size-small)] font-bold leading-none',
        'transition-transform duration-[var(--pd-motion-fast)] active:scale-[0.97]',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60',
        TONE_CLASS[summary.tone],
        className
      )}
    >
      <ToneIcon tone={summary.tone} />
      <span>{summary.label}</span>
    </button>
  );
}
