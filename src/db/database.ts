import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS bullets (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('daily', 'weekly', 'one_time')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  reminder_enabled INTEGER NOT NULL DEFAULT 0,
  reminder_time TEXT NOT NULL DEFAULT '09:00',
  eod_reminder_enabled INTEGER NOT NULL DEFAULT 0,
  weekly_day INTEGER NOT NULL DEFAULT 1,
  archived_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  user_id TEXT
);

CREATE TABLE IF NOT EXISTS bullet_completions (
  id TEXT PRIMARY KEY NOT NULL,
  bullet_id TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  completion_local_date TEXT NOT NULL,
  week_anchor_date TEXT,
  FOREIGN KEY (bullet_id) REFERENCES bullets (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY NOT NULL DEFAULT 'default',
  eod_reminder_time TEXT NOT NULL DEFAULT '20:00',
  week_start_day INTEGER NOT NULL DEFAULT 1,
  notifications_enabled INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_completions_bullet ON bullet_completions (bullet_id);
CREATE INDEX IF NOT EXISTS idx_completions_local_date ON bullet_completions (completion_local_date);
CREATE INDEX IF NOT EXISTS idx_completions_week_anchor ON bullet_completions (week_anchor_date);
CREATE INDEX IF NOT EXISTS idx_bullets_archived ON bullets (archived_at);
`;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  const db = await SQLite.openDatabaseAsync('bullets.db');
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await db.execAsync(SCHEMA);
  dbInstance = db;
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.closeAsync();
    dbInstance = null;
  }
}

export async function wipeAllTables(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(`
    DELETE FROM bullet_completions;
    DELETE FROM bullets;
    DELETE FROM settings;
  `);
}
