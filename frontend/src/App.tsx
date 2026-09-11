import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from './components/layout/Header';
import { Navigation } from './components/layout/Navigation';
import { FloatingEmoji } from './components/common/FloatingEmoji';

// Bento Components
import { PetCompanionCard } from './components/bento/PetCompanionCard';
import { SprintVelocityBar } from './components/bento/SprintVelocityBar';
import { QuickStatsCard } from './components/bento/QuickStatsCard';

// Domain Components
import { TaskManager } from './components/tasks/TaskManager';
import { HabitTracker } from './components/habits/HabitTracker';
import { BookmarkGrid } from './components/bookmarks/BookmarkGrid';
import { AgendaList } from './components/calendar/AgendaList';
import { CalendarView } from './components/calendar/CalendarView';
import { MiniTimer } from './components/timer/MiniTimer';
import { PomodoroTimer } from './components/timer/PomodoroTimer';
import { AssignmentTracker } from './components/study/AssignmentTracker';
import { Scratchpad } from './components/study/Scratchpad';
import { GoogleSheetSync } from './components/integrations/GoogleSheetSync';

// Stores
import { useThemeStore } from './store/useThemeStore';
import { useTaskStore } from './store/useTaskStore';
import { useEventStore } from './store/useEventStore';
import { useHabitStore } from './store/useHabitStore';
import { usePetStore } from './store/usePetStore';
import { useBookmarkStore } from './store/useBookmarkStore';
import { useNoteStore } from './store/useNoteStore';
import { DashboardTab } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const isStainMode = useThemeStore((state) => state.isStainMode);

  // Store actions
  const fetchTasks = useTaskStore((state) => state.fetchTasks);
  const syncWithGoogleSheet = useTaskStore((state) => state.syncWithGoogleSheet);
  const autoSync = useTaskStore((state) => state.autoSync);
  const fetchEvents = useEventStore((state) => state.fetchEvents);
  const events = useEventStore((state) => state.events);
  const fetchHabits = useHabitStore((state) => state.fetchHabits);
  const fetchCounters = usePetStore((state) => state.fetchCounters);
  const fetchBookmarks = useBookmarkStore((state) => state.fetchBookmarks);
  const fetchNotes = useNoteStore((state) => state.fetchNotes);
  const fetchAssignments = useNoteStore((state) => state.fetchAssignments);

  // Initialize theme class
  useEffect(() => {
    if (isStainMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isStainMode]);

  // Initial data loading
  useEffect(() => {
    fetchTasks();
    fetchEvents();
    fetchHabits();
    fetchCounters();
    fetchBookmarks();
    fetchNotes();
    fetchAssignments();

    if (autoSync) {
      syncWithGoogleSheet(false);
    }
  }, [
    fetchTasks,
    fetchEvents,
    fetchHabits,
    fetchCounters,
    fetchBookmarks,
    fetchNotes,
    fetchAssignments,
    autoSync,
    syncWithGoogleSheet,
  ]);

  return (
    <div className="min-h-screen text-stone-800 dark:text-stone-100 transition-colors duration-300 pb-16">
      {/* Floating Emoji Particles Layer */}
      <FloatingEmoji />

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Top Header */}
        <Header onOpenSync={() => setActiveTab('integrations')} />

        {/* Tab Navigation */}
        <Navigation activeTab={activeTab} onSelectTab={setActiveTab} />

        {/* Tab Content */}
        <main>
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              >
                {/* Left 2 Columns: Velocity Bar, Tasks, Habits, Bookmarks */}
                <div className="lg:col-span-2 space-y-6">
                  <SprintVelocityBar />
                  <TaskManager />
                  <HabitTracker />
                  <BookmarkGrid />
                </div>

                {/* Right 1 Column: Pet Companions, Quick Stats, Agenda, Mini Timer, Notes */}
                <div className="space-y-6">
                  <PetCompanionCard />
                  <QuickStatsCard />
                  <AgendaList
                    events={events}
                    onOpenFull={() => setActiveTab('calendar')}
                  />
                  <MiniTimer onOpenFull={() => setActiveTab('study')} />
                  <Scratchpad rows={6} />
                </div>
              </motion.div>
            )}

            {activeTab === 'calendar' && (
              <motion.div
                key="calendar"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <CalendarView />
              </motion.div>
            )}

            {activeTab === 'study' && (
              <motion.div
                key="study"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1">
                    <PomodoroTimer />
                  </div>
                  <div className="lg:col-span-2">
                    <AssignmentTracker />
                  </div>
                </div>
                <Scratchpad rows={8} title="Grad School Clinical Scratchpad" />
              </motion.div>
            )}

            {activeTab === 'integrations' && (
              <motion.div
                key="integrations"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <GoogleSheetSync />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default App;
