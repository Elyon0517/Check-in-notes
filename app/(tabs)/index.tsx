import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { normalizeProgress } from '@/src/services/bulletService';
import type { Bullet } from '@/src/types/models';
import { useHomeStore } from '@/src/stores/homeStore';

function typeLabel(t: Bullet['type']) {
  if (t === 'daily') return '每日';
  if (t === 'weekly') return '每周';
  return '一次';
}
function priorityColor(p: Bullet['priority'], tint: string) {
  if (p === 'high') return '#e05';
  if (p === 'medium') return tint;
  return '#888';
}

function BulletCard({
  item,
  done,
  c,
  theme,
  onTap,
}: {
  item: Bullet;
  done: boolean;
  c: (typeof Colors)['light'];
  theme: 'light' | 'dark';
  onTap: () => void;
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
        onPress={onTap}
        disabled={done}
        style={({ pressed }) => [styles.cardBody, { opacity: pressed ? 0.7 : 1 }]}>
        <View style={styles.cardLeft}>
          <View style={[
            styles.checkCircle,
            {
              borderColor: done ? c.tint : theme === 'dark' ? '#555' : '#ccc',
              backgroundColor: done ? c.tint : 'transparent',
            },
          ]}>
            {done && <FontAwesome name="check" size={10} color="#fff" />}
          </View>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.row}>
            <Text
              style={[
                styles.title,
                { color: done ? (theme === 'dark' ? '#666' : '#aaa') : c.text },
                done && styles.strikethrough,
              ]}
              numberOfLines={1}>
              {item.title}
            </Text>
            <View style={[styles.typeBadge, { borderColor: priorityColor(item.priority, c.tint) }]}>
              <Text style={[styles.typeBadgeText, { color: priorityColor(item.priority, c.tint) }]}>
                {typeLabel(item.type)}
              </Text>
            </View>
          </View>
          {item.description ? (
            <Text
              style={[styles.desc, { color: done ? (theme === 'dark' ? '#555' : '#bbb') : (theme === 'dark' ? '#aaa' : '#666') }]}
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

export default function HomeScreen() {
  const theme = useColorScheme() ?? 'light';
  const c = Colors[theme];
  const loading = useHomeStore((s) => s.loading);
  const active = useHomeStore((s) => s.active);
  const completedToday = useHomeStore((s) => s.completedToday);
  const today = useHomeStore((s) => s.today);
  const progress = useHomeStore((s) => s.progress);
  const refresh = useHomeStore((s) => s.refresh);
  const completeBullet = useHomeStore((s) => s.completeBullet);
  const quickAdd = useHomeStore((s) => s.quickAdd);
  const [quick, setQuick] = useState('');
  const [adding, setAdding] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const handleQuickAdd = async () => {
    if (!quick.trim() || adding) return;
    setAdding(true);
    try {
      await quickAdd(quick);
      setQuick('');
    } finally {
      setAdding(false);
    }
  };

  const pct = normalizeProgress(progress.done, progress.total) * 100;

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={styles.listPad} keyboardShouldPersistTaps="handled">

        {/* Date + progress */}
        <Text style={[styles.dateLine, { color: theme === 'dark' ? '#666' : '#999' }]}>{today}</Text>
        <View style={[styles.progressWrap, { backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f5f5f5' }]}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressLabel, { color: c.text }]}>今日进度</Text>
            <Text style={[styles.progressFraction, { color: c.tint }]}>
              {progress.total === 0 ? '—' : `${progress.done} / ${progress.total}`}
            </Text>
          </View>
          <View style={[styles.barBg, { backgroundColor: theme === 'dark' ? '#2a2a2a' : '#ddd' }]}>
            <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: c.tint }]} />
          </View>
        </View>

        {/* Quick add */}
        <View style={[styles.quickRow, { borderColor: theme === 'dark' ? '#333' : '#e0e0e0', backgroundColor: c.background }]}>
          <FontAwesome name="plus" size={14} color={theme === 'dark' ? '#555' : '#bbb'} style={{ marginLeft: 12 }} />
          <TextInput
            style={[styles.quickInput, { color: c.text }]}
            placeholder="快速添加每日子弹…"
            placeholderTextColor={theme === 'dark' ? '#555' : '#bbb'}
            value={quick}
            onChangeText={setQuick}
            onSubmitEditing={() => void handleQuickAdd()}
            returnKeyType="done"
          />
          {quick.trim().length > 0 && (
            <Pressable
              style={[styles.addBtn, { backgroundColor: c.tint }]}
              onPress={() => void handleQuickAdd()}
              disabled={adding}>
              <Text style={styles.addBtnText}>{adding ? '…' : '添加'}</Text>
            </Pressable>
          )}
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 32 }} color={c.tint} />
        ) : (
          <>
            {/* Active bullets */}
            <View style={styles.sectionRow}>
              <Text style={[styles.section, { color: c.text }]}>待完成</Text>
              <Text style={[styles.sectionCount, { color: theme === 'dark' ? '#555' : '#bbb' }]}>
                {active.length}
              </Text>
            </View>
            {active.length === 0 ? (
              <View style={[styles.emptyCard, { borderColor: theme === 'dark' ? '#222' : '#f0f0f0', backgroundColor: theme === 'dark' ? '#111' : '#fafafa' }]}>
                <Text style={[styles.emptyTitle, { color: c.text }]}>今日全部完成 🎉</Text>
                <Text style={[styles.emptyDesc, { color: theme === 'dark' ? '#555' : '#bbb' }]}>
                  点右上角 + 可新建子弹
                </Text>
              </View>
            ) : (
              active.map((item) => (
                <BulletCard
                  key={item.id}
                  item={item}
                  done={false}
                  c={c}
                  theme={theme}
                  onTap={() => void completeBullet(item)}
                />
              ))
            )}

            {/* Completed today */}
            {completedToday.length > 0 && (
              <>
                <View style={[styles.sectionRow, { marginTop: 20 }]}>
                  <Text style={[styles.section, { color: theme === 'dark' ? '#555' : '#aaa' }]}>今日已完成</Text>
                  <Text style={[styles.sectionCount, { color: theme === 'dark' ? '#444' : '#ccc' }]}>
                    {completedToday.length}
                  </Text>
                </View>
                {completedToday.map((item) => (
                  <BulletCard
                    key={item.id}
                    item={item}
                    done
                    c={c}
                    theme={theme}
                    onTap={() => {}}
                  />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  listPad: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 40 },
  dateLine: { fontSize: 13, marginBottom: 10 },

  progressWrap: { borderRadius: 12, padding: 14, marginBottom: 14 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressLabel: { fontSize: 15, fontWeight: '600' },
  progressFraction: { fontSize: 15, fontWeight: '700' },
  barBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },

  quickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 46,
  },
  quickInput: { flex: 1, paddingHorizontal: 10, paddingVertical: 11, fontSize: 15 },
  addBtn: { paddingHorizontal: 16, paddingVertical: 11 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  section: { fontSize: 16, fontWeight: '700' },
  sectionCount: { fontSize: 14, fontWeight: '500' },

  emptyCard: { borderWidth: 1, borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  emptyDesc: { fontSize: 13 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 8,
    paddingRight: 8,
    overflow: 'hidden',
  },
  cardBody: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 12 },
  cardLeft: { marginRight: 12 },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontSize: 15, fontWeight: '600' },
  strikethrough: { textDecorationLine: 'line-through' },
  typeBadge: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  typeBadgeText: { fontSize: 11, fontWeight: '500' },
  desc: { marginTop: 3, fontSize: 13 },
  editBtn: { padding: 10 },
});
