export type DayStatus = "planning" | "active" | "locked";

export interface Task {
  id: number;
  title: string;
  weight: number;
  completed: boolean;
  completed_at: string | null;
  position: number;
  category: string | null;
}

export interface Day {
  id: number;
  date: string;
  status: DayStatus;
  score: number;
  total: number;
  started_at: string | null;
  locked_at: string | null;
  note: string | null;
  tasks: Task[];
}

export interface HistoryEntry {
  date: string;
  score: number;
  total: number;
  locked: boolean;
}

export interface Streak {
  streak: number;
  threshold: number;
}

export interface Template {
  id: string;
  name: string;
  tasks: { title: string; weight: number; category: string | null }[];
}

export interface CategoryStat {
  category: string;
  total_weight: number;
  completed_weight: number;
  task_count: number;
  completed_count: number;
}

export interface Stats {
  total_days: number;
  longest_streak: number;
  avg_7d: number;
  avg_30d: number;
}
