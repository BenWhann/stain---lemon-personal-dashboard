import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Pause, Play, RotateCcw, SkipForward, X } from 'lucide-react';
import { useTasks } from '../../store/tasks';
import { formatClock, MODE_LABEL, TimerMode, useTimer } from '../../store/timer';
import { Segmented } from '../ui/Segmented';
import { cx } from '../ui/cx';

const R = 92;
const C = 2 * Math.PI * R;

export const TimerPane: React.FC<{ className?: string }> = ({ className }) => {
  const { mode, minutes, running, remaining, linkedTaskId, focusStreak, start, pause, reset, skip, setMode, link } = useTimer();
  const linked = useTasks((s) => s.tasks.find((t) => t.id === linkedTaskId));
  const total = minutes[mode] * 60;
  const progress = total > 0 ? 1 - remaining / total : 0;
  const angle = progress * 2 * Math.PI - Math.PI / 2;
  const knob = { x: 110 + R * Math.cos(angle), y: 110 + R * Math.sin(angle) };
  const [mm, ss] = formatClock(remaining).split(':');

  return (
    <section id="focus-timer" className={cx('pane flex flex-col items-center px-6 pb-5 pt-5', className)} aria-label="Focus timer">
      <Segmented<TimerMode>
        label="Timer mode"
        size="sm"
        value={mode}
        onChange={setMode}
        options={(['focus', 'short', 'long'] as TimerMode[]).map((m) => ({
          value: m,
          label: MODE_LABEL[m],
          title: `${minutes[m]} minutes`,
        }))}
      />

      <div className="relative mt-3 aspect-square w-[min(15rem,100%)]">
        {/* soft halo that breathes while the timer runs */}
        <motion.div
          className="absolute inset-6 rounded-full"
          style={{ background: 'radial-gradient(circle, rgb(var(--honey) / 0.35), transparent 70%)' }}
          animate={running ? { scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] } : { scale: 1, opacity: 0.35 }}
          transition={running ? { duration: 4, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.6 }}
        />
        <svg viewBox="0 0 220 220" className="relative h-full w-full -rotate-0">
          <defs>
            <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="rgb(var(--honey))" />
              <stop offset="1" stopColor="rgb(var(--caramel))" />
            </linearGradient>
          </defs>
          <circle cx={110} cy={110} r={R + 12} fill="rgb(var(--surface-strong) / 0.55)" />
          <circle cx={110} cy={110} r={R} stroke="rgb(var(--ink) / 0.1)" strokeWidth={8} fill="none" />
          {/* minute ticks */}
          {Array.from({ length: 60 }, (_, i) => {
            const a = (i / 60) * 2 * Math.PI;
            const r1 = R - 14;
            const r2 = i % 5 === 0 ? R - 20 : R - 17;
            return (
              <line
                key={i}
                x1={110 + r1 * Math.sin(a)}
                y1={110 - r1 * Math.cos(a)}
                x2={110 + r2 * Math.sin(a)}
                y2={110 - r2 * Math.cos(a)}
                stroke="rgb(var(--ink) / 0.18)"
                strokeWidth={i % 5 === 0 ? 1.4 : 0.8}
              />
            );
          })}
          <circle
            cx={110}
            cy={110}
            r={R}
            stroke="url(#ring-grad)"
            strokeWidth={8}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - progress)}
            transform="rotate(-90 110 110)"
            style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(.22,1,.36,1)', filter: 'drop-shadow(0 0 6px rgb(var(--honey) / 0.6))' }}
          />
          {progress > 0.002 && (
            <circle cx={knob.x} cy={knob.y} r={7} fill="rgb(var(--honey))" style={{ transition: 'cx 900ms, cy 900ms', filter: 'drop-shadow(0 0 8px rgb(var(--honey)))' }} />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="heading tabular flex items-baseline text-[3.4rem] leading-none" aria-live="off">
            <Digits value={mm} />
            <motion.span animate={running ? { opacity: [1, 0.25, 1] } : { opacity: 1 }} transition={{ duration: 1, repeat: running ? Infinity : 0 }}>
              :
            </motion.span>
            <Digits value={ss} />
          </div>
          <div className="mt-2 flex gap-1.5" aria-label={`${focusStreak % 4} of 4 sprints in this round`}>
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={cx('h-1.5 w-1.5 rounded-full transition-colors', i < focusStreak % 4 ? 'bg-honey' : 'bg-ink/20')} />
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={linked?.id ?? 'none'}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="mt-1 flex max-w-full items-center gap-1.5 text-sm text-ink-soft"
        >
          {linked ? (
            <>
              <span className="truncate">On: {linked.title}</span>
              <button type="button" aria-label="Stop tracking this task" className="text-ink-faint hover:text-ink" onClick={() => link(null)}>
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <span className="text-ink-faint">{mode === 'focus' ? 'Tip: link a task with its timer icon' : 'Stretch, sip, pet a cat'}</span>
          )}
        </motion.p>
      </AnimatePresence>

      <div className="mt-3 flex items-center gap-2">
        <button type="button" className="btn-ghost h-10 w-10 !p-0" onClick={reset} aria-label="Reset timer" title="Reset">
          <RotateCcw className="h-4 w-4" />
        </button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.94 }}
          className="btn-honey h-11 min-w-[8.5rem] text-base"
          onClick={running ? pause : start}
        >
          {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
          {running ? 'Pause' : remaining < total ? 'Resume' : 'Start'}
        </motion.button>
        <button type="button" className="btn-ghost h-10 w-10 !p-0" onClick={skip} aria-label="Finish this block now" title="Finish now">
          <SkipForward className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
};

/** Each digit rolls up when it changes, like a flip clock. */
const Digits: React.FC<{ value: string }> = ({ value }) => (
  <span className="inline-flex">
    {value.split('').map((d, i) => (
      <span key={i} className="relative inline-block w-[0.62em] overflow-hidden text-center">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={d}
            className="inline-block"
            initial={{ y: '-60%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '60%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
          >
            {d}
          </motion.span>
        </AnimatePresence>
      </span>
    ))}
  </span>
);
