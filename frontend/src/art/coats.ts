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
    base: '#8C6D52',
    baseShade: '#6B5040',
    baseLight: '#B08E6E',
    marking: '#3F2C21',
    marking2: '#5A4030',
    white: '#F8F2E8',
    whiteShade: '#DCCDBA',
    innerEar: '#E2A99B',
    nose: '#E59C91',
    noseShade: '#C97B70',
    iris: '#A9C36B',
    irisEdge: '#6E8A3C',
    freckle: '#D9874E',
    whisker: 'rgba(255,250,240,0.85)',
    outline: '#2A1D16',
  },
  stain: {
    name: 'stain',
    base: '#231A16',
    baseShade: '#150F0D',
    baseLight: '#3B2C24',
    marking: '#B4733C',
    marking2: '#7E4626',
    white: '#C88A4E',
    whiteShade: '#9A6234',
    innerEar: '#8A5A57',
    nose: '#1B1311',
    noseShade: '#0E0908',
    iris: '#CDB84C',
    irisEdge: '#7F8A2E',
    freckle: '#C98447',
    whisker: 'rgba(245,230,210,0.42)',
    outline: '#0D0908',
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
