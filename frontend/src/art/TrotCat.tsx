import React, { useEffect, useId, useMemo, useRef } from 'react';
import { brindle, COATS, CoatName } from './coats';

/*
  Side-view cat with a procedural trot cycle (faces right, viewBox 0 0 280 160).
  Legs are two-segment rigs posed every frame from a gait phase; diagonal pairs
  move together like a real trot. Frames are written straight to the DOM through
  refs, so a running cat never re-renders React.
*/

export interface TrotCatProps {
  coat: CoatName;
  /** stride cycles per second */
  cadence?: number;
  /** 0 = relaxed trot, 1 = full prance with high knees and bounce */
  prance?: number;
  paused?: boolean;
  /**
   * Drive the stride from outside (in cycles). Used when the cat's position is
   * tied to scrolling, so paws stay planted instead of skating.
   */
  phaseRef?: React.MutableRefObject<number>;
  className?: string;
  style?: React.CSSProperties;
}

/** Body units the cat travels per stride cycle: use to sync screen speed and stride. */
export const TROT_STRIDE_UNITS = 90;
export const TROT_VIEWBOX = { w: 280, h: 160 };

const TORSO =
  'M76,76 C74,56 98,47 136,47 C172,47 196,50 207,64 C215,76 210,96 188,101 C168,105 128,106 106,104 C86,102 77,92 76,76Z';
const NECK = 'M190,58 C196,44 210,36 224,38 L236,62 C230,80 214,90 198,88 C192,80 189,68 190,58Z';
const HEAD =
  'M-24,-4 C-24,-20 -10,-28 4,-27 C18,-26 26,-16 28,-4 C34,-1 37,5 35,11 C33,17 25,19 17,18 C10,24 -2,26 -12,22 C-22,18 -25,8 -24,-4Z';
const EAR_NEAR = 'M-1,-24 C1,-37 5,-46 9,-50 C13,-44 17,-34 17,-23Z';
const EAR_NEAR_IN = 'M3,-25 C4,-34 7,-40 9,-43 C11,-38 13,-31 13,-25Z';
const EAR_FAR = 'M-17,-19 C-19,-33 -17,-42 -13,-47 C-7,-41 -4,-31 -3,-24Z';
const EYE = 'M8,-7 C10,-12 18,-12 21,-6 C18,-2 11,-2 8,-7Z';

const FRONT = { L1: 26, L2: 30, w: 15 };
const BACK = { L1: 28, L2: 36, w: 16.5 };
const SHOULDER = { x: 190, y: 92 };
const HIP = { x: 98, y: 92 };

type Pt = { x: number; y: number };

function legPoints(hip: Pt, L1: number, L2: number, a1: number, a2: number) {
  const knee = { x: hip.x + L1 * Math.sin(a1), y: hip.y + L1 * Math.cos(a1) };
  const paw = { x: knee.x + L2 * Math.sin(a2), y: knee.y + L2 * Math.cos(a2) };
  return { knee, paw };
}

const ease = (s: number) => s * s * (3 - 2 * s);

/** Leg angles for a phase in [0,1): first half planted (sweeps back), second half swinging forward. */
function gait(p: number, amp: number, lift: number) {
  if (p < 0.5) {
    const s = p / 0.5;
    return { swing: amp * (1 - 2 * s), bend: 0 };
  }
  const s = (p - 0.5) / 0.5;
  return { swing: -amp + 2 * amp * ease(s), bend: lift * Math.sin(Math.PI * s) };
}

