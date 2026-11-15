import React, { useMemo } from 'react';
import { CalendarDays, CheckCircle2, Clock } from 'lucide-react';
import { addDays, dueLabel, todayISO } from '../../lib/dates';
import type { CalendarEvent, Task } from '../../types';
import { cx } from '../ui/cx';

interface UpcomingWidgetProps {
  tasks: Task[];
  events: CalendarEvent[];
  onOpenTask: (t: Task) => void;
  className?: string;
  embedded?: boolean;
}

type FeedItem =
  | { type: 'task'; date: string; task: Task }
  | { type: 'event'; date: string; event: CalendarEvent };

export const UpcomingWidget: React.FC<UpcomingWidgetProps> = ({ tasks, events, onOpenTask, className, embedded = false }) => {
  const today = todayISO();
  const nextWeekEnd = addDays(today, 7);

  const upcomingItems = useMemo(() => {
    const items: FeedItem[] = [];

    // Tasks due in the next 7 days (starting tomorrow)
    tasks
      .filter((t) => !t.completed && t.due_date && t.due_date > today && t.due_date <= nextWeekEnd)
      .forEach((t) => items.push({ type: 'task', date: t.due_date!, task: t }));

    // Events in the next 7 days (starting tomorrow)
    events
      .filter((e) => e.date > today && e.date <= nextWeekEnd)
      .forEach((e) => items.push({ type: 'event', date: e.date, event: e }));

    // Sort by date, tasks before events on same day
    return items.sort((a, b) => a.date.localeCompare(b.date));
  }, [tasks, events, today, nextWeekEnd]);

  const content = (
    <>
      <div className="flex items-center justify-between">
        <h2 id="upcoming-heading" className="heading text-base">
          Coming Up
        </h2>
        <span className="tabular text-xs text-ink-faint">Next 7 days</span>
      </div>

      <ul className="scroll-soft -mx-1 mt-2.5 min-h-0 flex-1 space-y-1 overflow-y-auto px-1" data-lenis-prevent>
        {upcomingItems.map((item) => {
          const due = dueLabel(item.date, today);
          const isTask = item.type === 'task';

          return (
            <li
              key={isTask ? `t-${item.task.id}` : `e-${item.event.id}`}
              onClick={() => isTask && onOpenTask(item.task)}
              className={cx(
                'group flex items-center justify-between gap-2.5 rounded-md px-2.5 py-1.5 text-xs transition-colors',
                isTask
                  ? 'cursor-pointer hover:bg-ink/[0.04] border border-transparent hover:border-line/15'
                  : 'bg-ink/[0.02]',
              )}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {isTask ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-ink-faint group-hover:text-honey" />
                ) : (
                  <CalendarDays className="h-3.5 w-3.5 shrink-0 text-caramel" />
                )}
                <span className={cx('truncate font-medium', isTask ? 'text-ink' : 'text-ink-soft')}>
                  {isTask ? item.task.title : item.event.title}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 text-[11px] text-ink-faint">
                {isTask ? (
                  <span
                    className={cx(
                      'rounded px-1.5 py-0.5 font-medium tabular',
                      due.urgency === 'soon' ? 'text-caramel font-semibold' : 'text-ink-faint',
                    )}
                  >
                    {due.text}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 tabular">
                    <Clock className="h-3 w-3" />
                    <span>{due.text}</span>
                  </span>
                )}
              </div>
            </li>
          );
        })}

        {upcomingItems.length === 0 && (
          <li className="py-4 text-center text-xs text-ink-faint">Nothing scheduled for the coming week.</li>
        )}
      </ul>
    </>
  );

  if (embedded) {
    return <div className={cx('flex min-h-0 flex-col', className)}>{content}</div>;
  }

  return (
    <section className={cx('pane flex min-h-0 flex-col p-4 sm:p-5', className)} aria-labelledby="upcoming-heading">
      {content}
    </section>
  );
};
