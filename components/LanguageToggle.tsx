import { Pressable, StyleSheet, Text } from 'react-native';

import { useSettingsStore } from '@/src/stores/settingsStore';

export function LanguageToggle() {
  const language = useSettingsStore((s) => s.settings?.language ?? 'en');
  const toggleLanguage = useSettingsStore((s) => s.toggleLanguage);

  return (
    <Pressable
      onPress={() => void toggleLanguage()}
      style={({ pressed }) => [styles.button, { opacity: pressed ? 0.7 : 1 }]}>
      <Text style={styles.text}>{language === 'en' ? 'EN' : '中'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: 38,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(14,165,233,0.12)',
    alignItems: 'center',
  },
  text: {
    color: '#0EA5E9',
    fontWeight: '800',
    fontSize: 12,
  },
});
