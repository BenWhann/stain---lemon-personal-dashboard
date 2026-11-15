import React from 'react';
import { Briefcase, GraduationCap, Heart, Receipt, Tag, Zap, Coffee, Moon, AlertCircle, Clock } from 'lucide-react';
import { dueLabel, todayISO } from '../../lib/dates';
import { cx } from '../ui/cx';

export const CATEGORY_ICON: Record<string, React.FC<{ className?: string }>> = {
  'Grad School': GraduationCap,
  Work: Briefcase,
  Bills: Receipt,
  Personal: Heart,
};

export const PRIORITY_META: Record<string, { label: string; hint: string; tone: string; Icon: React.FC<{ className?: string }> }> = {
  Zoomies: { label: 'High priority', hint: 'High priority task', tone: 'text-ember', Icon: Zap },
  'Purr-fect': { label: 'Normal', hint: 'Normal priority', tone: 'text-ink-soft', Icon: Coffee },
  Catnap: { label: 'Low priority', hint: 'Low priority task', tone: 'text-ink-faint', Icon: Moon },
};

export const PriorityChip: React.FC<{ priority: string; className?: string }> = ({ priority, className }) => {
  const meta = PRIORITY_META[priority] ?? PRIORITY_META['Purr-fect'];
  const Icon = meta.Icon;
  if (priority === 'Purr-fect') return null; // normal doesn't need loud badge
  return (
    <span className={cx('inline-flex items-center gap-1 text-xs font-medium', meta.tone, className)} title={meta.hint}>
      <Icon className="h-3 w-3 shrink-0" />
      <span>{meta.label}</span>
    </span>
  );
};

export const DueChip: React.FC<{ due: string | null | undefined; done?: boolean }> = ({ due, done }) => {
  if (!due) return null;
  const { text, urgency } = dueLabel(due, todayISO());
  
  if (done) {
    return <span className="text-xs text-ink-faint tabular line-through">{text}</span>;
  }
  if (urgency === 'overdue') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-ember tabular">
        <AlertCircle className="h-3 w-3 shrink-0" />
        {text}
      </span>
    );
  }
  if (urgency === 'today') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-honey-deep dark:text-honey tabular">
        <Clock className="h-3 w-3 shrink-0" />
        {text}
      </span>
    );
  }
  return <span className="text-xs text-ink-faint tabular">{text}</span>;
};

export const CategoryLabel: React.FC<{ category: string }> = ({ category }) => {
  const Icon = CATEGORY_ICON[category] ?? Tag;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-ink-faint">
      <Icon className="h-3 w-3 shrink-0" />
      <span>{category}</span>
    </span>
  );
};
