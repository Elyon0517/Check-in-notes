import { create } from 'zustand';

import * as bulletService from '@/src/services/bulletService';
import { syncScheduledNotifications } from '@/src/services/notificationService';
import type { Bullet } from '@/src/types/models';

type WeekState = {
  loading: boolean;
  bullets: Bullet[];
  completedIds: Set<string>;
  weekAnchor: string;
  refresh: () => Promise<void>;
  completeBullet: (b: Bullet) => Promise<void>;
};

export const useWeekStore = create<WeekState>((set, get) => ({
  loading: true,
  bullets: [],
  completedIds: new Set(),
  weekAnchor: '',
  refresh: async () => {
    set({ loading: true });
    const data = await bulletService.getWeekOverview();
    set({
      loading: false,
      bullets: data.bullets,
      completedIds: data.completedThisWeek,
      weekAnchor: data.weekAnchor,
    });
  },
  completeBullet: async (b) => {
    await bulletService.completeBullet(b);
    await get().refresh();
    await syncScheduledNotifications();
  },
}));
