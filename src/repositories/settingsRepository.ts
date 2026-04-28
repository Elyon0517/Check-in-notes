import { getDatabase } from '@/src/db/database';
import type { AppSettings, SettingsRow } from '@/src/types/models';

function rowToSettings(row: SettingsRow): AppSettings {
  return {
    eod_reminder_time: row.eod_reminder_time,
    week_start_day: row.week_start_day as AppSettings['week_start_day'],
    notifications_enabled: row.notifications_enabled === 1,
  };
}

export async function ensureSettingsRow(): Promise<AppSettings> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<SettingsRow>(
    `SELECT * FROM settings WHERE id = 'default'`,
    [],
  );
  if (row) return rowToSettings(row);
  await db.runAsync(
    `INSERT INTO settings (id, eod_reminder_time, week_start_day, notifications_enabled)
     VALUES ('default', '20:00', 1, 1)`,
    [],
  );
  const created = await db.getFirstAsync<SettingsRow>(
    `SELECT * FROM settings WHERE id = 'default'`,
    [],
  );
  if (!created) throw new Error('Failed to create settings');
  return rowToSettings(created);
}

export async function getSettings(): Promise<AppSettings> {
  return ensureSettingsRow();
}

export async function updateSettings(partial: Partial<AppSettings>): Promise<AppSettings> {
  const db = await getDatabase();
  await ensureSettingsRow();
  const sets: string[] = [];
  const vals: (string | number)[] = [];
  if (partial.eod_reminder_time !== undefined) {
    sets.push('eod_reminder_time = ?');
    vals.push(partial.eod_reminder_time);
  }
  if (partial.week_start_day !== undefined) {
    sets.push('week_start_day = ?');
    vals.push(partial.week_start_day);
  }
  if (partial.notifications_enabled !== undefined) {
    sets.push('notifications_enabled = ?');
    vals.push(partial.notifications_enabled ? 1 : 0);
  }
  if (sets.length) {
    await db.runAsync(`UPDATE settings SET ${sets.join(', ')} WHERE id = 'default'`, vals);
  }
  return getSettings();
}
