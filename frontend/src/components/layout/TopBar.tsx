import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Command, LogOut, Moon, Search, SlidersHorizontal, Sun, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '../../store/auth';
import { useUi } from '../../store/ui';
import { useWidgets } from '../../store/widgets';
import type { View } from '../../types';
import { cx } from '../ui/cx';
import { usePill } from '../ui/usePill';

const NAV: { id: View; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'board', label: 'Board' },
  { id: 'insights', label: 'Insights' },
  { id: 'settings', label: 'Settings' },
];

export const BrandMark: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="brand-g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#FFE2A0" />
        <stop offset="1" stopColor="#D9913A" />
      </linearGradient>
    </defs>
    <path d="M27,5 A16,16 0 1 0 35,27 A13,13 0 1 1 27,5Z" fill="url(#brand-g)" />
    <g fill="rgb(var(--night))" transform="translate(13 15) scale(0.62)">
      <ellipse cx="12" cy="16" rx="5.2" ry="4.4" />
      <ellipse cx="5.6" cy="10.4" rx="2.2" ry="2.8" />
      <ellipse cx="9.6" cy="6.6" rx="2.2" ry="2.9" />
      <ellipse cx="14.4" cy="6.6" rx="2.2" ry="2.9" />
      <ellipse cx="18.4" cy="10.4" rx="2.2" ry="2.8" />
    </g>
  </svg>
);

export const TopBar: React.FC<{ night: boolean; onToggleTheme: () => void }> = ({ night, onToggleTheme }) => {
  const { view, setView, sound, setSound, setPaletteOpen } = useUi();
  const { isCustomizing, toggleCustomizing } = useWidgets();
  const { user, logout } = useAuth();
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenu(false);
    };
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, [menu]);

  const initial = (user?.display_name || user?.username || '?').charAt(0).toUpperCase();
  const pill = usePill<View>(view);

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-8">
      <div className="pane mx-auto flex h-13 max-w-[1520px] items-center justify-between gap-2 px-3 py-1.5 sm:gap-4 sm:px-4">
        <button type="button" className="flex items-center gap-2.5" onClick={() => setView('today')} aria-label="Lemon & Stain, home">
          <BrandMark className="h-7 w-7" />
          <span className="heading hidden text-lg font-medium text-ink sm:block">Lemon &amp; Stain</span>
        </button>

        <nav aria-label="Main" className="relative flex items-center gap-0.5 rounded-md bg-ink/[0.04] p-0.5 border border-line/15">
          {pill.rect && (
            <motion.span
              aria-hidden
              className="absolute bottom-0.5 left-0 top-0.5 rounded-md bg-surface shadow-card border border-line/20 dark:bg-surface-strong"
              initial={false}
              animate={{ x: pill.rect.x, width: pill.rect.w }}
              transition={{ type: 'spring', stiffness: 500, damping: 38 }}
            />
          )}
          {NAV.map((n) => {
            const active = view === n.id;
            return (
              <button
                key={n.id}
                ref={pill.register(n.id)}
                type="button"
                onClick={() => setView(n.id)}
                aria-current={active ? 'page' : undefined}
                className={cx(
                  'relative rounded-md px-2.5 py-1 text-xs font-medium transition-colors sm:px-3.5',
                  active ? 'text-ink font-semibold' : 'text-ink-soft hover:text-ink'
                )}
              >
                <span className={cx('relative', active && 'text-honey-deep dark:text-honey')}>{n.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5">
          {view === 'today' && (
            <button
              type="button"
              onClick={toggleCustomizing}
              className={cx(
                'btn-ghost hidden h-8 !px-2.5 text-xs sm:inline-flex items-center gap-1.5 transition-colors',
                isCustomizing
                  ? 'bg-honey text-night font-semibold shadow-sm hover:bg-honey/90'
                  : 'text-ink-soft hover:text-ink hover:bg-honey/15'
              )}
              title={isCustomizing ? 'Done customizing layout' : 'Customize dashboard layout'}
              aria-label={isCustomizing ? 'Done customizing layout' : 'Customize dashboard layout'}
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-honey-deep dark:text-honey" />
              <span>{isCustomizing ? 'Done' : 'Customize'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="btn-ghost hidden h-8 !px-2.5 text-xs md:inline-flex"
            aria-label="Open quick actions"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search</span>
            <kbd className="ml-1 inline-flex items-center gap-0.5 rounded bg-ink/[0.08] px-1 text-[10px] text-ink-faint">
              {isMac ? <Command className="h-2.5 w-2.5" /> : 'Ctrl'}K
            </kbd>
          </button>
          <button type="button" className="btn-ghost hidden h-8 w-8 !p-0 sm:inline-flex" onClick={() => setSound(!sound)} aria-label={sound ? 'Mute sounds' : 'Turn sounds on'} title={sound ? 'Mute' : 'Sound on'}>
            {sound ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            className="btn-ghost relative h-8 w-8 overflow-hidden !p-0"
            onClick={onToggleTheme}
            aria-label={night ? 'Switch to Lemon Sunlight' : 'Switch to Stain Nocturne'}
            title={night ? 'Lemon Sunlight' : 'Stain Nocturne'}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={night ? 'moon' : 'sun'}
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -12, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {night ? <Moon className="h-3.5 w-3.5 text-honey" /> : <Sun className="h-3.5 w-3.5 text-honey-deep" />}
              </motion.span>
            </AnimatePresence>
          </button>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenu((m) => !m)}
              aria-haspopup="menu"
              aria-expanded={menu}
              aria-label="Account"
              className="grid h-8 w-8 place-items-center rounded-md font-display text-xs font-semibold text-night border border-honey-deep/40 sm:ml-1"
              style={{ background: 'linear-gradient(160deg, rgb(var(--honey)), rgb(var(--caramel)))' }}
            >
              {initial}
            </button>
            <AnimatePresence>
              {menu && (
                <motion.div
                  role="menu"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="pane-solid absolute right-0 top-10 w-52 origin-top-right rounded-md p-1.5 shadow-lift"
                >
                  <div className="border-b border-line/15 px-2.5 py-1.5">
                    <p className="text-xs font-medium text-ink">{user?.display_name}</p>
                    <p className="text-[11px] text-ink-faint">Signed in as {user?.username}</p>
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    className="mt-1 flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs text-ink-soft hover:bg-ink/[0.06] hover:text-ink"
                    onClick={() => void logout()}
                  >
                    <LogOut className="h-3.5 w-3.5" /> Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};
