import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import { Pressable } from 'react-native';

import Colors from '@/constants/Colors';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useI18n } from '@/src/i18n';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -2 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { t } = useI18n();

  const headerRight = (withAdd = false) => (
    <>
      <LanguageToggle />
      {withAdd && (
        <Link href="/bullet/new" asChild>
          <Pressable style={{ marginLeft: 12, marginRight: 16 }}>
            {({ pressed }) => (
              <FontAwesome
                name="plus"
                size={22}
                color={Colors[colorScheme ?? 'light'].tint}
                style={{ opacity: pressed ? 0.5 : 1 }}
              />
            )}
          </Pressable>
        </Link>
      )}
      {!withAdd && <Pressable style={{ width: 16 }} />}
    </>
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tabIconDefault,
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: 0,
          backgroundColor: colorScheme === 'dark' ? '#020617' : '#FFFFFF',
        },
        headerStyle: {
          backgroundColor: colorScheme === 'dark' ? '#020617' : '#F8FAFC',
        },
        headerShadowVisible: false,
        headerTitleStyle: {
          fontWeight: '800',
        },
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('today'),
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          headerRight: () => headerRight(true),
        }}
      />
      <Tabs.Screen
        name="week"
        options={{
          title: t('week'),
          tabBarIcon: ({ color }) => <TabBarIcon name="calendar" color={color} />,
          headerRight: () => headerRight(false),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t('history'),
          tabBarIcon: ({ color }) => <TabBarIcon name="list" color={color} />,
          headerRight: () => headerRight(false),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('settings'),
          tabBarIcon: ({ color }) => <TabBarIcon name="cog" color={color} />,
          headerRight: () => headerRight(false),
        }}
      />
    </Tabs>
  );
}
