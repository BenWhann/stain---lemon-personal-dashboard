import React, { useEffect, useRef, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowLeft, ArrowRight, GripVertical, Settings2, Trash2 } from 'lucide-react';
import { sfx } from '../../lib/audio';
import {
  AnalyticsMetric,
  AnalyticsTimeframe,
  AnalyticsVisual,
  useWidgets,
  WidgetConfig,
  WidgetWidth,
} from '../../store/widgets';
import { cx } from '../ui/cx';
import { Modal } from '../ui/Modal';

interface WidgetWrapperProps {
  widget: WidgetConfig;
  children: React.ReactNode;
}

export const WidgetWrapper: React.FC<WidgetWrapperProps> = ({ widget, children }) => {
  const isCustomizing = useWidgets((s) => s.isCustomizing);
  const moveWidget = useWidgets((s) => s.moveWidget);
  const removeWidget = useWidgets((s) => s.removeWidget);
  const setWidth = useWidgets((s) => s.setWidth);
  const updateWidget = useWidgets((s) => s.updateWidget);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(widget.title || '');
  const [editCategory, setEditCategory] = useState(widget.settings?.category || 'All');
  const [editMetric, setEditMetric] = useState<AnalyticsMetric>(
    widget.settings?.analyticsMetric || 'tasks-completed'
  );
  const [editVisual, setEditVisual] = useState<AnalyticsVisual>(
    widget.settings?.analyticsVisual || 'bar-chart'
  );
  const [editTimeframe, setEditTimeframe] = useState<AnalyticsTimeframe>(
    widget.settings?.analyticsTimeframe || '14-days'
  );

  useEffect(() => {
    if (settingsOpen) {
      setEditTitle(widget.title || '');
      setEditCategory(widget.settings?.category || 'All');
      setEditMetric(widget.settings?.analyticsMetric || 'tasks-completed');
      setEditVisual(widget.settings?.analyticsVisual || 'bar-chart');
      setEditTimeframe(widget.settings?.analyticsTimeframe || '14-days');
    }
  }, [settingsOpen, widget]);

  const [isResizing, setIsResizing] = useState(false);
  const [previewWidth, setPreviewWidth] = useState<WidgetWidth | null>(null);
  const widgetRef = useRef<HTMLDivElement | null>(null);

  const activeWidth = previewWidth || widget.width;

  const widthClasses: Record<WidgetWidth, string> = {
    '1-col': 'col-span-1',
    '2-col': 'col-span-1 lg:col-span-2',
    '3-col': 'col-span-1 lg:col-span-3',
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: widget.id,
    disabled: !isCustomizing || isResizing,
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition: isResizing ? 'none' : transition,
  };

  const setCombinedRef = (node: HTMLDivElement | null) => {
    widgetRef.current = node;
    setNodeRef(node);
  };

  const handleResizePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    setIsResizing(true);

    const startX = e.clientX;
    const widgetEl = widgetRef.current;
    if (!widgetEl) return;

    const gridContainer = (widgetEl.closest('.bento-grid') as HTMLElement) || widgetEl.parentElement;
    const containerWidth = gridContainer ? gridContainer.clientWidth : window.innerWidth;
    const colWidth = Math.max(containerWidth / 3, 100);

    const initialCols = widget.width === '1-col' ? 1 : widget.width === '2-col' ? 2 : 3;
    let currentTargetWidth: WidgetWidth = widget.width;

    const onPointerMove = (ev: PointerEvent) => {
      const deltaX = ev.clientX - startX;
      const projectedCols = initialCols + deltaX / colWidth;
      let nextWidth: WidgetWidth;
      if (projectedCols < 1.5) {
        nextWidth = '1-col';
      } else if (projectedCols < 2.5) {
        nextWidth = '2-col';
      } else {
        nextWidth = '3-col';
      }

      if (nextWidth !== currentTargetWidth) {
        currentTargetWidth = nextWidth;
        setPreviewWidth(nextWidth);
        try {
          sfx.pop();
        } catch {}
      }
    };

    const onPointerUp = () => {
      try {
        target.releasePointerCapture(e.pointerId);
      } catch {}
      target.removeEventListener('pointermove', onPointerMove);
      target.removeEventListener('pointerup', onPointerUp);
      setIsResizing(false);
      setPreviewWidth(null);
      if (currentTargetWidth !== widget.width) {
        setWidth(widget.id, currentTargetWidth);
      }
    };

    target.addEventListener('pointermove', onPointerMove);
    target.addEventListener('pointerup', onPointerUp);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateWidget(widget.id, {
      title: editTitle.trim() || undefined,
      settings: {
        ...widget.settings,
        category: editCategory,
        analyticsMetric: editMetric,
        analyticsVisual: editVisual,
        analyticsTimeframe: editTimeframe,
      },
    });
    setSettingsOpen(false);
  };

  return (
    <div
      ref={setCombinedRef}
      style={style}
      className={cx(
        'relative flex flex-col transition-all duration-150',
        widthClasses[activeWidth],
        isDragging && 'opacity-30 ring-2 ring-dashed ring-honey/70 rounded-md scale-[0.98]',
        isCustomizing && !isDragging && 'border border-honey/40 rounded-md p-1 bg-honey/[0.02]',
        isResizing && 'ring-2 ring-honey shadow-lg',
      )}
    >
      {isCustomizing && (
        <div className="mb-1.5 flex items-center justify-between rounded bg-ink/[0.05] px-2 py-1 text-xs text-ink border border-line/15 select-none">
          {/* Draggable Title & Grip Handle */}
          <div
            {...attributes}
            {...listeners}
            className="flex items-center gap-1.5 cursor-grab active:cursor-grabbing hover:bg-honey/15 px-1.5 py-0.5 rounded transition-colors text-ink group"
            title="Click and drag to reorder"
          >
            <GripVertical className="h-3.5 w-3.5 text-honey-deep dark:text-honey group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-xs text-honey-deep dark:text-honey truncate max-w-[130px]">
              {widget.title || widget.type}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <div className="inline-flex items-center rounded border border-line/20 bg-surface p-0.5 text-xs">
              {(['1-col', '2-col', '3-col'] as WidgetWidth[]).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setWidth(widget.id, w)}
                  className={cx(
                    'px-1.5 py-0.5 rounded transition-colors',
                    activeWidth === w ? 'bg-honey text-night font-semibold' : 'text-ink-soft hover:text-ink',
                  )}
                  title={`Resize to ${w === '1-col' ? '1 column' : w === '2-col' ? '2 columns' : 'full width'}`}
                >
                  {w === '1-col' ? '1 col' : w === '2-col' ? '2 col' : 'Full'}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => moveWidget(widget.id, 'up')}
              className="grid h-6 w-6 place-items-center rounded hover:bg-ink/10 text-ink-soft hover:text-ink"
              title="Move left/up"
            >
              <ArrowLeft className="h-3 w-3" />
            </button>

            <button
              type="button"
              onClick={() => moveWidget(widget.id, 'down')}
              className="grid h-6 w-6 place-items-center rounded hover:bg-ink/10 text-ink-soft hover:text-ink"
              title="Move right/down"
            >
              <ArrowRight className="h-3 w-3" />
            </button>

            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="grid h-6 w-6 place-items-center rounded hover:bg-ink/10 text-ink-soft hover:text-ink"
              title="Configure widget"
            >
              <Settings2 className="h-3 w-3" />
            </button>

            <button
              type="button"
              onClick={() => removeWidget(widget.id)}
              className="grid h-6 w-6 place-items-center rounded hover:bg-ember/15 text-ember"
              title="Remove widget"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* Widget Content Card */}
      <div className="pane flex-1 p-4 flex flex-col min-h-0 relative">
        {children}
      </div>

      {/* Interactive Drag-to-Resize Handles */}
      {isCustomizing && (
        <>
          {/* Right Edge Horizontal Drag Handle */}
          <div
            onPointerDown={handleResizePointerDown}
            className={cx(
              'absolute top-0 right-0 bottom-0 w-3.5 z-20 cursor-col-resize flex items-center justify-center transition-colors select-none group',
              isResizing ? 'bg-honey/30' : 'hover:bg-honey/20',
            )}
            title="Drag horizontally to resize column width"
          >
            <div
              className={cx(
                'w-1 rounded-full transition-all duration-150',
                isResizing ? 'h-16 bg-honey w-1.5' : 'h-8 bg-line/30 group-hover:bg-honey group-hover:h-12',
              )}
            />
            {/* Live Indicator Tooltip during Drag */}
            {isResizing && (
              <div className="absolute -top-7 right-0 whitespace-nowrap rounded bg-night px-2 py-0.5 text-[10px] font-semibold text-surface shadow-md">
                {activeWidth === '1-col' ? '1 Col (1/3)' : activeWidth === '2-col' ? '2 Cols (2/3)' : '3 Cols (Full width)'}
              </div>
            )}
          </div>

          {/* Bottom-Right Corner Drag Handle */}
          <div
            onPointerDown={handleResizePointerDown}
            className={cx(
              'absolute bottom-0 right-0 h-4 w-4 z-20 cursor-se-resize flex items-center justify-center select-none text-ink-faint hover:text-honey transition-colors',
              isResizing && 'text-honey',
            )}
            title="Drag to resize"
          >
            <div className="w-2.5 h-2.5 border-r-2 border-b-2 border-current rounded-br-[2px]" />
          </div>
        </>
      )}

      {/* Configure Settings Modal */}
      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Configure widget" width="sm">
        <form onSubmit={handleSaveSettings} className="space-y-3">
          <div>
            <label className="label">Widget title</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="e.g. Study priorities"
              className="field"
            />
          </div>

          {widget.type === 'quests' && (
            <div>
              <label className="label">Task category filter</label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="field"
              >
                <option value="All">All categories</option>
                <option value="Grad School">Grad school</option>
                <option value="Work">Work</option>
                <option value="Bills">Bills</option>
                <option value="Personal">Personal</option>
              </select>
            </div>
          )}

          {widget.type === 'analytics' && (
            <div className="space-y-3">
              <div>
                <label className="label">Metric to measure</label>
                <select
                  value={editMetric}
                  onChange={(e) => setEditMetric(e.target.value as AnalyticsMetric)}
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
                <label className="label">Visualization style</label>
                <select
                  value={editVisual}
                  onChange={(e) => setEditVisual(e.target.value as AnalyticsVisual)}
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
                <label className="label">Time window</label>
                <select
                  value={editTimeframe}
                  onChange={(e) => setEditTimeframe(e.target.value as AnalyticsTimeframe)}
                  className="field"
                >
                  <option value="7-days">Last 7 days (1 week)</option>
                  <option value="14-days">Last 14 days (2 weeks)</option>
                  <option value="30-days">Last 30 days (1 month)</option>
                </select>
              </div>

              <div>
                <label className="label">Category filter</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
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
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setSettingsOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-honey">
              Save changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
