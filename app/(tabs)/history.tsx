import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppBackground } from '@/components/AppBackground';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { categoryLabel, useI18n } from '@/src/i18n';
import type { DailyCompletionStat } from '@/src/services/bulletService';
import { useHistoryStore } from '@/src/stores/historyStore';
import type { AppLanguage } from '@/src/types/models';
import { getCategoryMeta } from '@/src/utils/category';

export default function HistoryScreen() {
  const theme = useColorScheme() ?? 'light';
  const c = Colors[theme];
  const { language, t } = useI18n();
  const loading = useHistoryStore((s) => s.loading);
  const groups = useHistoryStore((s) => s.groups);
  const last7 = useHistoryStore((s) => s.last7);
  const heatmap = useHistoryStore((s) => s.heatmap);
  const refresh = useHistoryStore((s) => s.refresh);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const sub = theme === 'dark' ? '#6b7280' : '#94a3b8';
  const cardBg = theme === 'dark' ? '#111827' : '#fff';
  const border = theme === 'dark' ? '#1f2937' : '#e5e7eb';
  const latest = last7[last7.length - 1];

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <AppBackground dark={theme === 'dark'} />
      <ScrollView contentContainerStyle={styles.pad}>
        <View style={[styles.heroCard, { backgroundColor: cardBg, borderColor: border }]}>
          <Text style={[styles.kicker, { color: sub }]}>{t('completionRate')}</Text>
          <View style={styles.heroRow}>
            <Text style={[styles.heroPercent, { color: c.text }]}>
              {latest ? `${Math.round(latest.percent * 100)}%` : '0%'}
            </Text>
            <DeltaPill stat={latest} />
          </View>
          <Text style={[styles.heroSub, { color: sub }]}>
            {t('todayCount')} {latest?.completed ?? 0} / {latest?.planned ?? 0}, {t('plannedHint')}
          </Text>
        </View>

        <Text style={[styles.heading, { color: c.text }]}>{t('recent7Change')}</Text>
        <View style={styles.statsRow}>
          {last7.map((d) => (
            <View key={d.date} style={[styles.statChip, { borderColor: border, backgroundColor: cardBg }]}>
              <Text style={[styles.statDate, { color: sub }]}>{d.date.slice(5)}</Text>
              <Text style={[styles.statCount, { color: c.text }]}>{Math.round(d.percent * 100)}%</Text>
              <Text style={[styles.deltaText, { color: d.delta >= 0 ? '#16A34A' : '#DC2626' }]}>
                {d.delta >= 0 ? '+' : ''}{Math.round(d.delta * 100)}%
              </Text>
            </View>
          ))}
        </View>

        <Text style={[styles.heading, { color: c.text, marginTop: 24 }]}>{t('heatmap')}</Text>
        <Heatmap
          data={heatmap}
          emptyColor={theme === 'dark' ? '#1f2937' : '#f1f5f9'}
          language={language}
          labelColor={sub}
        />
        <View style={styles.legend}>
          <Text style={[styles.legendText, { color: sub }]}>{t('low')}</Text>
          {[0.2, 0.45, 0.7, 1].map((p) => (
            <View key={p} style={[styles.legendCell, { backgroundColor: heatColor(p) }]} />
          ))}
          <Text style={[styles.legendText, { color: sub }]}>{t('high')}</Text>
        </View>

        <Text style={[styles.heading, { color: c.text, marginTop: 24 }]}>{t('recordsByDay')}</Text>
        {loading ? (
          <ActivityIndicator color={c.tint} style={{ marginTop: 16 }} />
        ) : groups.length === 0 ? (
          <View style={[styles.emptyCard, { borderColor: border, backgroundColor: cardBg }]}>
            <Text style={[styles.empty, { color: sub }]}>{t('noHistory')}</Text>
          </View>
        ) : (
          groups.map((g) => (
            <View key={g.date} style={[styles.dayGroup, { borderColor: border, backgroundColor: cardBg }]}>
              <Text style={[styles.dateTitle, { color: c.text }]}>{g.date}</Text>
              {g.items.map((it) => {
                const category = getCategoryMeta(it.category);
                return (
                  <View key={`${it.bulletId}-${it.completedAt}`} style={styles.historyLine}>
                    <View style={[styles.dot, { backgroundColor: category.color }]} />
                    <Text style={[styles.line, { color: c.text }]} numberOfLines={1}>
                      {it.bulletTitle}
                    </Text>
                    <Text style={[styles.category, { color: category.color }]}>{categoryLabel(it.category, language)}</Text>
                  </View>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function DeltaPill({ stat }: { stat?: DailyCompletionStat }) {
  const delta = stat?.delta ?? 0;
  const positive = delta >= 0;
  return (
    <View style={[styles.deltaPill, { backgroundColor: positive ? '#16A34A18' : '#DC262618' }]}>
      <Text style={[styles.deltaPillText, { color: positive ? '#16A34A' : '#DC2626' }]}>
        {positive ? '+' : ''}{Math.round(delta * 100)}%
      </Text>
    </View>
  );
}

function heatColor(percent: number) {
  if (percent <= 0) return '#EEF2F7';
  if (percent < 0.25) return '#BBF7D0';
  if (percent < 0.5) return '#86EFAC';
  if (percent < 0.75) return '#22C55E';
  return '#15803D';
}

function monthLabel(date: string, language: AppLanguage) {
  const d = new Date(`${date}T12:00:00`);
  if (language === 'zh') return `${d.getMonth() + 1}月`;
  return d.toLocaleString('en-US', { month: 'short' });
}

function shouldShowMonthLabel(week: DailyCompletionStat[], previousWeek?: DailyCompletionStat[]) {
  const first = week[0];
  if (!first) return false;
  if (!previousWeek?.[0]) return true;
  const currentMonth = new Date(`${first.date}T12:00:00`).getMonth();
  const previousMonth = new Date(`${previousWeek[0].date}T12:00:00`).getMonth();
  return currentMonth !== previousMonth;
}

function Heatmap({
  data,
  emptyColor,
  language,
  labelColor,
}: {
  data: DailyCompletionStat[];
  emptyColor: string;
  language: AppLanguage;
  labelColor: string;
}) {
  const weeks: DailyCompletionStat[][] = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View>
        <View style={styles.heatmap}>
          {weeks.map((week, weekIndex) => (
            <View key={`week-${weekIndex}`} style={styles.heatWeek}>
              {week.map((day) => (
                <View
                  key={day.date}
                  style={[
                    styles.heatCell,
                    { backgroundColor: day.planned === 0 ? emptyColor : heatColor(day.percent) },
                  ]}
                />
              ))}
            </View>
          ))}
        </View>
        <View style={styles.monthRow}>
          {weeks.map((week, weekIndex) => (
            <View key={`month-${weekIndex}`} style={styles.monthSlot}>
              {shouldShowMonthLabel(week, weeks[weekIndex - 1]) ? (
                <Text style={[styles.monthText, { color: labelColor }]}>
                  {monthLabel(week[0].date, language)}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  pad: { padding: 16, paddingBottom: 48 },
  heroCard: { borderWidth: 1, borderRadius: 18, padding: 18, marginBottom: 22 },
  kicker: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  heroPercent: { fontSize: 44, fontWeight: '900', letterSpacing: -1.5 },
  heroSub: { fontSize: 13, marginTop: 4 },
  deltaPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  deltaPillText: { fontSize: 13, fontWeight: '800' },
  heading: { fontSize: 17, fontWeight: '800', marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  statChip: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    minWidth: 68,
    alignItems: 'center',
  },
  statDate: { fontSize: 11 },
  statCount: { fontSize: 18, fontWeight: '800' },
  deltaText: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  heatmap: { flexDirection: 'row', gap: 4, paddingVertical: 4 },
  heatWeek: { gap: 4 },
  heatCell: { width: 12, height: 12, borderRadius: 3 },
  monthRow: { flexDirection: 'row', gap: 4, marginTop: 8 },
  monthSlot: { width: 12 },
  monthText: { fontSize: 11, fontWeight: '700', width: 40 },
  legend: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 5, marginTop: 8 },
  legendCell: { width: 10, height: 10, borderRadius: 2 },
  legendText: { fontSize: 11 },
  emptyCard: { borderWidth: 1, borderRadius: 14, padding: 20, alignItems: 'center' },
  empty: { fontSize: 15 },
  dayGroup: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 12 },
  dateTitle: { fontSize: 15, fontWeight: '800', marginBottom: 10 },
  historyLine: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  line: { flex: 1, fontSize: 15 },
  category: { fontSize: 12, fontWeight: '700' },
});
