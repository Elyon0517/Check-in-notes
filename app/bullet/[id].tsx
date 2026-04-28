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
import { useI18n } from '@/src/i18n';
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
  const { language, t } = useI18n();
  const draftRef = useRef<BulletDraft>(emptyDraft());
  const [initial, setInitial] = useState<BulletDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteConfirming, setDeleteConfirming] = useState(false);
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
        Alert.alert(t('notFoundTitle'), t('notFoundMessage'));
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
    const err = validateDraft(d, language);
    if (err) {
      Alert.alert(t('invalidTitle'), err);
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

  const confirmDelete = () => {
    if (!id) return;
    if (!deleteConfirming) {
      setDeleteConfirming(true);
      return;
    }
    void deleteCurrentDevil();
  };

  const deleteCurrentDevil = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await bulletService.deleteBullet(id);
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
        {deleteConfirming ? (
          <Text style={[styles.deleteHint, { color: theme === 'dark' ? '#aaa' : '#64748B' }]}>
            {t('deleteMessage')}
          </Text>
        ) : null}
        <Pressable
          style={({ pressed }) => [
            styles.deleteBtn,
            {
              borderColor: '#DC2626',
              backgroundColor: deleteConfirming ? '#DC2626' : 'transparent',
              opacity: pressed ? 0.75 : 1,
            },
          ]}
          onPress={confirmDelete}
          disabled={saving}>
          <Text style={[styles.deleteText, deleteConfirming && { color: '#fff' }]}>
            {deleteConfirming ? t('confirmDelete') : t('deleteDevil')}
          </Text>
        </Pressable>
        {deleteConfirming ? (
          <Pressable
            style={styles.cancelBtn}
            onPress={() => setDeleteConfirming(false)}
            disabled={saving}>
            <Text style={[styles.cancelText, { color: c.tint }]}>{t('cancel')}</Text>
          </Pressable>
        ) : null}
        <Pressable
          style={({ pressed }) => [styles.saveBtn, { backgroundColor: c.tint, opacity: pressed ? 0.85 : 1 }]}
          onPress={() => void save()}
          disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveText}>{t('save')}</Text>
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
  saveBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  deleteBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  deleteText: { color: '#DC2626', fontSize: 15, fontWeight: '700' },
  deleteHint: { fontSize: 12, lineHeight: 16, textAlign: 'center' },
  cancelBtn: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  cancelText: { fontSize: 14, fontWeight: '700' },
});
