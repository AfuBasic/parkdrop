import * as React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { cn } from '@/lib/utils';

/**
 * A row in the settings area, in the redesign's visual language.
 *
 * Sizes come from design plan 02 §3.3.26: a 64px row, a 28px icon, an 18px
 * label, a 16px subtitle and a right chevron. Nothing here goes below the
 * 15px floor of §5.3.
 */

export interface SettingsGroupProps {
  /** 18px sentence-case heading. Never uppercase, never Title Case. */
  label: string;
  children: React.ReactNode;
  className?: string;
}

export function SettingsGroup({ label, children, className }: SettingsGroupProps) {
  return (
    <section className={cn('flex flex-col gap-3', className)}>
      <h2 className="text-[18px] font-extrabold text-[var(--pd-navy)] m-0 px-1 leading-tight">
        {label}
      </h2>
      <div className="bg-white rounded-[var(--pd-card-radius)] border border-[var(--pd-line-2)] shadow-xs overflow-hidden divide-y divide-[var(--pd-line-2)]">
        {children}
      </div>
    </section>
  );
}

export type SettingsRowTone = 'default' | 'warning' | 'danger';

export interface SettingsRowProps {
  /** Router path this row opens. */
  to: string;
  icon: React.ReactNode;
  /** 18px. Sentence case. */
  label: string;
  /** 16px. Says what the person will find there, in plain words. */
  subtitle: string;
  /** Optional trailing pill — a count or a balance. Always carries a word. */
  badge?: string;
  badgeTone?: SettingsRowTone;
  /** Screen-reader wording for the badge, when the pill alone is terse. */
  badgeLabel?: string;
  /** Shown as a 16px line under the subtitle when the row needs a connection. */
  needsInternet?: boolean;
  needsInternetLabel?: string;
}

const BADGE_TONE: Record<SettingsRowTone, string> = {
  default:
    'bg-[var(--pd-page-2)] text-[var(--pd-muted)] border-[var(--pd-line-2)]',
  warning:
    'bg-[var(--pd-warn-bg)] text-[var(--pd-warn)] border-[var(--pd-warn)]/25',
  danger: 'bg-[var(--pd-bad-bg)] text-[var(--pd-bad)] border-[var(--pd-bad)]/25',
};

const ICON_TONE: Record<SettingsRowTone, string> = {
  default: 'bg-[var(--pd-tint)] text-[var(--pd-blue)]',
  warning: 'bg-[var(--pd-warn-bg)] text-[var(--pd-warn)]',
  danger: 'bg-[var(--pd-bad-bg)] text-[var(--pd-bad)]',
};

export function SettingsRow({
  to,
  icon,
  label,
  subtitle,
  badge,
  badgeTone = 'default',
  badgeLabel,
  needsInternet = false,
  needsInternetLabel,
}: SettingsRowProps) {
  return (
    <Link
      to={to}
      className="w-full min-h-[64px] px-4 py-3 flex items-center gap-3 text-left hover:bg-[var(--pd-page-2)] active:bg-[var(--pd-tint)] transition-colors cursor-pointer"
    >
      <span
        aria-hidden="true"
        className={cn(
          'w-11 h-11 rounded-[var(--pd-chip-radius)] flex items-center justify-center shrink-0',
          ICON_TONE[badge ? badgeTone : 'default']
        )}
      >
        {icon}
      </span>

      <span className="flex-1 min-w-0 flex flex-col gap-0.5">
        <span className="text-[18px] font-extrabold text-[var(--pd-navy)] leading-tight">
          {label}
        </span>
        <span className="text-[16px] font-semibold text-[var(--pd-muted)] leading-snug">
          {subtitle}
        </span>
        {needsInternet && needsInternetLabel && (
          <span className="text-[16px] font-semibold text-[var(--pd-warn)] leading-snug">
            {needsInternetLabel}
          </span>
        )}
      </span>

      {badge && (
        <span
          className={cn(
            'shrink-0 text-[15px] font-extrabold px-2.5 py-1 rounded-full border pd-nums',
            BADGE_TONE[badgeTone]
          )}
          aria-label={badgeLabel}
        >
          {badge}
        </span>
      )}

      <ChevronRight
        aria-hidden="true"
        className="w-6 h-6 text-[var(--pd-line)] shrink-0"
        strokeWidth={2.25}
      />
    </Link>
  );
}
