export type TaskPriority = 'Zoomies' | 'Purr-fect' | 'Catnap';
export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';
export const CATEGORIES = ['Grad School', 'Work', 'Bills', 'Personal'] as const;
export const PRIORITIES: TaskPriority[] = ['Zoomies', 'Purr-fect', 'Catnap'];
export const STATUSES: TaskStatus[] = ['Pending', 'In Progress', 'Completed'];

export interface Subtask {
  id: number;
  task_id: number;
  title: string;
  done: boolean;
  position: number;
}

export interface Task {
  id: number;
  title: string;
  category: string;
  priority: TaskPriority | string;
  due_date: string | null;
  source?: string | null;
  status: TaskStatus | string;
  completed: boolean;
  notes?: string | null;
  position: number;
  pomodoros: number;
  completed_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  subtasks: Subtask[];
}

export interface TaskDraft {
  title: string;
  category?: string;
  priority?: TaskPriority;
  due_date?: string | null;
  source?: string;
  notes?: string;
  status?: TaskStatus;
  subtasks?: string[];
}

export type EventCategory = 'Academic' | 'Work' | 'Bills' | 'Wellness' | 'Personal';
export const EVENT_CATEGORIES: EventCategory[] = ['Academic', 'Work', 'Bills', 'Wellness', 'Personal'];

export interface CalendarEvent {
  id: number;
  title: string;
  time: string;
  date: string;
  category: EventCategory | string;
  icon?: string | null;
  location?: string | null;
}

export interface Habit {
  id: number;
  name: string;
  icon?: string | null;
  checks: string[];
  streak: number;
  best_streak: number;
}

export interface Bookmark {
  id: number;
  title: string;
  url: string;
  category: string;
  icon?: string | null;
}

export interface PetCounters {
  lemon_pets: number;
  stain_pets: number;
  focus_paws: number;
}

export interface FocusSession {
  id: number;
  date: string;
  minutes: number;
  task_id: number | null;
}

export type AssignmentStatus = 'Not Started' | 'In Progress' | 'Completed';
export interface Assignment {
  id: number;
  course: string;
  prof: string;
  name: string;
  due: string;
  weight: string;
  status: AssignmentStatus | string;
}

export interface User {
  username: string;
  display_name: string;
}

export type View = 'journal' | 'insights' | 'settings';
