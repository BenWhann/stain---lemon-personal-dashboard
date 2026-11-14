/*
  Coat palettes drawn from photos of the real cats.

  Lemon: brown mackerel tabby and white. Tabby cap and back with dark stripes,
  white blaze that widens from the forehead into a white muzzle, white bib, belly
  and legs, a pink nose with peachy freckles beside it, and green eyes.

  Stain: tortoiseshell. Near-black base brindled with caramel and rust, a caramel
  blaze down one side of the nose, olive-gold eyes, and a dark nose.
*/
export type CoatName = 'lemon' | 'stain';

export interface Coat {
  name: CoatName;
  base: string;        // main fur
  baseShade: string;   // shadowed fur (far legs, under-belly)
  baseLight: string;   // rim-lit fur
  marking: string;     // stripes / brindle
  marking2: string;    // secondary brindle
  white: string;       // white fur (Lemon only; Stain uses caramel)
  whiteShade: string;
  chinYellow?: string; // Lemon: yellow on chin and around nose
  innerEar: string;
  nose: string;
  noseShade: string;
  iris: string;
  irisEdge: string;
  freckle: string;
  whisker: string;
  outline: string;
}

export const COATS: Record<CoatName, Coat> = {
  lemon: {
    name: 'lemon',
    base: '#A47950',
    baseShade: '#7D5837',
    baseLight: '#C4986C',
    marking: '#442E20',
    marking2: '#5E402D',
    white: '#FAF5EC',
    whiteShade: '#DED1C0',
    chinYellow: '#E5B865',
    innerEar: '#E4A496',
    nose: '#E89C92',
    noseShade: '#C9776D',
    iris: '#9AB85B',
    irisEdge: '#658236',
    freckle: '#D49B55',
    whisker: 'rgba(255,250,240,0.85)',
    outline: '#261B14',
  },
  stain: {
    name: 'stain',
    base: '#221915',
    baseShade: '#140E0C',
    baseLight: '#35261F',
    marking: '#8E5F3D',       /* muted earthy caramel (less orange/yellow) */
    marking2: '#653F28',      /* deep toasted umber */
    white: '#9A6E4B',         /* soft muted caramel blaze */
    whiteShade: '#754E30',
    innerEar: '#7C524F',
    nose: '#181210',
    noseShade: '#0C0807',
    iris: '#B39F48',          /* muted antique olive-gold */
    irisEdge: '#6F772D',
    freckle: '#8E5F3D',
    whisker: 'rgba(240,225,205,0.4)',
    outline: '#0E0908',
  },
};

/** Deterministic PRNG so brindle and stripes look identical on every render. */
export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Fleck {
  x: number;
  y: number;
  rx: number;
  ry: number;
  rot: number;
  color: string;
  opacity: number;
}

/** Brindle flecks scattered inside a box; callers clip them to the fur shape. */
export function brindle(
  seed: number,
  box: { x: number; y: number; w: number; h: number },
  count: number,
  colors: string[],
  size = 1,
): Fleck[] {
  const rnd = seeded(seed);
  return Array.from({ length: count }, () => ({
    x: box.x + rnd() * box.w,
    y: box.y + rnd() * box.h,
    rx: (1.2 + rnd() * 3.6) * size,
    ry: (0.6 + rnd() * 1.4) * size,
    rot: rnd() * 180,
    color: colors[Math.floor(rnd() * colors.length)],
    opacity: 0.35 + rnd() * 0.55,
  }));
}
