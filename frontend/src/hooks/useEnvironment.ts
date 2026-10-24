import { useEffect, useState } from 'react';
import { setMuted } from '../lib/audio';
import { setCelebrationsEnabled } from '../lib/celebrate';
import { isNightNow, useUi } from '../store/ui';

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

/** Resolves theme, motion and sound preferences and applies them to the document. */
export function useEnvironment() {
  const { theme, motion, sound } = useUi();
  const reduced = usePrefersReducedMotion();
  const [clockNight, setClockNight] = useState(isNightNow());

  useEffect(() => {
    if (theme !== 'auto') return;
    const t = window.setInterval(() => setClockNight(isNightNow()), 60_000);
    return () => window.clearInterval(t);
  }, [theme]);

  const night = theme === 'night' || (theme === 'auto' && clockNight);
  const calm = motion === 'calm' || (motion === 'system' && reduced);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', night);
    root.classList.toggle('motion-full', motion === 'full');
    root.classList.toggle('calm', calm);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', night ? '#140f14' : '#e7cfa6');
  }, [night, calm, motion]);

  useEffect(() => {
    setMuted(!sound);
  }, [sound]);
  useEffect(() => {
    setCelebrationsEnabled(!calm);
  }, [calm]);

  return { night, calm };
}
