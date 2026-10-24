import { useEffect } from 'react';

/**
 * Frosted glass over a living scene is the most expensive thing on screen.
 * After the dashboard settles, sample the real frame rate once; if this device
 * can't hold a smooth rate, swap the blur for solid tinted glass (class "lite").
 * Every animation stays. Re-checked each visit, since hardware and power modes change.
 */
export function useAdaptiveQuality(active: boolean) {
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let cancelled = false;
    const start = window.setTimeout(() => {
      let frames = 0;
      const t0 = performance.now();
      const tick = (t: number) => {
        if (cancelled) return;
        frames++;
        if (t - t0 < 2000) {
          raf = requestAnimationFrame(tick);
          return;
        }
        const fps = frames / ((t - t0) / 1000);
        // Ignore samples taken while the tab was hidden or throttled to near zero
        if (document.visibilityState === 'visible' && fps > 3 && fps < 40) {
          document.documentElement.classList.add('lite');
        }
      };
      raf = requestAnimationFrame(tick);
    }, 4000);
    return () => {
      cancelled = true;
      window.clearTimeout(start);
      cancelAnimationFrame(raf);
    };
  }, [active]);
}
