import { getDatabase } from '@/src/db/database';
import type { Bullet, BulletCategory, BulletRow, BulletType, Priority } from '@/src/types/models';
import { rowToBullet } from '@/src/types/models';

export type BulletInsert = {
  id: string;
  title: string;
  description: string;
  category: BulletCategory;
  type: BulletType;
  priority: Priority;
  reminder_enabled: boolean;
  reminder_time: string;
  eod_reminder_enabled: boolean;
  weekly_day: number;
};

export async function insertBullet(input: BulletInsert): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO bullets (
      id, title, description, category, type, priority,
      reminder_enabled, reminder_time, eod_reminder_enabled, weekly_day,
      archived_at, created_at, updated_at, user_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, NULL)`,
    [
      input.id,
      input.title,
      input.description,
      input.category,
      input.type,
      input.priority,
      input.reminder_enabled ? 1 : 0,
      input.reminder_time,
      input.eod_reminder_enabled ? 1 : 0,
      input.weekly_day,
      now,
      now,
    ],
  );
}

export async function updateBullet(
  id: string,
  patch: Partial<
    Pick<
      BulletInsert,
      | 'title'
      | 'description'
      | 'category'
      | 'type'
      | 'priority'
      | 'reminder_enabled'
      | 'reminder_time'
      | 'eod_reminder_enabled'
      | 'weekly_day'
    >
  >,
): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const fields: string[] = ['updated_at = ?'];
  const vals: (string | number)[] = [now];
  const map: [keyof typeof patch, string][] = [
    ['title', 'title'],
    ['description', 'description'],
    ['category', 'category'],
    ['type', 'type'],
    ['priority', 'priority'],
    ['reminder_time', 'reminder_time'],
    ['weekly_day', 'weekly_day'],
  ];
  for (const [k, col] of map) {
    if (patch[k] !== undefined) {
      fields.push(`${col} = ?`);
      vals.push(patch[k] as string | number);
    }
  }
  if (patch.reminder_enabled !== undefined) {
    fields.push('reminder_enabled = ?');
    vals.push(patch.reminder_enabled ? 1 : 0);
  }
  if (patch.eod_reminder_enabled !== undefined) {
    fields.push('eod_reminder_enabled = ?');
    vals.push(patch.eod_reminder_enabled ? 1 : 0);
  }
  vals.push(id);
  await db.runAsync(`UPDATE bullets SET ${fields.join(', ')} WHERE id = ?`, vals);
}

export async function setBulletArchived(id: string, archived: boolean): Promise<void> {
  const db = await getDatabase();
  const ts = archived ? new Date().toISOString() : null;
  await db.runAsync(`UPDATE bullets SET archived_at = ?, updated_at = ? WHERE id = ?`, [
    ts,
    new Date().toISOString(),
    id,
  ]);
}

export async function deleteBullet(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM bullets WHERE id = ?`, [id]);
}

export async function getBulletById(id: string): Promise<Bullet | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<BulletRow>(`SELECT * FROM bullets WHERE id = ?`, [id]);
  return row ? rowToBullet(row) : null;
}

/** Non-archived bullets (any type) */
export async function listActiveBullets(): Promise<Bullet[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<BulletRow>(
    `SELECT * FROM bullets WHERE archived_at IS NULL ORDER BY
      CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
      created_at ASC`,
    [],
  );
  return rows.map(rowToBullet);
}

export async function listArchivedBullets(): Promise<Bullet[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<BulletRow>(
    `SELECT * FROM bullets WHERE archived_at IS NOT NULL ORDER BY updated_at DESC`,
    [],
  );
  return rows.map(rowToBullet);
}

export async function listAllBullets(): Promise<Bullet[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<BulletRow>(
    `SELECT * FROM bullets ORDER BY created_at ASC`,
    [],
  );
  return rows.map(rowToBullet);
}
