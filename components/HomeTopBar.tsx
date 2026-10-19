import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

import { AppText } from '@/components/AppText';
import { fonts, radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { FLOATING_HEADER_GAP } from '@/components/FloatingHeader';
import { profileAvatarInitial } from '@/lib/profile';

/** Tallest glass capsule (icon 36 + vertical padding 6×2) for clearance math */
export const HOME_TOP_BAR_HEIGHT = 48;
/** Gap between header bottom and scroll content (filter chips) */
const BELOW_HOME_BAR = 14;

type HomeTopBarProps = {
  greeting: string;
  title?: string;
};

export function homeTopBarClearance(topInset: number): number {
  return topInset + FLOATING_HEADER_GAP + HOME_TOP_BAR_HEIGHT + BELOW_HOME_BAR;
}

export function HomeTopBar({ greeting, title = 'สูตรบ้านฉัน' }: HomeTopBarProps) {
  const styles = useThemedStyles(createStyles);
  const { colors, blurTint } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { top: insets.top + FLOATING_HEADER_GAP }]} pointerEvents="box-none">
      <View style={styles.row}>
        <GlassShell blurTint={blurTint} style={styles.profileCapsule}>
          <View style={styles.avatar}>
            <AppText style={styles.avatarText}>{profileAvatarInitial()}</AppText>
          </View>
          <View style={styles.greetingCol}>
            <AppText variant="caption" muted numberOfLines={1}>{greeting}</AppText>
            <AppText variant="label" numberOfLines={1} style={styles.appName}>{title}</AppText>
          </View>
        </GlassShell>

        <GlassShell blurTint={blurTint} style={styles.actionsCapsule}>
          <Pressable
            accessibilityLabel="ค้นหา"
            onPress={() => router.push('/(tabs)/search')}
            style={styles.iconBtn}
          >
            <Ionicons name="search-outline" size={22} color={colors.ink} />
          </Pressable>
          <View style={styles.divider} />
          <Pressable
            accessibilityLabel="เมนู"
            onPress={() => router.push('/(tabs)/settings')}
            style={styles.iconBtn}
          >
            <Ionicons name="menu-outline" size={22} color={colors.ink} />
          </Pressable>
        </GlassShell>
      </View>
    </View>
  );
}

function GlassShell({
  children,
  blurTint,
  style,
}: {
  children: React.ReactNode;
  blurTint: 'light' | 'dark';
  style?: object;
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.glassOuter, style]}>
      <BlurView intensity={Platform.OS === 'ios' ? 78 : 90} tint={blurTint} style={styles.glassBlur}>
        <View style={styles.glassTint} pointerEvents="none" />
        <View style={styles.glassInner}>{children}</View>
      </BlurView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrapper: {
      position: 'absolute',
      left: spacing.md,
      right: spacing.md,
      zIndex: 20,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    glassOuter: {
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      overflow: 'hidden',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 4,
    },
    glassBlur: { borderRadius: radius.pill, overflow: 'hidden' },
    glassTint: {
      ...StyleSheet.absoluteFill,
      backgroundColor: colors.glassTint,
    },
    glassInner: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      gap: spacing.sm,
    },
    profileCapsule: { flex: 1, minWidth: 0 },
    actionsCapsule: { flexShrink: 0 },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.orange,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      color: colors.onAccent,
      fontFamily: fonts.bold,
      fontSize: 14,
    },
    greetingCol: { flex: 1, minWidth: 0, gap: 0 },
    appName: { fontFamily: fonts.semiBold, fontSize: 14 },
    iconBtn: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    divider: {
      width: 1,
      height: 22,
      backgroundColor: colors.border,
    },
  });
