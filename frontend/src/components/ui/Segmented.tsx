import { motion } from 'framer-motion';
import { cx } from './cx';
import { usePill } from './usePill';

interface SegmentedProps<T extends string> {
  value: T;
  options: { value: T; label: React.ReactNode; title?: string }[];
  onChange: (v: T) => void;
  size?: 'sm' | 'md';
  className?: string;
  label: string;
}

export function Segmented<T extends string>({ value, options, onChange, size = 'md', className, label }: SegmentedProps<T>) {
  const { rect, register } = usePill(value, [options.map((o) => String(o.label)).join('|')]);
  return (
    <div role="radiogroup" aria-label={label} className={cx('relative inline-flex items-center gap-0.5 rounded-full bg-ink/[0.06] p-1', className)}>
      {rect && (
        <motion.span
          aria-hidden
          className="absolute bottom-1 left-0 top-1 rounded-full"
          style={{ background: 'linear-gradient(180deg, rgb(var(--honey)), rgb(var(--honey-deep)))' }}
          initial={false}
          animate={{ x: rect.x, width: rect.w }}
          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
        />
      )}
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            ref={register(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            title={o.title}
            onClick={() => onChange(o.value)}
            className={cx(
              'relative rounded-full font-medium transition-colors duration-300',
              size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-sm',
              active ? 'text-night' : 'text-ink-soft hover:text-ink',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
