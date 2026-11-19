import { Tabs } from 'expo-router';

import { GlassTabBar } from '@/components/GlassTabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'สูตร' }} />
      <Tabs.Screen name="fridge" options={{ title: 'ตู้เย็นของฉัน' }} />
      {/* SDK 58: href: null makes tabs unreachable — GlassTabBar omits these from the bar */}
      <Tabs.Screen name="picker" options={{ title: 'สุ่มเมนู' }} />
      <Tabs.Screen name="search" options={{ title: 'ค้นหา' }} />
      <Tabs.Screen name="planner" options={{ title: 'แพลนมื้อ' }} />
      <Tabs.Screen name="settings" options={{ title: 'โปรไฟล์' }} />
      <Tabs.Screen name="add" options={{ title: 'เพิ่ม' }} />
    </Tabs>
  );
}
