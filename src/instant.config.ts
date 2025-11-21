import { init } from '@instantdb/react';
import { Task, ChatMessage, UserStats, UserProfile, DailyTip } from './types';

// Schema definition for InstantDB
type Schema = {
  tasks: Task;
  chatMessages: ChatMessage;
  userStats: UserStats;
  userProfile: UserProfile;
  dailyTips: DailyTip & { userId: string };
};

// Initialize InstantDB
const APP_ID = import.meta.env.VITE_INSTANT_APP_ID || '';

export const db = init<Schema>({ appId: APP_ID });

// Auth helpers
export const { auth } = db;
