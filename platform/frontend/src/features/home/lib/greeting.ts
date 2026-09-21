import { HomeStrings } from '../strings';

/**
 * Morning before 12, afternoon 12 to 17, evening from 17.
 *
 * Read from the phone's own clock rather than the server: an attendant in a
 * park has no interest in UTC, and the greeting is the one place on the
 * screen where being wrong is merely odd rather than dangerous.
 */
export function greetingForHour(hour: number): string {
  if (hour < 12) return HomeStrings.greetingMorning;
  if (hour < 17) return HomeStrings.greetingAfternoon;
  return HomeStrings.greetingEvening;
}

export function currentGreeting(now: Date = new Date()): string {
  return greetingForHour(now.getHours());
}
