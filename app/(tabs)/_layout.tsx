import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';

import { GlassTabBar } from '@/components/GlassTabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...(props as ComponentProps<typeof GlassTabBar>)} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'สูตร' }} />
      <Tabs.Screen name="fridge" options={{ title: 'ตู้เย็น' }} />
      <Tabs.Screen name="picker" options={{ title: 'กินอะไรดี' }} />
      <Tabs.Screen name="search" options={{ href: null }} />
      <Tabs.Screen name="planner" options={{ title: 'แพลน' }} />
      <Tabs.Screen name="settings" options={{ title: 'โปรไฟล์', href: null }} />
      <Tabs.Screen
        name="add"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
