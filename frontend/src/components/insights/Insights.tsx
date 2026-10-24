import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { addDays, formatLong, lastNDays, parseISODate, todayISO, utcStampToLocalISO } from '../../lib/dates';
import { useHabits } from '../../store/habits';
import { useTasks } from '../../store/tasks';
import { useTimer } from '../../store/timer';
import { CATEGORIES } from '../../types';
import { useXp } from '../journal/useXp';
import { BarList, ColumnChart, type Datum } from './charts';

const short = (iso: string) => parseISODate(iso)!.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

export const Insights: React.FC = () => {
  const tasks = useTasks((s) => s.tasks);
  const habits = useHabits((s) => s.habits);
  const sessions = useTimer((s) => s.sessions);
  const { level, title, xp } = useXp();
  const today = todayISO();
  const days = useMemo(() => lastNDays(14, today), [today]);

  const finished: Datum[] = useMemo(() => {
    const counts = new Map<string, number>();
    tasks.forEach((t) => {
      const d = utcStampToLocalISO(t.completed_at);
      if (t.completed && d) counts.set(d, (counts.get(d) ?? 0) + 1);
    });
    return days.map((d) => ({ key: d, label: short(d), value: counts.get(d) ?? 0, detail: formatLong(d) }));
  }, [tasks, days]);

  const focus: Datum[] = useMemo(() => {
    const mins = new Map<string, number>();
    sessions.forEach((s) => mins.set(s.date, (mins.get(s.date) ?? 0) + s.minutes));
    return days.map((d) => ({ key: d, label: short(d), value: mins.get(d) ?? 0, detail: formatLong(d) }));
  }, [sessions, days]);

  const openByArea = useMemo(
    () =>
      [...CATEGORIES, ...new Set(tasks.map((t) => t.category).filter((c) => !CATEGORIES.includes(c as never)))]
        .map((c) => ({ label: c, value: tasks.filter((t) => !t.completed && t.category === c).length }))
        .filter((d) => d.value > 0)
        .sort((a, b) => b.value - a.value),
    [tasks],
  );

  const totalFinished = finished.reduce((n, d) => n + d.value, 0);
  const totalFocus = focus.reduce((n, d) => n + d.value, 0);
  const bestStreak = habits.reduce((m, h) => Math.max(m, h.streak), 0);
  const overdue = tasks.filter((t) => !t.completed && t.due_date && t.due_date < today).length;

  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-24 pt-28 sm:px-8">
      <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="heading text-5xl">Insights</h1>
        <p className="mt-2 text-ink-soft">The last two weeks, in numbers. Level {level}, {title}, with {xp} xp.</p>
      </motion.header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Tasks finished', value: totalFinished, sub: 'last 14 days' },
          { label: 'Focus time', value: totalFocus >= 60 ? `${(totalFocus / 60).toFixed(1)} h` : `${totalFocus} min`, sub: `${sessions.filter((s) => s.date >= days[0]).length} sprints` },
          { label: 'Best running streak', value: `${bestStreak} days`, sub: habits.find((h) => h.streak === bestStreak && bestStreak > 0)?.name ?? 'Check off a habit to start one' },
          { label: 'Overdue now', value: overdue, sub: overdue ? 'Worth a look on the board' : 'All caught up' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            className="pane p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * i, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-sm text-ink-soft">{s.label}</p>
            <p className="tabular mt-1 text-3xl font-semibold text-ink">{s.value}</p>
            <p className="mt-1 truncate text-xs text-ink-faint">{s.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="pane p-5 sm:p-6">
          <h2 className="heading text-2xl">Tasks finished per day</h2>
          <p className="mb-4 text-sm text-ink-faint">Hover a day for details.</p>
          <ColumnChart data={finished} unit="tasks" title="Tasks finished per day, last 14 days" />
        </section>
        <section className="pane p-5 sm:p-6">
          <h2 className="heading text-2xl">Minutes of focus per day</h2>
          <p className="mb-4 text-sm text-ink-faint">From finished focus sprints.</p>
          <ColumnChart data={focus} unit="min" title="Focus minutes per day, last 14 days" />
        </section>
        <section className="pane p-5 sm:p-6">
          <h2 className="heading text-2xl">Habit consistency</h2>
          <p className="mb-4 text-sm text-ink-faint">Twelve weeks. Darker means more habits done that day.</p>
          <HabitHeatmap />
        </section>
        <section className="pane p-5 sm:p-6">
          <h2 className="heading text-2xl">Open tasks by area</h2>
          <p className="mb-4 text-sm text-ink-faint">Where your to-do list lives right now.</p>
          {openByArea.length ? <BarList data={openByArea} unit="open" title="Open tasks by area" /> : <p className="text-sm text-ink-faint">No open tasks.</p>}
        </section>
      </div>
    </div>
  );
};

const HabitHeatmap: React.FC = () => {
  const habits = useHabits((s) => s.habits);
  const [hover, setHover] = useState<string | null>(null);
  const today = todayISO();
  const start = useMemo(() => {
    const t = parseISODate(today)!;
    const monday = addDays(today, -((t.getDay() + 6) % 7));
    return addDays(monday, -77);
  }, [today]);
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    habits.forEach((h) => h.checks.forEach((d) => m.set(d, (m.get(d) ?? 0) + 1)));
    return m;
  }, [habits]);
  const total = Math.max(1, habits.length);
  const weeks = Array.from({ length: 12 }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)));
  // one hue, light to dark
  const shade = (n: number) => (n === 0 ? 'rgb(var(--ink) / 0.07)' : `rgb(var(--honey) / ${0.25 + 0.75 * (n / total)})`);

  return (
    <div>
      <div className="flex gap-1.5" role="img" aria-label="Habit completion heatmap, last twelve weeks">
        <div className="mr-1 grid grid-rows-7 gap-1.5 text-[10px] text-ink-faint">
          {['Mon', '', 'Wed', '', 'Fri', '', 'Sun'].map((d, i) => (
            <span key={i} className="flex h-4 items-center">
              {d}
            </span>
          ))}
        </div>
        {weeks.map((week) => (
          <div key={week[0]} className="grid grid-rows-7 gap-1.5">
            {week.map((d) => {
              const n = counts.get(d) ?? 0;
              const future = d > today;
              return (
                <span
                  key={d}
                  onMouseEnter={() => setHover(d)}
                  onMouseLeave={() => setHover(null)}
                  className="h-4 w-4 rounded-[4px] ring-offset-1 transition-transform hover:scale-125"
                  style={{ background: future ? 'transparent' : shade(n), outline: d === today ? '1.5px solid rgb(var(--honey))' : undefined }}
                  aria-label={`${formatLong(d)}: ${n} of ${habits.length} habits`}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-ink-faint">
        <span>{hover ? `${formatLong(hover)}: ${counts.get(hover) ?? 0} of ${habits.length} habits` : 'Hover a day'}</span>
        <span className="flex items-center gap-1">
          None
          {[0, 0.34, 0.67, 1].map((f) => (
            <span key={f} className="h-3 w-3 rounded-[3px]" style={{ background: f === 0 ? 'rgb(var(--ink) / 0.07)' : `rgb(var(--honey) / ${0.25 + 0.75 * f})` }} />
          ))}
          All
        </span>
      </div>
    </div>
  );
};
