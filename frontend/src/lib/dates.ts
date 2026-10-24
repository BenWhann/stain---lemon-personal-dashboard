// Calendar helpers that work in the user's local time zone (never UTC dates).

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayISO(now: Date = new Date()): string {
  return toISODate(now);
}

export function parseISODate(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso) ?? new Date();
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function daysBetween(fromISO: string, toISO: string): number {
  const a = parseISODate(fromISO);
  const b = parseISODate(toISO);
  if (!a || !b) return 0;
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export type Urgency = 'overdue' | 'today' | 'soon' | 'later' | 'none';

export function dueLabel(due: string | null | undefined, today = todayISO()): { text: string; urgency: Urgency } {
  if (!due) return { text: 'No date', urgency: 'none' };
  const diff = daysBetween(today, due);
  if (diff < 0) return { text: diff === -1 ? 'Yesterday' : `${-diff} days late`, urgency: 'overdue' };
  if (diff === 0) return { text: 'Today', urgency: 'today' };
  if (diff === 1) return { text: 'Tomorrow', urgency: 'soon' };
  if (diff < 7) {
    const d = parseISODate(due)!;
    return { text: d.toLocaleDateString(undefined, { weekday: 'long' }), urgency: diff <= 3 ? 'soon' : 'later' };
  }
  const d = parseISODate(due)!;
  return { text: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), urgency: 'later' };
}

export function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h >= 5 && h < 12) return 'Good morning';
  if (h >= 12 && h < 17) return 'Good afternoon';
  if (h >= 17 && h < 22) return 'Good evening';
  return 'Up late';
}

export function lastNDays(n: number, today = todayISO()): string[] {
  return Array.from({ length: n }, (_, i) => addDays(today, i - (n - 1)));
}

export function weekdayShort(iso: string): string {
  const d = parseISODate(iso);
  return d ? d.toLocaleDateString(undefined, { weekday: 'narrow' }) : '';
}

export function formatLong(iso: string): string {
  const d = parseISODate(iso);
  return d ? d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : iso;
}

export function formatShort(iso: string): string {
  const d = parseISODate(iso);
  return d ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : iso;
}

/** Convert a UTC timestamp from the API ("2026-10-24T18:00:00") to a local calendar date. */
export function utcStampToLocalISO(stamp: string | null | undefined): string | null {
  if (!stamp) return null;
  const withZone = /[zZ]|[+-]\d{2}:?\d{2}$/.test(stamp) ? stamp : `${stamp}Z`;
  const d = new Date(withZone);
  return Number.isNaN(d.getTime()) ? null : toISODate(d);
}
