import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
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
  planner: 'calendar',
  settings: 'person',
};

const BAR_TAB_NAMES = ['index', 'fridge', 'planner', 'settings'] as const;

function formatFridgeAlertBadge(count: number): string {
  if (count > 99) return '99+';
  return String(count);
}

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
  const [fabOpen, setFabOpen] = useState(false);

  const barRoutes = BAR_TAB_NAMES
    .map((name) => state.routes.find((r) => r.name === name))
    .filter((r): r is { key: string; name: string } => r != null);

  const leftRoutes = barRoutes.slice(0, 2);
  const rightRoutes = barRoutes.slice(2);

  const renderTab = (route: { key: string; name: string }) => {
    const routeIndex = state.routes.findIndex((r) => r.key === route.key);
    const { options } = descriptors[route.key];
    const label = options.title ?? route.name;
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
              color={focused ? colors.orange : colors.inkMuted}
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
        <BlurView
          intensity={Platform.OS === 'ios' ? 64 : 80}
          tint={blurTint}
          style={styles.blur}
        >
          <View style={styles.barFill} pointerEvents="none" />
          <View style={styles.tabsRow}>
            <View style={styles.tabGroup}>{leftRoutes.map(renderTab)}</View>
            <View style={styles.fabSlot} pointerEvents="box-none" />
            <View style={styles.tabGroup}>{rightRoutes.map(renderTab)}</View>
          </View>
        </BlurView>
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
        <Pressable style={styles.fabBackdrop} onPress={() => setFabOpen(false)}>
          <View style={styles.fabSheet}>
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
          </View>
        </Pressable>
      </Modal>
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
    barShadow: {
      position: 'relative',
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
      borderRadius: radius.xl,
    },
    tabsRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: spacing.sm,
      paddingTop: 8,
      paddingBottom: 6,
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
      alignSelf: 'stretch',
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
    fabBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'flex-end',
      padding: spacing.md,
    },
    fabSheet: {
      backgroundColor: colors.cream,
      borderRadius: radius.xl,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
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
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.orange,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 2,
      transform: [{ translateY: -22 }],
      borderWidth: 2,
      borderColor: colors.tabBarFill,
    },
  });
