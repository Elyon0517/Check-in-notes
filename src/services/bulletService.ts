import * as bulletRepo from '@/src/repositories/bulletRepository';
import * as completionRepo from '@/src/repositories/completionRepository';
import * as settingsRepo from '@/src/repositories/settingsRepository';
import { lastNDates, localDateString, weekAnchorString } from '@/src/services/dateHelpers';
import type { AppSettings, Bullet, BulletType } from '@/src/types/models';
import { generateId } from '@/src/utils/id';

function isBulletActive(
  b: Bullet,
  deps: {
    completedToday: Set<string>;
    completedThisWeek: Set<string>;
    everCompleted: Set<string>;
  },
): boolean {
  if (b.archived_at) return false;
  if (b.type === 'daily') {
    return !deps.completedToday.has(b.id);
  }
  if (b.type === 'weekly') {
    return !deps.completedThisWeek.has(b.id);
  }
  return !deps.everCompleted.has(b.id);
}

async function buildCompletionSets(bullets: Bullet[], today: string, weekAnchor: string) {
  const completedToday = new Set<string>();
  const completedThisWeek = new Set<string>();
  const everCompleted = new Set<string>();

  for (const b of bullets) {
    if (await completionRepo.hasAnyCompletion(b.id)) {
      everCompleted.add(b.id);
    }
    if (await completionRepo.hasCompletionOnLocalDate(b.id, today)) {
      completedToday.add(b.id);
    }
    if (b.type === 'weekly') {
      if (await completionRepo.hasCompletionForWeekAnchor(b.id, weekAnchor)) {
        completedThisWeek.add(b.id);
      }
    }
  }
  return { completedToday, completedThisWeek, everCompleted };
}

export async function getHomeLists(): Promise<{
  active: Bullet[];
  completedToday: Bullet[];
  settings: AppSettings;
  today: string;
  progress: { done: number; total: number };
}> {
  const settings = await settingsRepo.getSettings();
  const today = localDateString();
  const weekAnchor = weekAnchorString(new Date(), settings.week_start_day);
  const bullets = await bulletRepo.listActiveBullets();
  const sets = await buildCompletionSets(bullets, today, weekAnchor);

  const active: Bullet[] = [];
  const completedTodayBullets: Bullet[] = [];

  for (const b of bullets) {
    if (sets.completedToday.has(b.id)) {
      completedTodayBullets.push(b);
      continue;
    }
    if (isBulletActive(b, sets)) {
      active.push(b);
    }
  }

  const total = active.length + completedTodayBullets.length;
  return {
    active,
    completedToday: completedTodayBullets,
    settings,
    today,
    progress: { done: completedTodayBullets.length, total },
  };
}

export function normalizeProgress(done: number, total: number) {
  if (total === 0) return 0;
  return done / total;
}

export async function getWeekOverview(): Promise<{
  bullets: Bullet[];
  completedThisWeek: Set<string>;
  weekAnchor: string;
  settings: AppSettings;
}> {
  const settings = await settingsRepo.getSettings();
  const weekAnchor = weekAnchorString(new Date(), settings.week_start_day);
  const bullets = (await bulletRepo.listActiveBullets()).filter((b) => b.type === 'weekly');
  const completedThisWeek = new Set<string>();
  for (const b of bullets) {
    if (await completionRepo.hasCompletionForWeekAnchor(b.id, weekAnchor)) {
      completedThisWeek.add(b.id);
    }
  }
  return { bullets, completedThisWeek, weekAnchor, settings };
}

export async function completeBullet(bullet: Bullet): Promise<void> {
  const settings = await settingsRepo.getSettings();
  const now = new Date();
  const today = localDateString(now);
  const weekAnchor = weekAnchorString(now, settings.week_start_day);

  if (bullet.type === 'daily') {
    if (await completionRepo.hasCompletionOnLocalDate(bullet.id, today)) return;
    await completionRepo.insertCompletion({
      id: generateId(),
      bullet_id: bullet.id,
      completed_at: now.toISOString(),
      completion_local_date: today,
      week_anchor_date: null,
    });
    return;
  }

  if (bullet.type === 'weekly') {
    if (await completionRepo.hasCompletionForWeekAnchor(bullet.id, weekAnchor)) return;
    await completionRepo.insertCompletion({
      id: generateId(),
      bullet_id: bullet.id,
      completed_at: now.toISOString(),
      completion_local_date: today,
      week_anchor_date: weekAnchor,
    });
    return;
  }

  if (await completionRepo.hasAnyCompletion(bullet.id)) return;
  await completionRepo.insertCompletion({
    id: generateId(),
    bullet_id: bullet.id,
    completed_at: now.toISOString(),
    completion_local_date: today,
    week_anchor_date: null,
  });
}

export async function quickAddDaily(title: string): Promise<void> {
  const id = generateId();
  await bulletRepo.insertBullet({
    id,
    title: title.trim(),
    description: '',
    type: 'daily',
    priority: 'medium',
    reminder_enabled: false,
    reminder_time: '09:00',
    eod_reminder_enabled: false,
    weekly_day: 1,
  });
}

export type BulletDraft = {
  title: string;
  description: string;
  type: BulletType;
  priority: Bullet['priority'];
  reminder_enabled: boolean;
  reminder_time: string;
  eod_reminder_enabled: boolean;
  weekly_day: number;
};

export async function createBulletFromForm(d: BulletDraft): Promise<string> {
  const id = generateId();
  await bulletRepo.insertBullet({
    id,
    title: d.title.trim(),
    description: d.description.trim(),
    type: d.type,
    priority: d.priority,
    reminder_enabled: d.reminder_enabled,
    reminder_time: d.reminder_time,
    eod_reminder_enabled: d.eod_reminder_enabled,
    weekly_day: d.weekly_day,
  });
  return id;
}

export async function archiveBullet(id: string): Promise<void> {
  await bulletRepo.setBulletArchived(id, true);
}

export async function updateBulletFromForm(id: string, d: BulletDraft): Promise<void> {
  await bulletRepo.updateBullet(id, {
    title: d.title.trim(),
    description: d.description.trim(),
    type: d.type,
    priority: d.priority,
    reminder_enabled: d.reminder_enabled,
    reminder_time: d.reminder_time,
    eod_reminder_enabled: d.eod_reminder_enabled,
    weekly_day: d.weekly_day,
  });
}

export type HistoryItem = {
  bulletId: string;
  bulletTitle: string;
  completedAt: string;
};

export async function getHistory(): Promise<{
  groups: { date: string; items: HistoryItem[] }[];
  last7: { date: string; count: number }[];
}> {
  const groupsRaw = await completionRepo.listCompletionsGroupedByDay(90);
  const groups: { date: string; items: HistoryItem[] }[] = [];
  for (const g of groupsRaw) {
    const items: HistoryItem[] = [];
    for (const row of g.rows) {
      const b = await bulletRepo.getBulletById(row.bullet_id);
      items.push({
        bulletId: row.bullet_id,
        bulletTitle: b?.title ?? '（已归档或删除）',
        completedAt: row.completed_at,
      });
    }
    groups.push({ date: g.date, items });
  }
  const last7: { date: string; count: number }[] = [];
  for (const date of lastNDates(7)) {
    const count = await completionRepo.countCompletionsOnLocalDate(date);
    last7.push({ date, count });
  }
  return { groups, last7 };
}
