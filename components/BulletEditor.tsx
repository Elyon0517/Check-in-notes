import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
  Pressable,
  Text,
} from 'react-native';

import type { BulletDraft } from '@/src/services/bulletService';
import type { BulletType, Priority } from '@/src/types/models';

const TYPES: { key: BulletType; label: string }[] = [
  { key: 'daily', label: '每日' },
  { key: 'weekly', label: '每周' },
  { key: 'one_time', label: '一次性' },
];

const PRIOS: { key: Priority; label: string }[] = [
  { key: 'low', label: '低' },
  { key: 'medium', label: '中' },
  { key: 'high', label: '高' },
];

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

type Props = {
  initial: BulletDraft;
  onChange?: (d: BulletDraft) => void;
  textColor: string;
  subColor: string;
  borderColor: string;
  tint: string;
};

export function BulletEditor({ initial, onChange, textColor, subColor, borderColor, tint }: Props) {
  const [draft, setDraft] = useState<BulletDraft>(initial);

  function patch(p: Partial<BulletDraft>) {
    setDraft((prev) => {
      const next = { ...prev, ...p };
      onChange?.(next);
      return next;
    });
  }

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.label, { color: subColor }]}>标题 *</Text>
      <TextInput
        style={[styles.input, { color: textColor, borderColor }]}
        placeholder="给这条子弹起个名字"
        placeholderTextColor={subColor}
        value={draft.title}
        onChangeText={(t) => patch({ title: t })}
        autoFocus
      />

      <Text style={[styles.label, { color: subColor }]}>描述</Text>
      <TextInput
        style={[styles.input, styles.multiline, { color: textColor, borderColor }]}
        placeholder="可选"
        placeholderTextColor={subColor}
        value={draft.description}
        onChangeText={(t) => patch({ description: t })}
        multiline
      />

      <Text style={[styles.label, { color: subColor }]}>类型</Text>
      <View style={styles.row}>
        {TYPES.map(({ key, label }) => (
          <Pressable
            key={key}
            onPress={() => patch({ type: key })}
            style={[
              styles.chip,
              { borderColor },
              draft.type === key && { backgroundColor: tint, borderColor: tint },
            ]}>
            <Text style={[styles.chipText, { color: draft.type === key ? '#fff' : textColor }]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {draft.type === 'weekly' && (
        <>
          <Text style={[styles.label, { color: subColor }]}>目标完成日（周几）</Text>
          <View style={styles.rowWrap}>
            {WEEKDAYS.map((label, idx) => (
              <Pressable
                key={label}
                onPress={() => patch({ weekly_day: idx })}
                style={[
                  styles.dayChip,
                  { borderColor },
                  draft.weekly_day === idx && { backgroundColor: tint, borderColor: tint },
                ]}>
                <Text style={[styles.chipText, { color: draft.weekly_day === idx ? '#fff' : textColor }]}>
                  周{label}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      <Text style={[styles.label, { color: subColor }]}>优先级</Text>
      <View style={styles.row}>
        {PRIOS.map(({ key, label }) => (
          <Pressable
            key={key}
            onPress={() => patch({ priority: key })}
            style={[
              styles.chip,
              { borderColor },
              draft.priority === key && { backgroundColor: tint, borderColor: tint },
            ]}>
            <Text style={[styles.chipText, { color: draft.priority === key ? '#fff' : textColor }]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={[styles.divider, { borderTopColor: borderColor }]} />

      <View style={styles.switchRow}>
        <View style={styles.switchLabel}>
          <Text style={[styles.switchTitle, { color: textColor }]}>定时提醒</Text>
          <Text style={[styles.switchSub, { color: subColor }]}>在指定时间发送通知</Text>
        </View>
        <Switch
          value={draft.reminder_enabled}
          onValueChange={(v) => patch({ reminder_enabled: v })}
          trackColor={{ true: tint }}
        />
      </View>

      {draft.reminder_enabled && (
        <>
          <Text style={[styles.label, { color: subColor }]}>提醒时间（HH:mm）</Text>
          <TextInput
            style={[styles.input, { color: textColor, borderColor }]}
            placeholder="09:00"
            placeholderTextColor={subColor}
            value={draft.reminder_time}
            onChangeText={(t) => patch({ reminder_time: t })}
            keyboardType="numbers-and-punctuation"
          />
        </>
      )}

      <View style={[styles.switchRow, { marginTop: 16 }]}>
        <View style={styles.switchLabel}>
          <Text style={[styles.switchTitle, { color: textColor }]}>今日结束提醒</Text>
          <Text style={[styles.switchSub, { color: subColor }]}>在「设置」里配置的结束时间提醒</Text>
        </View>
        <Switch
          value={draft.eod_reminder_enabled}
          onValueChange={(v) => patch({ eod_reminder_enabled: v })}
          trackColor={{ true: tint }}
        />
      </View>
    </ScrollView>
  );
}

export function draftFromBullet(b: {
  title: string;
  description: string;
  type: BulletType;
  priority: Priority;
  reminder_enabled: boolean;
  reminder_time: string;
  eod_reminder_enabled: boolean;
  weekly_day: number;
}): BulletDraft {
  return {
    title: b.title,
    description: b.description,
    type: b.type,
    priority: b.priority,
    reminder_enabled: b.reminder_enabled,
    reminder_time: b.reminder_time,
    eod_reminder_enabled: b.eod_reminder_enabled,
    weekly_day: b.weekly_day,
  };
}

export const emptyDraft = (): BulletDraft => ({
  title: '',
  description: '',
  type: 'daily',
  priority: 'medium',
  reminder_enabled: false,
  reminder_time: '09:00',
  eod_reminder_enabled: false,
  weekly_day: 1,
});

export function validateDraft(d: BulletDraft): string | null {
  if (!d.title.trim()) return '请填写标题';
  if (d.reminder_enabled) {
    if (!/^\d{1,2}:\d{2}$/.test(d.reminder_time)) return '提醒时间格式应为 HH:mm（例如 09:00）';
    const [h, m] = d.reminder_time.split(':').map((x) => parseInt(x, 10));
    if (h < 0 || h > 23 || m < 0 || m > 59) return '提醒时间无效';
  }
  return null;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 32 },
  label: { fontSize: 13, marginBottom: 6, marginTop: 16 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 14, fontWeight: '500' },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 24, marginBottom: 4 },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 16,
  },
  switchLabel: { flex: 1 },
  switchTitle: { fontSize: 16 },
  switchSub: { fontSize: 12, marginTop: 2 },
});
