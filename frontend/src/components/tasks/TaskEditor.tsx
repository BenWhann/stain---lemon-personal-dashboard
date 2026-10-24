import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, Plus, Timer, Trash2, X } from 'lucide-react';
import { addDays, formatLong, todayISO } from '../../lib/dates';
import { completeTaskWithFlair } from '../../lib/rewards';
import { useTasks } from '../../store/tasks';
import { useTimer } from '../../store/timer';
import { CATEGORIES, PRIORITIES, STATUSES, type Task, type TaskPriority, type TaskStatus } from '../../types';
import { Modal } from '../ui/Modal';
import { PawCheck } from '../ui/PawCheck';
import { Segmented } from '../ui/Segmented';
import { PRIORITY_META } from './meta';

interface TaskEditorProps {
  taskId: number | null;
  onClose: () => void;
}

export const TaskEditor: React.FC<TaskEditorProps> = ({ taskId, onClose }) => {
  const task = useTasks((s) => s.tasks.find((t) => t.id === taskId) ?? null);
  // Keep the last task around while the dialog animates closed
  const [shown, setShown] = useState<Task | null>(task);
  useEffect(() => {
    if (task) setShown(task);
  }, [task]);

  return (
    <Modal open={!!task} onClose={onClose} title="Task details" width="lg">
      {shown && <EditorBody task={task ?? shown} onClose={onClose} />}
    </Modal>
  );
};

