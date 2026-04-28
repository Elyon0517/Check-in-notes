import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import type { WeekdayIndex } from '@/src/types/models';
import { useSettingsStore } from '@/src/stores/settingsStore';

const WEEK_OPTIONS: { label: string; value: WeekdayIndex }[] = [
  { label: '周日', value: 0 },
  { label: '周一', value: 1 },
  { label: '周二', value: 2 },
  { label: '周三', value: 3 },
  { label: '周四', value: 4 },
  { label: '周五', value: 5 },
  { label: '周六', value: 6 },
];

export default function SettingsScreen() {
  const theme = useColorScheme() ?? 'light';
  const c = Colors[theme];
  const loading = useSettingsStore((s) => s.loading);
  const settings = useSettingsStore((s) => s.settings);
  const refresh = useSettingsStore((s) => s.refresh);
  const setEodTime = useSettingsStore((s) => s.setEodTime);
  const setWeekStart = useSettingsStore((s) => s.setWeekStart);
  const setNotificationsEnabled = useSettingsStore((s) => s.setNotificationsEnabled);
  const clearAllData = useSettingsStore((s) => s.clearAllData);
  const [eodDraft, setEodDraft] = useState('');

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  useEffect(() => {
    if (settings?.eod_reminder_time && !eodDraft) {
      setEodDraft(settings.eod_reminder_time);
    }
  }, [settings?.eod_reminder_time]);

  const saveEod = () => {
    if (!/^\d{1,2}:\d{2}$/.test(eodDraft.trim())) {
      Alert.alert('格式错误', '请使用 HH:mm，例如 21:30');
      return;
    }
    void setEodTime(eodDraft.trim());
  };

  const confirmClear = () => {
    Alert.alert('清除本地数据', '将删除所有子弹与完成记录，且无法恢复。确定？', [
      { text: '取消', style: 'cancel' },
      { text: '清除', style: 'destructive', onPress: () => void clearAllData() },
    ]);
  };

  const sub = theme === 'dark' ? '#666' : '#999';
  const border = theme === 'dark' ? '#333' : '#e0e0e0';

  if (loading && !settings) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <ActivityIndicator color={c.tint} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.root, { backgroundColor: c.background }]} contentContainerStyle={styles.pad}>

      {/* EOD time */}
      <Text style={[styles.sectionLabel, { color: sub }]}>通知</Text>
      <View style={[styles.group, { borderColor: border, backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff' }]}>
        <View style={styles.row}>
          <View style={styles.rowLabel}>
            <Text style={[styles.rowTitle, { color: c.text }]}>今日结束时间</Text>
            <Text style={[styles.rowSub, { color: sub }]}>每日结束提醒将在此时发送</Text>
          </View>
          <View style={styles.eodRow}>
            <TextInput
              style={[styles.eodInput, { color: c.text, borderColor: border }]}
              value={eodDraft}
              onChangeText={setEodDraft}
              placeholder="20:00"
              placeholderTextColor={sub}
              keyboardType="numbers-and-punctuation"
              returnKeyType="done"
              onSubmitEditing={saveEod}
            />
            <Pressable
              style={[styles.eodSave, { backgroundColor: c.tint }]}
              onPress={saveEod}>
              <Text style={styles.eodSaveText}>保存</Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: border }]} />

        <View style={styles.row}>
          <View style={styles.rowLabel}>
            <Text style={[styles.rowTitle, { color: c.text }]}>启用本地提醒</Text>
            <Text style={[styles.rowSub, { color: sub }]}>关闭后不发送任何通知</Text>
          </View>
          <Switch
            value={!!settings?.notifications_enabled}
            onValueChange={(v) => void setNotificationsEnabled(v)}
            trackColor={{ true: c.tint }}
          />
        </View>
      </View>

      {/* Week start */}
      <Text style={[styles.sectionLabel, { color: sub, marginTop: 24 }]}>日历</Text>
      <View style={[styles.group, { borderColor: border, backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff' }]}>
        <Text style={[styles.rowTitle, { color: c.text, padding: 14, paddingBottom: 8 }]}>一周从哪天开始</Text>
        <View style={[styles.weekWrap, { padding: 14, paddingTop: 4 }]}>
          {WEEK_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => void setWeekStart(opt.value)}
              style={[
                styles.chip,
                { borderColor: border },
                settings?.week_start_day === opt.value && { backgroundColor: c.tint, borderColor: c.tint },
              ]}>
              <Text
                style={[
                  styles.chipText,
                  { color: settings?.week_start_day === opt.value ? '#fff' : c.text },
                ]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Danger zone */}
      <Text style={[styles.sectionLabel, { color: sub, marginTop: 24 }]}>数据</Text>
      <Pressable
        style={[styles.dangerBtn, { borderColor: '#c00' }]}
        onPress={confirmClear}>
        <Text style={styles.dangerText}>清除全部本地数据</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pad: { padding: 16, paddingBottom: 50 },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  group: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  divider: { height: StyleSheet.hairlineWidth },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    gap: 12,
  },
  rowLabel: { flex: 1 },
  rowTitle: { fontSize: 15 },
  rowSub: { fontSize: 12, marginTop: 2 },

  eodRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eodInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 15,
    width: 72,
    textAlign: 'center',
  },
  eodSave: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  eodSaveText: { color: '#fff', fontWeight: '600', fontSize: 13 },

  weekWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: '500' },

  dangerBtn: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  dangerText: { color: '#c00', fontWeight: '600', fontSize: 15 },
});
