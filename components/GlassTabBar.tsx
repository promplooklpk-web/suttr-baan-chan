import { Ionicons } from '@expo/vector-icons';
import { Glass } from '@/components/Glass';
import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { fonts, radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { accentGlow } from '@/lib/design';
import { useFridge } from '@/context/FridgeContext';
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs/types';

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home',
  fridge: 'snow',
  planner: 'calendar',
  settings: 'person',
};

const BAR_TAB_NAMES = ['index', 'fridge', 'planner', 'settings'] as const;

function formatFridgeAlertBadge(count: number): string {
  if (count > 99) return '99+';
  return String(count);
}

export function GlassTabBar({ state, descriptors, emitter, navigateToTab, insets: barInsets }: BottomTabBarProps) {
  const styles = useThemedStyles(createStyles);
  const { colors, tokens } = useTheme();
  const bottom = Math.max(barInsets.bottom, spacing.sm);
  const { alertCount } = useFridge();
  const [fabOpen, setFabOpen] = useState(false);

  const barRoutes = BAR_TAB_NAMES
    .map((name) => state.routes.find((r: { key: string; name: string }) => r.name === name))
    .filter((r): r is { key: string; name: string } => r != null);

  const leftRoutes = barRoutes.slice(0, 2);
  const rightRoutes = barRoutes.slice(2);

  const renderTab = (route: { key: string; name: string }) => {
    const routeIndex = state.routes.findIndex((r: { key: string }) => r.key === route.key);
    const { options } = descriptors[route.key];
    const label =
      route.name === 'fridge' ? 'ตู้เย็น' : (options.title ?? route.name);
    const focused = state.index === routeIndex;
    const iconName = TAB_ICONS[route.name] ?? 'home';
    const icon = (focused ? iconName : `${iconName}-outline`) as keyof typeof Ionicons.glyphMap;

    const onPress = () => {
      const event = emitter.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!focused && !event.defaultPrevented) {
        navigateToTab(route.key);
      }
    };

    const badge = route.name === 'fridge' && alertCount > 0 ? alertCount : 0;
    const badgeLabel = badge > 0 ? formatFridgeAlertBadge(badge) : '';
    const badgeWide = badge > 99;

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
              size={21}
              color={focused ? tokens.accentText : colors.inkMuted}
            />
          </View>
          {badge > 0 && (
            <View
              style={[
                styles.badge,
                badgeWide && styles.badgeWide,
                {
                  borderColor: focused ? colors.tabBarActivePill : colors.tabBarFill,
                },
              ]}
            >
              <AppText style={[styles.badgeText, badgeWide && styles.badgeTextWide]}>
                {badgeLabel}
              </AppText>
            </View>
          )}
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
  };

  return (
    <View style={[styles.container, { paddingBottom: bottom }]} pointerEvents="box-none">
      <View style={styles.barShadow}>
        <Glass variant="chrome" borderRadius={radius.tabBar} intensity={72} style={styles.barGlass}>
          <View style={styles.tabsRow}>
            <View style={styles.tabGroup}>{leftRoutes.map(renderTab)}</View>
            <View style={styles.fabSlot} pointerEvents="box-none" />
            <View style={styles.tabGroup}>{rightRoutes.map(renderTab)}</View>
          </View>
        </Glass>
        <View style={styles.fabOverlay} pointerEvents="box-none">
          <Pressable
            onPress={() => setFabOpen(true)}
            style={[styles.fab, accentGlow(colors, true)]}
            accessibilityLabel="เพิ่มหรือสุ่มเมนู"
          >
            <Ionicons name="add" size={28} color={colors.onAccent} />
          </Pressable>
        </View>
      </View>
      <Modal visible={fabOpen} transparent animationType="fade" onRequestClose={() => setFabOpen(false)}>
        <View style={styles.fabModalRoot}>
          <Pressable style={styles.fabBackdrop} onPress={() => setFabOpen(false)} />
          <Glass variant="material" sheet style={styles.fabSheetGlass}>
            <Pressable
              style={styles.fabRow}
              onPress={() => {
                setFabOpen(false);
                router.push('/recipe/edit');
              }}
            >
              <AppText variant="label">เพิ่มสูตรใหม่</AppText>
            </Pressable>
            <Pressable
              style={styles.fabRow}
              onPress={() => {
                setFabOpen(false);
                router.push('/(tabs)/picker');
              }}
            >
              <AppText variant="label">วันนี้กินอะไรดี?</AppText>
            </Pressable>
            <Pressable style={styles.fabCancel} onPress={() => setFabOpen(false)}>
              <AppText muted>ปิด</AppText>
            </Pressable>
          </Glass>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      left: spacing.gutter,
      right: spacing.gutter,
      bottom: 0,
    },
    barShadow: {
      position: 'relative',
      borderRadius: radius.tabBar,
      shadowColor: colors.tabBarShadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.22,
      shadowRadius: 18,
      elevation: 12,
    },
    barGlass: {
      minHeight: 66,
      overflow: 'hidden',
    },
    tabsRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: spacing.sm,
      paddingTop: 8,
      paddingBottom: 8,
      minHeight: 66,
    },
    tabGroup: {
      flex: 1,
      flexDirection: 'row',
      minWidth: 0,
      overflow: 'hidden',
    },
    tabHit: {
      flex: 1,
      minWidth: 0,
      paddingHorizontal: 2,
    },
    tabPill: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      width: 56,
      minHeight: 52,
      paddingVertical: 4,
      paddingHorizontal: 2,
      borderRadius: radius.lg,
      gap: 1,
      overflow: 'hidden',
    },
    tabPillActive: {
      backgroundColor: colors.tabBarActivePill,
    },
    iconWrap: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabLabel: {
      fontSize: 9,
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
      top: 0,
      left: '50%',
      marginLeft: 12,
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.danger,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 5,
      borderWidth: 1,
      zIndex: 2,
    },
    badgeWide: {
      height: 18,
      minWidth: 18,
      borderRadius: 9,
      paddingHorizontal: 4,
      marginLeft: 11,
    },
    badgeText: {
      color: colors.textOnStatus,
      fontSize: 11,
      fontFamily: fonts.semiBold,
      lineHeight: 20,
      textAlign: 'center',
      ...(Platform.OS === 'android'
        ? { includeFontPadding: false, textAlignVertical: 'center' as const }
        : {}),
    },
    badgeTextWide: {
      fontSize: 9,
      lineHeight: 18,
    },
    fabSlot: {
      width: 58,
      flexShrink: 0,
    },
    fabOverlay: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 6,
      alignItems: 'center',
      justifyContent: 'flex-end',
      zIndex: 4,
    },
    fabModalRoot: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    fabBackdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: colors.modalScrim,
    },
    fabSheetGlass: {
      padding: spacing.md,
      marginHorizontal: spacing.sm,
      marginBottom: spacing.sm,
    },
    fabRow: {
      minHeight: 44,
      justifyContent: 'center',
      paddingVertical: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    fabCancel: {
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.sm,
    },
    fab: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.orange,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 2,
      transform: [{ translateY: -14 }],
      borderWidth: 4,
      borderColor: colors.cream,
    },
  });
