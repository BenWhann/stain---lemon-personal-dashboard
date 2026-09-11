import React from 'react';
import { motion } from 'framer-motion';
import { Zap, CheckCircle2, Award } from 'lucide-react';
import { useTaskStore } from '../../store/useTaskStore';
import { useHabitStore } from '../../store/useHabitStore';
import { usePetStore } from '../../store/usePetStore';

export const SprintVelocityBar: React.FC = () => {
  const tasks = useTaskStore((state) => state.tasks);
  const habits = useHabitStore((state) => state.habits);
  const focusPaws = usePetStore((state) => state.focusPaws);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Day index for today (0 = Mon, 6 = Sun)
  const jsDay = new Date().getDay();
  const dayIndex = jsDay === 0 ? 6 : jsDay - 1;
  const totalHabits = habits.length;
  const completedHabitsToday = habits.filter((h) => h.days[dayIndex]).length;
  const habitRate = totalHabits > 0 ? Math.round((completedHabitsToday / totalHabits) * 100) : 0;

  return (
    <div className="bg-white/90 dark:bg-[#1E1B24]/90 backdrop-blur-md p-5 rounded-3xl border border-cat-200/80 dark:border-stone-800 shadow-cozy dark:shadow-stain space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-cat-500" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-stone-700 dark:text-stone-300 font-cozy">
            Sprint Velocity & Daily Paw-gress
          </h3>
        </div>
        <span className="text-[11px] font-extrabold text-cat-600 dark:text-cat-400">
          {taskCompletionRate}% Velocity
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2.5 bg-cat-100 dark:bg-stone-800 rounded-full overflow-hidden p-0.5 border border-cat-200/60 dark:border-stone-700/60">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${taskCompletionRate}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-cat-400 via-cat-500 to-amber-500 rounded-full shadow-xs"
        />
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-3 gap-2 pt-1 text-center">
        <div className="p-2 rounded-2xl bg-cat-50/60 dark:bg-stone-800/40 border border-cat-100 dark:border-stone-800">
          <div className="flex items-center justify-center gap-1 text-[10px] text-stone-400 font-semibold mb-0.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Tasks Done</span>
          </div>
          <span className="text-sm font-extrabold text-stone-800 dark:text-stone-200">
            {completedTasks}/{totalTasks}
          </span>
        </div>

        <div className="p-2 rounded-2xl bg-cat-50/60 dark:bg-stone-800/40 border border-cat-100 dark:border-stone-800">
          <div className="flex items-center justify-center gap-1 text-[10px] text-stone-400 font-semibold mb-0.5">
            <span>🐾</span>
            <span>Habits Today</span>
          </div>
          <span className="text-sm font-extrabold text-stone-800 dark:text-stone-200">
            {completedHabitsToday}/{totalHabits} ({habitRate}%)
          </span>
        </div>

        <div className="p-2 rounded-2xl bg-cat-50/60 dark:bg-stone-800/40 border border-cat-100 dark:border-stone-800">
          <div className="flex items-center justify-center gap-1 text-[10px] text-stone-400 font-semibold mb-0.5">
            <Award className="w-3 h-3 text-amber-500" />
            <span>Focus Paws</span>
          </div>
          <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400">
            {focusPaws} 🐾
          </span>
        </div>
      </div>
    </div>
  );
};
