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
import { accentGlow } from '@/lib/design';
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
      <View style={styles.barOuter}>
        <View style={styles.barShadow}>
          <BlurView
            intensity={Platform.OS === 'ios' ? 64 : 80}
            tint={blurTint}
            style={styles.blur}
          >
            <View style={styles.barFill} pointerEvents="none" />
            <View style={styles.tabsRow}>
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
                  <Pressable
                    key={route.key}
                    onPress={onPress}
                    style={styles.tabHit}
                    accessibilityRole="button"
                    accessibilityState={{ selected: focused }}
                  >
                    <View style={[styles.tabPill, focused && styles.tabPillActive]}>
                      <View style={styles.iconWrap}>
                        <Ionicons
                          name={icon}
                          size={22}
                          color={focused ? colors.orange : colors.inkMuted}
                        />
                        {badge > 0 && (
                          <View style={styles.badge}>
                            <AppText style={styles.badgeText}>
                              {badge > 9 ? '9+' : badge}
                            </AppText>
                          </View>
                        )}
                      </View>
                      <AppText
                        variant="caption"
                        numberOfLines={1}
                        style={[
                          styles.tabLabel,
                          focused ? styles.tabLabelActive : styles.tabLabelInactive,
                        ]}
                      >
                        {label}
                      </AppText>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </BlurView>
        </View>

        <Pressable
          onPress={() => router.push('/recipe/edit')}
          style={[styles.fab, accentGlow(colors, true)]}
          accessibilityLabel="เพิ่มสูตร"
        >
          <Ionicons name="add" size={30} color={colors.onAccent} />
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      left: spacing.md,
      right: spacing.md,
      bottom: 0,
    },
    barOuter: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    barShadow: {
      flex: 1,
      borderRadius: radius.xl,
      shadowColor: colors.tabBarShadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.35,
      shadowRadius: 20,
      elevation: 12,
    },
    blur: {
      borderRadius: radius.xl,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.tabBarBorder,
      backgroundColor: Platform.OS === 'android' ? colors.tabBarFill : undefined,
    },
    barFill: {
      ...StyleSheet.absoluteFill,
      backgroundColor: colors.tabBarFill,
    },
    tabsRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
      paddingHorizontal: 4,
      paddingVertical: 6,
    },
    tabHit: {
      flex: 1,
      minWidth: 0,
    },
    tabPill: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 6,
      paddingHorizontal: 2,
      borderRadius: radius.pill,
      gap: 2,
    },
    tabPillActive: {
      backgroundColor: colors.tabBarActivePill,
    },
    iconWrap: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabLabel: {
      fontSize: 10,
      maxWidth: '100%',
    },
    tabLabelActive: {
      color: colors.orange,
      fontFamily: fonts.semiBold,
    },
    tabLabelInactive: {
      color: colors.inkMuted,
      fontFamily: fonts.regular,
    },
    badge: {
      position: 'absolute',
      top: -5,
      right: -12,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: colors.danger,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 3,
      borderWidth: 1,
      borderColor: colors.tabBarFill,
    },
    badgeText: {
      color: colors.textOnStatus,
      fontSize: 9,
      fontFamily: fonts.semiBold,
    },
    fab: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: colors.orange,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: -10,
      zIndex: 2,
      borderWidth: 2,
      borderColor: colors.tabBarFill,
    },
  });
