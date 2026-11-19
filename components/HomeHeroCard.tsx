import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Glass } from '@/components/Glass';
import { RecipeCoverImage } from '@/components/RecipeCoverImage';
import { fonts, radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import type { Recipe } from '@/types/recipe';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';

type HomeHeroCardProps = {
  readyCount: number;
  fridgeItemCount: number;
  expiringCount: number;
  coverRecipe?: Recipe | null;
  hasPerfectMatch?: boolean;
};

export function HomeHeroCard({
  readyCount,
  fridgeItemCount,
  expiringCount,
  coverRecipe,
  hasPerfectMatch,
}: HomeHeroCardProps) {
  const styles = useThemedStyles(createStyles);
  const { colors, tokens } = useTheme();

  return (
    <View style={styles.heroShell}>
      {coverRecipe ? (
        <RecipeCoverImage recipe={coverRecipe} style={styles.heroPhoto} rounded={0} />
      ) : (
        <View style={[styles.heroPhoto, { backgroundColor: colors.imagePlaceholder }]} />
      )}
      <View style={styles.glassPanelWrap} pointerEvents="box-none">
        <Glass variant="card" borderRadius={20} intensity={56} style={styles.glassPanel}>
          <View style={styles.panelInner}>
            <AppText variant="caption" muted>
              ทำได้เลยจากของในตู้
            </AppText>
            <View style={styles.countRow}>
              <AppText style={[styles.bigNumber, { color: tokens.accentText }]}>{readyCount}</AppText>
              <AppText style={styles.menuLabel}>เมนู</AppText>
            </View>
            <AppText variant="caption" muted style={styles.subline}>
              ตู้เย็น {fridgeItemCount} รายการ · ใกล้หมดอายุ {expiringCount}
            </AppText>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/(tabs)/picker')}
              style={[styles.ctaPill, { backgroundColor: colors.orange }]}
            >
              <Ionicons name="shuffle-outline" size={16} color={colors.onAccent} />
              <AppText variant="label" style={{ color: colors.onAccent }}>
                วันนี้กินอะไรดี?
              </AppText>
            </Pressable>
          </View>
        </Glass>
      </View>
      {hasPerfectMatch ? (
        <View style={styles.matchChip} pointerEvents="none">
          <Glass variant="chrome" borderRadius={radius.pill} intensity={50} style={styles.matchChipGlass}>
            <AppText variant="micro" style={styles.matchChipText}>
              ✓ มีครบ 100%
            </AppText>
          </Glass>
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    heroShell: {
      marginHorizontal: spacing.gutter,
      marginBottom: spacing.md,
      height: 196,
      borderRadius: 26,
      overflow: 'hidden',
      position: 'relative',
    },
    heroPhoto: {
      ...StyleSheet.absoluteFill,
    },
    glassPanelWrap: {
      position: 'absolute',
      left: 8,
      top: 8,
      bottom: 8,
      width: '58%',
      maxWidth: 226,
    },
    glassPanel: {
      flex: 1,
    },
    panelInner: {
      flex: 1,
      padding: spacing.md,
      justifyContent: 'center',
      gap: 4,
    },
    countRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 6,
    },
    bigNumber: {
      fontSize: 36,
      fontFamily: fonts.display,
      lineHeight: 42,
    },
    menuLabel: {
      fontSize: 22,
      fontFamily: fonts.display,
      lineHeight: 30,
      color: colors.ink,
    },
    subline: {
      marginTop: 2,
    },
    ctaPill: {
      marginTop: spacing.sm,
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: radius.pill,
    },
    matchChip: {
      position: 'absolute',
      top: 12,
      right: 12,
    },
    matchChipGlass: {
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    matchChipText: {
      fontFamily: fonts.semiBold,
      color: colors.ink,
    },
  });