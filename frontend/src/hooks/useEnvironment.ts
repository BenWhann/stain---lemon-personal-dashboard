import { useEffect, useState } from 'react';
import { setMuted } from '../lib/audio';
import { setCelebrationsEnabled } from '../lib/celebrate';
import { isNightNow, useUi } from '../store/ui';

/** Resolves theme, motion and sound preferences and applies them to the document. */
export function useEnvironment() {
  const { theme, sound } = useUi();
  const [clockNight, setClockNight] = useState(isNightNow());

  useEffect(() => {
    if (theme !== 'auto') return;
    const t = window.setInterval(() => setClockNight(isNightNow()), 60_000);
    return () => window.clearInterval(t);
  }, [theme]);

  const night = theme === 'night' || (theme === 'auto' && clockNight);
  // Calm is permanently enabled for fast, lightweight performance
  const calm = true;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', night);
    root.classList.remove('motion-full');
    root.classList.add('calm');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', night ? '#140f14' : '#e7cfa6');
  }, [night]);

  useEffect(() => {
    setMuted(!sound);
  }, [sound]);

  useEffect(() => {
    setCelebrationsEnabled(false);
  }, []);

  return { night, calm };
}
