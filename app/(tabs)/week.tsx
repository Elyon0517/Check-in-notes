import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import type { Bullet } from '@/src/types/models';
import { useWeekStore } from '@/src/stores/weekStore';

export default function WeekScreen() {
  const theme = useColorScheme() ?? 'light';
  const c = Colors[theme];
  const loading = useWeekStore((s) => s.loading);
  const bullets = useWeekStore((s) => s.bullets);
  const completedIds = useWeekStore((s) => s.completedIds);
  const weekAnchor = useWeekStore((s) => s.weekAnchor);
  const refresh = useWeekStore((s) => s.refresh);
  const completeBullet = useWeekStore((s) => s.completeBullet);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const done = bullets.filter((b) => completedIds.has(b.id)).length;
  const total = bullets.length;
  const pct = total === 0 ? 0 : (done / total) * 100;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: c.background }]}
      contentContainerStyle={styles.pad}>

      {/* Week progress card */}
      <View style={[styles.summaryCard, { backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f5f5f5' }]}>
        <View style={styles.summaryHeader}>
          <View>
            <Text style={[styles.summaryTitle, { color: c.text }]}>本周进度</Text>
            <Text style={[styles.weekLabel, { color: theme === 'dark' ? '#666' : '#999' }]}>
              起始日 {weekAnchor}
            </Text>
          </View>
          <Text style={[styles.summaryFrac, { color: c.tint }]}>
            {total === 0 ? '—' : `${done} / ${total}`}
          </Text>
        </View>
        <View style={[styles.barBg, { backgroundColor: theme === 'dark' ? '#2a2a2a' : '#ddd' }]}>
          <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: c.tint }]} />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={c.tint} style={{ marginTop: 32 }} />
      ) : bullets.length === 0 ? (
        <View style={[styles.emptyCard, { borderColor: theme === 'dark' ? '#222' : '#f0f0f0', backgroundColor: theme === 'dark' ? '#111' : '#fafafa' }]}>
          <FontAwesome name="calendar-o" size={28} color={theme === 'dark' ? '#444' : '#ccc'} style={{ marginBottom: 10 }} />
          <Text style={[styles.emptyTitle, { color: c.text }]}>还没有每周子弹</Text>
          <Text style={[styles.emptyDesc, { color: theme === 'dark' ? '#555' : '#bbb' }]}>
            在「今日」页右上角 + 新建，类型选「每周」
          </Text>
        </View>
      ) : (
        <>
          <Text style={[styles.listLabel, { color: theme === 'dark' ? '#666' : '#aaa' }]}>本周子弹</Text>
          {bullets.map((item) => (
            <WeekRow
              key={item.id}
              item={item}
              done={completedIds.has(item.id)}
              c={c}
              theme={theme}
              onComplete={() => void completeBullet(item)}
            />
          ))}
        </>
      )}
    </ScrollView>
  );
}

function WeekRow({
  item,
  done,
  c,
  theme,
  onComplete,
}: {
  item: Bullet;
  done: boolean;
  c: (typeof Colors)['light'] | (typeof Colors)['dark'];
  theme: 'light' | 'dark';
  onComplete: () => void;
}) {
  const cardBg = done
    ? theme === 'dark' ? '#1a1a1a' : '#fafafa'
    : c.background;
  const borderColor = done
    ? theme === 'dark' ? '#2a2a2a' : '#ececec'
    : theme === 'dark' ? '#333' : '#e0e0e0';

  return (
    <View style={[styles.card, { borderColor, backgroundColor: cardBg }]}>
      <Pressable
        onPress={onComplete}
        disabled={done}
        style={({ pressed }) => [styles.cardBody, { opacity: pressed ? 0.7 : 1 }]}>
        {/* Checkmark circle */}
        <View style={[
          styles.checkCircle,
          {
            borderColor: done ? c.tint : theme === 'dark' ? '#555' : '#ccc',
            backgroundColor: done ? c.tint : 'transparent',
          },
        ]}>
          {done && <FontAwesome name="check" size={10} color="#fff" />}
        </View>

        <View style={styles.textBlock}>
          <Text
            style={[
              styles.cardTitle,
              { color: done ? (theme === 'dark' ? '#555' : '#aaa') : c.text },
              done && styles.strikethrough,
            ]}
            numberOfLines={1}>
            {item.title}
          </Text>
          {item.description ? (
            <Text
              style={[styles.cardDesc, { color: theme === 'dark' ? '#666' : '#aaa' }]}
              numberOfLines={1}>
              {item.description}
            </Text>
          ) : null}
        </View>
      </Pressable>
      <Link href={`/bullet/${item.id}`} asChild>
        <Pressable style={styles.editBtn}>
          <FontAwesome name="pencil" size={13} color={theme === 'dark' ? '#555' : '#bbb'} />
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  pad: { padding: 16, paddingBottom: 40 },

  summaryCard: { borderRadius: 12, padding: 14, marginBottom: 20 },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  summaryTitle: { fontSize: 16, fontWeight: '700' },
  weekLabel: { fontSize: 12, marginTop: 2 },
  summaryFrac: { fontSize: 18, fontWeight: '800' },
  barBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },

  emptyCard: { borderWidth: 1, borderRadius: 12, padding: 28, alignItems: 'center', marginTop: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
  emptyDesc: { fontSize: 13, textAlign: 'center' },

  listLabel: { fontSize: 13, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 8,
    paddingRight: 4,
    overflow: 'hidden',
  },
  cardBody: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600' },
  strikethrough: { textDecorationLine: 'line-through' },
  cardDesc: { fontSize: 13, marginTop: 2 },
  editBtn: { padding: 12 },
});
