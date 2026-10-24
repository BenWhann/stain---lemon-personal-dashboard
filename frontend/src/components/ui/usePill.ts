import { useLayoutEffect, useRef, useState } from 'react';

/**
 * Measures the active option so a highlight can slide to it with a plain
 * transform animation. (Shared-layout animations can stall exit animations
 * of the dialogs these controls live in, so they are avoided here.)
 */
export function usePill<T extends string>(active: T, deps: unknown[] = []) {
  const refs = useRef(new Map<T, HTMLElement>());
  const [rect, setRect] = useState<{ x: number; w: number } | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const el = refs.current.get(active);
      if (el) setRect({ x: el.offsetLeft, w: el.offsetWidth });
    };
    measure();
    const el = refs.current.get(active);
    const parent = el?.parentElement;
    if (!parent) return;
    const ro = new ResizeObserver(measure);
    ro.observe(parent);
    return () => ro.disconnect();
    // re-measure when the active option or any caller-supplied input (labels) changes
  }, [active, ...deps]);

  const register = (key: T) => (el: HTMLElement | null) => {
    if (el) refs.current.set(key, el);
    else refs.current.delete(key);
  };

  return { rect, register };
}
