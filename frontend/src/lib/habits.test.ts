import { describe, expect, it } from 'vitest';
import { currentStreak, toggleCheck } from './habits';

describe('currentStreak', () => {
  it('counts through yesterday when today is open', () => {
    expect(currentStreak(['2026-10-21', '2026-10-22', '2026-10-23'], '2026-10-24')).toBe(3);
  });
  it('includes today once checked', () => {
    expect(currentStreak(['2026-10-23', '2026-10-24'], '2026-10-24')).toBe(2);
  });
  it('breaks on a gap', () => {
    expect(currentStreak(['2026-10-21', '2026-10-24'], '2026-10-24')).toBe(1);
    expect(currentStreak(['2026-10-21'], '2026-10-24')).toBe(0);
  });
  it('crosses month boundaries', () => {
    expect(currentStreak(['2026-09-30', '2026-10-01'], '2026-10-01')).toBe(2);
  });
});

describe('toggleCheck', () => {
  it('adds and removes days, sorted and unique', () => {
    expect(toggleCheck(['2026-10-24'], '2026-10-22', true)).toEqual(['2026-10-22', '2026-10-24']);
    expect(toggleCheck(['2026-10-22', '2026-10-24'], '2026-10-22', true)).toEqual(['2026-10-22', '2026-10-24']);
    expect(toggleCheck(['2026-10-22', '2026-10-24'], '2026-10-22', false)).toEqual(['2026-10-24']);
  });
});
