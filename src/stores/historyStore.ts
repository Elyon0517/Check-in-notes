import { create } from 'zustand';

import * as bulletService from '@/src/services/bulletService';
import type { HistoryItem } from '@/src/services/bulletService';

type HistoryState = {
  loading: boolean;
  groups: { date: string; items: HistoryItem[] }[];
  last7: { date: string; count: number }[];
  refresh: () => Promise<void>;
};

export const useHistoryStore = create<HistoryState>((set) => ({
  loading: true,
  groups: [],
  last7: [],
  refresh: async () => {
    set({ loading: true });
    const data = await bulletService.getHistory();
    set({
      loading: false,
      groups: data.groups,
      last7: data.last7,
    });
  },
}));
