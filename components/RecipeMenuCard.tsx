import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { LinkPressable } from '@/components/LinkPressable';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { categoryChipLabel, parseRecipeCalories } from '@/lib/recipeMedia';
import { formatMissingIngredients, fridgeProgressColor } from '@/lib/fridgeMatchDisplay';
import { photoUri, totalMinutes } from '@/lib/storage';
import type { RecipeFridgeMatch } from '@/types/fridge';
import type { Recipe } from '@/types/recipe';

const CARD_COLORS = ['#E8F5E9', '#FFF3CD', '#FFE8D6', '#E3F2FD', '#F3E5F5'];

type RecipeMenuCardProps = {
  recipe: Recipe;
  layout?: 'grid' | 'list';
  colorIndex?: number;
  fridgeMatch?: RecipeFridgeMatch | null;
  showFridgeSection?: boolean;
};

export function RecipeMenuCard({
  recipe,
  layout = 'grid',
  colorIndex = 0,
  fridgeMatch,
  showFridgeSection = false,
}: RecipeMenuCardProps) {
  const uri = photoUri(recipe.photo?.path);
  const minutes = totalMinutes(recipe);
  const cal = parseRecipeCalories(recipe);
  const category = categoryChipLabel(recipe.category);
  const bg = CARD_COLORS[colorIndex % CARD_COLORS.length];
  const percent = fridgeMatch?.percent ?? 0;
  const showMatch = showFridgeSection && fridgeMatch != null;
  const cardStyle = StyleSheet.flatten([styles.card, layout === 'list' && styles.cardList]);

  const imageBlock = (
    <View style={[layout === 'grid' ? styles.imageGrid : styles.imageList, { backgroundColor: bg }]}>
      {uri ? (
        <Image source={{ uri }} style={styles.image} contentFit="cover" />
      ) : (
        <Ionicons name="restaurant" size={layout === 'list' ? 32 : 40} color={colors.orange} />
      )}
      {recipe.isFavorite && (
        <View style={styles.favBadge}>
          <Ionicons name="heart" size={14} color={colors.orange} />
        </View>
      )}
    </View>
  );

  const body = (
    <View style={layout === 'list' ? styles.bodyList : styles.bodyGrid}>
      <AppText variant="label" numberOfLines={2} style={styles.title}>
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
        <AppText variant="caption" muted numberOfLines={1}> · {category}</AppText>
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
                { width: `${percent}%`, backgroundColor: fridgeProgressColor(percent) },
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
        {layout === 'list' ? (
          <>
            {imageBlock}
            {body}
          </>
        ) : (
          <>
            {imageBlock}
            {body}
          </>
        )}
      </LinkPressable>
    </Link>
  );
}

export function FridgeEmptyHintChip({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable style={styles.hintChip} onPress={onPress}>
      <Ionicons name="snow-outline" size={16} color={colors.inkMuted} />
      <AppText variant="caption" muted>เพิ่มของในตู้เย็นเพื่อดู %</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.md,
    shadowColor: '#3A2A20',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  cardList: {
    flexDirection: 'row',
    alignItems: 'stretch',
    flex: undefined,
    width: '100%',
  },
  imageGrid: {
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imageList: {
    width: 108,
    minHeight: 108,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
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
    shadowColor: '#3A2A20',
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
    padding: spacing.md,
    justifyContent: 'center',
    gap: spacing.xs,
  },
  title: {
    fontFamily: fonts.semiBold,
    minHeight: 40,
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
