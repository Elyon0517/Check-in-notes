import { Stack } from 'expo-router';

import { useI18n } from '@/src/i18n';

export default function BulletLayout() {
  const { t } = useI18n();

  return (
    <Stack>
      <Stack.Screen name="new" options={{ title: t('newDevil') }} />
      <Stack.Screen name="[id]" options={{ title: t('editDevil') }} />
    </Stack>
  );
}
