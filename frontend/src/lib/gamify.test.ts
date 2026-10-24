import { describe, expect, it } from 'vitest';
import { computeXp, levelFromXp, xpForLevel } from './gamify';

describe('levels', () => {
  it('starts at level 1 with no xp', () => {
    expect(levelFromXp(0)).toMatchObject({ level: 1, title: 'Kitten', progress: 0, toNext: 60 });
  });
  it('crosses thresholds exactly', () => {
    expect(xpForLevel(2)).toBe(60);
    expect(xpForLevel(4)).toBe(360);
    expect(levelFromXp(59).level).toBe(1);
    expect(levelFromXp(60).level).toBe(2);
    expect(levelFromXp(400)).toMatchObject({ level: 4, title: 'Cozy Scholar' });
  });
  it('keeps the top title past the list', () => {
    expect(levelFromXp(1_000_000).title).toBe('Legendary Loaf');
  });
  it('weights activity', () => {
    expect(computeXp({ completedTasks: 2, zoomiesCompleted: 1, habitChecks: 3, focusSessions: 1, pets: 12 })).toBe(
      20 + 5 + 12 + 15 + 2,
    );
  });
});
