import React from 'react';
import { motion } from 'framer-motion';
import { Trash2, Calendar, Link2 } from 'lucide-react';
import { Task } from '../../types';
import { Badge } from '../common/Badge';
import { getUrgencyCountdown } from '../../utils/dateUtils';

interface TaskItemProps {
  task: Task;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onDelete }) => {
  const countdown = getUrgencyCountdown(task.due_date);

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'Zoomies':
      case 'High':
        return 'rose';
      case 'Purr-fect':
      case 'Medium':
        return 'amber';
      case 'Catnap':
      case 'Low':
      default:
        return 'emerald';
    }
  };

  const getUrgencyBadgeVariant = () => {
    if (task.completed) return 'stone';
    if (countdown.isOverdue) return 'rose';
    if (countdown.isToday) return 'rose';
    if (countdown.isSoon) return 'amber';
    return 'stone';
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`group flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
        task.completed
          ? 'bg-cat-50/40 dark:bg-stone-900/40 border-cat-100/60 dark:border-stone-800/80 opacity-60'
          : 'bg-white dark:bg-[#1E1B24] border-cat-200/80 dark:border-stone-800 hover:border-cat-400 dark:hover:border-cat-500 shadow-2xs hover:shadow-cozy'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Animated Paw Checkbox */}
        <button
          onClick={() => onToggle(task.id)}
          className={`w-6 h-6 rounded-xl flex items-center justify-center text-xs transition-all cursor-pointer shrink-0 ${
            task.completed
              ? 'bg-cat-500 text-white shadow-xs'
              : 'border-2 border-cat-300 dark:border-stone-600 hover:border-cat-500 hover:bg-cat-50 dark:hover:bg-stone-800'
          }`}
          title={task.completed ? 'Mark pending' : 'Mark completed 🐾'}
        >
          {task.completed ? '🐾' : ''}
        </button>

        {/* Task Details */}
        <div className="min-w-0 flex-1">
          <p
            className={`text-xs sm:text-sm font-semibold truncate ${
              task.completed
                ? 'line-through text-stone-400 dark:text-stone-500'
                : 'text-stone-800 dark:text-stone-100'
            }`}
          >
            {task.title}
          </p>

          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {/* Urgency Countdown */}
            <Badge variant={getUrgencyBadgeVariant()} size="sm">
              <Calendar className="w-2.5 h-2.5" />
              <span>{task.completed ? task.due_date : countdown.text}</span>
            </Badge>

            {/* Category */}
            <span className="text-[10px] text-cat-700 dark:text-cat-400 font-bold">
              • {task.category}
            </span>

            {/* Source */}
            {task.source && (
              <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-md bg-cat-50 dark:bg-stone-800 text-stone-500 dark:text-stone-400 border border-cat-100/60 dark:border-stone-700">
                <Link2 className="w-2.5 h-2.5" />
                <span>{task.source}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right Controls: Priority Badge & Delete */}
      <div className="flex items-center gap-2 ml-3 shrink-0">
        <Badge variant={getPriorityVariant(task.priority)} size="sm">
          {task.priority === 'Zoomies' && '⚡ '}
          {task.priority === 'Purr-fect' && '🐾 '}
          {task.priority === 'Catnap' && '💤 '}
          {task.priority}
        </Badge>

        <button
          onClick={() => onDelete(task.id)}
          className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
          title="Delete task"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
};
