import * as React from 'react';
import { cn } from '@/lib/utils';
import { AuthStrings } from '../strings';

export interface SmsPreviewProps {
  /** The rendered message, produced by lib/smsTemplate. */
  message: string;
  /** Substrings to highlight — the names the owner just typed. */
  highlight: string[];
  overBudget?: boolean;
  className?: string;
}

/**
 * The real arrival SMS, shown as a message bubble.
 *
 * The owner is being asked to name their business for an audience they cannot
 * see, so the only honest way to ask is to show them the exact sentence their
 * customers will receive. The message text comes from the shared template in
 * lib/smsTemplate.ts, which mirrors the backend sender — it is never retyped
 * here, because a preview that drifts from the real message is worse than no
 * preview at all.
 */
export function SmsPreview({ message, highlight, overBudget, className }: SmsPreviewProps) {
  const parts = React.useMemo(() => splitOnHighlights(message, highlight), [message, highlight]);

  return (
    <div className={cn('w-full', className)}>
      <p className="m-0 mb-2 text-[var(--pd-size-min)] font-bold text-[var(--pd-muted)]">
        {AuthStrings.smsPreviewTitle}
      </p>

      <div
        className={cn(
          'relative rounded-[18px] rounded-bl-[6px] p-3.5',
          'border-2',
          overBudget
            ? 'bg-[var(--pd-warn-bg)] border-[#FDE68A]'
            : 'bg-[var(--pd-tint)] border-[var(--pd-tint-2)]'
        )}
      >
        <p className="m-0 text-[var(--pd-size-helper)] font-semibold leading-[1.5] text-[var(--pd-navy)]">
          {parts.map((part, index) =>
            part.highlighted ? (
              <mark
                key={index}
                // No horizontal padding: it would push the following comma or
                // full stop away from the name and make the sentence read as
                // though it were punctuated wrongly.
                className="bg-[var(--pd-tint-2)] text-[var(--pd-blue-dark)] font-extrabold rounded-[4px] py-[2px]"
              >
                {part.text}
              </mark>
            ) : (
              <React.Fragment key={index}>{part.text}</React.Fragment>
            )
          )}
        </p>
      </div>
    </div>
  );
}

interface Part {
  text: string;
  highlighted: boolean;
}

/**
 * Split `message` so each occurrence of a highlight term becomes its own part.
 * Longest terms first, so a park name contained inside the pickup point name
 * does not get highlighted twice.
 */
function splitOnHighlights(message: string, terms: string[]): Part[] {
  const cleaned = terms
    .map((term) => term.trim())
    .filter((term) => term.length > 0)
    .sort((a, b) => b.length - a.length);

  if (cleaned.length === 0) return [{ text: message, highlighted: false }];

  let parts: Part[] = [{ text: message, highlighted: false }];

  for (const term of cleaned) {
    const next: Part[] = [];

    for (const part of parts) {
      if (part.highlighted) {
        next.push(part);
        continue;
      }

      let rest = part.text;
      let index = rest.indexOf(term);

      while (index !== -1) {
        if (index > 0) next.push({ text: rest.slice(0, index), highlighted: false });
        next.push({ text: term, highlighted: true });
        rest = rest.slice(index + term.length);
        index = rest.indexOf(term);
      }

      if (rest) next.push({ text: rest, highlighted: false });
    }

    parts = next;
  }

  return parts;
}
