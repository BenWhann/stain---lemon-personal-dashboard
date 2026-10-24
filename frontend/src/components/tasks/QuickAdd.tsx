import { forwardRef, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, CornerDownLeft, Plus, Tag, Zap } from 'lucide-react';
import { sfx } from '../../lib/audio';
import { formatShort } from '../../lib/dates';
import { parseQuickAdd } from '../../lib/quickAdd';
import { useTasks } from '../../store/tasks';
import type { TaskDraft } from '../../types';
import { cx } from '../ui/cx';

const HINTS = [
  'Add a task: "Read chapter 4 fri #school"',
  'Try "Pay car loan oct 15 #bills"',
  'Try "Supervision notes tomorrow !high #work"',
  'Try "Vet check-in for Lemon in 2 weeks #cats"',
];

interface QuickAddProps {
  defaults?: Partial<TaskDraft>;
  className?: string;
}

export const QuickAdd = forwardRef<HTMLInputElement, QuickAddProps>(({ defaults, className }, ref) => {
  const add = useTasks((s) => s.add);
  const [value, setValue] = useState('');
  const [hint, setHint] = useState(0);
  const [busy, setBusy] = useState(false);
  const parsed = useMemo(() => parseQuickAdd(value), [value]);

  useEffect(() => {
    const t = window.setInterval(() => setHint((h) => (h + 1) % HINTS.length), 5000);
    return () => window.clearInterval(t);
  }, []);

  const submit = async () => {
    if (!parsed.title || busy) return;
    setBusy(true);
    const created = await add({
      ...defaults,
      title: parsed.title,
      due_date: parsed.due_date ?? defaults?.due_date ?? null,
      priority: parsed.priority ?? defaults?.priority ?? 'Purr-fect',
      category: parsed.category ?? defaults?.category ?? 'Grad School',
    });
    setBusy(false);
    if (created) {
      sfx.pop();
      setValue('');
    }
  };

  return (
    <div className={className}>
      <label className="group flex items-center gap-2.5 rounded-2xl bg-ink/[0.05] px-3.5 py-2.5 ring-1 ring-transparent transition-all duration-300 focus-within:bg-ink/[0.07] focus-within:ring-honey/50">
        <Plus className="h-4 w-4 text-ink-faint transition-transform duration-300 group-focus-within:rotate-90 group-focus-within:text-honey" />
        <span className="sr-only">New task</span>
        <input
          ref={ref}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void submit();
            }
            if (e.key === 'Escape') (e.target as HTMLInputElement).blur();
          }}
          placeholder={HINTS[hint]}
          className="w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-faint/80"
          maxLength={255}
        />
        <AnimatePresence>
          {parsed.title && (
            <motion.kbd
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="hidden items-center gap-1 rounded-md bg-ink/10 px-1.5 py-0.5 text-[10px] text-ink-soft sm:flex"
            >
              <CornerDownLeft className="h-3 w-3" /> add
            </motion.kbd>
          )}
        </AnimatePresence>
      </label>
      <AnimatePresence>
        {parsed.tokens.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-1.5 overflow-hidden px-1 pt-2"
          >
            {parsed.tokens.map((t) => (
              <motion.span
                key={t.kind}
                layout
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={cx(
                  'chip',
                  t.kind === 'date' && 'bg-honey/20 text-honey-deep dark:text-honey',
                  t.kind === 'priority' && 'bg-ember/15 text-ember',
                  t.kind === 'category' && 'bg-sage/15 text-sage',
                )}
              >
                {t.kind === 'date' ? <CalendarDays className="h-3 w-3" /> : t.kind === 'priority' ? <Zap className="h-3 w-3" /> : <Tag className="h-3 w-3" />}
                {t.kind === 'date' ? formatShort(t.label) : t.label}
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
QuickAdd.displayName = 'QuickAdd';
