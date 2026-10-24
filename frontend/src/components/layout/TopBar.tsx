import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Command, LogOut, Moon, Search, Sun, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '../../store/auth';
import { useUi } from '../../store/ui';
import type { View } from '../../types';
import { cx } from '../ui/cx';
import { usePill } from '../ui/usePill';

const NAV: { id: View; label: string }[] = [
  { id: 'journal', label: 'Journal' },
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
    <header className="fixed inset-x-0 top-0 z-40 px-2 pt-3 sm:px-8">
      <div className="pane mx-auto flex h-14 max-w-[1480px] items-center justify-between gap-1.5 !rounded-full px-2 sm:gap-3 sm:px-4">
        <button type="button" className="flex items-center gap-2.5" onClick={() => setView('journal')} aria-label="Lemon & Stain, home">
          <motion.span whileHover={{ rotate: -14, scale: 1.08 }} transition={{ type: 'spring', stiffness: 300, damping: 12 }}>
            <BrandMark className="h-8 w-8" />
          </motion.span>
          <span className="heading hidden text-xl text-honey sm:block">Lemon &amp; Stain</span>
        </button>

        <nav aria-label="Main" className="relative flex items-center gap-0.5 rounded-full bg-ink/[0.06] p-1">
          {pill.rect && (
            <motion.span
              aria-hidden
              className="absolute bottom-1 left-0 top-1 rounded-full bg-night/60 shadow-glow dark:bg-night/80"
              initial={false}
              animate={{ x: pill.rect.x, width: pill.rect.w }}
              transition={{ type: 'spring', stiffness: 400, damping: 34 }}
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
                className={cx('relative rounded-full px-2.5 py-1.5 text-[13px] transition-colors sm:px-5 sm:text-sm', active ? 'text-ink' : 'text-ink-soft hover:text-ink')}
              >
                <span className={cx('relative', active && 'text-honey')}>{n.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="btn-ghost hidden h-9 !px-3 text-xs md:inline-flex"
            aria-label="Open quick actions"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Quick actions</span>
            <kbd className="ml-1 inline-flex items-center gap-0.5 rounded bg-ink/10 px-1 text-[10px]">
              {isMac ? <Command className="h-2.5 w-2.5" /> : 'Ctrl'}K
            </kbd>
          </button>
          <button type="button" className="btn-ghost hidden h-9 w-9 !p-0 sm:inline-flex" onClick={() => setSound(!sound)} aria-label={sound ? 'Mute sounds' : 'Turn sounds on'} title={sound ? 'Mute' : 'Sound on'}>
            {sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
          <button
            type="button"
            className="btn-ghost relative h-9 w-9 overflow-hidden !p-0"
            onClick={onToggleTheme}
            aria-label={night ? 'Switch to Lemon Sunlight' : 'Switch to Stain Nocturne'}
            title={night ? 'Lemon Sunlight' : 'Stain Nocturne'}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={night ? 'moon' : 'sun'}
                initial={{ y: 18, rotate: -90, opacity: 0 }}
                animate={{ y: 0, rotate: 0, opacity: 1 }}
                exit={{ y: -18, rotate: 90, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 24 }}
              >
                {night ? <Moon className="h-4 w-4 text-honey" /> : <Sun className="h-4 w-4 text-honey-deep" />}
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
              className="grid h-9 w-9 place-items-center rounded-full font-display text-sm font-semibold text-night sm:ml-1"
              style={{ background: 'linear-gradient(160deg, rgb(var(--honey)), rgb(var(--caramel)))' }}
            >
              {initial}
            </button>
            <AnimatePresence>
              {menu && (
                <motion.div
                  role="menu"
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  className="pane-solid absolute right-0 top-12 w-56 origin-top-right !rounded-2xl p-2"
                >
                  <p className="px-3 py-2 text-sm text-ink">
                    {user?.display_name}
                    <span className="block text-xs text-ink-faint">Signed in as {user?.username}</span>
                  </p>
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-ink-soft hover:bg-ink/10 hover:text-ink"
                    onClick={() => void logout()}
                  >
                    <LogOut className="h-4 w-4" /> Sign out
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
