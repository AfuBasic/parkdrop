import * as React from 'react';
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

export type NoticeTone = 'info' | 'success' | 'warning' | 'error';

export interface NoticeProps {
  tone?: NoticeTone;
  children: React.ReactNode;
  /** Announce immediately. Used for validation and network errors. */
  live?: boolean;
  /** Shake once, to draw the eye back to the field that needs fixing. */
  shake?: boolean;
  /** Plain row with no filled background, for inline field errors. */
  plain?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

const TONES: Record<
  NoticeTone,
  { icon: React.ReactNode; text: string; bg: string; border: string }
> = {
  info: {
    icon: <Info className="w-[19px] h-[19px]" strokeWidth={2.5} />,
    text: 'text-[var(--pd-blue-hover)]',
    bg: 'bg-[var(--pd-tint)]',
    border: 'border-[var(--pd-tint-2)]',
  },
  success: {
    icon: <CheckCircle2 className="w-[19px] h-[19px]" strokeWidth={2.5} />,
    text: 'text-[var(--pd-ok)]',
    bg: 'bg-[var(--pd-ok-bg)]',
    border: 'border-[#BBF7D0]',
  },
  warning: {
    icon: <TriangleAlert className="w-[19px] h-[19px]" strokeWidth={2.5} />,
    text: 'text-[var(--pd-warn)]',
    bg: 'bg-[var(--pd-warn-bg)]',
    border: 'border-[#FDE68A]',
  },
  error: {
    icon: <AlertCircle className="w-[19px] h-[19px]" strokeWidth={2.5} />,
    text: 'text-[var(--pd-bad)]',
    bg: 'bg-[var(--pd-bad-bg)]',
    border: 'border-[#FECACA]',
  },
};

/**
 * A status line that always pairs an icon with words.
 *
 * Status is never carried by colour alone here: someone who cannot separate
 * red from green, or who is reading a washed-out screen in daylight, still
 * gets the icon and the sentence. Error notices announce themselves so a
 * TalkBack user hears what went wrong without hunting for it.
 */
export function Notice({
  tone = 'info',
  children,
  live,
  shake,
  plain,
  icon,
  className,
}: NoticeProps) {
  const spec = TONES[tone];
  const announce = live ?? tone === 'error';

  return (
    <p
      role={announce ? 'alert' : undefined}
      className={cn(
        'flex items-start gap-2.5 m-0',
        'text-[var(--pd-size-helper)] leading-[1.4] font-semibold',
        spec.text,
        !plain && ['rounded-[14px] border p-3.5', spec.bg, spec.border],
        shake && 'pd-shake',
        className
      )}
    >
      <span className="flex-none mt-[1px]" aria-hidden="true">
        {icon ?? spec.icon}
      </span>
      <span className="min-w-0">{children}</span>
    </p>
  );
}
