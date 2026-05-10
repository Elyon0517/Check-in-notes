export type BulletType = 'daily' | 'weekly' | 'one_time';

export type Priority = 'low' | 'medium' | 'high';

export type BulletCategory = 'general' | 'study' | 'fitness' | 'work' | 'health' | 'life';

export type AppLanguage = 'en' | 'zh';

/** 0 = Sunday … 6 = Saturday (aligned with `date-fns` / JS `getDay`) */
export type WeekdayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type BulletRow = {
  id: string;
  title: string;
  description: string;
  category: BulletCategory;
  type: BulletType;
  priority: Priority;
  reminder_enabled: number;
  reminder_time: string;
  eod_reminder_enabled: number;
  weekly_day: number;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  sort_order: number | null;
};

export type Bullet = Omit<BulletRow, 'reminder_enabled' | 'eod_reminder_enabled'> & {
  reminder_enabled: boolean;
  eod_reminder_enabled: boolean;
  sort_order: number | null;
};

export type BulletCompletionRow = {
  id: string;
  bullet_id: string;
  completed_at: string;
  completion_local_date: string;
  week_anchor_date: string | null;
};

export type SettingsRow = {
  id: string;
  eod_reminder_time: string;
  week_start_day: number;
  notifications_enabled: number;
  language: AppLanguage;
};

export type AppSettings = {
  eod_reminder_time: string;
  week_start_day: WeekdayIndex;
  notifications_enabled: boolean;
  language: AppLanguage;
};

export function rowToBullet(row: BulletRow): Bullet {
  return {
    ...row,
    category: row.category ?? 'general',
    reminder_enabled: row.reminder_enabled === 1,
    eod_reminder_enabled: row.eod_reminder_enabled === 1,
  };
}
