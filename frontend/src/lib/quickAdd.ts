// Natural-language quick add: "Read chapter 4 fri !high #school"
import { addDays, toISODate, todayISO, parseISODate } from './dates';
import type { TaskPriority } from '../types';

export interface QuickAddResult {
  title: string;
  due_date: string | null;
  priority: TaskPriority | null;
  category: string | null;
  /** the fragments we recognised, for showing as chips while typing */
  tokens: { kind: 'date' | 'priority' | 'category'; label: string }[];
}

const CATEGORY_TAGS: Record<string, string> = {
  school: 'Grad School', grad: 'Grad School', msw: 'Grad School', class: 'Grad School', study: 'Grad School',
  work: 'Work', practicum: 'Work', care: 'Work', uhhc: 'Work', shift: 'Work',
  bills: 'Bills', bill: 'Bills', money: 'Bills', pay: 'Bills',
  personal: 'Personal', home: 'Personal', cats: 'Personal', me: 'Personal', health: 'Personal',
};

const PRIORITY_TAGS: Record<string, TaskPriority> = {
  high: 'Zoomies', zoomies: 'Zoomies', urgent: 'Zoomies', '!': 'Zoomies',
  med: 'Purr-fect', medium: 'Purr-fect', normal: 'Purr-fect', purrfect: 'Purr-fect',
  low: 'Catnap', catnap: 'Catnap', someday: 'Catnap',
};

const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

function nextWeekday(today: string, target: number, forceNext: boolean): string {
  const d = parseISODate(today)!;
  let diff = (target - d.getDay() + 7) % 7;
  if (diff === 0 || forceNext) diff = diff === 0 ? 7 : diff + (forceNext && diff < 7 ? 7 : 0);
  return addDays(today, diff);
}

function monthDay(today: string, month: number, day: number): string | null {
  const t = parseISODate(today)!;
  let d = new Date(t.getFullYear(), month, day);
  if (d.getMonth() !== month) return null;
  if (d < t) d = new Date(t.getFullYear() + 1, month, day);
  return toISODate(d);
}

export function parseQuickAdd(input: string, today: string = todayISO()): QuickAddResult {
  const tokens: QuickAddResult['tokens'] = [];
  let due: string | null = null;
  let priority: TaskPriority | null = null;
  let category: string | null = null;
  let text = ` ${input} `;

  const take = (re: RegExp, fn: (m: RegExpMatchArray) => boolean) => {
    const m = text.match(re);
    if (m && fn(m)) text = text.replace(m[0], ' ');
  };

  // priority: !high, !low, !! / !!!
  take(/\s!(!{1,2}|[a-z]+)(?=\s)/i, (m) => {
    const key = m[1].toLowerCase().startsWith('!') ? '!' : m[1].toLowerCase();
    const p = PRIORITY_TAGS[key];
    if (!p) return false;
    priority = p;
    tokens.push({ kind: 'priority', label: p });
    return true;
  });

  // category: #school
  take(/\s#([a-z]+)(?=\s)/i, (m) => {
    const c = CATEGORY_TAGS[m[1].toLowerCase()];
    if (!c) return false;
    category = c;
    tokens.push({ kind: 'category', label: c });
    return true;
  });

  // dates (first match wins)
  const dateRules: [RegExp, (m: RegExpMatchArray) => string | null][] = [
    [/\s(today|tonight|eod)(?=\s)/i, () => today],
    [/\s(tomorrow|tmrw?|tmr)(?=\s)/i, () => addDays(today, 1)],
    [/\sin (\d{1,3}) ?(days?|d)(?=\s)/i, (m) => addDays(today, +m[1])],
    [/\sin (\d{1,2}) ?(weeks?|w)(?=\s)/i, (m) => addDays(today, +m[1] * 7)],
    [/\snext week(?=\s)/i, () => nextWeekday(today, 1, true)],
    [/\s(next )?(sunday|sun|monday|mon|tuesday|tues|tue|wednesday|wed|thursday|thurs|thur|thu|friday|fri|saturday|sat)(?=\s)/i, (m) =>
      nextWeekday(today, WEEKDAYS.indexOf(m[2].slice(0, 3).toLowerCase()), !!m[1])],
    [/\s(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sept|sep|october|oct|november|nov|december|dec) (\d{1,2})(?=\s)/i, (m) =>
      monthDay(today, MONTHS.indexOf(m[1].slice(0, 3).toLowerCase()), +m[2])],
    [/\s(\d{1,2})\/(\d{1,2})(?=\s)/, (m) => monthDay(today, +m[1] - 1, +m[2])],
    [/\s(\d{4}-\d{2}-\d{2})(?=\s)/, (m) => (parseISODate(m[1]) ? m[1] : null)],
  ];
  for (const [re, fn] of dateRules) {
    const m = text.match(re);
    if (!m) continue;
    const d = fn(m);
    if (d) {
      due = d;
      text = text.replace(m[0], ' ');
      tokens.push({ kind: 'date', label: d });
      break;
    }
  }

  const title = text.replace(/\s+/g, ' ').trim();
  return { title, due_date: due, priority, category, tokens };
}
