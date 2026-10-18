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
import { formatMissingIngredients, fridgeProgressColor } from '@/lib/fridgeMatchDisplay';
import { photoUri, totalMinutes } from '@/lib/storage';
import type { RecipeFridgeMatch } from '@/types/fridge';
import type { Recipe } from '@/types/recipe';

type RecipeMenuCardProps = {
  recipe: Recipe;
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
  const progressColor = fridgeProgressColor(percent, colors);
  const percentColor =
    percent >= 100 ? colors.cardGreen : percent >= 50 ? colors.orange : colors.cardYellow;

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
        <Ionicons name="restaurant" size={isList ? 32 : 40} color={colors.orange} />
      )}
      <Pressable style={styles.heartBtn} accessibilityLabel="โปรด">
        <Ionicons
          name={recipe.isFavorite ? 'heart' : 'heart-outline'}
          size={16}
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
        <AppText variant="label" numberOfLines={2} style={[isList ? styles.titleList : styles.title, styles.titleFlex]}>
          {recipe.title}
        </AppText>
        {showMatch && (
          <AppText variant="label" style={[styles.percentBadge, { color: percentColor }]}>
            {percent}%
          </AppText>
        )}
      </View>
      <View style={styles.metaRow}>
        <Ionicons name="time-outline" size={13} color={colors.orange} />
        <AppText variant="caption" muted>{minutes} น.</AppText>
        {cal != null && (
          <>
            <AppText variant="caption" muted> · </AppText>
            <Ionicons name="flame-outline" size={13} color={colors.orange} />
            <AppText variant="caption" muted>{cal} kcal</AppText>
          </>
        )}
        {!isList && (
          <AppText variant="caption" muted numberOfLines={1}> · {tagLabel}</AppText>
        )}
      </View>
      {showMatch && (
        <View style={styles.matchBlock}>
          <View style={styles.matchLabelRow}>
            <AppText variant="caption" style={[styles.matchLabel, { color: percentColor }]}>
              {percent >= 100 ? 'มีครบทุกอย่าง' : formatMissingIngredients(fridgeMatch!.missing)}
            </AppText>
            <AppText variant="caption" muted>
              {fridgeMatch!.haveCount}/{fridgeMatch!.totalCount}
            </AppText>
          </View>
          <View style={styles.progressBg}>
            <View
              style={[
                styles.progressFill,
                { width: `${percent}%`, backgroundColor: progressColor },
                percent >= 100 && matchProgressGlow(colors.cardGreen),
              ]}
            />
          </View>
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
      <Ionicons name="snow-outline" size={16} color={colors.orange} />
      <AppText variant="caption" muted>เพิ่มของในตู้เย็นเพื่อดู %</AppText>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    flex: 1,
    ...surfaceCard(colors),
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  cardList: {
    flex: 0,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
    alignSelf: 'stretch',
    width: '100%',
    maxWidth: '100%',
    padding: spacing.md,
    gap: spacing.md,
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
    borderRadius: radius.md,
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
    top: spacing.sm,
    left: spacing.sm,
    width: 30,
    height: 30,
    borderRadius: 15,
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
    justifyContent: 'center',
    gap: spacing.xs,
    minWidth: 0,
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
    fontSize: 17,
    lineHeight: 24,
  },
  percentBadge: {
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 2,
  },
  matchBlock: {
    marginTop: spacing.xs,
    gap: 6,
  },
  matchLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  matchLabel: {
    fontFamily: fonts.medium,
    flex: 1,
  },
  progressBg: {
    height: 6,
    backgroundColor: colors.surface2,
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
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
