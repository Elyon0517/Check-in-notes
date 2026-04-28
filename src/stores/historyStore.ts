import { create } from 'zustand';

import * as bulletService from '@/src/services/bulletService';
import type { DailyCompletionStat, HistoryItem } from '@/src/services/bulletService';

type HistoryState = {
  loading: boolean;
  groups: { date: string; items: HistoryItem[] }[];
  last7: DailyCompletionStat[];
  heatmap: DailyCompletionStat[];
  refresh: () => Promise<void>;
};

export const useHistoryStore = create<HistoryState>((set) => ({
  loading: true,
  groups: [],
  last7: [],
  heatmap: [],
  refresh: async () => {
    set({ loading: true });
    const data = await bulletService.getHistory();
    set({
      loading: false,
      groups: data.groups,
      last7: data.last7,
      heatmap: data.heatmap,
    });
  },
}));
