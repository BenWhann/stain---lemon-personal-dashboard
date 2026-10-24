// Experience and levels. XP is derived from real activity, so it can't drift from the data.

export const LEVEL_TITLES = [
  'Kitten',
  'Curious Paws',
  'Sunbeam Seeker',
  'Cozy Scholar',
  'Biscuit Maker',
  'Window Watcher',
  'Night Owl',
  'Library Lion',
  'Grand Purr-fessor',
  'Legendary Loaf',
];

export interface XpInputs {
  completedTasks: number;
  zoomiesCompleted: number;
  habitChecks: number;
  focusSessions: number;
  pets: number;
}

export function computeXp(i: XpInputs): number {
  return (
    i.completedTasks * 10 +
    i.zoomiesCompleted * 5 +
    i.habitChecks * 4 +
    i.focusSessions * 15 +
    Math.floor(i.pets / 5)
  );
}

/** XP needed to reach a level (level 1 starts at 0). Each level asks for 60 more than the last. */
export function xpForLevel(level: number): number {
  const n = level - 1;
  return 30 * n * (n + 1);
}

export function levelFromXp(xp: number) {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  const floor = xpForLevel(level);
  const ceil = xpForLevel(level + 1);
  return {
    level,
    title: LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)],
    progress: (xp - floor) / (ceil - floor),
    toNext: ceil - xp,
  };
}
