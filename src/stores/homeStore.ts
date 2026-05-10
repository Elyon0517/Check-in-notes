import { create } from 'zustand';

import * as bulletService from '@/src/services/bulletService';
import { syncScheduledNotifications } from '@/src/services/notificationService';
import type { AppSettings, Bullet, BulletType } from '@/src/types/models';

type HomeState = {
  loading: boolean;
  active: Bullet[];
  completedToday: Bullet[];
  skippedToday: Bullet[];
  settings: AppSettings | null;
  today: string;
  progress: { done: number; total: number };
  refresh: () => Promise<void>;
  completeBullet: (b: Bullet) => Promise<void>;
  undoBullet: (b: Bullet) => Promise<void>;
  skipBullet: (b: Bullet) => Promise<void>;
  unskipBullet: (b: Bullet) => Promise<void>;
  quickAdd: (title: string, type: BulletType) => Promise<void>;
  reorderActive: (orderedIds: string[]) => Promise<void>;
};

export const useHomeStore = create<HomeState>((set, get) => ({
  loading: true,
  active: [],
  completedToday: [],
  skippedToday: [],
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
      skippedToday: data.skippedToday,
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
  skipBullet: async (b) => {
    await bulletService.skipBulletOnce(b);
    await get().refresh();
  },
  unskipBullet: async (b) => {
    await bulletService.unskipBullet(b);
    await get().refresh();
  },
  quickAdd: async (title, type) => {
    if (!title.trim()) return;
    await bulletService.quickAdd(title, type);
    await get().refresh();
    await syncScheduledNotifications();
  },
  reorderActive: async (orderedIds) => {
    await bulletService.reorderActiveBullets(orderedIds);
    await get().refresh();
  },
}));
