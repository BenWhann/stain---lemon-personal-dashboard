import React from 'react';
import { Briefcase, GraduationCap, Heart, Receipt, Tag, Zap, Coffee, Moon } from 'lucide-react';
import { dueLabel, todayISO } from '../../lib/dates';
import { cx } from '../ui/cx';

export const CATEGORY_ICON: Record<string, React.FC<{ className?: string }>> = {
  'Grad School': GraduationCap,
  Work: Briefcase,
  Bills: Receipt,
  Personal: Heart,
};

export const PRIORITY_META: Record<string, { label: string; hint: string; tone: string; Icon: React.FC<{ className?: string }> }> = {
  Zoomies: { label: 'Zoomies', hint: 'High priority', tone: 'text-ember bg-ember/15', Icon: Zap },
  'Purr-fect': { label: 'Purr-fect', hint: 'Normal priority', tone: 'text-honey-deep dark:text-honey bg-honey/15', Icon: Coffee },
  Catnap: { label: 'Catnap', hint: 'Low priority', tone: 'text-sage bg-sage/15', Icon: Moon },
};

export const PriorityChip: React.FC<{ priority: string; className?: string }> = ({ priority, className }) => {
  const meta = PRIORITY_META[priority] ?? PRIORITY_META['Purr-fect'];
  const Icon = meta.Icon;
  return (
    <span className={cx('chip', meta.tone, className)} title={meta.hint}>
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
};

export const DueChip: React.FC<{ due: string | null | undefined; done?: boolean }> = ({ due, done }) => {
  if (!due) return null;
  const { text, urgency } = dueLabel(due, todayISO());
  return (
    <span
      className={cx(
        'chip',
        done
          ? 'bg-ink/5 text-ink-faint'
          : urgency === 'overdue'
            ? 'bg-ember/15 text-ember'
            : urgency === 'today'
              ? 'bg-honey/20 text-honey-deep dark:text-honey'
              : urgency === 'soon'
                ? 'bg-caramel/15 text-caramel'
                : 'bg-ink/[0.06] text-ink-soft',
      )}
    >
      {text}
    </span>
  );
};

export const CategoryLabel: React.FC<{ category: string }> = ({ category }) => {
  const Icon = CATEGORY_ICON[category] ?? Tag;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-ink-faint">
      <Icon className="h-3 w-3" />
      {category}
    </span>
  );
};
