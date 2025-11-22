import { init } from '@instantdb/react';

// Initialize InstantDB
const APP_ID = (import.meta.env.VITE_INSTANT_APP_ID || '').trim();

export const db = init({ appId: APP_ID });

// Auth helpers
export const { auth } = db;
