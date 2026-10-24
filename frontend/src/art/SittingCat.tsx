import React, { useId, useMemo } from 'react';
import { brindle, COATS, CoatName } from './coats';
import { CatHead, EyeState } from './CatHead';

interface SittingCatProps {
  /** position when nested inside another <svg> */
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  onClick?: (e: React.MouseEvent<SVGSVGElement>) => void;
  coat: CoatName;
  eyes?: EyeState;
  look?: { x: number; y: number };
  dilate?: number;
  headTilt?: number;
  className?: string;
  style?: React.CSSProperties;
  blinkDelay?: number;
  title?: string;
}

/*
  Upright sitting cat, front view. viewBox 0 0 200 270.
  Paws rest on y≈256 so the cat can be anchored to a surface.
*/
const BODY =
  'M100,104 C76,104 60,122 55,152 C50,186 43,220 48,243 C51,254 62,258 76,256 L124,256 C138,258 149,254 152,243 C157,220 150,186 145,152 C140,122 124,104 100,104Z';
const BIB =
  'M100,110 C86,113 78,128 76,152 C74,186 79,226 82,256 L118,256 C121,226 126,186 124,152 C122,128 114,113 100,110Z';
const LEG_L = 'M77,172 C76,200 75,228 75,250 L93,250 C94,228 95,200 95,172Z';
const LEG_R = 'M105,172 C106,200 107,228 107,250 L125,250 C126,228 125,200 123,172Z';
const TAIL = 'M148,240 C172,234 186,248 176,258 C166,267 120,266 86,262';

