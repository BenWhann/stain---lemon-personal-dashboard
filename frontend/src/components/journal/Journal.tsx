import React, { useMemo } from 'react';
import type { Task } from '../../types';
import { LoafCat } from '../../art/LoafCat';
import { OverdueBanner } from './OverdueBanner';
import { WidgetGrid } from './WidgetGrid';
import { usePets } from '../../store/pets';
import { useTasks } from '../../store/tasks';
import { todayISO } from '../../lib/dates';

interface TodayViewProps {
  onOpenTask: (t: Task) => void;
  quickAddRef: React.Ref<HTMLInputElement>;
  calm?: boolean;
}

export const TodayView: React.FC<TodayViewProps> = ({ onOpenTask, quickAddRef }) => {
  const tasks = useTasks((s) => s.tasks);
  const today = todayISO();

  const overdueCount = useMemo(
    () => tasks.filter((t) => !t.completed && t.due_date && t.due_date < today).length,
    [tasks, today],
  );

  return (
    <div className="mx-auto max-w-[1520px] px-3 pb-16 pt-20 sm:px-8">
      {overdueCount > 0 && (
        <div className="mb-4">
          <OverdueBanner
            count={overdueCount}
            onViewOverdue={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      )}

      {/* Customizable Home Dashboard Grid */}
      <WidgetGrid onOpenTask={onOpenTask} quickAddRef={quickAddRef} />

      <Footer />
    </div>
  );
};

export const Journal = TodayView;

const Footer: React.FC = () => {
  const { lemonPets, stainPets } = usePets();
  return (
    <footer className="flex flex-col items-center pb-12 pt-16 text-center">
      <div className="flex items-end gap-2">
        <LoafCat coat="stain" style={{ width: 130 }} className="text-ink-faint" title="Stain, asleep" />
        <LoafCat coat="lemon" style={{ width: 130 }} className="text-ink-faint" title="Lemon, asleep" />
      </div>
      <p className="heading mt-3 text-lg italic text-ink-soft">That's everything. Go be proud of yourself.</p>
      <p className="mt-1 text-xs text-ink-faint">
        Lemon has been petted {lemonPets} times and Stain {stainPets}. They'd like more.
      </p>
    </footer>
  );
};
