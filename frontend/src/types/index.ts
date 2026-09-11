export type TaskPriority = 'Zoomies' | 'Purr-fect' | 'Catnap';
export type TaskCategory = 'Grad School' | 'Work' | 'Bills' | 'Personal';
export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';

export interface Task {
  id: number;
  title: string;
  category: TaskCategory | string;
  priority: TaskPriority;
  due_date: string; // YYYY-MM-DD
  source?: string;
  status?: TaskStatus | string;
  completed: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export type EventCategory = 'Academic' | 'Work' | 'Bills' | 'Wellness' | 'Personal';

export interface CalendarEvent {
  id: number;
  title: string;
  time: string;
  date: string; // YYYY-MM-DD
  category: EventCategory | string;
  icon?: string;
  location?: string;
}

export interface Habit {
  id: number;
  name: string;
  icon?: string;
  days: boolean[]; // 7 elements (Mon to Sun)
  streak: number;
}

export interface Bookmark {
  id: number;
  title: string;
  url: string;
  category: string;
  icon?: string;
}

export interface PetCounters {
  lemon_pets: number;
  stain_pets: number;
  focus_paws: number;
}

export interface FloatingParticle {
  id: number;
  x: number;
  y: number;
  emoji: string;
}

export interface Assignment {
  id: number;
  course: string;
  prof: string;
  name: string;
  due: string;
  weight: string;
  status: string;
}

export interface SyncStatusInfo {
  status: string;
  lastSyncTime: string | null;
  sheetUrl: string;
  autoSync: boolean;
}

export type DashboardTab = 'overview' | 'calendar' | 'study' | 'integrations';
