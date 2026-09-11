import React, { useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, Sparkles } from 'lucide-react';
import { useTimerStore, TimerMode } from '../../store/useTimerStore';
import { playPurrChime } from '../../utils/sound';

export const PomodoroTimer: React.FC = () => {
  const {
    seconds,
    totalSeconds,
    mode,
    isRunning,
    pawsEarned,
    start,
    pause,
    reset,
    setMode,
    tick,
  } = useTimerStore();

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        tick();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, tick]);

  const formatTime = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // SVG Progress Ring calculations
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = totalSeconds > 0 ? (totalSeconds - seconds) / totalSeconds : 0;
  const strokeDashoffset = circumference - progressRatio * circumference;

  const modes: Array<{ id: TimerMode; label: string; duration: string }> = [
    { id: 'focus', label: 'Focus Sprint', duration: '25m' },
    { id: 'short', label: 'Cat Nap', duration: '5m' },
    { id: 'long', label: 'Long Nap', duration: '15m' },
  ];

  return (
    <div className="bg-white/90 dark:bg-[#1E1B24]/90 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-cat-200/80 dark:border-stone-800 shadow-cozy dark:shadow-stain flex flex-col items-center text-center space-y-6">
      {/* Title */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-cat-500" />
        <h2 className="text-xl font-bold font-cozy text-stone-900 dark:text-stone-100">
          🐾 Purr-modoro Focus Den
        </h2>
      </div>

      {/* Mode Buttons */}
      <div className="flex bg-cat-50 dark:bg-stone-800 p-1.5 rounded-2xl border border-cat-200/80 dark:border-stone-700 gap-1">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              mode === m.id
                ? 'bg-cat-500 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-cat-100/60 dark:hover:bg-stone-700/60'
            }`}
          >
            {m.label} ({m.duration})
          </button>
        ))}
      </div>

      {/* Circular Progress Ring with Timer Display */}
      <div className="relative flex items-center justify-center">
        <svg className="w-56 h-56 transform -rotate-90" viewBox="0 0 200 200">
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-cat-100 dark:text-stone-800"
          />
          {/* Progress circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="text-cat-500 transition-all duration-500 ease-out"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-black font-mono tracking-tight text-stone-900 dark:text-stone-100">
            {formatTime(seconds)}
          </span>
          <span className="text-xs font-bold text-cat-600 dark:text-cat-400 mt-1 uppercase tracking-wider">
            {mode === 'focus' ? 'Study Block' : 'Resting'}
          </span>
        </div>
      </div>

      {/* Paws Session Counter & Audio Test */}
      <div className="flex items-center justify-center gap-4 text-xs">
        <span className="text-stone-500 dark:text-stone-400">
          Paws earned today:{' '}
          <strong className="text-cat-600 dark:text-cat-400 font-extrabold text-sm">
            {pawsEarned} 🐾
          </strong>
        </span>

        <button
          onClick={() => playPurrChime()}
          title="Test synthesized audio chime"
          className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-cat-600 dark:hover:text-cat-400 transition-colors cursor-pointer"
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>Test Chime</span>
        </button>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={isRunning ? pause : start}
          className="px-8 py-3 rounded-2xl bg-cat-500 hover:bg-cat-600 text-white font-bold text-sm shadow-cozy hover:shadow-cozy-lg transition-all flex items-center gap-2 cursor-pointer"
        >
          {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
          <span>{isRunning ? 'Pause' : 'Start Focus Sprint'}</span>
        </button>

        <button
          onClick={reset}
          className="px-5 py-3 rounded-2xl bg-cat-50 dark:bg-stone-800 hover:bg-cat-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold text-sm border border-cat-200 dark:border-stone-700 transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
};
