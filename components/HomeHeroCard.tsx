import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Glass } from '@/components/Glass';
import { PhotoGlassHero } from '@/components/PhotoGlassHero';
import { recipeCoverUri } from '@/lib/recipeMedia';
import { fonts, radius, spacing } from '@/constants/theme';
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
  const uri = coverRecipe ? recipeCoverUri(coverRecipe) : null;

  return (
    <PhotoGlassHero
      imageSource={uri ? { uri } : null}
      style={styles.marginH}
      panelLayout="inset-left"
      topRight={
        hasPerfectMatch ? (
          <Glass variant="chrome" borderRadius={radius.pill} intensity={50} style={styles.matchChipGlass}>
            <AppText variant="micro" style={[styles.matchChipText, { color: colors.ink }]}>
              ✓ มีครบ 100%
            </AppText>
          </Glass>
        ) : undefined
      }
    >
      <AppText variant="caption" muted>
        ทำได้เลยจากของในตู้
      </AppText>
      <View style={styles.countRow}>
        <AppText style={[styles.bigNumber, { color: tokens.accentText }]}>{readyCount}</AppText>
        <AppText style={[styles.menuLabel, { color: colors.ink }]}>เมนู</AppText>
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
    </PhotoGlassHero>
  );
}

const createStyles = () =>
  StyleSheet.create({
    marginH: { marginHorizontal: spacing.gutter },
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
    matchChipGlass: {
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    matchChipText: {
      fontFamily: fonts.semiBold,
    },
  });