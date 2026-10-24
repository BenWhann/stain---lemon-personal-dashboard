import { describe, expect, it } from 'vitest';
import { parseQuickAdd } from './quickAdd';

// Saturday 24 October 2026
const TODAY = '2026-10-24';

describe('parseQuickAdd', () => {
  it('leaves plain titles alone', () => {
    expect(parseQuickAdd('Email Prof. Powers', TODAY)).toMatchObject({
      title: 'Email Prof. Powers', due_date: null, priority: null, category: null,
    });
  });

  it('reads relative days', () => {
    expect(parseQuickAdd('Pay rent today', TODAY).due_date).toBe('2026-10-24');
    expect(parseQuickAdd('Pay rent tomorrow', TODAY).due_date).toBe('2026-10-25');
    expect(parseQuickAdd('Pay rent in 3 days', TODAY).due_date).toBe('2026-10-27');
    expect(parseQuickAdd('Pay rent in 2 weeks', TODAY).due_date).toBe('2026-11-07');
  });

  it('reads weekdays as the next occurrence', () => {
    expect(parseQuickAdd('Paper fri', TODAY).due_date).toBe('2026-10-30');
    expect(parseQuickAdd('Paper monday', TODAY).due_date).toBe('2026-10-26');
    // same weekday as today means next week, not today
    expect(parseQuickAdd('Paper sat', TODAY).due_date).toBe('2026-10-31');
    expect(parseQuickAdd('Paper next mon', TODAY).due_date).toBe('2026-11-02');
  });

  it('reads month-day and slash dates, rolling into next year when past', () => {
    expect(parseQuickAdd('Finals dec 12', TODAY).due_date).toBe('2026-12-12');
    expect(parseQuickAdd('Taxes 4/15', TODAY).due_date).toBe('2027-04-15');
    expect(parseQuickAdd('Thing 2026-11-02', TODAY).due_date).toBe('2026-11-02');
    expect(parseQuickAdd('Bad feb 30', TODAY).due_date).toBeNull();
  });

  it('reads priority and category tags', () => {
    const r = parseQuickAdd('Learning agreement fri !high #school', TODAY);
    expect(r).toMatchObject({
      title: 'Learning agreement', due_date: '2026-10-30', priority: 'Zoomies', category: 'Grad School',
    });
    expect(r.tokens.map((t) => t.kind).sort()).toEqual(['category', 'date', 'priority']);
    expect(parseQuickAdd('Nap !low', TODAY).priority).toBe('Catnap');
    expect(parseQuickAdd('Call Banfield !! #cats', TODAY)).toMatchObject({ priority: 'Zoomies', category: 'Personal' });
  });

  it('keeps unknown tags in the title', () => {
    expect(parseQuickAdd('Fix #42 bug !wat', TODAY).title).toBe('Fix #42 bug !wat');
  });

  it('does not eat words that merely contain a weekday', () => {
    expect(parseQuickAdd('Sunday school outline', TODAY).title).toBe('school outline');
    expect(parseQuickAdd('Wednesday', TODAY).due_date).toBe('2026-10-28');
    expect(parseQuickAdd('Monopoly night', TODAY)).toMatchObject({ title: 'Monopoly night', due_date: null });
    expect(parseQuickAdd('Marathon 5k training', TODAY)).toMatchObject({ title: 'Marathon 5k training', due_date: null });
    expect(parseQuickAdd('Wedding gift', TODAY).due_date).toBeNull();
  });
});
