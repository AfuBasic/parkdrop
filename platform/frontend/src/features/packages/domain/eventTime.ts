/**
 * Turns a real event timestamp into the day label and clock time shown on
 * the package detail banners (Collected / Returned / Cancelled).
 *
 * "Today" and "Yesterday" are judged in local calendar days, matching the
 * age labels used everywhere else in the app (see features/home/lib/packageAge.ts),
 * so the same package would never say "Today" on one screen and a date on
 * another.
 */

function startOfLocalDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** "Today", "Yesterday", or a short date like "12 Sep". */
export function formatEventDay(iso: string, now: Date = new Date()): string {
  const event = new Date(iso);
  if (Number.isNaN(event.getTime())) return '';

  const MS_PER_DAY = 86_400_000;
  const days = Math.round((startOfLocalDay(now) - startOfLocalDay(event)) / MS_PER_DAY);

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return event.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

/** "8:10 PM", in the device's local time. */
export function formatEventTime(iso: string): string {
  const event = new Date(iso);
  if (Number.isNaN(event.getTime())) return '';
  return event.toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' });
}
