import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ArrowRight } from 'lucide-react';

interface OverdueBannerProps {
  count: number;
  onViewOverdue: () => void;
}

export const OverdueBanner: React.FC<OverdueBannerProps> = ({ count, onViewOverdue }) => {
  if (count <= 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center justify-between gap-3 rounded-md border border-ember/25 bg-ember/10 px-4 py-2 shadow-sm"
        role="alert"
        aria-live="polite"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="grid h-6 w-6 shrink-0 place-items-center rounded bg-ember/20 text-ember">
            <AlertCircle className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-ink">
              {count} {count === 1 ? 'task needs' : 'tasks need'} your attention
            </p>
            <p className="truncate text-[11px] text-ink-soft">Past due dates to wrap up or reschedule</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onViewOverdue}
          className="btn-ghost flex shrink-0 items-center gap-1.5 !px-2.5 !py-1 text-xs font-semibold text-ember hover:bg-ember/15"
        >
          Review <ArrowRight className="h-3 w-3" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
