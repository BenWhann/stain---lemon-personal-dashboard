import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Search } from 'lucide-react';
import { sfx } from '../../lib/audio';
import { completeTaskWithFlair } from '../../lib/rewards';
import { useTasks } from '../../store/tasks';
import { CATEGORIES, type Task, type TaskStatus } from '../../types';
import { CategoryLabel, DueChip, PriorityChip } from '../tasks/meta';
import { Segmented } from '../ui/Segmented';
import { cx } from '../ui/cx';

const COLUMNS: { status: TaskStatus; title: string; blurb: string }[] = [
  { status: 'Pending', title: 'Up next', blurb: 'Waiting their turn' },
  { status: 'In Progress', title: 'In paws', blurb: 'Being worked on' },
  { status: 'Completed', title: 'Done', blurb: 'Finished in the last two weeks' },
];

const PRIORITY_ORDER: Record<string, number> = { Zoomies: 0, 'Purr-fect': 1, Catnap: 2 };

function columnOf(t: Task): TaskStatus {
  if (t.completed || t.status === 'Completed') return 'Completed';
  return t.status === 'In Progress' ? 'In Progress' : 'Pending';
}

export const QuestBoard: React.FC<{ onOpen: (t: Task) => void }> = ({ onOpen }) => {
  const tasks = useTasks((s) => s.tasks);
  const setStatus = useTasks((s) => s.setStatus);
  const [area, setArea] = useState<string>('All');
  const [query, setQuery] = useState('');
  const [dragging, setDragging] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const columns = useMemo(() => {
    const q = query.trim().toLowerCase();
    const twoWeeksAgo = Date.now() - 14 * 86400000;
    const visible = tasks.filter((t) => {
      if (area !== 'All' && t.category !== area) return false;
      if (q && !`${t.title} ${t.notes ?? ''} ${t.source ?? ''}`.toLowerCase().includes(q)) return false;
      if (columnOf(t) === 'Completed' && t.completed_at && new Date(t.completed_at.endsWith('Z') ? t.completed_at : `${t.completed_at}Z`).getTime() < twoWeeksAgo) return false;
      return true;
    });
    const by: Record<TaskStatus, Task[]> = { Pending: [], 'In Progress': [], Completed: [] };
    visible.forEach((t) => by[columnOf(t)].push(t));
    const sortOpen = (a: Task, b: Task) =>
      (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999') || (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1);
    by.Pending.sort(sortOpen);
    by['In Progress'].sort(sortOpen);
    by.Completed.sort((a, b) => (b.completed_at ?? '').localeCompare(a.completed_at ?? ''));
    return by;
  }, [tasks, area, query]);

  const onDragStart = (e: DragStartEvent) => {
    setDragging(tasks.find((t) => t.id === e.active.id) ?? null);
    sfx.tick();
  };

  const onDragEnd = (e: DragEndEvent) => {
    setDragging(null);
    const target = e.over?.id as TaskStatus | undefined;
    const task = tasks.find((t) => t.id === e.active.id);
    if (!target || !task || columnOf(task) === target) return;
    if (target === 'Completed') {
      const rect = e.over?.rect;
      void completeTaskWithFlair(task.id, rect ? { x: rect.left + rect.width / 2, y: rect.top + 80 } : undefined);
    } else {
      sfx.pop();
      void setStatus(task.id, target);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Segmented
          label="Filter by area"
          size="sm"
          value={area}
          onChange={setArea}
          options={['All', ...CATEGORIES].map((c) => ({ value: c, label: c }))}
        />
        <label className="pane-solid ml-auto flex h-10 w-full items-center gap-2 !rounded-full px-4 sm:w-72">
          <Search className="h-4 w-4 text-ink-faint" />
          <span className="sr-only">Search tasks</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks and notes"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
          />
        </label>
      </div>
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragging(null)}>
        <div className="grid gap-5 lg:grid-cols-3">
          {COLUMNS.map((c) => (
            <Column key={c.status} {...c} tasks={columns[c.status]} onOpen={onOpen} />
          ))}
        </div>
        <DragOverlay dropAnimation={{ duration: 280, easing: 'cubic-bezier(.22,1,.36,1)' }}>
          {dragging && <Card task={dragging} lifted />}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

const Column: React.FC<{ status: TaskStatus; title: string; blurb: string; tasks: Task[]; onOpen: (t: Task) => void }> = ({
  status,
  title,
  blurb,
  tasks,
  onOpen,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <section
      ref={setNodeRef}
      aria-label={title}
      className={cx('pane flex min-h-[18rem] flex-col p-4 transition-shadow duration-300', isOver && 'shadow-glow')}
    >
      <header className="mb-3 flex items-baseline justify-between px-1">
        <div>
          <h3 className="heading text-xl">{title}</h3>
          <p className="text-xs text-ink-faint">{blurb}</p>
        </div>
        <motion.span key={tasks.length} initial={{ scale: 1.4 }} animate={{ scale: 1 }} className="tabular text-sm text-ink-soft">
          {tasks.length}
        </motion.span>
      </header>
      <ul className="scroll-soft max-h-[28rem] flex-1 space-y-2 overflow-y-auto pr-1" data-lenis-prevent>
        <AnimatePresence initial={false}>
          {tasks.map((t) => (
            <DraggableCard key={t.id} task={t} onOpen={onOpen} />
          ))}
        </AnimatePresence>
        {tasks.length === 0 && (
          <li className="grid h-24 place-items-center rounded-2xl border border-dashed border-ink/15 text-sm text-ink-faint">
            {status === 'Completed' ? 'Finished tasks land here' : 'Drag a task here'}
          </li>
        )}
      </ul>
    </section>
  );
};

const DraggableCard: React.FC<{ task: Task; onOpen: (t: Task) => void }> = ({ task, onOpen }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });
  return (
    <motion.li
      ref={setNodeRef}
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: isDragging ? 0.3 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(task)}
      className="cursor-grab touch-none active:cursor-grabbing"
    >
      <Card task={task} />
    </motion.li>
  );
};

const Card: React.FC<{ task: Task; lifted?: boolean }> = ({ task, lifted }) => {
  const done = task.subtasks.filter((s) => s.done).length;
  return (
    <div
      className={cx(
        'rounded-2xl bg-surface-strong/80 p-3.5 ring-1 ring-ink/[0.06] transition-shadow hover:ring-honey/40',
        lifted && 'rotate-2 shadow-lift ring-honey/60',
      )}
    >
      <p className={cx('text-[15px] leading-snug', task.completed ? 'text-ink-faint line-through' : 'text-ink')}>{task.title}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <DueChip due={task.due_date} done={task.completed} />
        <PriorityChip priority={task.priority} />
        <CategoryLabel category={task.category} />
      </div>
      {task.subtasks.length > 0 && (
        <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-ink/10">
          <div className="h-full rounded-full bg-honey transition-all duration-500" style={{ width: `${(done / task.subtasks.length) * 100}%` }} />
        </div>
      )}
    </div>
  );
};
