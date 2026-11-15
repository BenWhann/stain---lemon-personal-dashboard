import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart2,
  TrendingUp,
  CircleDot,
  Hash,
  ListOrdered,
  Sparkles,
} from 'lucide-react';
import {
  addDays,
  formatLong,
  formatShort,
  lastNDays,
  todayISO,
  utcStampToLocalISO,
} from '../../lib/dates';
import { sfx } from '../../lib/audio';
import { useHabits } from '../../store/habits';
import { useTasks } from '../../store/tasks';
import { useTimer } from '../../store/timer';
import {
  AnalyticsMetric,
  AnalyticsTimeframe,
  AnalyticsVisual,
  useWidgets,
  WidgetConfig,
} from '../../store/widgets';
import { cx } from '../ui/cx';

interface CustomAnalyticsWidgetProps {
  id: string;
  title?: string;
  settings?: WidgetConfig['settings'];
}

export const CustomAnalyticsWidget: React.FC<CustomAnalyticsWidgetProps> = ({
  id,
  title,
  settings,
}) => {
  const updateWidget = useWidgets((s) => s.updateWidget);
  const tasks = useTasks((s) => s.tasks);
  const habits = useHabits((s) => s.habits);
  const sessions = useTimer((s) => s.sessions);

  // Settings with sensible defaults
  const metric: AnalyticsMetric = settings?.analyticsMetric || 'tasks-completed';
  const visual: AnalyticsVisual = settings?.analyticsVisual || 'bar-chart';
  const timeframe: AnalyticsTimeframe = settings?.analyticsTimeframe || '14-days';
  const categoryFilter = settings?.category || 'All';

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const numDays = timeframe === '7-days' ? 7 : timeframe === '30-days' ? 30 : 14;
  const today = todayISO();
  const days = useMemo(() => lastNDays(numDays, today), [numDays, today]);

  // Handle quick setting updates
  const setTimeframe = (tf: AnalyticsTimeframe) => {
    updateWidget(id, { settings: { ...settings, analyticsTimeframe: tf } });
    try {
      sfx.tick();
    } catch {}
  };

  const setVisual = (v: AnalyticsVisual) => {
    updateWidget(id, { settings: { ...settings, analyticsVisual: v } });
    try {
      sfx.pop();
    } catch {}
  };

  // 1. Data Aggregation based on metric
  const filteredTasks = useMemo(() => {
    if (categoryFilter === 'All') return tasks;
    return tasks.filter((t) => t.category === categoryFilter);
  }, [tasks, categoryFilter]);

  // Daily series data
  const seriesData = useMemo(() => {
    if (metric === 'tasks-completed') {
      const counts = new Map<string, number>();
      filteredTasks.forEach((t) => {
        if (t.completed && t.completed_at) {
          const d = utcStampToLocalISO(t.completed_at);
          if (d) counts.set(d, (counts.get(d) ?? 0) + 1);
        }
      });
      return days.map((d) => ({
        key: d,
        label: formatShort(d),
        value: counts.get(d) ?? 0,
        detail: `${formatLong(d)}: ${counts.get(d) ?? 0} completed`,
      }));
    }

    if (metric === 'focus-time') {
      const mins = new Map<string, number>();
      sessions.forEach((s) => {
        mins.set(s.date, (mins.get(s.date) ?? 0) + s.minutes);
      });
      return days.map((d) => ({
        key: d,
        label: formatShort(d),
        value: mins.get(d) ?? 0,
        detail: `${formatLong(d)}: ${mins.get(d) ?? 0} focus mins`,
      }));
    }

    if (metric === 'habit-consistency') {
      const m = new Map<string, number>();
      habits.forEach((h) => {
        h.checks.forEach((chk) => m.set(chk, (m.get(chk) ?? 0) + 1));
      });
      return days.map((d) => ({
        key: d,
        label: formatShort(d),
        value: m.get(d) ?? 0,
        detail: `${formatLong(d)}: ${m.get(d) ?? 0} of ${habits.length} habits`,
      }));
    }

    if (metric === 'velocity') {
      // 3-day moving average of task completion
      const counts = new Map<string, number>();
      filteredTasks.forEach((t) => {
        if (t.completed && t.completed_at) {
          const d = utcStampToLocalISO(t.completed_at);
          if (d) counts.set(d, (counts.get(d) ?? 0) + 1);
        }
      });
      return days.map((d) => {
        const c0 = counts.get(d) ?? 0;
        const c1 = counts.get(addDays(d, -1)) ?? 0;
        const c2 = counts.get(addDays(d, -2)) ?? 0;
        const avg = Math.round(((c0 + c1 + c2) / 3) * 10) / 10;
        return {
          key: d,
          label: formatShort(d),
          value: avg,
          detail: `${formatLong(d)}: ${avg} tasks/day avg pace`,
        };
      });
    }

    return [];
  }, [metric, filteredTasks, sessions, habits, days]);

  // Category breakdown data
  const categoryData = useMemo(() => {
    const counts = new Map<string, number>();
    filteredTasks.forEach((t) => {
      const cat = t.category || 'General';
      counts.set(cat, (counts.get(cat) ?? 0) + 1);
    });
    const total = filteredTasks.length || 1;
    return Array.from(counts.entries())
      .map(([cat, count]) => ({
        label: cat,
        count,
        percent: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredTasks]);

  // Overall metric totals & rates
  const totalValue = useMemo(() => {
    return seriesData.reduce((acc, d) => acc + d.value, 0);
  }, [seriesData]);

  const completionStats = useMemo(() => {
    const total = filteredTasks.length;
    const completed = filteredTasks.filter((t) => t.completed).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const overdue = filteredTasks.filter(
      (t) => !t.completed && t.due_date && t.due_date < today
    ).length;
    return { total, completed, rate, overdue };
  }, [filteredTasks, today]);

  // Smart default display title
  const displayTitle = useMemo(() => {
    if (title && title !== 'Custom Analytics') return title;
    const catPrefix = categoryFilter !== 'All' ? `${categoryFilter} ` : '';
    switch (metric) {
      case 'tasks-completed':
        return `${catPrefix}Tasks Completed`;
      case 'focus-time':
        return `${catPrefix}Focus Hours`;
      case 'habit-consistency':
        return 'Habit Consistency';
      case 'category-breakdown':
        return 'Tasks by Category';
      case 'completion-rate':
        return `${catPrefix}Completion Rate`;
      case 'velocity':
        return `${catPrefix}Productivity Velocity`;
      default:
        return 'Custom Analytics';
    }
  }, [title, metric, categoryFilter]);

  // Render Visual Types
  const renderVisualContent = () => {
    // 1. Progress Ring / Goal Gauge
    if (visual === 'progress-ring') {
      const percentage =
        metric === 'completion-rate'
          ? completionStats.rate
          : metric === 'habit-consistency' && habits.length > 0
          ? Math.min(
              100,
              Math.round((totalValue / (habits.length * days.length)) * 100)
            )
          : Math.min(100, Math.round((totalValue / Math.max(1, numDays * 2)) * 100));

      const radius = 54;
      const circumference = 2 * Math.PI * radius;
      const offset = circumference - (percentage / 100) * circumference;

      return (
        <div className="flex flex-col items-center justify-center py-3">
          <div className="relative grid h-36 w-36 place-items-center">
            <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 128 128">
              <circle
                cx="64"
                cy="64"
                r={radius}
                className="stroke-line/15"
                strokeWidth="10"
                fill="transparent"
              />
              <motion.circle
                cx="64"
                cy="64"
                r={radius}
                className="stroke-honey transition-all"
                strokeWidth="10"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute text-center">
              <span className="font-display text-2xl font-bold text-ink tabular-nums">
                {percentage}%
              </span>
              <span className="block text-[11px] font-medium text-ink-faint">
                {metric === 'completion-rate'
                  ? 'Completed'
                  : metric === 'focus-time'
                  ? 'Goal progress'
                  : 'Consistency'}
              </span>
            </div>
          </div>
          <div className="mt-2 text-center text-xs text-ink-soft">
            {metric === 'completion-rate' ? (
              <span>
                {completionStats.completed} of {completionStats.total} tasks finished
                {completionStats.overdue > 0 && ` • ${completionStats.overdue} overdue`}
              </span>
            ) : metric === 'focus-time' ? (
              <span>{(totalValue / 60).toFixed(1)} focus hours logged</span>
            ) : (
              <span>{totalValue} habit checks completed</span>
            )}
          </div>
        </div>
      );
    }

    // 2. Stat Card with Trend
    if (visual === 'stat-trend') {
      const primaryDisplay =
        metric === 'focus-time'
          ? totalValue >= 60
            ? `${(totalValue / 60).toFixed(1)} hrs`
            : `${totalValue} min`
          : metric === 'velocity'
          ? `${(totalValue / numDays).toFixed(1)} / day`
          : `${totalValue} tasks`;

      // Simple sparkline points
      const maxVal = Math.max(1, ...seriesData.map((d) => d.value));
      const points = seriesData
        .map((d, i) => {
          const x = (i / (seriesData.length - 1)) * 140;
          const y = 36 - (d.value / maxVal) * 30;
          return `${x},${y}`;
        })
        .join(' ');

      return (
        <div className="flex flex-col justify-between py-2">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-[11px] font-medium text-ink-faint uppercase">
                {timeframe.replace('-', ' ')}
              </p>
              <p className="font-display text-3xl font-bold text-ink tabular-nums mt-0.5">
                {primaryDisplay}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded bg-sage/15 px-2 py-0.5 text-xs font-semibold text-sage">
              <TrendingUp className="h-3 w-3" /> Active
            </span>
          </div>

          <div className="mt-4 flex items-end justify-between border-t border-line/15 pt-3">
            <div>
              <span className="text-xs text-ink-soft font-medium">Daily average:</span>
              <span className="ml-1 text-xs font-semibold text-ink tabular-nums">
                {metric === 'focus-time'
                  ? `${Math.round(totalValue / numDays)} min/day`
                  : `${(totalValue / numDays).toFixed(1)} tasks/day`}
              </span>
            </div>
            {/* Inline Mini Sparkline */}
            <svg viewBox="0 0 140 40" className="h-8 w-28 overflow-visible">
              <polyline
                fill="none"
                stroke="rgb(var(--honey))"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
              />
            </svg>
          </div>
        </div>
      );
    }

    // 3. Category Breakdown Ranked Horizontal Bars
    if (visual === 'category-bars' || metric === 'category-breakdown') {
      return (
        <div className="space-y-2.5 py-1">
          {categoryData.length === 0 ? (
            <p className="text-xs text-ink-faint py-4 text-center">No category data yet.</p>
          ) : (
            categoryData.slice(0, 5).map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-ink flex items-center gap-1.5">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{
                        backgroundColor:
                          item.label === 'Grad School'
                            ? 'var(--cat-academic)'
                            : item.label === 'Work'
                            ? 'var(--cat-work)'
                            : item.label === 'Bills'
                            ? 'var(--cat-bills)'
                            : item.label === 'Wellness'
                            ? 'var(--cat-wellness)'
                            : 'var(--honey)',
                      }}
                    />
                    {item.label}
                  </span>
                  <span className="text-ink-faint tabular-nums text-[11px]">
                    {item.count} items ({item.percent}%)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-line/15">
                  <motion.div
                    className="h-full rounded-full bg-honey"
                    initial={{ width: 0 }}
                    animate={{ width: `${item.percent}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      );
    }

    // 4. Smooth Area Trend Curve
    if (visual === 'area-trend') {
      const W = 400;
      const H = 130;
      const pad = { t: 15, b: 24, l: 20, r: 20 };
      const maxVal = Math.max(1, ...seriesData.map((d) => d.value));

      const points = seriesData.map((d, i) => {
        const x = pad.l + (i / Math.max(1, seriesData.length - 1)) * (W - pad.l - pad.r);
        const y = pad.t + (1 - d.value / maxVal) * (H - pad.t - pad.b);
        return { x, y, data: d };
      });

      const lineD = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'}${p.x},${p.y}`, '');
      const areaD = `${lineD} L${points[points.length - 1]?.x || W},${H - pad.b} L${points[0]?.x || 0},${H - pad.b} Z`;

      return (
        <div className="relative">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
            <defs>
              <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(var(--honey))" stopOpacity="0.35" />
                <stop offset="100%" stopColor="rgb(var(--honey))" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            {/* Soft Area Gradient */}
            <path d={areaD} fill={`url(#grad-${id})`} />
            {/* Primary Curve */}
            <path
              d={lineD}
              fill="none"
              stroke="rgb(var(--honey))"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Hover Circles & Data points */}
            {points.map((p, i) => (
              <circle
                key={p.data.key}
                cx={p.x}
                cy={p.y}
                r={hoverIndex === i ? 4 : 2.5}
                className={cx(
                  'transition-all',
                  hoverIndex === i ? 'fill-honey stroke-surface stroke-2' : 'fill-honey/60'
                )}
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
              />
            ))}
          </svg>

          {/* Hover Tooltip */}
          {hoverIndex !== null && seriesData[hoverIndex] && (
            <div className="pane-solid absolute -top-4 left-1/2 -translate-x-1/2 rounded px-2.5 py-1 text-xs text-ink shadow-sm pointer-events-none">
              <span className="font-semibold">{seriesData[hoverIndex].value}</span>{' '}
              <span className="text-ink-faint">({seriesData[hoverIndex].label})</span>
            </div>
          )}

          <div className="mt-1 flex items-center justify-between text-[11px] text-ink-faint">
            <span>{seriesData[0]?.label}</span>
            <span className="font-medium text-ink">
              Total: {metric === 'focus-time' ? `${(totalValue / 60).toFixed(1)} hrs` : totalValue}
            </span>
            <span>{seriesData[seriesData.length - 1]?.label}</span>
          </div>
        </div>
      );
    }

    // 5. Default: Column Bar Chart
    const W = 400;
    const H = 130;
    const pad = { t: 15, b: 24, l: 20, r: 20 };
    const maxVal = Math.max(1, ...seriesData.map((d) => d.value));
    const band = (W - pad.l - pad.r) / Math.max(1, seriesData.length);
    const barW = Math.max(4, Math.min(18, band * 0.65));

    return (
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
          {/* Baseline grid line */}
          <line
            x1={pad.l}
            x2={W - pad.r}
            y1={H - pad.b}
            y2={H - pad.b}
            stroke="rgb(var(--ink) / 0.12)"
            strokeWidth="1"
          />

          {seriesData.map((d, i) => {
            const cxPos = pad.l + band * i + band / 2;
            const barH = (d.value / maxVal) * (H - pad.t - pad.b);
            const y = H - pad.b - barH;
            const isHover = hoverIndex === i;

            return (
              <g
                key={d.key}
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
                className="cursor-pointer"
              >
                {/* Hit area */}
                <rect
                  x={pad.l + band * i}
                  y={pad.t}
                  width={band}
                  height={H - pad.t - pad.b}
                  fill="transparent"
                />
                {/* Bar */}
                <rect
                  x={cxPos - barW / 2}
                  y={y}
                  width={barW}
                  height={Math.max(2, barH)}
                  rx={3}
                  className={cx(
                    'transition-colors',
                    isHover ? 'fill-honey-deep dark:fill-honey' : 'fill-honey/80'
                  )}
                />
                {/* Tick label on first, mid, last */}
                {(i === 0 || i === Math.floor(seriesData.length / 2) || i === seriesData.length - 1) && (
                  <text
                    x={cxPos}
                    y={H - 8}
                    textAnchor="middle"
                    className="fill-ink-faint text-[10px]"
                  >
                    {d.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoverIndex !== null && seriesData[hoverIndex] && (
          <div className="pane-solid absolute -top-4 left-1/2 -translate-x-1/2 rounded px-2.5 py-1 text-xs text-ink shadow-sm pointer-events-none">
            <span className="font-semibold">{seriesData[hoverIndex].value}</span>{' '}
            <span className="text-ink-faint">({seriesData[hoverIndex].label})</span>
          </div>
        )}

        <div className="mt-1 flex items-center justify-between text-[11px] text-ink-faint">
          <span>{seriesData[0]?.label}</span>
          <span className="font-medium text-ink">
            Total: {metric === 'focus-time' ? `${(totalValue / 60).toFixed(1)} hrs` : totalValue}
          </span>
          <span>{seriesData[seriesData.length - 1]?.label}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col">
      {/* Widget Header with Interactive Quick-Toggles */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-1.5 border-b border-line/15 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
          <Sparkles className="h-3.5 w-3.5 text-honey-deep dark:text-honey" />
          <span>{displayTitle}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Visual Style Selector */}
          <div className="inline-flex items-center rounded border border-line/20 bg-ink/[0.03] p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setVisual('bar-chart')}
              className={cx(
                'p-1 rounded transition-colors',
                visual === 'bar-chart'
                  ? 'bg-honey text-night font-bold shadow-sm'
                  : 'text-ink-faint hover:text-ink'
              )}
              title="Bar chart"
            >
              <BarChart2 className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => setVisual('area-trend')}
              className={cx(
                'p-1 rounded transition-colors',
                visual === 'area-trend'
                  ? 'bg-honey text-night font-bold shadow-sm'
                  : 'text-ink-faint hover:text-ink'
              )}
              title="Trend line"
            >
              <TrendingUp className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => setVisual('progress-ring')}
              className={cx(
                'p-1 rounded transition-colors',
                visual === 'progress-ring'
                  ? 'bg-honey text-night font-bold shadow-sm'
                  : 'text-ink-faint hover:text-ink'
              )}
              title="Progress ring"
            >
              <CircleDot className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => setVisual('stat-trend')}
              className={cx(
                'p-1 rounded transition-colors',
                visual === 'stat-trend'
                  ? 'bg-honey text-night font-bold shadow-sm'
                  : 'text-ink-faint hover:text-ink'
              )}
              title="Metric KPI"
            >
              <Hash className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => setVisual('category-bars')}
              className={cx(
                'p-1 rounded transition-colors',
                visual === 'category-bars'
                  ? 'bg-honey text-night font-bold shadow-sm'
                  : 'text-ink-faint hover:text-ink'
              )}
              title="Category breakdown"
            >
              <ListOrdered className="h-3 w-3" />
            </button>
          </div>

          {/* Timeframe Quick Switcher */}
          <div className="inline-flex items-center rounded border border-line/20 bg-ink/[0.03] p-0.5 text-xs">
            {(['7-days', '14-days', '30-days'] as AnalyticsTimeframe[]).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={cx(
                  'px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors',
                  timeframe === tf
                    ? 'bg-honey text-night font-semibold shadow-sm'
                    : 'text-ink-faint hover:text-ink'
                )}
              >
                {tf === '7-days' ? '7d' : tf === '14-days' ? '14d' : '30d'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chart Visualization */}
      <div className="flex-1 flex flex-col justify-center min-h-[9rem]">
        {renderVisualContent()}
      </div>
    </div>
  );
};
