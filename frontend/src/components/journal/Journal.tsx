import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Task } from '../../types';
import { LoafCat } from '../../art/LoafCat';
import { Greeting } from './Greeting';
import { HabitsPane } from './HabitsPane';
import { OverdueBanner } from './OverdueBanner';
import { SanctuaryPane } from './SanctuaryPane';
import { TimerPane } from './TimerPane';
import { TodayPane } from './TodayPane';
import { UpcomingWidget } from './UpcomingWidget';
import { WeekStrip } from './WeekStrip';
import { useEvents } from '../../store/events';
import { usePets } from '../../store/pets';
import { useTasks } from '../../store/tasks';
import { useUi } from '../../store/ui';
import { todayISO } from '../../lib/dates';

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 24, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] },
});

interface TodayViewProps {
  onOpenTask: (t: Task) => void;
  quickAddRef: React.Ref<HTMLInputElement>;
  calm?: boolean;
}

export const TodayView: React.FC<TodayViewProps> = ({ onOpenTask, quickAddRef }) => {
  const tasks = useTasks((s) => s.tasks);
  const events = useEvents((s) => s.events);
  const setView = useUi((s) => s.setView);
  const today = todayISO();

  const overdueCount = useMemo(
    () => tasks.filter((t) => !t.completed && t.due_date && t.due_date < today).length,
    [tasks, today],
  );

  return (
    <div className="mx-auto max-w-[1520px] px-4 pb-16 pt-20 sm:px-8">
      {/* Cockpit: balanced 3-column layout */}
      <section className="grid gap-5 xl:grid-cols-[minmax(340px,400px)_minmax(340px,420px)_minmax(320px,380px)] xl:items-start">
        {/* Left Column: Greeting + Quests / Today Tasks */}
        <div className="flex min-h-0 flex-col gap-5">
          <Greeting />
          <motion.div {...rise(0.15)} className="flex min-h-[30rem] flex-1 flex-col">
            <TodayPane onOpen={onOpenTask} quickAddRef={quickAddRef} />
          </motion.div>
        </div>

        {/* Center Column: Overdue Alert + Week Calendar Strip + Focus Timer */}
        <div className="flex min-h-0 flex-col gap-4">
          {overdueCount > 0 && (
            <motion.div {...rise(0.2)}>
              <OverdueBanner
                count={overdueCount}
                onViewOverdue={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </motion.div>
          )}

          <motion.div {...rise(0.25)}>
            <WeekStrip
              events={events}
              tasks={tasks}
              onOpenCalendar={() => setView('calendar')}
              onOpenTask={onOpenTask}
            />
          </motion.div>

          <motion.div {...rise(0.35)} className="w-full">
            <TimerPane />
          </motion.div>
        </div>

        {/* Right Column: Upcoming Week + Daily Habits + Sanctuary */}
        <div className="flex min-h-0 flex-col gap-4">
          <motion.div {...rise(0.3)}>
            <UpcomingWidget
              tasks={tasks}
              events={events}
              onOpenTask={onOpenTask}
              className="max-h-[18rem]"
            />
          </motion.div>

          <motion.div {...rise(0.4)} className="flex min-h-[16rem] flex-col">
            <HabitsPane className="flex-1" />
          </motion.div>

          <motion.div {...rise(0.45)}>
            <SanctuaryPane />
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export const Journal = TodayView;

const Footer: React.FC = () => {
  const { lemonPets, stainPets } = usePets();
  return (
    <footer className="flex flex-col items-center pb-12 pt-12 text-center">
      <div className="flex items-end gap-2">
        <LoafCat coat="stain" style={{ width: 140 }} className="text-ink-faint" title="Stain, asleep" />
        <LoafCat coat="lemon" style={{ width: 140 }} className="text-ink-faint" title="Lemon, asleep" />
      </div>
      <p className="heading mt-3 text-xl italic">That's everything. Go be proud of yourself.</p>
      <p className="mt-1 text-xs text-ink-faint">
        Lemon has been petted {lemonPets} times and Stain {stainPets}. They'd like more.
      </p>
    </footer>
  );
};
