import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { Platform } from 'react-native';

import * as bulletRepo from '@/src/repositories/bulletRepository';
import * as settingsRepo from '@/src/repositories/settingsRepository';
import { jsWeekdayToExpo } from '@/src/services/dateHelpers';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function parseHm(s: string): { hour: number; minute: number } {
  const [h, m] = s.split(':').map((x) => parseInt(x, 10));
  return { hour: Number.isFinite(h) ? h : 20, minute: Number.isFinite(m) ? m : 0 };
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function syncScheduledNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  const settings = await settingsRepo.getSettings();
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!settings.notifications_enabled) return;

  const granted = await ensureNotificationPermission();
  if (!granted) return;

  const eod = parseHm(settings.eod_reminder_time);
  const isZh = settings.language === 'zh';
  await Notifications.scheduleNotificationAsync({
    identifier: 'eod-wrap',
    content: {
      title: isZh ? '今日回顾' : 'Daily Review',
      body: isZh ? '看看今天的小恶魔清除了吗？' : 'Check whether today’s devils are cleared.',
    },
    trigger: {
      type: SchedulableTriggerInputTypes.DAILY,
      hour: eod.hour,
      minute: eod.minute,
    },
  });

  const bullets = await bulletRepo.listActiveBullets();
  for (const b of bullets) {
    if (!b.reminder_enabled) continue;
    const t = parseHm(b.reminder_time);
    if (b.type === 'daily' || b.type === 'one_time') {
      await Notifications.scheduleNotificationAsync({
        identifier: `bullet-${b.id}`,
        content: { title: b.title, body: isZh ? '该清除这个小恶魔了' : 'Time to clear this devil.' },
        trigger: {
          type: SchedulableTriggerInputTypes.DAILY,
          hour: t.hour,
          minute: t.minute,
        },
      });
    } else if (b.type === 'weekly') {
      await Notifications.scheduleNotificationAsync({
        identifier: `bullet-${b.id}`,
        content: { title: b.title, body: isZh ? '本周的这个小恶魔该清除了' : 'Time to clear this weekly devil.' },
        trigger: {
          type: SchedulableTriggerInputTypes.WEEKLY,
          weekday: jsWeekdayToExpo(b.weekly_day),
          hour: t.hour,
          minute: t.minute,
        },
      });
    }

    if (b.eod_reminder_enabled) {
      await Notifications.scheduleNotificationAsync({
        identifier: `bullet-eod-${b.id}`,
        content: { title: b.title, body: isZh ? '今日结束前记得清除' : 'Clear this before the day ends.' },
        trigger: {
          type: SchedulableTriggerInputTypes.DAILY,
          hour: eod.hour,
          minute: eod.minute,
        },
      });
    }
  }
}
