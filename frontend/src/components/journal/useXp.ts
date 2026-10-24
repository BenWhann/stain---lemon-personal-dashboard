import { useMemo } from 'react';
import { computeXp, levelFromXp } from '../../lib/gamify';
import { useHabits } from '../../store/habits';
import { usePets } from '../../store/pets';
import { useTasks } from '../../store/tasks';
import { useTimer } from '../../store/timer';

export function useXp() {
  const tasks = useTasks((s) => s.tasks);
  const habits = useHabits((s) => s.habits);
  const sessions = useTimer((s) => s.sessions);
  const pets = usePets((s) => s.lemonPets + s.stainPets);
  return useMemo(() => {
    const done = tasks.filter((t) => t.completed);
    const xp = computeXp({
      completedTasks: done.length,
      zoomiesCompleted: done.filter((t) => t.priority === 'Zoomies').length,
      habitChecks: habits.reduce((n, h) => n + h.checks.length, 0),
      focusSessions: sessions.length,
      pets,
    });
    return { xp, ...levelFromXp(xp) };
  }, [tasks, habits, sessions, pets]);
}
