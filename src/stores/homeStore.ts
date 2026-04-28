import { create } from 'zustand';

import * as bulletService from '@/src/services/bulletService';
import { syncScheduledNotifications } from '@/src/services/notificationService';
import type { AppSettings, Bullet } from '@/src/types/models';

type HomeState = {
  loading: boolean;
  active: Bullet[];
  completedToday: Bullet[];
  settings: AppSettings | null;
  today: string;
  progress: { done: number; total: number };
  refresh: () => Promise<void>;
  completeBullet: (b: Bullet) => Promise<void>;
  undoBullet: (b: Bullet) => Promise<void>;
  quickAdd: (title: string) => Promise<void>;
};

export const useHomeStore = create<HomeState>((set, get) => ({
  loading: true,
  active: [],
  completedToday: [],
  settings: null,
  today: '',
  progress: { done: 0, total: 0 },
  refresh: async () => {
    set({ loading: true });
    const data = await bulletService.getHomeLists();
    set({
      loading: false,
      active: data.active,
      completedToday: data.completedToday,
      settings: data.settings,
      today: data.today,
      progress: data.progress,
    });
  },
  completeBullet: async (b) => {
    await bulletService.completeBullet(b);
    await get().refresh();
    await syncScheduledNotifications();
  },
  undoBullet: async (b) => {
    await bulletService.undoBulletCompletion(b);
    await get().refresh();
    await syncScheduledNotifications();
  },
  quickAdd: async (title) => {
    if (!title.trim()) return;
    await bulletService.quickAddDaily(title);
    await get().refresh();
    await syncScheduledNotifications();
  },
}));
