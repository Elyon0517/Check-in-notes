import { getDatabase } from '@/src/db/database';
import { generateId } from '@/src/utils/id';

export async function insertSkip(bulletId: string, localDate: string): Promise<void> {
  const db = await getDatabase();
  const exists = await hasSkipOnLocalDate(bulletId, localDate);
  if (exists) return;
  await db.runAsync(
    `INSERT INTO bullet_skips (id, bullet_id, skip_local_date) VALUES (?, ?, ?)`,
    [generateId(), bulletId, localDate],
  );
}

export async function hasSkipOnLocalDate(bulletId: string, localDate: string): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ c: number }>(
    `SELECT COUNT(*) as c FROM bullet_skips WHERE bullet_id = ? AND skip_local_date = ?`,
    [bulletId, localDate],
  );
  return (row?.c ?? 0) > 0;
}

export async function deleteSkipOnLocalDate(bulletId: string, localDate: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `DELETE FROM bullet_skips WHERE bullet_id = ? AND skip_local_date = ?`,
    [bulletId, localDate],
  );
}
