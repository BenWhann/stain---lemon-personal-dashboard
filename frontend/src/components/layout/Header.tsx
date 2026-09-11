import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, RefreshCw, Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../../store/useThemeStore';
import { usePetStore } from '../../store/usePetStore';
import { useTaskStore } from '../../store/useTaskStore';
import { formatDateFull, getTimeOfDayGreeting } from '../../utils/dateUtils';

interface HeaderProps {
  onOpenSync: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSync }) => {
  const { isStainMode, toggleTheme } = useThemeStore();
  const { lemonPets, stainPets, petLemon, petStain } = usePetStore();
  const { syncStatus, lastSyncTime, syncWithGoogleSheet } = useTaskStore();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handlePetLemon = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    petLemon({ x: rect.left + rect.width / 2, y: rect.top });
  };

  const handlePetStain = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    petStain({ x: rect.left + rect.width / 2, y: rect.top });
  };

  return (
    <header className="relative overflow-hidden bg-white/90 dark:bg-[#1E1B24]/90 backdrop-blur-md p-5 md:p-6 rounded-3xl border border-cat-200/80 dark:border-stone-800 shadow-cozy dark:shadow-stain transition-all">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Companion Avatars & Greeting */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePetLemon}
              title="Click to pet Lemon! 🍋"
              className="relative group w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-400 to-cat-500 flex items-center justify-center text-xl shadow-md shadow-cat-500/20 cursor-pointer border border-amber-200"
            >
              <span>🐱</span>
              <span className="absolute -bottom-1 -right-1 text-[10px] bg-white dark:bg-stone-800 px-1 py-0.2 rounded-full font-bold text-amber-600 shadow border border-cat-100 dark:border-stone-700">
                🍋
              </span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePetStain}
              title="Click to pet Stain! 🐈‍⬛"
              className="relative group w-12 h-12 rounded-2xl bg-gradient-to-br from-stone-800 via-stone-900 to-[#151318] flex items-center justify-center text-xl shadow-md shadow-black/40 cursor-pointer border border-stone-700"
            >
              <span>🐈‍⬛</span>
              <span className="absolute -bottom-1 -right-1 text-[10px] bg-white dark:bg-stone-800 px-1 py-0.2 rounded-full font-bold text-stone-300 shadow border border-stone-700">
                🐾
              </span>
            </motion.button>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold font-cozy tracking-tight text-stone-900 dark:text-stone-100">
                {getTimeOfDayGreeting()}, Aretta ✨
              </h1>
              <Sparkles className="w-4 h-4 text-cat-500 dark:text-cat-400 hidden sm:inline" />
            </div>
            <p className="text-xs md:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
              {formatDateFull(time)} •{' '}
              <span className="text-amber-600 dark:text-amber-400 font-bold ml-1">Lemon: {lemonPets} 🍋</span> •{' '}
              <span className="text-cat-600 dark:text-cat-400 font-bold ml-1">Stain: {stainPets} 🐾</span>
            </p>
          </div>
        </div>

        {/* Right: Sync Status & Theme Switcher */}
        <div className="flex items-center gap-2.5 self-end md:self-auto flex-wrap">
          {/* Live Sync Status */}
          <button
            onClick={() => syncWithGoogleSheet(true)}
            title="Click to refresh tasks from Google Sheet"
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-cat-50 dark:bg-stone-800/80 border border-cat-200 dark:border-stone-700 text-xs font-semibold text-cat-800 dark:text-cat-300 hover:bg-cat-100 dark:hover:bg-stone-700 transition-all cursor-pointer shadow-2xs"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                syncStatus.startsWith('Live') ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <RefreshCw className="w-3 h-3 text-cat-600 dark:text-cat-400" />
            <span>{syncStatus}</span>
            {lastSyncTime && (
              <span className="text-[10px] text-stone-400 font-normal">({lastSyncTime})</span>
            )}
          </button>

          {/* Theme Toggle Button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={toggleTheme}
            className="px-4 py-2 rounded-2xl bg-cat-50 dark:bg-stone-800/80 border border-cat-200 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-200 hover:bg-cat-100 dark:hover:bg-stone-700 transition-all flex items-center gap-2 shadow-2xs cursor-pointer"
            title="Switch between Lemon Mode (Light) and Stain Mode (Dark)"
          >
            {isStainMode ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>🍋 Lemon Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-cat-600" />
                <span>🐾 Stain Mode</span>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </header>
  );
};