export const SittingCat: React.FC<SittingCatProps> = ({
  coat: coatName,
  eyes = 'open',
  look,
  dilate,
  headTilt = 0,
  className,
  style,
  blinkDelay = 0,
  title,
  x,
  y,
  width,
  height,
  onClick,
}) => {
  const coat = COATS[coatName];
  const uid = useId().replace(/:/g, '');
  const isLemon = coatName === 'lemon';
  const flecks = useMemo(
    () =>
      isLemon
        ? []
        : brindle(23, { x: 44, y: 104, w: 112, h: 156 }, 420, [coat.marking, coat.marking2, '#D8A064'], 0.75),
    [isLemon, coat],
  );
  const legFlecks = useMemo(
    () => (isLemon ? [] : brindle(41, { x: 74, y: 172, w: 52, h: 80 }, 90, [coat.marking, coat.marking2], 0.6)),
    [isLemon, coat],
  );

  return (
    <svg viewBox="0 0 200 270" x={x} y={y} width={width} height={height} onClick={onClick} className={className} style={style} role="img" aria-label={title} overflow="visible">
      {title && <title>{title}</title>}
      <defs>
        <clipPath id={`${uid}-body`}>
          <path d={BODY} />
        </clipPath>
        <linearGradient id={`${uid}-shade`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.22" />
          <stop offset="0.35" stopColor="#000" stopOpacity="0" />
          <stop offset="0.7" stopColor="#fff" stopOpacity={isLemon ? 0.08 : 0.05} />
          <stop offset="1" stopColor="#000" stopOpacity="0.25" />
        </linearGradient>
        <radialGradient id={`${uid}-patch`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={coat.marking} stopOpacity="0.95" />
          <stop offset="0.6" stopColor={coat.marking} stopOpacity="0.6" />
          <stop offset="1" stopColor={coat.marking} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* contact shadow */}
      <ellipse cx={104} cy={259} rx={70} ry={7} fill="#000" opacity={0.28} />

      {/* Tail wraps around the front paws */}
      <g className="cat-tail-sit">
        <path d={TAIL} stroke={isLemon ? coat.base : coat.base} strokeWidth={15} strokeLinecap="round" fill="none" />
        {isLemon ? (
          <path d={TAIL} stroke={coat.marking} strokeWidth={15} strokeDasharray="7 9" fill="none" opacity={0.75} />
        ) : (
          <path d={TAIL} stroke={coat.marking} strokeWidth={4} strokeDasharray="8 18 3 14" strokeLinecap="round" fill="none" opacity={0.45} transform="translate(0,-2)" />
        )}
      </g>

      {/* Body (breathes) */}
      <g className="cat-breathe">
        <path d={BODY} fill={coat.base} />
        <g clipPath={`url(#${uid}-body)`}>
          {isLemon ? (
            <>
              <g stroke={coat.marking} strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.7}>
                <path d="M50,160 C58,156 66,158 72,164" />
                <path d="M47,180 C56,176 64,178 72,184" />
                <path d="M46,200 C54,197 62,199 70,205" />
                <path d="M150,160 C142,156 134,158 128,164" />
                <path d="M153,180 C144,176 136,178 128,184" />
                <path d="M154,200 C146,197 138,199 130,205" />
                <path d="M60,128 C66,122 72,120 78,121" />
                <path d="M140,128 C134,122 128,120 122,121" />
              </g>
              <path d={BIB} fill={coat.white} />
            </>
          ) : (
            <>
              <ellipse cx={68} cy={170} rx={24} ry={36} fill={`url(#${uid}-patch)`} opacity={0.7} transform="rotate(-12 68 170)" />
              <ellipse cx={140} cy={150} rx={16} ry={22} fill={`url(#${uid}-patch)`} opacity={0.55} />
              <ellipse cx={138} cy={218} rx={20} ry={28} fill={`url(#${uid}-patch)`} opacity={0.5} />
              <ellipse cx={100} cy={122} rx={26} ry={13} fill={`url(#${uid}-patch)`} opacity={0.9} />
              <ellipse cx={58} cy={232} rx={14} ry={18} fill={`url(#${uid}-patch)`} opacity={0.45} />
              {flecks.map((f, i) => (
                <ellipse
                  key={i}
                  cx={f.x}
                  cy={f.y}
                  rx={f.rx}
                  ry={f.ry}
                  transform={`rotate(${f.rot} ${f.x} ${f.y})`}
                  fill={f.color}
                  opacity={f.opacity * 0.7}
                />
              ))}
            </>
          )}
          {/* haunches */}
          <ellipse cx={62} cy={226} rx={20} ry={30} fill="#000" opacity={0.12} />
          <ellipse cx={138} cy={226} rx={20} ry={30} fill="#000" opacity={0.12} />
        </g>

        {/* Front legs: shaded edges only, so they read as one with the chest */}
        <g clipPath={`url(#${uid}-body)`}>
          {isLemon && [LEG_L, LEG_R].map((d, i) => <path key={i} d={d} fill={coat.white} />)}
          {!isLemon &&
            legFlecks.map((f, i) => (
              <ellipse
                key={i}
                cx={f.x}
                cy={f.y}
                rx={f.rx}
                ry={f.ry}
                transform={`rotate(${f.rot} ${f.x} ${f.y})`}
                fill={f.color}
                opacity={f.opacity * 0.6}
              />
            ))}
          <g stroke={isLemon ? coat.whiteShade : '#000'} strokeOpacity={isLemon ? 1 : 0.45} strokeLinecap="round" fill="none">
            <path d="M100,178 C100,205 100,230 100,250" strokeWidth={2.2} />
            <path d="M76,190 C75,214 75,234 75,248" strokeWidth={1.6} strokeOpacity={isLemon ? 0.7 : 0.35} />
            <path d="M124,190 C125,214 125,234 125,248" strokeWidth={1.6} strokeOpacity={isLemon ? 0.7 : 0.35} />
          </g>
          <path d={BODY} fill={`url(#${uid}-shade)`} />
        </g>
        {/* paws with toe beans hinted by two tiny creases */}
        {[84, 116].map((cx) => (
          <g key={cx}>
            <ellipse cx={cx} cy={251} rx={12} ry={6.5} fill={isLemon ? coat.white : coat.baseLight} />
            <path d={`M${cx - 3},248 L${cx - 3},253 M${cx + 3},248 L${cx + 3},253`} stroke="#000" strokeOpacity={0.18} strokeWidth={1} strokeLinecap="round" />
          </g>
        ))}
      </g>

      {/* soft shadow the head casts on the chest */}
      <ellipse cx={100} cy={130} rx={34} ry={10} fill="#000" opacity={0.22} />

      {/* Head */}
      <g
        style={{
          transform: `translate(100px, 84px) rotate(${headTilt}deg) scale(1.1)`,
          transition: 'transform 600ms cubic-bezier(.34,1.56,.64,1)',
        }}
      >
        <CatHead coat={coat} eyes={eyes} look={look} dilate={dilate} blinkDelay={blinkDelay} />
      </g>
    </svg>
  );
};
