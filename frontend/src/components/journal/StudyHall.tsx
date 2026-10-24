import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Loader2, Plus, ShieldAlert, Trash2 } from 'lucide-react';
import { sfx } from '../../lib/audio';
import { burst } from '../../lib/celebrate';
import { dueLabel, parseISODate, todayISO } from '../../lib/dates';
import { useNotes } from '../../store/notes';
import type { Assignment, AssignmentStatus } from '../../types';
import { ConfirmButton } from '../ui/ConfirmButton';
import { Modal } from '../ui/Modal';
import { cx } from '../ui/cx';

const NEXT: Record<string, AssignmentStatus> = {
  'Not Started': 'In Progress',
  'In Progress': 'Completed',
  Completed: 'Not Started',
};
const STATUS_STYLE: Record<string, string> = {
  'Not Started': 'bg-ink/[0.07] text-ink-soft',
  'In Progress': 'bg-honey/20 text-honey-deep dark:text-honey',
  Completed: 'bg-sage/20 text-sage',
};

export const StudyHall: React.FC = () => {
  const { assignments, updateAssignment, removeAssignment } = useNotes();
  const [adding, setAdding] = useState(false);
  const sorted = [...assignments].sort(
    (a, b) => Number(a.status === 'Completed') - Number(b.status === 'Completed') || (a.due || '9999').localeCompare(b.due || '9999'),
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      <div className="pane p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="heading text-2xl">Coursework</h3>
            <p className="text-sm text-ink-soft">Tap a status to move it along.</p>
          </div>
          <button type="button" className="btn-honey h-9 !px-3 text-xs" onClick={() => setAdding(true)}>
            <Plus className="h-3.5 w-3.5" /> Assignment
          </button>
        </div>
        <ul className="divide-y divide-ink/[0.08]">
          <AnimatePresence initial={false}>
            {sorted.map((a) => {
              const isDate = !!parseISODate(a.due);
              const due = isDate ? dueLabel(a.due, todayISO()) : null;
              return (
                <motion.li
                  key={a.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="group grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 py-3 sm:grid-cols-[1fr_7rem_auto]"
                >
                  <div className="min-w-0">
                    <p className={cx('text-[15px]', a.status === 'Completed' ? 'text-ink-faint line-through' : 'text-ink')}>{a.name}</p>
                    <p className="truncate text-xs text-ink-faint">
                      {a.course}
                      {a.prof ? ` · ${a.prof}` : ''}
                      {a.weight ? ` · ${a.weight}` : ''}
                    </p>
                  </div>
                  <span
                    className={cx(
                      'hidden text-right text-xs sm:block',
                      due?.urgency === 'overdue' && a.status !== 'Completed' ? 'text-ember' : 'text-ink-soft',
                    )}
                  >
                    {due ? due.text : a.due}
                  </span>
                  <div className="flex items-center gap-2">
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        const next = NEXT[a.status] ?? 'In Progress';
                        void updateAssignment(a.id, { status: next });
                        if (next === 'Completed') {
                          sfx.complete(1);
                          burst(e.clientX, e.clientY, 2);
                        } else sfx.tick();
                      }}
                      className={cx('chip min-w-[6.5rem] justify-center py-1 text-xs transition-colors', STATUS_STYLE[a.status])}
                      aria-label={`${a.name}: ${a.status}. Change status`}
                    >
                      {a.status}
                    </motion.button>
                    <ConfirmButton
                      label={`Delete "${a.name}"`}
                      className="text-xs text-ink-faint opacity-0 hover:text-ember group-hover:opacity-100 focus-visible:opacity-100"
                      onConfirm={() => void removeAssignment(a.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </ConfirmButton>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
          {sorted.length === 0 && <li className="py-8 text-center text-sm text-ink-faint">No coursework yet.</li>}
        </ul>
      </div>
      <Scratchpad />
      <AssignmentForm open={adding} onClose={() => setAdding(false)} />
    </div>
  );
};

const Scratchpad: React.FC = () => {
  const { notes, notesLoaded, saving, savedAt, saveNotes } = useNotes();
  const [text, setText] = useState(notes);
  const dirty = useRef(false);

  useEffect(() => {
    if (!dirty.current) setText(notes);
  }, [notes]);

  useEffect(() => {
    if (!dirty.current) return;
    const t = window.setTimeout(() => {
      dirty.current = false;
      void saveNotes(text);
    }, 700);
    return () => window.clearTimeout(t);
  }, [text, saveNotes]);

  return (
    <div className="pane flex flex-col p-5 sm:p-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="heading text-2xl">Field notes</h3>
        <span className="flex items-center gap-1.5 text-xs text-ink-faint" aria-live="polite">
          {saving ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" /> Saving
            </>
          ) : savedAt ? (
            <>
              <Check className="h-3 w-3 text-sage" /> Saved
            </>
          ) : null}
        </span>
      </div>
      <textarea
        value={text}
        disabled={!notesLoaded}
        onChange={(e) => {
          dirty.current = true;
          setText(e.target.value);
        }}
        placeholder="Supervision questions, readings to revisit, ideas for the next paper…"
        className="field scroll-soft min-h-[16rem] flex-1 resize-none font-sans text-[15px] leading-relaxed"
        data-lenis-prevent
      />
      <p className="mt-3 flex items-start gap-1.5 text-xs text-ink-faint">
        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Keep client names and identifying details out of these notes. This dashboard isn't a clinical record system.
      </p>
    </div>
  );
};

const AssignmentForm: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const add = useNotes((s) => s.addAssignment);
  const [form, setForm] = useState<Omit<Assignment, 'id'>>({ course: '', prof: '', name: '', due: '', weight: '', status: 'Not Started' });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });
  return (
    <Modal open={open} onClose={onClose} title="New assignment">
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.name.trim() || !form.course.trim()) return;
          void add({ ...form, name: form.name.trim(), course: form.course.trim() });
          setForm({ course: form.course, prof: form.prof, name: '', due: '', weight: '', status: 'Not Started' });
          onClose();
        }}
      >
        <input autoFocus className="field" placeholder="Assignment" value={form.name} onChange={set('name')} maxLength={255} required />
        <div className="grid grid-cols-2 gap-3">
          <input className="field" placeholder="Course" value={form.course} onChange={set('course')} maxLength={150} required />
          <input className="field" placeholder="Professor" value={form.prof} onChange={set('prof')} maxLength={150} />
          <label className="space-y-1">
            <span className="label">Due</span>
            <input type="date" className="field" value={form.due} onChange={set('due')} />
          </label>
          <label className="space-y-1">
            <span className="label">Weight</span>
            <input className="field" placeholder="20%" value={form.weight} onChange={set('weight')} maxLength={50} />
          </label>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-honey">
            Add assignment
          </button>
        </div>
      </form>
    </Modal>
  );
};
