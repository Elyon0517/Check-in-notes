import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  BulletEditor,
  emptyDraft,
  validateDraft,
} from '@/components/BulletEditor';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import * as bulletService from '@/src/services/bulletService';
import type { BulletDraft } from '@/src/services/bulletService';
import { syncScheduledNotifications } from '@/src/services/notificationService';
import { useHomeStore } from '@/src/stores/homeStore';

export default function NewBulletScreen() {
  const router = useRouter();
  const theme = useColorScheme() ?? 'light';
  const c = Colors[theme];
  const draftRef = useRef<BulletDraft>(emptyDraft());
  const refreshHome = useHomeStore((s) => s.refresh);
  const [saving, setSaving] = useState(false);

  const onDraft = useCallback((d: BulletDraft) => {
    draftRef.current = d;
  }, []);

  const save = async () => {
    const d = draftRef.current;
    const err = validateDraft(d);
    if (err) {
      Alert.alert('无法保存', err);
      return;
    }
    setSaving(true);
    try {
      await bulletService.createBulletFromForm(d);
      await refreshHome();
      await syncScheduledNotifications();
      router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: c.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <BulletEditor
        key="new"
        initial={emptyDraft()}
        onChange={onDraft}
        textColor={c.text}
        subColor={theme === 'dark' ? '#888' : '#666'}
        borderColor={theme === 'dark' ? '#333' : '#ddd'}
        tint={c.tint}
      />
      <View style={[styles.footer, { borderTopColor: theme === 'dark' ? '#333' : '#eee', backgroundColor: c.background }]}>
        <Pressable
          style={({ pressed }) => [styles.saveBtn, { backgroundColor: c.tint, opacity: pressed ? 0.85 : 1 }]}
          onPress={() => void save()}
          disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveText}>保存</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  footer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 8 : 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  saveBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
