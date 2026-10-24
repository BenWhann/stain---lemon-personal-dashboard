import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import { StudyScene } from './art/StudyScene';
import { LoginScreen } from './components/auth/LoginScreen';
import { Insights } from './components/insights/Insights';
import { Journal } from './components/journal/Journal';
import { useXp } from './components/journal/useXp';
import { CommandPalette } from './components/layout/CommandPalette';
import { Parade } from './components/layout/Parade';
import { BrandMark, TopBar } from './components/layout/TopBar';
import { Settings } from './components/settings/Settings';
import { TaskEditor } from './components/tasks/TaskEditor';
import { Toaster } from './components/ui/Toaster';
import { useEnvironment } from './hooks/useEnvironment';
import { useLenis } from './hooks/useLenis';
import { useShortcuts } from './hooks/useShortcuts';
import { setAmbience, sfx, stopAllAmbience, AMBIENCE_CHANNELS } from './lib/audio';
import { fanfare, hearts } from './lib/celebrate';
import { useAuth } from './store/auth';
import { useBookmarks } from './store/bookmarks';
import { useEvents } from './store/events';
import { useHabits } from './store/habits';
import { useNotes } from './store/notes';
import { useParade } from './store/parade';
import { usePets } from './store/pets';
import { useTasks } from './store/tasks';
import { formatClock, MODE_LABEL, useTimer } from './store/timer';
import { toast } from './store/toast';
import { useUi } from './store/ui';
import type { Task } from './types';

export const App: React.FC = () => {
  const status = useAuth((s) => s.status);
  const check = useAuth((s) => s.check);
  const { night, calm } = useEnvironment();
  const { lemonAwake, stainExcited, pet } = usePets();
  const setTheme = useUi((s) => s.setTheme);

  useEffect(() => {
    void check();
  }, [check]);

  const toggleTheme = useCallback(() => setTheme(night ? 'day' : 'night'), [night, setTheme]);

  const petFromScene = (cat: 'lemon' | 'stain') => (e: React.MouseEvent) => {
    if (status !== 'signed-in') return;
    pet(cat);
    sfx.purr(cat);
    hearts(e.clientX, e.clientY, cat);
  };

  return (
    <>
      <div className="fixed inset-0 z-0 overflow-hidden">
        <StudyScene
          night={night}
          calm={calm}
          cats={{ lemonAwake, stainExcited }}
          onPetLemon={petFromScene('lemon')}
          onPetStain={petFromScene('stain')}
        />
      </div>
      <AnimatePresence mode="wait">
        {status === 'checking' && <Splash key="splash" />}
        {status === 'signed-out' && (
          <motion.div key="login" exit={{ opacity: 0, scale: 1.03 }} transition={{ duration: 0.4 }}>
            <LoginScreen />
          </motion.div>
        )}
        {status === 'signed-in' && (
          <motion.div key="app" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Dashboard night={night} calm={calm} onToggleTheme={toggleTheme} />
          </motion.div>
        )}
      </AnimatePresence>
      <Toaster />
    </>
  );
};

