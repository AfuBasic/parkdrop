import type { LocalPackage } from '@/offline/db/schema';
import { daysWaiting } from '@/features/home/lib/packageAge';

/**
 * The fallback used only until the business record has actually loaded
 * (e.g. the very first paint, fully offline, before session sync). It
 * matches the backend's own column default, so a package never shows a
 * different total the moment the real business loads in.
 */
export const DEFAULT_DAILY_STORAGE_FEE_MINOR = 50_000; // NGN 500

/**
 * The day a package's storage fee stops accruing.
 *
 * Once a package leaves WAITING — collected, returned or cancelled — it is
 * no longer sitting in the store, so charging more days after that point
 * would be charging for time nobody held it. Freezing at that timestamp
 * also means a receipt never shows a different total than what the
 * customer was actually charged at handover.
 */
function feeEndDate(pkg: LocalPackage, now: Date): Date {
  const terminalAt = pkg.collected_at || pkg.returned_at || pkg.cancelled_at;
  return terminalAt ? new Date(terminalAt) : now;
}

/**
 * How many days beyond the first count toward the daily fee.
 *
 * Counted in whole calendar days — nights the package has sat through, the
 * same measure already shown as "Today" / "Yesterday" / "N days" elsewhere
 * in the app, not a rolling 24-hour count. A package dropped at 1pm and
 * collected 2pm the next day has sat through one night, so it is still
 * "day 1" and covered by the initial fee. Collected 8am the day after that,
 * it has sat through two nights, so one extra day is due — even though
 * under 48 actual hours have passed.
 *
 * The first day is free: it is what the initial fee already covers.
 */
export function extraStorageDays(pkg: LocalPackage, now: Date = new Date()): number {
  const nights = daysWaiting(pkg.client_created_at, feeEndDate(pkg, now));
  return Math.max(0, nights - 1);
}

/**
 * The initial fee plus one daily charge for every extra day the package has
 * sat, in kobo. Never negative, never fractional.
 */
export function accruedAmountDueMinor(
  pkg: LocalPackage,
  dailyStorageFeeMinor: number,
  now: Date = new Date()
): number {
  const baseMinor = Math.max(0, Math.floor(pkg.amount_due_minor || 0));
  const safeRate = Math.max(0, Math.floor(dailyStorageFeeMinor || 0));
  const extraDays = extraStorageDays(pkg, now);
  return baseMinor + extraDays * safeRate;
}

export interface FeeBreakdown {
  basePriceMinor: number;
  demurrageMinor: number;
  totalDueMinor: number;
  extraDays: number;
  dailyRateMinor: number;
}

/**
 * Breakdown of initial base drop fee vs demurrage (daily storage fee).
 */
export function calculateFeeBreakdown(
  pkg: LocalPackage,
  dailyStorageFeeMinor: number,
  now: Date = new Date()
): FeeBreakdown {
  const safeRate = Math.max(0, Math.floor(dailyStorageFeeMinor || 0));
  const extraDays = extraStorageDays(pkg, now);
  const currentAccruedDemurrageMinor = extraDays * safeRate;

  if (pkg.status === 'COLLECTED') {
    const totalMinor = Math.max(0, Math.floor(pkg.amount_due_minor || 0));
    const demurrageMinor = Math.min(totalMinor, currentAccruedDemurrageMinor);
    const basePriceMinor = Math.max(0, totalMinor - demurrageMinor);
    return {
      basePriceMinor,
      demurrageMinor,
      totalDueMinor: totalMinor,
      extraDays,
      dailyRateMinor: safeRate,
    };
  }

  const basePriceMinor = Math.max(0, Math.floor(pkg.amount_due_minor || 0));
  const demurrageMinor = currentAccruedDemurrageMinor;
  const totalDueMinor = basePriceMinor + demurrageMinor;

  return {
    basePriceMinor,
    demurrageMinor,
    totalDueMinor,
    extraDays,
    dailyRateMinor: safeRate,
  };
}
