import React, { useState } from 'react';
import { CheckSquare, Clock, Heart, Calendar, FileText, Bookmark, Sparkles, Plus, AlertCircle } from 'lucide-react';
import { useWidgets, WidgetType, WidgetWidth } from '../../store/widgets';
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

  const activeOption = AVAILABLE_WIDGETS.find((w) => w.type === selected)!;

  const handleSelect = (type: WidgetType) => {
    setSelected(type);
    const opt = AVAILABLE_WIDGETS.find((w) => w.type === type)!;
    setWidth(opt.defaultWidth);
    setCustomTitle('');
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addWidget({
      type: selected,
      title: customTitle.trim() || activeOption.title,
      width,
      settings: {
        category: categoryFilter,
        taskFilter: 'today',
        noteTitle: customTitle.trim() || 'Study Scratchpad',
        noteContent: selected === 'quick-note' ? '• New study note\n• Write reminders here' : undefined,
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
                  <span className={cx('p-1.5 rounded-md shrink-0', isSel ? 'bg-honey text-night' : 'bg-ink/10 text-ink-soft')}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-ink leading-tight">{opt.title}</p>
                    <p className="text-[11px] text-ink-faint line-clamp-2 mt-0.5">{opt.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-line/15">
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
              <option value="All">All Categories</option>
              <option value="Grad School">Grad School Only</option>
              <option value="Work">Work Only</option>
              <option value="Bills">Bills Only</option>
              <option value="Personal">Personal Only</option>
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
