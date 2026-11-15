import React, { useEffect, useState } from 'react';
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

  const summary = [
    due === 0 ? 'Nothing due' : `${due} due`,
    todaysEvents ? `${todaysEvents} event${todaysEvents === 1 ? '' : 's'}` : null,
  ]
    .filter(Boolean)
    .join(' and ');

  return (
    <div className="px-1 py-1">
      <h1 className="heading text-2xl sm:text-3xl font-medium tracking-tight text-ink">
        {greeting(now)}, <span className="text-honey-deep dark:text-honey">{name}</span>
      </h1>
      <p className="mt-1 text-xs text-ink-soft">
        {now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} · {summary} today.
      </p>
    </div>
  );
};
