import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { fonts, radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useFridge } from '@/context/FridgeContext';

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home',
  fridge: 'snow',
  picker: 'shuffle',
  search: 'search',
  planner: 'calendar',
  settings: 'settings',
};

// Props match React Navigation tab bar; kept loose to avoid duplicate @react-navigation version types.
export function GlassTabBar({ state, descriptors, navigation }: {
  state: { routes: { key: string; name: string }[]; index: number };
  descriptors: Record<string, { options: { title?: string } }>;
  navigation: { emit: (e: unknown) => { defaultPrevented?: boolean }; navigate: (name: string) => void };
}) {
  const styles = useThemedStyles(createStyles);
  const { colors, blurTint } = useTheme();
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, spacing.sm);
  const { alertCount } = useFridge();

  const visibleRoutes = state.routes.filter((r) => r.name !== 'add' && r.name !== 'search');

  return (
    <View style={[styles.container, { paddingBottom: bottom }]} pointerEvents="box-none">
      <BlurView intensity={Platform.OS === 'ios' ? 70 : 90} tint={blurTint} style={styles.blur}>
        <View style={styles.row}>
          {visibleRoutes.map((route) => {
            const routeIndex = state.routes.findIndex((r) => r.key === route.key);
            const { options } = descriptors[route.key];
            const label =
              options.title ??
              ({
                index: 'หน้าแรก',
                fridge: 'ตู้เย็น',
                picker: 'กินอะไรดี',
                planner: 'แพลน',
                settings: 'ตั้งค่า',
              }[route.name] ?? route.name);
            const focused = state.index === routeIndex;
            const iconName = TAB_ICONS[route.name] ?? 'home';
            const icon = (focused ? iconName : `${iconName}-outline`) as keyof typeof Ionicons.glyphMap;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const badge = route.name === 'fridge' && alertCount > 0 ? alertCount : 0;

            return (
              <Pressable key={route.key} onPress={onPress} style={styles.tab}>
                <View>
                  <Ionicons
                    name={icon}
                    size={24}
                    color={focused ? colors.orange : colors.inkMuted}
                  />
                  {badge > 0 && (
                    <View style={styles.badge}>
                      <AppText style={styles.badgeText}>{badge > 9 ? '9+' : badge}</AppText>
                    </View>
                  )}
                </View>
                <AppText
                  variant="caption"
                  style={{ color: focused ? colors.orange : colors.inkMuted, fontSize: 11 }}
                >
                  {label}
                </AppText>
              </Pressable>
            );
          })}

          <View style={styles.addSlot}>
            <Pressable
              onPress={() => router.push('/recipe/edit')}
              style={styles.addButton}
              accessibilityLabel="เพิ่มสูตร"
            >
              <Ionicons name="add" size={32} color={colors.onAccent} />
            </Pressable>
          </View>
        </View>
      </BlurView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: 0,
  },
  blur: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: Platform.OS === 'android' ? colors.glassAndroidBg : undefined,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.xs,
  },
  addSlot: {
    flex: 1,
    alignItems: 'center',
    marginTop: -28,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.textOnStatus,
    fontSize: 10,
    fontFamily: fonts.semiBold,
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});
