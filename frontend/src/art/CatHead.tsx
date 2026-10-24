import React, { useId, useMemo } from 'react';
import { brindle, Coat } from './coats';

export type EyeState = 'open' | 'closed' | 'happy';

interface CatHeadProps {
  coat: Coat;
  eyes?: EyeState;
  /** pupil offset in the range -1..1 for each axis */
  look?: { x: number; y: number };
  /** wider pupils read as excitement */
  dilate?: number;
  blinkDelay?: number;
  className?: string;
}

/*
  Front-facing head drawn in local coordinates centred on (0, 0):
  roughly 96 wide and 110 tall including ears. Place it with a transform.
*/
const HEAD =
  'M0,-40 C25,-40 42,-28 46,-8 C50,10 46,25 33,34 C22,41 11,44 0,44 C-11,44 -22,41 -33,34 C-46,25 -50,10 -46,-8 C-42,-28 -25,-40 0,-40Z';
const EAR_L = 'M-46,-8 C-48,-30 -46,-50 -40,-63 C-38,-67 -34,-67 -31,-64 C-24,-56 -16,-46 -9,-36 Z';
const EAR_L_IN = 'M-40,-16 C-41,-32 -39,-46 -36,-55 C-35,-57 -33,-57 -32,-55 C-27,-48 -21,-40 -16,-33 Z';
const EAR_R = 'M46,-8 C48,-30 46,-50 40,-63 C38,-67 34,-67 31,-64 C24,-56 16,-46 9,-36 Z';
const EAR_R_IN = 'M40,-16 C41,-32 39,-46 36,-55 C35,-57 33,-57 32,-55 C27,-48 21,-40 16,-33 Z';
const EYE_L = 'M-31,-1 C-27,-11 -13,-11 -8,-2 C-12,6 -26,7 -31,-1Z';
const EYE_R = 'M31,-1 C27,-11 13,-11 8,-2 C12,6 26,7 31,-1Z';
const NOSE = 'M-6.5,13 L6.5,13 C8,13 8.5,14.6 7.4,15.8 L1.4,21.2 C0.6,21.9 -0.6,21.9 -1.4,21.2 L-7.4,15.8 C-8.5,14.6 -8,13 -6.5,13Z';

// Lemon: white blaze widening into the muzzle, chin and lower cheeks
const LEMON_BLAZE =
  'M0,-39 C3,-31 4.5,-20 5.5,-9 C6.5,1 9,7 15,8 C24,9 31,11 35,18 C37,27 30,37 17,42 C11,44 5,44.5 0,44.5 C-5,44.5 -11,44 -17,42 C-30,37 -37,27 -35,18 C-31,11 -24,9 -15,8 C-9,7 -6.5,1 -5.5,-9 C-4.5,-20 -3,-31 0,-39Z';
// Stain: caramel blaze down the right side of the nose, plus a warm chin
const STAIN_BLAZE =
  'M3,-38 C9,-28 11,-15 9,-2 C9,8 13,16 21,22 C24,25 22,29 17,30 C10,31 4,28 1,22 C-1,12 -1,0 0,-14 C0,-24 1,-32 3,-38Z';
const STAIN_CHIN = 'M-12,32 C-6,38 6,38 13,31 C10,40 4,44 0,44 C-5,44 -10,40 -12,32Z';

