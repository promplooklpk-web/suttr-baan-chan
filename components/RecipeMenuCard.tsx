import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { LinkPressable } from '@/components/LinkPressable';
import { fonts, radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { categoryChipLabel, parseRecipeCalories } from '@/lib/recipeMedia';
import { formatMissingIngredients, fridgeProgressColor } from '@/lib/fridgeMatchDisplay';
import { photoUri, totalMinutes } from '@/lib/storage';
import type { RecipeFridgeMatch } from '@/types/fridge';
import type { Recipe } from '@/types/recipe';

type RecipeMenuCardProps = {
  recipe: Recipe;
  /** Full-width row with thumb left (Home default). */
  layout?: 'list' | 'grid' | 'compact';
  colorIndex?: number;
  fridgeMatch?: RecipeFridgeMatch | null;
  showFridgeSection?: boolean;
};

const LIST_THUMB = 116;

export function RecipeMenuCard({
  recipe,
  layout = 'list',
  colorIndex = 0,
  fridgeMatch,
  showFridgeSection = false,
}: RecipeMenuCardProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const uri = photoUri(recipe.photo?.path);
  const minutes = totalMinutes(recipe);
  const cal = parseRecipeCalories(recipe);
  const category = categoryChipLabel(recipe.category);
  const bg = colors.cardAccentTints[colorIndex % colors.cardAccentTints.length];
  const percent = fridgeMatch?.percent ?? 0;
  const showMatch = showFridgeSection && fridgeMatch != null;
  const isList = layout === 'list';
  const isCompact = layout === 'compact' || layout === 'grid';
  const cardStyle = StyleSheet.flatten([
    styles.card,
    isList && styles.cardList,
    isCompact && styles.cardCompact,
  ]);

  const imageBlock = (
    <View
      style={[
        isList ? styles.imageList : styles.imageGrid,
        { backgroundColor: bg },
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={styles.image} contentFit="cover" />
      ) : (
        <Ionicons name="restaurant" size={isList ? 32 : 40} color={colors.orange} />
      )}
      {recipe.isFavorite && (
        <View style={styles.favBadge}>
          <Ionicons name="heart" size={14} color={colors.orange} />
        </View>
      )}
    </View>
  );

  const primaryTag = recipe.tags?.[0];
  const tagLabel = primaryTag ? `#${primaryTag}` : category;

  const body = (
    <View style={isList ? styles.bodyList : styles.bodyGrid}>
      <AppText variant="label" numberOfLines={2} style={isList ? styles.titleList : styles.title}>
        {recipe.title}
      </AppText>
      <View style={styles.metaRow}>
        <Ionicons name="time-outline" size={13} color={colors.inkMuted} />
        <AppText variant="caption" muted>{minutes} น.</AppText>
        {cal != null && (
          <>
            <AppText variant="caption" muted> · </AppText>
            <Ionicons name="flame-outline" size={13} color={colors.inkMuted} />
            <AppText variant="caption" muted>{cal} kcal</AppText>
          </>
        )}
        <AppText variant="caption" muted numberOfLines={1}> · {tagLabel}</AppText>
      </View>
      {showMatch && (
        <View style={styles.matchBlock}>
          <View style={styles.matchLabelRow}>
            <AppText variant="caption" style={styles.matchLabel}>
              มีในตู้ {percent}%
            </AppText>
          </View>
          <View style={styles.progressBg}>
            <View
              style={[
                styles.progressFill,
                { width: `${percent}%`, backgroundColor: fridgeProgressColor(percent, colors) },
              ]}
            />
          </View>
          <AppText variant="caption" muted numberOfLines={1} style={styles.missingLine}>
            {formatMissingIngredients(fridgeMatch!.missing)}
          </AppText>
        </View>
      )}
    </View>
  );

  return (
    <Link href={`/recipe/${recipe.id}`} asChild>
      <LinkPressable style={cardStyle}>
        {imageBlock}
        {body}
      </LinkPressable>
    </Link>
  );
}

export function FridgeEmptyHintChip({ onPress }: { onPress?: () => void }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  return (
    <Pressable style={styles.hintChip} onPress={onPress}>
      <Ionicons name="snow-outline" size={16} color={colors.inkMuted} />
      <AppText variant="caption" muted>เพิ่มของในตู้เย็นเพื่อดู %</AppText>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  cardList: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: undefined,
    width: '100%',
    padding: spacing.sm,
    gap: spacing.md,
    overflow: 'visible',
  },
  cardCompact: {
    flex: 1,
    overflow: 'hidden',
  },
  imageGrid: {
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imageList: {
    width: LIST_THUMB,
    height: LIST_THUMB,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  favBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    padding: 6,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  bodyGrid: {
    padding: spacing.sm,
    paddingTop: spacing.md,
    gap: spacing.xs,
  },
  bodyList: {
    flex: 1,
    paddingRight: spacing.xs,
    justifyContent: 'center',
    gap: spacing.xs,
    minWidth: 0,
  },
  title: {
    fontFamily: fonts.semiBold,
    minHeight: 40,
  },
  titleList: {
    fontFamily: fonts.semiBold,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 2,
  },
  matchBlock: {
    marginTop: spacing.sm,
    gap: 4,
  },
  matchLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  matchLabel: {
    fontFamily: fonts.semiBold,
    color: colors.ink,
  },
  progressBg: {
    height: 5,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 5,
    borderRadius: 3,
  },
  missingLine: {
    fontSize: 11,
  },
  hintChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
