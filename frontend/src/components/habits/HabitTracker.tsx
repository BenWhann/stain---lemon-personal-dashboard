import React, { useState } from 'react';
import { Flame, Plus, Trash2 } from 'lucide-react';
import { useHabitStore } from '../../store/useHabitStore';
import { HabitModal } from './HabitModal';

export const HabitTracker: React.FC = () => {
  const { habits, addHabit, toggleHabitDay, deleteHabit } = useHabitStore();
  const [showModal, setShowModal] = useState(false);

  const daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="bg-white/90 dark:bg-[#1E1B24]/90 backdrop-blur-md p-6 rounded-3xl border border-cat-200/80 dark:border-stone-800 shadow-cozy dark:shadow-stain space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🐾</span>
          <h2 className="text-lg font-bold font-cozy text-stone-900 dark:text-stone-100">
            Daily Paw-gress Habits
          </h2>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="text-xs font-bold text-cat-600 dark:text-cat-400 hover:text-cat-700 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Habit</span>
        </button>
      </div>

      <div className="space-y-3">
        {habits.length === 0 ? (
          <div className="text-center py-6 text-xs text-stone-400">
            <p className="text-xl mb-1">🐾</p>
            <p>No habits added yet. Build your daily momentum!</p>
          </div>
        ) : (
          habits.map((habit) => (
            <div
              key={habit.id}
              className="group flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-cat-50/50 dark:bg-stone-800/40 border border-cat-100/80 dark:border-stone-800/80 gap-3 hover:border-cat-300 dark:hover:border-stone-700 transition-all shadow-2xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-xl shrink-0">{habit.icon || '🐾'}</span>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold truncate text-stone-800 dark:text-stone-100">
                    {habit.name}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-cat-600 dark:text-cat-400 font-bold">
                    <Flame className="w-3 h-3 fill-cat-500 text-cat-500" />
                    <span>{habit.streak} day streak</span>
                  </div>
                </div>
              </div>

              {/* Day Toggle Buttons */}
              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                {habit.days.map((isDone, idx) => (
                  <button
                    key={idx}
                    onClick={() => toggleHabitDay(habit.id, idx)}
                    title={`${dayNames[idx]}: ${isDone ? 'Completed 🐾' : 'Click to complete'}`}
                    className={`w-8 h-8 rounded-xl text-xs font-black transition-all flex items-center justify-center cursor-pointer select-none ${
                      isDone
                        ? 'bg-gradient-to-tr from-cat-500 to-amber-400 text-white shadow-xs shadow-cat-500/30 scale-105'
                        : 'bg-white dark:bg-stone-700/60 text-stone-400 hover:bg-cat-100 dark:hover:bg-stone-600 border border-cat-100 dark:border-stone-600'
                    }`}
                  >
                    {isDone ? '🐾' : daysOfWeek[idx]}
                  </button>
                ))}

                <button
                  onClick={() => deleteHabit(habit.id)}
                  className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all ml-1 cursor-pointer"
                  title="Delete habit"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <HabitModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={addHabit}
      />
    </div>
  );
};
