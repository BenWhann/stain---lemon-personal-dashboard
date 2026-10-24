import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { ListChecks, Timer, Trash2 } from 'lucide-react';
import { completeTaskWithFlair } from '../../lib/rewards';
import { useTasks } from '../../store/tasks';
import { useTimer } from '../../store/timer';
import { toast } from '../../store/toast';
import type { Task } from '../../types';
import { PawCheck } from '../ui/PawCheck';
import { cx } from '../ui/cx';
import { CategoryLabel, DueChip, PriorityChip } from './meta';

interface TaskRowProps {
  task: Task;
  onOpen: (task: Task) => void;
  compact?: boolean;
}

export const TaskRow = forwardRef<HTMLLIElement, TaskRowProps>(({ task, onOpen, compact }, ref) => {
  const remove = useTasks((s) => s.remove);
  const link = useTimer((s) => s.link);
  const linked = useTimer((s) => s.linkedTaskId === task.id);
  const doneSubs = task.subtasks.filter((s) => s.done).length;

  return (
    <motion.li
      ref={ref}
      layout="position"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -30, transition: { duration: 0.25 } }}
      transition={{ type: 'spring', stiffness: 360, damping: 32 }}
      className={cx(
        'group relative flex cursor-pointer items-start gap-3 rounded-2xl px-3 transition-colors duration-300',
        compact ? 'py-2.5' : 'py-3',
        'hover:bg-ink/[0.05]',
        linked && 'bg-honey/[0.08] ring-1 ring-honey/30',
      )}
      onClick={() => onOpen(task)}
    >
      <PawCheck
        checked={task.completed}
        label={task.completed ? `Mark "${task.title}" not done` : `Complete "${task.title}"`}
        onToggle={(p) => void completeTaskWithFlair(task.id, p)}
        className="mt-0.5"
      />
      <div className="min-w-0 flex-1">
        <p className="relative inline-block max-w-full text-[15px] leading-snug text-ink">
          <span className={cx('transition-colors duration-500', task.completed && 'text-ink-faint')}>{task.title}</span>
          <motion.span
            aria-hidden
            className="absolute left-0 top-1/2 h-[1.5px] w-full origin-left bg-ink-faint"
            initial={false}
            animate={{ scaleX: task.completed ? 1 : 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          />
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <DueChip due={task.due_date} done={task.completed} />
          {task.status === 'In Progress' && !task.completed && (
            <span className="chip bg-sage/15 text-sage">In progress</span>
          )}
          {!compact && <PriorityChip priority={task.priority} />}
          {compact && task.priority === 'Zoomies' && !task.completed && <PriorityChip priority="Zoomies" />}
          <CategoryLabel category={task.category} />
          {task.subtasks.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-ink-faint">
              <ListChecks className="h-3 w-3" />
              {doneSubs}/{task.subtasks.length}
            </span>
          )}
          {task.pomodoros > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-ink-faint" title="Focus sprints spent on this">
              <Timer className="h-3 w-3" />
              {task.pomodoros}
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
        {!task.completed && (
          <button
            type="button"
            title={linked ? 'Linked to the focus timer' : 'Focus on this'}
            aria-label={`Focus on "${task.title}"`}
            className={cx('grid h-8 w-8 place-items-center rounded-full hover:bg-ink/10', linked ? 'text-honey' : 'text-ink-faint hover:text-ink')}
            onClick={(e) => {
              e.stopPropagation();
              link(linked ? null : task.id);
              if (!linked) toast.info(`The timer is now tracking "${task.title}".`);
            }}
          >
            <Timer className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          title="Delete"
          aria-label={`Delete "${task.title}"`}
          className="grid h-8 w-8 place-items-center rounded-full text-ink-faint hover:bg-ember/10 hover:text-ember"
          onClick={(e) => {
            e.stopPropagation();
            remove(task.id);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </motion.li>
  );
});
TaskRow.displayName = 'TaskRow';
