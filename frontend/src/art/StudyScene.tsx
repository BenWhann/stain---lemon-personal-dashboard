import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, MotionValue } from 'framer-motion';
import { seeded } from './coats';
import { SittingCat } from './SittingCat';
import { LoafCat } from './LoafCat';

/*
  The living study room behind the dashboard. Designed on a 1440×900 stage and
  scaled with "slice" so it always fills the viewport. Two lighting states share
  one room: Lemon Sunlight (late-afternoon sun) and Stain Nocturne (lamp-lit
  night with rain). Layers drift with the pointer for depth.
*/

export interface SceneCatState {
  lemonAwake: boolean;
  stainExcited: boolean;
}

interface StudySceneProps {
  night: boolean;
  calm: boolean;
  cats: SceneCatState;
  onPetLemon: (e: React.MouseEvent) => void;
  onPetStain: (e: React.MouseEvent) => void;
}

const W = 1440;
const H = 900;

const BOOK_COLORS = ['#6E2B2B', '#2F4A3A', '#263552', '#C8932F', '#E3D1AE', '#4A2C44', '#9C5A2C', '#3D3A2E', '#7D6A4F'];

interface Book { x: number; w: number; h: number; color: string; lean: number; band: boolean }

function makeBooks(seed: number, start: number, end: number, maxH: number): Book[] {
  const rnd = seeded(seed);
  const books: Book[] = [];
  let x = start;
  while (x < end - 12) {
    const w = 12 + Math.floor(rnd() * 14);
    const gap = rnd() < 0.12 ? 18 + rnd() * 20 : 1.5;
    const lean = rnd() < 0.08 ? -8 - rnd() * 6 : 0;
    books.push({
      x,
      w,
      h: maxH * (0.68 + rnd() * 0.32),
      color: BOOK_COLORS[Math.floor(rnd() * BOOK_COLORS.length)],
      lean,
      band: rnd() < 0.6,
    });
    x += w + gap;
  }
  return books;
}

const Shelf: React.FC<{ x: number; y: number; w: number; seed: number; maxH: number }> = ({ x, y, w, seed, maxH }) => {
  const books = useMemo(() => makeBooks(seed, x + 8, x + w - 70, maxH), [seed, x, w, maxH]);
  return (
    <g>
      {books.map((b, i) => (
        <g key={i} transform={b.lean ? `rotate(${b.lean} ${b.x + b.w} ${y})` : undefined}>
          <rect x={b.x} y={y - b.h} width={b.w} height={b.h} rx={1.5} fill={b.color} />
          <rect x={b.x} y={y - b.h} width={b.w} height={b.h} rx={1.5} fill="url(#book-shade)" />
          {b.band && (
            <>
              <rect x={b.x + 2} y={y - b.h + 10} width={b.w - 4} height={2} fill="#E8C27A" opacity={0.7} />
              <rect x={b.x + 2} y={y - 16} width={b.w - 4} height={2} fill="#E8C27A" opacity={0.55} />
            </>
          )}
        </g>
      ))}
      <rect x={x} y={y} width={w} height={12} rx={2} fill="#5A3A26" />
      <rect x={x} y={y} width={w} height={3} fill="#8A5E3E" />
      <rect x={x} y={y + 12} width={w} height={10} fill="#000" opacity={0.18} />
    </g>
  );
};

function useLayer(px: MotionValue<number>, py: MotionValue<number>, depth: number) {
  const x = useTransform(px, (v) => v * depth);
  const y = useTransform(py, (v) => v * depth * 0.6);
  return { x, y };
}

/** One stacked slice of the room. Overscanned by 2% so parallax never shows an edge. */
const Layer: React.FC<{ offset: { x: MotionValue<number>; y: MotionValue<number> }; children: React.ReactNode }> = ({
  offset,
  children,
}) => (
  <motion.svg
    viewBox={`0 0 ${W} ${H}`}
    preserveAspectRatio="xMidYMid slice"
    className="pointer-events-none absolute left-[-2%] top-[-2%] h-[104%] w-[104%]"
    style={{ ...offset, willChange: 'transform' }}
  >
    {children}
  </motion.svg>
);

const FAIRY_PATH = 'M-20,36 C300,120 520,118 720,96 C940,72 1160,120 1460,40';

