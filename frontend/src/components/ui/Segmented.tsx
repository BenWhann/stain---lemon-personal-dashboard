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
    <div role="radiogroup" aria-label={label} className={cx('relative inline-flex items-center gap-0.5 rounded-md bg-ink/[0.04] p-0.5 border border-line/15', className)}>
      {rect && (
        <motion.span
          aria-hidden
          className="absolute bottom-0.5 left-0 top-0.5 rounded-[4px] bg-honey border border-honey-deep/40 shadow-sm"
          initial={false}
          animate={{ x: rect.x, width: rect.w }}
          transition={{ type: 'spring', stiffness: 500, damping: 38 }}
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
              'relative rounded-[4px] font-medium transition-colors duration-150',
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs',
              active ? 'text-night font-semibold' : 'text-ink-soft hover:text-ink',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
