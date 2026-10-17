import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { LinkPressable } from '@/components/LinkPressable';
import { FridgeMatchBadge } from '@/components/FridgeMatchBadge';
import { colors, radius, spacing } from '@/constants/theme';
import { photoUri, totalMinutes } from '@/lib/storage';
import type { Recipe } from '@/types/recipe';

const CARD_COLORS = ['#E8F5E9', '#FFF3CD', '#FFE8D6', '#E3F2FD', '#F3E5F5'];

type RecipeCardProps = {
  recipe: Recipe;
  variant?: 'grid' | 'compact';
  colorIndex?: number;
  /** Omit or undefined to hide; 0 hides badge */
  fridgeMatchPercent?: number;
};

export function RecipeCard({
  recipe,
  variant = 'grid',
  colorIndex = 0,
  fridgeMatchPercent,
}: RecipeCardProps) {
  const uri = photoUri(recipe.photo?.path);
  const minutes = totalMinutes(recipe);
  const bg = CARD_COLORS[colorIndex % CARD_COLORS.length];
  const showFridgeBadge = fridgeMatchPercent != null && fridgeMatchPercent > 0;

  if (variant === 'compact') {
    return (
      <Link href={`/recipe/${recipe.id}`} asChild>
        <LinkPressable style={styles.compactCard}>
          <View style={[styles.compactThumb, { backgroundColor: bg }]}>
            {uri ? (
              <Image source={{ uri }} style={styles.compactImage} contentFit="cover" />
            ) : (
              <Ionicons name="restaurant" size={28} color={colors.orange} />
            )}
            {showFridgeBadge && <FridgeMatchBadge percent={fridgeMatchPercent} compact />}
          </View>
          <AppText variant="label" numberOfLines={2} style={styles.compactTitle}>
            {recipe.title}
          </AppText>
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={14} color={colors.inkMuted} />
            <AppText variant="caption" muted>{minutes} น.</AppText>
            {recipe.rating != null && (
              <>
                <Ionicons name="star" size={14} color={colors.star} style={styles.starIcon} />
                <AppText variant="caption" muted>{recipe.rating.toFixed(1)}</AppText>
              </>
            )}
          </View>
        </LinkPressable>
      </Link>
    );
  }

  return (
    <Link href={`/recipe/${recipe.id}`} asChild>
      <LinkPressable style={styles.gridCard}>
        <View style={[styles.gridImageWrap, { backgroundColor: bg }]}>
          {uri ? (
            <Image source={{ uri }} style={styles.gridImage} contentFit="cover" />
          ) : (
            <Ionicons name="restaurant" size={40} color={colors.orange} />
          )}
          {showFridgeBadge && <FridgeMatchBadge percent={fridgeMatchPercent} />}
          {recipe.isFavorite && (
            <View style={styles.favBadge}>
              <Ionicons name="heart" size={14} color={colors.orange} />
            </View>
          )}
        </View>
        <AppText variant="label" numberOfLines={2} style={styles.gridTitle}>
          {recipe.title}
        </AppText>
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={14} color={colors.inkMuted} />
          <AppText variant="caption" muted>{minutes} น.</AppText>
          {recipe.rating != null && (
            <>
              <Ionicons name="star" size={14} color={colors.star} style={styles.starIcon} />
              <AppText variant="caption" muted>{recipe.rating.toFixed(1)}</AppText>
            </>
          )}
        </View>
      </LinkPressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  gridCard: {
    flex: 1,
    marginBottom: spacing.md,
  },
  gridImageWrap: {
    aspectRatio: 1,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  gridImage: {
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
  },
  gridTitle: {
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starIcon: {
    marginLeft: spacing.sm,
  },
  compactCard: {
    width: 140,
    marginRight: spacing.md,
  },
  compactThumb: {
    width: 140,
    height: 140,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  compactImage: {
    width: '100%',
    height: '100%',
  },
  compactTitle: {
    marginBottom: 4,
  },
});
