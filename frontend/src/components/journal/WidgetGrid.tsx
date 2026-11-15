import React, { useRef, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import {
  GripVertical,
  LayoutGrid,
  Plus,
  RotateCcw,
  Check,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';
import { sfx } from '../../lib/audio';
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
  const { widgets, isCustomizing, toggleCustomizing, resetDefaults, setWidgetsOrder } = useWidgets();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const tasks = useTasks((s) => s.tasks);
  const events = useEvents((s) => s.events);
  const setView = useUi((s) => s.setView);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    try {
      sfx.pop();
    } catch {}
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const oldIndex = widgets.findIndex((w) => w.id === active.id);
    const newIndex = widgets.findIndex((w) => w.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      const next = arrayMove(widgets, oldIndex, newIndex);
      setWidgetsOrder(next);
      try {
        sfx.pop();
      } catch {}
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const activeWidget = activeId ? widgets.find((w) => w.id === activeId) : null;

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
      {/* Top Customization Bar - Highly Visible & Accessible */}
      {!isCustomizing ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line/20 bg-surface-strong/70 p-3 px-4 shadow-sm backdrop-blur-sm transition-all">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-honey/15 text-honey-deep dark:text-honey">
              <LayoutGrid className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-xs font-semibold text-ink">Personal Dashboard</h2>
              <p className="text-[11px] text-ink-faint">
                {widgets.length} widgets active • Personalize, reorder &amp; resize
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleCustomizing}
            className="inline-flex items-center gap-2 rounded-md border border-honey/40 bg-honey/15 hover:bg-honey/25 px-3.5 py-1.5 text-xs font-semibold text-honey-deep dark:text-honey shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            title="Reorder widgets, resize cards, or add custom tools"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-honey-deep dark:text-honey" />
            <span>Customize layout</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-honey/40 bg-honey/10 dark:bg-honey/[0.08] p-3 px-4 shadow-md transition-all">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-honey text-night font-bold shadow-sm">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-bold text-ink flex items-center gap-1.5">
                Customizing layout
                <span className="inline-block h-2 w-2 rounded-full bg-honey animate-pulse" />
              </p>
              <p className="text-[11px] text-ink-faint">
                Drag handles to reorder • Drag right edge to resize • Add or delete widgets
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAddModalOpen(true)}
              className="btn-ghost bg-surface/90 border border-line/20 hover:border-honey/40 h-8 !px-3 text-xs"
            >
              <Plus className="h-3.5 w-3.5 text-honey-deep dark:text-honey" />
              <span>Add widget</span>
            </button>
            <button
              type="button"
              onClick={resetDefaults}
              className="btn-ghost h-8 !px-2.5 text-xs text-ink-faint hover:text-ink"
              title="Reset layout to default"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
            <button
              type="button"
              onClick={toggleCustomizing}
              className="btn-honey h-8 !px-4 text-xs font-semibold shadow-sm"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Done editing</span>
            </button>
          </div>
        </div>
      )}

      {/* Dnd Sortable Bento Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={widgets.map((w) => w.id)} strategy={rectSortingStrategy}>
          <div ref={gridRef} className="bento-grid grid grid-cols-1 gap-4 lg:grid-cols-3 items-start">
            {widgets.map((widget) => (
              <WidgetWrapper key={widget.id} widget={widget}>
                {renderWidgetContent(widget)}
              </WidgetWrapper>
            ))}

            {isCustomizing && (
              <button
                type="button"
                onClick={() => setAddModalOpen(true)}
                className="col-span-1 min-h-[10rem] flex flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-line/30 p-4 text-xs text-ink-faint hover:border-honey/60 hover:text-honey transition-colors bg-ink/[0.01] hover:bg-honey/[0.04]"
              >
                <Plus className="h-4 w-4" />
                <span className="font-semibold text-ink">Add custom widget</span>
                <span className="text-xs text-ink-faint">Quests, scratchpad, timer, habits</span>
              </button>
            )}
          </div>
        </SortableContext>

        {/* Drag Overlay Ghost */}
        <DragOverlay zIndex={60} dropAnimation={null}>
          {activeWidget ? (
            <div className="w-80 max-w-full pointer-events-none opacity-95 shadow-2xl ring-2 ring-honey rounded-md bg-surface p-1 scale-[1.02] rotate-1">
              <div className="mb-1.5 flex items-center justify-between rounded bg-honey/15 px-2 py-1 text-xs text-ink border border-honey/30">
                <span className="font-semibold text-xs text-honey-deep dark:text-honey flex items-center gap-1.5">
                  <GripVertical className="h-3.5 w-3.5" />
                  {activeWidget.title || activeWidget.type}
                </span>
                <span className="text-[11px] text-ink-faint font-medium">Reordering...</span>
              </div>
              <div className="pane p-3 flex flex-col min-h-[7rem]">
                {renderWidgetContent(activeWidget)}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <AddWidgetModal open={addModalOpen} onClose={() => setAddModalOpen(false)} />
    </div>
  );
};