export const TrotCat: React.FC<TrotCatProps> = ({
  coat: coatName,
  cadence = 1.6,
  prance = 0.5,
  paused = false,
  phaseRef,
  className,
  style,
}) => {
  const coat = COATS[coatName];
  const isLemon = coatName === 'lemon';
  const uid = useId().replace(/:/g, '');

  const legRefs = useRef<(SVGPathElement | null)[]>([]);
  const legStripeRefs = useRef<(SVGPathElement | null)[]>([]);
  const pawRefs = useRef<(SVGEllipseElement | null)[]>([]);
  const bodyRef = useRef<SVGGElement | null>(null);
  const headRef = useRef<SVGGElement | null>(null);
  const tailRef = useRef<SVGPathElement | null>(null);
  const tailStripeRef = useRef<SVGPathElement | null>(null);
  const shadowRef = useRef<SVGEllipseElement | null>(null);
  const tRef = useRef(0);

  const flecks = useMemo(
    () =>
      isLemon ? [] : brindle(91, { x: 70, y: 40, w: 170, h: 70 }, 320, [coat.marking, coat.marking2, '#D9A066'], 0.8),
    [isLemon, coat],
  );

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const amp = 0.44 + prance * 0.06;
    const lift = 0.55 + prance * 0.5;
    const bob = 1.2 + prance * 2.4;

    // leg order: far-back, far-front, near-back, near-front; trot pairs share phase
    const legs = [
      { kind: 'back', offset: 0.0 },
      { kind: 'front', offset: 0.5 },
      { kind: 'back', offset: 0.5 },
      { kind: 'front', offset: 0.0 },
    ] as const;

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!paused && !phaseRef) tRef.current += dt * cadence;
      const t = phaseRef ? phaseRef.current : tRef.current;

      legs.forEach((leg, i) => {
        const p = (((t + leg.offset) % 1) + 1) % 1;
        const { swing, bend } = gait(p, amp, lift);
        let pts;
        if (leg.kind === 'front') {
          pts = legPoints(SHOULDER, FRONT.L1, FRONT.L2, swing * 0.75, swing * 1.05 - bend);
        } else {
          pts = legPoints(HIP, BACK.L1, BACK.L2, swing * 0.8 + 0.38 + bend * 0.45, swing * 0.9 - 0.5 - bend * 0.4);
        }
        const hip = leg.kind === 'front' ? SHOULDER : HIP;
        const d = `M${hip.x},${hip.y - 10} L${hip.x},${hip.y} L${pts.knee.x.toFixed(2)},${pts.knee.y.toFixed(2)} L${pts.paw.x.toFixed(2)},${pts.paw.y.toFixed(2)}`;
        legRefs.current[i]?.setAttribute('d', d);
        legStripeRefs.current[i]?.setAttribute('d', d);
        const paw = pawRefs.current[i];
        if (paw) {
          paw.setAttribute('cx', (pts.paw.x + 3).toFixed(2));
          paw.setAttribute('cy', (pts.paw.y + 1).toFixed(2));
        }
      });

      const phase2 = Math.sin(t * Math.PI * 4);
      const bodyY = -Math.abs(phase2) * bob + bob * 0.5;
      bodyRef.current?.setAttribute('transform', `translate(0 ${bodyY.toFixed(2)})`);
      const headBob = Math.sin(t * Math.PI * 4 - 0.6) * (0.8 + prance);
      const headTilt = Math.sin(t * Math.PI * 2) * 2.5;
      headRef.current?.setAttribute(
        'transform',
        `translate(226 ${(50 + headBob).toFixed(2)}) rotate(${headTilt.toFixed(2)})`,
      );
      const sway = Math.sin(t * Math.PI * 2) * (6 + prance * 4);
      const curl = Math.cos(t * Math.PI * 2) * 4;
      const tail = `M80,66 C60,62 ${(46 + sway * 0.3).toFixed(1)},48 ${(46 + sway * 0.6).toFixed(1)},30 C${(46 + sway).toFixed(1)},16 ${(56 + sway + curl).toFixed(1)},8 ${(64 + sway + curl).toFixed(1)},14`;
      tailRef.current?.setAttribute('d', tail);
      tailStripeRef.current?.setAttribute('d', tail);
      shadowRef.current?.setAttribute('rx', (78 - Math.abs(phase2) * 4).toFixed(1));

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [cadence, prance, paused, phaseRef]);

  const legColor = (far: boolean) =>
    isLemon ? (far ? coat.whiteShade : coat.white) : far ? coat.baseShade : coat.base;

  const renderLeg = (i: number, far: boolean, width: number) => (
    <g key={i}>
      <path
        ref={(el) => (legRefs.current[i] = el)}
        stroke={legColor(far)}
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {!isLemon && (
        <path
          ref={(el) => (legStripeRefs.current[i] = el)}
          stroke={far ? coat.marking2 : coat.marking}
          strokeWidth={2.4}
          strokeDasharray="3 7 1.5 9 4 12"
          strokeLinecap="round"
          fill="none"
          opacity={far ? 0.22 : 0.38}
        />
      )}
      <ellipse ref={(el) => (pawRefs.current[i] = el)} rx={8.5} ry={5} fill={legColor(far)} />
    </g>
  );

  return (
    <svg viewBox={`0 0 ${TROT_VIEWBOX.w} ${TROT_VIEWBOX.h}`} className={className} style={style} aria-hidden="true">
      <defs>
        <clipPath id={`${uid}-torso`}>
          <path d={TORSO} />
          <path d={NECK} />
        </clipPath>
        <clipPath id={`${uid}-head`}>
          <path d={HEAD} />
        </clipPath>
        <linearGradient id={`${uid}-shade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={isLemon ? 0.16 : 0.08} />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.3" />
        </linearGradient>
        <radialGradient id={`${uid}-patch`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={coat.marking} stopOpacity="0.9" />
          <stop offset="1" stopColor={coat.marking} stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse ref={shadowRef} cx={150} cy={154} rx={78} ry={5} fill="#000" opacity={0.25} />

      <g ref={bodyRef}>
        {/* far legs sit behind the body */}
        {renderLeg(0, true, BACK.w)}
        {renderLeg(1, true, FRONT.w)}

        {/* tail */}
        <path ref={tailRef} stroke={coat.base} strokeWidth={11} strokeLinecap="round" fill="none" />
        <path
          ref={tailStripeRef}
          stroke={coat.marking}
          strokeWidth={isLemon ? 11 : 4}
          strokeDasharray={isLemon ? '6 8' : '8 14 3 10'}
          strokeLinecap={isLemon ? 'butt' : 'round'}
          fill="none"
          opacity={isLemon ? 0.75 : 0.55}
        />

        {/* torso, neck and markings */}
        <path d={NECK} fill={coat.base} />
        <path d={TORSO} fill={coat.base} />
        <g clipPath={`url(#${uid}-torso)`}>
          {isLemon ? (
            <>
              <g stroke={coat.marking} strokeWidth={5.5} strokeLinecap="round" fill="none" opacity={0.72}>
                {[92, 108, 124, 140, 156, 172, 188].map((x) => (
                  <path key={x} d={`M${x},46 C${x - 5},60 ${x - 2},76 ${x + 5},92`} />
                ))}
              </g>
              <path d="M80,60 C110,50 170,48 205,58" stroke={coat.marking} strokeWidth={6} fill="none" opacity={0.6} />
              {/* white belly, chest and throat */}
              <path d="M100,92 C130,104 172,104 200,90 L214,96 L214,112 L96,112Z" fill={coat.white} />
              <path d="M204,58 C216,60 228,64 236,62 L236,92 L196,104 C204,90 206,72 204,58Z" fill={coat.white} />
            </>
          ) : (
            <>
              <ellipse cx={120} cy={66} rx={30} ry={18} fill={`url(#${uid}-patch)`} />
              <ellipse cx={178} cy={80} rx={22} ry={16} fill={`url(#${uid}-patch)`} opacity={0.7} />
              <ellipse cx={92} cy={86} rx={16} ry={14} fill={`url(#${uid}-patch)`} opacity={0.6} />
              {flecks.map((f, i) => (
                <ellipse
                  key={i}
                  cx={f.x}
                  cy={f.y}
                  rx={f.rx}
                  ry={f.ry}
                  transform={`rotate(${f.rot} ${f.x} ${f.y})`}
                  fill={f.color}
                  opacity={f.opacity * 0.65}
                />
              ))}
            </>
          )}
          <rect x={60} y={30} width={190} height={90} fill={`url(#${uid}-shade)`} />
        </g>

        {/* near legs in front of the body */}
        {renderLeg(2, false, BACK.w)}
        {renderLeg(3, false, FRONT.w)}
        {/* thigh and shoulder masses blend legs into the body */}
        <path d="M80,78 C82,64 98,60 110,66 C120,72 120,90 112,100 C104,108 88,106 82,96 C79,90 79,84 80,78Z" fill={coat.base} />
        {!isLemon && <ellipse cx={100} cy={80} rx={14} ry={11} fill={`url(#${uid}-patch)`} opacity={0.8} />}
        {isLemon && (
          <g stroke={coat.marking} strokeWidth={4} strokeLinecap="round" fill="none" opacity={0.65}>
            <path d="M88,72 C94,78 98,86 98,96" />
            <path d="M102,68 C108,76 112,84 112,94" />
          </g>
        )}
        <ellipse cx={192} cy={86} rx={13} ry={15} fill={isLemon ? coat.white : coat.base} opacity={0.95} />

        {/* head */}
        <g ref={headRef} transform="translate(226 50)">
          <path d={EAR_FAR} fill={coat.baseShade} />
          <path d={HEAD} fill={coat.base} />
          <g clipPath={`url(#${uid}-head)`}>
            {isLemon ? (
              <>
                <g stroke={coat.marking} strokeWidth={2.4} strokeLinecap="round" fill="none" opacity={0.75}>
                  <path d="M-6,-26 C-4,-18 -2,-12 0,-8" />
                  <path d="M-14,-22 C-11,-16 -9,-10 -8,-6" />
                  <path d="M-24,2 C-18,2 -12,4 -6,8" />
                  <path d="M-23,9 C-18,10 -13,12 -9,15" />
                </g>
                <path d="M6,-27 C14,-22 22,-12 27,-4 C31,0 34,3 35,8 C36,14 30,19 18,19 C10,22 2,22 -2,19 C4,14 10,8 14,0 C14,-10 10,-20 6,-27Z" fill={coat.white} />
                <ellipse cx={27} cy={10} rx={2.6} ry={2} fill={coat.freckle} opacity={0.7} />
              </>
            ) : (
              <>
                {brindle(5, { x: -26, y: -28, w: 62, h: 52 }, 60, [coat.marking, coat.marking2], 0.6).map((f, i) => (
                  <ellipse key={i} cx={f.x} cy={f.y} rx={f.rx} ry={f.ry} fill={f.color} opacity={f.opacity * 0.7} />
                ))}
                <path d="M8,-26 C16,-20 24,-10 28,-2 C30,4 32,8 30,12 C24,10 18,4 14,-4 C12,-12 10,-20 8,-26Z" fill={coat.marking} opacity={0.9} />
              </>
            )}
            <path d={HEAD} fill={`url(#${uid}-shade)`} />
          </g>
          <path d={EAR_NEAR} fill={coat.base} />
          <path d={EAR_NEAR_IN} fill={coat.innerEar} />
          <path d={EYE} fill={coat.iris} />
          <ellipse cx={16} cy={-7} rx={1.8} ry={3.6} fill="#0B0807" />
          <circle cx={13.5} cy={-8.5} r={1.1} fill="#fff" opacity={0.9} />
          <path d={EYE} fill="none" stroke={coat.outline} strokeWidth={1.3} />
          <path d="M31.5,3 C33,2 35.5,2 36.5,3.4 L34.5,6.4 C34,7 33.4,7 33,6.4Z" fill={coat.nose} />
          <path d="M33.6,7 C33,11 29,13 24,11.5" stroke={coat.outline} strokeOpacity={0.6} strokeWidth={1.1} fill="none" strokeLinecap="round" />
          <g stroke={coat.whisker} strokeWidth={0.6} fill="none">
            <path d="M26,9 C36,7 46,8 56,11" />
            <path d="M26,11 C36,11 45,14 54,18" />
          </g>
        </g>
      </g>
    </svg>
  );
};
