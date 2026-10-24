import React, { useEffect, useRef, useState } from 'react';
import { useMotionValueEvent, useScroll, useTransform, motion } from 'framer-motion';
import { TrotCat, TROT_STRIDE_UNITS, TROT_VIEWBOX } from '../../art/TrotCat';
import type { CoatName } from '../../art/coats';
import { PawIcon } from '../ui/PawCheck';

interface PranceDividerProps {
  cat: CoatName;
  /** which way the cat travels as you scroll down */
  direction?: 1 | -1;
  calm?: boolean;
  caption?: string;
}

const CAT_W = 190;

/*
  A cat trots along a gilded line as you scroll past it. Its position comes from
  scroll progress and its stride phase from the distance travelled, so the paws
  stay planted. Scroll back up and it turns around.
*/
export const PranceDivider: React.FC<PranceDividerProps> = ({ cat, direction = 1, calm, caption }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1200);
  const phaseRef = useRef(0);
  const lastX = useRef<number | null>(null);
  const [facingRight, setFacingRight] = useState(direction === 1);
  const [prints, setPrints] = useState<{ id: number; x: number; flip: boolean }[]>([]);
  const lastStride = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const travel = width + CAT_W * 2;
  const x = useTransform(scrollYProgress, (p) => (direction === 1 ? p * travel - CAT_W : width + CAT_W - p * travel - CAT_W));

  useMotionValueEvent(x, 'change', (v) => {
    const prev = lastX.current;
    lastX.current = v;
    if (prev === null) return;
    const dx = v - prev;
    if (Math.abs(dx) < 0.01) return;
    const scale = CAT_W / TROT_VIEWBOX.w;
    phaseRef.current += Math.abs(dx) / (TROT_STRIDE_UNITS * scale);
    const right = dx > 0;
    if (right !== facingRight) setFacingRight(right);
    const stride = Math.floor(phaseRef.current * 2);
    if (stride !== lastStride.current) {
      lastStride.current = stride;
      setPrints((p) => [...p.slice(-9), { id: Date.now() + Math.random(), x: v + (right ? CAT_W * 0.62 : CAT_W * 0.38), flip: !right }]);
    }
  });

  return (
    <div ref={ref} className="relative mx-auto my-6 h-[150px] w-full overflow-hidden" aria-hidden="true">
      <div className="absolute inset-x-0 bottom-[22px] h-px" style={{ background: 'linear-gradient(90deg, transparent, rgb(var(--honey) / 0.5) 20%, rgb(var(--honey) / 0.5) 80%, transparent)' }} />
      {caption && <p className="heading absolute inset-x-0 top-2 text-center text-base italic text-ink-faint">{caption}</p>}
      {prints.map((p) => (
        <span
          key={p.id}
          className="paw-print absolute bottom-[14px] text-honey/50"
          style={{ left: p.x, transform: `rotate(${p.flip ? -90 : 90}deg)` }}
        >
          <PawIcon className="h-3 w-3" />
        </span>
      ))}
      {!calm && (
        <motion.div className="absolute bottom-[10px] left-0" style={{ x, width: CAT_W }}>
          <div style={{ transform: facingRight ? undefined : 'scaleX(-1)' }}>
            <TrotCat coat={cat} phaseRef={phaseRef} prance={0.6} style={{ width: CAT_W, display: 'block' }} />
          </div>
        </motion.div>
      )}
    </div>
  );
};
