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
import { useI18n, weekdayLabel } from '@/src/i18n';
import type { WeekdayIndex } from '@/src/types/models';
import { useSettingsStore } from '@/src/stores/settingsStore';

const WEEK_OPTIONS: WeekdayIndex[] = [0, 1, 2, 3, 4, 5, 6];

export default function SettingsScreen() {
  const theme = useColorScheme() ?? 'light';
  const c = Colors[theme];
  const { language, t } = useI18n();
  const loading = useSettingsStore((s) => s.loading);
  const settings = useSettingsStore((s) => s.settings);
  const refresh = useSettingsStore((s) => s.refresh);
  const setEodTime = useSettingsStore((s) => s.setEodTime);
  const setWeekStart = useSettingsStore((s) => s.setWeekStart);
  const setNotificationsEnabled = useSettingsStore((s) => s.setNotificationsEnabled);
  const toggleLanguage = useSettingsStore((s) => s.toggleLanguage);
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
      Alert.alert(t('invalidTitle'), t('invalidTimeFormat'));
      return;
    }
    void setEodTime(eodDraft.trim());
  };

  const confirmClear = () => {
    Alert.alert(t('clearTitle'), t('clearMessage'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('clear'), style: 'destructive', onPress: () => void clearAllData() },
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
      <Text style={[styles.sectionLabel, { color: sub }]}>{t('notifications')}</Text>
      <View style={[styles.group, { borderColor: border, backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff' }]}>
        <View style={styles.row}>
          <View style={styles.rowLabel}>
            <Text style={[styles.rowTitle, { color: c.text }]}>{t('endTime')}</Text>
            <Text style={[styles.rowSub, { color: sub }]}>{t('endTimeSub')}</Text>
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
              <Text style={styles.eodSaveText}>{t('save')}</Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: border }]} />

        <View style={styles.row}>
          <View style={styles.rowLabel}>
            <Text style={[styles.rowTitle, { color: c.text }]}>{t('language')}</Text>
            <Text style={[styles.rowSub, { color: sub }]}>{t('languageSub')}</Text>
          </View>
          <Pressable
            style={[styles.languageBtn, { borderColor: border }]}
            onPress={() => void toggleLanguage()}>
            <Text style={[styles.languageText, { color: c.tint }]}>
              {language === 'en' ? t('switchToChinese') : t('switchToEnglish')}
            </Text>
          </Pressable>
        </View>

        <View style={[styles.divider, { backgroundColor: border }]} />

        <View style={styles.row}>
          <View style={styles.rowLabel}>
            <Text style={[styles.rowTitle, { color: c.text }]}>{t('enableLocalNotifications')}</Text>
            <Text style={[styles.rowSub, { color: sub }]}>{t('enableLocalNotificationsSub')}</Text>
          </View>
          <Switch
            value={!!settings?.notifications_enabled}
            onValueChange={(v) => void setNotificationsEnabled(v)}
            trackColor={{ true: c.tint }}
          />
        </View>
      </View>

      {/* Week start */}
      <Text style={[styles.sectionLabel, { color: sub, marginTop: 24 }]}>{t('calendar')}</Text>
      <View style={[styles.group, { borderColor: border, backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff' }]}>
        <Text style={[styles.rowTitle, { color: c.text, padding: 14, paddingBottom: 8 }]}>{t('weekStartQuestion')}</Text>
        <View style={[styles.weekWrap, { padding: 14, paddingTop: 4 }]}>
          {WEEK_OPTIONS.map((value) => (
            <Pressable
              key={value}
              onPress={() => void setWeekStart(value)}
              style={[
                styles.chip,
                { borderColor: border },
                settings?.week_start_day === value && { backgroundColor: c.tint, borderColor: c.tint },
              ]}>
              <Text
                style={[
                  styles.chipText,
                  { color: settings?.week_start_day === value ? '#fff' : c.text },
                ]}>
                {weekdayLabel(value, language)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Danger zone */}
      <Text style={[styles.sectionLabel, { color: sub, marginTop: 24 }]}>{t('data')}</Text>
      <Pressable
        style={[styles.dangerBtn, { borderColor: '#c00' }]}
        onPress={confirmClear}>
        <Text style={styles.dangerText}>{t('clearAllData')}</Text>
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
  languageBtn: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  languageText: { fontSize: 13, fontWeight: '800' },

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
