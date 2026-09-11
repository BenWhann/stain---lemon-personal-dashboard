export function getUrgencyCountdown(dueDateStr?: string): { text: string; isOverdue: boolean; isToday: boolean; isSoon: boolean } {
  if (!dueDateStr) {
    return { text: 'No due date', isOverdue: false, isToday: false, isSoon: false };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year, month, day] = dueDateStr.split('-').map(Number);
  if (!year || !month || !day) {
    return { text: dueDateStr, isOverdue: false, isToday: false, isSoon: false };
  }

  const due = new Date(year, month - 1, day);
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const daysAgo = Math.abs(diffDays);
    return {
      text: daysAgo === 1 ? 'Overdue by 1 day' : `Overdue by ${daysAgo} days`,
      isOverdue: true,
      isToday: false,
      isSoon: false,
    };
  }

  if (diffDays === 0) {
    return { text: 'Due today! ⚡', isOverdue: false, isToday: true, isSoon: true };
  }

  if (diffDays === 1) {
    return { text: 'Due tomorrow', isOverdue: false, isToday: false, isSoon: true };
  }

  if (diffDays <= 3) {
    return { text: `Due in ${diffDays} days`, isOverdue: false, isToday: false, isSoon: true };
  }

  if (diffDays <= 7) {
    return { text: `Due in ${diffDays} days`, isOverdue: false, isToday: false, isSoon: false };
  }

  const weeks = Math.floor(diffDays / 7);
  return {
    text: weeks === 1 ? 'Due in 1 week' : `Due in ${weeks} weeks`,
    isOverdue: false,
    isToday: false,
    isSoon: false,
  };
}

export function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 22) return 'Good evening';
  return 'Late night focus';
}

export function formatDateFull(date: Date = new Date()): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
