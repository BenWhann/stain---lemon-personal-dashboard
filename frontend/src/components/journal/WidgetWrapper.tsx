import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Settings2, Trash2 } from 'lucide-react';
import { useWidgets, WidgetConfig, WidgetWidth } from '../../store/widgets';
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

  const widthClasses: Record<WidgetWidth, string> = {
    '1-col': 'col-span-1',
    '2-col': 'col-span-1 lg:col-span-2',
    '3-col': 'col-span-1 lg:col-span-3',
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateWidget(widget.id, {
      title: editTitle.trim() || undefined,
      settings: {
        ...widget.settings,
        category: editCategory,
      },
    });
    setSettingsOpen(false);
  };

  return (
    <div
      className={cx(
        'relative flex flex-col transition-colors duration-150',
        widthClasses[widget.width],
        isCustomizing && 'border border-honey/40 rounded-md p-1 bg-honey/[0.02]',
      )}
    >
      {isCustomizing && (
        <div className="mb-1.5 flex items-center justify-between rounded bg-ink/[0.05] px-2 py-1 text-xs text-ink border border-line/15">
          <span className="font-medium text-xs text-honey-deep dark:text-honey truncate max-w-[120px]">
            {widget.title || widget.type}
          </span>

          <div className="flex items-center gap-1">
            <div className="inline-flex items-center rounded border border-line/20 bg-surface p-0.5 text-xs">
              {(['1-col', '2-col', '3-col'] as WidgetWidth[]).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setWidth(widget.id, w)}
                  className={cx(
                    'px-1.5 py-0.5 rounded transition-colors',
                    widget.width === w ? 'bg-honey text-night font-semibold' : 'text-ink-soft hover:text-ink',
                  )}
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
      <div className="pane flex-1 p-4 flex flex-col min-h-0">
        {children}
      </div>

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
