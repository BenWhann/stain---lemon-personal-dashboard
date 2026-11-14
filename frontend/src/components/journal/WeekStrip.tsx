import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, ChevronRight, Clock, MapPin } from 'lucide-react';
import { addDays, formatLong, parseISODate, todayISO } from '../../lib/dates';
import type { CalendarEvent, Task } from '../../types';
import { cx } from '../ui/cx';

const CATEGORY_COLOR: Record<string, string> = {
  Academic: 'var(--cat-academic)',
  Work: 'var(--cat-work)',
  Wellness: 'var(--cat-wellness)',
  Bills: 'var(--cat-bills)',
  Personal: 'var(--cat-personal)',
};

const dot = (category: string): React.CSSProperties => ({
  background: CATEGORY_COLOR[category] ?? 'rgb(var(--ink-faint))',
});

interface WeekStripProps {
  events: CalendarEvent[];
  tasks: Task[];
  onOpenCalendar?: () => void;
  onOpenTask?: (t: Task) => void;
}

export const WeekStrip: React.FC<WeekStripProps> = ({ events, tasks, onOpenCalendar, onOpenTask }) => {
  const today = todayISO();
  const [selected, setSelected] = useState<string>(today);

  // Compute Monday of the current week
  const weekDays = useMemo(() => {
    const todayDate = parseISODate(today) ?? new Date();
    const offset = (todayDate.getDay() + 6) % 7; // Monday = 0
    const monday = addDays(today, -offset);
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  }, [today]);

  const eventsByDay = useMemo(() => {
    const m = new Map<string, CalendarEvent[]>();
    events.forEach((e) => m.set(e.date, [...(m.get(e.date) ?? []), e]));
    return m;
  }, [events]);

  const tasksByDay = useMemo(() => {
    const m = new Map<string, Task[]>();
    tasks
      .filter((t) => !t.completed && t.due_date)
      .forEach((t) => {
        const d = t.due_date!;
        m.set(d, [...(m.get(d) ?? []), t]);
      });
    return m;
  }, [tasks]);

  const selectedEvents = eventsByDay.get(selected) ?? [];
  const selectedTasks = tasksByDay.get(selected) ?? [];

  const selectedDateObj = parseISODate(selected);
  const dayName = selectedDateObj
    ? selected === today
      ? 'Today'
      : selectedDateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
    : selected;

  return (
    <div className="pane flex flex-col p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-honey" />
          <h2 className="heading text-lg">This Week</h2>
        </div>
        {onOpenCalendar && (
          <button
            type="button"
            onClick={onOpenCalendar}
            className="btn-ghost flex items-center gap-1 !p-1 text-xs text-ink-soft hover:text-honey"
            title="Open full monthly calendar"
          >
            Full calendar <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* 7-day strip */}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((iso) => {
          const d = parseISODate(iso);
          const dayNum = d?.getDate() ?? 1;
          const weekdayLetter = d ? d.toLocaleDateString(undefined, { weekday: 'narrow' }) : '';
          const isToday = iso === today;
          const isSel = iso === selected;
          const dayEvs = eventsByDay.get(iso) ?? [];
          const dayTs = tasksByDay.get(iso) ?? [];

          return (
            <button
              key={iso}
              type="button"
              onClick={() => setSelected(iso)}
              aria-pressed={isSel}
              aria-label={`${formatLong(iso)}: ${dayEvs.length} events, ${dayTs.length} tasks due`}
              className={cx(
                'group flex aspect-[0.9] flex-col items-center justify-between rounded-xl p-1.5 transition-all sm:aspect-square',
                isSel ? 'bg-honey/20 ring-1 ring-honey' : 'hover:bg-ink/[0.06]',
              )}
            >
              <span className="text-[10px] font-medium text-ink-faint uppercase">{weekdayLetter}</span>
              <span
                className={cx(
                  'tabular grid h-6 w-6 place-items-center rounded-full text-xs font-medium',
                  isToday ? 'bg-honey font-semibold text-night shadow-sm' : 'text-ink',
                )}
              >
                {dayNum}
              </span>
              <span className="flex h-1.5 items-center justify-center gap-0.5">
                {dayEvs.slice(0, 2).map((e) => (
                  <span key={e.id} className="h-1.5 w-1.5 rounded-full" style={dot(e.category)} />
                ))}
                {dayTs.length > 0 && <span className="h-1 w-2 rounded-full bg-ink/35" />}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected day agenda preview */}
      <div className="mt-3 border-t border-ink/10 pt-3">
        <div className="mb-2 flex items-baseline justify-between text-xs">
          <span className="font-semibold text-ink">{dayName}</span>
          <span className="text-ink-faint">
            {selectedEvents.length} {selectedEvents.length === 1 ? 'event' : 'events'} · {selectedTasks.length}{' '}
            {selectedTasks.length === 1 ? 'task' : 'tasks'} due
          </span>
        </div>

        <ul className="scroll-soft max-h-32 space-y-1.5 overflow-y-auto pr-1" data-lenis-prevent>
          <AnimatePresence initial={false}>
            {selectedEvents.map((e) => (
              <motion.li
                key={`ev-${e.id}`}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 rounded-lg bg-ink/[0.04] px-2.5 py-1.5 text-xs"
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={dot(e.category)} />
                <span className="truncate font-medium text-ink flex-1">{e.title}</span>
                <span className="flex items-center gap-1 text-[11px] text-ink-faint shrink-0">
                  <Clock className="h-3 w-3" /> {e.time}
                </span>
                {e.location && (
                  <span className="hidden sm:flex items-center gap-0.5 text-[11px] text-ink-faint shrink-0">
                    <MapPin className="h-3 w-3" /> {e.location}
                  </span>
                )}
              </motion.li>
            ))}

            {selectedTasks.map((t) => (
              <motion.li
                key={`task-${t.id}`}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => onOpenTask?.(t)}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-ink/15 px-2.5 py-1.5 text-xs hover:border-honey/50 hover:bg-honey/[0.04]"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-honey" />
                <span className="truncate text-ink-soft flex-1">Due: {t.title}</span>
                <span className="text-[10px] text-ink-faint uppercase">{t.priority}</span>
              </motion.li>
            ))}
          </AnimatePresence>

          {selectedEvents.length === 0 && selectedTasks.length === 0 && (
            <li className="py-3 text-center text-xs text-ink-faint">No events or deadlines for this day.</li>
          )}
        </ul>
      </div>
    </div>
  );
};
