export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  TASKS = 'TASKS',
  CHAT = 'CHAT',
  SETTINGS = 'SETTINGS'
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  category: 'quick' | 'project' | 'survival';
  subtasks?: Task[];
  isBrokenDown?: boolean;
  isExpanded?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface UserStats {
  streak: number;
  tasksCompleted: number;
  lastActive: number;
  level: string;
}

export interface UserProfile {
  name: string;
  kidName: string;
  kidStage: string;
}

export interface DailyTip {
  date: string;
  text: string;
  category: 'development' | 'partner' | 'sanity';
}
