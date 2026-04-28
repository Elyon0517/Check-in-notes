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

import { AnimatedProgressBar } from '@/components/AnimatedProgressBar';
import { AppBackground } from '@/components/AppBackground';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { categoryLabel, useI18n } from '@/src/i18n';
import type { Bullet } from '@/src/types/models';
import { useWeekStore } from '@/src/stores/weekStore';
import { getCategoryMeta } from '@/src/utils/category';

export default function WeekScreen() {
  const theme = useColorScheme() ?? 'light';
  const c = Colors[theme];
  const { t } = useI18n();
  const loading = useWeekStore((s) => s.loading);
  const bullets = useWeekStore((s) => s.bullets);
  const completedIds = useWeekStore((s) => s.completedIds);
  const weekAnchor = useWeekStore((s) => s.weekAnchor);
  const refresh = useWeekStore((s) => s.refresh);
  const completeBullet = useWeekStore((s) => s.completeBullet);
  const undoBullet = useWeekStore((s) => s.undoBullet);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const done = bullets.filter((b) => completedIds.has(b.id)).length;
  const total = bullets.length;
  const pct = total === 0 ? 0 : (done / total) * 100;

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <AppBackground dark={theme === 'dark'} />
      <ScrollView contentContainerStyle={styles.pad}>

      {/* Week progress card */}
      <View style={[styles.summaryCard, { backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f5f5f5' }]}>
        <View style={styles.summaryHeader}>
          <View>
            <Text style={[styles.summaryTitle, { color: c.text }]}>{t('weekProgress')}</Text>
            <Text style={[styles.weekLabel, { color: theme === 'dark' ? '#666' : '#999' }]}>
              {t('weekStart')} {weekAnchor}
            </Text>
          </View>
          <Text style={[styles.summaryFrac, { color: c.tint }]}>
            {total === 0 ? '—' : `${done} / ${total}`}
          </Text>
        </View>
        <AnimatedProgressBar
          percent={pct / 100}
          color={c.tint}
          trackColor={theme === 'dark' ? '#2a2a2a' : '#ddd'}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={c.tint} style={{ marginTop: 32 }} />
      ) : bullets.length === 0 ? (
        <View style={[styles.emptyCard, { borderColor: theme === 'dark' ? '#222' : '#f0f0f0', backgroundColor: theme === 'dark' ? '#111' : '#fafafa' }]}>
          <FontAwesome name="calendar-o" size={28} color={theme === 'dark' ? '#444' : '#ccc'} style={{ marginBottom: 10 }} />
          <Text style={[styles.emptyTitle, { color: c.text }]}>{t('noWeekly')}</Text>
          <Text style={[styles.emptyDesc, { color: theme === 'dark' ? '#555' : '#bbb' }]}>
            {t('noWeeklySub')}
          </Text>
        </View>
      ) : (
        <>
          <Text style={[styles.listLabel, { color: theme === 'dark' ? '#666' : '#aaa' }]}>{t('weeklyDevils')}</Text>
          {bullets.map((item) => (
            <WeekRow
              key={item.id}
              item={item}
              done={completedIds.has(item.id)}
              c={c}
              theme={theme}
              onComplete={() => void completeBullet(item)}
              onUndo={() => void undoBullet(item)}
            />
          ))}
        </>
      )}
      </ScrollView>
    </View>
  );
}

function WeekRow({
  item,
  done,
  c,
  theme,
  onComplete,
  onUndo,
}: {
  item: Bullet;
  done: boolean;
  c: (typeof Colors)['light'] | (typeof Colors)['dark'];
  theme: 'light' | 'dark';
  onComplete: () => void;
  onUndo: () => void;
}) {
  const category = getCategoryMeta(item.category);
  const { language, t } = useI18n();
  const cardBg = done
    ? theme === 'dark' ? '#1a1a1a' : '#fafafa'
    : c.background;
  const borderColor = done
    ? theme === 'dark' ? '#2a2a2a' : '#ececec'
    : theme === 'dark' ? '#333' : '#e0e0e0';

  return (
    <View style={[styles.card, { borderColor, backgroundColor: cardBg }]}>
      <Pressable
        onPress={done ? onUndo : onComplete}
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
          <View style={styles.metaRow}>
            <View style={[styles.categoryPill, { backgroundColor: `${category.color}18` }]}>
              <Text style={[styles.categoryText, { color: category.color }]}>{categoryLabel(item.category, language)}</Text>
            </View>
            {done && (
              <Pressable onPress={onUndo} hitSlop={8}>
                <Text style={[styles.undoText, { color: c.tint }]}>{t('undo')}</Text>
              </Pressable>
            )}
          </View>
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
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 5 },
  categoryPill: { alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  categoryText: { fontSize: 11, fontWeight: '700' },
  undoText: { fontSize: 12, fontWeight: '700' },
  cardDesc: { fontSize: 13, marginTop: 2 },
  editBtn: { padding: 12 },
});