const EditorBody: React.FC<{ task: Task; onClose: () => void }> = ({ task, onClose }) => {
  const { update, setStatus, remove, addSubtask, toggleSubtask, removeSubtask } = useTasks();
  const link = useTimer((s) => s.link);
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes ?? '');
  const [source, setSource] = useState(task.source ?? '');
  const [step, setStep] = useState('');
  const today = todayISO();

  useEffect(() => {
    setTitle(task.title);
    setNotes(task.notes ?? '');
    setSource(task.source ?? '');
    // Reset the drafts only when a different task opens
    // (not on every save of this one).
  }, [task.id]);

  const saveTitle = () => {
    const t = title.trim();
    if (t && t !== task.title) void update(task.id, { title: t });
    else setTitle(task.title);
  };

  const categories = CATEGORIES.includes(task.category as (typeof CATEGORIES)[number])
    ? [...CATEGORIES]
    : [...CATEGORIES, task.category];

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <PawCheck
          checked={task.completed}
          label={task.completed ? 'Mark not done' : 'Complete task'}
          onToggle={(p) => void completeTaskWithFlair(task.id, p)}
          className="mt-1.5"
        />
        <textarea
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveTitle}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              (e.target as HTMLTextAreaElement).blur();
            }
          }}
          rows={1}
          aria-label="Title"
          className="heading w-full resize-none bg-transparent text-2xl leading-tight outline-none"
          maxLength={255}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <span className="label">Status</span>
          <Segmented<TaskStatus>
            label="Status"
            size="sm"
            value={(task.status as TaskStatus) ?? 'Pending'}
            onChange={(s) => void setStatus(task.id, s)}
            options={STATUSES.map((s) => ({ value: s, label: s === 'Pending' ? 'To do' : s === 'Completed' ? 'Done' : 'Doing' }))}
          />
        </div>
        <div className="space-y-1.5">
          <span className="label">Priority</span>
          <Segmented<TaskPriority>
            label="Priority"
            size="sm"
            value={(task.priority as TaskPriority) ?? 'Purr-fect'}
            onChange={(p) => void update(task.id, { priority: p })}
            options={PRIORITIES.map((p) => ({ value: p, label: PRIORITY_META[p].label, title: PRIORITY_META[p].hint }))}
          />
        </div>
        <div className="space-y-1.5">
          <span className="label">Due</span>
          <div className="flex flex-wrap items-center gap-1.5">
            <label className="relative flex items-center">
              <CalendarDays className="pointer-events-none absolute left-3 h-4 w-4 text-ink-faint" />
              <input
                type="date"
                value={task.due_date ?? ''}
                onChange={(e) => void update(task.id, { due_date: e.target.value || null })}
                className="field !w-auto !py-1.5 pl-9 text-sm"
                aria-label="Due date"
              />
            </label>
            {[
              ['Today', today],
              ['Tomorrow', addDays(today, 1)],
              ['+1 week', addDays(task.due_date ?? today, 7)],
            ].map(([label, value]) => (
              <button key={label} type="button" className="btn-ghost !px-3 !py-1 text-xs" onClick={() => void update(task.id, { due_date: value })}>
                {label}
              </button>
            ))}
            {task.due_date && (
              <button type="button" className="btn-ghost !px-2 !py-1 text-xs" aria-label="Clear due date" onClick={() => void update(task.id, { due_date: null })}>
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          {task.due_date && <p className="text-xs text-ink-faint">{formatLong(task.due_date)}</p>}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1.5">
            <span className="label">Area</span>
            <select
              value={task.category}
              onChange={(e) => void update(task.id, { category: e.target.value })}
              className="field !py-1.5 text-sm"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="label">From</span>
            <input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              onBlur={() => source !== (task.source ?? '') && void update(task.id, { source })}
              placeholder="Moodle, CARE…"
              className="field !py-1.5 text-sm"
              maxLength={100}
            />
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="label">Steps</span>
          {task.subtasks.length > 0 && (
            <span className="text-xs text-ink-faint">
              {task.subtasks.filter((s) => s.done).length} of {task.subtasks.length}
            </span>
          )}
        </div>
        {task.subtasks.length > 0 && (
          <div className="h-1 overflow-hidden rounded-full bg-ink/10">
            <motion.div
              className="h-full rounded-full bg-honey"
              animate={{ width: `${(task.subtasks.filter((s) => s.done).length / task.subtasks.length) * 100}%` }}
              transition={{ type: 'spring', stiffness: 200, damping: 26 }}
            />
          </div>
        )}
        <ul className="space-y-0.5">
          <AnimatePresence initial={false}>
            {task.subtasks.map((s) => (
              <motion.li
                key={s.id}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="group flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-ink/5"
              >
                <PawCheck size="sm" checked={s.done} label={s.title} onToggle={() => void toggleSubtask(task.id, s)} />
                <span className={s.done ? 'flex-1 text-sm text-ink-faint line-through' : 'flex-1 text-sm text-ink'}>{s.title}</span>
                <button
                  type="button"
                  aria-label={`Remove step "${s.title}"`}
                  className="text-ink-faint opacity-0 hover:text-ember group-hover:opacity-100"
                  onClick={() => void removeSubtask(task.id, s.id)}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        <form
          className="flex items-center gap-2 rounded-xl px-2 py-1"
          onSubmit={(e) => {
            e.preventDefault();
            if (step.trim()) {
              void addSubtask(task.id, step.trim());
              setStep('');
            }
          }}
        >
          <Plus className="h-4 w-4 text-ink-faint" />
          <input
            value={step}
            onChange={(e) => setStep(e.target.value)}
            placeholder="Break it into a small next step"
            className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
            maxLength={255}
          />
        </form>
      </div>

      <label className="block space-y-1.5">
        <span className="label">Notes</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => notes !== (task.notes ?? '') && void update(task.id, { notes })}
          rows={4}
          placeholder="Links, reminders, what done looks like…"
          className="field resize-y text-sm leading-relaxed"
        />
      </label>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <button
          type="button"
          className="btn text-ember hover:bg-ember/10"
          onClick={() => {
            remove(task.id);
            onClose();
          }}
        >
          <Trash2 className="h-4 w-4" /> Delete task
        </button>
        <div className="flex items-center gap-2">
          {!task.completed && (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                link(task.id);
                onClose();
                document.getElementById('focus-timer')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
            >
              <Timer className="h-4 w-4" /> Focus on this
            </button>
          )}
          <button type="button" className="btn-honey" onClick={onClose}>
            Done editing
          </button>
        </div>
      </div>
    </div>
  );
};
