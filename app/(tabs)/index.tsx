import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Animated,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AnimatedProgressBar } from '@/components/AnimatedProgressBar';
import { AppBackground } from '@/components/AppBackground';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { categoryLabel, typeLabel, useI18n } from '@/src/i18n';
import { normalizeProgress } from '@/src/services/bulletService';
import type { Bullet } from '@/src/types/models';
import { useHomeStore } from '@/src/stores/homeStore';
import { getCategoryMeta } from '@/src/utils/category';

function priorityColor(p: Bullet['priority'], tint: string) {
  if (p === 'high') return '#e05';
  if (p === 'medium') return tint;
  return '#888';
}

function BulletCard({
  item,
  done,
  skipped,
  c,
  theme,
  onTap,
  onUndo,
  onSkip,
  onUnskip,
  dragHandleProps,
}: {
  item: Bullet;
  done: boolean;
  skipped?: boolean;
  c: (typeof Colors)['light'] | (typeof Colors)['dark'];
  theme: 'light' | 'dark';
  onTap: () => void;
  onUndo: () => void;
  onSkip?: () => void;
  onUnskip?: () => void;
  dragHandleProps?: object;
}) {
  const category = getCategoryMeta(item.category);
  const { language, t } = useI18n();
  const muted = done || skipped;
  const cardBg = muted
    ? theme === 'dark' ? '#1a1a1a' : '#fafafa'
    : c.background;
  const borderColor = muted
    ? theme === 'dark' ? '#2a2a2a' : '#ececec'
    : theme === 'dark' ? '#333' : '#e0e0e0';

  const titleColor = muted
    ? (theme === 'dark' ? '#666' : '#aaa')
    : c.text;

  return (
    <View style={[styles.card, { borderColor, backgroundColor: cardBg }]}>
      {dragHandleProps && (
        <View style={styles.dragHandle} {...dragHandleProps}>
          <FontAwesome name="bars" size={14} color={theme === 'dark' ? '#444' : '#ccc'} />
        </View>
      )}
      <Pressable
        onPress={done ? onUndo : (skipped ? undefined : onTap)}
        style={({ pressed }) => [styles.cardBody, { opacity: pressed ? 0.7 : 1 }]}>
        <View style={styles.cardLeft}>
          <View style={[
            styles.checkCircle,
            {
              borderColor: done ? c.tint : (skipped ? (theme === 'dark' ? '#444' : '#ddd') : (theme === 'dark' ? '#555' : '#ccc')),
              backgroundColor: done ? c.tint : 'transparent',
            },
          ]}>
            {done && <FontAwesome name="check" size={10} color="#fff" />}
            {skipped && <FontAwesome name="forward" size={9} color={theme === 'dark' ? '#555' : '#bbb'} />}
          </View>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.row}>
            <Text
              style={[
                styles.title,
                { color: titleColor },
                done && styles.strikethrough,
              ]}
              numberOfLines={1}>
              {item.title}
            </Text>
            <View style={[styles.typeBadge, { borderColor: priorityColor(item.priority, c.tint) }]}>
              <Text style={[styles.typeBadgeText, { color: priorityColor(item.priority, c.tint) }]}>
                {typeLabel(item.type, language)}
              </Text>
            </View>
          </View>
          <View style={styles.metaRow}>
            <View style={[styles.categoryPill, { backgroundColor: `${category.color}18` }]}>
              <Text style={[styles.categoryText, { color: category.color }]}>{categoryLabel(item.category, language)}</Text>
            </View>
            {done && (
              <Pressable onPress={onUndo} hitSlop={8}>
                <Text style={[styles.undoText, { color: c.tint }]}>{t('undo')}</Text>
              </Pressable>
            )}
            {skipped && onUnskip && (
              <Pressable onPress={onUnskip} hitSlop={8}>
                <Text style={[styles.undoText, { color: c.tint }]}>{t('undo')}</Text>
              </Pressable>
            )}
            {!done && !skipped && onSkip && (item.type === 'daily' || item.type === 'weekly') && (
              <Pressable onPress={onSkip} hitSlop={8}>
                <Text style={[styles.skipText, { color: theme === 'dark' ? '#555' : '#bbb' }]}>{t('skipOnce')}</Text>
              </Pressable>
            )}
          </View>
          {item.description ? (
            <Text
              style={[styles.desc, { color: muted ? (theme === 'dark' ? '#555' : '#bbb') : (theme === 'dark' ? '#aaa' : '#666') }]}
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

const ITEM_HEIGHT_FALLBACK = 76;

function DraggableActiveList({
  items,
  onReorder,
  renderItem,
  onDragStateChange,
}: {
  items: Bullet[];
  onReorder: (orderedIds: string[]) => void;
  renderItem: (item: Bullet, dragHandleProps: object) => ReactNode;
  onDragStateChange: (dragging: boolean) => void;
}) {
  const listRef = useRef<Bullet[]>(items);
  const [list, setListRaw] = useState<Bullet[]>(items);

  const prevItemsRef = useRef(items);
  if (prevItemsRef.current !== items) {
    prevItemsRef.current = items;
    listRef.current = items;
    setListRaw(items);
  }

  const dragIndexRef = useRef<number | null>(null);
  const hoverIndexRef = useRef<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const dragY = useRef(new Animated.Value(0)).current;
  const onReorderRef = useRef(onReorder);
  onReorderRef.current = onReorder;
  const onDragStateChangeRef = useRef(onDragStateChange);
  onDragStateChangeRef.current = onDragStateChange;
  const itemHeightsRef = useRef<Map<string, number>>(new Map());

  const avgItemHeight = () => {
    const heights = Array.from(itemHeightsRef.current.values());
    if (heights.length === 0) return ITEM_HEIGHT_FALLBACK;
    return heights.reduce((s, h) => s + h, 0) / heights.length;
  };

  const panRespondersRef = useRef<Map<string, ReturnType<typeof PanResponder.create>>>(new Map());

  const createPanResponder = (itemId: string) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        const idx = listRef.current.findIndex((i) => i.id === itemId);
        dragY.setValue(0);
        dragIndexRef.current = idx;
        hoverIndexRef.current = idx;
        setDragIndex(idx);
        setHoverIndex(idx);
        onDragStateChangeRef.current(true);
      },
      onPanResponderMove: (_, gs) => {
        dragY.setValue(gs.dy);
        const idx = dragIndexRef.current ?? 0;
        const h = avgItemHeight();
        const newHover = Math.max(0, Math.min(listRef.current.length - 1, idx + Math.round(gs.dy / h)));
        if (newHover !== hoverIndexRef.current) {
          hoverIndexRef.current = newHover;
          setHoverIndex(newHover);
        }
      },
      onPanResponderRelease: (_, gs) => {
        const idx = dragIndexRef.current ?? 0;
        const h = avgItemHeight();
        const newIndex = Math.max(0, Math.min(listRef.current.length - 1, idx + Math.round(gs.dy / h)));
        dragY.setValue(0);
        dragIndexRef.current = null;
        hoverIndexRef.current = null;
        setDragIndex(null);
        setHoverIndex(null);
        onDragStateChangeRef.current(false);
        if (newIndex !== idx) {
          const newList = [...listRef.current];
          const [moved] = newList.splice(idx, 1);
          newList.splice(newIndex, 0, moved);
          listRef.current = newList;
          setListRaw(newList);
          onReorderRef.current(newList.map((i) => i.id));
        }
      },
      onPanResponderTerminate: () => {
        dragY.setValue(0);
        dragIndexRef.current = null;
        hoverIndexRef.current = null;
        setDragIndex(null);
        setHoverIndex(null);
        onDragStateChangeRef.current(false);
      },
    });

  for (const item of list) {
    if (!panRespondersRef.current.has(item.id)) {
      panRespondersRef.current.set(item.id, createPanResponder(item.id));
    }
  }
  const currentIds = new Set(list.map((i) => i.id));
  for (const id of [...panRespondersRef.current.keys()]) {
    if (!currentIds.has(id)) panRespondersRef.current.delete(id);
  }

  return (
    <View>
      {list.map((item, index) => {
        const isDragging = dragIndex === index;
        const pr = panRespondersRef.current.get(item.id)!;
        const draggedH = dragIndex !== null
          ? (itemHeightsRef.current.get(list[dragIndex]?.id ?? '') ?? ITEM_HEIGHT_FALLBACK)
          : ITEM_HEIGHT_FALLBACK;

        let translateY = 0;
        if (dragIndex !== null && hoverIndex !== null && dragIndex !== hoverIndex) {
          if (dragIndex < hoverIndex && index > dragIndex && index <= hoverIndex) {
            translateY = -draggedH;
          } else if (dragIndex > hoverIndex && index < dragIndex && index >= hoverIndex) {
            translateY = draggedH;
          }
        }

        return (
          <Animated.View
            key={item.id}
            onLayout={(e) => { itemHeightsRef.current.set(item.id, e.nativeEvent.layout.height); }}
            style={
              isDragging
                ? { zIndex: 10, transform: [{ translateY: dragY }], opacity: 0.92 }
                : { transform: [{ translateY }] }
            }>
            {renderItem(item, pr.panHandlers)}
          </Animated.View>
        );
      })}
    </View>
  );
}

