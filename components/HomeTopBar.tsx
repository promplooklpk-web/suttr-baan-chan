import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Glass } from '@/components/Glass';
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
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { top: insets.top + FLOATING_HEADER_GAP }]} pointerEvents="box-none">
      <View style={styles.row}>
        <Glass variant="chrome" borderRadius={radius.pill} style={styles.profileCapsule}>
          <View style={styles.glassInner}>
            <View style={styles.avatar}>
              <AppText style={styles.avatarText}>{profileAvatarInitial()}</AppText>
            </View>
            <View style={styles.greetingCol}>
              <AppText variant="caption" muted numberOfLines={1}>
                {greeting}
              </AppText>
              <AppText variant="display" numberOfLines={1} style={styles.appName}>
                {title}
              </AppText>
            </View>
          </View>
        </Glass>

        <Glass variant="chrome" borderRadius={radius.pill} style={styles.actionsCapsule}>
          <View style={styles.glassInner}>
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
          </View>
        </Glass>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrapper: {
      position: 'absolute',
      left: spacing.gutter,
      right: spacing.gutter,
      zIndex: 20,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    profileCapsule: { flex: 1, minWidth: 0 },
    actionsCapsule: { flexShrink: 0 },
    glassInner: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      gap: spacing.sm,
    },
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
    appName: { fontSize: 20, lineHeight: 28 },
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