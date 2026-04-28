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
import { categoryLabel, priorityLabel, translate, typeLabel, useI18n, weekdayLabel } from '@/src/i18n';
import type { AppLanguage } from '@/src/types/models';
import type { BulletCategory, BulletType, Priority } from '@/src/types/models';

const TYPES: BulletType[] = ['daily', 'weekly', 'one_time'];

const PRIOS: Priority[] = ['low', 'medium', 'high'];

const CATEGORIES: BulletCategory[] = ['general', 'study', 'fitness', 'work', 'health', 'life'];

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];

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
  const { language, t } = useI18n();

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
      <Text style={[styles.label, { color: subColor }]}>{t('titleRequired')}</Text>
      <TextInput
        style={[styles.input, { color: textColor, borderColor }]}
        placeholder={t('titlePlaceholder')}
        placeholderTextColor={subColor}
        value={draft.title}
        onChangeText={(t) => patch({ title: t })}
        autoFocus
      />

      <Text style={[styles.label, { color: subColor }]}>{t('description')}</Text>
      <TextInput
        style={[styles.input, styles.multiline, { color: textColor, borderColor }]}
        placeholder={t('optional')}
        placeholderTextColor={subColor}
        value={draft.description}
        onChangeText={(t) => patch({ description: t })}
        multiline
      />

      <Text style={[styles.label, { color: subColor }]}>{t('type')}</Text>
      <View style={styles.row}>
        {TYPES.map((key) => (
          <Pressable
            key={key}
            onPress={() => patch({ type: key })}
            style={[
              styles.chip,
              { borderColor },
              draft.type === key && { backgroundColor: tint, borderColor: tint },
            ]}>
            <Text style={[styles.chipText, { color: draft.type === key ? '#fff' : textColor }]}>
              {typeLabel(key, language)}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.label, { color: subColor }]}>{t('category')}</Text>
      <View style={styles.rowWrap}>
        {CATEGORIES.map((key) => (
          <Pressable
            key={key}
            onPress={() => patch({ category: key })}
            style={[
              styles.chip,
              { borderColor },
              draft.category === key && { backgroundColor: tint, borderColor: tint },
            ]}>
            <Text style={[styles.chipText, { color: draft.category === key ? '#fff' : textColor }]}>
              {categoryLabel(key, language)}
            </Text>
          </Pressable>
        ))}
      </View>

      {draft.type === 'weekly' && (
        <>
          <Text style={[styles.label, { color: subColor }]}>{t('targetDay')}</Text>
          <View style={styles.rowWrap}>
            {WEEKDAYS.map((_, idx) => (
              <Pressable
                key={idx}
                onPress={() => patch({ weekly_day: idx })}
                style={[
                  styles.dayChip,
                  { borderColor },
                  draft.weekly_day === idx && { backgroundColor: tint, borderColor: tint },
                ]}>
                <Text style={[styles.chipText, { color: draft.weekly_day === idx ? '#fff' : textColor }]}>
                  {weekdayLabel(idx, language)}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      <Text style={[styles.label, { color: subColor }]}>{t('priority')}</Text>
      <View style={styles.row}>
        {PRIOS.map((key) => (
          <Pressable
            key={key}
            onPress={() => patch({ priority: key })}
            style={[
              styles.chip,
              { borderColor },
              draft.priority === key && { backgroundColor: tint, borderColor: tint },
            ]}>
            <Text style={[styles.chipText, { color: draft.priority === key ? '#fff' : textColor }]}>
              {priorityLabel(key, language)}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={[styles.divider, { borderTopColor: borderColor }]} />

      <View style={styles.switchRow}>
        <View style={styles.switchLabel}>
          <Text style={[styles.switchTitle, { color: textColor }]}>{t('reminder')}</Text>
          <Text style={[styles.switchSub, { color: subColor }]}>{t('reminderSub')}</Text>
        </View>
        <Switch
          value={draft.reminder_enabled}
          onValueChange={(v) => patch({ reminder_enabled: v })}
          trackColor={{ true: tint }}
        />
      </View>

      {draft.reminder_enabled && (
        <>
          <Text style={[styles.label, { color: subColor }]}>{t('reminderTime')}</Text>
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
          <Text style={[styles.switchTitle, { color: textColor }]}>{t('eodReminder')}</Text>
          <Text style={[styles.switchSub, { color: subColor }]}>{t('eodReminderSub')}</Text>
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
  category: BulletCategory;
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
    category: b.category,
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
  category: 'general',
  type: 'daily',
  priority: 'medium',
  reminder_enabled: false,
  reminder_time: '09:00',
  eod_reminder_enabled: false,
  weekly_day: 1,
});

export function validateDraft(d: BulletDraft, language: AppLanguage = 'en'): string | null {
  if (!d.title.trim()) return translate(language, 'missingTitle');
  if (d.reminder_enabled) {
    if (!/^\d{1,2}:\d{2}$/.test(d.reminder_time)) return translate(language, 'invalidTimeFormat');
    const [h, m] = d.reminder_time.split(':').map((x) => parseInt(x, 10));
    if (h < 0 || h > 23 || m < 0 || m > 59) return translate(language, 'invalidTime');
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