const Splash: React.FC = () => (
  <motion.div className="relative z-10 grid min-h-[100svh] place-items-center" exit={{ opacity: 0 }}>
    <motion.div animate={{ rotate: [0, -12, 0], scale: [1, 1.06, 1] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}>
      <BrandMark className="h-14 w-14" />
    </motion.div>
  </motion.div>
);

const Dashboard: React.FC<{ night: boolean; calm: boolean; onToggleTheme: () => void }> = ({ night, calm, onToggleTheme }) => {
  const view = useUi((s) => s.view);
  const setView = useUi((s) => s.setView);
  const setPaletteOpen = useUi((s) => s.setPaletteOpen);
  const ambience = useUi((s) => s.ambience);
  const [editing, setEditing] = useState<number | null>(null);
  const quickAddRef = useRef<HTMLInputElement>(null);
  const loaded = useRef(false);

  useLenis(!calm);

  // Load everything once after sign-in
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    void (async () => {
      await useTasks.getState().fetch();
      if (useTasks.getState().autoSync) void useTasks.getState().syncSheet(false);
    })();
    void useEvents.getState().fetch();
    void useHabits.getState().fetch();
    void usePets.getState().fetch();
    void useBookmarks.getState().fetch();
    void useNotes.getState().fetchNotes();
    void useNotes.getState().fetchAssignments();
    void useTimer.getState().fetchSessions();
    return () => stopAllAmbience();
  }, []);

  // Ambience follows the mixer
  useEffect(() => {
    AMBIENCE_CHANNELS.forEach((c) => setAmbience(c.id, ambience[c.id]));
  }, [ambience]);

  // One clock for the focus timer, wherever you are in the app
  useEffect(() => {
    const t = window.setInterval(() => useTimer.getState().tick(), 250);
    useTimer.getState().tick();
    return () => window.clearInterval(t);
  }, []);
  const running = useTimer((s) => s.running);
  const remaining = useTimer((s) => s.remaining);
  const mode = useTimer((s) => s.mode);
  useEffect(() => {
    document.title = running ? `${formatClock(remaining)} · ${MODE_LABEL[mode]} · Lemon & Stain` : 'Lemon & Stain';
  }, [running, remaining, mode]);

  // Level-ups get a proper celebration (but not the first calculation after loading)
  const { level, title } = useXp();
  const prevLevel = useRef<number | null>(null);
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (prevLevel.current !== null && level > prevLevel.current) {
        sfx.levelUp();
        fanfare();
        useParade.getState().start(['lemon', 'stain']);
        toast.reward(`Level ${level}: ${title}! The cats are throwing a parade.`);
      }
      prevLevel.current = level;
    }, prevLevel.current === null ? 2500 : 0);
    return () => window.clearTimeout(t);
  }, [level, title]);

  const openTask = useCallback((t: Task) => setEditing(t.id), []);
  const newTask = useCallback(() => {
    setView('journal');
    window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      quickAddRef.current?.focus();
    }, 80);
  }, [setView]);

  const shortcuts = useMemo(
    () => ({
      'mod+k': () => setPaletteOpen(!useUi.getState().paletteOpen),
      n: newTask,
      f: () => (useTimer.getState().running ? useTimer.getState().pause() : useTimer.getState().start()),
      l: onToggleTheme,
      '1': () => setView('journal'),
      '2': () => setView('insights'),
      '3': () => setView('settings'),
    }),
    [newTask, onToggleTheme, setPaletteOpen, setView],
  );
  useShortcuts(shortcuts);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [view]);

  return (
    <>
      <ScrollVeil view={view} />
      <TopBar night={night} onToggleTheme={onToggleTheme} />
      <main className="relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            // no CSS filter here: a filtered ancestor would stop the glass panes from blurring the room
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {view === 'journal' && <Journal onOpenTask={openTask} quickAddRef={quickAddRef} calm={calm} />}
            {view === 'insights' && <Insights />}
            {view === 'settings' && <Settings />}
          </motion.div>
        </AnimatePresence>
      </main>
      <Parade enabled={!calm} />
      <CommandPalette onNewTask={newTask} onOpenTask={openTask} onToggleTheme={onToggleTheme} />
      <TaskEditor taskId={editing} onClose={() => setEditing(null)} />
    </>
  );
};

/** The room softens behind the content as you scroll down, and on the other views. */
const ScrollVeil: React.FC<{ view: string }> = ({ view }) => {
  const { scrollY } = useScroll();
  const scrolled = useTransform(scrollY, [0, 520], [0, 0.62]);
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[1]"
      style={{ background: 'rgb(var(--shade))', opacity: view === 'journal' ? scrolled : 0.58 }}
    />
  );
};

export default App;
