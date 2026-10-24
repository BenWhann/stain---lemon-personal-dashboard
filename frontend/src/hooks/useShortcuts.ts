import { useEffect } from 'react';

type Handlers = Record<string, (e: KeyboardEvent) => void>;

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);
}

/**
 * Single-key shortcuts that stay out of the way while typing.
 * Keys are lower-case letters/digits; "mod+k" means Ctrl or Cmd plus K.
 */
export function useShortcuts(handlers: Handlers, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && key === 'k' && handlers['mod+k']) {
        e.preventDefault();
        handlers['mod+k'](e);
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      if (document.querySelector('[role="dialog"]')) return;
      const h = handlers[key];
      if (h) {
        e.preventDefault();
        h(e);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handlers, enabled]);
}
