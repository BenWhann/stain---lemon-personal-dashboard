import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Flame, Plus, Trash2 } from 'lucide-react';
import { sfx } from '../../lib/audio';
import { burst } from '../../lib/celebrate';
import { lastNDays, parseISODate, todayISO } from '../../lib/dates';
import { useHabits } from '../../store/habits';
import { usePets } from '../../store/pets';
import { toast } from '../../store/toast';
import { PawIcon } from '../ui/PawCheck';
import { Modal } from '../ui/Modal';
import { ConfirmButton } from '../ui/ConfirmButton';
import { cx } from '../ui/cx';

const ICONS = ['🐾', '🏃‍♀️', '🥗', '📖', '💧', '🧘‍♀️', '☕', '💤', '✍️', '🎧', '🌿', '💊'];

export const HabitsPane: React.FC<{ className?: string }> = ({ className }) => {
  const { habits, setDay, add, remove } = useHabits();
  const [adding, setAdding] = useState(false);
  const today = todayISO();
  const days = lastNDays(7, today);

  const toggle = (habitId: number, day: string, done: boolean, e: React.MouseEvent) => {
    const habit = habits.find((h) => h.id === habitId);
    void setDay(habitId, day, done);
    if (done) {
      sfx.tick();
      burst(e.clientX, e.clientY, 1);
      const next = (habit?.streak ?? 0) + (day === today ? 1 : 0);
      if (day === today && next > 0 && next % 7 === 0) {
        usePets.getState().cheer();
        toast.reward(`${next}-day streak on "${habit?.name}". Keep it going.`);
      }
    }
  };

  return (
    <section className={cx('pane flex min-h-0 flex-col p-5', className)} aria-labelledby="habits-heading">
      <div className="flex items-center justify-between">
        <h2 id="habits-heading" className="heading text-xl">
          Habits
        </h2>
        <button type="button" className="btn-ghost h-8 !px-3 text-xs" onClick={() => setAdding(true)}>
          <Plus className="h-3.5 w-3.5" /> New
        </button>
      </div>
      <div className="mt-2 grid grid-cols-[1fr_repeat(7,1.35rem)] items-center gap-x-[3px] px-1 text-center text-[10px] text-ink-faint">
        <span />
        {days.map((d) => (
          <span key={d} className={d === today ? 'font-semibold text-honey' : ''}>
            {parseISODate(d)!.toLocaleDateString(undefined, { weekday: 'narrow' })}
          </span>
        ))}
      </div>
      <ul className="scroll-soft -mx-1 mt-1 min-h-0 flex-1 space-y-1 overflow-y-auto px-1" data-lenis-prevent>
        <AnimatePresence initial={false}>
          {habits.map((h) => {
            const set = new Set(h.checks);
            return (
              <motion.li
                key={h.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="group grid grid-cols-[1fr_repeat(7,1.35rem)] items-center gap-x-[3px] rounded-xl py-1.5"
              >
                <div className="flex min-w-0 items-center gap-2 pr-1">
                  <span className="text-base leading-none">{h.icon}</span>
                  <span className="min-w-0">
                    <span className="line-clamp-2 block text-[13px] leading-tight text-ink" title={h.name}>
                      {h.name}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-ink-faint">
                      <Flame className={cx('h-3 w-3', h.streak > 0 ? 'text-honey' : '')} />
                      {h.streak} day{h.streak === 1 ? '' : 's'}
                      <ConfirmButton
                        label={`Delete habit "${h.name}"`}
                        className="ml-1 opacity-0 transition-opacity hover:text-ember group-hover:opacity-100 focus-visible:opacity-100"
                        onConfirm={() => void remove(h.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </ConfirmButton>
                    </span>
                  </span>
                </div>
                {days.map((d) => {
                  const done = set.has(d);
                  return (
                    <motion.button
                      key={d}
                      type="button"
                      whileTap={{ scale: 0.8 }}
                      whileHover={{ scale: 1.12 }}
                      onClick={(e) => toggle(h.id, d, !done, e)}
                      aria-pressed={done}
                      aria-label={`${h.name}, ${parseISODate(d)!.toLocaleDateString(undefined, { weekday: 'long' })}`}
                      className={cx(
                        'grid h-[1.35rem] w-[1.35rem] place-items-center rounded-md transition-colors duration-300',
                        done ? 'text-night' : 'bg-ink/[0.06] text-ink/15 hover:bg-ink/10',
                        d === today && !done && 'ring-1 ring-honey/50',
                      )}
                      style={done ? { background: 'linear-gradient(160deg, rgb(var(--honey)), rgb(var(--honey-deep)))', boxShadow: '0 0 10px -2px rgb(var(--honey) / 0.7)' } : undefined}
                    >
                      <PawIcon className="h-3 w-3" />
                    </motion.button>
                  );
                })}
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
      <NewHabit open={adding} onClose={() => setAdding(false)} onSave={(n, i) => void add(n, i)} />
    </section>
  );
};

const NewHabit: React.FC<{ open: boolean; onClose: () => void; onSave: (name: string, icon: string) => void }> = ({ open, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(ICONS[0]);
  return (
    <Modal open={open} onClose={onClose} title="New habit" description="Something small you want to do every day." width="sm">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          onSave(name.trim(), icon);
          setName('');
          onClose();
        }}
      >
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Read for 20 minutes" className="field" maxLength={255} />
        <div className="flex flex-wrap gap-1.5">
          {ICONS.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIcon(i)}
              aria-pressed={icon === i}
              className={cx('grid h-9 w-9 place-items-center rounded-xl text-lg transition-all', icon === i ? 'bg-honey/30 ring-2 ring-honey' : 'bg-ink/5 hover:bg-ink/10')}
            >
              {i}
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-honey" disabled={!name.trim()}>
            Add habit
          </button>
        </div>
      </form>
    </Modal>
  );
};
