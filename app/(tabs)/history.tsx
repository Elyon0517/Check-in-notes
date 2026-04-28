import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useHistoryStore } from '@/src/stores/historyStore';

export default function HistoryScreen() {
  const theme = useColorScheme() ?? 'light';
  const c = Colors[theme];
  const loading = useHistoryStore((s) => s.loading);
  const groups = useHistoryStore((s) => s.groups);
  const last7 = useHistoryStore((s) => s.last7);
  const refresh = useHistoryStore((s) => s.refresh);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return (
    <ScrollView style={[styles.root, { backgroundColor: c.background }]} contentContainerStyle={styles.pad}>
      <Text style={[styles.heading, { color: c.text }]}>最近 7 天完成次数</Text>
      <View style={[styles.statsRow, { flexWrap: 'wrap' }]}>
        {last7.map((d) => (
          <View key={d.date} style={[styles.statChip, { borderColor: theme === 'dark' ? '#444' : '#ddd' }]}>
            <Text style={[styles.statDate, { color: theme === 'dark' ? '#aaa' : '#666' }]}>{d.date.slice(5)}</Text>
            <Text style={[styles.statCount, { color: c.text }]}>{d.count}</Text>
          </View>
        ))}
      </View>

      <Text style={[styles.heading, { color: c.text, marginTop: 24 }]}>按日记录</Text>
      {loading ? (
        <ActivityIndicator color={c.tint} style={{ marginTop: 16 }} />
      ) : groups.length === 0 ? (
        <Text style={[styles.empty, { color: theme === 'dark' ? '#666' : '#999' }]}>暂无完成记录</Text>
      ) : (
        groups.map((g) => (
          <View key={g.date} style={{ marginBottom: 20 }}>
            <Text style={[styles.dateTitle, { color: c.tint }]}>{g.date}</Text>
            {g.items.map((it) => (
              <Text key={`${it.bulletId}-${it.completedAt}`} style={[styles.line, { color: c.text }]}>
                · {it.bulletTitle}
              </Text>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  pad: { padding: 16, paddingBottom: 40 },
  heading: { fontSize: 17, fontWeight: '600', marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statChip: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    minWidth: 64,
    alignItems: 'center',
  },
  statDate: { fontSize: 11 },
  statCount: { fontSize: 18, fontWeight: '700' },
  empty: { fontSize: 15, marginTop: 8 },
  dateTitle: { fontSize: 15, fontWeight: '600', marginBottom: 6 },
  line: { fontSize: 15, marginBottom: 4 },
});
