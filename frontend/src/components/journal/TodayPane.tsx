import React, { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { addDays, todayISO, utcStampToLocalISO } from '../../lib/dates';
import { useTasks } from '../../store/tasks';
import type { Task } from '../../types';
import { LoafCat } from '../../art/LoafCat';
import { QuickAdd } from '../tasks/QuickAdd';
import { TaskRow } from '../tasks/TaskRow';
import { Segmented } from '../ui/Segmented';

export type Lens = 'today' | 'week' | 'someday';

export function calculateTodayBuckets(tasks: Task[], today = todayISO()) {
  const weekEnd = addDays(today, 7);
  const open = tasks.filter((t) => !t.completed);
  
  const overdue = open
    .filter((t) => t.due_date && t.due_date < today)
    .sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? ''));

  const dueToday = open
    .filter((t) => t.due_date === today || (!t.due_date && t.status === 'In Progress'))
    .sort((a, b) => {
      // Tasks with explicit due date today come before undated in-progress tasks
      const dateA = a.due_date ?? '9999-99-99';
      const dateB = b.due_date ?? '9999-99-99';
      return dateA.localeCompare(dateB);
    });

  // Finished today stays visible (struck through) so progress feels real
  const doneToday = tasks.filter((t) => t.completed && utcStampToLocalISO(t.completed_at) === today);

  return {
    overdue,
    dueToday,
    today: [...overdue, ...dueToday],
    week: open.filter((t) => t.due_date && t.due_date > today && t.due_date <= weekEnd),
    someday: open.filter((t) => (!t.due_date && t.status !== 'In Progress') || (t.due_date && t.due_date > weekEnd)),
    doneToday,
  };
}

export function useTodayBuckets(tasks: Task[]) {
  return useMemo(() => calculateTodayBuckets(tasks), [tasks]);
}

interface TodayPaneProps {
  onOpen: (t: Task) => void;
  quickAddRef?: React.Ref<HTMLInputElement>;
  filterOverdueOnly?: boolean;
}

export const TodayPane: React.FC<TodayPaneProps> = ({ onOpen, quickAddRef, filterOverdueOnly }) => {
  const tasks = useTasks((s) => s.tasks);
  const loaded = useTasks((s) => s.loaded);
  const [lens, setLens] = useState<Lens>('today');
  const buckets = useTodayBuckets(tasks);
  const listRef = useRef<HTMLUListElement>(null);

  const today = todayISO();

  // If filterOverdueOnly is toggled, ensure we view today
  const activeLens = filterOverdueOnly ? 'today' : lens;

  return (
    <section className="pane flex min-h-0 flex-col p-5" aria-labelledby="today-heading">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <h2 id="today-heading" className="heading text-[1.6rem] leading-none">
            Quests
          </h2>
          {buckets.overdue.length > 0 && (
            <span className="rounded-full bg-ember/15 px-2 py-0.5 text-[11px] font-semibold text-ember">
              {buckets.overdue.length} overdue
            </span>
          )}
        </div>
        <Segmented<Lens>
          label="Which tasks"
          size="sm"
          value={activeLens}
          onChange={setLens}
          options={[
            { value: 'today', label: `Today ${buckets.today.length || ''}`.trim() },
            { value: 'week', label: 'This week' },
            { value: 'someday', label: 'Later' },
          ]}
        />
      </div>

      <QuickAdd
        ref={quickAddRef}
        className="mt-4"
        defaults={{ due_date: activeLens === 'today' ? today : activeLens === 'week' ? addDays(today, 2) : null }}
      />

      <ul ref={listRef} className="scroll-soft -mx-2 mt-3 min-h-0 flex-1 space-y-1 overflow-y-auto px-1" data-lenis-prevent>
        <AnimatePresence initial={false} mode="popLayout">
          {activeLens === 'today' ? (
            <>
              {buckets.overdue.length > 0 && (
                <li key="header-overdue" className="pt-1.5 pb-0.5 px-2 text-[11px] font-semibold tracking-wider text-ember uppercase">
                  Past Due ({buckets.overdue.length})
                </li>
              )}
              {buckets.overdue.map((t) => (
                <TaskRow key={`overdue-${t.id}`} task={t} onOpen={onOpen} compact />
              ))}

              {buckets.dueToday.length > 0 && (
                <li key="header-today" className="pt-2.5 pb-0.5 px-2 text-[11px] font-semibold tracking-wider text-honey-deep dark:text-honey uppercase">
                  Due Today ({buckets.dueToday.length})
                </li>
              )}
              {buckets.dueToday.map((t) => (
                <TaskRow key={`today-${t.id}`} task={t} onOpen={onOpen} compact />
              ))}

              {buckets.doneToday.length > 0 && (
                <li key="header-done" className="pt-2.5 pb-0.5 px-2 text-[11px] font-semibold tracking-wider text-sage uppercase">
                  Completed Today ({buckets.doneToday.length})
                </li>
              )}
              {buckets.doneToday.map((t) => (
                <TaskRow key={`done-${t.id}`} task={t} onOpen={onOpen} compact />
              ))}

              {loaded && buckets.today.length === 0 && buckets.doneToday.length === 0 && (
                <EmptyState lens="today" />
              )}
            </>
          ) : (
            <>
              {buckets[activeLens].map((t) => (
                <TaskRow key={t.id} task={t} onOpen={onOpen} compact />
              ))}
              {loaded && buckets[activeLens].length === 0 && <EmptyState lens={activeLens} />}
            </>
          )}
        </AnimatePresence>
      </ul>
    </section>
  );
};

const EmptyState: React.FC<{ lens: Lens }> = ({ lens }) => (
  <motion.li
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center px-6 py-8 text-center"
  >
    <LoafCat coat="lemon" style={{ width: 150 }} className="text-ink-faint" title="Lemon, asleep" />
    <p className="heading mt-3 text-lg">
      {lens === 'today' ? 'Nothing due today' : lens === 'week' ? 'A quiet week ahead' : 'No someday tasks'}
    </p>
    <p className="mt-1 text-sm text-ink-soft">
      {lens === 'today' ? 'Lemon approves. Add something above, or enjoy the sunbeam.' : 'Add one above when it comes to mind.'}
    </p>
  </motion.li>
);
