import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { greeting, todayISO } from '../../lib/dates';
import { useAuth } from '../../store/auth';
import { useEvents } from '../../store/events';
import { useTasks } from '../../store/tasks';

export const Greeting: React.FC = () => {
  const user = useAuth((s) => s.user);
  const tasks = useTasks((s) => s.tasks);
  const events = useEvents((s) => s.events);
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(t);
  }, []);

  const today = todayISO(now);
  const due = tasks.filter((t) => !t.completed && t.due_date && t.due_date <= today).length;
  const todaysEvents = events.filter((e) => e.date === today).length;
  const name = user?.display_name || 'friend';
  const words = `${greeting(now)},`.split(' ');

  const summary = [
    due === 0 ? 'Nothing due' : `${due} due`,
    todaysEvents ? `${todaysEvents} event${todaysEvents === 1 ? '' : 's'}` : null,
  ]
    .filter(Boolean)
    .join(' and ');

  return (
    <div className="px-1 [text-shadow:0_1px_24px_rgb(var(--shade)/0.9)]">
      <h1 className="heading text-[2.6rem] leading-[1.02] sm:text-5xl">
        {words.map((w, i) => (
          <motion.span
            key={i}
            className="inline-block"
            initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay: 0.15 + i * 0.12, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            {w}&nbsp;
          </motion.span>
        ))}
        <br />
        <motion.span
          className="inline-block italic text-honey-deep dark:text-honey"
          style={{ fontVariationSettings: "'SOFT' 100, 'WONK' 1, 'opsz' 144" }}
          initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ delay: 0.45, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          {name}
        </motion.span>
      </h1>
      <motion.p
        className="mt-2 text-sm text-ink-soft"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.8 }}
      >
        {now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}. {summary} today.
      </motion.p>
    </div>
  );
};
