import React, { useState } from 'react';
import { LayoutGrid, Plus, RotateCcw, Check, Sparkles } from 'lucide-react';
import { useWidgets, WidgetConfig } from '../../store/widgets';
import { WidgetWrapper } from './WidgetWrapper';
import { AddWidgetModal } from './AddWidgetModal';
import { Greeting } from './Greeting';
import { TodayPane } from './TodayPane';
import { TimerPane } from './TimerPane';
import { HabitsPane } from './HabitsPane';
import { WeekStrip } from './WeekStrip';
import { UpcomingWidget } from './UpcomingWidget';
import { SanctuaryPane } from './SanctuaryPane';
import { QuickNoteWidget } from './QuickNoteWidget';
import { Launchpad } from './Launchpad';
import { useTasks } from '../../store/tasks';
import { useEvents } from '../../store/events';
import { useUi } from '../../store/ui';
import type { Task } from '../../types';

interface WidgetGridProps {
  onOpenTask: (t: Task) => void;
  quickAddRef: React.Ref<HTMLInputElement>;
}

export const WidgetGrid: React.FC<WidgetGridProps> = ({ onOpenTask, quickAddRef }) => {
  const { widgets, isCustomizing, toggleCustomizing, resetDefaults } = useWidgets();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const tasks = useTasks((s) => s.tasks);
  const events = useEvents((s) => s.events);
  const setView = useUi((s) => s.setView);

  const renderWidgetContent = (widget: WidgetConfig) => {
    switch (widget.type) {
      case 'greeting':
        return <Greeting />;
      case 'quests':
        return (
          <TodayPane
            onOpen={onOpenTask}
            quickAddRef={quickAddRef}
            title={widget.title}
            categoryFilter={widget.settings?.category}
            lensOverride={widget.settings?.taskFilter === 'all' ? undefined : (widget.settings?.taskFilter as any)}
            embedded
          />
        );
      case 'timer':
        return <TimerPane embedded />;
      case 'habits':
        return <HabitsPane embedded />;
      case 'week-strip':
        return (
          <WeekStrip
            events={events}
            tasks={tasks}
            onOpenCalendar={() => setView('calendar')}
            onOpenTask={onOpenTask}
            embedded
          />
        );
      case 'upcoming':
        return (
          <UpcomingWidget
            tasks={tasks}
            events={events}
            onOpenTask={onOpenTask}
            embedded
          />
        );
      case 'sanctuary':
        return <SanctuaryPane embedded />;
      case 'quick-note':
        return (
          <QuickNoteWidget
            id={widget.id}
            title={widget.title}
            initialContent={widget.settings?.noteContent}
          />
        );
      case 'bookmarks':
        return <Launchpad />;
      default:
        return <div className="text-xs text-ink-faint">Unknown widget</div>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Customization Bar - Singular Primary Action Discipline */}
      <div className="flex items-center justify-between border-b border-line/15 pb-2">
        <div className="flex items-center gap-2">
          {isCustomizing ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-honey-deep dark:text-honey">
              <Sparkles className="h-3.5 w-3.5" /> Customize layout
            </span>
          ) : (
            <span className="text-xs font-semibold text-ink-soft">Dashboard</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isCustomizing ? (
            <>
              <button
                type="button"
                onClick={() => setAddModalOpen(true)}
                className="btn-ghost h-7 !px-2.5 text-xs"
              >
                <Plus className="h-3.5 w-3.5" /> Add widget
              </button>
              <button
                type="button"
                onClick={resetDefaults}
                className="btn-ghost h-7 !px-2 text-xs text-ink-faint hover:text-ink"
                title="Reset layout to default"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
              {/* Single Primary Action */}
              <button
                type="button"
                onClick={toggleCustomizing}
                className="btn-honey h-7 !px-3 text-xs"
              >
                <Check className="h-3.5 w-3.5" /> Done editing
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={toggleCustomizing}
              className="btn-ghost h-7 !px-2.5 text-xs text-ink-soft hover:text-ink"
              title="Customize layout and widgets"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Customize layout</span>
            </button>
          )}
        </div>
      </div>

      {/* Responsive 3-Column Bento Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 items-start">
        {widgets.map((widget) => (
          <WidgetWrapper key={widget.id} widget={widget}>
            {renderWidgetContent(widget)}
          </WidgetWrapper>
        ))}

        {isCustomizing && (
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="col-span-1 min-h-[10rem] flex flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-line/30 p-4 text-xs text-ink-faint hover:border-honey/60 hover:text-honey transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span className="font-semibold text-ink">Add custom widget</span>
            <span className="text-xs text-ink-faint">Quests, scratchpad, timer, habits</span>
          </button>
        )}
      </div>

      <AddWidgetModal open={addModalOpen} onClose={() => setAddModalOpen(false)} />
    </div>
  );
};
