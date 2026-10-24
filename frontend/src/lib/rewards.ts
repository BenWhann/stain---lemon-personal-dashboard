import { sfx } from './audio';
import { burst, fanfare } from './celebrate';
import { todayISO } from './dates';
import { usePets } from '../store/pets';
import { useParade } from '../store/parade';
import { useTasks } from '../store/tasks';
import { toast } from '../store/toast';

// Completing tasks in quick succession builds a combo: higher notes, bigger bursts.
const COMBO_WINDOW_MS = 120_000;
let combo = 0;
let lastAt = 0;

export async function completeTaskWithFlair(id: number, point?: { x: number; y: number }) {
  const before = useTasks.getState().tasks.find((t) => t.id === id);
  if (!before) return;

  if (before.completed) {
    sfx.uncheck();
    await useTasks.getState().toggle(id);
    return;
  }

  const now = Date.now();
  combo = now - lastAt < COMBO_WINDOW_MS ? combo + 1 : 1;
  lastAt = now;

  sfx.complete(combo);
  burst(point?.x, point?.y, combo);
  usePets.getState().cheer();
  if (combo === 3) toast.reward('Three in a row. Lemon is impressed.');
  if (combo === 5) toast.reward('Five-task streak. Full zoomies!');

  const saved = await useTasks.getState().toggle(id);
  if (!saved) return;

  toast.undo(`Done: ${saved.title}`, () => {
    sfx.uncheck();
    void useTasks.getState().toggle(id);
  });

  const today = todayISO();
  const dueToday = useTasks.getState().tasks.filter((t) => t.due_date && t.due_date <= today);
  if (dueToday.length > 0 && dueToday.every((t) => t.completed)) {
    window.setTimeout(() => {
      fanfare();
      sfx.levelUp();
      useParade.getState().start(['lemon', 'stain']);
      toast.reward("Everything due today is done. Victory lap!");
    }, 450);
  } else if (combo >= 3) {
    useParade.getState().start([combo % 2 ? 'lemon' : 'stain']);
  }
}
