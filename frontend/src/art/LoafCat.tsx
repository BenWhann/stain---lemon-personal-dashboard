import React, { useId, useMemo } from 'react';
import { brindle, COATS, CoatName } from './coats';
import { CatHead } from './CatHead';

interface LoafCatProps {
  /** position when nested inside another <svg> */
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  onClick?: (e: React.MouseEvent<SVGSVGElement>) => void;
  coat: CoatName;
  asleep?: boolean;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

/*
  Loafing cat, paws tucked, chin resting forward (viewBox 0 0 240 150).
  The body sits on y≈138 so it can rest on a shelf or a stack of books.
*/
const BODY =
  'M38,132 C30,100 52,66 104,62 C160,58 208,82 214,118 C216,130 208,138 194,138 L50,138 C42,138 39,136 38,132Z';
const TAIL = 'M206,124 C222,130 220,142 200,143 C170,145 120,144 92,142';

export const LoafCat: React.FC<LoafCatProps> = ({
  coat: coatName,
  asleep = true,
  className,
  style,
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
    () => (isLemon ? [] : brindle(57, { x: 34, y: 56, w: 184, h: 86 }, 300, [coat.marking, coat.marking2, '#D8A064'], 0.8)),
    [isLemon, coat],
  );

  return (
    <svg viewBox="0 0 240 150" x={x} y={y} width={width} height={height} onClick={onClick} className={className} style={style} role="img" aria-label={title} overflow="visible">
      {title && <title>{title}</title>}
      <defs>
        <clipPath id={`${uid}-body`}>
          <path d={BODY} />
        </clipPath>
        <linearGradient id={`${uid}-shade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={isLemon ? 0.18 : 0.08} />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.3" />
        </linearGradient>
        <radialGradient id={`${uid}-patch`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={coat.marking} stopOpacity="0.9" />
          <stop offset="1" stopColor={coat.marking} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx={124} cy={140} rx={96} ry={6} fill="#000" opacity={0.25} />

      <g className="cat-sleep-breathe">
        <path d={BODY} fill={coat.base} />
        <g clipPath={`url(#${uid}-body)`}>
          {isLemon ? (
            <>
              <g stroke={coat.marking} strokeWidth={6} strokeLinecap="round" fill="none" opacity={0.7}>
                {[96, 116, 136, 156, 176, 196].map((x) => (
                  <path key={x} d={`M${x},58 C${x + 6},76 ${x + 8},96 ${x + 4},120`} />
                ))}
              </g>
              <path d="M70,62 C120,52 180,66 212,96" stroke={coat.marking} strokeWidth={7} fill="none" opacity={0.55} />
              <path d="M40,120 C46,104 62,98 78,104 C84,116 82,132 76,140 L40,140Z" fill={coat.white} />
            </>
          ) : (
            <>
              <ellipse cx={130} cy={80} rx={40} ry={18} fill={`url(#${uid}-patch)`} />
              <ellipse cx={186} cy={110} rx={22} ry={18} fill={`url(#${uid}-patch)`} opacity={0.7} />
              {flecks.map((f, i) => (
                <ellipse key={i} cx={f.x} cy={f.y} rx={f.rx} ry={f.ry}
                  transform={`rotate(${f.rot} ${f.x} ${f.y})`} fill={f.color} opacity={f.opacity * 0.65} />
              ))}
            </>
          )}
          <path d={BODY} fill={`url(#${uid}-shade)`} />
        </g>
        {/* tucked front paws */}
        <ellipse cx={60} cy={136} rx={13} ry={6} fill={isLemon ? coat.white : coat.baseLight} />
        <ellipse cx={86} cy={137} rx={12} ry={5.5} fill={isLemon ? coat.whiteShade : coat.base} />
      </g>

      <g>
        <path d={TAIL} stroke={coat.base} strokeWidth={13} strokeLinecap="round" fill="none" />
        <path d={TAIL} stroke={coat.marking} strokeWidth={isLemon ? 13 : 4} strokeDasharray={isLemon ? '7 9' : '8 16 3 12'}
          fill="none" opacity={isLemon ? 0.7 : 0.4} />
      </g>

      <g transform="translate(70,84) rotate(-8) scale(0.72)">
        <CatHead coat={coat} eyes={asleep ? 'closed' : 'open'} />
      </g>

      {asleep && (
        <g fill="currentColor" className="font-display" style={{ fontSize: 14, fontStyle: 'italic' }}>
          <text x={96} y={34} className="cat-zzz" style={{ animationDelay: '0s' }}>z</text>
          <text x={104} y={26} className="cat-zzz" style={{ animationDelay: '1.2s', fontSize: 11 }}>z</text>
          <text x={110} y={20} className="cat-zzz" style={{ animationDelay: '2.4s', fontSize: 9 }}>z</text>
        </g>
      )}
    </svg>
  );
};
