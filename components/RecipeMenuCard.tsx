import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { LinkPressable } from '@/components/LinkPressable';
import { PhotoGradientOverlay } from '@/components/PhotoGradientOverlay';
import { fonts, radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colorSchemes';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { CARD_RADIUS, matchProgressGlow, surfaceCard } from '@/lib/design';
import { categoryChipLabel, parseRecipeCalories } from '@/lib/recipeMedia';
import {
  formatMissingIngredients,
  fridgeProgressColor,
  matchPercentColor,
} from '@/lib/fridgeMatchDisplay';
import { useRecipes } from '@/context/RecipesContext';
import { photoUri, totalMinutes } from '@/lib/storage';
import type { RecipeFridgeMatch } from '@/types/fridge';
import type { Recipe } from '@/types/recipe';

type RecipeMenuCardProps = {
  recipe: Recipe;
  layout?: 'list' | 'grid' | 'compact';
  colorIndex?: number;
  fridgeMatch?: RecipeFridgeMatch | null;
  showFridgeSection?: boolean;
  testID?: string;
};

const LIST_THUMB = 72;
/** Minimum list card height (design ~84–92px); used in styles and layout tests */
export const RECIPE_LIST_CARD_MIN_HEIGHT = 96;

export function RecipeMenuCard({
  recipe,
  layout = 'list',
  colorIndex = 0,
  fridgeMatch,
  showFridgeSection = false,
  testID,
}: RecipeMenuCardProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const { toggleFavorite } = useRecipes();
  const uri = photoUri(recipe.photo?.path);
  const minutes = totalMinutes(recipe);
  const cal = parseRecipeCalories(recipe);
  const category = categoryChipLabel(recipe.category);
  const bg = colors.cardAccentTints[colorIndex % colors.cardAccentTints.length];
  const percent = fridgeMatch?.percent ?? 0;
  const showMatch = showFridgeSection && fridgeMatch != null;
  const isList = layout === 'list';
  const isCompact = layout === 'compact' || layout === 'grid';
  const progressColor = fridgeProgressColor(percent, colors);
  const percentColor = matchPercentColor(percent, colors);

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
        <>
          <Image source={{ uri }} style={styles.image} contentFit="cover" />
          {isCompact && <PhotoGradientOverlay variant="card" />}
        </>
      ) : (
        <Ionicons name="restaurant" size={isList ? 26 : 40} color={colors.orange} />
      )}
      <Pressable
        style={styles.heartBtn}
        accessibilityLabel="โปรด"
        onPress={(e) => {
          e?.stopPropagation?.();
          void toggleFavorite(recipe.id);
        }}
      >
        <Ionicons
          name={recipe.isFavorite ? 'heart' : 'heart-outline'}
          size={14}
          color={recipe.isFavorite ? colors.orange : colors.ink}
        />
      </Pressable>
    </View>
  );

  const primaryTag = recipe.tags?.[0];
  const tagLabel = primaryTag ? `#${primaryTag}` : category;

  const body = (
    <View style={isList ? styles.bodyList : styles.bodyGrid}>
      <View style={styles.titleRow}>
        <AppText
          variant="label"
          numberOfLines={2}
          style={[isList ? styles.titleList : styles.title, styles.titleFlex]}
        >
          {recipe.title}
        </AppText>
        {showMatch && (
          <AppText variant="label" style={[styles.percentBadge, { color: percentColor }]}>
            {percent}%
          </AppText>
        )}
      </View>
      <View style={styles.metaRow}>
        <Ionicons name="time-outline" size={12} color={colors.orange} />
        <AppText variant="caption" muted style={styles.metaText}>{minutes} น.</AppText>
        {cal != null && (
          <>
            <AppText variant="caption" muted> · </AppText>
            <Ionicons name="flame-outline" size={12} color={colors.orange} />
            <AppText variant="caption" muted style={styles.metaText}>{cal} kcal</AppText>
          </>
        )}
        {!isList && (
          <AppText variant="caption" muted numberOfLines={1}> · {tagLabel}</AppText>
        )}
      </View>
      {showMatch && (
        <View style={styles.matchBlock}>
          <View style={styles.progressBg}>
            <View
              style={[
                styles.progressFill,
                { width: `${percent}%`, backgroundColor: progressColor },
                percent >= 80 && matchProgressGlow(progressColor),
              ]}
            />
          </View>
          <AppText variant="caption" muted numberOfLines={1} style={styles.missingLine}>
            {percent >= 100
              ? 'มีครบทุกอย่าง · ทำเมนูนี้ได้เลย'
              : formatMissingIngredients(fridgeMatch!.missing)}
          </AppText>
          <AppText variant="caption" muted style={styles.fridgeCountLine}>
            ตรงกับของในตู้ {fridgeMatch!.haveCount}/{fridgeMatch!.totalCount}
          </AppText>
        </View>
      )}
    </View>
  );

  return (
    <Link href={`/recipe/${recipe.id}`} asChild>
      <LinkPressable style={cardStyle} testID={testID}>
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
      <Ionicons name="snow-outline" size={16} color={colors.orange} />
      <AppText variant="caption" muted>เพิ่มของในตู้เย็นเพื่อดู %</AppText>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    ...surfaceCard(colors),
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  cardList: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
    flexDirection: 'row',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    width: '100%',
    maxWidth: '100%',
    minHeight: RECIPE_LIST_CARD_MIN_HEIGHT,
    padding: 10,
    gap: spacing.sm,
    overflow: 'hidden',
  },
  cardCompact: {
    flex: 1,
    overflow: 'hidden',
    padding: 0,
  },
  imageGrid: {
    aspectRatio: 1,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    width: '100%',
  },
  imageList: {
    width: LIST_THUMB,
    height: LIST_THUMB,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
    flexGrow: 0,
  },
  image: {
    ...StyleSheet.absoluteFill,
  },
  heartBtn: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(14,13,12,0.55)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyGrid: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  bodyList: {
    flex: 1,
    flexShrink: 1,
    justifyContent: 'flex-start',
    gap: 3,
    minWidth: 0,
    minHeight: LIST_THUMB,
    paddingVertical: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  titleFlex: { flex: 1 },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 17,
    minHeight: 40,
  },
  titleList: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    lineHeight: 20,
  },
  percentBadge: {
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 22,
    flexShrink: 0,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 2,
  },
  metaText: {
    fontSize: 12,
  },
  matchBlock: {
    gap: 4,
    marginTop: 2,
  },
  missingLine: {
    fontSize: 11,
    lineHeight: 14,
  },
  fridgeCountLine: {
    fontSize: 10,
    lineHeight: 12,
    textAlign: 'right',
  },
  progressBg: {
    height: 3,
    backgroundColor: colors.surface2,
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
    borderRadius: CARD_RADIUS,
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
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
