import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { fonts, radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { surfaceCard } from '@/lib/design';

type HomeHeroCardProps = {
  readyCount: number;
  fridgeItemCount: number;
  expiringCount: number;
};

export function HomeHeroCard({ readyCount, fridgeItemCount, expiringCount }: HomeHeroCardProps) {
  const styles = useThemedStyles(createStyles);
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.card, surfaceCard(colors, isDark)]}>
      <View style={styles.topRow}>
        <View style={[styles.iconTile, { backgroundColor: colors.surface2 }]}>
          <Ionicons name="leaf-outline" size={22} color={colors.orange} />
        </View>
        <View style={styles.topText}>
          <AppText variant="caption" muted>
            ทำได้เลยจากของในตู้
          </AppText>
          <AppText style={styles.bigNumber}>{readyCount} เมนู</AppText>
        </View>
      </View>
      <AppText variant="caption" muted style={styles.subline}>
        ตู้เย็น {fridgeItemCount} รายการ · ใกล้หมดอายุ {expiringCount}
      </AppText>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/(tabs)/picker')}
        style={styles.cta}
      >
        <AppText variant="label" style={{ color: colors.orange }}>
          วันนี้กินอะไรดี?
        </AppText>
        <Ionicons name="arrow-forward" size={16} color={colors.orange} />
      </Pressable>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      marginHorizontal: spacing.gutter,
      marginBottom: spacing.md,
      padding: spacing.gutter,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    iconTile: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    topText: { flex: 1, gap: 2 },
    bigNumber: {
      fontSize: 28,
      fontFamily: fonts.display,
      lineHeight: 38,
      color: colors.orange,
    },
    subline: {
      marginTop: spacing.sm,
    },
    cta: {
      marginTop: spacing.md,
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 4,
    },
  });