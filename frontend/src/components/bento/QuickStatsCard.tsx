import React from 'react';
import { Clock, AlertCircle, Calendar } from 'lucide-react';
import { useTaskStore } from '../../store/useTaskStore';
import { useEventStore } from '../../store/useEventStore';

export const QuickStatsCard: React.FC = () => {
  const tasks = useTaskStore((state) => state.tasks);
  const events = useEventStore((state) => state.events);

  const pendingTasks = tasks.filter((t) => !t.completed);
  const zoomiesTasks = pendingTasks.filter((t) => t.priority === 'Zoomies');
  const upcomingEvents = events.slice(0, 3);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="p-4 rounded-3xl bg-white/90 dark:bg-[#1E1B24]/90 backdrop-blur-md border border-cat-200/80 dark:border-stone-800 shadow-cozy dark:shadow-stain flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div>
          <span className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
            {zoomiesTasks.length}
          </span>
          <p className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
            High Priority (Zoomies)
          </p>
        </div>
      </div>

      <div className="p-4 rounded-3xl bg-white/90 dark:bg-[#1E1B24]/90 backdrop-blur-md border border-cat-200/80 dark:border-stone-800 shadow-cozy dark:shadow-stain flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <span className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
            {pendingTasks.length}
          </span>
          <p className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
            Pending Deadlines
          </p>
        </div>
      </div>
    </div>
  );
};
