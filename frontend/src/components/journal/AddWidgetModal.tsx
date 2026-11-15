import React, { useMemo, useState } from 'react';
import {
  CheckSquare,
  Clock,
  Heart,
  Calendar,
  FileText,
  Bookmark,
  Sparkles,
  Plus,
  AlertCircle,
  BarChart3,
} from 'lucide-react';
import {
  AnalyticsMetric,
  AnalyticsTimeframe,
  AnalyticsVisual,
  useWidgets,
  WidgetType,
  WidgetWidth,
} from '../../store/widgets';
import { Modal } from '../ui/Modal';
import { cx } from '../ui/cx';

interface AddWidgetModalProps {
  open: boolean;
  onClose: () => void;
}

interface WidgetOption {
  type: WidgetType;
  title: string;
  description: string;
  defaultWidth: WidgetWidth;
  Icon: React.FC<{ className?: string }>;
}

const AVAILABLE_WIDGETS: WidgetOption[] = [
  {
    type: 'quests',
    title: 'Quests / Task Tracker',
    description: 'Track today’s tasks with quick-add, overdue highlights, and optional category filter.',
    defaultWidth: '2-col',
    Icon: CheckSquare,
  },
  {
    type: 'analytics',
    title: 'Custom Analytics & Visuals',
    description: 'Query task completions, focus hours, habit consistency, or study distribution with customizable charts.',
    defaultWidth: '2-col',
    Icon: BarChart3,
  },
  {
    type: 'quick-note',
    title: 'Study Scratchpad',
    description: 'A customizable live notepad for formulas, study priorities, or reminders.',
    defaultWidth: '1-col',
    Icon: FileText,
  },
  {
    type: 'timer',
    title: 'Focus Stopwatch',
    description: 'Pomodoro timer with sprint counter, pause/resume, and task linking.',
    defaultWidth: '1-col',
    Icon: Clock,
  },
  {
    type: 'habits',
    title: 'Daily Habits',
    description: 'Check off daily habits and build streaks with satisfying paw stamps.',
    defaultWidth: '1-col',
    Icon: Heart,
  },
  {
    type: 'week-strip',
    title: 'Week Ahead',
    description: '7-day rolling calendar strip with event markers and upcoming deadlines.',
    defaultWidth: '2-col',
    Icon: Calendar,
  },
  {
    type: 'sanctuary',
    title: 'Lemon & Stain Sanctuary',
    description: 'Pet Lemon and Stain, check level XP, and mix cozy ambient sounds.',
    defaultWidth: '1-col',
    Icon: Sparkles,
  },
  {
    type: 'upcoming',
    title: 'Coming Up Feed',
    description: 'Chronological timeline of everything scheduled for the next 7 days.',
    defaultWidth: '1-col',
    Icon: AlertCircle,
  },
  {
    type: 'bookmarks',
    title: 'Launchpad / Bookmarks',
    description: 'Direct shortcuts to Canvas, Google Drive, email, and study links.',
    defaultWidth: '2-col',
    Icon: Bookmark,
  },
];

