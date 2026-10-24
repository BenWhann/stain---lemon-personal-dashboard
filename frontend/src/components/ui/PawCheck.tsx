import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cx } from './cx';

interface PawCheckProps {
  checked: boolean;
  onToggle: (point: { x: number; y: number }) => void;
  label: string;
  size?: 'sm' | 'md';
  className?: string;
}

/** Round checkbox that fills with honey and stamps a paw print when done. */
export const PawCheck: React.FC<PawCheckProps> = ({ checked, onToggle, label, size = 'md', className }) => {
  const dim = size === 'sm' ? 'h-5 w-5' : 'h-7 w-7';
  return (
    <motion.button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      whileTap={{ scale: 0.82 }}
      whileHover={{ scale: 1.08 }}
      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
      onClick={(e) => {
        e.stopPropagation();
        const r = e.currentTarget.getBoundingClientRect();
        onToggle({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
      }}
      className={cx(
        'relative grid shrink-0 place-items-center rounded-full border-[1.5px] transition-colors duration-300',
        checked ? 'border-transparent' : 'border-ink-faint/60 hover:border-honey',
        dim,
        className,
      )}
    >
      <AnimatePresence>
        {checked && (
          <motion.span
            key="fill"
            className="absolute inset-0 rounded-full"
            style={{ background: 'radial-gradient(circle at 35% 30%, rgb(var(--honey)), rgb(var(--honey-deep)))' }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 520, damping: 18 }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {checked && (
          <motion.svg
            key="paw"
            viewBox="0 0 24 24"
            className={cx('relative', size === 'sm' ? 'h-3 w-3' : 'h-4 w-4')}
            initial={{ scale: 0, rotate: -40 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 600, damping: 14, delay: 0.05 }}
            fill="rgb(var(--night))"
          >
            <ellipse cx="12" cy="16" rx="5.2" ry="4.4" />
            <ellipse cx="5.6" cy="10.4" rx="2.2" ry="2.8" />
            <ellipse cx="9.6" cy="6.6" rx="2.2" ry="2.9" />
            <ellipse cx="14.4" cy="6.6" rx="2.2" ry="2.9" />
            <ellipse cx="18.4" cy="10.4" rx="2.2" ry="2.8" />
          </motion.svg>
        )}
      </AnimatePresence>
      {/* ring that ripples out on completion */}
      <AnimatePresence>
        {checked && (
          <motion.span
            key="ring"
            className="pointer-events-none absolute inset-0 rounded-full border-2 border-honey"
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: 2.2, opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export const PawIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <ellipse cx="12" cy="16" rx="5.2" ry="4.4" />
    <ellipse cx="5.6" cy="10.4" rx="2.2" ry="2.8" />
    <ellipse cx="9.6" cy="6.6" rx="2.2" ry="2.9" />
    <ellipse cx="14.4" cy="6.6" rx="2.2" ry="2.9" />
    <ellipse cx="18.4" cy="10.4" rx="2.2" ry="2.8" />
  </svg>
);