export default function HomeScreen() {
  const theme = useColorScheme() ?? 'light';
  const c = Colors[theme];
  const { t } = useI18n();
  const loading = useHomeStore((s) => s.loading);
  const active = useHomeStore((s) => s.active);
  const completedToday = useHomeStore((s) => s.completedToday);
  const skippedToday = useHomeStore((s) => s.skippedToday);
  const today = useHomeStore((s) => s.today);
  const progress = useHomeStore((s) => s.progress);
  const refresh = useHomeStore((s) => s.refresh);
  const completeBullet = useHomeStore((s) => s.completeBullet);
  const undoBullet = useHomeStore((s) => s.undoBullet);
  const skipBullet = useHomeStore((s) => s.skipBullet);
  const unskipBullet = useHomeStore((s) => s.unskipBullet);
  const quickAdd = useHomeStore((s) => s.quickAdd);
  const reorderActive = useHomeStore((s) => s.reorderActive);
  const [quick, setQuick] = useState('');
  const [adding, setAdding] = useState(false);
  const [quickType, setQuickType] = useState<'daily' | 'one_time'>('daily');
  const [scrollEnabled, setScrollEnabled] = useState(true);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const handleQuickAdd = async () => {
    if (!quick.trim() || adding) return;
    setAdding(true);
    try {
      await quickAdd(quick, quickType);
      setQuick('');
    } finally {
      setAdding(false);
    }
  };

  const pct = normalizeProgress(progress.done, progress.total) * 100;

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <AppBackground dark={theme === 'dark'} />
      <ScrollView contentContainerStyle={styles.listPad} keyboardShouldPersistTaps="handled" scrollEnabled={scrollEnabled}>

        <Text style={[styles.dateLine, { color: theme === 'dark' ? '#666' : '#999' }]}>{today}</Text>
        <View style={[styles.progressWrap, { backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f5f5f5' }]}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressLabel, { color: c.text }]}>{t('todayProgress')}</Text>
            <Text style={[styles.progressFraction, { color: c.tint }]}>
              {progress.total === 0 ? '—' : `${progress.done} / ${progress.total}`}
            </Text>
          </View>
          <AnimatedProgressBar
            percent={pct / 100}
            color={c.tint}
            trackColor={theme === 'dark' ? '#2a2a2a' : '#ddd'}
          />
        </View>

        <View style={[styles.quickRow, { borderColor: theme === 'dark' ? '#333' : '#e0e0e0', backgroundColor: c.background }]}>
          <FontAwesome name="plus" size={14} color={theme === 'dark' ? '#555' : '#bbb'} style={{ marginLeft: 12 }} />
          <TextInput
            style={[styles.quickInput, { color: c.text }]}
            placeholder={t('quickAdd')}
            placeholderTextColor={theme === 'dark' ? '#555' : '#bbb'}
            value={quick}
            onChangeText={setQuick}
            onSubmitEditing={() => void handleQuickAdd()}
            returnKeyType="done"
          />
          <View style={styles.typeToggle}>
            <Pressable
              style={[
                styles.toggleBtn,
                quickType === 'daily' && { backgroundColor: c.tint },
                { borderColor: c.tint },
              ]}
              onPress={() => setQuickType('daily')}>
              <Text style={[styles.toggleBtnText, { color: quickType === 'daily' ? '#fff' : c.tint }]}>
                {t('quickAddDaily')}
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.toggleBtn,
                quickType === 'one_time' && { backgroundColor: c.tint },
                { borderColor: c.tint },
              ]}
              onPress={() => setQuickType('one_time')}>
              <Text style={[styles.toggleBtnText, { color: quickType === 'one_time' ? '#fff' : c.tint }]}>
                {t('quickAddOneTime')}
              </Text>
            </Pressable>
          </View>
          {quick.trim().length > 0 && (
            <Pressable
              style={[styles.addBtn, { backgroundColor: c.tint }]}
              onPress={() => void handleQuickAdd()}
              disabled={adding}>
              <Text style={styles.addBtnText}>{adding ? t('adding') : t('add')}</Text>
            </Pressable>
          )}
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 32 }} color={c.tint} />
        ) : (
          <>
            <View style={styles.sectionRow}>
              <Text style={[styles.section, { color: c.text }]}>{t('active')}</Text>
              <Text style={[styles.sectionCount, { color: theme === 'dark' ? '#555' : '#bbb' }]}>
                {active.length}
              </Text>
            </View>
            {active.length === 0 ? (
              <View style={[styles.emptyCard, { borderColor: theme === 'dark' ? '#222' : '#f0f0f0', backgroundColor: theme === 'dark' ? '#111' : '#fafafa' }]}>
                <Text style={[styles.emptyTitle, { color: c.text }]}>{t('allDone')}</Text>
                <Text style={[styles.emptyDesc, { color: theme === 'dark' ? '#555' : '#bbb' }]}>
                  {t('addHint')}
                </Text>
              </View>
            ) : (
              <DraggableActiveList
                items={active}
                onReorder={(ids) => void reorderActive(ids)}
                onDragStateChange={(dragging) => setScrollEnabled(!dragging)}
                renderItem={(item, dragHandleProps) => (
                  <BulletCard
                    key={item.id}
                    item={item}
                    done={false}
                    c={c}
                    theme={theme}
                    onTap={() => void completeBullet(item)}
                    onUndo={() => {}}
                    onSkip={() => void skipBullet(item)}
                    dragHandleProps={dragHandleProps}
                  />
                )}
              />
            )}

            {skippedToday.length > 0 && (
              <>
                <View style={[styles.sectionRow, { marginTop: 20 }]}>
                  <Text style={[styles.section, { color: theme === 'dark' ? '#555' : '#aaa' }]}>{t('skippedToday')}</Text>
                  <Text style={[styles.sectionCount, { color: theme === 'dark' ? '#444' : '#ccc' }]}>
                    {skippedToday.length}
                  </Text>
                </View>
                {skippedToday.map((item) => (
                  <BulletCard
                    key={item.id}
                    item={item}
                    done={false}
                    skipped
                    c={c}
                    theme={theme}
                    onTap={() => {}}
                    onUndo={() => {}}
                    onUnskip={() => void unskipBullet(item)}
                  />
                ))}
              </>
            )}

            {completedToday.length > 0 && (
              <>
                <View style={[styles.sectionRow, { marginTop: 20 }]}>
                  <Text style={[styles.section, { color: theme === 'dark' ? '#555' : '#aaa' }]}>{t('doneToday')}</Text>
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
                    onUndo={() => void undoBullet(item)}
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

  quickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 46,
    flexWrap: 'wrap',
  },
  quickInput: { flex: 1, minWidth: 80, paddingHorizontal: 10, paddingVertical: 11, fontSize: 15 },
  typeToggle: { flexDirection: 'row', gap: 4, paddingHorizontal: 8, paddingVertical: 6 },
  toggleBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  toggleBtnText: { fontSize: 11, fontWeight: '600' },
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
  dragHandle: { paddingLeft: 10, paddingRight: 4, paddingVertical: 12, justifyContent: 'center', alignItems: 'center' },
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
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 5 },
  categoryPill: { alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  categoryText: { fontSize: 11, fontWeight: '700' },
  undoText: { fontSize: 12, fontWeight: '700' },
  skipText: { fontSize: 12, fontWeight: '600' },
  desc: { marginTop: 3, fontSize: 13 },
  editBtn: { padding: 10 },
});
