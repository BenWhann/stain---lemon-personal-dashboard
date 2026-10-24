import confetti from 'canvas-confetti';

// Celebration bursts. Shapes are made once and reused.
const COLORS = ['#F4BA5C', '#E8A598', '#C98A4B', '#F6ECDC', '#AAB876', '#FFD27A'];

let shapes: confetti.Shape[] | null = null;
function getShapes(): confetti.Shape[] {
  if (shapes) return shapes;
  try {
    shapes = [
      confetti.shapeFromText({ text: '🐾', scalar: 2 }),
      confetti.shapeFromText({ text: '🍋', scalar: 2 }),
      confetti.shapeFromText({ text: '✨', scalar: 2 }),
      'circle',
    ];
  } catch {
    shapes = ['circle', 'square'];
  }
  return shapes;
}

let enabled = true;
export function setCelebrationsEnabled(value: boolean) {
  enabled = value;
}

function origin(x?: number, y?: number) {
  return {
    x: x !== undefined ? x / window.innerWidth : 0.5,
    y: y !== undefined ? y / window.innerHeight : 0.5,
  };
}

/** Small burst from the checkbox that was clicked. Bigger with a combo. */
export function burst(x?: number, y?: number, combo = 1) {
  if (!enabled) return;
  const s = getShapes();
  const n = Math.min(18 + combo * 10, 70);
  confetti({
    particleCount: n,
    spread: 70 + combo * 8,
    startVelocity: 24 + combo * 3,
    gravity: 0.9,
    ticks: 140,
    scalar: 0.9,
    origin: origin(x, y),
    colors: COLORS,
    shapes: s,
    disableForReducedMotion: false,
    zIndex: 90,
  });
}

/** Two-sided cannon for big moments: all tasks done, level up, a finished sprint. */
export function fanfare() {
  if (!enabled) return;
  const s = getShapes();
  const fire = (x: number, angle: number) =>
    confetti({
      particleCount: 90,
      angle,
      spread: 62,
      startVelocity: 58,
      gravity: 1,
      ticks: 260,
      origin: { x, y: 0.82 },
      colors: COLORS,
      shapes: s,
      scalar: 1.1,
      zIndex: 90,
    });
  fire(0.05, 60);
  fire(0.95, 120);
  window.setTimeout(() => {
    fire(0.2, 70);
    fire(0.8, 110);
  }, 260);
}

/** Hearts float up from a petted cat. */
export function hearts(x: number, y: number, cat: 'lemon' | 'stain') {
  if (!enabled) return;
  let shape: confetti.Shape = 'circle';
  try {
    shape = confetti.shapeFromText({ text: cat === 'lemon' ? '💛' : '🧡', scalar: 2.2 });
  } catch {
    /* emoji shapes unsupported */
  }
  confetti({
    particleCount: 9,
    spread: 50,
    startVelocity: 14,
    gravity: -0.25,
    drift: 0,
    ticks: 110,
    scalar: 1.2,
    origin: origin(x, y),
    shapes: [shape],
    flat: true,
    zIndex: 90,
  });
}
