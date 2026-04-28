import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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
  draftFromBullet,
  emptyDraft,
  validateDraft,
} from '@/components/BulletEditor';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import * as bulletRepo from '@/src/repositories/bulletRepository';
import * as bulletService from '@/src/services/bulletService';
import type { BulletDraft } from '@/src/services/bulletService';
import { syncScheduledNotifications } from '@/src/services/notificationService';
import { useHomeStore } from '@/src/stores/homeStore';

export default function EditBulletScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useColorScheme() ?? 'light';
  const c = Colors[theme];
  const draftRef = useRef<BulletDraft>(emptyDraft());
  const [initial, setInitial] = useState<BulletDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const refreshHome = useHomeStore((s) => s.refresh);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      const b = await bulletRepo.getBulletById(id);
      if (cancelled) return;
      if (!b) {
        Alert.alert('未找到', '这条子弹不存在');
        router.back();
        return;
      }
      const d = draftFromBullet(b);
      draftRef.current = d;
      setInitial(d);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  const save = async () => {
    if (!id) return;
    const d = draftRef.current;
    const err = validateDraft(d);
    if (err) {
      Alert.alert('无法保存', err);
      return;
    }
    setSaving(true);
    try {
      await bulletService.updateBulletFromForm(id, d);
      await refreshHome();
      await syncScheduledNotifications();
      router.back();
    } finally {
      setSaving(false);
    }
  };

  const archive = () => {
    if (!id) return;
    Alert.alert('归档子弹', '归档后将不再出现在列表中，历史记录保留。确定？', [
      { text: '取消', style: 'cancel' },
      {
        text: '归档',
        style: 'destructive',
        onPress: () => void doArchive(),
      },
    ]);
  };

  const doArchive = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await bulletService.archiveBullet(id);
      await refreshHome();
      await syncScheduledNotifications();
      router.back();
    } finally {
      setSaving(false);
    }
  };

  if (loading || !initial) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <ActivityIndicator size="large" color={c.tint} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: c.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <BulletEditor
        key={id}
        initial={initial}
        onChange={(d) => {
          draftRef.current = d;
        }}
        textColor={c.text}
        subColor={theme === 'dark' ? '#888' : '#666'}
        borderColor={theme === 'dark' ? '#333' : '#ddd'}
        tint={c.tint}
      />
      <View style={[styles.footer, { borderTopColor: theme === 'dark' ? '#333' : '#eee', backgroundColor: c.background }]}>
        <Pressable
          style={[styles.archiveBtn, { borderColor: '#c00' }]}
          onPress={archive}
          disabled={saving}>
          <Text style={styles.archiveText}>归档子弹</Text>
        </Pressable>
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  footer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 8 : 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  archiveBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  archiveText: { color: '#c00', fontWeight: '500', fontSize: 15 },
  saveBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
