import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3, BookOpen, CalendarDays, CheckCircle2, Heart, Kanban, Link2, Moon, Plus, RefreshCw, Search, Settings, Sparkles, Timer,
} from 'lucide-react';
import { sfx } from '../../lib/audio';
import { useParade } from '../../store/parade';
import { usePets } from '../../store/pets';
import { useTasks } from '../../store/tasks';
import { useTimer } from '../../store/timer';
import { useUi } from '../../store/ui';
import type { Task } from '../../types';
import { DueChip } from '../tasks/meta';
import { cx } from '../ui/cx';

interface Item {
  id: string;
  label: string;
  hint?: string;
  icon: React.FC<{ className?: string }>;
  run: () => void;
  task?: Task;
}

interface Props {
  onNewTask: () => void;
  onOpenTask: (t: Task) => void;
  onToggleTheme: () => void;
}

export const CommandPalette: React.FC<Props> = ({ onNewTask, onOpenTask, onToggleTheme }) => {
  const { paletteOpen: open, setPaletteOpen, setView } = useUi();
  const tasks = useTasks((s) => s.tasks);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const close = () => setPaletteOpen(false);

  useEffect(() => {
    if (open) {
      setQ('');
      setActive(0);
      window.setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  const goTo = (id: string) => {
    setView('journal');
    window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 60);
  };

  const actions: Item[] = useMemo(
    () => [
      { id: 'new', label: 'New task', hint: 'N', icon: Plus, run: onNewTask },
      {
        id: 'timer',
        label: useTimer.getState().running ? 'Pause the focus timer' : 'Start a focus sprint',
        hint: 'F',
        icon: Timer,
        run: () => (useTimer.getState().running ? useTimer.getState().pause() : useTimer.getState().start()),
      },
      { id: 'theme', label: 'Switch day and night', hint: 'L', icon: Moon, run: onToggleTheme },
      { id: 'board', label: 'Go to the board', icon: Kanban, run: () => goTo('board') },
      { id: 'cal', label: 'Go to the calendar', icon: CalendarDays, run: () => goTo('calendar') },
      { id: 'study', label: 'Go to study hall', icon: BookOpen, run: () => goTo('study') },
      { id: 'links', label: 'Go to the launchpad', icon: Link2, run: () => goTo('links') },
      { id: 'insights', label: 'Open insights', icon: BarChart3, run: () => setView('insights') },
      { id: 'settings', label: 'Open settings', icon: Settings, run: () => setView('settings') },
      { id: 'sync', label: 'Sync from Google Sheet', icon: RefreshCw, run: () => void useTasks.getState().syncSheet(true) },
      { id: 'pet-l', label: 'Pet Lemon', icon: Heart, run: () => { usePets.getState().pet('lemon'); sfx.purr('lemon'); } },
      { id: 'pet-s', label: 'Pet Stain', icon: Heart, run: () => { usePets.getState().pet('stain'); sfx.purr('stain'); } },
      { id: 'zoomies', label: 'Zoomies!', hint: 'The cats do a lap', icon: Sparkles, run: () => useParade.getState().start(['stain', 'lemon']) },
    ],
    // rebuilt each time the palette opens so labels like Start/Pause are current
    [open],
  );

  const items: Item[] = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const acts = actions.filter((a) => !needle || a.label.toLowerCase().includes(needle));
    const found = needle
      ? tasks
          .filter((t) => `${t.title} ${t.notes ?? ''} ${t.category}`.toLowerCase().includes(needle))
          .slice(0, 8)
          .map<Item>((t) => ({ id: `t${t.id}`, label: t.title, icon: CheckCircle2, run: () => onOpenTask(t), task: t }))
      : [];
    return [...found, ...acts];
  }, [q, actions, tasks, onOpenTask]);

  useEffect(() => {
    setActive(0);
  }, [q]);

  const run = (item: Item) => {
    close();
    window.setTimeout(item.run, 40);
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[75] flex items-start justify-center px-4 pt-[14vh]" data-lenis-prevent>
          <motion.div className="absolute inset-0 bg-night/45 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Quick actions"
            className="pane-solid relative w-full max-w-xl overflow-hidden !p-0"
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          >
            <div className="flex items-center gap-3 border-b border-ink/10 px-5 py-4">
              <Search className="h-5 w-5 text-ink-faint" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setActive((a) => Math.min(items.length - 1, a + 1));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setActive((a) => Math.max(0, a - 1));
                  } else if (e.key === 'Enter' && items[active]) {
                    e.preventDefault();
                    run(items[active]);
                  } else if (e.key === 'Escape') close();
                }}
                placeholder="Search tasks or type a command"
                className="w-full bg-transparent text-lg text-ink outline-none placeholder:text-ink-faint"
                role="combobox"
                aria-expanded="true"
                aria-controls="palette-list"
                aria-activedescendant={items[active] ? `pal-${items[active].id}` : undefined}
              />
            </div>
            <ul id="palette-list" role="listbox" className="scroll-soft max-h-[50vh] overflow-y-auto p-2">
              {items.map((item, i) => {
                const Icon = item.icon;
                return (
                  <li
                    key={item.id}
                    id={`pal-${item.id}`}
                    role="option"
                    aria-selected={i === active}
                    onMouseMove={() => setActive(i)}
                    onClick={() => run(item)}
                    className={cx(
                      'relative flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-150',
                      i === active ? 'bg-honey/15 text-ink' : 'text-ink-soft',
                    )}
                  >
                    <Icon className={cx('relative h-4 w-4', i === active ? 'text-honey' : 'text-ink-faint')} />
                    <span className="relative flex-1 truncate">{item.label}</span>
                    {item.task && <span className="relative"><DueChip due={item.task.due_date} done={item.task.completed} /></span>}
                    {item.hint && <span className="relative text-xs text-ink-faint">{item.hint}</span>}
                  </li>
                );
              })}
              {items.length === 0 && <li className="px-3 py-8 text-center text-sm text-ink-faint">Nothing matches "{q}".</li>}
            </ul>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
};
