import { HomeStrings } from '../strings';
import { formatTime } from '@/lib/formatters';

/**
 * How long a package has been sitting, in the only terms that matter to an
 * attendant: is it fine, is it getting old, or is it a problem.
 *
 * Age is counted in whole calendar days, not in 24-hour blocks. A package
 * dropped at 11pm last night is "Yesterday" at 8am, not "Today" — because
 * that is what the person holding it would say.
 */
export type AgeTone = 'normal' | 'warn' | 'bad';

export interface PackageAge {
  /** Whole calendar days since it arrived. 0 is today. */
  days: number;
  label: string;
  tone: AgeTone;
}

/** Warn from here, in days. Three days is when a customer stops coming back. */
export const AGE_WARN_DAYS = 3;
/** And a week is when someone has to act. */
export const AGE_BAD_DAYS = 7;

function startOfLocalDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function daysWaiting(isoCreatedAt: string, now: Date = new Date()): number {
  const created = new Date(isoCreatedAt);
  if (Number.isNaN(created.getTime())) return 0;

  const MS_PER_DAY = 86_400_000;
  const diff = startOfLocalDay(now) - startOfLocalDay(created);

  // A clock that has drifted backwards must not produce "-2 days".
  return Math.max(0, Math.round(diff / MS_PER_DAY));
}

export function describeAge(isoCreatedAt: string, now: Date = new Date()): PackageAge {
  const days = daysWaiting(isoCreatedAt, now);
  const time = formatTime(isoCreatedAt);

  if (days === 0) return { days, label: `${HomeStrings.ageToday} · ${time}`, tone: 'normal' };
  if (days === 1) return { days, label: `${HomeStrings.ageYesterday} · ${time}`, tone: 'normal' };

  const tone: AgeTone =
    days >= AGE_BAD_DAYS ? 'bad' : days >= AGE_WARN_DAYS ? 'warn' : 'normal';

  return { days, label: `${HomeStrings.ageDays(days)} · ${time}`, tone };
}
