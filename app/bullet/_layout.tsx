import { Stack } from 'expo-router';

export default function BulletLayout() {
  return (
    <Stack>
      <Stack.Screen name="new" options={{ title: '新建子弹' }} />
      <Stack.Screen name="[id]" options={{ title: '编辑子弹' }} />
    </Stack>
  );
}
