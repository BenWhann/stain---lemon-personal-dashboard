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
        className="flex items-center justify-between gap-3 rounded-2xl border border-honey/30 bg-honey/15 px-4 py-2.5 shadow-sm backdrop-blur-md"
        role="alert"
        aria-live="polite"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-honey/25 text-honey-deep dark:text-honey">
            <AlertCircle className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">
              {count} {count === 1 ? 'task needs' : 'tasks need'} your attention
            </p>
            <p className="truncate text-xs text-ink-soft">Past due dates to wrap up or reschedule</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onViewOverdue}
          className="btn-ghost flex shrink-0 items-center gap-1.5 !px-3 !py-1 text-xs font-semibold text-honey-deep hover:bg-honey/20 dark:text-honey"
        >
          Review <ArrowRight className="h-3 w-3" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
