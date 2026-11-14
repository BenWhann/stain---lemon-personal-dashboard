import { describe, expect, it } from 'vitest';
import { calculateTodayBuckets } from './TodayPane';
import { addDays, todayISO } from '../../lib/dates';
import type { Task } from '../../types';

describe('calculateTodayBuckets', () => {
  const today = todayISO();
  const yesterday = addDays(today, -1);
  const tomorrow = addDays(today, 1);
  const nextWeek = addDays(today, 4);
  const nextMonth = addDays(today, 30);

  const mockTasks: Task[] = [
    {
      id: 1,
      title: 'Overdue task',
      category: 'Work',
      priority: 'Zoomies',
      due_date: yesterday,
      status: 'Pending',
      completed: false,
      position: 0,
      pomodoros: 0,
      subtasks: [],
    },
    {
      id: 2,
      title: 'Due today task',
      category: 'Bills',
      priority: 'Purr-fect',
      due_date: today,
      status: 'Pending',
      completed: false,
      position: 1,
      pomodoros: 0,
      subtasks: [],
    },
    {
      id: 3,
      title: 'In progress task with no date',
      category: 'Personal',
      priority: 'Catnap',
      due_date: null,
      status: 'In Progress',
      completed: false,
      position: 2,
      pomodoros: 0,
      subtasks: [],
    },
    {
      id: 4,
      title: 'Coming due tomorrow',
      category: 'Grad School',
      priority: 'Purr-fect',
      due_date: tomorrow,
      status: 'Pending',
      completed: false,
      position: 3,
      pomodoros: 0,
      subtasks: [],
    },
    {
      id: 5,
      title: 'Coming due in 4 days',
      category: 'Grad School',
      priority: 'Purr-fect',
      due_date: nextWeek,
      status: 'Pending',
      completed: false,
      position: 4,
      pomodoros: 0,
      subtasks: [],
    },
    {
      id: 6,
      title: 'Someday task',
      category: 'Personal',
      priority: 'Catnap',
      due_date: nextMonth,
      status: 'Pending',
      completed: false,
      position: 5,
      pomodoros: 0,
      subtasks: [],
    },
    {
      id: 7,
      title: 'Completed today',
      category: 'Work',
      priority: 'Purr-fect',
      due_date: today,
      status: 'Completed',
      completed: true,
      completed_at: `${today}T12:00:00Z`,
      position: 6,
      pomodoros: 1,
      subtasks: [],
    },
  ];

  it('correctly partitions overdue and due today tasks', () => {
    const buckets = calculateTodayBuckets(mockTasks, today);

    expect(buckets.overdue).toHaveLength(1);
    expect(buckets.overdue[0].id).toBe(1);

    expect(buckets.dueToday).toHaveLength(2);
    expect(buckets.dueToday.map((t) => t.id)).toEqual([2, 3]);

    expect(buckets.today).toHaveLength(3); // overdue + dueToday
  });

  it('correctly identifies week upcoming tasks', () => {
    const buckets = calculateTodayBuckets(mockTasks, today);

    expect(buckets.week).toHaveLength(2);
    expect(buckets.week.map((t) => t.id)).toEqual([4, 5]);
  });

  it('correctly identifies someday tasks', () => {
    const buckets = calculateTodayBuckets(mockTasks, today);

    expect(buckets.someday).toHaveLength(1);
    expect(buckets.someday[0].id).toBe(6);
  });

  it('tracks tasks completed today', () => {
    const buckets = calculateTodayBuckets(mockTasks, today);

    expect(buckets.doneToday).toHaveLength(1);
    expect(buckets.doneToday[0].id).toBe(7);
  });
});