export const AddWidgetModal: React.FC<AddWidgetModalProps> = ({ open, onClose }) => {
  const addWidget = useWidgets((s) => s.addWidget);
  const [selected, setSelected] = useState<WidgetType>('quests');
  const [customTitle, setCustomTitle] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [width, setWidth] = useState<WidgetWidth>('2-col');

  // Analytics query builder state
  const [analyticsMetric, setAnalyticsMetric] = useState<AnalyticsMetric>('tasks-completed');
  const [analyticsVisual, setAnalyticsVisual] = useState<AnalyticsVisual>('bar-chart');
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState<AnalyticsTimeframe>('14-days');

  const computedAnalyticsTitle = useMemo(() => {
    const prefix = categoryFilter !== 'All' ? `${categoryFilter} ` : '';
    switch (analyticsMetric) {
      case 'tasks-completed':
        return `${prefix}Tasks Completed`;
      case 'focus-time':
        return `${prefix}Focus Hours`;
      case 'habit-consistency':
        return 'Habit Consistency';
      case 'category-breakdown':
        return 'Tasks by Category';
      case 'completion-rate':
        return `${prefix}Completion Rate`;
      case 'velocity':
        return `${prefix}Productivity Velocity`;
      default:
        return 'Custom Analytics';
    }
  }, [analyticsMetric, categoryFilter]);

  const activeOption = AVAILABLE_WIDGETS.find((w) => w.type === selected)!;

  const handleSelect = (type: WidgetType) => {
    setSelected(type);
    const opt = AVAILABLE_WIDGETS.find((w) => w.type === type)!;
    setWidth(opt.defaultWidth);
    setCustomTitle('');
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle =
      customTitle.trim() ||
      (selected === 'analytics' ? computedAnalyticsTitle : activeOption.title);
    addWidget({
      type: selected,
      title: finalTitle,
      width,
      settings: {
        category: categoryFilter,
        taskFilter: 'today',
        noteTitle: customTitle.trim() || 'Study Scratchpad',
        noteContent:
          selected === 'quick-note' ? '• New study note\n• Write reminders here' : undefined,
        analyticsMetric,
        analyticsVisual,
        analyticsTimeframe,
      },
    });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add custom widget" width="lg">
      <form onSubmit={handleAdd} className="space-y-4">
        <div>
          <label className="label mb-2">Select widget type</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto scroll-soft p-1">
            {AVAILABLE_WIDGETS.map((opt) => {
              const isSel = selected === opt.type;
              const Icon = opt.Icon;
              return (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => handleSelect(opt.type)}
                  className={cx(
                    'flex items-start gap-2.5 p-2.5 text-left rounded-md border transition-colors',
                    isSel
                      ? 'border-honey bg-honey/[0.08] ring-1 ring-honey/40'
                      : 'border-line/15 bg-ink/[0.02] hover:bg-ink/[0.05]',
                  )}
                >
                  <span
                    className={cx(
                      'p-1.5 rounded-md shrink-0',
                      isSel ? 'bg-honey text-night' : 'bg-ink/10 text-ink-soft',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-ink leading-tight">{opt.title}</p>
                    <p className="text-[11px] text-ink-faint line-clamp-2 mt-0.5">
                      {opt.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Analytics Query Builder Section */}
        {selected === 'analytics' && (
          <div className="rounded-md border border-honey/30 bg-honey/[0.04] p-3.5 space-y-3.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-honey-deep dark:text-honey flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5" /> Configure analytics query &amp; visualization
              </p>
              <span className="text-[10px] text-ink-faint">Custom Visual Widget</span>
            </div>

            {/* Prominent Widget Title for Custom Analytics */}
            <div className="rounded-md border border-line/15 bg-surface/90 p-3 space-y-1.5 shadow-2xs">
              <label className="label mb-1 flex items-center justify-between">
                <span className="font-semibold text-xs text-ink">Widget title</span>
                <span className="text-[10px] font-normal text-ink-faint">Give this chart visual a custom name</span>
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder={computedAnalyticsTitle}
                className="field bg-surface text-xs font-medium"
              />
              <div className="mt-1.5 flex flex-wrap items-center gap-1 text-[10px] text-ink-soft">
                <span className="text-ink-faint">Suggestions:</span>
                {[
                  computedAnalyticsTitle,
                  'Weekly Momentum',
                  'Study Focus',
                  'Sprint Velocity',
                  'Daily Goals',
                ].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setCustomTitle(s)}
                    className={cx(
                      'px-1.5 py-0.5 rounded border transition-colors',
                      customTitle === s
                        ? 'border-honey bg-honey/20 font-semibold text-ink'
                        : 'border-line/20 bg-surface hover:bg-honey/10 hover:border-honey/40 text-ink-soft',
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label mb-1">Metric to measure</label>
                <select
                  value={analyticsMetric}
                  onChange={(e) => setAnalyticsMetric(e.target.value as AnalyticsMetric)}
                  className="field"
                >
                  <option value="tasks-completed">Tasks completed</option>
                  <option value="focus-time">Focus sprint hours</option>
                  <option value="habit-consistency">Habit consistency</option>
                  <option value="category-breakdown">Category breakdown</option>
                  <option value="completion-rate">On-time completion rate</option>
                  <option value="velocity">Productivity velocity</option>
                </select>
              </div>

              <div>
                <label className="label mb-1">Visualization style</label>
                <select
                  value={analyticsVisual}
                  onChange={(e) => setAnalyticsVisual(e.target.value as AnalyticsVisual)}
                  className="field"
                >
                  <option value="bar-chart">Column bar chart</option>
                  <option value="area-trend">Smooth area trend curve</option>
                  <option value="progress-ring">Progress ring / goal gauge</option>
                  <option value="stat-trend">KPI stat card with sparkline</option>
                  <option value="category-bars">Category distribution bars</option>
                </select>
              </div>

              <div>
                <label className="label mb-1">Time window</label>
                <select
                  value={analyticsTimeframe}
                  onChange={(e) => setAnalyticsTimeframe(e.target.value as AnalyticsTimeframe)}
                  className="field"
                >
                  <option value="7-days">Last 7 days (1 week)</option>
                  <option value="14-days">Last 14 days (2 weeks)</option>
                  <option value="30-days">Last 30 days (1 month)</option>
                </select>
              </div>

              <div>
                <label className="label mb-1">Filter by category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="field"
                >
                  <option value="All">All categories</option>
                  <option value="Grad School">Grad school only</option>
                  <option value="Work">Work only</option>
                  <option value="Bills">Bills only</option>
                  <option value="Personal">Personal only</option>
                  <option value="Wellness">Wellness only</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-line/15">
          {selected !== 'analytics' ? (
            <div>
              <label className="label mb-1">Widget title</label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder={activeOption.title}
                className="field"
              />
            </div>
          ) : (
            <div>
              <label className="label mb-1">Chart layout</label>
              <p className="text-xs text-ink-soft py-2">
                Showing <span className="font-semibold text-ink">{analyticsMetric.replace('-', ' ')}</span> as{' '}
                <span className="font-semibold text-ink">{analyticsVisual.replace('-', ' ')}</span>
              </p>
            </div>
          )}

          <div>
            <label className="label mb-1">Grid column width</label>
            <select
              value={width}
              onChange={(e) => setWidth(e.target.value as WidgetWidth)}
              className="field"
            >
              <option value="1-col">1 Column (Compact 1/3)</option>
              <option value="2-col">2 Columns (Standard 2/3)</option>
              <option value="3-col">3 Columns (Full Width)</option>
            </select>
          </div>
        </div>

        {selected === 'quests' && (
          <div>
            <label className="label mb-1">Filter by category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="field"
            >
              <option value="All">All categories</option>
              <option value="Grad School">Grad school only</option>
              <option value="Work">Work only</option>
              <option value="Bills">Bills only</option>
              <option value="Personal">Personal only</option>
            </select>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-line/15">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-honey">
            <Plus className="h-3.5 w-3.5" /> Add to dashboard
          </button>
        </div>
      </form>
    </Modal>
  );
};
