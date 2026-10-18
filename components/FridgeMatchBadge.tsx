import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { fonts, radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';

type Props = {
  percent: number;
  compact?: boolean;
};

export function fridgeBadgeColors(
  percent: number,
  colors: ThemeColors,
): { backgroundColor: string; color: string } {
  if (percent >= 100) {
    return { backgroundColor: colors.cardGreen, color: colors.onAccent };
  }
  if (percent >= 50) {
    return { backgroundColor: colors.orange, color: colors.onAccent };
  }
  return { backgroundColor: colors.cardYellow, color: colors.onAccent };
}

export function FridgeMatchBadge({ percent, compact }: Props) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const palette = fridgeBadgeColors(percent, colors);
  return (
    <View style={[styles.badge, compact && styles.badgeCompact, { backgroundColor: palette.backgroundColor }]}>
      <AppText
        variant="caption"
        style={[styles.text, compact && styles.textCompact, { color: palette.color }]}
        numberOfLines={1}
      >
        มีในตู้ {percent}%
      </AppText>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  badge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    maxWidth: '88%',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  badgeCompact: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  text: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
  },
  textCompact: {
    fontSize: 10,
  },
});
