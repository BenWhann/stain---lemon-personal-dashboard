import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Check, Sparkles, X } from 'lucide-react';
import { useToasts } from '../../store/toast';
import { PawIcon } from './PawCheck';
import { cx } from './cx';

export const Toaster: React.FC = () => {
  const { toasts, dismiss } = useToasts();
  return (
    <div
      className="pointer-events-none fixed bottom-5 left-1/2 z-[80] flex w-[min(92vw,26rem)] -translate-x-1/2 flex-col items-stretch gap-2"
      aria-live="polite"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 24, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95, transition: { duration: 0.18 } }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            className="pane-solid pointer-events-auto flex items-center gap-3 overflow-hidden !rounded-2xl px-4 py-3 text-sm"
          >
            <span
              className={cx(
                'grid h-7 w-7 shrink-0 place-items-center rounded-full',
                t.tone === 'error' && 'bg-ember/15 text-ember',
                t.tone === 'success' && 'bg-sage/20 text-sage',
                t.tone === 'reward' && 'bg-honey/20 text-honey',
                t.tone === 'info' && 'bg-ink/10 text-ink-soft',
              )}
            >
              {t.tone === 'error' ? (
                <AlertCircle className="h-4 w-4" />
              ) : t.tone === 'success' ? (
                <Check className="h-4 w-4" />
              ) : t.tone === 'reward' ? (
                <Sparkles className="h-4 w-4" />
              ) : (
                <PawIcon className="h-3.5 w-3.5" />
              )}
            </span>
            <span className="flex-1 text-ink">{t.message}</span>
            {t.action && (
              <button
                type="button"
                className="rounded-full px-3 py-1 text-sm font-semibold text-honey hover:bg-honey/10"
                onClick={() => {
                  t.action!.run();
                  dismiss(t.id);
                }}
              >
                {t.action.label}
              </button>
            )}
            <button type="button" aria-label="Dismiss" className="text-ink-faint hover:text-ink" onClick={() => dismiss(t.id)}>
              <X className="h-3.5 w-3.5" />
            </button>
            <motion.span
              className="absolute bottom-0 left-0 h-[2px] bg-honey/60"
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: t.duration / 1000, ease: 'linear' }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
