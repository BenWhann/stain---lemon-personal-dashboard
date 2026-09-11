import React, { useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { useTimerStore } from '../../store/useTimerStore';

interface MiniTimerProps {
  onOpenFull: () => void;
}

export const MiniTimer: React.FC<MiniTimerProps> = ({ onOpenFull }) => {
  const { seconds, isRunning, start, pause, reset, tick } = useTimerStore();

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

  return (
    <div className="bg-gradient-to-br from-cat-500 via-amber-600 to-cat-600 text-white p-6 rounded-3xl shadow-cozy dark:shadow-stain space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-xs uppercase tracking-wider font-cozy text-white/90">
          🐾 Purr-modoro Focus
        </h3>
        <button
          onClick={onOpenFull}
          className="text-xs font-semibold underline text-cat-100 hover:text-white cursor-pointer"
        >
          Full Hub →
        </button>
      </div>

      <div className="text-center py-1">
        <div className="text-4xl font-black font-mono tracking-tight">
          {formatTime(seconds)}
        </div>
        <p className="text-xs text-cat-100 mt-1">Sprint with Lemon & Stain</p>
      </div>

      <div className="flex justify-center gap-2">
        <button
          onClick={isRunning ? pause : start}
          className="px-4 py-2 rounded-xl bg-white text-cat-800 font-extrabold text-xs hover:bg-cat-50 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
        >
          {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-cat-800" />}
          <span>{isRunning ? 'Pause' : 'Start Focus 🐾'}</span>
        </button>

        <button
          onClick={reset}
          className="px-3 py-2 rounded-xl bg-cat-700/50 text-white font-semibold text-xs hover:bg-cat-700 cursor-pointer transition-all"
          title="Reset timer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