export const StudyScene: React.FC<StudySceneProps> = ({ night, calm, cats, onPetLemon, onPetStain }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 40, damping: 18, mass: 0.8 });
  const sy = useSpring(my, { stiffness: 40, damping: 18, mass: 0.8 });
  const [look, setLook] = useState({ x: 0, y: 0 });

  const far = useLayer(sx, sy, -6);
  const mid = useLayer(sx, sy, 6);
  const near = useLayer(sx, sy, 14);

  useEffect(() => {
    if (calm) return;
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      mx.set(-nx * 2);
      my.set(-ny * 2);
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        // Stain watches the cursor: aim from her head
        const svg = rootRef.current?.querySelector('svg');
        if (!svg) return;
        const r = svg.getBoundingClientRect();
        const scale = Math.max(r.width / W, r.height / H);
        const ox = r.left + (r.width - W * scale) / 2;
        const oy = r.top + (r.height - H * scale) / 2;
        const hx = ox + 908 * scale;
        const hy = oy + 600 * scale;
        setLook({ x: (e.clientX - hx) / 260, y: (e.clientY - hy) / 260 });
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(frame);
    };
  }, [calm, mx, my]);

  const bulbs = useMemo(() => {
    const rnd = seeded(3);
    return Array.from({ length: 34 }, (_, i) => ({ t: (i + 0.5) / 34, delay: rnd() * 4, warm: rnd() < 0.7 }));
  }, []);
  const [bulbPts, setBulbPts] = useState<{ x: number; y: number }[]>([]);
  const fairyRef = useRef<SVGPathElement>(null);
  useEffect(() => {
    const path = fairyRef.current;
    if (!path) return;
    const len = path.getTotalLength();
    setBulbPts(bulbs.map((b) => path.getPointAtLength(b.t * len)));
  }, [bulbs]);

  const motes = useMemo(() => {
    const rnd = seeded(11);
    return Array.from({ length: 26 }, () => ({
      x: 560 + rnd() * 520,
      y: 140 + rnd() * 560,
      r: 0.8 + rnd() * 1.8,
      dur: 9 + rnd() * 10,
      delay: -rnd() * 15,
    }));
  }, []);

  const stars = useMemo(() => {
    const rnd = seeded(29);
    return Array.from({ length: 30 }, () => ({ x: 556 + rnd() * 360, y: 96 + rnd() * 230, r: 0.5 + rnd() * 1.3, d: rnd() * 4 }));
  }, []);

  const rain = useMemo(() => {
    const rnd = seeded(31);
    return Array.from({ length: 46 }, () => ({ x: 550 + rnd() * 380, len: 14 + rnd() * 18, dur: 0.55 + rnd() * 0.5, delay: -rnd() * 2 }));
  }, []);

  const fade = { transition: 'opacity 1.4s cubic-bezier(.22,1,.36,1)' };
  const dayOp = night ? 0 : 1;
  const nightOp = night ? 1 : 0;

  return (
    <div ref={rootRef} className={`study-scene absolute inset-0 overflow-hidden ${calm ? 'calm' : ''}`} aria-hidden="true">
      {/*
        The room is split into stacked SVG layers that share one coordinate system.
        Static artwork is drawn once; only the small animated layers repaint, and
        the pointer parallax moves whole layers on the GPU compositor.
      */}
      <Layer offset={far}>
      <defs>
        <linearGradient id="wall-day" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E7CFA6" />
          <stop offset="0.6" stopColor="#D9B47F" />
          <stop offset="1" stopColor="#B98A5A" />
        </linearGradient>
        <linearGradient id="wall-night" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#21171D" />
          <stop offset="0.7" stopColor="#2C1F24" />
          <stop offset="1" stopColor="#1A1216" />
        </linearGradient>
        <pattern id="wallpaper" width="44" height="44" patternUnits="userSpaceOnUse">
          <path d="M22,6 C26,14 26,18 22,22 C18,18 18,14 22,6Z M0,28 C4,36 4,40 0,44 M44,28 C40,36 40,40 44,44" fill="#000" opacity="0.05" />
        </pattern>
        <linearGradient id="sky-day" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F6C98A" />
          <stop offset="0.45" stopColor="#F4B678" />
          <stop offset="0.8" stopColor="#E99A6A" />
          <stop offset="1" stopColor="#D88262" />
        </linearGradient>
        <linearGradient id="sky-night" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0E1430" />
          <stop offset="0.7" stopColor="#1C2246" />
          <stop offset="1" stopColor="#2E2747" />
        </linearGradient>
        <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFF4D6" />
          <stop offset="0.35" stopColor="#FFE2A0" stopOpacity="0.9" />
          <stop offset="1" stopColor="#FFC66B" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="wall-sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFE9BE" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FFE9BE" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="moon-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#E9ECFF" stopOpacity="0.5" />
          <stop offset="1" stopColor="#E9ECFF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ray" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFE9B8" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FFE9B8" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="lamp-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFD08A" stopOpacity="0.55" />
          <stop offset="0.5" stopColor="#F5A55A" stopOpacity="0.18" />
          <stop offset="1" stopColor="#F5A55A" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="bulb" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFF3C9" />
          <stop offset="0.3" stopColor="#FFD27A" stopOpacity="0.9" />
          <stop offset="1" stopColor="#FFB547" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="book-shade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0.12" />
          <stop offset="0.4" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id="desk-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7A4E30" />
          <stop offset="1" stopColor="#5C3720" />
        </linearGradient>
        <linearGradient id="desk-front" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4A2C1A" />
          <stop offset="1" stopColor="#2A180E" />
        </linearGradient>
        <linearGradient id="curtain" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#F7E8CF" stopOpacity="0.85" />
          <stop offset="0.25" stopColor="#E9D3AE" stopOpacity="0.7" />
          <stop offset="0.5" stopColor="#F7E8CF" stopOpacity="0.85" />
          <stop offset="0.75" stopColor="#DCC29A" stopOpacity="0.65" />
          <stop offset="1" stopColor="#F7E8CF" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id="screen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F4E7D2" />
          <stop offset="1" stopColor="#D8C3A3" />
        </linearGradient>
        <radialGradient id="vignette" cx="0.5" cy="0.45" r="0.75">
          <stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.55" />
        </radialGradient>
        <clipPath id="window-glass">
          <path d="M556,470 L556,200 C556,118 640,76 735,76 C830,76 914,118 914,200 L914,470Z" />
        </clipPath>
        <filter id="soft-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>

        <rect x={-40} y={-40} width={W + 80} height={H + 80} fill="url(#wall-day)" style={{ ...fade, opacity: dayOp }} />
        <rect x={-40} y={-40} width={W + 80} height={H + 80} fill="url(#wall-night)" style={{ ...fade, opacity: nightOp }} />
        <rect x={-40} y={-40} width={W + 80} height={H + 80} fill="url(#wallpaper)" />
        <ellipse cx={735} cy={300} rx={620} ry={420} fill="url(#wall-sun)" style={{ ...fade, opacity: dayOp }} />
        <ellipse cx={600} cy={560} rx={520} ry={360} fill="url(#lamp-glow)" style={{ ...fade, opacity: nightOp * 0.8 }} />

        {/* framed still life: a lemon, of course */}
        <g transform="translate(130 270)">
          <rect width={190} height={236} rx={4} fill="#3B2617" />
          <rect x={12} y={12} width={166} height={212} fill="#C9B48E" />
          <rect x={12} y={12} width={166} height={212} fill={night ? '#3a2f2a' : '#E8D7B4'} style={fade} />
          <ellipse cx={95} cy={150} rx={44} ry={30} fill="#E8B83A" />
          <ellipse cx={82} cy={140} rx={14} ry={7} fill="#F6DC7A" opacity={0.8} />
          <path d="M136,144 C146,140 150,148 146,152" fill="#E8B83A" />
          <path d="M98,121 C104,104 120,98 132,104 C122,112 110,118 98,121Z" fill="#5D7A3A" />
          <ellipse cx={95} cy={186} rx={58} ry={6} fill="#000" opacity={0.15} />
        </g>

        {/* window */}
        <path d="M538,488 L538,198 C538,104 632,58 735,58 C838,58 932,104 932,198 L932,488Z" fill="#5A3A26" />
        <g clipPath="url(#window-glass)">
          <rect x={540} y={60} width={400} height={420} fill="url(#sky-day)" style={{ ...fade, opacity: dayOp }} />
          <rect x={540} y={60} width={400} height={420} fill="url(#sky-night)" style={{ ...fade, opacity: nightOp }} />
          {/* sun and clouds */}
          <g style={{ ...fade, opacity: dayOp }}>
            <circle cx={800} cy={330} r={120} fill="url(#sun)" />
            <circle cx={800} cy={330} r={34} fill="#FFF1C9" />
          </g>
          <g style={{ ...fade, opacity: nightOp }}>
              <circle cx={820} cy={180} r={70} fill="url(#moon-glow)" />
              <circle cx={820} cy={180} r={26} fill="#EEF0FF" />
              <circle cx={830} cy={172} r={26} fill="#1B2247" opacity={0.9} />
          </g>
            {/* distant rooftops */}
            <path d="M540,430 L590,430 L590,400 L620,382 L650,400 L650,420 L700,420 L700,392 L742,392 L742,410 L790,410 L790,380 L812,364 L834,380 L834,404 L880,404 L880,386 L920,386 L940,480 L540,480Z"
              fill={night ? '#151229' : '#B56A52'} opacity={night ? 0.95 : 0.55} style={{ transition: 'fill 1.4s' }} />
            {night && (
              <g fill="#FFD27A" opacity={0.8}>
                <rect x={604} y={404} width={6} height={8} />
                <rect x={720} y={398} width={6} height={8} />
                <rect x={806} y={388} width={5} height={7} />
                <rect x={890} y={396} width={6} height={8} />
              </g>
            )}
          </g>
      </Layer>

      <Layer offset={far}>
        <g clipPath="url(#window-glass)">
          <g style={{ ...fade, opacity: dayOp }}>
              <g className="scene-drift" fill="#FFE3BC" opacity={0.85}>
                <ellipse cx={640} cy={190} rx={60} ry={14} />
                <ellipse cx={676} cy={180} rx={34} ry={14} />
                <ellipse cx={860} cy={240} rx={50} ry={10} />
              </g>
            </g>
          <g style={{ ...fade, opacity: nightOp }}>
              {stars.map((s, i) => (
                <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#F4F2FF" className="scene-twinkle" style={{ animationDelay: `${s.d}s` }} />
              ))}
              <g stroke="#A9B6E8" strokeWidth={1.1} strokeLinecap="round" opacity={0.45}>
                {rain.map((r, i) => (
                  <line key={i} x1={r.x} y1={0} x2={r.x - 4} y2={r.len} className="scene-rain"
                    style={{ animationDuration: `${r.dur}s`, animationDelay: `${r.delay}s` }} />
                ))}
              </g>
            </g>
        </g>
          {/* mullions */}
          <g fill="#5A3A26">
            <rect x={729} y={66} width={12} height={410} />
            <rect x={556} y={268} width={358} height={12} />
          </g>
          {/* glass sheen */}
          <path d="M570,460 L640,90 L680,82 L606,460Z" fill="#fff" opacity={night ? 0.04 : 0.1} />
          {/* sill */}
          <rect x={508} y={470} width={454} height={22} rx={3} fill="#6B4630" />
          <rect x={508} y={470} width={454} height={4} fill="#9A6A48" />
          <rect x={516} y={492} width={438} height={10} fill="#000" opacity={0.2} />

        {/* sheer curtains with a slow breeze */}
        <g className="scene-curtain-l">
          <path d="M458,40 C470,200 450,380 468,620 L572,620 C556,420 584,220 566,40Z" fill="url(#curtain)" opacity={night ? 0.32 : 0.75} style={fade} />
        </g>
        <g className="scene-curtain-r">
          <path d="M904,40 C886,220 914,420 898,620 L1002,620 C1020,380 1000,200 1012,40Z" fill="url(#curtain)" opacity={night ? 0.32 : 0.75} style={fade} />
        </g>
        <rect x={440} y={34} width={590} height={8} rx={4} fill="#3B2617" />
        <circle cx={440} cy={38} r={9} fill="#C79A52" />
        <circle cx={1030} cy={38} r={9} fill="#C79A52" />
      </Layer>

      <Layer offset={mid}>
        <Shelf x={1080} y={250} w={380} seed={5} maxH={110} />
        <Shelf x={1080} y={430} w={380} seed={9} maxH={100} />
        <path d="M1366,250 L1370,216 L1406,216 L1410,250Z" fill="#B5643F" />
        {/* books stacked on the sill with Lemon asleep on top */}
        <g>
          <rect x={590} y={448} width={170} height={22} rx={2} fill="#6E2B2B" />
          <rect x={598} y={430} width={150} height={18} rx={2} fill="#2F4A3A" />
          <rect x={590} y={414} width={160} height={16} rx={2} fill="#C8932F" />
          <rect x={590} y={420} width={160} height={2} fill="#F2D9A0" opacity={0.6} />
          <rect x={598} y={438} width={150} height={2} fill="#E8C27A" opacity={0.5} />
        </g>
        <path d="M842,470 L846,440 L874,440 L878,470Z" fill="#E8DCC6" />
      </Layer>

      <Layer offset={mid}>
        {/* plant on the top shelf */}
        <g transform="translate(1388 250)">
          <g fill="#4F7A45" className="scene-sway">
            <path d="M0,-34 C-30,-60 -40,-90 -20,-104 C-14,-80 -6,-60 0,-34Z" />
            <path d="M0,-34 C24,-64 44,-80 52,-98 C34,-92 14,-70 0,-34Z" />
            <path d="M0,-34 C-4,-70 4,-100 14,-120 C16,-90 8,-60 0,-34Z" fill="#5E8C50" />
          </g>
        </g>

        {/* trailing pothos from the ceiling, left */}
        <g className="scene-sway-slow" style={{ transformOrigin: '60px 0px' }}>
          <path d="M60,0 C64,90 40,170 58,260 C70,320 54,380 62,430" stroke="#3E5E36" strokeWidth={2} fill="none" />
          {Array.from({ length: 11 }, (_, i) => {
            const y = 30 + i * 38;
            const x = 58 + Math.sin(i * 1.3) * 12;
            const flip = i % 2 ? -1 : 1;
            return <path key={i} d={`M${x},${y} c${flip * 14},-10 ${flip * 26},-2 ${flip * 22},12 c${flip * -8},8 ${flip * -18},4 ${flip * -22},-12Z`} fill={i % 3 ? '#4F7A45' : '#6B9A58'} />;
          })}
        </g>

        <LoafCat
          coat="lemon"
          asleep={!cats.lemonAwake}
          x={572}
          y={290}
          width={200}
          height={125}
          onClick={onPetLemon}
          className="pointer-events-auto cursor-pointer text-[#7b5a3a] dark:text-[#e9d7b6]"
          title="Lemon. Click to pet."
        />
        <g transform="translate(860 470)">
          <g fill="#6B8F4E" className="scene-sway">
            <ellipse cx={-8} cy={-44} rx={8} ry={16} transform="rotate(-20 -8 -44)" />
            <ellipse cx={8} cy={-46} rx={8} ry={17} transform="rotate(18 8 -46)" />
            <ellipse cx={0} cy={-52} rx={7} ry={18} />
          </g>
        </g>

        {/* sunbeams through the window */}
        <g style={{ ...fade, opacity: dayOp * 0.8, mixBlendMode: 'screen' }}>
          <g className="scene-rays">
            <path d="M600,120 L760,110 L1180,900 L760,900Z" fill="url(#ray)" />
            <path d="M790,140 L900,150 L1380,900 L1120,900Z" fill="url(#ray)" opacity={0.7} />
          </g>
        </g>
        <path ref={fairyRef} d={FAIRY_PATH} stroke="#3B2A1E" strokeWidth={1.5} fill="none" />
        {bulbPts.map((p, i) => (
          <g key={i} className="scene-bulb" style={{ animationDelay: `${bulbs[i].delay}s` }}>
            <circle cx={p.x} cy={p.y + 8} r={night ? 16 : 9} fill="url(#bulb)" opacity={night ? 0.95 : 0.6} style={fade} />
            <circle cx={p.x} cy={p.y + 7} r={3.2} fill={bulbs[i].warm ? '#FFE3A1' : '#FFF6E0'} />
          </g>
        ))}
      </Layer>

      <Layer offset={near}>
        {/* desk lamp */}
        <g transform="translate(470 700)">
          <ellipse cx={40} cy={-2} rx={44} ry={9} fill="#2B1B12" />
          <path d="M40,-4 L56,-150 L118,-196" stroke="#2F2219" strokeWidth={7} fill="none" strokeLinecap="round" />
          <circle cx={56} cy={-150} r={7} fill="#C79A52" />
          <path d="M96,-226 L150,-182 L128,-160 L82,-196Z" fill="#3A281C" />
          <path d="M96,-226 L150,-182 L128,-160 L82,-196Z" fill="#C79A52" opacity={0.25} />
          <g style={{ ...fade, opacity: nightOp }}>
            <ellipse cx={130} cy={-160} rx={8} ry={6} fill="#FFF0C4" />
            <circle cx={150} cy={-60} r={300} fill="url(#lamp-glow)" />
          </g>
        </g>

        {/* desk */}
        <path d="M-40,690 L1480,690 L1480,760 L-40,760Z" fill="url(#desk-top)" />
        <path d="M-40,690 L1480,690 L1480,694 L-40,694Z" fill="#A87450" opacity={0.6} />
        <g opacity={0.12} stroke="#2A170C" strokeWidth={1.4} fill="none">
          <path d="M-40,712 C300,706 700,718 1480,708" />
          <path d="M-40,736 C400,730 900,742 1480,734" />
        </g>
        <path d="M-40,760 L1480,760 L1480,940 L-40,940Z" fill="url(#desk-front)" />
        <rect x={-40} y={760} width={W + 80} height={4} fill="#9C6A46" opacity={0.6} />
        {/* sunlight patch on the desk */}
        <path d="M760,700 L1060,700 L1180,760 L860,760Z" fill="#FFE5AE" opacity={night ? 0 : 0.25} style={fade} />

        {/* stacked notebooks */}
        <g transform="translate(330 700)">
          <rect x={0} y={-22} width={150} height={22} rx={3} fill="#263552" />
          <rect x={10} y={-40} width={130} height={18} rx={3} fill="#E3D1AE" />
          <rect x={4} y={-58} width={138} height={18} rx={3} fill="#4A2C44" />
          <rect x={4} y={-50} width={138} height={2} fill="#E8C27A" opacity={0.6} />
        </g>

        {/* mug with steam */}
        <g transform="translate(660 700)">
          <path d="M0,-58 L48,-58 L44,-4 C44,0 40,2 36,2 L12,2 C8,2 4,0 4,-4Z" fill="#E9DCC5" />
          <path d="M46,-48 C66,-48 66,-18 44,-18" stroke="#E9DCC5" strokeWidth={7} fill="none" />
          <ellipse cx={24} cy={-58} rx={24} ry={5} fill="#5B341E" />
          <path d="M6,-40 L42,-40" stroke="#C8932F" strokeWidth={3} />
        </g>

        {/* laptop */}
        <g transform="translate(1140 700)">
          <path d="M0,0 L230,0 L250,10 L-20,10Z" fill="#B9AFA4" />
          <path d="M14,-4 L216,-4 L196,-150 L34,-150Z" fill="#8D847B" />
          <path d="M24,-10 L206,-10 L188,-142 L42,-142Z" fill="url(#screen)" opacity={night ? 0.95 : 0.8} />
          <g fill="#8A6A4A" opacity={0.5}>
            <rect x={60} y={-122} width={90} height={5} rx={2} />
            <rect x={56} y={-104} width={120} height={4} rx={2} />
            <rect x={52} y={-90} width={110} height={4} rx={2} />
            <rect x={48} y={-76} width={124} height={4} rx={2} />
          </g>
        </g>

      </Layer>

      <Layer offset={near}>
        <g transform="translate(660 700)">
          <g stroke="#fff" strokeWidth={3} strokeLinecap="round" fill="none" opacity={night ? 0.25 : 0.4}>
            <path d="M14,-70 C6,-84 22,-94 14,-110" className="scene-steam" />
            <path d="M28,-70 C20,-86 36,-98 28,-118" className="scene-steam" style={{ animationDelay: '1.3s' }} />
            <path d="M38,-72 C32,-84 44,-92 38,-104" className="scene-steam" style={{ animationDelay: '2.4s' }} />
          </g>
        </g>
        {/* Stain keeps watch beside the laptop */}
        <SittingCat
          coat="stain"
          x={840}
          y={516}
          width={136}
          height={184}
          look={look}
          dilate={cats.stainExcited ? 1 : night ? 0.7 : 0.1}
          headTilt={cats.stainExcited ? -10 : 0}
          blinkDelay={2.2}
          onClick={onPetStain}
          className="pointer-events-auto cursor-pointer"
          title="Stain. Click to pet."
        />

        {/* dust drifting through the sunbeams */}
        <g style={{ ...fade, opacity: dayOp }}>
          {motes.map((m, i) => (
            <circle key={i} cx={m.x} cy={m.y} r={m.r} fill="#FFF3D6" className="scene-mote"
              style={{ animationDuration: `${m.dur}s`, animationDelay: `${m.delay}s` }} />
          ))}
        </g>
      </Layer>

      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse 75% 75% at 50% 45%, transparent 55%, rgb(0 0 0 / 0.55) 100%)' }} />
    </div>
  );
};
