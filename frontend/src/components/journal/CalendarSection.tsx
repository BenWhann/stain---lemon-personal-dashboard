import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock, MapPin, Plus, Trash2 } from 'lucide-react';
import { formatLong, toISODate, todayISO } from '../../lib/dates';
import { useEvents } from '../../store/events';
import { useTasks } from '../../store/tasks';
import { EVENT_CATEGORIES, type CalendarEvent, type EventCategory } from '../../types';
import { Modal } from '../ui/Modal';
import { cx } from '../ui/cx';

// Fixed categorical order (validated for colour-vision deficiency in both themes)
const CATEGORY_COLOR: Record<string, string> = {
  Academic: 'var(--cat-academic)',
  Work: 'var(--cat-work)',
  Wellness: 'var(--cat-wellness)',
  Bills: 'var(--cat-bills)',
  Personal: 'var(--cat-personal)',
};
const dot = (category: string): React.CSSProperties => ({ background: CATEGORY_COLOR[category] ?? 'rgb(var(--ink-faint))' });

export const CalendarSection: React.FC = () => {
  const events = useEvents((s) => s.events);
  const remove = useEvents((s) => s.remove);
  const tasks = useTasks((s) => s.tasks);
  const today = todayISO();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState(today);
  const [direction, setDirection] = useState(0);
  const [adding, setAdding] = useState(false);

  const cells = useMemo(() => {
    const first = new Date(cursor);
    const offset = (first.getDay() + 6) % 7; // weeks start on Monday
    const start = new Date(first);
    start.setDate(first.getDate() - offset);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return { iso: toISODate(d), day: d.getDate(), inMonth: d.getMonth() === cursor.getMonth() };
    });
  }, [cursor]);

  const eventsByDay = useMemo(() => {
    const m = new Map<string, CalendarEvent[]>();
    events.forEach((e) => m.set(e.date, [...(m.get(e.date) ?? []), e]));
    return m;
  }, [events]);
  const dueByDay = useMemo(() => {
    const m = new Map<string, number>();
    tasks.filter((t) => !t.completed && t.due_date).forEach((t) => m.set(t.due_date!, (m.get(t.due_date!) ?? 0) + 1));
    return m;
  }, [tasks]);

  const move = (delta: number) => {
    setDirection(delta);
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  };

  const dayEvents = eventsByDay.get(selected) ?? [];
  const dayTasks = tasks.filter((t) => t.due_date === selected);
  const monthLabel = cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
      <div className="pane p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <AnimatePresence mode="wait" initial={false}>
            <motion.h3
              key={monthLabel}
              initial={{ opacity: 0, x: direction * 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -20 }}
              className="heading text-2xl"
            >
              {monthLabel}
            </motion.h3>
          </AnimatePresence>
          <div className="flex items-center gap-1">
            <button type="button" className="btn-ghost h-9 w-9 !p-0" aria-label="Previous month" onClick={() => move(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="btn-ghost h-9 !px-3 text-xs"
              onClick={() => {
                const d = new Date();
                setDirection(0);
                setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
                setSelected(today);
              }}
            >
              Today
            </button>
            <button type="button" className="btn-ghost h-9 w-9 !p-0" aria-label="Next month" onClick={() => move(1)}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 pb-2 text-center text-[11px] text-ink-faint">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={cursor.toISOString()}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-7 gap-1"
          >
            {cells.map((c) => {
              const evs = eventsByDay.get(c.iso) ?? [];
              const due = dueByDay.get(c.iso) ?? 0;
              const isSel = c.iso === selected;
              const isToday = c.iso === today;
              return (
                <button
                  key={c.iso}
                  type="button"
                  onClick={() => setSelected(c.iso)}
                  aria-pressed={isSel}
                  aria-label={`${formatLong(c.iso)}: ${evs.length} events, ${due} tasks due`}
                  className={cx(
                    'relative flex aspect-[1.15] flex-col items-start rounded-xl p-1.5 text-left transition-all duration-200 sm:p-2',
                    c.inMonth ? 'text-ink' : 'text-ink-faint/50',
                    isSel ? 'bg-honey/20 ring-1 ring-honey' : 'hover:bg-ink/[0.06]',
                  )}
                >
                  <span
                    className={cx(
                      'tabular grid h-6 w-6 place-items-center rounded-full text-xs',
                      isToday && 'bg-honey font-semibold text-night',
                    )}
                  >
                    {c.day}
                  </span>
                  <span className="mt-auto flex flex-wrap gap-0.5">
                    {evs.slice(0, 4).map((e) => (
                      <span key={e.id} className="h-2 w-2 rounded-full ring-2 ring-surface" style={dot(e.category)} />
                    ))}
                    {due > 0 && <span className="h-1.5 w-3 rounded-full bg-ink/30" title={`${due} tasks due`} />}
                  </span>
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>
        <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-ink-faint">
          {EVENT_CATEGORIES.map((c) => (
            <span key={c} className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={dot(c)} /> {c}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-3 rounded-full bg-ink/30" /> Tasks due
          </span>
        </div>
      </div>

      <div className="pane flex flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="heading text-2xl">{selected === today ? 'Today' : formatLong(selected).split(',')[0]}</h3>
            <p className="text-sm text-ink-soft">{formatLong(selected)}</p>
          </div>
          <button type="button" className="btn-honey h-9 !px-3 text-xs" onClick={() => setAdding(true)}>
            <Plus className="h-3.5 w-3.5" /> Event
          </button>
        </div>
        <ul className="scroll-soft mt-4 max-h-[22rem] flex-1 space-y-2 overflow-y-auto" data-lenis-prevent>
          <AnimatePresence initial={false}>
            {dayEvents.map((e) => (
              <motion.li
                key={e.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="group flex gap-3 rounded-2xl bg-ink/[0.05] p-3"
              >
                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={dot(e.category)} />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] text-ink">{e.title}</p>
                  <p className="text-xs text-ink-faint">{e.category}</p>
                  <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-ink-faint">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {e.time}
                    </span>
                    {e.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {e.location}
                      </span>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Remove "${e.title}"`}
                  className="self-start text-ink-faint opacity-0 hover:text-ember group-hover:opacity-100 focus-visible:opacity-100"
                  onClick={() => void remove(e.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
          {dayTasks.map((t) => (
            <li key={`t${t.id}`} className="flex items-center gap-3 rounded-2xl border border-dashed border-ink/15 px-3 py-2.5 text-sm">
              <span className={cx('h-2 w-2 rounded-full', t.completed ? 'bg-sage' : 'bg-ink/30')} />
              <span className={t.completed ? 'text-ink-faint line-through' : 'text-ink-soft'}>Due: {t.title}</span>
            </li>
          ))}
          {dayEvents.length === 0 && dayTasks.length === 0 && (
            <li className="py-10 text-center text-sm text-ink-faint">A free day. Stain recommends a long nap.</li>
          )}
        </ul>
      </div>
      <EventForm open={adding} onClose={() => setAdding(false)} date={selected} />
    </div>
  );
};

const EventForm: React.FC<{ open: boolean; onClose: () => void; date: string }> = ({ open, onClose, date }) => {
  const add = useEvents((s) => s.add);
  const [title, setTitle] = useState('');
  const [day, setDay] = useState(date);
  const [time, setTime] = useState('');
  const [category, setCategory] = useState<EventCategory>('Academic');
  const [location, setLocation] = useState('');
  React.useEffect(() => {
    if (open) setDay(date);
  }, [open, date]);

  return (
    <Modal open={open} onClose={onClose} title="New event" width="md">
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim() || !day) return;
          void add({ title: title.trim(), date: day, time: time.trim() || 'All day', category, location: location.trim() });
          setTitle('');
          setTime('');
          setLocation('');
          onClose();
        }}
      >
        <input autoFocus className="field" placeholder="Supervision with Micalah" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={255} />
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="label">Date</span>
            <input type="date" className="field" value={day} onChange={(e) => setDay(e.target.value)} required />
          </label>
          <label className="space-y-1">
            <span className="label">Time</span>
            <input className="field" placeholder="2:00 PM – 3:00 PM" value={time} onChange={(e) => setTime(e.target.value)} maxLength={100} />
          </label>
          <label className="space-y-1">
            <span className="label">Kind</span>
            <select className="field" value={category} onChange={(e) => setCategory(e.target.value as EventCategory)}>
              {EVENT_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="label">Where</span>
            <input className="field" placeholder="Hagfors 151, Zoom…" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={255} />
          </label>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-honey" disabled={!title.trim()}>
            Add event
          </button>
        </div>
      </form>
    </Modal>
  );
};
