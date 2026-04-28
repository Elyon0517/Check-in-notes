import { getDatabase } from '@/src/db/database';
import type { BulletCompletionRow } from '@/src/types/models';

export async function insertCompletion(input: {
  id: string;
  bullet_id: string;
  completed_at: string;
  completion_local_date: string;
  week_anchor_date: string | null;
}): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO bullet_completions (id, bullet_id, completed_at, completion_local_date, week_anchor_date)
     VALUES (?, ?, ?, ?, ?)`,
    [
      input.id,
      input.bullet_id,
      input.completed_at,
      input.completion_local_date,
      input.week_anchor_date,
    ],
  );
}

export async function hasCompletionOnLocalDate(
  bulletId: string,
  localDate: string,
): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ c: number }>(
    `SELECT COUNT(*) as c FROM bullet_completions
     WHERE bullet_id = ? AND completion_local_date = ?`,
    [bulletId, localDate],
  );
  return (row?.c ?? 0) > 0;
}

export async function hasCompletionForWeekAnchor(
  bulletId: string,
  weekAnchor: string,
): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ c: number }>(
    `SELECT COUNT(*) as c FROM bullet_completions
     WHERE bullet_id = ? AND week_anchor_date = ?`,
    [bulletId, weekAnchor],
  );
  return (row?.c ?? 0) > 0;
}

export async function hasAnyCompletion(bulletId: string): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ c: number }>(
    `SELECT COUNT(*) as c FROM bullet_completions WHERE bullet_id = ?`,
    [bulletId],
  );
  return (row?.c ?? 0) > 0;
}

export async function deleteLatestCompletionOnLocalDate(
  bulletId: string,
  localDate: string,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `DELETE FROM bullet_completions
     WHERE id = (
       SELECT id FROM bullet_completions
       WHERE bullet_id = ? AND completion_local_date = ?
       ORDER BY completed_at DESC
       LIMIT 1
     )`,
    [bulletId, localDate],
  );
}

export async function deleteLatestCompletionForWeekAnchor(
  bulletId: string,
  weekAnchor: string,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `DELETE FROM bullet_completions
     WHERE id = (
       SELECT id FROM bullet_completions
       WHERE bullet_id = ? AND week_anchor_date = ?
       ORDER BY completed_at DESC
       LIMIT 1
     )`,
    [bulletId, weekAnchor],
  );
}

export async function deleteLatestCompletionForBullet(bulletId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `DELETE FROM bullet_completions
     WHERE id = (
       SELECT id FROM bullet_completions
       WHERE bullet_id = ?
       ORDER BY completed_at DESC
       LIMIT 1
     )`,
    [bulletId],
  );
}

export async function listCompletionsOnLocalDate(localDate: string): Promise<BulletCompletionRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<BulletCompletionRow>(
    `SELECT * FROM bullet_completions WHERE completion_local_date = ? ORDER BY completed_at ASC`,
    [localDate],
  );
}

export async function countCompletionsOnLocalDate(localDate: string): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ c: number }>(
    `SELECT COUNT(*) as c FROM bullet_completions WHERE completion_local_date = ?`,
    [localDate],
  );
  return row?.c ?? 0;
}

export async function listCompletionsGroupedByDay(limitDays: number): Promise<
  { date: string; rows: BulletCompletionRow[] }[]
> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ completion_local_date: string }>(
    `SELECT DISTINCT completion_local_date FROM bullet_completions
     ORDER BY completion_local_date DESC
     LIMIT ?`,
    [limitDays],
  );
  const out: { date: string; rows: BulletCompletionRow[] }[] = [];
  for (const r of rows) {
    const detail = await db.getAllAsync<BulletCompletionRow>(
      `SELECT * FROM bullet_completions WHERE completion_local_date = ? ORDER BY completed_at DESC`,
      [r.completion_local_date],
    );
    out.push({ date: r.completion_local_date, rows: detail });
  }
  return out;
}
