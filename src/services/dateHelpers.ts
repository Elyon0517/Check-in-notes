import {
  addDays,
  format,
  parse,
  startOfDay,
  startOfWeek,
  subDays,
} from 'date-fns';
import type { WeekdayIndex } from '@/src/types/models';

export function localDateString(d: Date = new Date()): string {
  return format(d, 'yyyy-MM-dd');
}

export function parseTimeToToday(timeHHmm: string): Date {
  const base = startOfDay(new Date());
  return parse(timeHHmm, 'HH:mm', base);
}

/** `weekStartsOn` for date-fns: 0 Sun … 6 Sat */
export function weekStartForDate(date: Date, weekStartsOn: WeekdayIndex): Date {
  return startOfWeek(date, { weekStartsOn });
}

export function weekAnchorString(date: Date, weekStartsOn: WeekdayIndex): string {
  return format(weekStartForDate(date, weekStartsOn), 'yyyy-MM-dd');
}

export function lastNDates(n: number, from: Date = new Date()): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    out.push(localDateString(subDays(from, i)));
  }
  return out;
}

export function addDaysToDateString(dateStr: string, days: number): string {
  return localDateString(addDays(parse(dateStr, 'yyyy-MM-dd', new Date()), days));
}

/** Expo weekly trigger: 1 = Sunday … 7 = Saturday */
export function jsWeekdayToExpo(weekday0Sun: number): number {
  return weekday0Sun + 1;
}
