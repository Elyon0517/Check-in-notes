import { create } from 'zustand';

import { wipeAllTables } from '@/src/db/database';
import * as settingsRepo from '@/src/repositories/settingsRepository';
import {
  ensureNotificationPermission,
  syncScheduledNotifications,
} from '@/src/services/notificationService';
import type { AppSettings, WeekdayIndex } from '@/src/types/models';

type SettingsState = {
  loading: boolean;
  settings: AppSettings | null;
  refresh: () => Promise<void>;
  setEodTime: (time: string) => Promise<void>;
  setWeekStart: (day: WeekdayIndex) => Promise<void>;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  clearAllData: () => Promise<void>;
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  loading: true,
  settings: null,
  refresh: async () => {
    set({ loading: true });
    const settings = await settingsRepo.getSettings();
    set({ loading: false, settings });
    await syncScheduledNotifications();
  },
  setEodTime: async (time) => {
    await settingsRepo.updateSettings({ eod_reminder_time: time });
    await get().refresh();
  },
  setWeekStart: async (day) => {
    await settingsRepo.updateSettings({ week_start_day: day });
    await get().refresh();
  },
  setNotificationsEnabled: async (enabled) => {
    if (enabled) {
      await ensureNotificationPermission();
    }
    await settingsRepo.updateSettings({ notifications_enabled: enabled });
    await get().refresh();
  },
  clearAllData: async () => {
    await wipeAllTables();
    await settingsRepo.ensureSettingsRow();
    set({ settings: await settingsRepo.getSettings() });
    await syncScheduledNotifications();
  },
}));
