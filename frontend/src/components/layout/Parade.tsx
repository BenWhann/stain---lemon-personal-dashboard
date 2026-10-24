import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TrotCat, TROT_STRIDE_UNITS, TROT_VIEWBOX } from '../../art/TrotCat';
import { useParade } from '../../store/parade';

const CAT_W = 230;
const CADENCE = 2.6;

interface Run {
  id: number;
  cats: ('lemon' | 'stain')[];
}

/** Cats trot across the bottom of the screen for celebrations, and now and then for no reason. */
export const Parade: React.FC<{ enabled: boolean }> = ({ enabled }) => {
  const runId = useParade((s) => s.runId);
  const cats = useParade((s) => s.cats);
  const start = useParade((s) => s.start);
  const [runs, setRuns] = useState<Run[]>([]);

  useEffect(() => {
    if (!enabled || runId === 0) return;
    setRuns((r) => [...r, { id: runId, cats }]);
    // Only a new run id starts a parade; the cat list rides along with it.
  }, [runId]);

  // An occasional wander, every 6 to 11 minutes while the tab is visible
  useEffect(() => {
    if (!enabled) return;
    let t: number;
    const schedule = () => {
      t = window.setTimeout(() => {
        if (document.visibilityState === 'visible') start([Math.random() < 0.5 ? 'lemon' : 'stain']);
        schedule();
      }, (6 + Math.random() * 5) * 60_000);
    };
    schedule();
    return () => window.clearTimeout(t);
  }, [enabled, start]);

  // Speed matched to stride length so the paws don't slide
  const speed = TROT_STRIDE_UNITS * (CAT_W / TROT_VIEWBOX.w) * CADENCE;
  const endX = (typeof window !== 'undefined' ? window.innerWidth : 1440) + 20;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] h-[200px] overflow-hidden" aria-hidden="true">
      <AnimatePresence>
        {runs.map((run) =>
          run.cats.map((cat, i) => (
            <motion.div
              key={`${run.id}-${cat}`}
              className="absolute bottom-2"
              style={{ width: CAT_W }}
              initial={{ x: -CAT_W - i * 170 }}
              animate={{ x: endX }}
              transition={{ duration: (endX + CAT_W + i * 170) / speed, ease: 'linear' }}
              onAnimationComplete={() => i === run.cats.length - 1 && setRuns((r) => r.filter((x) => x.id !== run.id))}
            >
              <motion.div animate={{ y: [0, -14, 0] }} transition={{ duration: 0.38, repeat: Infinity, repeatDelay: 2.2, delay: i * 0.5 }}>
                <TrotCat coat={cat} cadence={CADENCE} prance={1} style={{ width: CAT_W, display: 'block', filter: 'drop-shadow(0 10px 14px rgb(0 0 0 / 0.35))' }} />
              </motion.div>
            </motion.div>
          )),
        )}
      </AnimatePresence>
    </div>
  );
};
