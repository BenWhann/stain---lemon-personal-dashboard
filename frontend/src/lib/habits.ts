import { addDays } from './dates';

/** Consecutive checked days ending today, or ending yesterday while today is still open. Mirrors the API. */
export function currentStreak(checks: Iterable<string>, today: string): number {
  const done = new Set(checks);
  let cursor = done.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (done.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function toggleCheck(checks: string[], day: string, done: boolean): string[] {
  const set = new Set(checks);
  if (done) set.add(day);
  else set.delete(day);
  return [...set].sort();
}
