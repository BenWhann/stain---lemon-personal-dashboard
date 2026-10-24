import React, { useEffect, useState } from 'react';
import { cx } from './cx';

/** Two-step destructive button: the first click arms it, the second confirms. Disarms after 3 s. */
export const ConfirmButton: React.FC<{
  onConfirm: () => void;
  label: string;
  confirmLabel?: string;
  className?: string;
  children: React.ReactNode;
}> = ({ onConfirm, label, confirmLabel = 'Delete?', className, children }) => {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = window.setTimeout(() => setArmed(false), 3000);
    return () => window.clearTimeout(t);
  }, [armed]);
  return (
    <button
      type="button"
      aria-label={armed ? `Confirm: ${label}` : label}
      className={cx(armed && '!opacity-100 rounded-full bg-ember/15 px-1.5 font-semibold text-ember', className)}
      onClick={(e) => {
        e.stopPropagation();
        if (armed) {
          setArmed(false);
          onConfirm();
        } else setArmed(true);
      }}
    >
      {armed ? confirmLabel : children}
    </button>
  );
};
