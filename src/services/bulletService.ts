import * as bulletRepo from '@/src/repositories/bulletRepository';
import * as completionRepo from '@/src/repositories/completionRepository';
import * as settingsRepo from '@/src/repositories/settingsRepository';
import * as skipRepo from '@/src/repositories/skipRepository';
import { lastNDates, localDateString, weekAnchorString } from '@/src/services/dateHelpers';
import type { AppSettings, Bullet, BulletCategory, BulletType } from '@/src/types/models';
import { generateId } from '@/src/utils/id';

function isBulletActive(
  b: Bullet,
  deps: {
    completedToday: Set<string>;
    completedThisWeek: Set<string>;
    everCompleted: Set<string>;
    skippedToday: Set<string>;
  },
): boolean {
  if (b.archived_at) return false;
  if (b.type === 'daily') {
    return !deps.completedToday.has(b.id) && !deps.skippedToday.has(b.id);
  }
  if (b.type === 'weekly') {
    return !deps.completedThisWeek.has(b.id) && !deps.skippedToday.has(b.id);
  }
  return !deps.everCompleted.has(b.id);
}

async function buildCompletionSets(bullets: Bullet[], today: string, weekAnchor: string) {
  const completedToday = new Set<string>();
  const completedThisWeek = new Set<string>();
  const everCompleted = new Set<string>();
  const skippedToday = new Set<string>();

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
    if (await skipRepo.hasSkipOnLocalDate(b.id, today)) {
      skippedToday.add(b.id);
    }
  }
  return { completedToday, completedThisWeek, everCompleted, skippedToday };
}

export async function getHomeLists(): Promise<{
  active: Bullet[];
  completedToday: Bullet[];
  skippedToday: Bullet[];
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
  const skippedTodayBullets: Bullet[] = [];

  for (const b of bullets) {
    if (sets.completedToday.has(b.id)) {
      completedTodayBullets.push(b);
      continue;
    }
    if (sets.skippedToday.has(b.id)) {
      skippedTodayBullets.push(b);
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
    skippedToday: skippedTodayBullets,
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

export async function undoBulletCompletion(bullet: Bullet): Promise<void> {
  const settings = await settingsRepo.getSettings();
  const now = new Date();
  const today = localDateString(now);
  const weekAnchor = weekAnchorString(now, settings.week_start_day);

  if (bullet.type === 'daily') {
    await completionRepo.deleteLatestCompletionOnLocalDate(bullet.id, today);
    return;
  }
  if (bullet.type === 'weekly') {
    await completionRepo.deleteLatestCompletionForWeekAnchor(bullet.id, weekAnchor);
    return;
  }
  await completionRepo.deleteLatestCompletionForBullet(bullet.id);
}

export async function quickAdd(title: string, type: BulletType = 'daily'): Promise<void> {
  const id = generateId();
  await bulletRepo.insertBullet({
    id,
    title: title.trim(),
    description: '',
    category: 'general',
    type,
    priority: 'medium',
    reminder_enabled: false,
    reminder_time: '09:00',
    eod_reminder_enabled: false,
    weekly_day: 1,
  });
}

export async function skipBulletOnce(bullet: Bullet): Promise<void> {
  const today = localDateString();
  await skipRepo.insertSkip(bullet.id, today);
}

export async function unskipBullet(bullet: Bullet): Promise<void> {
  const today = localDateString();
  await skipRepo.deleteSkipOnLocalDate(bullet.id, today);
}

export async function reorderActiveBullets(orderedIds: string[]): Promise<void> {
  await bulletRepo.updateBulletsSortOrder(orderedIds);
}

export type BulletDraft = {
  title: string;
  description: string;
  category: BulletCategory;
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
    category: d.category,
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

export async function deleteBullet(id: string): Promise<void> {
  await bulletRepo.deleteBullet(id);
}

export async function updateBulletFromForm(id: string, d: BulletDraft): Promise<void> {
  await bulletRepo.updateBullet(id, {
    title: d.title.trim(),
    description: d.description.trim(),
    category: d.category,
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
  category: BulletCategory;
  completedAt: string;
};

export type DailyCompletionStat = {
  date: string;
  completed: number;
  planned: number;
  percent: number;
  delta: number;
};

function isBulletEligibleForDate(b: Bullet, date: string) {
  const dayStart = new Date(`${date}T00:00:00`);
  const dayEnd = new Date(`${date}T23:59:59`);
  const created = new Date(b.created_at);
  const archived = b.archived_at ? new Date(b.archived_at) : null;
  return created <= dayEnd && (!archived || archived >= dayStart);
}

function plannedForDate(b: Bullet, date: string) {
  if (!isBulletEligibleForDate(b, date)) return false;
  if (b.type === 'daily') return true;
  if (b.type === 'weekly') return new Date(`${date}T12:00:00`).getDay() === b.weekly_day;
  return false;
}

export async function getHistory(): Promise<{
  groups: { date: string; items: HistoryItem[] }[];
  last7: DailyCompletionStat[];
  heatmap: DailyCompletionStat[];
}> {
  const groupsRaw = await completionRepo.listCompletionsGroupedByDay(90);
  const allBullets = await bulletRepo.listAllBullets();
  const groups: { date: string; items: HistoryItem[] }[] = [];
  for (const g of groupsRaw) {
    const items: HistoryItem[] = [];
    for (const row of g.rows) {
      const b = await bulletRepo.getBulletById(row.bullet_id);
      items.push({
        bulletId: row.bullet_id,
        bulletTitle: b?.title ?? 'Deleted devil',
        category: b?.category ?? 'general',
        completedAt: row.completed_at,
      });
    }
    groups.push({ date: g.date, items });
  }
  const heatmap: DailyCompletionStat[] = [];
  let previousPercent = 0;
  for (const date of lastNDates(180)) {
    const count = await completionRepo.countCompletionsOnLocalDate(date);
    const expected = allBullets.filter((b) => plannedForDate(b, date)).length;
    const planned = Math.max(expected, count);
    const percent = planned === 0 ? 0 : Math.min(1, count / planned);
    const delta = percent - previousPercent;
    heatmap.push({ date, completed: count, planned, percent, delta });
    previousPercent = percent;
  }
  return { groups, last7: heatmap.slice(-7), heatmap };
}
