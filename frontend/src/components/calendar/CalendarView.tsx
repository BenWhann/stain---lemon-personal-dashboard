import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, MapPin, Clock } from 'lucide-react';
import { EventModal } from './EventModal';
import { useEventStore } from '../../store/useEventStore';
import { Badge } from '../common/Badge';

export const CalendarView: React.FC = () => {
  const {
    events,
    selectedDateStr,
    setSelectedDateStr,
    filterCategory,
    setFilterCategory,
    viewDate,
    nextMonth,
    prevMonth,
    goToToday,
    addEvent,
    deleteEvent,
  } = useEventStore();

  const [showModal, setShowModal] = useState(false);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  // Generate grid days
  const calendarDays: Array<{ dayNumber?: number; dateStr?: string; blank: boolean; key: string }> = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push({ blank: true, key: `blank-${i}` });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({ dayNumber: d, dateStr, blank: false, key: dateStr });
  }

  // Filter events
  const filteredEvents = events.filter((e) => {
    if (filterCategory !== 'All' && e.category !== filterCategory) return false;
    return true;
  });

  const selectedDayEvents = filteredEvents.filter((e) => e.date === selectedDateStr);

  const categories = ['All', 'Academic', 'Work', 'Bills', 'Wellness', 'Personal'];

  return (
    <div className="space-y-6">
      {/* Calendar Header Card */}
      <div className="bg-white/90 dark:bg-[#1E1B24]/90 backdrop-blur-md p-6 rounded-3xl border border-cat-200/80 dark:border-stone-800 shadow-cozy dark:shadow-stain flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📅</span>
          <div>
            <h2 className="text-xl md:text-2xl font-bold font-cozy text-stone-900 dark:text-stone-100">
              {monthNames[month]} {year}
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Unified Master Schedule: Augsburg MSW • CARE Counseling • UHHC • Bills
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={prevMonth}
            className="p-2 rounded-xl bg-cat-50 dark:bg-stone-800 border border-cat-200 dark:border-stone-700 text-xs font-bold hover:bg-cat-100 dark:hover:bg-stone-700 cursor-pointer text-stone-700 dark:text-stone-200"
            title="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={goToToday}
            className="px-3.5 py-1.5 rounded-xl bg-cat-100 dark:bg-stone-700 text-cat-800 dark:text-cat-300 text-xs font-bold hover:bg-cat-200 dark:hover:bg-stone-600 cursor-pointer"
          >
            Today (Sep 3)
          </button>

          <button
            onClick={nextMonth}
            className="p-2 rounded-xl bg-cat-50 dark:bg-stone-800 border border-cat-200 dark:border-stone-700 text-xs font-bold hover:bg-cat-100 dark:hover:bg-stone-700 cursor-pointer text-stone-700 dark:text-stone-200"
            title="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="ml-2 px-4 py-1.5 rounded-xl bg-cat-500 hover:bg-cat-600 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Event</span>
          </button>
        </div>
      </div>

      {/* Main Calendar Grid & Day Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Month Grid */}
        <div className="lg:col-span-2 bg-white/90 dark:bg-[#1E1B24]/90 backdrop-blur-md p-6 rounded-3xl border border-cat-200/80 dark:border-stone-800 shadow-cozy dark:shadow-stain space-y-4">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 text-xs font-bold flex-wrap">
            <span className="text-stone-400 text-[11px] mr-1">Filter Feeds:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1 rounded-xl transition-all cursor-pointer shadow-2xs ${
                  filterCategory === cat
                    ? 'bg-cat-500 text-white shadow-xs'
                    : 'bg-cat-50 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-cat-100 dark:hover:bg-stone-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Weekday Labels */}
          <div>
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-stone-400 mb-2">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Day Cells */}
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((item) => {
                if (item.blank) {
                  return (
                    <div
                      key={item.key}
                      className="h-20 sm:h-24 rounded-2xl bg-stone-50/40 dark:bg-stone-900/20 opacity-30"
                    />
                  );
                }

                const isSelected = item.dateStr === selectedDateStr;
                const dayEvents = filteredEvents.filter((e) => e.date === item.dateStr);

                return (
                  <div
                    key={item.key}
                    onClick={() => item.dateStr && setSelectedDateStr(item.dateStr)}
                    className={`h-20 sm:h-24 p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-cat-100/90 dark:bg-cat-950/70 border-cat-400 dark:border-cat-500 shadow-sm ring-2 ring-cat-400'
                        : 'bg-cat-50/40 dark:bg-stone-800/30 border-cat-100/80 dark:border-stone-800 hover:border-cat-300 dark:hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold ${
                          isSelected
                            ? 'text-cat-800 dark:text-cat-300 font-extrabold'
                            : 'text-stone-700 dark:text-stone-300'
                        }`}
                      >
                        {item.dayNumber}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="w-2 h-2 rounded-full bg-cat-500 shadow-xs" />
                      )}
                    </div>

                    <div className="space-y-0.5 overflow-hidden">
                      {dayEvents.slice(0, 2).map((ev) => (
                        <div
                          key={ev.id}
                          className="text-[9px] truncate px-1.5 py-0.5 rounded bg-white/90 dark:bg-stone-900 text-cat-900 dark:text-cat-200 font-semibold"
                        >
                          {ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <span className="text-[8px] text-stone-400 dark:text-stone-500">
                          +{dayEvents.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Date Detail Panel */}
        <div className="space-y-6">
          <div className="bg-white/90 dark:bg-[#1E1B24]/90 backdrop-blur-md p-6 rounded-3xl border border-cat-200/80 dark:border-stone-800 shadow-cozy dark:shadow-stain space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-cozy text-stone-900 dark:text-stone-100">
                  Selected Date Events
                </h3>
                <p className="text-xs text-cat-600 dark:text-cat-400 font-semibold">
                  📅 {selectedDateStr}
                </p>
              </div>

              <button
                onClick={() => setShowModal(true)}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-cat-100 dark:bg-stone-800 text-cat-800 dark:text-cat-300 hover:bg-cat-200 dark:hover:bg-stone-700 cursor-pointer"
              >
                + Add
              </button>
            </div>

            <div className="space-y-2.5 max-h-96 overflow-y-auto custom-scrollbar pr-1">
              {selectedDayEvents.length === 0 ? (
                <div className="text-center py-10 text-xs text-stone-400">
                  <p className="text-2xl mb-1">🐾</p>
                  <p>No events scheduled for this day.</p>
                </div>
              ) : (
                selectedDayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3.5 rounded-2xl bg-cat-50/50 dark:bg-stone-800/40 border-l-4 border-l-cat-500 border border-cat-100/80 dark:border-stone-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100">
                        {ev.title}
                      </h4>
                      <button
                        onClick={() => deleteEvent(ev.id)}
                        className="text-stone-400 hover:text-rose-500 text-xs px-1 cursor-pointer"
                        title="Delete event"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-stone-500 dark:text-stone-400">
                      <Clock className="w-3 h-3 text-cat-500" />
                      <span>{ev.time}</span>
                    </div>

                    {ev.location && (
                      <div className="flex items-center gap-2 text-[10px] text-stone-400">
                        <MapPin className="w-3 h-3 text-cat-400" />
                        <span>{ev.location}</span>
                      </div>
                    )}

                    <Badge variant="stone" size="sm">
                      {ev.category}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Connected Feeds Info Box */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-cat-500/10 to-amber-500/10 border border-cat-200/80 dark:border-stone-800 text-xs space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-cat-800 dark:text-cat-300">
              <CalendarIcon className="w-4 h-4 text-cat-500" />
              <span>Connected Master Feeds</span>
            </div>
            <ul className="text-stone-500 dark:text-stone-400 text-[11px] space-y-1 list-disc list-inside">
              <li>Augsburg MSW (Clinical Practice, Seminars, Forums)</li>
              <li>CARE Counseling (Practicum Shifts & Supervision)</li>
              <li>Universal Home Health Care (UHHC Shifts & Payroll)</li>
              <li>Personal Bills & Pet Care (Banfield Vet for Lemon & Stain)</li>
            </ul>
          </div>
        </div>
      </div>

      <EventModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        defaultDate={selectedDateStr}
        onSave={addEvent}
      />
    </div>
  );
};
