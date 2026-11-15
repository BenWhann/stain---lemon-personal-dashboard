import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit2,
  Filter,
  ListTodo,
  MapPin,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { addDays, formatLong, formatShort, parseISODate, toISODate, todayISO } from '../../lib/dates';
import { useEvents } from '../../store/events';
import { useTasks } from '../../store/tasks';
import { EVENT_CATEGORIES, type CalendarEvent, type EventCategory, type Task } from '../../types';
import { Modal } from '../ui/Modal';
import { cx } from '../ui/cx';
import { QuickAdd } from '../tasks/QuickAdd';

const CATEGORY_COLOR: Record<string, string> = {
  Academic: 'var(--cat-academic)',
  Work: 'var(--cat-work)',
  Wellness: 'var(--cat-wellness)',
  Bills: 'var(--cat-bills)',
  Personal: 'var(--cat-personal)',
};

const dot = (category: string): React.CSSProperties => ({
  background: CATEGORY_COLOR[category] ?? 'rgb(var(--ink-faint))',
});

type CalendarViewMode = 'month' | 'week' | 'day';

interface CalendarSectionProps {
  onOpenTask?: (t: Task) => void;
}

export const CalendarSection: React.FC<CalendarSectionProps> = ({ onOpenTask }) => {
  const events = useEvents((s) => s.events);
  const removeEvent = useEvents((s) => s.remove);
  const tasks = useTasks((s) => s.tasks);
  const toggleTask = useTasks((s) => s.toggle);
  const today = todayISO();

  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState(today);
  const [direction, setDirection] = useState(0);

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Event Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState(today);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  // Helper map for fast task lookup by ID
  const tasksById = useMemo(() => {
    const m = new Map<number, Task>();
    tasks.forEach((t) => m.set(t.id, t));
    return m;
  }, [tasks]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (selectedCategory !== 'All' && e.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = e.title.toLowerCase().includes(q);
        const matchLocation = e.location?.toLowerCase().includes(q);
        const matchCat = e.category.toLowerCase().includes(q);
        if (!matchTitle && !matchLocation && !matchCat) return false;
      }
      return true;
    });
  }, [events, selectedCategory, searchQuery]);

  // Events indexed by date
  const eventsByDay = useMemo(() => {
    const m = new Map<string, CalendarEvent[]>();
    filteredEvents.forEach((e) => m.set(e.date, [...(m.get(e.date) ?? []), e]));
    return m;
  }, [filteredEvents]);

  // Tasks due by date
  const tasksDueByDay = useMemo(() => {
    const m = new Map<string, Task[]>();
    tasks
      .filter((t) => !t.completed && t.due_date)
      .forEach((t) => {
        const d = t.due_date!;
        m.set(d, [...(m.get(d) ?? []), t]);
      });
    return m;
  }, [tasks]);

  // 42-day Month matrix
  const monthCells = useMemo(() => {
    const first = new Date(cursor);
    const offset = (first.getDay() + 6) % 7; // Monday = 0
    const start = new Date(first);
    start.setDate(first.getDate() - offset);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return {
        iso: toISODate(d),
        day: d.getDate(),
        inMonth: d.getMonth() === cursor.getMonth(),
      };
    });
  }, [cursor]);

  // 7-day Week columns
  const weekDays = useMemo(() => {
    const selDate = parseISODate(selected) ?? new Date();
    const offset = (selDate.getDay() + 6) % 7;
    const monday = addDays(selected, -offset);
    return Array.from({ length: 7 }, (_, i) => {
      const iso = addDays(monday, i);
      const d = parseISODate(iso) ?? new Date();
      return {
        iso,
        dayNum: d.getDate(),
        dayName: d.toLocaleDateString(undefined, { weekday: 'short' }),
        isToday: iso === today,
        isSelected: iso === selected,
      };
    });
  }, [selected, today]);

  // Navigation handlers
  const moveMonth = useCallback((delta: number) => {
    setDirection(delta);
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  }, []);

  const moveWeek = useCallback((delta: number) => {
    setDirection(delta);
    setSelected((prev) => addDays(prev, delta * 7));
  }, []);

  const moveDay = useCallback((delta: number) => {
    setDirection(delta);
    setSelected((prev) => addDays(prev, delta));
  }, []);

  const handlePrev = useCallback(() => {
    if (viewMode === 'month') moveMonth(-1);
    else if (viewMode === 'week') moveWeek(-1);
    else moveDay(-1);
  }, [viewMode, moveMonth, moveWeek, moveDay]);

  const handleNext = useCallback(() => {
    if (viewMode === 'month') moveMonth(1);
    else if (viewMode === 'week') moveWeek(1);
    else moveDay(1);
  }, [viewMode, moveMonth, moveWeek, moveDay]);

  const jumpToToday = useCallback(() => {
    const d = new Date();
    setDirection(0);
    setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
    setSelected(today);
  }, [today]);

  // Modal open helpers
  const openNewEvent = useCallback((dateISO?: string) => {
    setEditingEvent(null);
    setModalDate(dateISO || selected);
    setModalOpen(true);
  }, [selected]);

  const openEditEvent = useCallback((e: CalendarEvent) => {
    setEditingEvent(e);
    setModalDate(e.date);
    setModalOpen(true);
  }, []);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside an input, textarea, or modal
      const target = e.target as HTMLElement | null;
      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        modalOpen
      ) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key.toLowerCase() === 't') {
        e.preventDefault();
        jumpToToday();
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setViewMode('month');
      } else if (e.key.toLowerCase() === 'w') {
        e.preventDefault();
        setViewMode('week');
      } else if (e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setViewMode('day');
      } else if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        openNewEvent();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext, jumpToToday, modalOpen, openNewEvent]);

  // Labels
  const monthHeaderLabel = cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const weekHeaderLabel = useMemo(() => {
    if (weekDays.length === 0) return '';
    const first = parseISODate(weekDays[0].iso);
    const last = parseISODate(weekDays[6].iso);
    if (!first || !last) return '';
    const firstStr = first.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const lastStr = last.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    return `${firstStr} – ${lastStr}`;
  }, [weekDays]);

  const dayHeaderLabel = useMemo(() => {
    return formatLong(selected);
  }, [selected]);

  const dayEvents = eventsByDay.get(selected) ?? [];
  const dayTasks = tasks.filter((t) => t.due_date === selected);

  return (
    <div className="space-y-4">
      {/* Top Header & Navigation Bar */}
      <div className="pane flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="btn-ghost h-9 w-9 !p-0 rounded-md"
              aria-label="Previous period"
              onClick={handlePrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="btn-ghost h-9 !px-3 text-xs font-medium rounded-md"
              onClick={jumpToToday}
            >
              Today
            </button>
            <button
              type="button"
              className="btn-ghost h-9 w-9 !p-0 rounded-md"
              aria-label="Next period"
              onClick={handleNext}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.h2
              key={viewMode === 'month' ? monthHeaderLabel : viewMode === 'week' ? weekHeaderLabel : dayHeaderLabel}
              initial={{ opacity: 0, x: direction * 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -15 }}
              className="heading font-serif text-2xl sm:text-3xl text-ink"
            >
              {viewMode === 'month' ? monthHeaderLabel : viewMode === 'week' ? weekHeaderLabel : dayHeaderLabel}
            </motion.h2>
          </AnimatePresence>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View mode switcher */}
          <div className="inline-flex rounded-md border border-line/20 bg-ink/[0.04] p-0.5 text-xs">
            {(['month', 'week', 'day'] as CalendarViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={cx(
                  'px-3 py-1.5 font-medium rounded capitalize transition-all',
                  viewMode === mode
                    ? 'bg-surface font-semibold text-ink shadow-sm ring-1 ring-line/15'
                    : 'text-ink-soft hover:text-ink',
                )}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Search Toggle */}
          <button
            type="button"
            onClick={() => setShowSearch(!showSearch)}
            aria-label="Toggle search"
            className={cx(
              'btn-ghost h-9 w-9 !p-0 rounded-md',
              (showSearch || searchQuery) && 'bg-honey/15 text-honey ring-1 ring-honey/40',
            )}
          >
            <Search className="h-4 w-4" />
          </button>

          {/* + Event Button */}
          <button
            type="button"
            className="btn-honey h-9 !px-3.5 text-xs font-medium rounded-md shadow-sm"
            onClick={() => openNewEvent(selected)}
          >
            <Plus className="h-3.5 w-3.5" /> Event
          </button>
        </div>
      </div>

      {/* Filter / Search Bar if opened */}
      <AnimatePresence>
        {(showSearch || searchQuery) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="pane flex flex-wrap items-center gap-3 overflow-hidden p-3 text-xs"
          >
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-faint" />
              <input
                type="text"
                placeholder="Search events by title or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="field !py-1.5 !pl-8 text-xs rounded-md"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-ink-faint" />
              <select
                className="field !py-1.5 text-xs rounded-md"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="All">All Categories</option>
                {EVENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Pills Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-ink-soft">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategory('All')}
            className={cx(
              'px-2.5 py-1 rounded-md transition-colors font-medium border text-[11px]',
              selectedCategory === 'All'
                ? 'border-honey bg-honey/15 text-ink font-semibold'
                : 'border-line/15 bg-ink/[0.02] text-ink-soft hover:bg-ink/[0.05]',
            )}
          >
            All Categories
          </button>
          {EVENT_CATEGORIES.map((c) => {
            const isSel = selectedCategory === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedCategory(isSel ? 'All' : c)}
                className={cx(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors font-medium border text-[11px]',
                  isSel
                    ? 'border-honey bg-honey/15 text-ink font-semibold'
                    : 'border-line/15 bg-ink/[0.02] text-ink-soft hover:bg-ink/[0.05]',
                )}
              >
                <span className="h-2 w-2 rounded-full" style={dot(c)} />
                <span>{c}</span>
              </button>
            );
          })}
        </div>

        <span className="hidden lg:inline-flex items-center gap-1 text-[11px] text-ink-faint">
          <span>Tip: Double-click any date to add an event</span>
          <span>·</span>
          <span>Shortcuts: M / W / D / T</span>
        </span>
      </div>

      {/* Main View Area */}
      {viewMode === 'month' && (
        <div className="grid gap-5 lg:grid-cols-[1.65fr_1fr]">
          {/* Month Matrix Grid */}
          <div className="pane p-4 sm:p-6">
            <div className="grid grid-cols-7 gap-1 pb-2 text-center text-xs font-semibold uppercase tracking-wider text-ink-faint">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={cursor.toISOString()}
                initial={{ opacity: 0, x: direction * 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -30 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="grid grid-cols-7 gap-1"
              >
                {monthCells.map((c) => {
                  const evs = eventsByDay.get(c.iso) ?? [];
                  const dueTasks = tasksDueByDay.get(c.iso) ?? [];
                  const due = dueTasks.length;
                  const isSel = c.iso === selected;
                  const isToday = c.iso === today;

                  return (
                    <div
                      key={c.iso}
                      onClick={() => setSelected(c.iso)}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setSelected(c.iso);
                        openNewEvent(c.iso);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setSelected(c.iso);
                      }}
                      aria-pressed={isSel}
                      aria-label={`${formatLong(c.iso)}: ${evs.length} events, ${due} tasks due. Double click to add event.`}
                      className={cx(
                        'group relative flex aspect-[1.1] sm:aspect-[1.18] flex-col rounded-md border p-1 sm:p-1.5 text-left transition-all duration-150 select-none cursor-pointer',
                        c.inMonth ? 'bg-surface/60 text-ink' : 'bg-ink/[0.015] text-ink-faint/40 border-dashed',
                        isSel
                          ? 'border-honey bg-honey/[0.08] ring-2 ring-honey'
                          : 'border-line/15 hover:border-honey/50 hover:bg-honey/[0.03]',
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={cx(
                            'tabular grid h-5 w-5 sm:h-6 sm:w-6 place-items-center rounded-md text-xs font-medium',
                            isToday
                              ? 'bg-honey font-bold text-night shadow-sm'
                              : isSel
                              ? 'font-bold text-honey'
                              : 'text-ink-soft',
                          )}
                        >
                          {c.day}
                        </span>

                        {/* Quick hover add button */}
                        <button
                          type="button"
                          aria-label={`Add event on ${c.iso}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelected(c.iso);
                            openNewEvent(c.iso);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-ink-faint hover:text-honey hover:bg-honey/15"
                          title="Add event (or double-click cell)"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Event Chips (Desktop) & Dots (Mobile) */}
                      <div className="mt-1 flex-1 overflow-hidden space-y-0.5">
                        {/* Desktop pill titles */}
                        <div className="hidden sm:block space-y-0.5">
                          {evs.slice(0, 2).map((e) => (
                            <div
                              key={e.id}
                              className="truncate rounded px-1 py-0.5 text-[10px] font-medium leading-tight text-ink flex items-center gap-1 border border-line/10 bg-ink/[0.03]"
                              title={`${e.time} · ${e.title}`}
                            >
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={dot(e.category)} />
                              <span className="truncate">{e.title}</span>
                            </div>
                          ))}
                          {evs.length > 2 && (
                            <span className="text-[9px] text-ink-faint block pl-1">
                              +{evs.length - 2} more
                            </span>
                          )}
                        </div>

                        {/* Mobile dots */}
                        <div className="sm:hidden flex flex-wrap gap-0.5 pt-1">
                          {evs.slice(0, 4).map((e) => (
                            <span
                              key={e.id}
                              className="h-1.5 w-1.5 rounded-full ring-1 ring-surface"
                              style={dot(e.category)}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Due tasks chip */}
                      {due > 0 && (
                        <div className="mt-auto pt-0.5">
                          <span
                            className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-medium text-ink-soft bg-ink/[0.04] px-1 py-0.2 rounded border border-line/10"
                            title={`${due} tasks due`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-honey" />
                            <span>{due} due</span>
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Selected Day Agenda Side Panel */}
          <div className="pane flex flex-col p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-line/15">
              <div>
                <h3 className="heading font-serif text-2xl text-ink">
                  {selected === today ? 'Today' : formatShort(selected)}
                </h3>
                <p className="text-xs text-ink-soft">{formatLong(selected)}</p>
              </div>
              <button
                type="button"
                className="btn-honey h-8 !px-3 text-xs font-medium rounded-md"
                onClick={() => openNewEvent(selected)}
              >
                <Plus className="h-3.5 w-3.5" /> Event
              </button>
            </div>

            {/* Quick Task Add for this date */}
            <div className="mt-3">
              <QuickAdd defaults={{ due_date: selected }} className="text-xs" />
            </div>

            {/* Schedule List */}
            <div className="scroll-soft mt-3 max-h-[30rem] flex-1 space-y-3 overflow-y-auto pr-1" data-lenis-prevent>
              {/* Events Section */}
              <div>
                <div className="mb-2 flex items-center justify-between text-xs font-semibold text-ink-faint uppercase tracking-wider">
                  <span>Scheduled Events ({dayEvents.length})</span>
                </div>

                <ul className="space-y-2">
                  <AnimatePresence initial={false}>
                    {dayEvents.map((e) => {
                      const linkedTask = e.task_id ? tasksById.get(e.task_id) : e.task;
                      return (
                        <motion.li
                          key={e.id}
                          layout
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="group relative rounded-md border border-line/15 bg-surface/80 p-3 shadow-xs hover:border-honey/40 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5 min-w-0 flex-1">
                              <span
                                className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                                style={dot(e.category)}
                              />
                              <div className="min-w-0 flex-1">
                                <h4 className="font-semibold text-sm text-ink leading-snug">
                                  {e.title}
                                </h4>
                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-soft">
                                  <span className="inline-flex items-center gap-1 font-medium">
                                    <Clock className="h-3 w-3 text-ink-faint" /> {e.time}
                                  </span>
                                  {e.location && (
                                    <span className="inline-flex items-center gap-1 text-ink-faint">
                                      <MapPin className="h-3 w-3" /> {e.location}
                                    </span>
                                  )}
                                  <span className="text-[10px] font-medium uppercase px-1.5 py-0.2 rounded bg-ink/[0.04]">
                                    {e.category}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Actions: Edit & Delete */}
                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                aria-label={`Edit "${e.title}"`}
                                onClick={() => openEditEvent(e)}
                                className="p-1 rounded text-ink-faint hover:text-honey hover:bg-honey/15"
                                title="Edit event"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                aria-label={`Remove "${e.title}"`}
                                onClick={() => void removeEvent(e.id)}
                                className="p-1 rounded text-ink-faint hover:text-ember hover:bg-ember/15"
                                title="Delete event"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Linked Task Card Integration */}
                          {linkedTask && (
                            <div className="mt-2.5 flex items-center justify-between gap-2 rounded-md border border-line/15 bg-ink/[0.025] px-2.5 py-1.5 text-xs">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <button
                                  type="button"
                                  onClick={(ev) => {
                                    ev.stopPropagation();
                                    void toggleTask(linkedTask.id);
                                  }}
                                  aria-label={
                                    linkedTask.completed
                                      ? `Mark "${linkedTask.title}" as incomplete`
                                      : `Mark "${linkedTask.title}" as complete`
                                  }
                                  className={cx(
                                    'h-4 w-4 shrink-0 rounded flex items-center justify-center border transition-colors',
                                    linkedTask.completed
                                      ? 'bg-sage border-sage text-white'
                                      : 'border-line/40 hover:border-honey bg-surface',
                                  )}
                                >
                                  {linkedTask.completed && <Check className="h-3 w-3 stroke-[3]" />}
                                </button>
                                <span
                                  onClick={() => onOpenTask?.(linkedTask)}
                                  className={cx(
                                    'truncate font-medium cursor-pointer hover:underline',
                                    linkedTask.completed ? 'line-through text-ink-faint' : 'text-ink-soft',
                                  )}
                                  title="Click to view task details"
                                >
                                  Task: {linkedTask.title}
                                </span>
                              </div>
                              <span className="text-[10px] font-semibold uppercase text-ink-faint shrink-0 px-1.5 py-0.5 rounded bg-ink/[0.04]">
                                {linkedTask.priority}
                              </span>
                            </div>
                          )}
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                  {dayEvents.length === 0 && (
                    <li className="py-4 text-center text-xs text-ink-faint border border-dashed border-line/20 rounded-md">
                      No events scheduled for this day. Double-click any day to add one!
                    </li>
                  )}
                </ul>
              </div>

              {/* Tasks Due Section */}
              <div className="pt-2">
                <div className="mb-2 flex items-center justify-between text-xs font-semibold text-ink-faint uppercase tracking-wider">
                  <span>Deadlines Due ({dayTasks.length})</span>
                </div>
                <ul className="space-y-1.5">
                  {dayTasks.map((t) => (
                    <li
                      key={`t-${t.id}`}
                      className={cx(
                        'flex items-center justify-between gap-2.5 rounded-md border border-line/15 px-3 py-2 text-xs transition-colors bg-surface/50',
                        onOpenTask && 'hover:border-honey/40 hover:bg-honey/[0.03]',
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => void toggleTask(t.id)}
                          aria-label={t.completed ? `Uncheck "${t.title}"` : `Check "${t.title}"`}
                          className={cx(
                            'h-4 w-4 shrink-0 rounded flex items-center justify-center border transition-colors',
                            t.completed
                              ? 'bg-sage border-sage text-white'
                              : 'border-line/40 hover:border-honey bg-surface',
                          )}
                        >
                          {t.completed && <Check className="h-3 w-3 stroke-[3]" />}
                        </button>
                        <span
                          onClick={() => onOpenTask?.(t)}
                          className={cx(
                            'truncate cursor-pointer hover:underline',
                            t.completed ? 'text-ink-faint line-through' : 'text-ink-soft font-medium',
                          )}
                        >
                          {t.title}
                        </span>
                      </div>
                      <span className="text-[10px] uppercase font-semibold text-ink-faint shrink-0">
                        {t.priority}
                      </span>
                    </li>
                  ))}
                  {dayTasks.length === 0 && (
                    <li className="py-3 text-center text-xs text-ink-faint">
                      No task deadlines due on this day.
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Week Agenda View */}
      {viewMode === 'week' && (
        <div className="pane p-4 sm:p-6 overflow-x-auto">
          <div className="grid grid-cols-7 gap-2 min-w-[800px]">
            {weekDays.map((day) => {
              const dayEvs = eventsByDay.get(day.iso) ?? [];
              const dayTs = tasksDueByDay.get(day.iso) ?? [];

              return (
                <div
                  key={day.iso}
                  onDoubleClick={() => openNewEvent(day.iso)}
                  className={cx(
                    'flex flex-col rounded-md border p-2.5 min-h-[460px] transition-colors',
                    day.isSelected
                      ? 'border-honey bg-honey/[0.04] ring-1 ring-honey'
                      : 'border-line/20 bg-surface/50 hover:border-honey/40',
                  )}
                >
                  {/* Column Header */}
                  <div
                    onClick={() => setSelected(day.iso)}
                    className="cursor-pointer pb-2 mb-2 border-b border-line/15 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs uppercase font-semibold text-ink-faint block">
                        {day.dayName}
                      </span>
                      <span
                        className={cx(
                          'tabular text-base font-bold inline-block px-1.5 py-0.5 rounded',
                          day.isToday ? 'bg-honey text-night' : 'text-ink',
                        )}
                      >
                        {day.dayNum}
                      </span>
                    </div>

                    <button
                      type="button"
                      aria-label={`Add event on ${day.iso}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        openNewEvent(day.iso);
                      }}
                      className="p-1 rounded text-ink-faint hover:text-honey hover:bg-honey/15"
                      title="Add event (or double click)"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Events in Column */}
                  <div className="flex-1 space-y-2 overflow-y-auto scroll-soft" data-lenis-prevent>
                    {dayEvs.map((e) => {
                      const linkedTask = e.task_id ? tasksById.get(e.task_id) : e.task;
                      return (
                        <div
                          key={e.id}
                          className="group relative rounded-md border border-line/15 bg-surface p-2 shadow-2xs hover:border-honey/50 transition-colors text-xs"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="h-2 w-2 mt-1 rounded-full shrink-0" style={dot(e.category)} />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-ink truncate" title={e.title}>
                                {e.title}
                              </p>
                              <p className="text-[10px] text-ink-faint flex items-center gap-1 mt-0.5">
                                <Clock className="h-2.5 w-2.5" /> {e.time}
                              </p>
                            </div>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => openEditEvent(e)}
                                className="p-0.5 text-ink-faint hover:text-honey"
                                title="Edit"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => void removeEvent(e.id)}
                                className="p-0.5 text-ink-faint hover:text-ember"
                                title="Delete"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>

                          {linkedTask && (
                            <div className="mt-1.5 flex items-center gap-1.5 text-[10px] bg-ink/[0.03] p-1 rounded border border-line/10">
                              <button
                                type="button"
                                onClick={() => void toggleTask(linkedTask.id)}
                                className={cx(
                                  'h-3 w-3 rounded flex items-center justify-center border',
                                  linkedTask.completed ? 'bg-sage border-sage text-white' : 'border-line/40',
                                )}
                              >
                                {linkedTask.completed && <Check className="h-2 w-2 stroke-[3]" />}
                              </button>
                              <span
                                onClick={() => onOpenTask?.(linkedTask)}
                                className={cx('truncate cursor-pointer hover:underline', linkedTask.completed && 'line-through text-ink-faint')}
                              >
                                {linkedTask.title}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {dayEvs.length === 0 && dayTs.length === 0 && (
                      <div className="py-8 text-center text-[11px] text-ink-faint/60 italic">
                        Free day
                      </div>
                    )}

                    {/* Tasks in Column */}
                    {dayTs.length > 0 && (
                      <div className="pt-2 border-t border-line/10 space-y-1">
                        <span className="text-[10px] uppercase font-semibold text-ink-faint block">
                          Tasks Due ({dayTs.length})
                        </span>
                        {dayTs.map((t) => (
                          <div
                            key={t.id}
                            onClick={() => onOpenTask?.(t)}
                            className="cursor-pointer truncate text-[11px] text-ink-soft rounded px-1.5 py-0.5 border border-dashed border-line/20 hover:border-honey hover:bg-honey/[0.04]"
                          >
                            • {t.title}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day Timeline View */}
      {viewMode === 'day' && (
        <div className="pane p-4 sm:p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-line/15">
            <div>
              <h3 className="heading font-serif text-3xl text-ink">{formatLong(selected)}</h3>
              <p className="text-xs text-ink-soft mt-0.5">
                {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'} · {dayTasks.length}{' '}
                {dayTasks.length === 1 ? 'task' : 'tasks'} due
              </p>
            </div>
            <button
              type="button"
              className="btn-honey h-9 !px-4 text-xs font-medium rounded-md"
              onClick={() => openNewEvent(selected)}
            >
              <Plus className="h-3.5 w-3.5" /> Add Event for This Day
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            {/* Timeline Breakdown */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-faint flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Day Agenda
              </h4>

              {dayEvents.length === 0 ? (
                <div className="rounded-md border border-dashed border-line/20 p-8 text-center text-sm text-ink-faint">
                  No events scheduled for {formatShort(selected)}. Double click anywhere or click &quot;Add Event&quot; above to add one.
                </div>
              ) : (
                <div className="space-y-3">
                  {dayEvents.map((e) => {
                    const linkedTask = e.task_id ? tasksById.get(e.task_id) : e.task;
                    return (
                      <div
                        key={e.id}
                        className="group flex gap-4 rounded-md border border-line/15 bg-surface/80 p-4 shadow-xs hover:border-honey/50 transition-colors"
                      >
                        <span className="mt-1 h-3 w-3 rounded-full shrink-0" style={dot(e.category)} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h5 className="font-semibold text-base text-ink">{e.title}</h5>
                              <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-ink-soft">
                                <span className="font-medium text-ink inline-flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5 text-ink-faint" /> {e.time}
                                </span>
                                {e.location && (
                                  <span className="inline-flex items-center gap-1 text-ink-faint">
                                    <MapPin className="h-3.5 w-3.5" /> {e.location}
                                  </span>
                                )}
                                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-ink/[0.04]">
                                  {e.category}
                                </span>
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => openEditEvent(e)}
                                className="p-1 text-ink-faint hover:text-honey rounded hover:bg-honey/15"
                                title="Edit"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => void removeEvent(e.id)}
                                className="p-1 text-ink-faint hover:text-ember rounded hover:bg-ember/15"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {linkedTask && (
                            <div className="mt-3 flex items-center justify-between gap-2 rounded-md border border-line/15 bg-ink/[0.025] px-3 py-2 text-xs">
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <button
                                  type="button"
                                  onClick={() => void toggleTask(linkedTask.id)}
                                  className={cx(
                                    'h-4 w-4 shrink-0 rounded flex items-center justify-center border transition-colors',
                                    linkedTask.completed
                                      ? 'bg-sage border-sage text-white'
                                      : 'border-line/40 hover:border-honey bg-surface',
                                  )}
                                >
                                  {linkedTask.completed && <Check className="h-3 w-3 stroke-[3]" />}
                                </button>
                                <span
                                  onClick={() => onOpenTask?.(linkedTask)}
                                  className={cx(
                                    'truncate font-medium cursor-pointer hover:underline',
                                    linkedTask.completed ? 'line-through text-ink-faint' : 'text-ink-soft',
                                  )}
                                >
                                  Linked Task: {linkedTask.title}
                                </span>
                              </div>
                              <span className="text-[10px] font-semibold uppercase text-ink-faint px-2 py-0.5 rounded bg-ink/[0.04]">
                                {linkedTask.priority}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Day Tasks & Quick Add */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-faint flex items-center gap-1.5">
                <ListTodo className="h-3.5 w-3.5" /> Tasks Due Today
              </h4>
              <QuickAdd defaults={{ due_date: selected }} className="text-xs" />

              <ul className="space-y-2">
                {dayTasks.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-line/15 bg-surface p-3 text-xs shadow-2xs hover:border-honey/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => void toggleTask(t.id)}
                        className={cx(
                          'h-4 w-4 shrink-0 rounded flex items-center justify-center border transition-colors',
                          t.completed ? 'bg-sage border-sage text-white' : 'border-line/40 hover:border-honey bg-surface',
                        )}
                      >
                        {t.completed && <Check className="h-3 w-3 stroke-[3]" />}
                      </button>
                      <span
                        onClick={() => onOpenTask?.(t)}
                        className={cx(
                          'truncate font-medium cursor-pointer hover:underline',
                          t.completed ? 'line-through text-ink-faint' : 'text-ink-soft',
                        )}
                      >
                        {t.title}
                      </span>
                    </div>
                    <span className="text-[10px] uppercase font-semibold text-ink-faint px-1.5 py-0.5 rounded bg-ink/[0.04]">
                      {t.priority}
                    </span>
                  </li>
                ))}
                {dayTasks.length === 0 && (
                  <li className="py-6 text-center text-xs text-ink-faint border border-dashed border-line/20 rounded-md">
                    No deadlines due on this day.
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Event Form Modal (Create & Edit) */}
      <EventModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingEvent(null);
        }}
        initialDate={modalDate}
        event={editingEvent}
        tasks={tasks}
      />
    </div>
  );
};

// Event Modal with Linked Task Selection
interface EventModalProps {
  open: boolean;
  onClose: () => void;
  initialDate: string;
  event: CalendarEvent | null;
  tasks: Task[];
}

const EventModal: React.FC<EventModalProps> = ({ open, onClose, initialDate, event, tasks }) => {
  const addEvent = useEvents((s) => s.add);
  const updateEvent = useEvents((s) => s.update);

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState('');
  const [category, setCategory] = useState<EventCategory>('Academic');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Linked task states: 'new' (auto-create) or 'existing' (pick from tasks)
  const [taskLinkMode, setTaskLinkMode] = useState<'new' | 'existing'>('new');
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  // Sync state when opened
  useEffect(() => {
    if (open) {
      if (event) {
        setTitle(event.title);
        setDate(event.date);
        setTime(event.time === 'All Day' || event.time === 'All day' ? '' : event.time);
        setCategory(event.category as EventCategory);
        setLocation(event.location || '');
        if (event.task_id) {
          setTaskLinkMode('existing');
          setSelectedTaskId(event.task_id);
        } else {
          setTaskLinkMode('new');
          setSelectedTaskId(null);
        }
      } else {
        setTitle('');
        setDate(initialDate);
        setTime('');
        setCategory('Academic');
        setLocation('');
        setTaskLinkMode('new');
        setSelectedTaskId(null);
      }
      setIsSubmitting(false);
    }
  }, [open, event, initialDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    setIsSubmitting(true);
    const timeValue = time.trim() || 'All Day';

    try {
      if (event) {
        // Edit existing
        const patch: Partial<CalendarEvent> = {
          title: title.trim(),
          date,
          time: timeValue,
          category,
          location: location.trim(),
          task_id: taskLinkMode === 'existing' ? selectedTaskId : null,
        };
        const res = await updateEvent(event.id, patch);
        if (res) onClose();
      } else {
        // Create new
        const newPayload = {
          title: title.trim(),
          date,
          time: timeValue,
          category,
          location: location.trim(),
          task_id: taskLinkMode === 'existing' ? selectedTaskId : undefined,
          create_linked_task: taskLinkMode === 'new',
        };
        const res = await addEvent(newPayload);
        if (res) onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={event ? 'Edit Event' : 'New Calendar Event'} width="md">
      <form className="space-y-3.5" onSubmit={handleSubmit}>
        <label className="block space-y-1">
          <span className="label">Title</span>
          <input
            autoFocus
            className="field rounded-md"
            placeholder="e.g. AOCP Supervision with Micalah"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={255}
            required
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="label">Date</span>
            <input
              type="date"
              className="field rounded-md"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </label>
          <label className="block space-y-1">
            <span className="label">Time</span>
            <input
              className="field rounded-md"
              placeholder="e.g. 2:00 PM – 3:00 PM (or blank)"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              maxLength={100}
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="label">Category</span>
            <select
              className="field rounded-md"
              value={category}
              onChange={(e) => setCategory(e.target.value as EventCategory)}
            >
              {EVENT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="label">Where / Location</span>
            <input
              className="field rounded-md"
              placeholder="e.g. Hagfors 151, Zoom, Home"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={255}
            />
          </label>
        </div>

        {/* Linked Task Section: "every calendar event should link to a task" */}
        <div className="rounded-md border border-line/20 bg-ink/[0.025] p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-honey" /> Linked Task
            </span>
            <span className="text-[10px] text-ink-faint">Every event links to a task</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setTaskLinkMode('new');
                setSelectedTaskId(null);
              }}
              className={cx(
                'p-2 rounded border text-left transition-colors',
                taskLinkMode === 'new'
                  ? 'border-honey bg-honey/10 font-semibold text-ink ring-1 ring-honey'
                  : 'border-line/20 bg-surface text-ink-soft hover:bg-ink/[0.04]',
              )}
            >
              <div className="flex items-center gap-1.5">
                <span className={cx('h-2 w-2 rounded-full', taskLinkMode === 'new' ? 'bg-honey' : 'bg-line/40')} />
                <span>Auto-Create Task</span>
              </div>
              <p className="mt-1 text-[10px] text-ink-faint font-normal">
                Matches event title, date & category
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setTaskLinkMode('existing');
                if (!selectedTaskId && tasks.length > 0) {
                  setSelectedTaskId(tasks[0].id);
                }
              }}
              className={cx(
                'p-2 rounded border text-left transition-colors',
                taskLinkMode === 'existing'
                  ? 'border-honey bg-honey/10 font-semibold text-ink ring-1 ring-honey'
                  : 'border-line/20 bg-surface text-ink-soft hover:bg-ink/[0.04]',
              )}
            >
              <div className="flex items-center gap-1.5">
                <span className={cx('h-2 w-2 rounded-full', taskLinkMode === 'existing' ? 'bg-honey' : 'bg-line/40')} />
                <span>Link Existing Task</span>
              </div>
              <p className="mt-1 text-[10px] text-ink-faint font-normal">
                Select an open task from list
              </p>
            </button>
          </div>

          {taskLinkMode === 'existing' && (
            <label className="block space-y-1 pt-1">
              <span className="text-[11px] text-ink-soft">Select task to link:</span>
              <select
                className="field rounded-md text-xs"
                value={selectedTaskId ?? ''}
                onChange={(e) => setSelectedTaskId(e.target.value ? Number(e.target.value) : null)}
                required
              >
                <option value="" disabled>
                  Choose a task...
                </option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.category} · {t.priority})
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost rounded-md" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn-honey rounded-md font-medium"
            disabled={!title.trim() || !date || isSubmitting}
          >
            {isSubmitting ? 'Saving...' : event ? 'Update Event' : 'Add Event'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
