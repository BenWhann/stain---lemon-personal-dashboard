import React, { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { addDays, todayISO, utcStampToLocalISO } from '../../lib/dates';
import { useTasks } from '../../store/tasks';
import type { Task } from '../../types';
import { LoafCat } from '../../art/LoafCat';
import { QuickAdd } from '../tasks/QuickAdd';
import { TaskRow } from '../tasks/TaskRow';
import { Segmented } from '../ui/Segmented';

type Lens = 'today' | 'week' | 'someday';

export function useTodayBuckets(tasks: Task[]) {
  return useMemo(() => {
    const today = todayISO();
    const weekEnd = addDays(today, 7);
    const open = tasks.filter((t) => !t.completed);
    // Finished today stays visible (struck through) so progress feels real
    const doneToday = tasks.filter((t) => t.completed && utcStampToLocalISO(t.completed_at) === today);
    return {
      today: open
        .filter((t) => (t.due_date && t.due_date <= today) || t.status === 'In Progress')
        .sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? '')),
      week: open.filter((t) => t.due_date && t.due_date > today && t.due_date <= weekEnd),
      someday: open.filter((t) => !t.due_date || t.due_date > weekEnd),
      doneToday,
    };
  }, [tasks]);
}

export const TodayPane: React.FC<{ onOpen: (t: Task) => void; quickAddRef?: React.Ref<HTMLInputElement> }> = ({ onOpen, quickAddRef }) => {
  const tasks = useTasks((s) => s.tasks);
  const loaded = useTasks((s) => s.loaded);
  const [lens, setLens] = useState<Lens>('today');
  const buckets = useTodayBuckets(tasks);
  const listRef = useRef<HTMLUListElement>(null);

  const list = lens === 'today' ? [...buckets.today, ...buckets.doneToday] : buckets[lens];
  const today = todayISO();

  return (
    <section className="pane flex min-h-0 flex-col p-5" aria-labelledby="today-heading">
      <div className="flex items-center justify-between gap-3">
        <h2 id="today-heading" className="heading text-[1.6rem] leading-none">
          Quests
        </h2>
        <Segmented<Lens>
          label="Which tasks"
          size="sm"
          value={lens}
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
        defaults={{ due_date: lens === 'today' ? today : lens === 'week' ? addDays(today, 2) : null }}
      />

      <ul ref={listRef} className="scroll-soft -mx-2 mt-3 min-h-0 flex-1 space-y-0.5 overflow-y-auto px-1" data-lenis-prevent>
        <AnimatePresence initial={false} mode="popLayout">
          {list.map((t) => (
            <TaskRow key={t.id} task={t} onOpen={onOpen} compact />
          ))}
        </AnimatePresence>
        {loaded && list.length === 0 && <EmptyState lens={lens} />}
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