export const CatHead: React.FC<CatHeadProps> = ({
  coat,
  eyes = 'open',
  look = { x: 0, y: 0 },
  dilate = 0,
  blinkDelay = 0,
  className,
}) => {
  const uid = useId().replace(/:/g, '');
  const isLemon = coat.name === 'lemon';
  const px = Math.max(-1, Math.min(1, look.x)) * 3.2;
  const py = Math.max(-1, Math.min(1, look.y)) * 2;
  const pupilRx = 2.4 + dilate * 2.2;
  const pupilRy = 6.2 + dilate * 0.8;

  const flecks = useMemo(
    () =>
      isLemon
        ? []
        : brindle(7, { x: -48, y: -42, w: 96, h: 86 }, 200, [coat.marking, coat.marking2, '#D59A5C'], 0.6),
    [isLemon, coat],
  );

  return (
    <g className={className}>
      <defs>
        <clipPath id={`${uid}-head`}>
          <path d={HEAD} />
        </clipPath>
        <radialGradient id={`${uid}-shine`} cx="0.35" cy="0.25" r="0.85">
          <stop offset="0" stopColor="#fff" stopOpacity={isLemon ? 0.22 : 0.12} />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.28" />
        </radialGradient>
        <radialGradient id={`${uid}-iris`} cx="0.5" cy="0.45" r="0.6">
          <stop offset="0" stopColor={coat.iris} />
          <stop offset="0.75" stopColor={coat.iris} />
          <stop offset="1" stopColor={coat.irisEdge} />
        </radialGradient>
      </defs>

      {/* Ears */}
      <g className="cat-ear cat-ear-l">
        <path d={EAR_L} fill={coat.base} />
        <path d={EAR_L_IN} fill={coat.innerEar} opacity={0.9} />
        {isLemon && <path d="M-40,-63 C-38,-67 -34,-67 -31,-64 L-35,-58Z" fill={coat.marking} />}
      </g>
      <g className="cat-ear cat-ear-r">
        <path d={EAR_R} fill={coat.base} />
        <path d={EAR_R_IN} fill={coat.innerEar} opacity={0.9} />
        {isLemon && <path d="M40,-63 C38,-67 34,-67 31,-64 L35,-58Z" fill={coat.marking} />}
      </g>

      {/* Skull and markings */}
      <path d={HEAD} fill={coat.base} />
      <g clipPath={`url(#${uid}-head)`}>
        {isLemon ? (
          <>
            {/* forehead "M" and cheek stripes */}
            <g stroke={coat.marking} strokeLinecap="round" fill="none" opacity={0.8}>
              <path d="M-13,-36 C-12,-28 -10,-20 -8,-13" strokeWidth={2.6} />
              <path d="M13,-36 C12,-28 10,-20 8,-13" strokeWidth={2.6} />
              <path d="M-22,-33 C-20,-26 -17,-20 -15,-15" strokeWidth={2.2} />
              <path d="M22,-33 C20,-26 17,-20 15,-15" strokeWidth={2.2} />
              <path d="M-48,2 C-42,1 -37,3 -33,6" strokeWidth={2.4} />
              <path d="M-48,9 C-43,9 -39,11 -36,13" strokeWidth={2} />
              <path d="M48,2 C42,1 37,3 33,6" strokeWidth={2.4} />
              <path d="M48,9 C43,9 39,11 36,13" strokeWidth={2} />
              <path d="M-31,-6 C-36,-9 -40,-10 -44,-9" strokeWidth={1.6} />
              <path d="M31,-6 C36,-9 40,-10 44,-9" strokeWidth={1.6} />
            </g>
            <path d={LEMON_BLAZE} fill={coat.white} />
            {/* peachy freckles beside the nose */}
            <g fill={coat.freckle} opacity={0.75}>
              <ellipse cx={-11} cy={17} rx={3.4} ry={2.4} />
              <ellipse cx={-15.5} cy={20} rx={2.4} ry={1.8} />
              <ellipse cx={11.5} cy={17.5} rx={3} ry={2.2} />
              <ellipse cx={8} cy={21} rx={1.6} ry={1.2} />
            </g>
          </>
        ) : (
          <>
            {flecks.map((f, i) => (
              <ellipse
                key={i}
                cx={f.x}
                cy={f.y}
                rx={f.rx}
                ry={f.ry}
                transform={`rotate(${f.rot} ${f.x} ${f.y})`}
                fill={f.color}
                opacity={f.opacity * 0.8}
              />
            ))}
            <path d={STAIN_BLAZE} fill={coat.marking} opacity={0.92} />
            <path d={STAIN_CHIN} fill={coat.marking2} opacity={0.9} />
            <ellipse cx={-27} cy={14} rx={7} ry={4} fill={coat.marking2} opacity={0.5} />
          </>
        )}
        <path d={HEAD} fill={`url(#${uid}-shine)`} />
      </g>

      {/* Eyes */}
      {eyes === 'open' ? (
        <g className="cat-eyes" style={{ animationDelay: `${blinkDelay}s` }}>
          {[EYE_L, EYE_R].map((d, i) => {
            const cx = i === 0 ? -19.5 : 19.5;
            return (
              <g key={i}>
                <path d={d} fill={`url(#${uid}-iris)`} />
                <ellipse
                  cx={cx + px}
                  cy={-2 + py}
                  rx={pupilRx}
                  ry={pupilRy}
                  fill="#0B0807"
                  style={{ transition: 'all 260ms cubic-bezier(.22,1,.36,1)' }}
                />
                <circle cx={cx - 3.6 + px * 0.4} cy={-5 + py * 0.4} r={1.9} fill="#fff" opacity={0.92} />
                <circle cx={cx + 3 + px * 0.4} cy={1 + py * 0.4} r={0.9} fill="#fff" opacity={0.6} />
                <path
                  d={i === 0 ? 'M-32,-2 C-27,-12 -12,-12 -7,-3 C-14,-7 -25,-7 -32,-2Z' : 'M32,-2 C27,-12 12,-12 7,-3 C14,-7 25,-7 32,-2Z'}
                  fill={isLemon ? coat.base : coat.base}
                  opacity={0.9}
                />
                <path d={d} fill="none" stroke={coat.outline} strokeWidth={1.6} strokeLinejoin="round" />
              </g>
            );
          })}
        </g>
      ) : (
        <g fill="none" stroke={coat.outline} strokeWidth={2.2} strokeLinecap="round">
          {eyes === 'happy' ? (
            <>
              <path d="M-29,0 C-25,-8 -14,-8 -10,0" />
              <path d="M29,0 C25,-8 14,-8 10,0" />
            </>
          ) : (
            <>
              <path d="M-29,-2 C-24,4 -14,4 -9,-2" />
              <path d="M29,-2 C24,4 14,4 9,-2" />
            </>
          )}
        </g>
      )}

      {/* Muzzle */}
      <ellipse cx={-7.5} cy={24} rx={9} ry={6.5} fill={isLemon ? coat.white : coat.baseLight} opacity={isLemon ? 1 : 0.55} />
      <ellipse cx={7.5} cy={24} rx={9} ry={6.5} fill={isLemon ? coat.white : coat.baseLight} opacity={isLemon ? 1 : 0.55} />
      {isLemon && (
        <g fill={coat.freckle} opacity={0.55}>
          <circle cx={-10} cy={22} r={0.9} />
          <circle cx={-13} cy={24.5} r={0.9} />
          <circle cx={-9} cy={26} r={0.9} />
          <circle cx={10} cy={22} r={0.9} />
          <circle cx={13} cy={24.5} r={0.9} />
          <circle cx={9} cy={26} r={0.9} />
        </g>
      )}
      <path d={NOSE} fill={coat.nose} />
      <path d="M-4,14.5 C-2,14 2,14 4,14.5" stroke="#fff" strokeOpacity={0.35} strokeWidth={1.2} strokeLinecap="round" fill="none" />
      <path
        d="M0,21.6 L0,25.5 M0,25.5 C-2,29 -6,29.5 -8.5,27 M0,25.5 C2,29 6,29.5 8.5,27"
        stroke={isLemon ? coat.noseShade : '#4a3a33'}
        strokeWidth={1.4}
        strokeLinecap="round"
        fill="none"
      />

      {/* Whiskers */}
      <g stroke={coat.whisker} strokeWidth={0.7} strokeLinecap="round" fill="none" className="cat-whiskers">
        <path d="M-14,22 C-28,17 -42,15 -58,15" />
        <path d="M-14,25 C-30,23 -44,24 -60,27" />
        <path d="M-13,28 C-26,30 -38,34 -52,40" />
        <path d="M14,22 C28,17 42,15 58,15" />
        <path d="M14,25 C30,23 44,24 60,27" />
        <path d="M13,28 C26,30 38,34 52,40" />
      </g>
    </g>
  );
};
